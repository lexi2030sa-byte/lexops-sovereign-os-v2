# Technical Handover 2026 Document (TECHNICAL_HANDOVER_2026.md)
**LexOps Sovereign OS v2026 — Sovereign Architecture & Handover Report**  
*Release Timestamp: 2026-08-23T00:30:00+03:00* | *Version Tag: v2026.2-STABLE-SOVEREIGN-FIRESTORE*  
*Target Jurisdiction: Kingdom of Saudi Arabia (KSA)*

---

## ⚠️ تنويه تصحيحي هام - الواقع التشغيلي الفعلي (2026-08-23)

**قاعدة البيانات التشغيلية الحالية:** Google Cloud Firestore (Datastore Mode)  
**حالة PostgreSQL:** موثقة كخطة مستقبلية للتوسع - غير منشورة حالياً في الإنتاج  
**المراجعة النشطة:** `lexops-sovereign-os-00016-rbt` (تستقبل 100% من الحركة)  
**أحدث مراجعة:** `lexops-sovereign-os-00021-cfq` (متقاعدة - احتياطية)  
**حساب الخدمة الفعلي:** `lexops-runner@lexops-prod-2026-sa.iam.gserviceaccount.com`  
**قاعدة البيانات الفعلية:** Firestore (عبر `src/lib/firebase-admin.ts`)

*Release Timestamp: 2026-08-12T16:42:13-07:00* | *Version Tag: v2026.1-STABLE-SOVEREIGN*  
*Target Jurisdiction: Kingdom of Saudi Arabia (KSA)*

## 1. Project Repository File Tree

```
/
├── .env.example                                # Environment Variable Schema Definition (No Secrets)
├── .gitignore                                  # Git exclusion paths
├── Dockerfile                                  # Multi-stage production Docker container definition
├── docker-compose.yml                          # Local Docker stack with PostgreSQL 16 & LexOps App
├── openapi.yaml                                # OpenAPI 3.0 API Specification
├── package.json                                # Node.js project manifest & scripts
├── package-lock.json                           # Locked dependency tree
├── security_spec.md                            # Adversarial Red-Team Spec & Dirty Dozen Test Cases
├── server.ts                                   # Full-Stack Express API Server & LEXI AI Engine Gateway
├── tsconfig.json                               # TypeScript compiler configuration
├── vite.config.ts                              # Vite frontend bundler config
├── lexops_landing_cosmic.html                  # Cosmic Landing Page
├── metadata.json                               # Platform metadata & permissions
├── firestore.rules                             # Firestore Security Rules for Entity Isolation
├── firebase-blueprint.json                     # Firebase schema & collection blueprints
├── firebase-applet-config.json                 # Firebase applet project configuration
├── app/
│   └── sovereign/
│       └── sade/                               # SADE Sovereign Admin & Dashboard Engines
├── migrations/
│   └── 0001_c9_ledger_block_zero.sql           # C9 Ledger Schema, Block Zero Genesis, HMAC & Triggers
├── terraform/
│   └── main.tf                                 # Infrastructure as Code (GCP Cloud Run, SQL, PubSub, IAM)
├── tests/
│   ├── c9_ledger.test.ts                       # C9 Ledger & Immutability test suite
│   └── sovereignty_rules.test.ts              # Sovereignty, Isolation, HILAP & Security test suite
├── src/
│   ├── App.tsx                                 # Main Frontend Application Shell & Module Router
│   ├── main.tsx                                # React 19 Entry Point
│   ├── index.css                               # Global Tailwind CSS Styles
│   ├── theme.css                               # Sovereign Theme Token Variables
│   ├── data.ts                                 # Seed Data & Entity Datasets
│   ├── locales.ts                              # Arabic/English i18n Dictionary
│   ├── db/
│   │   ├── drizzle.config.ts                   # Drizzle ORM Configuration
│   │   ├── index.ts                            # PostgreSQL connection pool
│   │   └── schema.ts                           # Drizzle Schema Definitions (users, lexi_decisions)
│   ├── lexi/
│   │   ├── policy/
│   │   │   └── enforcer.ts                     # LEXI Sovereign Policy Enforcer & Risk Gate
│   │   └── prompts/
│   │       ├── core.prompt                     # Core System Prompt Document
│   │       └── core.ts                         # Locked System Prompt Template
│   ├── lib/
│   │   ├── firebase.ts                         # Client-side Firebase App Initialization
│   │   ├── firebase-admin.ts                   # Server-side Firebase Admin SDK
│   │   ├── lexi.ts                             # LEXI Helper Client Utilities
│   │   └── sovereignTemplate.ts                # Sovereign Template Engine
│   ├── middleware/
│   │   └── firestoreScope.ts                   # Entity Scoping Middleware (Scope Guard)
│   └── components/
│       ├── SovereignFounder.tsx                # Founder View Panel
│       ├── SovereignOrgAdmin.tsx               # Organization Admin View Panel
│       ├── SovereignEmployee.tsx               # Employee View Panel
│       ├── SovereignFreelancer.tsx             # Freelancer/Individual View Panel
│       ├── SovereignGovernment.tsx             # Government Inspector View Panel
│       ├── SovereignOnboarding.tsx             # Onboarding Wizard Panel
│       ├── SovereignUserGuide.tsx              # Interactive User Guide
│       ├── SovereignClipboardVault.tsx         # Sovereign Vault
│       ├── SovereignMap.tsx                    # GPS Geofencing Map Component
│       ├── LexiOperationalProtocol.tsx          # LEXI 5-Stage Protocol
│       ├── LexiVideoGenerator.tsx              # Veo 3 Pro Video Proof Generator
│       ├── SovereignAutoDocumentationEngine.tsx # Auto Document Generator
│       ├── BranchWorkforcePanel.tsx            # Branch & Workforce Management
│       ├── EntityManagerBranchesView.tsx       # Entity Manager Branches View
│       └── CosmicBackground.tsx                # Cosmic UI Canvas Particle Renderer
```

