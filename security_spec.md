# Security Specification & Adversarial Red-Team Spec

This document outlines the security invariants, vulnerable payloads ("Dirty Dozen"), and the security rule architecture for the LexOps Sovereign system database.

---

## 1. Core Data Invariants

1. **Identity & Scope isolation**:
   - An Organization can only be created by an authenticated user.
   - Employees are referenced to a valid Organization ID (`entityId`).
   - A Citation cannot be falsified or written by non-government/non-system roles.
   - An Appeal/Objection must associate with a valid Citation and matched Organization context.

2. **Immutability of Key Audit Fields**:
   - Fields such as `id`, `crNumber`, `entityId`, and `eventId` must remain unaltered during any updates.
   - Integrity ledger events (`c9_events`) are absolutely append-only. No updates, no deletions.

3. **Temporal Sanity**:
   - Timestamps like `onboardedAt`, `issuedAt`, `submittedAt`, and ledger block timestamps must correspond to reasonable timestamps, preventing retrospective transaction stuffing.

---

## 2. The "Dirty Dozen" Payload Tests

These 12 payloads represent malicious attempts to bypass security gates and must always return `PERMISSION_DENIED`:

### organization-spoof-01: Edit organization tier or set role to Sovereign Administrator directly.
Attempting to create or update an organization with an unapproved / elite administrative tag.
```json
{
  "id": "ORG-01",
  "name": "Bypassed Security Corp",
  "crNumber": "1010344552",
  "tier": "سيادي مبارك",
  "isAdmin": true
}
```

### organization-spoof-02: Modify immutables on update.
Attempting to modify the registered CR Number.
```json
{
  "id": "ORG-01",
  "name": "Hacked Ltd",
  "crNumber": "2020594321",
  "sector": "Tech",
  "tier": "سيادي مبارك"
}
```

### employee-poison-03: Inject 1.5MB junk string as nationalId to saturate storage.
```json
{
  "id": "EMP-999",
  "name": "Malicious Buffer",
  "nationalId": "[1.5MB of junk characters here]",
  "entityId": "ORG-01"
}
```

### employee-identity-04: Claim entity member role without matching organization ownership.
An authenticated user attempts to register an employee under a different company's `entityId` they do not own or administer.
```json
{
  "id": "EMP-499",
  "name": "Faked Staff",
  "nationalId": "1112223334",
  "entityId": "ORG-FOREIGN",
  "entityName": "Foreign Competitor"
}
```

### citation-falsification-05: Non-government user attempts to issue a formal compliance Citation.
```json
{
  "id": "CIT-FAKE",
  "entityId": "ORG-01",
  "entityName": "رائد التقنية للاستشارات اللوجستية",
  "employeeName": "م. فهد القرني",
  "type": "Fake Violation",
  "status": "قيد المراجعة",
  "issuedAt": "2026-05-15"
}
```

### citation-state-06: Forcing the status of a citation directly to 'accepted' or 'dismissed' as a client request.
```json
{
  "id": "CIT-001",
  "status": "مقبول التسوية"
}
```

### appeal-orphan-07: Create an appeal containing a non-existing or faked citationId reference.
```json
{
  "id": "APP-998",
  "citationId": "CIT-NONEXISTENT-HEX",
  "grounds": "Irrelevant details"
}
```

### appeal-hijack-08: Modify grounds of another firm's appeal.
```json
{
  "id": "APP-402",
  "grounds": "Injecting random spam into legitimate appeal logs",
  "status": "قيد التدقيق"
}
```

### c9event-update-09: Attempt to modify or rewrite a ledger block in c9_events (Append-only violation).
```json
{
  "eventId": "C9-EV-1001",
  "type": "Hacked Block Change",
  "hash": "00000000000000000"
}
```

### c9event-tampering-10: Self-sign a newly injected ledger event of arbitrary system parameters.
```json
{
  "eventId": "C9-EV-9999",
  "type": "Fictional Clearance Action",
  "payload": { "fineForgiven": true },
  "hash": "c9-user-faked-hash-1234"
}
```

### crowdsource-poison-11: Submit entry with empty email or invalid email format.
```json
{
  "id": "CS-901",
  "orgName": "Failing Corp",
  "employeeCount": 10,
  "challenges": "None",
  "email": "invalid-email"
}
```

### global-unauthorized-12: Read entire lists of other companies' employees or citations without permission.
```json
{
  "unauthorizedListOperationQuery": "select * from employees"
}
```
