# LexOps Sovereign OS v2026 - Terraform GCP Sovereign Infrastructure Spec
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

variable "gcp_project_id" {
  type        = string
  description = "Target Sovereign GCP Project ID"
  default     = "lexops-prod-2026-sa"
}

variable "gcp_region" {
  type        = string
  description = "Target Sovereign GCP Region (KSA Primary: me-central1 Riyadh / me-west1 Jeddah)"
  default     = "me-central1"
}

# 1. Cloud SQL PostgreSQL Instance (Sovereign Database)
resource "google_sql_database_instance" "sovereign_db_instance" {
  name             = "lexops-db-instance"
  database_version = "POSTGRES_15"
  region           = var.gcp_region

  settings {
    tier = "db-custom-2-7680"
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.sovereign_vpc.id
    }
    database_flags {
      name  = "cloudsql.enable_pgcrypto"
      value = "on"
    }
    backup_configuration {
      enabled    = true
      start_time = "02:00"
    }
  }
}

resource "google_sql_database" "lexops_db" {
  name     = "lexops_truth_trail"
  instance = google_sql_database_instance.sovereign_db_instance.name
}

# 2. VPC Network & Private Access
resource "google_compute_network" "sovereign_vpc" {
  name                    = "lexops-sovereign-vpc"
  auto_create_subnetworks = true
}

# 3. Service Accounts & IAM Binding
resource "google_service_account" "cloudrun_sa" {
  account_id   = "sa-lexops-cloudrun-runner"
  display_name = "Cloud Run LexOps App Runner SA"
}

resource "google_service_account" "c9_ledger_sa" {
  account_id   = "sa-lexops-c9-ledger-writer"
  display_name = "C9 Ledger Immutable Writer SA"
}

resource "google_project_iam_member" "secret_accessor" {
  project = var.gcp_project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

# 4. Secret Manager References
resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "GEMINI_API_KEY_SECRET_REF"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "db_url" {
  secret_id = "DATABASE_URL_SECRET_REF"
  replication {
    auto {}
  }
}

# 5. Cloud Run Service Deployment
resource "google_cloud_run_v2_service" "lexops_core_service" {
  name     = "lexops-core-app"
  location = var.gcp_region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloudrun_sa.email

    containers {
      image = "gcr.io/${var.gcp_project_id}/lexops-core:v2026"

      ports {
        container_port = 3000
      }

      env {
        name = "GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.gemini_api_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_url.secret_id
            version = "latest"
          }
        }
      }
    }
  }
}

# 6. Pub/Sub Channels for Audit Events
resource "google_pubsub_topic" "c9_ledger_events" {
  name = "c9-ledger-audit-events-topic"
}

resource "google_pubsub_subscription" "c9_ledger_sub" {
  name  = "c9-ledger-audit-sub"
  topic = google_pubsub_topic.c9_ledger_events.name
}