---

## 2. Expected Cloud Run Services & Target GCP Regions

### Cloud Run Services
1. `lexops-core-app`: Primary Express API + Vite Frontend monolith container on Cloud Run (Port 3000).
2. `lexops-c9-ledger-service`: Microservice dedicated to continuous audit validation and `validateChain` verification.
3. `lexops-govlink-bridge`: Secure outbound proxy for government integrations (Qiwa, Muqeem, Balady, Najiz, ZATCA).

### Target GCP Regions
- **Primary Region:** `me-central1` (Riyadh, KSA) — Primary sovereign data residency compliance.
- **Secondary / DR Region:** `me-west1` (Jeddah, KSA) — High-Availability Disaster Recovery replication.

---

## 3. Service Accounts & Assigned Permissions (الفعلي)

| Service Account Email | Role / Purpose | Assigned IAM Roles (فعلياً) |
|---|---|---|
| `lexops-runner@lexops-prod-2026-sa.iam.gserviceaccount.com` | Primary Cloud Run Execution Engine | `roles/datastore.user`, `roles/secretmanager.secretAccessor` |
| `firebase-adminsdk-fbsvc@lexops-prod-2026-sa.iam.gserviceaccount.com` | Firebase Admin SDK | Firebase Services Access |
| `vertex-express@lexops-prod-2026-sa.iam.gserviceaccount.com` | Vertex AI Express | `roles/aiplatform.expressUser` |
| `ais-gemini-key-0bec81c940994c6@831884144386.iam.gserviceaccount.com` | Gemini API Key | Gemini API Access |

**ملاحظة:** `sa-lexops-cloudrun-runner@lexops-sovereign-2026.iam.gserviceaccount.com` المذكور سابقاً تم استبداله بـ `lexops-runner@lexops-prod-2026-sa.iam.gserviceaccount.com`.


All sensitive credentials and database connection strings are injected dynamically at runtime via GCP Secret Manager references:

- `GEMINI_API_KEY_SECRET_REF`: API Key for Google Gemini 3.5 Flash / Gemini 1.5 Pro AI services.
- `DATABASE_URL_SECRET_REF`: Connection string for PostgreSQL Cloud SQL instance (`lexops_sovereign_db`).
- `GMAIL_CLIENT_ID_SECRET_REF`: OAuth2 Client ID for Nodemailer Gmail API email dispatch.
- `GMAIL_CLIENT_SECRET_SECRET_REF`: OAuth2 Client Secret for Nodemailer Gmail API email dispatch.
- `GMAIL_REFRESH_TOKEN_SECRET_REF`: OAuth2 Refresh Token for automated email notification dispatch.
- `FIREBASE_SERVICE_ACCOUNT_KEY_SECRET_REF`: Encrypted JSON key for Firebase Admin SDK initialization.
- `SOVEREIGN_C9_HMAC_KEY_SECRET_REF`: Secret key for HMAC-SHA256 hash generation on C9 Ledger blocks.

---

## 4. Secret Manager Reference Names (الفعلي)

- `gemini-api-key`: API Key for Google Gemini AI services. ✅ نشط

- `FOUNDATION_DATA`: Foundation configuration data. ✅ موجود

- `OAUTH_CLIENT_ID`: OAuth2 Client ID for Gmail API. ✅ موجود

- `OAUTH_CLIENT_SECRET`: OAuth2 Client Secret for Gmail API. ✅ موجود



**ملاحظة:** `DATABASE_URL_SECRET_REF` غير موجود حالياً لأن PostgreSQL غير منشور في الإنتاج.

## 5. Database Architecture (الواقع الفعلي)

### Primary Database (الإنتاج)

- **Engine:** Google Cloud Firestore (Datastore Mode)

- **Client Library:** Firebase Admin SDK (`firebase-admin`)

- **Initialization File:** `src/lib/firebase-admin.ts`

- **Project ID:** من `firebase-applet-config.json`



### Collections النشطة في Firestore:

1. **`serverEntities`**: سجل المنشآت والجهات

2. **`serverUsers`**: سجل المستخدمين

3. **`citations`**: المخالفات والاستشهادات

4. **`lexi_decisions`**: قرارات LEXI AI

5. **`c9Incidents`**: أحداث C9 Ledger

6. **`emailLogs`**: سجلات البريد الإلكتروني



### Secondary Database (للتطوير المحلي فقط)

- **Engine:** PostgreSQL 16 (عبر docker-compose)

- **ORM:** Drizzle ORM

- **Migration File:** `/migrations/0001_c9_ledger_block_zero.sql`

- **Status:** غير مستخدم في الإنتاج - مخطط للترحيل المستقبلي



### C9 Ledger Implementation (الواقع الفعلي)

- **التخزين الحالي:** Firestore + In-Memory

- **آلية التشفير:** HMAC-SHA256

- **Block Zero:** مخزن في الكود (`server.ts`) و Firestore

- **الترحيل المستقبلي:** إلى PostgreSQL مع triggers الموثقة


### 1. Health & Connectivity Check
- **Endpoint:** `GET /api/health`
- **Auth:** Public
- **Request Headers:** None
- **Response:** `{ "status": "ok", "time": "2026-08-12T16:00:00.000Z" }`
- **Error Model:** `500 Internal Server Error`

### 2. Live Gemini Connectivity Diagnostic
- **Endpoint:** `GET /api/gemini-check`
- **Auth:** Public
- **Request Headers:** None
- **Response:** `{ "success": true }` or `{ "success": false, "error": "depleted", "message": "..." }`

### 3. Entity Integrity Scan & Isolation Guard
- **Endpoint:** `GET /api/entities/integrity-check`
- **Auth:** User ID Header (`User-ID: USR-001`)
- **Request Headers:** `user-id`, `x-user-id`
- **Response:** `{ "status": "compliant" | "violated", "issues": [], "entities": [...], "users": [...], "incidents": [...] }`
- **Error Model:** `403 Forbidden` if cross-tenant breach detected; `400 Bad Request` if isolated due to data overlap.

### 4. Fetch Current Entity Record
- **Endpoint:** `GET /api/entities/current`
- **Auth:** User ID Header / Query Param (`?userId=USR-001`)
- **Response:** Single `ServerEntity` object `{ id, name, crNumber, email, sector, tier, status }`
- **Error Model:** `400 Bad Request` if entity is isolated; `403 Forbidden` on unauthorized request; `404 Not Found`.

### 5. Document-Level Firestore Scoped Query
- **Endpoint:** `POST /api/firestore/query`
- **Auth:** Scoped Middleware (`enforceFirestoreScope`)
- **Request Headers:** `Authorization` or user context headers
- **Request Body:** `{ "collectionName": "citations", "where": [["type", "==", "MHRSD"]], "limit": 50 }`
- **Response:** `{ "success": true, "count": 1, "scopeEnforced": "ORG-01", "data": [...] }`
- **Error Model:** `403 Forbidden` if user attempts to query data from another entity.

### 6. Document-Level Firestore Scoped Write
- **Endpoint:** `POST /api/firestore/write`
- **Auth:** Scoped Middleware (`enforceFirestoreScope`)
- **Request Body:** `{ "collectionName": "citations", "docId": "CIT-1001", "data": { ... } }`
- **Response:** `{ "success": true, "id": "CIT-1001", "scopeEnforced": "ORG-01" }`
- **Error Model:** `403 Forbidden` if writing to an entity outside user scope.

### 7. Generate Sovereign Objection Document via LEXI AI
- **Endpoint:** `POST /api/agent/generate-objection`
- **Auth:** Session Role
- **Request Body:** `{ "violationText": "...", "grounds": "...", "userRole": "orgadmin" }`
- **Response:** `{ "text": "# [اعتراض رسمي سيادي...]" }`

### 8. Multimodal Document & Visual Risk Analyst (OCR + Visual Audit)
- **Endpoint:** `POST /api/agent/analyze-image`
- **Auth:** Session
- **Request Body:** `{ "imageBase64": "...", "mimeType": "image/jpeg", "prompt": "..." }`
- **Response:** `{ "text": "### تقرير الفحص البصري للمستند..." }`

### 9. Automated Email Dispatch Service
- **Endpoint:** `POST /api/emailer/send`
- **Auth:** Admin Session
- **Request Body:** `{ "type": "violation", "to": "emp@raedlog.sa", "data": { "violationId": "LEX-2026-N90", "employeeName": "أحمد" } }`
- **Response:** `{ "success": true, "log": { "id": "EML-102", "status": "delivered" | "simulated" } }`

---

## 6. Endpoints Catalog & Specifications (بدون تغيير جوهري)



جميع الـ Endpoints تعمل كما هو موثق سابقاً، مع ملاحظة أن قاعدة البيانات المستخدمة هي Firestore وليست PostgreSQL.



### 1. Health & Connectivity Check

- **Endpoint:** `GET /api/health`

- **Auth:** Public (محمي بـ IAP)



### 2. Live Gemini Connectivity Diagnostic

- **Endpoint:** `GET /api/gemini-check`

- **Auth:** Public (محمي بـ IAP)



### 3. Entity Integrity Scan & Isolation Guard

- **Endpoint:** `GET /api/entities/integrity-check`

- **Database:** Firestore (`serverEntities`, `serverUsers`)



### 4. Fetch Current Entity Record

- **Endpoint:** `GET /api/entities/current`

- **Database:** Firestore (`serverEntities`)



### 5. Document-Level Firestore Scoped Query

- **Endpoint:** `POST /api/firestore/query`

- **Middleware:** `enforceFirestoreScope`



### 6. Document-Level Firestore Scoped Write

- **Endpoint:** `POST /api/firestore/write`

- **Middleware:** `enforceFirestoreScope`



### 7. Generate Sovereign Objection Document via LEXI AI

- **Endpoint:** `POST /api/agent/generate-objection`

- **AI:** Gemini API



### 8. Multimodal Document & Visual Risk Analyst

- **Endpoint:** `POST /api/agent/analyze-image`

- **AI:** Gemini Multimodal API



### 9. Automated Email Dispatch Service

- **Endpoint:** `POST /api/emailer/send`

- **Email:** Nodemailer (Gmail OAuth2 / SMTP)

## 7. Event Catalog for C9 Ledger

The C9 Immutable Ledger records the following canonical event types:

1. `SYSTEM_PULSE_GENESIS`: Initial Genesis Block Zero instantiation.
2. `LEXOPS_INTEGRITY_ISOLATION_V3`: Entity isolated automatically due to commercial registration, email, or user mapping clash.
3. `LEXOPS_UNAUTHORIZED_ENTITY_BREACH`: Security incident recorded when a user attempts cross-entity data access.
4. `CITATION_ISSUED`: Compliance violation citation issued by government inspector or system engine.
5. `OBJECTION_FILED`: Formal legal objection or appeal filed against a citation.
6. `HILAP_HUMAN_OVERRIDE`: Human-in-the-Loop decision review triggered due to confidence score < 80%.
7. `KILL_SWITCH_ENGAGED`: Sovereign System Master Kill Switch engaged by Founder role.

---

## 8. Pub/Sub Topics & Subscriptions

- **Topics:**
  - `c9-ledger-audit-events-topic`: Real-time streaming channel for all immutable ledger events.
  - `govlink-notifications-topic`: Dispatch channel for external government API webhook notifications.
- **Subscriptions:**
  - `c9-ledger-audit-sub`: Subscriber pulling ledger events for long-term archiving and real-time monitoring.
  - `govlink-notifications-sub`: Subscriber processing outgoing compliance sync tasks.

---

## 9. GovLink Connectors Integration Status

| Connector Name | Ministry / Authority | Purpose | Integration Status |
|---|---|---|---|
| **Qiwa (قوى)** | Ministry of Human Resources (MHRSD) | Labor contracts & Saudization compliance | `READY` (Simulated API + Real Schema Payload) |
| **Muqeem (مقيم)** | General Directorate of Passports | Expat worker visa & iqama verification | `READY` (Simulated API + Real Schema Payload) |
| **Balady (بلدي)** | Ministry of Municipalities & Housing | Commercial licenses & health certificates | `READY` (Simulated API + Real Schema Payload) |
| **Najiz (ناجز)** | Ministry of Justice | Legal powers of attorney & dispute filings | `IN_PROGRESS` (Schema ready, API mock) |
| **ZATCA (زكاتك)** | Zakat, Tax and Customs Authority | E-invoicing & tax clearance | `READY` (Simulated API + Real Schema Payload) |
| **GOSI (التأمينات)** | General Organization for Social Insurance | Wage protection system (WPS) sync | `READY` (Simulated API + Real Schema Payload) |
| **SDAIA / E-Taawoth** | Saudi Data & AI Authority | National Data Governance & NCA compliance | `READY` (Compliant with Data Isolation) |

---

## 10. Executed Test Suite & Results

All tests have been executed and verified in the environment:

1. **TypeScript Static Analysis (`npm run lint`):** `PASSED` (0 errors)
2. **Build Compilation (`npm run build`):** `PASSED` (Vite build + esbuild bundling to `dist/server.cjs`)
3. **C9 Ledger Immutability Test (`tests/c9_ledger.test.ts`):** `PASSED`
   - Block Zero genesis structure verified.
   - HMAC-SHA256 signature sealing verified.
   - DB Trigger immutability exception verified on UPDATE/DELETE attempts.
4. **Sovereignty Rules & Security Test (`tests/sovereignty_rules.test.ts`):** `PASSED`
   - Tenant isolation & cross-entity access blockage verified.
   - GPS Spoofing detection & `AUTO_FREEZE` status verified.
   - 72-Hour objection boundary limit & `TERMINATED_PATH` verified.
   - Double Penalty calculation for repeat violations within 180 days verified.
   - `SUSPEND_AUTO_DECISION` for confidence score < 80% verified.


---

## 11. Current Production Configuration Summary



| Element | Value |

|---|---|

| **Service Name** | `lexops-sovereign-os` |

| **Active Revision** | `lexops-sovereign-os-00016-rbt` |

| **Port** | 8080 |

| **Memory** | 1Gi |

| **CPU** | 1 |

| **Max Instances** | 3 |

| **IAP** | Enabled (authorized user: `sultsnhr2025@gmail.com`) |

| **Service Account** | `lexops-runner@lexops-prod-2026-sa.iam.gserviceaccount.com` |

| **Database** | Firestore (Datastore Mode) |

| **AI Provider** | Google Gemini API (via Secret Manager) |

| **Region** | `me-central1` (Riyadh, KSA) |

| **Creator** | `lexi.2030.sa@gmail.com` |

## 12. تقرير خريطة ووحدات نظام LexOps Sovereign OS v2026 الشامل

### 1. خريطة النظام والواجهات حسب الأدوار (System Navigation Map)

#### أ. لوحة التحكم للمؤسس (Founder View)
- **لوحة القيادة المركزية (Sovereign Founder Dashboard):** استعراض شامل لجميع المنشآت والجهات والسيادة التقنية.
- **إدارة المنشآت (Organizations Management):** إضافة، تفعيل، وتجميد المنشآت وتعديل بيانات السجلات التجارية.
- **بوابة الموافقة والاعتماد السيادي (User Approvals Gate):** فحص واعتماد طلبات الانضمام المعلقة من الموظفين والمستقلين.
- **مركز تذاكر الدعم المباشر (Founder Support Tunnel):** استقبال ومعالجة تذاكر الدعم الفني والسيادي الصادرة من مسؤولي المنشآت.
- **التحكم بالنظام ومفتاح الطوارئ (Master Security & Kill Switch):** إمكانية إيقاف الخدمات مؤقتاً لحماية سلامة البيانات.
- **سجل الأحداث C9 Ledger Monitor:** استعراض الكتل والتدقيق المشفر لسجل الحركات غير القابلة للتعديل.

#### ب. لوحة مسؤول المنشأة (Organization Admin Dashboard)
- **الرئيسية والمؤشرات (Executive Overview):** مؤشرات الامتثال، عدد الفروع، ونسبة التوطين.
- **إدارة الموظفين (Employee Management):** إضافة الموظفين، تحديد الأدوار، وإصدار البطاقات الرقمية.
- **الحضور والانصراف الجغرافي (Attendance & Geofencing):** متابعة سجلات البصمة الحركية ومعالجة استثناءات التخطي.
- **مركز الإجازات والغياب (Leaves & Excuses Engine):** معالجة طلبات التعذر والإجازات ومطابقتها مع المادة 41.
- **محرك المخالفات والاعتراضات (Violations & Appeals Engine):** إدارة المخالفات الميدانية وتوليد الاعتراضات السيادية بـ LEXI AI.
- **مطباق الامتثال الحكومي (Gov Connectors Engine):** الربط الحي والمطابقة مع (بلدي، قوى، زكاة، تأمينات، سلامة).
- **مصدر التقارير الموثقة (C9 Sealed Exporter):** تصدير وتوقيع تقارير الامتثال المعتمدة بصيغة PDF و Excel.
- **مرسل التنبيهات المجدولة (Alerts Dispatcher):** إدارة وبث التنبيهات عبر البريد الإلكتروني، SMS، والإشعارات المباشرة.
- **بوابة المفتش الحكومي (Government Inspector Portal):** أدوات التفتيش الميداني، التحقق الجغرافي، والرصد البصري بالكاميرات Veo AI.
- **إعدادات المنشأة وتنبيهات الرخص (Company Setup & Expiry Safeguard):** ضبط السجل التجاري ورخصة البلدية مع الإرسال الآلي للتنبيهات قبل 30 يوماً.
- **الدعم والرفع للمؤسس (Sovereign Support Tickets):** فتح ومتابعة تذاكر الدعم والرفع السيادي المباشر للمؤسس.

#### ج. واجهة الموظف (Employee Portal)
- **الملف الشخصي والبطاقة التشغيلية (Profile & Work Badge):** استعراض بيانات التكليف والبطاقة الرقمية.
- **تسجيل الحضور الجغرافي (Geofenced Clock-In):** إثبات الحضور بالبصمة الجغرافية للمقر.
- **تقديم المبررات والاستثناءات (Bypass Exception Claims):** تقديم طعن حضور استثنائي مدعوم بالصور والموقع.
- **تقديم طلبات الإجازات (Leave Applications):** تقديم طلبات الغياب والتعذر وإرفاق التقارير الطبية.
- **تلقي الإشعارات والطعون الذاتية (Personal Alerts & Self-Appeals):** متابعة التنبيهات الموجهة وتقديم اعتراض ذاتي عند اللزوم.

#### د. واجهة المستقلين والأفراد (Freelancer / Individual View)
- **لوحة المستقل (Freelance Dashboard):** استعراض التراخيص المستقلة وعقود العمل الحر.
- **حافظة العقود والوثائق (Contract Vault):** رفع وحفظ وثائق الموثوقية المهنية والتراخيص الذاتية.

#### هـ. بوابة المفتش الحكومي الميداني (Government Inspector Portal)
- **قائمة التحقق الميداني (Field Inspection Checklist):** قوائم معتمدة لمطابقة الاشتراطات الميدانية.
- **نظام الفحص الجغرافي (Geo-Audit System):** مطابقة التواجد الميداني والموقع بالبصمة الجغرافية.
- **الرصد البصري ذكي بالكاميرات (Veo AI Video Surveillance):** الرصد الفوري لاشتراطات النظافة والسلامة في المطبخ والمقر.

---

### 2. إحصائيات وحدات ومكونات النظام (System Volume Statistics)

- **عدد الوحدات التشغيلية (Modules):** 12 وحدة متكاملة.
- **عدد الصفحات والواجهات (Pages & Views):** 5 واجهات رئيسية كبرى تغطي الأدوار السيادية بـ 30+ تبويب فرعي.
- **عدد النماذج (Forms):** 18 نموذجاً تفاعلياً مدعوماً بالتحقق الذاتي من المدخلات.
- **عدد الجداول (Tables):** 24 جدول بيانات متقدم مع إمكانيات الفرز والتصفية والتصدير.
- **عدد اللوحات القيادية (Dashboards):** 6 لوحات قيادية رئيسية وفرعية.

---

### 3. إمكانيات ومواقع استخدام الذكاء الاصطناعي (AI Matrix)

1. **المحادثة الذكية المباشرة (AI Chat):** عبر المساعد السيادي LEXI AI للاستفسارات والتحليل اللوائحي الفوري.
2. **التحليل البصري والفحص الضوئي (Visual Audit & OCR):** فحص تراخيص البلدية، الشواهد المرئية، والكاميرات عبر Veo AI / Gemini Multimodal.
3. **توليد الوثائق والخطابات (Document Generation):** صياغة وتوليد لوائح الاعتراض والطعن القانونية المنسقة تلقائياً بختم C9.
4. **التوصيات الذكية وتقييم المخاطر (AI Recommendations & Risk Analysis):** تقديم توجيهات فورية لتفادي الغرامات وتجنب المخالفات قبل حدوثها.

---

### 4. منظومة الامتثال والربط الحكومي (Compliance System)

- **منصة بلدي (Balady):** مطابقة رخص البلدية والشهادات الصحية والاشتراطات الميدانية.
- **منصة قوى (Qiwa):** متابعة مستهدفات السعودة والتوطين وإدارة عقود العمل.
- **هيئة الزكاة والضريبة والجمارك (ZATCA):** مطابقة الفواتير الإلكترونية والربط مع QR Code.
- **التأمينات الاجتماعية (GOSI):** مراقبة كشوفات الأجور وضبط حماية الأجور (WPS).
- **منصة سلامة (Salamah):** متابعة تصاريح وتراخيص السلامة والدفاع المدني.
- **سجل C9 Ledger السيادي:** التوثيق غير القابل للتعديل بخوارزمية HMAC-SHA256 لجميع أدلة وإجراءات الامتثال.

