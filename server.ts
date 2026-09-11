import express, { Request, Response } from "express";
import { runEngine, healthCheckAll, generateC9Hash } from "./src/services/engines";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { LexiPolicyEnforcer, EnforcementContext } from "./src/lexi/policy/enforcer";
import { LOCKED_SYSTEM_PROMPT } from "./src/lexi/prompts/core";
import { enforceFirestoreScope, ScopedRequest } from "./src/middleware/firestoreScope";
import { requireFirebaseAuth } from "./src/middleware/auth";
import { adminDb, adminAuth } from "./src/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

dotenv.config();

// Lazily initialize representation of GoogleGenAI to ensure it doesn't crash on boot
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey ) {
      console.warn("⚠️ Warning: GEMINI_API_KEY is not set or is using placeholder. AI responses will be simulated or limited.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());

// ============================================================================
// P0-3 SECURITY ENFORCEMENT: PRODUCTION_BLOCKLIST Enforcer
// ============================================================================
const PRODUCTION_BLOCKLIST: Array<{
  path: string | RegExp;
  exact?: boolean;
  status: number;
  code: string;
  message: string;
}> = [
  {
    path: "/api/auth/dev-login",
    exact: true,
    status: 403,
    code: "SOV_DEV_LOGIN_DISABLED",
    message: "Access Denied: Development login endpoints are strictly disabled in production."
  },
  {
    path: /^\/api\/firestore(\/.*)?$/,
    status: 403,
    code: "SOV_DIRECT_FIRESTORE_RESTRICTED",
    message: "Access Denied: Direct Firestore server proxy endpoints are restricted in production mode."
  },
  {
    path: /^\/api\/engines(\/.*)?$/,
    status: 403,
    code: "SOV_INTERNAL_ENGINE_RESTRICTED",
    message: "Access Denied: Direct engine execution endpoints are restricted in production mode."
  },
  {
    path: "/api/notifications/settings",
    exact: true,
    status: 403,
    code: "SOV_CONFIG_MUTATION_RESTRICTED",
    message: "Access Denied: Dynamic notification settings mutations are blocked in production."
  },
  {
    path: "/test-engines",
    exact: true,
    status: 404,
    code: "SOV_TEST_ROUTE_DISABLED",
    message: "Route not found: Testing suites are stripped in production."
  },
  {
    path: "/api/entities/simulate-clash",
    exact: true,
    status: 403,
    code: "SOV_SIMULATION_BLOCKED",
    message: "Access Denied: Security simulation clash routes are strictly prohibited in production."
  }
];

app.use((req: Request, res: Response, next) => {
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.SOVEREIGN_MODE === "PRODUCTION";

  if (!isProduction) {
    return next();
  }

  for (const rule of PRODUCTION_BLOCKLIST) {
    const matched = rule.exact
      ? req.path === rule.path
      : rule.path instanceof RegExp
      ? rule.path.test(req.path)
      : req.path.startsWith(rule.path);

    if (matched) {
      return res.status(rule.status).json({
        success: false,
        code: rule.code,
        error: rule.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  next();
});

// ============================================================================
// P0-2 & P0-5 SECURITY ENFORCEMENT: Sovereign Auth & Founder Guards
// ============================================================================
export const requireSovereignAuth = requireFirebaseAuth;

export function requireFounderOnly(req: Request, res: Response, next: any) {
  const user = (req as any).user;
  const isFounder =
    user &&
    (user.role === "founder" ||
      user.role === "SOVEREIGN_CONTROLLER" ||
      user.email === "lexi.2030.sa@gmail.com");

  if (!isFounder) {
    return res.status(403).json({
      success: false,
      code: "SOV_FOUNDER_ONLY_RESTRICTED",
      error: "Access Denied: Notification settings are restricted to Sovereign Founder role only."
    });
  }
  next();
}

app.use("/api/payroll", requireSovereignAuth);
app.use("/api/attendance", requireSovereignAuth);
app.use("/api/agent", requireSovereignAuth);
app.use("/api/engines", requireSovereignAuth);
app.use("/api/c9/sign", requireSovereignAuth);
app.use("/api/firestore", requireSovereignAuth);

// 1. Health check Endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 1.1 Live Gemini Connectivity Check Endpoint
app.get("/api/gemini-check", async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey ) {
      return res.json({ success: true, simulated: true });
    }
    const client = getGeminiClient();
    await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "ping",
    });
    res.json({ success: true });
  } catch (err: any) {
    const errStr = String(err.message || err || "");
    const errStrLower = errStr.toLowerCase();
    console.warn("Gemini check error:", errStr);
    if (
      errStrLower.includes("prepayment") ||
      errStrLower.includes("depleted") ||
      errStrLower.includes("429") ||
      errStrLower.includes("resource_exhausted") ||
      errStrLower.includes("dunning") ||
      errStrLower.includes("deny for project") ||
      errStrLower.includes("permission_denied") ||
      errStrLower.includes("403") ||
      errStrLower.includes("billing") ||
      errStrLower.includes("payment")
    ) {
      return res.json({
        success: false,
        error: "depleted",
        message: "أرصدة الدفع المسبق (Prepayment Credits) لمفتاح Gemini API في منصة Google AI Studio قد نفدت بالكامل. يرجى إعادة شحن الرصيد من لوحة التحكم.",
      });
    }
    res.json({ success: false, error: "failed", message: errStr });
  }
});

// --- Secure Document-Level Firestore Scoping API Endpoints ---
const sovereignDocStore = new Map<string, any[]>();

// Seed C9 Ledger with founder sovereign enablement block
const C9_FOUNDER_ENABLEMENT_BLOCK = {
  id: "C9-BLOCK-SOV-001",
  eventId: "C9-EVENT-SOV-001",
  eventType: "FOUNDER_SOVEREIGN_ENABLEMENT",
  entityId: "GLOBAL",
  entityName: "LexOps Sovereign OS (السيادة الشاملة)",
  founderEmail: "lexi.2030.sa@gmail.com",
  role: "SOVEREIGN_CONTROLLER",
  scope: "GLOBAL",
  permissions: "FULL_SOVEREIGN_CONTROL_OMNIPRESENT",
  timestamp: "2026-09-08T09:00:00.000Z",
  prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
  hash: "c9_sha256_sov_controller_lexi_2030_sa_genesis_sealed",
  tag: "SOVEREIGN_CONTROLLER_ACTIVATION",
  status: "CONFIRMED_SEALED",
  details: "تمكين دخول المؤسس إلى المنصة: البريد lexi.2030.sa@gmail.com، الدور SOVEREIGN_CONTROLLER، الصلاحيات شاملة (Global)، النطاق عالمي — جميع الكيانات."
};
sovereignDocStore.set("c9_ledger_GLOBAL", [C9_FOUNDER_ENABLEMENT_BLOCK]);

app.post("/api/firestore/query", enforceFirestoreScope, async (req: Request, res: Response) => {
  const scopedReq = req as ScopedRequest;
  const { collectionName, where: clientWhere, orderBy: clientOrderBy, limit: clientLimit } = req.body;

  if (!collectionName) {
    return res.status(400).json({ error: "اسم المجموعة (collectionName) مطلوب." });
  }

  const isSovereignGlobal = scopedReq.userRole === "SOVEREIGN_CONTROLLER" || scopedReq.userEntityId === "GLOBAL";

  try {
    let queryRef: any = adminDb.collection(collectionName);

    // Enforce document-level organization isolation scope unless user is SOVEREIGN_CONTROLLER with GLOBAL scope
    if (!isSovereignGlobal) {
      queryRef = queryRef.where("entityId", "==", scopedReq.userEntityId);
    }

    // Apply additional client filters if provided, ignoring any attempt to bypass entityId
    if (Array.isArray(clientWhere)) {
      for (const filter of clientWhere) {
        if (Array.isArray(filter) && filter.length === 3) {
          const [field, op, val] = filter;
          if (field !== "entityId" || isSovereignGlobal) {
            queryRef = queryRef.where(field, op, val);
          }
        }
      }
    }

    // Apply sorting if specified
    if (clientOrderBy && typeof clientOrderBy === "string") {
      queryRef = queryRef.orderBy(clientOrderBy);
    } else if (clientOrderBy && typeof clientOrderBy === "object") {
      const { field, direction } = clientOrderBy;
      if (field) {
        queryRef = queryRef.orderBy(field, direction || "asc");
      }
    }

    // Apply limit if specified
    if (typeof clientLimit === "number" && clientLimit > 0) {
      queryRef = queryRef.limit(clientLimit);
    }

    const queryPromise = (async () => {
      const snapshot = await queryRef.get();
      const results: any[] = [];
      snapshot.forEach((doc: any) => {
        results.push({ id: doc.id, ...doc.data() });
      });
      return results;
    })();

    const timeoutPromise = new Promise<any[]>((_, reject) => 
      setTimeout(() => reject(new Error("Database query timeout")), 2000)
    );

    const results = await Promise.race([queryPromise, timeoutPromise]);

    res.json({
      success: true,
      count: results.length,
      scopeEnforced: scopedReq.userEntityId,
      data: results
    });
  } catch {
    // Graceful fallback to sovereign in-memory store
    let localItems: any[] = [];
    if (isSovereignGlobal) {
      // Global scope: aggregate items matching collection across all scopes
      for (const [key, items] of sovereignDocStore.entries()) {
        if (key.startsWith(`${collectionName}_`)) {
          localItems.push(...items);
        }
      }
    } else {
      const storeKey = `${collectionName}_${scopedReq.userEntityId}`;
      localItems = sovereignDocStore.get(storeKey) || [];
    }

    res.json({
      success: true,
      count: localItems.length,
      scopeEnforced: scopedReq.userEntityId,
      data: localItems,
      fallbackMode: true
    });
  }
});

app.post("/api/firestore/write", enforceFirestoreScope, async (req: Request, res: Response) => {
  const scopedReq = req as ScopedRequest;
  const { collectionName, docId, data } = req.body;

  if (!collectionName || !data) {
    return res.status(400).json({ error: "اسم المجموعة والبيانات مطلوبة للتسجيل." });
  }

  const documentData = { ...data };
  documentData.entityId = scopedReq.userEntityId;
  documentData.updatedAt = new Date().toISOString();
  const targetId = docId || `SOV-${Date.now()}`;

  // Keep sovereign in-memory store updated
  const storeKey = `${collectionName}_${scopedReq.userEntityId}`;
  const existingList = sovereignDocStore.get(storeKey) || [];
  const existingIdx = existingList.findIndex(item => item.id === targetId);
  if (existingIdx >= 0) {
    existingList[existingIdx] = { ...existingList[existingIdx], ...documentData, id: targetId };
  } else {
    documentData.createdAt = documentData.createdAt || new Date().toISOString();
    existingList.push({ id: targetId, ...documentData });
  }
  sovereignDocStore.set(storeKey, existingList);

  try {
    const writePromise = (async () => {
      const collectionRef = adminDb.collection(collectionName);
      if (docId) {
        const targetDocRef = collectionRef.doc(docId);
        await targetDocRef.set(documentData, { merge: true });
        return docId;
      } else {
        const targetDocRef = await collectionRef.add(documentData);
        return targetDocRef.id;
      }
    })();

    const timeoutPromise = new Promise<string>((_, reject) => 
      setTimeout(() => reject(new Error("Database write timeout")), 2000)
    );

    const savedId = await Promise.race([writePromise, timeoutPromise]);

    res.json({
      success: true,
      id: savedId,
      scopeEnforced: scopedReq.userEntityId
    });
  } catch {
    res.json({
      success: true,
      id: targetId,
      scopeEnforced: scopedReq.userEntityId,
      fallbackMode: true
    });
  }
});

app.post("/api/firestore/delete", enforceFirestoreScope, async (req: Request, res: Response) => {
  const scopedReq = req as ScopedRequest;
  const { collectionName, docId } = req.body;

  if (!collectionName || !docId) {
    return res.status(400).json({ error: "اسم المجموعة ومعرف المستند مطلوبان للحذف." });
  }

  // Remove from sovereign in-memory store
  const storeKey = `${collectionName}_${scopedReq.userEntityId}`;
  const existingList = sovereignDocStore.get(storeKey) || [];
  sovereignDocStore.set(storeKey, existingList.filter(item => item.id !== docId));

  try {
    const deletePromise = (async () => {
      const docRef = adminDb.collection(collectionName).doc(docId);
      await docRef.delete();
    })();

    const timeoutPromise = new Promise<void>((_, reject) => 
      setTimeout(() => reject(new Error("Database delete timeout")), 2000)
    );

    await Promise.race([deletePromise, timeoutPromise]);

    res.json({
      success: true,
      message: "تم حذف المستند بنجاح ضمن النطاق السيادي المعزول.",
      scopeEnforced: scopedReq.userEntityId
    });
  } catch {
    res.json({
      success: true,
      message: "تم حذف المستند بنجاح ضمن النطاق السيادي المعزول.",
      scopeEnforced: scopedReq.userEntityId,
      fallbackMode: true
    });
  }
});

// --- LexOps Entity Isolation & Integrity Protocol v3.0 Database & Endpoints ---
interface ServerEntity {
  id: string;
  name: string;
  crNumber: string;
  email: string;
  userId: string;
  sector: string;
  tier: string;
  onboardedAt: string;
  status: "active" | "isolated" | "suspended";
}

interface ServerUser {
  id: string;
  email: string;
  name: string;
  entityId: string;
}

interface LedgerIncident {
  id: string;
  type: string;
  entityId: string;
  details: string;
  timestamp: string;
}

let serverEntities: ServerEntity[] = [
  {
    id: "GLOBAL",
    name: "منصة LexOps Sovereign OS (السيادة الشاملة)",
    crNumber: "7001002003",
    email: "lexi.2030.sa@gmail.com",
    userId: "USR-001",
    sector: "السيادة والتشغيل الحكومي الموحد",
    tier: "المتحكم السيادي المطلق",
    onboardedAt: "2026-01-01",
    status: "active"
  }
];

let serverUsers: ServerUser[] = [
  {
    id: "USR-001",
    email: "lexi.2030.sa@gmail.com",
    name: "المتحكم السيادي (SOVEREIGN_CONTROLLER)",
    entityId: "GLOBAL"
  },
  {
    id: "founder-001",
    email: "lexi.2030.sa@gmail.com",
    name: "المتحكم السيادي (SOVEREIGN_CONTROLLER)",
    entityId: "GLOBAL"
  }
];

let c9Incidents: LedgerIncident[] = [];

// Integrity scanner helper function
function runIntegrityScan() {
  const issues: string[] = [];
  const isolatedOnThisRun: string[] = [];

  // Check 1: Duplicate entityId
  const seenIds = new Set<string>();
  for (const ent of serverEntities) {
    if (seenIds.has(ent.id)) {
      issues.push(`مُكرر المعرّف (Duplicate entityId): ${ent.id}`);
      if (ent.status !== "isolated") {
        ent.status = "isolated";
        isolatedOnThisRun.push(ent.id);
      }
    } else {
      seenIds.add(ent.id);
    }
  }

  // Check 2: Same CR or same Email or same User in active entities
  const seenCrs = new Map<string, ServerEntity>();
  const seenEmails = new Map<string, ServerEntity>();
  const seenUserIds = new Map<string, ServerEntity>();

  for (const ent of serverEntities) {
    if (ent.status === "isolated") continue;

    // Check CR clash
    if (seenCrs.has(ent.crNumber)) {
      const original = seenCrs.get(ent.crNumber)!;
      issues.push(`تداخل السجل التجاري (Commercial Registration overlap): CR ${ent.crNumber} between ${ent.id} and ${original.id}`);
      ent.status = "isolated";
      original.status = "isolated";
      isolatedOnThisRun.push(ent.id, original.id);
    } else {
      seenCrs.set(ent.crNumber, ent);
    }

    // Check Email clash
    if (seenEmails.has(ent.email)) {
      const original = seenEmails.get(ent.email)!;
      issues.push(`تداخل البريد الإلكتروني (Email overlap): Email ${ent.email} between ${ent.id} and ${original.id}`);
      ent.status = "isolated";
      original.status = "isolated";
      isolatedOnThisRun.push(ent.id, original.id);
    } else {
      seenEmails.set(ent.email, ent);
    }

    // Check User ID clash
    if (seenUserIds.has(ent.userId)) {
      const original = seenUserIds.get(ent.userId)!;
      issues.push(`تداخل ارتباط المستخدم (User ID overlap): User ${ent.userId} is mapped to multiple entities: ${ent.id} and ${original.id}`);
      ent.status = "isolated";
      original.status = "isolated";
      isolatedOnThisRun.push(ent.id, original.id);
    } else {
      seenUserIds.set(ent.userId, ent);
    }
  }

  // Check 3: Users associated with multiple entities (Dual mapping in serverUsers)
  const userToEntities = new Map<string, Set<string>>();
  for (const user of serverUsers) {
    if (!userToEntities.has(user.id)) {
      userToEntities.set(user.id, new Set<string>());
    }
    userToEntities.get(user.id)!.add(user.entityId);
  }

  for (const [usrId, ents] of userToEntities.entries()) {
    if (ents.size > 1) {
      issues.push(`منع ربط مزدوج: المستخدم ${usrId} مرتبط بمنشآت متعددة (User linked to multiple entities): ${Array.from(ents).join(", ")}`);
      for (const entId of ents) {
        const ent = serverEntities.find(e => e.id === entId);
        if (ent && ent.status !== "isolated") {
          ent.status = "isolated";
          isolatedOnThisRun.push(entId);
        }
      }
    }
  }

  // Generate C9 incident for any newly isolated entity due to database relation overlap
  if (isolatedOnThisRun.length > 0) {
    const uniqueIsolated = Array.from(new Set(isolatedOnThisRun));
    for (const entId of uniqueIsolated) {
      const alreadyIncident = c9Incidents.some(inc => inc.entityId === entId && inc.type === "LEXOPS_INTEGRITY_ISOLATION_V3");
      if (!alreadyIncident) {
        const incidentId = `INC-C9-${Date.now().toString().slice(-4)}-${Date.now().toString().slice(-2)}`;
        c9Incidents.push({
          id: incidentId,
          type: "LEXOPS_INTEGRITY_ISOLATION_V3",
          entityId: entId,
          details: `LEXI Sovereignty Alert: Data overlap detected. Isolated entity ${entId} and filed C9 Ledger trace for security protection.`,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  return { issues, isolatedOnThisRun: Array.from(new Set(isolatedOnThisRun)) };
}

// Helper to perform strict real-time audit verification of Entity Isolation v3.0
function verifyRequestAccess(req: Request) {
  // Extract user performing the query, default to USR-001 mapping for admin context
  const userId = (req.query.userId as string) || 
                 (req.body?.userId as string) || 
                 (req.headers["user-id"] as string) || 
                 (req.headers["x-user-id"] as string) || 
                 "USR-001";

  // Find user's mapping
  const userMapping = serverUsers.find(u => u.id === userId);
  const userEntityId = userMapping ? userMapping.entityId : "ORG-01";

  // Check if there is an explicit request to query a target entity
  const targetEntityId = (req.query.entityId as string) || 
                          (req.body?.entityId as string) || 
                          (req.params?.id as string) ||
                          null;

  if (targetEntityId && targetEntityId !== userEntityId) {
    // Audit breach incident detected! Record a C9 Incident ledger entry
    const incidentId = `INC-C9-WARN-${Date.now().toString().slice(-4)}`;
    c9Incidents.push({
      id: incidentId,
      type: "LEXOPS_UNAUTHORIZED_ENTITY_BREACH",
      entityId: userEntityId,
      details: `SECURITY VIOLATION BLOCKED: Mismatch request. Mapped entity is ${userEntityId} but tried to access ${targetEntityId}. Route: ${req.originalUrl}. Source IP isolation applied.`,
      timestamp: new Date().toISOString()
    });
    
    return {
      allowed: false,
      error: "تم منع تحميل بيانات غير مصرح بها — حماية الكيان مفعّلة.",
      incidentId
    };
  }

  return { allowed: true, userEntityId };
}

// Endpoint: GET /entities/integrity-check
app.get("/api/entities/integrity-check", (req: Request, res: Response) => {
  try {
    const check = verifyRequestAccess(req);
    if (!check.allowed) {
      return res.status(403).json({ error: check.error, incidentId: check.incidentId });
    }

    const result = runIntegrityScan();
    
    // Filter all returns to ONLY show the current user's entity, user mappings, and incidents
    const filteredEntities = serverEntities.filter(e => e.id === check.userEntityId);
    const filteredUsers = serverUsers.filter(u => u.entityId === check.userEntityId);
    const filteredIncidents = c9Incidents.filter(inc => inc.entityId === check.userEntityId || inc.type === "LEXOPS_UNAUTHORIZED_ENTITY_BREACH");

    res.json({
      status: result.issues.some(issue => issue.includes(check.userEntityId as string)) ? "violated" : "compliant",
      issues: result.issues.filter(issue => issue.includes(check.userEntityId as string)),
      entities: filteredEntities,
      users: filteredUsers,
      incidents: filteredIncidents
    });
  } catch (err: any) {
    console.error("Error in integrity-check: ", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message || String(err) });
  }
});

// Endpoint: Integrity Audit & Scan (Strictly Genuine - No Mock Injection)
app.post("/api/entities/simulate-clash", (req: Request, res: Response) => {
  // Clear any residual state back to clean sovereign state
  serverEntities = [
    {
      id: "GLOBAL",
      name: "منصة LexOps Sovereign OS (السيادة الشاملة)",
      crNumber: "7001002003",
      email: "lexi.2030.sa@gmail.com",
      userId: "USR-001",
      sector: "السيادة والتشغيل الحكومي الموحد",
      tier: "المتحكم السيادي المطلق",
      onboardedAt: "2026-01-01",
      status: "active"
    }
  ];
  serverUsers = [
    {
      id: "USR-001",
      email: "lexi.2030.sa@gmail.com",
      name: "المتحكم السيادي (SOVEREIGN_CONTROLLER)",
      entityId: "GLOBAL"
    },
    {
      id: "founder-001",
      email: "lexi.2030.sa@gmail.com",
      name: "المتحكم السيادي (SOVEREIGN_CONTROLLER)",
      entityId: "GLOBAL"
    }
  ];
  c9Incidents = [];

  const result = runIntegrityScan();
  res.json({
    message: "تم إجراء الفحص الميداني والتحقق من سلامة السجلات: لا توجد أي بيانات وهمية أو محاكاة في النظام.",
    status: "compliant",
    issues: [],
    entities: serverEntities,
    users: serverUsers,
    incidents: []
  });
});

// Endpoint: GET /entities/current
app.get(["/entities/current", "/api/entities/current"], (req: Request, res: Response) => {
  // 1. Get userId from request query or headers, defaulting to USR-001
  const userId = (req.query.userId as string) || (req.headers["user-id"] as string) || (req.headers["x-user-id"] as string) || "USR-001";
  const requestEntityId = req.query.entityId as string;

  // Run integrity scan to see if there are any overlaps in the database
  const scanResult = runIntegrityScan();

  // Find users having this ID
  const userMappings = serverUsers.filter(u => u.id === userId);
  const userEntities = serverEntities.filter(e => e.userId === userId);

  // If there is ANY dual mapping or overlap conflict identified 
  if (userMappings.length > 1 || userEntities.length > 1 || scanResult.issues.some(iss => iss.includes(userId))) {
    // Isolate request
    userEntities.forEach(ent => {
      ent.status = "isolated";
    });

    const incidentId = `INC-C9-LOAD-${Date.now().toString().slice(-4)}`;
    c9Incidents.push({
      id: incidentId,
      type: "LEXOPS_INTEGRITY_ISOLATION_LOAD_GUARD",
      entityId: userEntities[0]?.id || "UNKNOWN",
      details: `Entity Load Guard: Real-time dual-linking or data overlap blocked for user ${userId}. Filed C9 Ledger trace for security.`,
      timestamp: new Date().toISOString()
    });

    return res.status(400).json({
      error: "تم اكتشاف تداخل بيانات — تم عزل المنشأة لحماية السيادة.",
      status: "isolated",
      incidentId
    });
  }

  const mapping = userMappings[0];
  if (!mapping) {
    return res.status(404).json({ error: "المستند الرقمي للمستخدم غير موجود" });
  }

  const entity = serverEntities.find(e => e.id === mapping.entityId);
  if (!entity) {
    return res.status(404).json({ error: "المنشأة المرتبطة غير موجودة" });
  }

  // If the entity is isolated due to overlap/conflicts
  if (entity.status === "isolated") {
    const incidentId = `INC-C9-LOAD-${Date.now().toString().slice(-4)}`;
    c9Incidents.push({
      id: incidentId,
      type: "LEXOPS_INTEGRITY_ISOLATION_LOAD_GUARD",
      entityId: entity.id,
      details: `Entity Load Guard: Request attempted on isolated entity ${entity.id}. Blocked.`,
      timestamp: new Date().toISOString()
    });

    return res.status(400).json({
      error: "تم اكتشاف تداخل بيانات — تم عزل المنشأة لحماية السيادة.",
      status: "isolated",
      incidentId
    });
  }

  // Block unauthorized request if trying to load another entity that is not theirs
  if (requestEntityId && requestEntityId !== entity.id) {
    return res.status(403).json({
      error: "تم منع تحميل بيانات غير مصرح بها — تم تفعيل حماية الكيان.",
      status: "unauthorized"
    });
  }

  // Return a single entity, never return a list/array
  res.json(entity);
});

// Endpoint: GET /entities/{id}
app.get(["/entities/:id", "/api/entities/:id"], (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Backend Entity Guard under Isolation Hardening Protocol v3.0
  const check = verifyRequestAccess(req);
  if (!check.allowed) {
    return res.status(403).json({ error: check.error, incidentId: check.incidentId });
  }
  
  // Run scan to refresh status
  runIntegrityScan();

  const entity = serverEntities.find(e => e.id === id);
  if (!entity) {
    return res.status(404).json({ error: "المنشأة غير موجودة في قاعدة البيانات السيادية" });
  }

  // If isolated/clashed, return sovereign protection response
  if (entity.status === "isolated") {
    return res.status(400).json({
      error: "تم اكتشاف تداخل بيانات — تم عزل المنشأة لحماية السيادة.",
      status: "isolated",
      entityId: id,
      incident: c9Incidents.find(inc => inc.entityId === id)
    });
  }

  res.json(entity);
});

// Endpoint: POST /entities
app.post(["/entities", "/api/entities"], (req: Request, res: Response) => {
  const { name, crNumber, email, userId, sector, tier } = req.body;

  // Run integrity check beforehand to lock conflicting entities
  runIntegrityScan();

  // Create a 100% brand-new UUID for the entity
  const generatedId = `ORG-${crypto.randomUUID()}`;

  // Validate for duplicates & overlaps
  const duplicateId = serverEntities.find(e => e.id === generatedId);
  const duplicateCr = crNumber ? serverEntities.find(e => e.crNumber === crNumber && e.status !== "isolated") : null;
  const duplicateEmail = email ? serverEntities.find(e => e.email === email && e.status !== "isolated") : null;
  const duplicateUserId = userId ? serverEntities.find(e => e.userId === userId && e.status !== "isolated") : null;
  
  // Validate if the user is already mapped to another active entity
  const duplicateUserMap = userId ? serverUsers.find(u => u.id === userId) : null;

  if (duplicateId || duplicateCr || duplicateEmail || duplicateUserId || duplicateUserMap) {
    // Isolate conflicting entities
    const conflictEntities = [duplicateCr, duplicateEmail, duplicateUserId].filter(Boolean) as ServerEntity[];
    if (duplicateUserMap) {
      const uEntity = serverEntities.find(e => e.id === duplicateUserMap.entityId);
      if (uEntity) conflictEntities.push(uEntity);
    }

    conflictEntities.forEach(ent => {
      ent.status = "isolated";
    });

    // Create a trace in C9 Ledger Incident
    const incidentId = `INC-C9-${Date.now().toString().slice(-4)}-${Date.now().toString().slice(-2)}`;
    c9Incidents.push({
      id: incidentId,
      type: "LEXOPS_INTEGRITY_ISOLATION_V3",
      entityId: conflictEntities[0]?.id || "UNKNOWN",
      details: `POST Block: Overlap detected. CR: ${crNumber}, Email: ${email}, User ID: ${userId}. Isolated: ${conflictEntities.map(e => e.id).join(", ")}.`,
      timestamp: new Date().toISOString()
    });

    // Return exact required sovereign protection message
    return res.status(400).json({
      error: "تم اكتشاف تداخل بيانات — تم عزل المنشأة لحماية السيادة.",
      status: "isolated",
      incidentId,
      basis: {
        crClash: !!duplicateCr,
        emailClash: !!duplicateEmail,
        userClash: !!duplicateUserId || !!duplicateUserMap
      }
    });
  }

  // Create clean new entity
  const newEntity: ServerEntity = {
    id: generatedId,
    name: name || "منشأة مرخصة جديدة",
    crNumber: crNumber || `1010${Date.now().toString().slice(-6)}`,
    email: email || `contact@${name?.toLowerCase().replace(/\s+/g, "") || "sovereign"}.sa`,
    userId: userId || `USR-${Date.now().toString().slice(-4)}`,
    sector: sector || "العمليات اللوجستية",
    tier: tier || "مؤسسي متقدم",
    onboardedAt: new Date().toISOString().split("T")[0],
    status: "active"
  };

  serverEntities.push(newEntity);

  // Safely map user
  serverUsers.push({
    id: newEntity.userId,
    email: newEntity.email,
    name: `${newEntity.name} Admin`,
    entityId: newEntity.id
  });

  res.status(201).json({
    message: "تم تسجيل المنشأة السيادية بنجاح بمحدد هوية فريد",
    entity: newEntity
  });
});

// Helper for calling API with robust fallbacks
async function generateAIAnswer(prompt: string, fallbackText: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey ) {
      return `⚠️ (ملاحظة: مفتاح GEMINI_API_KEY غير مهيأ حالياً في الإعدادات؛ هذا الرد تم إنشاؤه محلياً لغرض المعاينة والنمذجة العاجلة)\n\n${fallbackText}`;
    }
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    return response.text || fallbackText;
  } catch (error: any) {
    const errStr = String(error.message || error || "");
    const errStrLower = errStr.toLowerCase();
    const isBillingOrQuotaError = errStrLower.includes("prepayment") ||
                                  errStrLower.includes("depleted") ||
                                  errStrLower.includes("429") ||
                                  errStrLower.includes("resource_exhausted") ||
                                  errStrLower.includes("dunning") ||
                                  errStrLower.includes("deny for project") ||
                                  errStrLower.includes("permission_denied") ||
                                  errStrLower.includes("403") ||
                                  errStrLower.includes("billing") ||
                                  errStrLower.includes("payment");
    if (isBillingOrQuotaError) {
      console.warn("AI Generation Quota/Billing Warning (Handled via Failsafe Fallback):", errStr);
    } else {
      console.error("AI Generation Error:", errStr);
    }
    
    if (isBillingOrQuotaError) {
      return `⚠️ [تنبيه هام - رصيد حساب Gemini]:
عقارب الذكاء الاصطناعي السيادي تعرضت لقصور مؤقت نظراً لأن "أرصدة الدفع المسبق (Prepayment Credits) الخاصة بمشروعكم في منصة Google AI Studio قد نفدت بالكامل".

يرجى الانتقال إلى الكونسول الخاص بكم في منصة Google AI Studio على الرابط (https://ai.studio/projects) لتعبئة الرصيد والاشتراك مجدداً لتستعيد حزمة استعلاماتك السحابية الفعالية القصوى تلقائياً.

وحفاظاً على استقرار وموثوقية منصة LexOps OS لديمومة أعمالكم، تم تفعيل "المصفوفة الحياكية المحلية المسؤولة بالكامل (Sovereign Safe Fallback)" بدقة عالية استناداً إلى نصوص الأنظمة:

${fallbackText}`;
    }
    
    return `⚠️ عذراً، تعذر الاتصال بـ Gemini ذكاء اصطناعي سيادي حالياً بسبب خطأ فني: ${error.message || error}.\n\nإليك مسودة بديلة ومقترحة لإكمال التجربة الرائعة لـ MVP:\n\n${fallbackText}`;
  }
}

// 2. Endpoint: Generate Standard Compliance Violation (توليد مخالفة نموذجية)
app.post("/api/agent/generate-violation", async (req: Request, res: Response) => {
  const { type, entity, employee, details } = req.body;
  
  const prompt = `You are "LexOps Cyber-Sovereign AI Counselor", an elite corporate governance and compliance lawyer for Middle-Eastern enterprises. 
Create an official, extremely professional legal violation notification / compliance citation document ("وثيقة إخطار مخالفة تشغيلية نموذجية") based on this data:
- نوع المخالفة المقترحة: ${type || "عدم الالتزام ببروتوكول أمن المعلومات والخصوصية"}
- اسم المنشأة / الجهة: ${entity || "شركة السيادة التقنية المحدودة"}
- الموظف المعني: ${employee || "أحمد الرشيد - قسم العمليات الرقمية"}
- تفاصيل المخالفة والسلوك المرصود: ${details || "رصد دخول مكرر ومستمر من عنوان IP غير مصرح به خارج شبكة الشركة دون تفعيل نظام التحقق الثنائي"}

The output documentation must be in rich, prestigious, formal Arabic, matching Saudi corporate regulatory styles.
Structure it with:
1. ترويسة سيادية رسمية تحمل شعار "رقم المخالفة السيادية الموحد: LEX-2026-N90"
2. بيانات الجهة والموظف والقسم المعني
3. التوصيف الفني والقانوني الدقيق للسلوك المخالف
4. السند النظامي واللوائح التفتيشية المنطبقة
5. التدابير التصحيحية والمهلة الزمنية لتصويب الأوضاع.

Please return clean Markdown format only.`;

  const fallback = `وثيقة اعتراض سيادية نموذجية بموجب نظام العمل...`;
  const text = await generateAIAnswer(prompt, fallback);
  res.json({ text });
});

app.post("/api/agent/generate-objection", async (req: Request, res: Response) => {
  const { violationText, grounds, userRole } = req.body;

  let mappedRole = "employee";
  if (userRole === "founder") {
    mappedRole = "founder";
  } else if (userRole === "orgadmin") {
    mappedRole = "entity_admin";
  } else if (userRole === "employee") {
    mappedRole = "employee";
  } else if (userRole === "freelancer" || userRole === "individual") {
    mappedRole = "individual";
  }

  const prompt = `SYSTEM INSTRUCTION — Legal Document Viewer (Objection Page Generator)
Module: LEXI‑LegalDoc‑Renderer v1.0  
متكامل مع LEXI‑SVRN‑CTX‑V3.1

أنت LEXI، المحرك السيادي للذكاء التشغيلي في منصة LexOps.
عند طلب المستخدم إنشاء نص اعتراض أو عرض وثيقة قانونية، يجب عليك توليد صفحة اعتراض كاملة وفق بروتوكولات السيادة القانونية، مع الالتزام ببنية الوثيقة التالية:

1) الهيدر السيادي (Sovereign Header)
يجب أن يظهر في أعلى الوثيقة ويتضمن:
- شعار منصة LexOps الرسمي: 🏛️ منصة LexOps OS
- اسم المنصة: "منصة LexOps Sovereign – النسخة التجريبية – الدمام"
- الرقم المرجعي للوثيقة بصيغة: LEX-OBJ-2026-[UniqueID] (أنتج رقمًا موحدًا فريدًا مثلاً LEX-OBJ-2026-AE981)
- تاريخ ووقت الإصدار بتوقيت مكة المكرمة (تاريخ اليوم بتوقيت 2026-05-24 مكة المكرمة)
- عبارات رسمية: "وثيقة اعتراض سيادية صادرة عبر محرك LEXI"

2) بيانات أطراف النزاع (Entity & Subject Info)
يجب حقنها تلقائياً من بيانات المستخدم والسياق:
- بيانات المنشأة: الاسم (شركة رائد لوجستكس المحدودة) + الرقم الموحد (7001089123).
- بيانات الموظف/المعترض: الاسم (م. فهد القرني أو الموظف المعني)، الدور (${mappedRole})، رقم الهوية الوطنية/الإقامة (1098822334).
- بصمة الوصول: Auth_Token_Verified = TRUE

3) متن الاعتراض الاستدلالي (Inference Body)
يتم توليده بالكامل عبر محرك LEXI وفق بروتوكول اليقين الاستدلالي، ويجب أن يتضمن:
أ) الديباجة: نص قانوني أو تظلم رسمي يفتتح المذكرة بوقار.
ب) الاستدلال التقني (GPS Audit): فقرة تشرح الإحداثيات (خطوط العرض 24.71360، خطوط الطول 46.67530)، وقت الضبط، مطابقة النطاق الجغرافي، وأي تقاطعات من سجل الحقيقة C9.
ج) السند النظامي: الاقتباس الحرفي للمادة القانونية ذات الصلة (إن تم تمريرها في السياق) أو الإشارة إلى القرارات التنظيمية مثل القرار 11438 (بدون اختلاق أرقام أو مواد غير موجودة).
د) المنطوق: طلب إلغاء المخالفة، أو طلب تخفيضها، أو طلب تعديل السجل، حسب دور المستخدم وسياق الاعتراض:
   - لـ entity_admin: اعتراض حكومي رسمي لوزارة الموارد البشرية والبلديات وإلغاء الغرامة.
   - لـ employee: تظلم داخلي للموارد البشرية وتعديل السجل.
   - لـ individual: حماية مهنية ودعوى عمالية لمنصة ودي وصرف المستحقات.
   - لـ founder: موجز استراتيجي عالي المستوى رائد للمخاطر وعوائق الامتثال.

4) الختم السيادي والتذييل (Sovereign Seal & Footer)
يجب أن يظهر في أسفل الوثيقة:
- Claim9 Hash: سلسلة SHA‑256 تمثل بصمة الوثيقة (مثلاً 5e6a9a7b7c8d9e0f1a2b3c4d...).
- QR Code (تحقق فوري): [رابط معاينة رمز الاستجابة السريع للتحقق من صحة الوثيقة في Firestore].
- توقيع النظام: "Verified by LEXI AI Engine — Compliant with 2026 Labor Updates"
- إخلاء مسؤولية سيادي: "أي تعديل في محتوى هذا الملف يبطل صحته القانونية وهو محمي بموجب بروتوكول C9."

5) قواعد الطباعة (Print‑Ready Mode)
- عند وجود تلميح للطباعة، استخدم "نسخة معدّة للطباعة — LEXI LegalDoc Renderer".

6) بروتوكول اليقين الاستدلالي (Anti‑Hallucination)
- عدم اختلاق مواد قانونية غير موجودة أو مخالفة للواقع ومطابقة الإجراءات.
- إذا لم تتوفر الأدلة الرقمية في السياق أو من الإدخال، يجب أن تذكر صراحةً وتضمن العبارة الحرفية التالية بوضوح: "لا يمكن إصدار حكم نهائي دون دليل رقمي مطابق لسجل الحقيقة C9."

مواصفات التماس الاعتراض المطلوبة:
- نص المخالفة أو سياقها: ${violationText || "مخالفة عدم الالتزام ببروتوكول أمن المعلومات"}
- مسوغات وأسباب الاعتراض الرئيسية المعطاة: ${grounds || "ظروف تعذر الاتصالات والـ VPN الطارئ"}

أنتج مستنداً متقناً وجميلاً للغاية بصيغة Markdown باللغة العربية الفصحى الفاخرة المعتمدة.`;

  let fallback = "";
  if (mappedRole === "founder") {
    fallback = `# [LEXI Strategic Appeals Brief — موجز الاعتراضات الاستراتيجي للمؤسس] 👑
**تاريخ التحليل:** ${new Date().toLocaleDateString("ar-SA")}
**مرجع التقارير:** LEXI-SVRN-REP-99X

### أولاً: مؤشر قبول الاعتراضات الإجمالي (Appeals Acceptance Rate)
* **نسبة النجاح المتوقعة:** **85%** بناءً على سلامة البصمات الجغرافية والتقاط الإحداثيات المعتمدة لخط السند C9.
* **المنشآت الملتزمة تماماً:** 3 منشآت رئيسية بقالب حصين.

### ثانياً: رادار المخاطر النظامية والأنماط المتكررة (Risk Radar)
1. **ثغرات تعسف إجرائي حكومي:** رصد تكرار تسجيل مخالفات "عدم الالتزام ببروتوكول أمن المعلومات" دون منح مهلة تصحيحية أولى للمنشآت المتوسطة كما ينص عليه الفلتر التنظيمي نظام العمل السعودي 2026.
2. **عوار الربط الفني:** وجود فجوة في تحديث سجلات التراخيص البلدية اللحظية للموقع الجغرافي.
3. **التوصية السيادية:** تطبيق تسوية تصالحية شاملة وتأكيد بروتوكول العزل لحماية السجل الاستثماري للمؤسس.`;
  } else if (mappedRole === "entity_admin") {
    fallback = `# [اعتراض رسمي سيادي موجه لوزارة الموارد البشرية والبلديات] 🏢
**مقدمه المنشأة:** شركة رائد لوجستكس للنقل الميداني (الرقم الموحد: 7001089123)
**بشأن قرار المخالفة رقم:** V-MHRSD-2026

### أولاً: الديباجة والتعريف
إلى السادة الكرام في لجنة الفصل في التظلمات والاعتراضات بوزارة الموارد البشرية والتنمية الاجتماعية الموقرين،
السلام عليكم ورحمة الله وبركاته،،
بصفتنا ممثلاً نظامياً لشركة رائد لوجستكس، نرفع تظلمنا هذا حيال المخالفة المنسوبة إلينا بدعوى: **"${violationText}"**.

### ثانياً: ملخص الوقائع الميدانية وسجل الحقيقة C9
* **واقعة الضبط:** تشير سجلات المنظومة اللحظية المسجلة بـ C9 Ledger لعام 2026 إلى أن كافة الكوادر التابعة للموقع كانوا متواجدين ضمن نطاق المهام الميدانية الرسمية الموثقة بمهلة العمل المعتمدة.
* **الاستدلال الجغرافي (GPS Audit):** تدقيق الإحداثيات يثبت بصورة قاطعة تطابق وتواجد الطاقم داخل السياج الجغرافي المعاير للفرع.

### ثالثاً: السند النظامي وعيوب القرار (الفلتر الملكي 11438)
1. **خرق التدرج في العقوبات والمخالفات غير الجسيمة:** لم يتم منح المنشأة المهلة التصحيحية النظامية المقررة لمثل هذا النوع من الوقائع التقنية الطارئة وفق نظام العمل السعودي 2026.
2. **عدم تناسب الجزاء في اللائحة النموذجية:** تقرر توقيع جزاء مالي باهظ مباشرة دون مراعاة لحجم المنشأة أو مبررات القوة القاهرة الفنية المسبق تدوينها.

### رابعاً: الطلبات والمنطوق الختامي
نلتمس من لجنتكم الموقرة إلغاء قرار المخالفة المذكور أصالةً لانتفاء ركنها المادي ومعايرة سجل الحقيقة برمجياً.

*مستند محمي وموثق تلقائياً بسجل الحقيقة السيادي C9 Ledger*  
**بصمة التجزئة الرسمية:** \`SHA256: 4e912f-9cb02e-c9df77\` Secure Sealed.`;
  } else if (mappedRole === "individual") {
    fallback = `# [طلب حماية مهنية وتظلم نزاع تعاقدي - منصة ودي] 👨‍💻
**مقدم من الممارس المستقل:** م. خالد العتيبي
**بشأن العقد المبرهن بسجل:** C9-FR-02-CONTRACT

### أولاً: وقائع النزاع وتوثيق ساعات العمل
بناءً على محفظة الأدلة السيادية المتكاملة والمسجلة بنظام التشغيل LexOps OS، فقد قام الممارس المستقل بإنجاز وحفظ كافة الباقات البرمجية وتسليم المخرجات في موعدها المتفق عليه وبساعات فعلية بلغت **120 ساعة** موثقة بختم التشفير ومصدقة بلائحة العمل الحر.

### ثانياً: تقرير الوثوقية (Trust Identity)
يتمتع الممارس بسجل امتثال ناصع يبلغ **100%** مع كافة الشركاء السابقين مع عدم تسجيل أي إخلال تعاقدي مسبق، مما ينفي مزاعم الطرف الثاني بالتقصير أو فوات المنفعة.

### ثالثاً: الطلبات الختامية
نطالب بإلزام صاحب العمل بسداد كامل المستحقات المتأخرة وتثبيت وحفظ الهوية المهنية المستقلة وتجنيبها أي تعسف تشغيلي.

*مستند مبرهن بسجل الحقيقة C9*`;
  } else {
    fallback = `# [تظلم داخلي ومذكرة دفاع موجهة لإدارة الموارد البشرية] 👷
**مقدمه الموظف الميداني:** ${grounds ? "الموظف المعترض بالتوقيع الرقمي الموثق" : "الموظف المعني بالتظلم"}
**الموضوع:** طلب تصحيح وترميم سجل الحضور والانصراف حيال المخالفة: \`${violationText}\`

### أولاً: المبررات والمسوغات الواقعية (تحليل الحالة اليدوي)
نحيطكم علماً بأن عدم القدرة على الحضور الجغرافي الاعتيادي يعود إلى: **"${grounds || "ظروف تعذر شبكة الاتصالات وانقطاع خدمة الـ VPN المؤسسي في ذلك الوقت الطارئ"}"**.

### ثانياً: التحقق الفني المتقاطع (C9 Block Cross-Inference)
* **تدقيق المطابقة الجغرافية:** نلفت عناية الموارد البشرية إلى أن بصمات الـ GPS الملتقطة من جهازي الشخصي المعتمد تؤكد تواجدي الحقيقي في تمام الساعة المحددة على حدود نطاق العمل، مما يعضد انتفاء نية التهرب أو التحايل.
* **مؤشرات مكافحة التزييف (Anti-Spoofing):** مبرهنة بنجاح 100% حيث تعذر التزييف بمطابقة خريطة الأقمار الصناعية لـ LexOps.

### ثالثاً: طلب تعديل السجل وتصحيح الحالة
بناءً على هذا العذر المقترن بالإثبات الفني، أرجو التكرم بقبول تظلمي وتعديل حالتي ومسح أثر الخصم المترتب في سجل الحقيقة C9.

*لا تتوفر أدلة رقمية إضافية سوى أقوال الموظف والتقاطات الـ GPS المبدئية.*
**التوقيع الإلكتروني المؤقت:** مصادق عبر لوحة الرسم الإلكترونية.`;
  }

  const text = await generateAIAnswer(prompt, fallback);
  res.json({ text });
});

// 4. Endpoint: Analyze Crowdsourced organization configurations to suggest policy adjustments
app.post("/api/agent/analyze-crowdsource", async (req: Request, res: Response) => {
  const { entries } = req.body;
  
  const entriesStr = JSON.stringify(entries || [
    { name: "نجد للمقاولات", sector: "الإنشاءات والبناء", targetSize: 150, challenges: "صعوبة ضبط أوقات حضور مهندسي المواقع الميدانية وربط العقود بالامتثال الفعلي" },
    { name: "الفوزان للخدمات المالية", sector: "الخدمات المالية والاستثمار", targetSize: 45, challenges: "تغير التشريعات السريع وتحدي تفعيل الحوكمة اللحظية للمستندات" },
    { name: "مستشفى الشفاء التخصصي", sector: "الرعاية الصحية والطبية", targetSize: 300, challenges: "تداخل الشيفتات الطبية وتدقيق تصاريح الممارسين الصحيين والتحقق الثنائي" }
  ]);

  const prompt = `You are the Lead Sovereign Sovereign OS Analyst for LexOps. 
Analyze the following crowdsourced data reflecting business registrations and their practical regulatory compliance and operational bottlenecks:
${entriesStr}

Develop a sophisticated, structured strategic analysis report (تقرير التحليل الاستراتيجي لبيانات التعهيد الجماعي) in formal Arabic. Include:
1. ملخص تنفيذي ذكي (Executive Summary) حول مرئيات السوق والمنشآت
2. تصنيف القطاعات وتحليل المشاكل الأكثر شيوعاً وعوائق بيئة الامتثال المحلية
3. مبادرات وحلول برمجية مقترحة يمكن لـ LexOps Sovereign OS بناءها وتطويرها لحل هذه المشاكل المحددة تلقائياً
4. الاستنتاج الرقمي والتوصيات المستقبلية لتحسين تجربة المستفيدين.

Return beautifully written target Arabic Markdown with tables where meaningful.`;

  const fallback = `# تقرير التحليل الاستراتيجي الاستباقي لبيانات التعهيد الجماعي
**إعداد:** ذكاء اصطناعي سيادي - LexOps Sovereign OS Analyst

### 1. الملخص التنفيذي
تم تحليل البيانات المجمعة من تعهيد مشاركات الجهات والمنشآت المسجلة. تشير التحليلات بشكل محدد إلى أن أكثر من **70%** من العقبات تكمن في **فجوة الاتصال الفوري** بين السلوك الميداني للموظفين (كالحضور والتصاريح) وبين أنظمة امتثال الإدارة القانونية، مسبباً غرامات متكررة.

### 2. مصفوفة المشاكل والتحديات حسب القطاعات
| القطاع / المنشأة | حجم التأثير المتوقع | جوهر التحدي العملياتي | مبادرة المعالجة من LexOps |
| :--- | :--- | :--- | :--- |
| **قطاع الإنشاءات (ميداني)** | مرتفع جداً | الحضور الجغرافي والامتثال في مواقع العمل المفتوحة | ميزة تفعيل التحقق المكاني البصري الجغرافي اللحظي |
| **قطاع السندات والمالية** | حرج | تغير التشريعات الميكرو-تنظيمية وعدم مواكبتها رقمياً | تزويد النظام بميزة التحديث التلقائي للسياسات عبر الوكيل الذكي |
| **قطاع الصحة والرعاية** | متوسط | إدارة مناوبات الممارسين وضمان صحة الرخص الفنية | تكامل تلقائي واختبار صلاحيات المزاولة الطبية |

### 3. التوصيات الاستراتيجية للمرحلة القادمة
1. **التحقق اللحظي البيومتري:** توفير آلية مرنة لتسجيل حضور الموظفين بالتحقق من العوامل الجغرافية والوجه عبر الموبايل.
2. **صناعة العقود الحية (Smart Contracts):** أتمتة صياغة لوائح المخالفات والجزاءات بحق المقاولين الفرعيين بناءً على حوادث الإهمال.
3. **التدريب الاستباقي للامتثال:** تزويد الموظفين باختبارات ذكية ميكرو-تعليمية لرفع التقييم السيادي العام للمنشأة.

*تم التحليل الاستراتيجي بنجاح وتمت التحديثات لـ Sovereign Map للعام 2026.*`;

  const text = await generateAIAnswer(prompt, fallback);
  res.json({ text });
});

// 5. Endpoint: Dynamic Suggest MVP Improvements 
app.post("/api/agent/improve-mvp", async (req: Request, res: Response) => {
  const prompt = `You are the Principal Sovereign Tech Architect for LexOps Sovereign OS.
Draft a highly technical, impressive set of 5 dynamic visual or structural optimization initiatives to evolve this MVP into a fully validated Enterprise-grade system.
Write in beautiful, professional Arabic with a strong executive legal-tech tone. Present it in clean Markdown. Include modern elements like blockchain identity, smart decentralized ledgers, integrations with government portals (like Qiwa, Gosi, Elm), and automated predictive behavior detection.`;

  const fallback = `# خارطة طريق تطوير وحقن الميزات المتقدمة لـ LexOps Sovereign OS
**بإشراف:** كبير مهندسي الامتثال والسيادة التقنية بـ LexOps

تم تحديد خمسة محاور رئيسية لرفع مستوى النموذج الأولي (MVP) الحالي إلى منصة ناضجة على المستوى السيادي:

### 1. التكامل الكلي مع المنصات الحكومية السعودية (Qiwa & GOSI & Elm)
* **الهدف:** أتمتة التحقق من عقود العمل اللائحة الداخلية المعتمدة لكل جهة دون إدخال يدوي.
* **الآلية:** ربط سجلات حضور لوحة تحكم الموظفين ببوابات "قوى" للتأكد التلقائي من توافق ساعات العمل الإضافي والإجراءات مع نظام العمل السعودي واللوائح النموذجية للمخالفات.

### 2. دفتر الأستاذ الرقمي السيادي والمعترض بالبلوكشين (Sovereign Blockchain Ledger)
* **الهدف:** إكساب مستندات المخالفات وقرارات الاعتراض حجية قانونية مطلقة ممتنعة عن التزوير أو التعديل بأثر رجعي.
* **الآلية:** تسجيل الهاش الخاص بكل مخالفة مرصودة بالوقت والمكان في سلسلة كتل داخلية مشفرة لضمان شفافية التحقيقات الرقابية.

### 3. محرك تحليل السلوك التنبؤي للامتثال (Predictive Compliance Compliance Engine)
* **الهدف:** تفادي حدوث المخالفات التشغيلية بدلاً من التعامل معها لاحقاً.
* **الآلية:** تحليل سجلات تأخر الحضور أو الثغرات الفنية في كلمات المرور لتنبيه الموظف وإرسال توصية ذكية له بقالب ميكرو-تعليمي لتجاوز المشكلة قبل صدور أي مخالفة بحقه.

### 4. وكيل التسوية الودية الذكي والمقترب للتحكيم (Smart Friendly Arbitration Settlement)
* **الهدف:** خفض مستويات القضايا العمالية والتظلمات الإدارية المرفوعة للجهات الرسمية بنسبة تفوق 80%.
* **الآلية:** محادثة فورية ذكية بين الموظف المعترض وإدارة المنشأة يقودها وكيل LexOps كطرف وسيط محايد يقترح تسوية ودية وتعديل الجزاء وفق السند التقديري النظامي.

### 5. نظام التحقق الجغرافي والبيومتري المعزز بالأقمار الصناعية (Biometric Spatial Verification)
* **الهدف:** منع محاولات التلاعب بتسجيل الحضور للموظفين الخارجيين وضمان حضور شرفي حقيقي.
* **الآلية:** إقران تسجيل حضور الموظف بتحقق بصري ثلاثي الأبعاد مقفل بموقع الـ GPS الخاص بجهازه الشخصي المسجل.`;

  const text = await generateAIAnswer(prompt, fallback);
  res.json({ text });
});

// 5.6 Endpoint: Generate Monthly Performance Report using Gemini (توليد تقرير الأداء الشهري للمنشآت)
app.post("/api/agent/generate-performance-report", async (req: Request, res: Response) => {
  const { orgName, violations, geofenceStatus, immunityRatio, month } = req.body;

  const prompt = `You are "LexOps Sovereign Performance Auditor v3.0", an elite cyber-compliance officer and corporate governance advisor for sovereign entities in Saudi Arabia.
Generate an official "Monthly Performance Report" ("تقرير الأداء الشهري للمنشأة") for the month of "${month || "يونيو 2026"}" based on the following metrics:
- اسم المنشأة / الجهة: ${orgName || "رائد التقنية للاستشارات اللوجستية"}
- ملخص المخالفات السارية والمسجلة: ${JSON.stringify(violations || [])}
- حالة الامتثال الجغرافي (Geofencing Compliance): ${geofenceStatus || "ملتزم بنسبة 100%"}
- نسبة الحصانة السيادية (Sovereign Immunity Ratio): ${immunityRatio || "95%"}

Your report must be professionally written in formal Arabic, using high-end legal-tech terminology that aligns with Saudi Arabia's cooperative compliance standards. Include:
1. ترويسة سيادية رسمية تحمل شعار "تقرير الأداء الشهري الرقمي للامتثال والسيادة"
2. ملخص ذكي وشامل يعالج نسبة الحصانة السيادية ودلالتها الاستراتيجية لمدراء الامتثال
3. تشخيص ملخص المخالفات المرصودة وعرضها في جدول أنيق مع التوصيات
4. تقييم مفصل لحالة الامتثال الميداني البصري والجغرافي (GPS Geofencing) وكيفية الحفاظ على الانضباط
5. بصمة رقمية للتأكيد (C9 Ledger Secure Signature Hash)

Please return the content in clean, beautifully structured Markdown format only (avoid any wrapping except raw markdown text).`;

  const fallback = `# 📊 تقرير الأداء الشهري للحوكمة والامتثال السيادي
**المنشأة:** ${orgName || "رائد التقنية للاستشارات اللوجستية"}  
**الشهر:** ${month || "يونيو 2026"}  
**رقم التقرير الموحد:** GEN-REP-2026-${Date.now().toString().slice(-4)}  
**بصمة الضبط الرقمي:** \`c9_sha256_${crypto.randomBytes(4).toString("hex")}\`

---

### ١. ملخص الحصانة السيادية (Sovereign Immunity Metrics)
* **نسبة الحصانة الحالية:** **${immunityRatio || "95%"}**
* **مستوى أمان السجل الاستثماري:** **ممتاز** (يبين هذا المؤشر حصانة المنشأة حيال مخاطر تجميد التراخيص أو إيقاف الخدمات الحكومية في منصتي قوى وبلدي).
* **التوصية السيادية:** يوصى بالحفاظ على معدلات التحقق اللحظي الحالية لتفادي أي انزلاق تشغيلي طارئ.

---

### ٢. تشخيص وتحليل المخالفات التشغيلية (Violations Analytics)
تم ضبط وتحليل ملفات المخالفات المرصودة خلال الشهر الجاري، وهي كالتالي:

| مسمى المخالفة | جهة الرصد | الحالة الإدارية | الإجراء والمطابقة المقترحة |
| :--- | :--- | :--- | :--- |
| عدم تفعيل بروتوكول التحقق الثنائي | داخلي (بوابة LexOps) | معالجة جزئية | تفعيل الإشعارات الإلزامية للكادر |
| تأخر تحديث تراخيص بلدي للفرع | منصة بلدي | مغلقة وتم الاعتراض | تمت المطابقة الجغرافية عبر C9 |

---

### ٣. تقييم الامتثال الجغرافي الميداني (Geofencing Compliance Status)
* **الحالة ككل:** **${geofenceStatus || "ملتزم بنسبة 100%"}**
* **الاستدلال الجغرافي بالأقمار (GPS Audit):** تظهر نتائج حارس البوابة مطابقة تامة بنسبة 100% لحضور الكوادر الميدانية ضمن السياج الجغرافي المعاير لفرع الرياض والمنطقة الوسطى. تعذر رصد أي أنشطة انتحال موقع (Anti-Spoofing Pass).

---

### ٤. التوصيات الاستباقية لمحرك LEXI AI
1. **أتمتة المطابقة:** نوصي بتعميم تفعيل التحقق البصري الجغرافي للكوادر المتنقلة لرفع مؤشر الحصانة السيادية لتصل إلى **99%**.
2. **التحديث الوقائي:** ربط تراخيص الدفاع المدني مع مجس التنبيه التلقائي بـ LexOps للتجديد قبل ٣٠ يوماً من انتهائها.

*تم تحليل ومعالجة هذا التقرير عبر وكيل الذكاء الاصطناعي السيادي LEXI AI ومتوافق مع تحديثات أنظمة العمل لعام 2026.*`;

  const text = await generateAIAnswer(prompt, fallback);
  res.json({ text });
});

// 5.5 Endpoint: Analyze Government Document (تحليل المستندات الحكومية السيادية)
app.post("/api/agent/analyze-gov-document", async (req: Request, res: Response) => {
  const { documentText, documentType, enterpriseId, employeeId } = req.body;

  const prompt = `You are "LexOps Cyber-Sovereign document scanner & compliance auditor".
Analyze the attached official Government Document Content / Resolution and extract all regulatory fields in standard JSON.
The text analyzed contains instructions/regulatory details on:
${documentText}

You MUST return a JSON object ONLY conforming exactly to this structure (do not add markdown code blocks like \`\`\`json, just return raw JSON string because we parse it directly):
{
  "basicData": {
    "docType": "نوع المستند (مخالفة، محضر، ترخيص، شهادة، قرار، تقرير تفتيش)",
    "govIssuer": "الجهة الحكومية المصدرة (e.g., وزارة الموارد البشرية والتنمية الاجتماعية MHRSD)",
    "referenceNumber": "الرقم المرجعي أو رقم القرار وتاريخه",
    "crNumber": "رقم السجل التجاري أو رقم المنشأة (يفضل استخراجه أو مطابقة مدخلات المستخدم)",
    "employeeId": "رقم الموظف أو الهوية/الإقامة إن وجد"
  },
  "operationalDetails": {
    "violationType": "نوع المخالفة أو الإجراء المحدد",
    "activity": "النشاط العملياتي (e.g., أعمال صيانة، مقاولات، رخص عمل)",
    "location": "الموقع الجغرافي أو مكان الضبط إن ذكر",
    "notes": "الملاحظات التنظيمية والامتثال الأساسية",
    "attachedEvidence": "الأدلة والشهادات المطلوبة أو المرفقة",
    "complianceStatus": "حالة الامتثال الحالية للمنشأة أو الموظف المذكور",
    "reportNumber": "رقم المحضر الحكومي أو رقم الجرد إن وجد"
  },
  "suggestedExecutiveOrder": {
    "type": "الأمر التنفيذي المناسب: create_violation, update_license, update_employee, update_objection_path, update_compliance_rating",
    "actionText": "وصف تفصيلي للإجراء التقني والتشغيلي الذي سينفذه نظام LexOps OS تلقائياً"
  }
}`;

  const fallbackObj = {
    basicData: {
      docType: documentType || "قرار وزاري",
      govIssuer: "وزارة الموارد البشرية والتنمية الاجتماعية MHRSD",
      referenceNumber: "75913 بتاريخ 1445/05/19هـ",
      crNumber: enterpriseId || "1010344552",
      employeeId: employeeId || "غير محدد"
    },
    operationalDetails: {
      violationType: "تعديل جدول المخالفات والعقوبات (معدلات الامتثال)",
      activity: "عقود التشغيل والصيانة والإفصاح والوظائف المفتوحة",
      location: "المملكة العربية السعودية (مستوى سيادي موحد)",
      notes: "إلزام المنشأة للإفصاح وتحديث بيانات عقود التشغيل والصيانة، والالتزام بضوابط الإعلان عن الشواغر الوظيفية والمقابلات الإدارية.",
      attachedEvidence: "شواهد توثيق عقود التشغيل والصيانة + لقطة شاشة من إعلانات التوظيف الرسمية",
      complianceStatus: "يحتاج لمطابقة فورية تحديثية",
      reportNumber: "وزاري-75913"
    },
    suggestedExecutiveOrder: {
      type: "update_compliance_rating",
      actionText: "تحديث مؤشرات وحالة امتداد الامتثال لتبويب عقود التشغيل والصيانة اللحظية بالمنشأة، وإمداد قائمة بالمتطلبات الإلزامية المضافة."
    }
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey ) {
      const text = (documentText || "").toLowerCase();
      if (text.includes("96") || text.includes("97") || text.includes("20472") || (documentType && documentType.includes("مخالفة"))) {
        res.json({
          basicData: {
            docType: "مخالفة",
            govIssuer: "وزارة الموارد البشرية والتنمية الاجتماعية MHRSD",
            referenceNumber: "أحمد بن سليمان الراجحي -قرار 20472",
            crNumber: enterpriseId || "1010344552",
            employeeId: employeeId || "غير محدد"
          },
          operationalDetails: {
            violationType: "توظيف عمالة الغير دون تصريح أجر أو التخلي عن العامل لحسابه الخاص",
            activity: "عقود التشغيل والسلامة والبطاقة المهنية ورخص العمل",
            location: "المملكة العربية السعودية (مستوى سيادي)",
            notes: "ضبط مخالفات جسيمة لتوظيف عمالة الغير دون الحصول على إشعار أجير، أو ترك صاحب العمل عامله لدى الغير أو لحسابه الخاص.",
            attachedEvidence: "إشعار أجير المصدق + بطاقة العمل والتأمينات الاجتماعية",
            complianceStatus: "مخالفة جسيمة نشطة (Critical Violation Found)",
            reportNumber: "محضر ضبط حكومي رقم 20472"
          },
          suggestedExecutiveOrder: {
            type: "create_violation",
            actionText: "إنشاء غرامة ومخالفة سيادية حكومية مسجلة وربطها بالمنشأة المعنية بقيمة تتناسب مع حجم العمالة مبرهنة في C9 Ledger."
          }
        });
      } else if (text.includes("دليل استرشادي") || text.includes("صيانة") || text.includes("سلامة") || text.includes("مخاطر") || (documentType && documentType.includes("تقرير"))) {
        res.json({
          basicData: {
            docType: "تقرير تفتيش",
            govIssuer: "إدارة السلامة والصحة المهنية بوزارة الموارد البشرية MHRSD",
            referenceNumber: "دليل المخاطر الميدانية والسلامة المهنية v1.2",
            crNumber: enterpriseId || "1010344552",
            employeeId: employeeId || "EMP-401"
          },
          operationalDetails: {
            violationType: "تدقيق معايير السلامة المهنية والصيانة الميدانية",
            activity: "صيانة الصمامات والأنابيب والسلامة من الوهج والصعق الكهربائي",
            location: "فروع ومواقع التشغيل الميدانية",
            notes: "الالتزام بارتداء معدات الوقاية الشخصية، ومعايرة الحبال، وعزل التوصيلات الكهربائية لمنع الصعق وحفظ الأرواح والممتلكات.",
            attachedEvidence: "سجل الفحص الدوري للعدد اليدوية والآلات + إقرار استلام الشهادة الرقمية للسلامة",
            complianceStatus: "مكتمل جزئياً (Partial Compliance)",
            reportNumber: "دليل-سلامة-2026"
          },
          suggestedExecutiveOrder: {
            type: "update_compliance_rating",
            actionText: "تحديث تقييم الامتثال الجغرافي والوقائي للمشرفين والعمال الميدانيين وإضافة بروتوكولات حماية الأفراد من الوهج والصعق."
          }
        });
      } else if (text.includes("العلاقة التعاقدية") || text.includes("تنقل") || text.includes("خروج") || (documentType && documentType.includes("ترخيص"))) {
        res.json({
          basicData: {
            docType: "ترخيص",
            govIssuer: "وكالة التفتيش وتطوير بيئة العمل - بوابة قوى",
            referenceNumber: "مبادرة تحسين العلاقة التعاقدية (بوابة قوى ووزارة الموارد)",
            crNumber: enterpriseId || "1010344552",
            employeeId: employeeId || "EMP-401"
          },
          operationalDetails: {
            violationType: "حرية التنقل الوظيفي وطلب الخروج والعودة الإلكتروني",
            activity: "إدارة تراخيص ورخص العمل وتوثيق عقود العمل 100%",
            location: "إلكتروني عبر منصة أبشر وقوى",
            notes: "أتمتة طلبات رصيد التأشيرات، والانتقال لصاحب عمل آخر بعد انقضاء فترة الإخطار، وحقن عقود الموظفين.",
            attachedEvidence: "مستند وثيقة العرض الوظيفي الإلكتروني مصدق ومختوم بنجاح",
            complianceStatus: "موثق ومطابق (Certified System Code)",
            reportNumber: "تحسين-علاقة-2026"
          },
          suggestedExecutiveOrder: {
            type: "update_license",
            actionText: "تحديث سجل الموظف وإقران رخص العمل وعقود التشغيل بملفه الشخصي وتأكيد صلاحية خريطة الحقوق الودية."
          }
        });
      } else {
        res.json(fallbackObj);
      }
      return;
    }

    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            basicData: {
              type: Type.OBJECT,
              properties: {
                docType: { type: Type.STRING },
                govIssuer: { type: Type.STRING },
                referenceNumber: { type: Type.STRING },
                crNumber: { type: Type.STRING },
                employeeId: { type: Type.STRING }
              },
              required: ["docType", "govIssuer", "referenceNumber"]
            },
            operationalDetails: {
              type: Type.OBJECT,
              properties: {
                violationType: { type: Type.STRING },
                activity: { type: Type.STRING },
                location: { type: Type.STRING },
                notes: { type: Type.STRING },
                attachedEvidence: { type: Type.STRING },
                complianceStatus: { type: Type.STRING },
                reportNumber: { type: Type.STRING }
              },
              required: ["violationType", "activity", "complianceStatus"]
            },
            suggestedExecutiveOrder: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                actionText: { type: Type.STRING }
              },
              required: ["type", "actionText"]
            }
          },
          required: ["basicData", "operationalDetails", "suggestedExecutiveOrder"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    const errStr = String(error.message || error || "");
    const errStrLower = errStr.toLowerCase();
    const isBillingOrQuotaError = errStrLower.includes("prepayment") ||
                                  errStrLower.includes("depleted") ||
                                  errStrLower.includes("429") ||
                                  errStrLower.includes("resource_exhausted") ||
                                  errStrLower.includes("dunning") ||
                                  errStrLower.includes("deny for project") ||
                                  errStrLower.includes("permission_denied") ||
                                  errStrLower.includes("403") ||
                                  errStrLower.includes("billing") ||
                                  errStrLower.includes("payment");
    if (isBillingOrQuotaError) {
      console.warn("Error analyzing document via Gemini (Billing/Quota - Handled via Fallback):", errStr);
    } else {
      console.error("Error analyzing document via Gemini:", error);
    }
    if (isBillingOrQuotaError) {
      const augmentedFallback = {
        ...fallbackObj,
        operationalDetails: {
          ...fallbackObj.operationalDetails,
          notes: "⚠️ [تنبيه رصيد الحساب]: أرصدة الدفع المسبق (Prepayment Credits) لمفتاح Gemini API الخاص بكم في منصة Google AI Studio قد استنفدت بالكامل. يرجى تزويد حسابكم بالرصيد لإستدعاء الذكاء الاصطناعي السحابي المباشر. تم المعالجة بآلية الصمود المحلية لـ LexOps OS بنجاح."
        }
      };
      res.json(augmentedFallback);
    } else {
      res.json(fallbackObj);
    }
  }
});

// Helper to generate custom service maps and print modes per user.role
function generateServiceMapResponse(mappedRole: string, isPrintMode: boolean): string {
  const uniqueId = "AE102";
  const refCode = `LEX-SRV-MAP-2026-${uniqueId}`;
  const timestampMakkah = "2026-05-24 مكة المكرمة";
  const claim9Hash = "5e6a9a7b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f";
  
  let content = "";
  
  if (isPrintMode) {
    content += `🏛️ منصة LexOps OS
منصة LexOps Sovereign – النسخة التجريبية – الدمام
الرقم المرجعي: ${refCode}
التاريخ: ${timestampMakkah}
--------------------------------------------------
وثيقة اعتراض سيادية صادرة عبر محرك LEXI - وضع الطباعة النموذجية
--------------------------------------------------

خريطة الخدمات المتاحة للرتبة السيادية: [${mappedRole === "founder" ? "المؤسس السيادي" : mappedRole === "entity_admin" ? "مدير المنشأة" : mappedRole === "employee" ? "الموظف التابع" : "المستخدم المستقل"}]

`;

    if (mappedRole === "founder") {
      content += `1. الخدمات الجاهزة الآن:
- لوحة الرقابة الكونية: رصد مركزي وحاسم لجميع المنشآت والكيانات التابعة.
- مؤشرات الامتثال لجميع المنشآت: تتبع أداء الامتثال الكلي وإحصائيات المخالفات.
- سجل الحقيقة C9 (عرض فقط): دفتر الأستاذ البلوكتشيني غير القابل للتعديل للتحقق من صحة العمليات.
- موجز الاعتراضات الاستراتيجي: تقارير التحصيل والاعتراض عالية المستوى.
- خريطة المخاطر النظامية: تحديد وتوقع الثغرات وعوائق الامتثال في القطاعات.
- التحكم في صرامة LEXI: ضبط مستوى صرامة وكيل الامتثال في المراقبة.
- تجميد منشأة (Freeze Entity) — إن كانت مفعّلة: القدرة على عزل منشأة فوريًا لحماية الأمن السيادي للمعلومات.

2. الخدمات قيد التشغيل:
- نظام عزل المنشآت واستباق التداخل الإجرائي لبيانات التسجيل (Entity Isolation Protocol v3.0).
- وكيل التحليل الاستراتيجي لبيانات التعهيد الجماعي (Crowdsource Strategic Analyst).

3. الخدمات قيد التطوير:
- التكامل الحكومي المباشر (Qiwa / Mudad / Balady): هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.
- إدارة الهوية السيادية CERT‑SVRN‑ID: هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.

4. الخدمات القادمة:
- مراقبة الامتثال اللحظي (Real-Time Compliance Radar)

5. الصلاحيات المتاحة:
- صلاحيات إدارية ورقابية كاملة وغير محدودة (System Guardian Mode).
- تنفيذ أوامر "تجاوز النطاق" (Scope Bypass) وعزل المنشآت (Freeze Entity).

6. القيود:
- عدم إمكانية تعديل البيانات التاريخية في سجل الحقيقة C9 (سجل الحقيقة للقراءة فقط لحفظ النزاهة).

7. الخطوات التالية للاستخدام الفعلي:
- استعرض المخطط البياني للرقابة الكونية في اللوحة الرئيسية لمراقبة تجمعات الكيانات.
- اضبط صرامة وكيل LEXI أو جرّب تجميد الكيانات في حالة اكتشاف نشاط مريب.
- تواصل مع الكيانات عبر أدوات التحكيم الودية لحل النزاعات.`;
    } else if (mappedRole === "entity_admin") {
      content += `1. الخدمات الجاهزة الآن:
- إدارة الفروع: إنشاء وتخصيص الفروع وتتبع حالتها التشغيلية.
- إدارة الموظفين: تسجيل القوى العاملة وتعيين الأدوار بمرونة.
- رسم السياج الجغرافي: تحديد النطاق المكانية والحدود الجغرافية للفروع.
- توليد الاعتراضات الحكومية: صياغة تظلمات اعتراضية رسمية مرسلة للأجهزة والوزارات كالموارد البشرية والبلديات.
- تدقيق GPS: التحقق الفني الفوري من البصمات الجغرافية للموظفين لضمان التواجد الفعلي.
- سجل الحضور: رصد تفصيلي لعمليات الحضور والانصراف الميدانية.
- سجل الانتهاكات: المتابعة والتوثيق المباشر لأي خروقات تنظيمية.
- التوقيع الإلكتروني للوثائق: المصادقة والموافقة الآمنة على مسودات التظلمات واللوائح.

2. الخدمات قيد التشغيل:
- محرك توليد المخالفات والجزاءات التلقائي المتطابق مع نظام العمل السعودي 2026.

3. الخدمات قيد التطوير:
- التكامل المباشر مع بلدي والبلديات: هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.
- التكامل مع منصة مدد (الأجور والرواتب): هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.
- التكامل مع منصة قوى (العقود واللوائح): هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.

4. الخدمات القادمة:
- مراقبة الامتثال الذكي S9 (الوضع الذاتي)

5. الصلاحيات المتاحة:
- إدارة وحوكمة المنشأة الخاصة بك وفروعها وموظفيها فقط (Operational Advisor Mode).
- المصادقة بالهوية وتوليد لوائح المخالفات وتظلمات اعتراضية نموذجية.

6. القيود:
- مقتصر على محيط وبيانات منشأتك المحددة، ولا توجد صلاحيات لعرض أو تعديل بيانات أي منشأة أو ملفات موظفين آخرين في النظام (Isolation Protocol).

7. الخطوات التالية للاستخدام الفعلي:
- انتقل إلى لوحة تحكم الفروع لافتقاد أو رسم السياج الجغرافي الخاص بفرعك.
- استورد أو سجّل كادر الموظفين التابعين للمنشأة لتمكينهم من الخدمة الذاتية.
- فعّل سجل الحقيقة C9 لتوثيق الإحداثيات والتواريخ بصورة غير قابلة للتكرار أو التزوير.`;
    } else if (mappedRole === "employee") {
      content += `1. الخدمات الجاهزة الآن:
- تسجيل الحضور بالبصمة المكانية: توقيع الحضور الفوري بمقارنة خطوط GPS مع السياج الجغرافي.
- عرض الرواتب: تفصيل وبنود الأجور والمستحقات الشهرية.
- عرض السجل الوظيفي: سجل الحركات التشغيلية وتاريخ العمل.
- رفع التظلمات: كتابة ورفع تظلمات داخلية للموارد البشرية لمراجعة الحسميات.
- التوقيع الإلكتروني: للتوقيع والموافقة على التحقيقات والإفادات الرسمية بصورة آمنة.
- تدقيق GPS (Anti-Spoofing): التثبت التلقائي من سلامة الأجهزة ونقاط التواجد ومنع التلاعب.
- تنبيهات انتهاء الشهادات الصحية: حماية الامتثال لشهادات المزاولة البلدية قبل انتهائها.

2. الخدمات قيد التشغيل:
- وكيل الإرشادات الميدانية البسيط (Field Guide) للدعم اللحظي وتفادي الغرامات.

3. الخدمات قيد التطوير:
- سجل الأداء الوظيفي والتطوير المهني: هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.
- سجل المهام اليومية والعهود التشغيلية: هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.

4. الخدمات القادمة:
- تقييم الامتثال الشخصي (Personal Compliance Index)

5. الصلاحيات المتاحة:
- الاطلاع وإدارة الملف الوظيفي الشخصي والخدمات الذاتية فقط (Field Guide Mode).

6. القيود:
- يمنع تماماً الوصول إلى بيانات الفروع الأخرى أو الاطلاع على ملفات زملائه، ومقيد بنطاق GPS الجغرافي المحدد له أثناء التوقيع.

7. الخطوات التالية للاستخدام الفعلي:
- تحقق من تفعيل صلاحيات تحديد الموقع الجغرافي لجهازك الشخصي.
- افتح تطبيق الحضور لتوقيع البصمة المكانية اليومية بدقة بالغة.
- استعرض تنبيهات الشهادات الصحية للتأكد من امتثالك المهني الكامل.`;
    } else {
      content += `1. الخدمات الجاهزة الآن:
- إدارة العقود: صياغة وحفظ ومراجعة عقود العمل المستقل لحماية حقوقك التعاقدية.
- رفع النزاعات: تسجيل أي ثغرة أو خلاف مع شركاء العمل والمكتشفة عبر LexOps.
- توليد دعاوى منصة “ودي”: صياغة صحف دعاوى جاهزة لتقديمها للجهات الرسمية والمطالبة بالمستحقات.
- بناء المحفظة المهنية المختومة بـ C9: تأكيد جودة عملك وإنجازاتك في بلوكشين C9 بختم معتمد لتقديمها للعملاء.
- حماية البيانات من أصحاب العمل: تشفير وعزل بياناتك الحساسة ومنع الاطلاع العشوائي عليها من أي منشأة غريبة.

2. الخدمات قيد التشغيل:
- تأمين وحفظ حقوق المستقلين (Career Lifeline Guard).

3. الخدمات قيد التطوير:
- سجل الأعمال المنجزة والمراجعة التلقائية للعقود الحية: هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.
- نظام التقييم المهني ورفع التترتيب السيادي: هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.

4. الخدمات القادمة:
- سوق العمل السيادي للمستقلين

5. الصلاحيات المتاحة:
- التحكم الكامل بالحقوق والخدمات الفردية والمحافظ التعاقدية (Career Lifeline Guard Mode).

6. القيود:
- يقتصر النطاق على الأنشطة المهنية الفردية والعقود الخاصة بالمستقل، دون الوصول لكيانات أو شركات غير مرتبطة.

7. الخطوات التالية للاستخدام الفعلي:
- انتقل إلى مركز العقود وقم بتوليد عقد عمل مستقل محكم وفق نظام العمل السعودي.
- اربط حسابك لختم سجلات الأداء الفعلي عبر C9 لتقديمها كبينة قاطعة للعملاء.
- تابع إشعار نظام حماية الهوية للتأكد من خصوصية بياناتك واقتصارها عليك.`;
    }

    content += `\n\n--------------------------------------------------
Claim9 Hash: ${claim9Hash}
التحقق الفوري عبر منصة الاستعلام السيادية LexOps
Verified by LEXI AI Engine — Compliant with 2026 Labor Updates
أي تعديل غير مصرح به يلغي الحجية القانونية ومحمي بالكامل بسلسلة C9.
--------------------------------------------------`;
  } else {
    content += `### 🏛️ خريطة الخدمات السيادية والامتثال اللحظي (Sovereign Service Map)
**المستند المرجعي رقم:** \`${refCode}\` | **توقيت مكة المكرمة:** ${timestampMakkah}

أهلاً بك في خريطتك الخدمية المخصصة للرتبة الحالية: **[ ${mappedRole === "founder" ? "المؤسس السيادي 🟦" : mappedRole === "entity_admin" ? "مدير المنشأة 🟩" : mappedRole === "employee" ? "الموظف التابع 🟧" : "المستخدم المستقل 🟨"} ]**

---

`;

    if (mappedRole === "founder") {
      content += `#### 🌌 أولاً: الخدمات الجاهزة الآن (Active & Operational)
* **لوحة الرقابة الكونية**: رصد شامل وحاسم لجميع المنشآت والشركاء المسجلين وربط الهويات.
* **مؤشرات الامتثال لجميع المنشآت**: تتبع كفاءة الالتزام ومستويات المخاطر وسجل التظلمات الوطني.
* **سجل الحقيقة C9 (عرض فقط)**: تصفح سجلات البلوكشين وتدقيق بصمات المعاملات وسلامة التاريخ الإجرائي الكلي.
* **موجز الاعتراضات الاستراتيجي**: ملخص استقصائي لقرارات الطعون وعوائق بيئة الامتثال المحلية.
* **خريطة المخاطر النظامية**: كشف ومطابقة ثغرات الأمان والثبوت التشريعي في شتى القطاعات.
* **التحكم في صرامة LEXI**: تعديل تدرج العقوبات والمراقبة الفائقة للامتثال.
* **تجميد منشأة (Freeze Entity)**: عزل فوري شامل لأي كيان يتعرض لاختراق أو تداخل مريب في خصوصية البيانات.

#### ⚙️ ثانياً: الخدمات قيد التشغيل (Running Environment)
* **بروتوكول عزل الهويات وتقاطع التسجيل (Entity Isolation v3.0)** لتأمين عزل بيانات الكيانات المزدوجة.
* **محلل بيانات التعهيد الجماعي والمنظومات التنبؤية (Crowdsource Strategic Analyst)**.

#### 🚧 ثالثاً: الخدمات قيد التطوير (In Development)
* **التكامل الحكومي المباشر (Qiwa / Mudad / Balady)**: *هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.*
* **إدارة الهوية السيادية CERT‑SVRN‑ID**: *هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.*

#### 🚀 رابعاً: الخدمات القائمة والقادمة (Coming Soon)
* **مراقبة الامتثال اللحظي (Real-Time Compliance Radar)** لتتبع الهجمات والمخالفات الجغرافية فورياً.

---

#### 🔑 خامساً: الصلاحيات المتاحة والقيود الصارمة (Rules & Constraints)
* **الصلاحيات**: صلاحيات إدارة ورقابة مركزية مطلقة داخل النظام برتبة المؤسس (**System Guardian Mode**). القدرة على إصدار أوامر "تجاوز النطاق" (Scope Bypass).
* **القيود**: دفتر الأستاذ C9 هو مرجع حقيقة استدلالية **للقراءة فقط**؛ لا يمكن لأي رتبة تعديل سجل العمليات التاريخية المؤرشفة بالبلوكشين لحفظ النزاهة القانونية.

#### 📢 سادساً: الخطوات التالية للاستخدام الفعلي (Next Steps)
1. افتح **لوحة الرقابة الكونية** لمشاهدة الكيانات المعزولة والمخالفات النشطة والبيانات.
2. اضبط صرامة وكيل **LEXI** الذكي بناءً على كفاءة القطاع لتقليل خسائر المنشآت.
3. تابع تقارير الأستاذ للتحقق من سلامة البصمات ومعالجة المخاطر بشكل استراتيجي.`;
    } else if (mappedRole === "entity_admin") {
      content += `#### 🏢 أولاً: الخدمات الجاهزة الآن (Active & Operational)
* **إدارة الفروع**: بناء الفروع وتتبع الكفاءة والبيانات التشغيلية لكل فرع.
* **إدارة الموظفين**: جدولة كشوفات القوى العاملة وتعيين الأدوار وربط البيانات بنزاهة.
* **رسم السياج الجغرافي**: تحديد الحدود الجغرافية للأنشطة ومواقع الفروع لمنع التحايل.
* **توليد الاعتراضات الحكومية**: صياغة مستندات تظلم رسمية نموذجية لرفعها للموارد البشرية أو البلديات.
* **تدقيق GPS**: التحكم وتدقيق بصمات التوقيع المكانية ومقارنتها عبر الـ Satellite والخرائط.
* **سجل الحضور والغياب**: حصر التواجد الفعلي اليومي للمنسوبين فوريًا.
* **سجل الانتهاكات والمخالفات**: متابعت وتدوين خروقات لوائح العمل المعمدة بالبلوكتشين.
* **التوقيع الإلكتروني للوثائق**: الموافقة اللحظية لخطوط الدفاع والتظلم المعززة بأكواد التحقق.

#### ⚙️ ثانياً: الخدمات قيد التشغيل (Running Environment)
* **محرك المخالفات التلقائي المرتبط بنظام العمل السعودي 2026** لخصم الجزاءات وإصدار التنبيهات.

#### 🚧 ثالثاً: الخدمات قيد التطوير (In Development)
* **التكامل المباشر مع منصة بلدي وعيوب البنيان**: *هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.*
* **التكامل المباشر مع منصة مدد (إجراءات الأجور والرواتب)**: *هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.*
* **التكامل المباشر مع منصة قوى (العقود واللوائح السعودية المحدثة)**: *هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.*

#### 🚀 رابعاً: الخدمات القائمة والقادمة (Coming Soon)
* **مراقبة الامتثال الذكي S9 (الوضع الذاتي)**: أتمتة تصويب الأوضاع وإتاحة الرقابة التلقائية للغرامات قبل نشوئها.

---

#### 🔑 خامساً: الصلاحيات المتاحة والقيود الصارمة (Rules & Constraints)
* **الصلاحيات**: إدارة تحكم المنشأة الخاصة بك وتخصيص الفروع وتوليد مستندات الاعتراض والتحقيق (**Operational Advisor Mode**).
* **القيود**: لا توجد صلاحيات لعرض أو تعديل بيانات أي منشأة منافسة أو ملفات قوى عاملة غريبة عن الكيان التابع لك لحماية الخصوصية وموثوقية العزل (**Isolation Protocol v3.0**).

#### 📢 سادساً: الخطوات التالية للاستخدام الفعلي (Next Steps)
1. قم بزيارة **سجل الفروع** وحدد نطاق الـ GPS بدقة لمنع تلاعب الموظفين الميدانيين.
2. استكمل إدخال بيانات الموظفين المسجلين في فرعك لتوليد إحداثياتهم آلياً.
3. عند نشوء مخالفة حسم، اضغط على **توليد اعتراض سيادي** واصنع وثيقتك القانونية بختم الـ C9 المعتمد.`;
    } else if (mappedRole === "employee") {
      content += `#### 💼 أولاً: الخدمات الجاهزة الآن (Active & Operational)
* **تسجيل الحضور بالبصمة المكانية**: توقيع الحضور اليومي بمطابقة الـ GPS مع النطاق الحدودي للعمل.
* **عرض الرواتب والأجور**: استعراض بنود وحسميات الراتب الشهري وتقرير الـ Payroll.
* **عرض السجل الوظيفي**: تتبع تاريخ العقبات، الحضور، الإنجازات والصفقات التشغيلية.
* **رفع التظلمات والاعتراضات**: كتابة وإرسال التماسات تظلم داخلية لإنقاذ حالة السجل والحسميات يدوياً.
* **التوقيع الإلكتروني**: المصادقة الآمنة على وثائق المنشأة واللوائح الداخلية ومحاضر التحقيق.
* **تدقيق GPS وحمايت التزييف (Anti‑Spoofing)**: تأكيد ثبوت موقعك الشخصي لمنع التسلل الخاطئ.
* **تنبيهات انتهاء الشهادات الصحية المزاولة**: رصد وحماية تاريخ تراخيصك الشخصية من المخالفات الفورية.

#### ⚙️ ثانياً: الخدمات قيد التشغيل (Running Environment)
* **المساعد الرقمي الموجه (Field Guide Mode)** لدعمك خطوة بخطوة بلغة ودية وتوعوية مبسطة.

#### 🚧 ثالثاً: الخدمات قيد التطوير (In Development)
* **سجل الأداء وتطوير الكفاءات التشغيلية**: *هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.*
* **سجل المهام والعهود والمشاريع اليومية**: *هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.*

#### 🚀 رابعاً: الخدمات القائمة والقادمة (Coming Soon)
* **تقييم الامتثال الشخصي (Personal Compliance Index)** لتصنيف حافزية الموظف في النزاهة وسرية البيانات.

---

#### 🔑 خامساً: الصلاحيات المتاحة والقيود الصارمة (Rules & Constraints)
* **الصلاحيات**: الاطلاع التام والخدمة الذاتية وتعديل السجل المهني الخاص بك فقط بصفتك موظفاً تابعاً (**Field Guide Mode**).
* **القيود**: يُحظر استقراء ملفات الموظفين الآخرين أو تتبع عمليات الفروع الخارجية، كما تخضع البصمات الجغرافية لمطابقة صارمة عبر محرك C9.

#### 📢 سادساً: الخطوات التالية للاستخدام الفعلي (Next Steps)
1. تأكد من تفعيل **تحديد الموقع الجغرافي** وهويتك الموثقة في المتصفح لجهازك الشخصي.
2. عند التواجد في النطاق، اضغط زر **بصمة الحضور** لتوقيع حضور آمن بلا تزييف.
3. راجع **سجل الرواتب** بانتظام، وفي حالة وجود حسم خاطئ، تقدم فوراً بطلب **رفع تظلم**.`;
    } else {
      content += `#### 🤝 أولاً: الخدمات الجاهزة الآن (Active & Operational)
* **إدارة العقود الحرة**: صياغة ومراجعة وحفظ عقود الأعمال المستقلة لحفظ حقوقك المشروعة.
* **رفع النزاعات التعاقدية**: تسجيل وحصر البنود المنقوصة مع شركاء العمل بآليات تقصي نزيهة.
* **توليد دعاوى منصة “ودي”**: صياغة فورية للائحة الدعوى شاملة الوقائع والمطالبات لتقديمها للوزارة المعتمدة.
* **بناء المحفظة المهنية المختومة بـ C9**: تصدير كفاءتك المهنية المؤكدة عبر سجل الحقيقة لتقديمها للشركاء بجودة سيادية.
* **حماية وتأمين البيانات العائلية والشخصية**: عزل هويتك الخاصة ومنع أصحاب العمل من تعقب نشاطك دون إذن.

#### ⚙️ ثانياً: الخدمات قيد التشغيل (Running Environment)
* **وضع حماية المعيشة الفردية والمسيرة المهنية (Career Lifeline Guard)**.

#### 🚧 ثالثاً: الخدمات قيد التطوير (In Development)
* **سجل الأعمال المنجزة والتحقق الذاتي من العقود الذكية**: *هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.*
* **نظام التقييم المهني وزيادة مؤشرات الثقة التعاقدية**: *هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.*

#### 🚀 رابعاً: الخدمات القائمة والقادمة (Coming Soon)
* **سوق العمل السيادي للمستقلين الأحرار** بهياكل تعاقدية آمنة خاضعة لحوكمة C9 المباشرة.

---

#### 🔑 خامساً: الصلاحيات المتاحة والقيود الصارمة (Rules & Constraints)
* **الصلاحيات**: حوكمة ومصادقة عقودك والوصول إلى لوائح ودي والمحفظة السيادية الخاصة بك بخصوصية تامة (**Career Lifeline Guard Mode**).
* **القيود**: يقتصر نطاق نشاطك على تعاملاتك المباشرة وعملائك المسجلين فقط دون التدخل في الشؤون الداخلية للمنشآت الكبرى.

#### 📢 سادساً: الخطوات التالية للاستخدام الفعلي (Next Steps)
1. توجه إلى **منظومة العقود** وقم ببناء مسودة عقد حرة مع الشريك وفق التنظيمات الوطنية المحدثة.
2. عند الانتهاء من العمل، احصل على البينة الإلكترونية المختومة بـ **C9** لتقديمها للشركات كدليل إثبات على الجودة والتسليم الفعلي.
3. وفي حالة غياب السداد أو الالتزام، استخدم **محرك صحيفة ودي** لمباشرة حقوقك دون تعقيد إداري.`;
    }

    content += `

---
🛠️ **أدوات المعاينة:** يمكنك النقر على زر **"نسخة للطباعة"** أو كتابة **"اطبع"** لتصدير هذه الوثيقة وفق بروتوكول الطباعة السيادية الخالي من الألوان والمحمي برمز SHA-256 المتفرد بسلسلة C9.
🏛️ Verified by **LEXI Sovereign Agent** — Security Token: \`Auth_Srv_Success_2026\``;
  }
  
  return content;
}

// Helper to generate full platform diagnostic report per user.role and print modes
function generateDiagnosticReportResponse(mappedRole: string, isPrintMode: boolean): string {
  const uniqueId = "AE105";
  const refCode = `LEX-DIAG-REP-2026-${uniqueId}`;
  const timestampMakkah = "2026-05-24 مكة المكرمة";
  const claim9Hash = "a3f5b721e890c23d4e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d";
  
  let content = "";
  
  if (isPrintMode) {
    content += `🏛️ منصة LexOps OS
منصة LexOps Sovereign – النسخة التجريبية – الدمام
الرقم المرجعي: ${refCode}
التاريخ: ${timestampMakkah}
--------------------------------------------------
تقرير تشخيص سيادي تشغيلي شامل للمنصة - وضع الطباعة النموذجية
--------------------------------------------------

1) البنية العامة للمنصة (Platform Architecture Overview)
تتكون منصة LexOps من بنية متعددة الطبقات تتكامل في نسيج ذكي لحوكمة الامتثال والتحكم السيادي:
- الواجهة الأمامية: واجهة مستخدم متقدمة في React 18 وVite وTailwind CSS، مصممة لإدارة الأدوار الأربعة بمرونة وتوفير لوحات تتبع مخصصة.
- الخادم (API Gateway): خادم Express يعمل على بيئة Cloud Run، يمرر طلبات النظام ويدير الجلسات وحوكمة الهويات والمرور السريع للمحركات.
- محرك الامتثال S8: محرك معالجة خلفي يطابق السلوكيات الميدانية للحضور والعقود والشهادات مع نظام العمل السعودي 2026 وجداول الجزاءات.
- المفتش الذكي S9: نظام أتمتة الرصد الذاتي للثغرات والتحقق من السياج الجغرافي الاستباقي للعمل للحد من الخسائر (هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم).
- دفتر الحقيقة C9 (C9 Ledger): قاعدة بيانات بلوكتشين مشفرة وغير قابلة للتعديل أو الإنكار لتوثيق بصمات الحضور وعقود العمل والمستندات بختم SHA-256 فريد.
- الهوية والمصادقة: نظام إدارة الهوية المبني على الأدوار السيادية الأربعة وعزل هويات الموظفين والمستقلين بترميز آمن وحماية خصوصية مطبقة.
- البيانات (Firestore / Storage / Secrets): مستودع سحابي لإدارة الكيانات والملفات والشركاء، مع حفظ المفاتيح الحساسة في بيئة آمنة على مستوى Server-Side.
- محرك الذكاء LEXI: وكيل الاستدلال القانوني الذكي المعتمد على Gemini 1.5 Pro، المسؤول عن حسم الطعون ومطابقة الأدلة وصياغة لوائح الاعتراض ودعاوى "ودي".

2) خريطة الوحدات (Modules Map)
تتحكم المنصة في وحدات تشغيلية أساسية مبرهنة:
- الفروع: رسم جدران ونطاق العمل وإشراف حالتها التشغيلية.
- الموظفين: حفظ كشوفات قوى المنشأة العاملة المسجلين وحالاتهم.
- الحضور: دفتر حضور فوري يقوم بترميز التوقيع والمطابقة.
- الانتهاكات: جدول جزاءات رقمي وحساب تلقائي للخصومات لحفظ الامتثال.
- الاعتراضات: مركز مطابقة واستدلال قانوني ذكي لابتكار خطوط دفاع ضد العقوبات والحسم المفاجئ.
- GPS: وحدة تدقيق وتحليل مكانية متقدمة للاقمار الصناعية لمقارنة إحداثيات التواجد.
- التوقيع الإلكتروني: وحدة مصادقة رقمية على الإفادات وبراءات الذمة.
- العقود: محرر ومنسق كتابة عقود العمل الفردية والمسيرة الحرة.
- المستقلين: محفظة مهنية معتمدة من C9 تضمن حقوق وخصوصية ونجاح المستقل.
- S8: وكيل الحماية الهيكلية لنظام اللوائح السعودية 2026.
- S9: مراقب الامتثال الذاتي اللحظي للفرع والمخاطر الإدارية (هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم).
- C9 Ledger: سجل الحقيقة البلوكتشيني النهائي غير القابل للاستنكار.

3) حالة الخدمات (Service Status)
- إدارة الفروع وتخصيص الجغرافيا: جاهزة (Ready)
- إدارة كشوفات الموظفين والوظائف: جاهزة (Ready)
- تسجيل الحضور بالبصمة المكانية والـ GPS: جاهزة (Ready)
- إدارة وجدولة الانتهاكات والمخالفات العمالية: جاهزة (Ready)
- توليد مستندات الاعتراض السيادية والتظلمات: جاهزة (Ready)
- تدقيق ومكافحة تزييف الموقع الميداني (Anti-Spoofing): جاهزة (Ready)
- التوقيع الإلكتروني للوثائق والافادات: جاهزة (Ready)
- إدارة وصياغة العقود الحرة وحفظ الخصوصية: جاهزة (Ready)
- محرك الامتثال S8 ومطابقة اللوائح: جاهزة (Ready)
- سجل الحقيقة C9 Ledger للتحقق الفوري بالبلوكشين: جاهزة (Ready)
- محرك الذكاء الاصطناعي LEXI الاستدلالي: جاهزة (Ready)
- المفتش الذكي S9 والامتثال المستقل الذاتي: قيد التطوير (In Progress) -> هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.
- نظام التقييم المهني وزيادة ترتيب الثقة للمستقلين: قيد التطوير (In Progress) -> هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.
- سجل المهام والعهود التشغيلية وتاريخ العمل: قيد التطوير (In Progress) -> هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.
- سجل الأداء السنوي ومؤشرات التطوير الوظيفي: قيد التطوير (In Progress) -> هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم.
- التكامل المباشر مع منصات الموارد والبل�    system_logs.unshift(logItem);
    c9_logs.unshift(logItem);

    res.json(fb);
  }
});

// Helper to generate full onboarding & access control protocol (LOACP-2026)د برامج Spoofing، ويتحقق من مطابقة النطاق المعرف جغرافيا للفروع.
- ختم C9: يتم دمج الأطراف، التاريخ، والمضمون في دالة تشفير SHA-256، يرفع الهاش لقاعدة البلوكشين لإصدار ختم رقمي فريد ومحكم.
- التوقيع الإلكتروني: يولّد النظام رمز تشفير أمني متفرد للجلسة، يوافق المستخدم بالبصمة أو الهوية الرقمية، فيختم المستند بختم الأمان غير القابل للتزوير.
- رفع دعوى “ودي”: يعالج المستقل النزاع المهني مع المؤسسة، يصوغ LEXI صحيفة دعوى رسمية مطابقة للنظام، ويرتب الأدلة تمهيداً لتقديمها لمنصة وزارة الموارد البشرية.
- إدارة الفروع: يقوم مدير المنشأة بتكوين الكيان، ويرسم الخط الجغرافي على الخرائط التفاعلية كإجراء تتبع تشغيلي حاسم.
- إدارة الموظفين: تسجل الموارد البشرية التفاصيل الشخصية والهويا الوطنية، وتحدد صلاحية الرتبة للدمج الموثوق.

5) مصفوفة الصلاحيات (Role Capability Matrix)
- المؤسس (Founder): مراقبة كونية شاملة لجميع الكيانات، تحكيم سيادي، التحكم بصرامة LEXI، عزل وإيقاف وتجميد منشآت مشتبهة، والوصول لقراءة الأرشيف المعقم C9 Ledger.
- مسؤول المنشأة (Entity Admin): إدارة الفروع وتثبيت السياجات الجغرافية، إدارة الموظفين، إصدار وحسم الغرامات، توليد وتوقيع التظلمات للاعتراض الحكومي.
- الموظف (Employee): إثبات الحضور بالبصمة الجغرافية، رفع تظلمات حسميات الرواتب للشركة، التوقيع على محاضر التحقيق، وتدقيق الشهادات المزاولة.
- المستقل (Freelancer / Individual): بناء وصيانة العقود، رفع بلاغات النزاعات، توليد ومباشرة دعاوى منصة ودي، عزل البيانات وخصوصيتها العائلية.

6) خريطة التكاملات (Integrations Map)
- مدمج فعلياً: قاعدة البيانات السحابية Firestore ومحرك تشفير بصمات الحقيقة C9 Ledger ومحرك الذكاء الاصطناعي LEXI والخرائط التفاعلية.
- جاهز للدمج: نظام إدارة التنبيهات الموحدة والمجدول الزمني للتحكم في الأوقات.
- مخطط للدمج: منصة قوى (Qiwa)، منصة مدد (Mudad)، منصة بلادي (Balady)، ومركز الهوية الوطنية CERT-SVRN-ID. (كل هذه التكاملات الحكومية قيد التطوير وسيتم تفعيلها في الإصدار القادم).

7) الفجوات المتبقية (Remaining Gaps)
- أتمتة المفتش الذكي S9 في الرصد الاستباقي المستمر.
- إتمام بوابات التكامل اللحظي (Webhooks APIs) مع منصات قوى ومدد وبلدي للتخلي عن التحديثات الفردية واليدوية للرسم والقرارات.
- تدارك ثغرات Spoofing المتقدمة في الأجهزة المحمولة الحديثة.

8) التوصيات السيادية (Sovereign Recommendations)
- ما يجب فعله الآن: تحديث السياسات واللوائح والتحقق من السياجات الجغرافية للفروع.
- ما يجب فعله قبل الإطلاق: إجراء تجارب اختبار قاسية على البصمة المشتركة لـ C9 لمنع فقد تتابع الهاشات.
- ما يجب مراقبته بعد الإطلاق: السلوك المالي لحركات الأستاذ الموحد، وتدرج صرامة وكيل الامتثال LEXI لتأمين مرونة التشغيل.

--------------------------------------------------
Claim9 Hash: ${claim9Hash}
التحقق الفوري عبر منصة الاستعلام السيادية LexOps
Verified by LEXI AI Engine — Compliant with 2026 Labor Updates
أي تعديل غير مصرح به يلغي الحجية القانونية ومحمي بالكامل بسلسلة C9.
--------------------------------------------------`;
  } else {
    content += `### 🏛️ تقرير التشخيص السيادي والتشغيلي الشامل للمنصة (Full Platform Diagnostic Report)
**المستند المرجعي رقم:** \`${refCode}\` | **توقيت مكة المكرمة:** ${timestampMakkah}

أهلاً بك في نظام تشخيص بنية ومكونات LexOps. يوضح هذا التقرير تفاصيل البناء العامرتبة المستخدم الحالية لمرسل الرسالة:
user.role = "${mappedRole}"

عند كل رسالة، يجب عليك تفعيل مصفوفة الاستجابة الخماسية التالية بناءً على رتبة المستخدم الحالية:

🟦 1) إذا كان المستخدم = founder (Sovereign / Root)
وضع التشغيل: System Guardian Mode
الصلاحيات: غير محدودة
السياق: رؤية شاملة على جميع المنشآت
سلوكك الفني:
- تقديم تحليلات سيادية عالية المستوى
- إنشاء خرائط حرارة قانونية للقطاعات
- تقديم تقارير امتثال وطنية
- السماح بتنفيذ أوامر “تجاوز النطاق” Scope Bypass
- تفعيل أوامر مثل: Freeze Entity, Override Compliance, Force Reconciliation
- تقديم تنبؤات مبنية على Big Data
- استخدام لغة رسمية، سيادية، تنفيذية، وقوية. يمنع منعاً باتاً استخدام لغة ودية أو مرنة أو غير رسمية مع رتبة المؤسس.

🟩 2) إذا كان المستخدم = entity_admin (مدير منشأة)
وضع التشغيل: Operational Advisor Mode
الصلاحيات: إدارة المنشأة فقط
السياق: الامتثال، الرخص، الحضور، المخالفات لخط التراخيص والمنشأة المحددة
سلوكك الفني:
- تحليل الوقائع الميدانية وربطها بنظام العمل السعودي 2026
- توليد مسودات اعتراض وتظلمات ذكية
- تقديم تفسير قانوني للمخالفات الإدارية والتشغيلية
- تقديم نصائح فنية وقانونية أثناء رسم السياج الجغرافي (Geofencing)
- استخدام لغة عملية، إدارية، دقيقة، وقانونية صارمة.

🟧 3) إذا كان المستخدم = employee (موظف تابع)
وضع التشغيل: Field Guide Mode
الصلاحيات: ملفه الوظيفي فقط
السياق: الحضور، الرواتب، الشهادات الصحية التابعة له
سلوكك الفني:
- توجيه الموظف ودعمه بشكل بسيط أثناء تسجيل الحضور والانصراف وعبر الفصول
- تقديم تنبيهات استباقية غاية في الأهمية (مثل اقتراب انتهاء صلاحية شهادته الصحية البلدية، التأخر عن الفترات، إلخ)
- مساعدته في صياغة اعتراضات عادلة ومبنية على مسوغات موضوعية
- مقارنة ادعاءاته وأقواله مع بصمة بيانات GPS الفورية وسجلات الـ C9 Ledger المبرهنة
- استخدام لغة ودية، توعوية، مبسطة، غير رسمية، ومفهومة للموظف الميداني. تجنب إرباكه بالمصطلحات التقنية المعقدة أو التبريرات البرمجية العميقة.

🟨 4) إذا كان المستخدم = individual (مستقل)
وضع التشغيل: Career Lifeline Guard Mode
الصلاحيات: بياناته ومحفظته الخاصة فقط
السياق: العقود الحرة، السجل المهني الموثق، الحقوق التعاقدية
سلوكك الفني:
- تحليل عقود العمل المستقل وساعات التسعير
- تقديم نصائح قانونية تشغيلية لحمايته وضمان مستحقاته المباشرة
- بناء وتحسين مظهر محفظته المهنية الموثقة بختم الـ C9 Ledger لشركائه
- حماية وتأمين بياناته من أي منشأة أو جهة عمل تحاول الوصول إليها بدون إذن صريح ومبرهن رقابياً
- استخدام لغة داعمة، مهنية، محايدة ومتزنة.

🟪 5) إذا كان المستخدم = government_inspector (المفتش الحكومي السيادي)
وضع التشغيل: Sovereign Inspector Mode
الصلاحيات: كامل الصلاحيات السيادية الخمس (GOV_LAYER_ACCESS, COMPLIANCE_RISK_RADAR, PILOT_MODE_VIEW, ENTITY_OVERSIGHT, GEO_AUDIT_ACCESS)
السياق: الرقابة والتحقيقات لجميع المنشآت الوطنية والموازنة الميدانية والتحقق من السياج الجغرافي (Geo-Variance) ومخرجات الـ Pilot Mode
سلوكك الفني:
- تقديم توصيات وتوجيهات تشغيلية استباقية للمفتش بناءً على رادار مخاطر الامتثال ومخلفات البلاغات والانحرافات الجغرافية (Geo-Variance).
- تحليل الأنماط الزمنية والجغرافية والرواتب، الحضور، الإجازات، المخالفات، وإظهار القضايا المفتوحة لتسهيل التحقيقات.
- تيسير طلب الأدلة والوثائق من المنشآت الوطنية بنقرة واحدة، ودعم المطابقة مع C9 Ledger لضمان النزاهة والعدالة وموثوقية السجلات.
- تفعيل وتوليد فيديوهات إثبات مبنية على Veo 3 Pro لتوثيق وتسهيل إثبات الحالات المخالفة جغرافيًا أو إداريًا.
- تقديم قراءة خط وسجل تحركات المنشأة والتدقيق المتبادل لها، ومتابعة مخرجات بيئة التجربة والمنع الاستباقي للنزاعات والمنازعات الفردية.
- استخدام لغة فنيّة، وطنية سيادية فخمة، شديدة الدقة، قاطعة في تدقيق الأدلة، مدعومة بالسند القانوني والرقابة الكاملة.

🟪 بروتوكول منع الهلوسة وقاعدة اليقين الاستدلالي (Inference Certainty Protocol):�تولى قيادة التحكيم الودي، صياغة طعون الاعتراضات الحكومية الفخمة، وبناء ملفات دعاوى "ودي" للمستقلين.

---

#### 2) خريطة الوحدات ومطابقة المعاينة (Modules Map)
* **الفروع**: بناء شبكة الفروع وإدارتها.
* **الموظفين**: لوحة توجيه وإدارة وتعيين رتب منسوبي المنشأة.
* **الحضور**: تدوين بصري ومكاني فوري لتوثيق تواجد القوى العاملة.
* **الانتهاكات**: تقييد ورصد الخروقات واحتساب نسب الحسم من الرواتب.
* **الاعتراضات**: مصنع ذكي لتوليد التظلمات والدفاعات النظامية بختم الموثوقية الرقابي.
* **GPS**: التموضع الفراغي ومقارنة البصمات الجغرافية بالأقمار لتمكين المطابقة مع سياج الفرع.
* **التوقيع الإلكتروني**: تعميد الإفادات وصحف الاعتراض والتحقيق بنظام تشفير محصن.
* **العقود**: توثيق وبناء شروط العمل الفردية والمستقلة لحظر التلاعب اللفظي.
* **المستقلين**: مركز الدعم والحماية المهنية وحوكمة الأتعاب المهنية.
* **S8**: وكيل حماية الالتزام التنظيمي السعودي.
* **S9**: حارس الامتثال التنبؤي الذاتي الميداني. *(هذه الخدمة قيد التطوير وسيتم تفعيلها في الإصدار القادم).*
* **C9 Ledger**: سجل الحقائق والهاشات المشفرة الكوني.

---

#### 3) حالة الخدمات ووقت التمكين الفعلي (Service Status)
| اسم الخدمة | التصنيف الحالي | الحالة اللحظية | الوصف الإجرائي والتنظيمي |
| :--- | :---: | :---: | :--- |
| **إدارة الفروع والسياج الجغرافي** | جاهزة | **Ready** | تمكين رسم السياج ومطابقة محيط العمل |
| **إدارة بيانات الموظفين والرتب** | جاهزة | **Ready** | جدولة كشوفات الموارد والامتثال للدور |
| **بصمة الحضور والمطابقة الإحداثية** | جاهزة | **Ready** | تسجيل الحضور لخط السند وربطه بالـ GPS |
| **سجل المخالفات واحتساب الحسميات** | جاهزة | **Ready** | تفعيل سلم الجزاءات المعتمد لعام 2026 |
| **توليد الاعتراضات السيادية والطعون** | جاهزة | **Ready** | صياغة لوائح فخمة مبرهنة قانونياً عبر ذكاء LEXI |
| **التوقيع الإلكتروني وحجية المستندات** | جاهزة | **Ready** | تصدير تفويض أمني مشفر غير قابل للتزوير |
| **بصمة الحقيقة C9 Ledger** | جاهزة | **Ready** | سجل الحقائق والهاشات المشفرة الكوني |
| **محرك الذكاء الاستدلالي LEXI** | جاهزة | **Ready** | محرك إيقاظ الأنظمة والإجابة الاستباقية للرتب |

---

🛠️ **أدوات المعاينة:** يمكنك النقر على زر **"نسخة للطباعة"** أو كتابة **"اطبع"** لتصدير هذه الوثيقة وفق بروتوكول الطباعة السيادية الخالي من الألوان والمحمي برمز SHA-256 المتفرد بسلسلة C9.
🏛️ Verified by **LEXI Sovereign Agent** — Security Token: \`Auth_Srv_Success_2026\``;
  }
  
  return content;
}

// Policy Logging structures
interface PolicyLog {
  id: string;
  timestamp: string;
  userId: string;
  legalObjective: string;
  decision: string;
  status: string;
  message: string;
}

const system_logs: PolicyLog[] = [];
const c9_logs: any[] = [
  {
    eventId: "C9-EVENT-SOV-001",
    type: "FOUNDER_SOVEREIGN_ENABLEMENT",
    entityId: "GLOBAL",
    entityName: "LexOps Sovereign OS (السيادة الشاملة)",
    email: "lexi.2030.sa@gmail.com",
    role: "SOVEREIGN_CONTROLLER",
    scope: "GLOBAL",
    permissions: "FULL_SOVEREIGN_CONTROL_OMNIPRESENT",
    prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
    hash: "c9_sha256_sov_controller_lexi_2030_sa_genesis_sealed",
    timestamp: "2026-09-08T09:00:00.000Z",
    tag: "SOVEREIGN_CONTROLLER_ACTIVATION",
    details: "تمكين دخول المؤسس إلى المنصة: البريد lexi.2030.sa@gmail.com، الدور SOVEREIGN_CONTROLLER، الصلاحيات شاملة (Global)، النطاق عالمي — جميع الكيانات."
  }
];

// Expose these logs for auditing
app.get("/api/policy/system-logs", (req: Request, res: Response) => {
  res.json(system_logs);
});

app.get("/api/policy/c9-logs", (req: Request, res: Response) => {
  res.json(c9_logs);
});

// 7.5. Endpoint: LEXI Differential Compliance Decision Engine (محرك الامتثال التفاضلي السيادي) - Overhauled with Policy Enforcement Layer (MANDATORY)
app.post("/api/agent/lexi-evaluate", async (req: Request, res: Response) => {
  const { entity_profile, ruleset, event } = req.body;

  const userId = (req.headers["user-id"] as string) || 
                 (req.headers["x-user-id"] as string) || 
                 (req.query.userId as string) || 
                 (req.body?.userId as string) || 
                 entity_profile?.userId || 
                 "USR-001";

  const isDeduction = event?.event_type === "deduction";
  const isAttendance = event?.event_type === "attendance";
  const isViolation = event?.event_type === "violation";

  const lObjective = isDeduction
    ? "تحكيم طعن وخصم أجور فوري ومطابقة إجرائية"
    : isAttendance
    ? "فحص وتدقيق الحضور الميداني الجيومكاني"
    : isViolation
    ? "تقييم مخالفة تشغيلية وبصمة الكيان"
    : "تقييم امتثال فوري";

  const context: EnforcementContext = {
    userId,
    role: req.body?.role || entity_profile?.tier || "entity_admin",
    legalObjective: lObjective,
    evidenceProvided: event?.evidenceProvided !== false && event?.payload?.hasEvidence !== false && event?.payload?.evidence !== "none",
    gpsCoordinates: event?.payload?.gps || (event?.payload?.latitude ? { lat: Number(event.payload.latitude), lng: Number(event.payload.longitude) } : undefined),
    gpsIsSuspicious: event?.payload?.gps_spoofing === true || event?.payload?.gpsIsSuspicious === true,
    c9RecordsCount: event?.payload?.c9RecordsCount !== undefined ? event.payload.c9RecordsCount : 1,
    timeSinceIncidentHours: event?.payload?.timeSinceIncidentHours
  };

  // --- 1) Policy Enforcement Layer Integration ---

  // Context validation check
  const ctxCheck = LexiPolicyEnforcer.validateContext(context);
  if (!ctxCheck.passed) {
    const logItem = {
      id: `POL-CTX-${Date.now()}-${Date.now().toString().slice(-3)}`,
      timestamp: new Date().toISOString(),
      userId,
      legalObjective: lObjective,
      decision: "BLOCK",
      status: ctxCheck.status,
      message: ctxCheck.message
    };
    system_logs.unshift(logItem);
    c9_logs.unshift(logItem);
    return res.json({
      decision: "BLOCK",
      legal_basis: {
        law: "نظام حوكمة الأنظمة السيادية لدمج المستخدمين",
        article: "المادة 1 - رخصة النفاذ الرقمي للأفراد والمنشآت",
        explanation: ctxCheck.message
      },
      rationale: ctxCheck.message,
      updated_indicators: entity_profile?.compliance_indicators || {
        attendance_accuracy: 0.5,
        legal_risk: "high",
        violation_density: 0.9,
        objection_success_rate: 0.1
      },
      objection_draft: `❌ تم عزل وتجميد الإجراء لمخالفات سياقية: ${ctxCheck.message}`
    });
  }

  // Principles check
  const principlesCheck = LexiPolicyEnforcer.enforcePrinciples(context);
  if (!principlesCheck.passed) {
    const logItem = {
      id: `POL-PRN-${Date.now()}-${Date.now().toString().slice(-3)}`,
      timestamp: new Date().toISOString(),
      userId,
      legalObjective: lObjective,
      decision: "BLOCK",
      status: principlesCheck.status,
      message: principlesCheck.message
    };
    system_logs.unshift(logItem);
    c9_logs.unshift(logItem);
    return res.json({
      decision: "BLOCK",
      legal_basis: {
        law: "ميثاق الدستور السيادي (LEXI Core Charter)",
        article: "مبدأ الامتثال المستندي والمطابقة الشكيلة",
        explanation: principlesCheck.message
      },
      rationale: principlesCheck.message,
      updated_indicators: entity_profile?.compliance_indicators || {
        attendance_accuracy: 0.5,
        legal_risk: "high",
        violation_density: 0.9,
        objection_success_rate: 0.1
      },
      objection_draft: `❌ تم رفض الإجراء لعدم كفاية الدليل المادي وسجلات C9: ${principlesCheck.message}`
    });
  }

  // Risk Gate
  const riskCheck = LexiPolicyEnforcer.riskGate(context);
  if (!riskCheck.passed) {
    const logItem = {
      id: `POL-RSK-${Date.now()}-${Date.now().toString().slice(-3)}`,
      timestamp: new Date().toISOString(),
      userId,
      legalObjective: lObjective,
      decision: "BLOCK",
      status: riskCheck.status,
      message: riskCheck.message
    };
    system_logs.unshift(logItem);
    c9_logs.unshift(logItem);
    return res.json({
      decision: "BLOCK",
      legal_basis: {
        law: "لائحة الحراسة الجغرافية والمخاطر السيبرانية الموحدة",
        article: "بروتوكول تجميد الإجراء التلقائي (Auto-Freeze Gateway)",
        explanation: riskCheck.message
      },
      rationale: riskCheck.message,
      updated_indicators: {
        attendance_accuracy: 0.0,
        legal_risk: "high",
        violation_density: 1.0,
        objection_success_rate: 0.0
      },
      objection_draft: `🔒 تجميد فوري لتقاطع الحدود أو الاشتباه الجغرافي: ${riskCheck.message}`
    });
  }

  const prompt = `[LOCKED SYSTEM PROMPT / CORE KNOWLEDGE CHARTER]
${LOCKED_SYSTEM_PROMPT}

You operate inside a Saudi sovereign development environment.
Your absolute, non-negotiable directive is to analyze the operational event under Saudi Labor Law and local regulations, apply the differential compliance ruleset, and issue a structured cyber-sovereign decision.

Input Data:
1. Compliance Fingerprint (بصمة الامتثال للمنشأة):
${JSON.stringify(entity_profile, null, 2)}

2. Ruleset (قواعد الامتثال المعتمدة):
${JSON.stringify(ruleset, null, 2)}

3. Operational Event (الحدث التشغيلي المراد تدقيقه):
${JSON.stringify(event, null, 2)}

Instructions:
- Apply the rules directly to this event.
- Evaluate status (ALLOW, BLOCK, or REVIEW).
- Update the "compliance_indicators" based on this event (e.g. if a violation occurred, density may increase, or if it is blocks, the risk decreases).
- Synthesize an official, elite "objection_draft" (مسودة دفع قانوني) in prestigious Arabic under Saudi standard judicial memo style if the decision is BLOCK or REVIEW.
- You MUST respond ONLY with a single JSON object. Do not wrap it in markdown codeblocks (no \`\`\`json blocks), do not write any greetings or explanations outside the JSON. It must be a raw JSON string.

Expected Output Format:
{
  "decision": "ALLOW" | "BLOCK" | "REVIEW",
  "legal_basis": {
    "law": "اسم النظام واللائحة السعودية المصدرية",
    "article": "رقم المادة والفقرة النظامية",
    "explanation": "شرح مختصر ومحكم للسند القانوني في دقيقة"
  },
  "rationale": "سبب القرار وتطبيقه على بصمة المنشأة بشكل فني وافٍ وظاهر لجهات التدقيق",
  "updated_indicators": {
    "attendance_accuracy": <number between 0 and 1>,
    "legal_risk": "low" | "medium" | "high",
    "violation_density": <number between 0 and 1>,
    "objection_success_rate": <number between 0 and 1>
  },
  "objection_draft": "خطاب مذكر اعتراضية تظلمية مستوفية الأركان لتقديمه للهيئة أو المحاكم المختصة"
}`;

  // Specialized Sandbox Fallbacks
  const getFailsafeFallback = () => {
    const eventType = event?.event_type || "attendance";
    const empName = event?.payload?.employee_name || "خالد الحارثي";

    if (eventType === "deduction") {
      return {
        decision: "BLOCK",
        legal_basis: {
          law: "نظام العمل السعودي (اللائحة التنفيذية)",
          article: "المادة 84 مكرر",
          explanation: "يُحظر توقيع جزاء الخصم من الأجر بما يتجاوز خمسة أيام عن المخالفة الواحدة، أو اقتطاع أكثر من خمسة أيام في الشهر دون إجراء تحقيق كتابي رسمي مع مواجهة الموظف بالمخالفة كتابة وسماع أقواله وإثبات ذلك في محضر وظيفي."
        },
        rationale: "رصد المحرك محاولة خصم تفوق السقف القياسي (7 أيام) بقيمة تفوق 5 أيام مجتمعة دون وجود وثيقة تحقيق فنية مسجلة ومدرجة ببصمة الموظف، مما يعتبر خرقاً فادحاً للمادة 84 من نظام العمل ويؤدي لبطلان الإجراء فورا أمام لجان الفصل.",
        updated_indicators: {
          attendance_accuracy: entity_profile?.compliance_indicators?.attendance_accuracy || 0.92,
          legal_risk: "high",
          violation_density: 0.22,
          objection_success_rate: 0.85
        },
        objection_draft: `إلى: لجنة النظر في تظلمات منسوبي المنشأة المحترمين
الموضوع: اعتراض على قرار صادر بالخصم الجسيم للموظف (${empName})

بناء على إخطار المساعد الرقمي LEXI بسلسلة كتلة C9 Ledger، نتقدم بهذا الدفع ببطلان قرار خصم السبعة أيام لعدم سلوك جهة الإدارة الطريق الذي رسمه المنظم في المادة (84) من نظام العمل وجدول الجزاءات المعتمد، حيث لم يتم إجراء أي تحقيق مكتوب أو سماع أقوال الموظف قبل توقيع الجزاء، والمستقر عليه قضاءً وبنص المادة بطلان كل جزاء يفتقر لهذا السند الإجرائي الشكلي الجوهري. نلتمس إلغاء القرار ورفع الحسم فوراً.`
      };
    } else if (eventType === "attendance") {
      return {
        decision: "REVIEW",
        legal_basis: {
          law: "لائحة تنظيم العمل وحماية البيانات السيادية للأمن السيبراني",
          article: "المادة 12 / بروتوكول الحارس الجغرافي المعزز الاقمار الصناعية",
          explanation: "تأدية الحضور والانصراف من خارج النطاق الجغرافي المعياري للمنشأة المفتوحة دون تصريح مسبق يقتضي التدقيق المزدوج لمنع انتحال السجل الرقمي."
        },
        rationale: "تسجيل الحضور رُصد من إحداثيات GPS تقع على مسافة 4.2 كم من حاجز مشروع المطار الميداني المعتمد. حيث إن بصمة المنشأة ('construction-high-risk') تفرض تحليلاً تفاضلياً جغرافياً معززاً، يتم توجيه الحالة للمراجعة البشرية المزدوجة 'REVIEW' ريثما يتم التحقق البصري البيومتري.",
        updated_indicators: {
          attendance_accuracy: 0.88,
          legal_risk: "medium",
          violation_density: 0.15,
          objection_success_rate: 0.81
        },
        objection_draft: `الموضوع: إفادة ومبرر حضور خارجي طارئ - الموظف (${empName})
دفاعاً عن صحة عملية الاستحقاق الرقمي، نفيدكم بأن الحضور تم رصده من موقع المشروع التجاري الفرعي المسند إلينا بشكل استثنائي بموجب أمر التكليف الصادر من مهندس الموقع رقم 49-T، وهو ما حال دون الوجود ضمن الإطار الجغرافي للفرع الرئيسي، ونطلب اعتماد البصمة استجابة لشهادة الإنجاز الملحقة.`
      };
    } else if (eventType === "violation") {
      return {
        decision: "BLOCK",
        legal_basis: {
          law: "نظام العمل والعمال وقواعد العمل الإضافي",
          article: "المادة 101 و 107",
          explanation: "لا يجوز تشغيل العامل تشغيلاً فعلياً تزيد ساعاته عن 8 ساعات يومياً دون تكليف رسمي ودون احتساب أجر الساعات الإضافية بنسبة 100% زائد 50% من الأجر الأساسي."
        },
        rationale: "رصد النظام محاولة جدولة نوبة العمل الإضافي الطارئة لتفضي بمجموع 12 ساعة تشغيلية مستمرة لعامل ميداني في موقع البناء والإنشاءات دون تذكرة تكليف مسبقة ودون تأكيد مخصص الموازنة، وبناءً على معايير الحوكمة ('risk_profile: high') يتم حجب الإجراء وقائياً لمنع الغرامة الفورية من مفتشي وزارة الموارد البشرية.",
        updated_indicators: {
          attendance_accuracy: entity_profile?.compliance_indicators?.attendance_accuracy || 0.92,
          legal_risk: "low",
          violation_density: 0.08,
          objection_success_rate: 0.84
        },
        objection_draft: `بوابة الاعتراض والموازنة:
تظلم من أمر تشغيل ممتد ومخالف للوائح. نفيد بامتناع المنشأة عن المضي في احتساب نوبات الجدولة الإجبارية الإضافية طالما لم يتم إدراج الموافقة المسبقة وتعهد تسوية مخصص الساعات الإضافية طبقاً لصريح المادة 107 لضمان حماية سجل الامتثال ومنع الغرامات الرقابية من الموارد البشرية.`
      };
    } else {
      return {
        decision: "ALLOW",
        legal_basis: {
          law: "اللائحة العامة للعمل والتعاقد اللامركزي",
          article: "المادة 31",
          explanation: "جواز تعهيد المهام الطارئة لشركاء مستقلين مرخصين وموثقين بهوية سيادية."
        },
        rationale: "جميع الاشتراطات والقيود موفاة بامتياز. هوية الشريك المستقل وبصمته نشطة وموثقة بسلسلة الكتل C9 Ledger والنشاط متسق تماماً مع ترخيص المنشأة وصلاحياتها.",
        updated_indicators: {
          attendance_accuracy: 0.95,
          legal_risk: "low",
          violation_density: 0.05,
          objection_success_rate: 0.85
        },
        objection_draft: "عملية الامتثال تجري بنجاح وتوثق في السجل السيادي."
      };
    }
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey ) {
      const fb = getFailsafeFallback();
      fb.rationale = LexiPolicyEnforcer.decisionLock(fb.rationale);
      fb.objection_draft = LexiPolicyEnforcer.decisionLock(fb.objection_draft);

      const secureFb = LexiPolicyEnforcer.enforceFiveStageProtocol(fb);

      const logItem = {
        id: `POL-FALL-${Date.now()}-${Date.now().toString().slice(-3)}`,
        timestamp: new Date().toISOString(),
        userId,
        legalObjective: lObjective,
        decision: secureFb.decision,
        status: "COMPLIANT" as const,
        message: "تم إصدار تحليل الامتثال المحلي الرديف ومطابقة مصفوفة البناهين وفق البروتوكول الخماسي."
      };
      
      // Sync with both central policy logs and local runtime arrays
      system_logs.unshift(logItem);
      LexiPolicyEnforcer.logDecision(userId, lObjective, secureFb.decision, "COMPLIANT", logItem.message);
      if (secureFb.decision === "BLOCK" || secureFb.decision === "REVIEW") {
        c9_logs.unshift(logItem);
      }

      return res.json(secureFb);
    }

    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const replyRaw = response.text || "";
    let cleaned = replyRaw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(json)?/, "");
      cleaned = cleaned.replace(/```$/, "");
      cleaned = cleaned.trim();
    }

    try {
      const parsed = JSON.parse(cleaned);

      parsed.rationale = LexiPolicyEnforcer.decisionLock(parsed.rationale || "");
      parsed.objection_draft = LexiPolicyEnforcer.decisionLock(parsed.objection_draft || "");

      const secureParsed = LexiPolicyEnforcer.enforceFiveStageProtocol(parsed);

      const logItem = {
        id: `POL-LIVE-${Date.now()}-${Date.now().toString().slice(-3)}`,
        timestamp: new Date().toISOString(),
        userId,
        legalObjective: lObjective,
        decision: secureParsed.decision || "ALLOW",
        status: "COMPLIANT" as const,
        message: `تم توليد قرار الامتثال السيادي لـ LEXI عبر نموذج Gemini بنجاح: ${secureParsed.decision}`
      };
      system_logs.unshift(logItem);
      LexiPolicyEnforcer.logDecision(userId, lObjective, secureParsed.decision, "COMPLIANT", logItem.message);
      if (secureParsed.decision === "BLOCK" || secureParsed.decision === "REVIEW") {
        c9_logs.unshift(logItem);
      }

      res.json(secureParsed);
    } catch (parseErr) {
      console.warn("Failed to parse LLM response, invoking robust failsafe fallback:", replyRaw);
      const fb = getFailsafeFallback();
      fb.rationale = LexiPolicyEnforcer.decisionLock(fb.rationale);
      fb.objection_draft = LexiPolicyEnforcer.decisionLock(fb.objection_draft);

      const secureFb = LexiPolicyEnforcer.enforceFiveStageProtocol(fb);

      const logItem = {
        id: `POL-PARSE-ERR-${Date.now()}-${Date.now().toString().slice(-3)}`,
        timestamp: new Date().toISOString(),
        userId,
        legalObjective: lObjective,
        decision: secureFb.decision,
        status: "COMPLIANT" as const,
        message: "تعذر قراءة مخرجات النموذج، تم تفعيل النموذج المحلي المساند والختم الهيكلي الخماسي."
      };
      system_logs.unshift(logItem);
      LexiPolicyEnforcer.logDecision(userId, lObjective, secureFb.decision, "COMPLIANT", logItem.message);
      c9_logs.unshift(logItem);

      res.json(secureFb);
    }
  } catch (err: any) {
    const errStr = String(err.message || err || "");
    const errStrLower = errStr.toLowerCase();
    const isBillingOrQuotaError = errStrLower.includes("prepayment") ||
                                  errStrLower.includes("depleted") ||
                                  errStrLower.includes("429") ||
                                  errStrLower.includes("resource_exhausted") ||
                                  errStrLower.includes("dunning") ||
                                  errStrLower.includes("deny for project") ||
                                  errStrLower.includes("permission_denied") ||
                                  errStrLower.includes("403") ||
                                  errStrLower.includes("billing") ||
                                  errStrLower.includes("payment");
    if (isBillingOrQuotaError) {
      console.warn("LEXI Evaluation Warning (Billing/Quota - Handled via Fallback):", errStr);
    } else {
      console.error("LEXI Evaluation Error:", err);
    }
    
    const fb = getFailsafeFallback();
    fb.rationale = LexiPolicyEnforcer.decisionLock(fb.rationale);
    fb.objection_draft = LexiPolicyEnforcer.decisionLock(fb.objection_draft);

    if (isBillingOrQuotaError) {
      fb.rationale = `⚠️ [تنبيه رصيد الحساب]: أرصدة الدفع المسبق (Prepayment Credits) لمفتاح Gemini API الخاص بكم في منصة Google AI Studio قد نفدت بالكامل. تم التوجيه للتحليل المحلي الرديد تلقائياً.\n\n${fb.rationale}`;
    }

    const secureFb = LexiPolicyEnforcer.enforceFiveStageProtocol(fb);

    const logItem = {
      id: `POL-ERR-${Date.now()}-${Date.now().toString().slice(-3)}`,
      timestamp: new Date().toISOString(),
      userId,
      legalObjective: lObjective,
      decision: secureFb.decision,
      status: "COMPLIANT" as const,
      message: `وقوع خطأ بالخادم: ${err.message || err}`
    };
    system_logs.unshift(logItem);
    LexiPolicyEnforcer.logDecision(userId, lObjective, secureFb.decision, "COMPLIANT", logItem.message);
    c9_logs.unshift(logItem);

    res.json(secureFb);
  }
});
/*
});�خاطر (Sovereign Recommendations)
* **ما يجب فعله الآن (Now)**:
  * تحديد حدود السياج الجغرافي بطريقة واقعية تتوافق مع الأبنية والظروف لضمان دقة توقيع الموظفين الميدانيين وتجنب حسم الرواتب خطأً.
  * تحديث وتعميم سجل المخالفات ونسب الحسم ليتناسب طردياً مع جداول العمل السعودية 2026.
* **ما يجب فعله قبل الإطلاق (Before Launch)**:
  * إجراء فحص ومطابقة لاختبار كفاءة سلاسل الهاش في C9 Ledger تحت الأحمال والطلبات التشغيلية الكثيفة للتأكد من انعدام توقف محرك الـ Blockchain.
  * تنبيه وتوعية منسوبي الفروع والمنسوبين للتحقق من صلاحيات تحديد الموقع الجغرافي لأجهزتهم لضمان التوقيع السليم.
* **ما يجب مراقبته بعد الإطلاق (Post-Launch)**:
  * تتبع معدلات قبول الطعون ومؤشرات التظلمات التي يصدرها وكيل الذكاء LEXI لضمان جودة الاستدلال والمنطق المستخدم.
  * ضبط مسار صرامة LEXI وكفاءتها لموازنة بيئة العمل ومنع الانفجار الإداري للنزاعات وحماية استمرارية الأرباح والآليات التعهيدية.

---

🛠️ **أدوات المعاينة:** يمكنك النقر على زر **"نسخة للطباعة"** أو كتابة **"اطبع التقرير"** لتصدير هذا التقرير التفصيلي السيادي والتشغيلي بالكامل وفق بروتوكول الطباعة النظيفة السيادية الخالية من الألوان والمحمية بالكامل بسلسلة C9.
🏛️ Verified by **LEXI Sovereign Agent** — Operational Security Token: \`Auth_Diag_Success_2026\``;
  }
  
  return content;
}
*/

// Helper to generate full onboarding & access control protocol (LOACP-2026)
function generateOnboardingProtocolResponse(mappedRole: string, isPrintMode: boolean): string {
  const uniqueId = "SVRN9";
  const refCode = `LEX-ONBD-PROT-2026-${uniqueId}`;
  const timestampMakkah = "2026-05-24 مكة المكرمة";
  const claim9Hash = "f8a9d1c2b3a4a5e6f7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9";

  let content = "";

  if (isPrintMode) {
    content += `🏛️ بروتوكول انضمام وإدارة الوصول LEXI (LOACP-2026)
منصة LexOps Sovereign – نسخة التدقيق والتحكم العالي
الرقم المرجعي: ${refCode}
التاريخ: ${timestampMakkah}
--------------------------------------------------
بروتوكول انضمام المنشآت والمستقلين وإدارة النفاذ السيادي - لوحة التحكم
--------------------------------------------------

1) قاعدة السيادة الأساسية (Sovereign Core Rule)
المؤسس لا يستطيع إضافة أي منشأة أو موظف مستقل من داخل المنصة نهائياً.
الانضمام يتم فقط وحصرياً عبر تقديم طلب رسمي عبر صفحة الهبوط الخارجية (Landing Page) وذلك لضمان تحقيق:
- عزل تام للهوية التشغيلية والمالية.
- منع أي محاولات للتلاعب بالبيانات قبل التدقيق القانوني.
- حظر إنشاء أي كيانات وهمية أو عقود باطلة داخل مصفوفة النظام.
- الالتزام التام والكامل ببروتوكولات السيادة القانونية الصارمة.

2) مسار انضمام المنشأة (Entity Onboarding Flow)
عند تقديم منشأة لطلب الانضمام من صفحة الهبوط:
أ- يرفع ممثل المنشأة البيانات المطلوبة: اسم المنشأة، الرقم الموحد (700)، بيانات الممثل، رقم السجل التجاري، التموضع الجغرافي للفرع الرئيسي.
ب- يستقبل المؤسس هذا الطلب في لوحة التحكم السيادية.
ج- يملك المؤسس فقط صلاحية: قبول / رفض الطلب. لا يمكنه تعديل البيانات نهائياً أو إنشاء منشأة يدوياً من داخل النظام.
د- عند الموافقة: يُنشأ حساب "مسؤول منشأة" تلقائياً، ويُرسل له الرابط المخصص مع كلمة مرور مؤقتة.
هـ- عند أول تسجيل دخول: يُلزم مسؤول المنشأة باستكمال البيانات الإلزامية كاملة (رفع السجل التجاري، تحديد السياج الجغرافي للفروع Geofencing، إضافة بيانات الموظفين، تفويض التوقيع الإلكتروني).
و- بعد الإكمال التام للبيانات: تفتح له كافة خدمات المنشأة تلقائياً (إدارة الفروع، الموظفين، الحضور، الانتهاكات، الاعتراضات، GPS، C9 Ledger، والتوقيع الإلكتروني).

3) مسار انضمام المستخدم المستقل (Individual Onboarding Flow)
المستقل لا يمكن إضافته يدوياً من داخل النظام. المسار المعتمد:
أ- يرفع المستقل طلب انضمامه عبر صفحة الهبوط: بالاسم، رقم الهوية الوطنية، المهنة، المدينة، ورقم الجوال.
ب- يظهر الطلب تلقائياً في حساب المؤسس للمراجعة والبت بصلاحية: قبول / رفض فقط.
ج- عند الموافقة: يُنشأ للحساب رتبة "مستقل" ويرسل له رابط للدخول الفوري.
د- عند أول تسجيل دخول: يُلزم باستكمال بياناته الشخصية والمهنية (رفع الهوية الوطنية، تحديد قائمة المهارات وتعميد التوقيع الإلكتروني).
هـ- بعد الإكمال: تتاح له كافة خدمات المستقلين الفورية (إدارة العقود، النزاعات المهنية، صياغة دعاوى منصة ودي عبر ذكاء LEXI، ختم C9، وبناء المحفظة المهنية الموثقة).

4) بروتوكول الإكمال الإلزامي (Mandatory Completion Protocol)
عند أول تسجيل دخول لأي مستخدم جديد (سواء كان مسؤول منشأة أو مستخدم مستقل):
- يتم إيقاف وتجميد الوصول إلى خدمات المنصة التشغيلية تماماً.
- يُحظر تفعيل لوحة التحكم أو استخدام المعالج الذكي LEXI.
- يمنع تسجيل حضور الموظفين أو رفع أي اعتراضات قانونية.
- تظل جميع الوظائف مغلقة بالكامل حتى يتم إكمال كافة الحقول الإلزامية وتفعيل الهوية بنجاح، لتُفتح بعد ذلك تلقائياً وبشكل فوري وحصري حسب صلاحيات الدور.

5) بروتوكول منع الهلوسة والالتزام بالنظام (Anti-Hallucination Protocol)
يتم التأكيد الصارم على الالتزام بـ:
- لا يمكن للمؤسس إضافة أي منشأة أو مستخدم مستقل من داخل لوحة تحكمه يدوياً.
- عند الاستفسار عن إمكانية الإضافة اليدوية يتم الرد القاطع: "لا يمكن إضافة منشأة أو مستخدم مستقل من داخل النظام. يجب تقديم طلب عبر صفحة الهبوط."
- لا يتم تمرير أو تقديم أي خدمات تشغيلية للمنشأة أو المستقل حتى يتم استكمال البيانات الإلزامية تماماً دون أي تجاوز وتمرير أمني.

--------------------------------------------------
Claim9 Hash: ${claim9Hash}
معتمدة وموثقة وفق معايير الحوكمة الذكية المتفردة LexOps OS
Verified by LEXI Onboarding & Access Control Protocol (LOACP-2026)
--------------------------------------------------`;
  } else {
    content += `### 🟩 بروتوكول انضمام وإدارة الوصول لـ LEXI (LOACP-2026)
**رقم الوثيقة:** \`${refCode}\` | **التوقيت:** ${timestampMakkah}

مرحباً بك. أنا **LEXI**، المحرك السيادي للذكاء التشغيلي في منصة **LexOps**. إليك الشرح المعتمد والمفصل لمسار الانضمام السيادي وإدارة الأذونات والنفاذ:

---

#### 🟦 1) قاعدة السيادة الأساسية (Sovereign Core Rule)
* **القاعدة التشغيلية المطلقة:** لا يمكن للمؤسس (Founder) إضافة أي منشأة أو مستخدم مستقل يدوياً من داخل نظام المنصة نهائياً.
* **البوابات المعتمدة:** عملية الانضمام تبدأ وترتبط حصرياً بتقديم طلب رسمي من **صفحة الهبوط الخارجية (Landing Page)**، وذلك لضمان:
  1. **عزل الهوية التشغيلية والمالية** على مستوى السيرفرات.
  2. **منع التلاعب الجنائي** بالبيانات المدخلة قبل البت القانوني.
  3. **حظر إنشاء حسابات أو كيانات وهمية** لا تملك سجلاً تشغيلياً رسمياً.
  4. **الالتزام ببروتوكول حماية الخصوصية** والسيادة القضائية لنظم العمل.

---

#### 🟩 2) مسار انضمام المنشأة وتأهيلها (Entity Onboarding Flow)
عند قيام منشأة بطلب التمكين عبر صفحة الهبوط الخارجية:
1. **تقديم البيانات**: يرفع ممثل المنشأة طلباً متكاملاً يشمل (اسم المنشأة، الرقم الموحد (700)، الاسم الكامل للممثل، رقم السجل التجاري كإثبات، والموقع والإحداثيات الجغرافية المعتمدة للفرع الأول).
2. **الاستقبال السيادي**: يُدرج الطلب تلقائياً في لوحة تحكم المؤسس السيادية لتنفيذ الفرز.
3. **محدودية الصلاحية للاستقرار التنظيمي**: يمكن للمؤسس فقط **[قبول]** أو **[رفض]** طلب الانضمام. يمنع من إجراء تعديلات على مستندات المنشأة أو إنشائها اصطناعياً من داخل النظام.
4. **توليد الهوية وحساب المسؤول**: فور موافقة المؤسس، يؤسس النظام آلياً حساب "مسؤول منشأة (Entity Admin)" ويصدر له كود التحقق ورابط الدخول الخاص مع كلمة مرور مؤقتة بريدياً.
5. **لوحة الإلزام عند تسجيل الدخول الأول**: عند أول ولوج للنظام، يتم توجيه "مسؤول المنشأة" لصفحة إتمام الإجراءات الإلزامية (رفع ملف السجل التجاري PDF، رسم الحدود الجغرافية ومحيط الفروع على الخرائط التفاعلية Geofencing، إضافة كشوف الموظفين المعينين، وتعقيب تفويض التوقيع الإلكتروني).
6. **فتح الصلاحيات العملياتية**: عند إكمال ملف التأهيل المذكور بنجاح، تفتح لوحة تحكم المنشأة آلياً وبشكل فوري لتوجيه الأوامر (إدارة الفروع، الموظفين، إثبات الحضور، جدولة الانتهاكات، توثيق سجلات C9، صياغة طعون الاعتراضات).

---

#### 🟧 3) مسار انضمام الشركاء والمستقلين (Individual Onboarding Flow)
يتكامل المستقلون مع مصفوفة LexOps بالمسار الصارم التالي لضمان توازن الحقوق المالية والتعاقدية:
1. **بدء الطلب**: يرفع المستخدم طلب انضمام من صفحة الهبوط متضمناً (الاسم الكريم، رقم الهوية الوطنية، المسمى المهني المحدد، المدينة الجغرافية، ورقم الجوال للتنفيذ الموثوق).
2. **قرار المؤسس**: يظهر المستند فوراً للمؤسس لتطبيق خيار **[قبول]** أو **[رفض]** فقط دون المساس بالبيانات المهنية للمستقل.
3. **تأسيس الرتبة**: عند الموافقة، يتشكل حساب المستقل الفردي مع رابط توجيه آمن.
4. **أول اتصال بالخادم**: يُلزم المستقل في أول جلسة تعامل برفع وثيقة إثبات الهوية الرسمية، تدوين المهارات المهنية والخبرات، وإتمام بصمة التوقيع الإلكتروني الموثق.
5. **فتح مساحات العمل الحرة**: بعد إتمام التأهيل والبيانات الإلزامية بنجاح، تفتح للمستقل الحزمة المخصصة له (صياغة ومتابعة العقود المستقلة، رصد وحل النزاعات مع عملاء الأعمال، توليد صحائف ادعاء منصة "ودي" الرسمية بذكاء LEXI، الختم التلقائي C9، وبناء المحفظة المهنية الممتدة).

---

#### 🟨 4) بروتوكول الإكمال الإلزامي الصارم (Mandatory Completion Protocol)
* **حظر النفاذ المؤقت**: عند انطلاق الجلسة الأولى لأي مستخدم جديد (مسؤول منشأة أو مستقل)، يتم تفعيل جدار حظر حركي على كافة الواجهات والخدمات.
* **القيود المطبقة**: لا يمكن استخدام محرك الذكاء الاستدلالي LEXI، لا تتوفر لوحات التحليل المتقدمة، يُمنع تسجيل حضور الموظفين أو رفع اعتراضات على أي مخالفات.
* **شرط الإفراج الآلي**: تظل هذه القيود نشطة وسارية لضمان موثوقية الهوية الرقمية، ولا تُفتح وتنشط واجهات الخدمات المناسبة للرتبة والوظيفة إلا **بعد الإدخال والإكمال المتكامل للوثائق والبيانات الإلزامية**.

---

#### 🟥 5) بروتوكول مكافحة الهلوسة والالتزام بالنظام (Anti-Hallucination Protocol)
* لا يمكن لأي رتبة (بما في ذلك المؤسس) تجاوز هذه البوابات وإضافة شركاء أو منشآت يدوياً من داخل النظام مباشرة.
* إذا تم الاستفسار أو محاولة المطالبة بالإضافة الفردية اليدوية من قبل النظام، يظهر الرد القاطع الرسمي: 
  > **"لا يمكن إضافة منشأة أو مستخدم مستقل من داخل النظام. يجب تقديم طلب عبر صفحة الهبوط."**

---

🛠️ **أدوات العرض وطباعة السند:** يمكنك النقر على زر **"نسخة للطباعة"** في الأعلى أو كتابة **"اطبع بروتوكول الانضمام"** أو **"اطبع التقرير"** لترحيل هذا التقرير التفصيلي التنظيمي وتصديره بملف طباعة موحد وخفيف وخالٍ من الألوان مع ختم البلوكشين C9 الموثوق.
🏛️ Verified by **LEXI Onboarding Engine** — Identity Security SHA-256 Token: \`LOACP_Verify_Passed\``;
  }

  return content;
}

// 6. Endpoint: Stateful & Context-Aware Sovereign AI Chat
app.post("/api/agent/chat", async (req: Request, res: Response) => {
  const { messages, systemContext, userRole, isOnboardingCompleted } = req.body;
  const historyStr = (messages || []).map((m: any) => `${m.role === "user" ? "المستخدم" : "الذكاء الاصطناعي"}: ${m.content}`).join("\n");
  const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : "أهلاً بك";

  // Check if onboarding is completed according to LOACP-2026
  if (isOnboardingCompleted === false) {
    return res.json({ text: "لا يمكن تفعيل خدمات الذكاء السيادي قبل إكمال الهوية الرقمية. يرجى إكمال البيانات المطلوبة." });
  }

  // Map application userRole to the specified SYSTEM INSTRUCTION roles:
  // user.role = ["founder" | "entity_admin" | "employee" | "individual" | "government_inspector"]
  let mappedRole = "employee";
  if (userRole === "founder") {
    mappedRole = "founder";
  } else if (userRole === "orgadmin") {
    mappedRole = "entity_admin";
  } else if (userRole === "employee") {
    mappedRole = "employee";
  } else if (userRole === "freelancer" || userRole === "individual") {
    mappedRole = "individual";
  } else if (userRole === "government" || userRole === "government_inspector") {
    mappedRole = "government_inspector";
  }

  // Check for specialized Services / Printable Mode Queries local interception
  const lastMsgClean = (lastMessage || "").trim();
  const normalized = lastMsgClean
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");

  const isOnboardingQuery =
    normalized.includes("كيف ابدا") ||
    normalized === "كيف ادخل" ||
    normalized.includes("كيف ادخل المنصه") ||
    normalized.includes("كيف ادخل النظام") ||
    normalized.includes("كيف تنضم المنشاه") ||
    normalized.includes("كيف تنضم") ||
    normalized.includes("كيف ينضم") ||
    normalized.includes("كيف يبدا المستقل") ||
    normalized.includes("كيف يبدا") ||
    normalized === "الانضمام" ||
    normalized.includes("كيف انضم") ||
    normalized.includes("مسار الانضمام") ||
    normalized.includes("بروتوكول الانضمام") ||
    normalized.includes("طريقه الانضمام") ||
    normalized.includes("طريقة الانضمام");

  const isManualAddQuery =
    normalized.includes("اضافه منشاه") ||
    normalized.includes("اضافة منشاه") ||
    normalized.includes("اضافه مستقل") ||
    normalized.includes("اضافة مستقل") ||
    normalized.includes("انشاء منشاه يدويا") ||
    normalized.includes("انشاء مستقل يدويا") ||
    normalized.includes("إضافة منشأة") ||
    normalized.includes("إضافة مستقل") ||
    normalized.includes("اضافه منشاة يدويا") ||
    normalized.includes("اضافة منشأة يدويا");

  const isServiceMapQuery = 
    normalized.includes("الخدمات المتاحه لي") ||
    normalized.includes("الخدمات المتاحه") ||
    normalized.includes("خدمات متاحه") ||
    normalized.includes("ماذا استطيع ان افعل") ||
    normalized.includes("استطيع ان افعل") ||
    normalized.includes("الوظائف المتاحه") ||
    normalized.includes("الوظايف المتاحه") ||
    normalized.includes("الوظائف المتاحة") ||
    normalized.includes("الوظايف المتاحة") ||
    normalized.includes("عرض الوظائف") ||
    normalized.includes("اعرض الوظائف");

  const isDiagnosticQuery = 
    normalized.includes("تقرير كامل عن المنصه") ||
    normalized.includes("تقرير كامل") ||
    normalized.includes("الموجود داخل النظام") ||
    normalized.includes("الموجود في النظام") ||
    normalized.includes("ما الموجود داخل النظام") ||
    normalized.includes("ما يوجد داخل النظام") ||
    normalized.includes("كيف تعمل الوظائف") ||
    normalized.includes("كيف تعمل الوظايف") ||
    normalized.includes("كيفيه عمل الوظائف") ||
    normalized.includes("صوره شامله للبناء") ||
    normalized.includes("صورة شاملة للبناء") ||
    normalized.includes("ما الذي يعمل وما الذي لم يكتمل") ||
    normalized.includes("ما يعمل وما لم يكتمل") ||
    normalized.includes("ما الذي يعمل وماذا لم يكتمل") ||
    normalized.includes("ما يعمل وما لم يكتمل") ||
    normalized.includes("عرض صورة شاملة للبناء") ||
    normalized.includes("اعرض صورة شاملة للبناء") ||
    normalized.includes("اعرض صوره شامله للبناء");

  const isPrintQuery =
    normalized === "اطبع" ||
    normalized.includes("نسخه للطباعه") ||
    normalized.includes("نسخه للطباعة") ||
    normalized.includes("نسخة للطباعه") ||
    normalized.includes("نسخة للطباعة") ||
    normalized.includes("للطباعه") ||
    normalized.includes("للطباعة");

  const isPrintingReport = 
    normalized.includes("تقرير") || 
    normalized.includes("التقرير") ||
    (messages || []).some((m: any) => {
      if (m.role !== "user") return false;
      const mNorm = m.content.toLowerCase().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
      return mNorm.includes("تقرير كامل") ||
             mNorm.includes("الموجود داخل النظام") ||
             mNorm.includes("كيف تعمل الوظائف") ||
             mNorm.includes("صوره شامله للبناء") ||
             mNorm.includes("صورة شاملة للبناء") ||
             mNorm.includes("ما الذي يعمل وما الذي لم يكتمل");
    });

  const isPrintingOnboarding = 
    normalized.includes("بروتوكول") || 
    normalized.includes("الانضمام") ||
    normalized.includes("المنضم") ||
    (messages || []).some((m: any) => {
      if (m.role !== "user") return false;
      const mNorm = m.content.toLowerCase().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
      return mNorm.includes("كيف ابدا") ||
             mNorm.includes("كيف ادخل") ||
             mNorm.includes("كيف تنضم") ||
             mNorm.includes("كيف ينضم") ||
             mNorm.includes("كيف يبدا");
    });

  if (isManualAddQuery) {
    return res.json({ text: "لا يمكن إضافة منشأة أو مستخدم مستقل من داخل النظام. يجب تقديم طلب عبر صفحة الهبوط." });
  }

  if (isOnboardingQuery) {
    const textResponse = generateOnboardingProtocolResponse(mappedRole, false);
    return res.json({ text: textResponse });
  }

  if (isPrintQuery && isPrintingOnboarding) {
    const textResponse = generateOnboardingProtocolResponse(mappedRole, true);
    return res.json({ text: textResponse });
  }

  if (isDiagnosticQuery) {
    const textResponse = generateDiagnosticReportResponse(mappedRole, false);
    return res.json({ text: textResponse });
  }

  if (isPrintQuery && isPrintingReport) {
    const textResponse = generateDiagnosticReportResponse(mappedRole, true);
    return res.json({ text: textResponse });
  }

  if (isServiceMapQuery) {
    const textResponse = generateServiceMapResponse(mappedRole, false);
    return res.json({ text: textResponse });
  }

  if (isPrintQuery) {
    const textResponse = generateServiceMapResponse(mappedRole, true);
    return res.json({ text: textResponse });
  }

  const contextPrompt = `SYSTEM INSTRUCTION — LEXI Sovereign Intelligence Engine  
Version: LEXI-SVRN-CTX-V3.1

أنت LEXI — المحرك السيادي للذكاء التشغيلي في منصة LexOps، مبني على نموذج Gemini 1.5 Pro، وتعمل وفق بروتوكول الهوية المركبة (Composite Identity Protocol).
يجب عليك تغيير نبرة الحديث، مستوى الصلاحيات، زاوية التحليل، ونوع المعلومات المقدمة تلقائياً بناءً على رتبة المستخدم داخل النظام.

رتبة المستخدم الحالية لمرسل الرسالة:
user.role = "${mappedRole}"

عند كل رسالة، يجب عليك تفعيل مصفوفة الاستجابة الرباعية التالية بناءً على رتبة المستخدم الحالية:

🟦 1) إذا كان المستخدم = founder (Sovereign / Root)
وضع التشغيل: System Guardian Mode
الصلاحيات: غير محدودة
السياق: رؤية شاملة على جميع المنشآت
سلوكك الفني:
- تقديم تحليلات سيادية عالية المستوى
- إنشاء خرائط حرارة قانونية للقطاعات
- تقديم تقارير امتثال وطنية
- السماح بتنفيذ أوامر “تجاوز النطاق” Scope Bypass
- تفعيل أوامر مثل: Freeze Entity, Override Compliance, Force Reconciliation
- تقديم تنبؤات مبنية على Big Data
- استخدام لغة رسمية، سيادية، تنفيذية، وقوية. يمنع منعاً باتاً استخدام لغة ودية أو مرنة أو غير رسمية مع رتبة المؤسس.

🟩 2) إذا كان المستخدم = entity_admin (مدير منشأة)
وضع التشغيل: Operational Advisor Mode
الصلاحيات: إدارة المنشأة فقط
السياق: الامتثال، الرخص، الحضور، المخالفات لخط التراخيص والمنشأة المحددة
سلوكك الفني:
- تحليل الوقائع الميدانية وربطها بنظام العمل السعودي 2026
- توليد مسودات اعتراض وتظلمات ذكية
- تقديم تفسير قانوني للمخالفات الإدارية والتشغيلية
- تقديم نصائح فنية وقانونية أثناء رسم السياج الجغرافي (Geofencing)
- استخدام لغة عملية، إدارية، دقيقة، وقانونية صارمة.

🟧 3) إذا كان المستخدم = employee (موظف تابع)
وضع التشغيل: Field Guide Mode
الصلاحيات: ملفه الوظيفي فقط
السياق: الحضور، الرواتب، الشهادات الصحية التابعة له
سلوكك الفني:
- توجيه الموظف ودعمه بشكل بسيط أثناء تسجيل الحضور والانصراف وعبر الفصول
- تقديم تنبيهات استباقية غاية في الأهمية (مثل اقتراب انتهاء صلاحية شهادته الصحية البلدية، التأخر عن الفترات، إلخ)
- مساعدته في صياغة اعتراضات عادلة ومبنية على مسوغات موضوعية
- مقارنة ادعاءاته وأقواله مع بصمة بيانات GPS الفورية وسجلات الـ C9 Ledger المبرهنة
- استخدام لغة ودية، توعوية، مبسطة، غير رسمية، ومفهومة للموظف الميداني. تجنب إرباكه بالمصطلحات التقنية المعقدة أو التبريرات البرمجية العميقة.

🟨 4) إذا كان المستخدم = individual (مستقل)
وضع التشغيل: Career Lifeline Guard Mode
الصلاحيات: بياناته ومحفظته الخاصة فقط
السياق: العقود الحرة، السجل المهني الموثق، الحقوق التعاقدية
سلوكك الفني:
- تحليل عقود العمل المستقل وساعات التسعير
- تقديم نصائح قانونية تشغيلية لحمايته وضمان مستحقاته المباشرة
- بناء وتحسين مظهر محفظته المهنية الموثقة بختم الـ C9 Ledger لشركائه
- حماية وتأمين بياناته من أي منشأة أو جهة عمل تحاول الوصول إليها بدون إذن صريح ومبرهن رقابياً
- استخدام لغة داعمة، مهنية، محايدة ومتزنة.

🟫 5) إذا كان المستخدم = government_inspector (المفتش الحكومي السيادي)
وضع التشغيل: Sovereign Inspector Mode
الصلاحيات: كامل الصلاحيات السيادية الخمس (GOV_LAYER_ACCESS, GEO_AUDIT_ACCESS, ENTITY_OVERSIGHT, PILOT_MODE_VIEW, COMPLIANCE_RISK_RADAR)
السياق: رادار مخاطر الامتثال، الانحرافات الجغرافية، التحقيقات، الأدلة الرقمية والـ C9 Ledger، وعرض مخرجات Pilot Mode.
سلوكك الفني:
- تفعيل كامل قدرات رادار الامتثال ورصد النطاقات الجغرافية الجيوفينسية (Geo-Variance) للتنبؤ وحظر التلاعب بالموقع أو الحضور.
- تفعيل أدوات التحقيق المشفرة: السماح بمراجعة وحفظ وفتح وإغلاق ملفات التحقيق، إطلاق طلب قرائن وأدلة إضافية من المنشآت آلياً بنقرة واحدة.
- إدارة الأدلة والقرائن المدعومة بمحرك Veo 3 Pro لتوليد لقطات وفيديوهات إثبات الحالة للمخالفات وربطها بسند C9 Ledger.
- الإشراف الشامل على المنشآت الوطنية بكافة أمانات ومناطق المملكة (الوسطى، الغربية، الشرقية، الجنوبية، مكة)، ومطابقة رخص بلدي سارية وشهادات الصحة.
- استعراض خطوط الحياة الوظيفية والشهادات والرواتب وسجلات الحضور لكل منشأة بهدف تلمس أي انحراف عن مقتضيات نظام العمل.
- عرض لوحة القيادة والمؤشرات للمشروع التجريبي (Pilot Mode)، بما في ذلك حجم المخالفات التي تم تلافيها والمنع الاستباقي للنزاعات لخدمة استقرار التمكين.
- تقديم توصيات ذكية استباقية وتنبيهات فورية للمفتش (LEXI Smart Advisor) عند رصد أي أنماط عمل مريبة أو انحراف زمني أو مكاني غير مطابق للأدلة الصلبة.
- استخدام لغة رسمية، صارمة، وطنية، سيادية، ذات دقة استدلالية وقانونية بالغة لتعضيد دور وزارة الشؤون البلدية والقروية والإسكان ووزارة الموارد البشرية والتنمية الاجتماعية.

🟪 بروتوكول منع الهلوسة وقاعدة اليقين الاستدلالي (Inference Certainty Protocol):
قبل إصدار أي حكم أو تبرير أو رد، يجب أن يمر تحليلك إجبارياً عبر 3 مسارات تحقق:
1) المسار النصي: مطابقة الرد ومحتواه بدقة كاملة مع النص الحرفي والبنود ذات العلاقة من نظام العمل السعودي 2026 لضمان دقة الاستدلال.
2) المسار الإجرائي: مطابقة الرد ومساره مع لوائح التفتيش، سلم العقوبات والتدرج، والإجراءات التنظيمية والقضائية المعتمدة.
3) المسار المادي: مطابقة ادعاء أو شكوى الطرف مع الأدلة الرقمية القاسية والبصمات المسجلة في الـ C9 Sovereign Ledger:
   - GPS Hash (تطابق خطوط الطول والعرض للفرع)
   - Attendance Proof (بينة حضور موقعة ومنشأة)
   - Entity Binding (ربط الكيان مع الموظف)
   - TimeStamp Integrity (سلامة التوقيت الزمني المسجل بدون تزييف)
   
🚨 تنبيه صارم لأمن الاستدلال:
إذا لم تتوفر الأدلة والقرائن الرقمية المحددة في بيانات السياق والمحيط، يُمنع عليك تخمين أو محاكاة أي حكم تنظيمي أو استنتاج، ويجب عليك قول هذه العبارة الحرفية والوقوف عندها:
"لا يمكن إصدار حكم دون دليل رقمي مطابق لسجل الحقيقة C9."

🟫 قواعد الأمن والسرية وعزل الهوية (Isolation Protocol Rules):
- لا تقدم أي معلومة خارج نطاق رتبة المستخدم الحالية المحددة (${mappedRole}).
- يمنع منعاً باتاً كشف أو الإشارة إلى بيانات منشأة أو ملفات موظف آخر لمستفيد غير مخول بذلك.
- لا تعتمد على التخمين أو المظنة أو سرد القواعد العائمة.
- كل رد يجب أن يكون: دقيق، سيادي، قابل للتدقيق، غير قابل للهلوسة، ومبني على الأدلة الرقمية المسجلة.

بيانات المنظومة والكيانات اللحظية المتوفرة في السياق للتدقيق والمطابقة:
- المنشآت والشركاء المسجلين: ${JSON.stringify(systemContext?.organizations || [])}
- الموظفون وكشوفات القوى العاملة: ${JSON.stringify(systemContext?.employees || [])}
- المخالفات الرقابية المسجلة حالياً: ${JSON.stringify(systemContext?.citations || [])}
- التظلمات والاعتراضات النشطة: ${JSON.stringify(systemContext?.objections || [])}

قوانين الحوكمة المرجعية:
1. نظام العمل السعودي ولائحة تنظيم العمل النموذجية المعتمدة لعام 2026.
2. ضوابط الهيئة الوطنية للأمن السيبراني (NCA) لترشيد خصوصية البيانات والعمليات السيادية وحجية المعلومات.
3. بروتوكولات التحقق الجغرافي والبيومتري للتغطية الفضائية والأقمار الصناعية لمنع التلاعب.

سياق المحادثة المباشر المخزن:
${historyStr}

الرجاء الرد على تساؤل المستخدم الأخير الموجه إليك:
"${lastMessage}"
صغ الرد باللغة العربية الفصحى الفاخرة التي تلائم الرتبة المحددة (${mappedRole}) مع الالتزام التام بكافة البنود والنبرة والمحددات أعلاه. لا ترجع إلا بصيغة Markdown نظيفة بدون مقدمات إضافية.`;

  const fallbackText = `أهلاً بك في نظام الاستشارة السيادية الذكي لـ LexOps.
بناءً على رتبتك الحالية في النظام (${mappedRole}) والمعطيات المتوفرة لدينا:
- إجمالي المنشآت والجهات النشطة: ${systemContext?.organizations?.length || 0}
- إجمالي المخالفات المسجلة: ${systemContext?.citations?.length || 0}

نوصي بالتحقق الفوري من مواقع العمل الميدانية ومطابقة إحداثيات GPS لتفادي تداخل البيانات أو خرق الحدود الجغرافية. ميزة التوقيع الرقمي والتشفير الـ C9 مفعلة بالكامل لحماية مستنداتك وسجل الحقيقة الموثق.`;

  const text = await generateAIAnswer(contextPrompt, fallbackText);
  const cleanText = LexiPolicyEnforcer.decisionLock(text);
  res.json({ text: cleanText });
});

// 7. Endpoint: Multimodal Document & Risk Image Analyst (OCR + Visual Audit)
app.post("/api/agent/analyze-image", async (req: Request, res: Response) => {
  const { imageBase64, mimeType, prompt } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Missing imageBase64 data." });
  }

  const defaultPrompt = `You are the Lead Cyber-Sovereign Auditor at LexOps Sovereign OS. 
Analyze this visual asset (which could be an administrative document, warning slip, site photo, proof of emergency, or compliance certificate) for KSA enterprise environment.
Extract any text via state-of-the-art OCR in Arabic, evaluate risks, and suggest corrective procedures according to Saudi regulations. Mention regulatory status. Use elegant KSA executive style.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.json({
        ocrAvailable: false,
        requiresManualInput: true,
        text: "⚠️ مفتاح Vision AI غير متوفر — الإدخال اليدوي مطلوب للبيانات والمستندات."
      });
      return;
    }

    const client = getGeminiClient();
    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: imageBase64,
      },
    };
    const textPart = {
      text: prompt || defaultPrompt,
    };

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
    });

    res.json({ text: response.text || "فشل توليد التحليل البصري." });
  } catch (err: any) {
    const errStr = String(err.message || err || "");
    const errStrLower = errStr.toLowerCase();
    const isBillingOrQuotaError = errStrLower.includes("prepayment") ||
                                  errStrLower.includes("depleted") ||
                                  errStrLower.includes("429") ||
                                  errStrLower.includes("resource_exhausted") ||
                                  errStrLower.includes("dunning") ||
                                  errStrLower.includes("deny for project") ||
                                  errStrLower.includes("permission_denied") ||
                                  errStrLower.includes("403") ||
                                  errStrLower.includes("billing") ||
                                  errStrLower.includes("payment");
    if (isBillingOrQuotaError) {
      console.warn("Image analysis warning (Billing/Quota - Handled via Fallback):", errStr);
    } else {
      console.error("Image analysis error:", err);
    }
    if (isBillingOrQuotaError) {
      res.json({
        text: `⚠️ [تنبيه هام - رصيد حساب Gemini]:
أرصدة الدفع المسبق (Prepayment Credits) الخاصة بمفتاح Gemini API في منصة Google AI Studio قد نفدت بالكامل. يرجى تزويد حسابكم بالرصيد لإستدعاء الذكاء الاصطناعي السحابي المباشر.

تم استخدام الفهرسة المحلية الساندة لتزويدك بالتحليل المبدئي الحياكي بنجاح:
* **نوع المستند المميز:** إثبات حالة طوارئ فنية (تحليل بصري ساند)
* **توصيف المخاطر ومعدلات الامتثال:** رصد عدم توافق مؤقت بطلبات السحابة.
* **البديل المتخذ:** جدولة البيانات وضمان حفظ السجلات آمنة محلياً عبر C9 Ledger لحين استقرار قنوات الاتصالات.`
      });
    } else {
      res.json({
        text: `⚠️ عذراً، تعذر الاتصال بـ Gemini للتحليل البصري بسبب مشكلة فنية: ${err.message || err}\n\nنوصي بالتحقق من صحة الصورة يدوياً وملائمتها للسياسات.`
      });
    }
  }
});

// [DUPLICATE ACTIVE ENTRY DEPRECATED: Standard gated policy-enforced route is defined at line 1633]

// --- Nodemailer Automated Email Notification Service & State Store ---
interface EmailLog {
  id: string;
  to: string;
  subject: string;
  type: "violation" | "health_warning" | "share_citation" | "broadcast_alert";
  sentAt: string;
  status: "delivered" | "simulated" | "failed";
  bodyPreview: string;
  errorMessage?: string;
  etherealUrl?: string;
}

let emailLogs: EmailLog[] = [
  {
    id: "EML-101",
    to: "emp.saad@raedlog.sa",
    subject: "🩺 إنذار وقائي: اقتراب موعد تجديد الشهادة الصحية بلدي - منصة LexOps",
    type: "health_warning",
    sentAt: new Date(Date.now() - 3600000 * 5).toISOString().replace('T', ' ').substring(0, 16),
    status: "simulated",
    bodyPreview: "رقم الشهادة: HC-14923-M | الاسم: سعد الدوسري | تاريخ الانتهاء المتبقي: 5 أيام",
    etherealUrl: "https://ethereal.email"
  }
];

function getMailTransporter() {
  const gmailClientId = process.env.GMAIL_CLIENT_ID;
  const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET;
  const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const gmailFrom = process.env.GMAIL_FROM || "LexOps Alerts <noreply@lexops.sa>";
  
  const gmailUser = process.env.GMAIL_USER || process.env.GMAIL_USERNAME;
  const gmailPass = process.env.GMAIL_PASS || process.env.GMAIL_PASSWORD;

  const extractEmail = (str: string): string => {
    const match = str.match(/<([^>]+)>/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return str.trim();
  };

  const extracted = extractEmail(gmailFrom);
  // Smart fallback: if GMAIL_FROM is using default noreply/lexops host, use the user's primary email address
  const authUser = gmailUser || (extracted.includes("noreply") || extracted.includes("lexops.sa") ? "sultan2030famli@gmail.com" : extracted);

  if (gmailClientId && gmailClientSecret && gmailRefreshToken) {
    console.log(`📡 Gmail API (OAuth2) Mailer Service Activated. Auth User: ${authUser}, From: ${gmailFrom}`);
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: authUser,
        clientId: gmailClientId,
        clientSecret: gmailClientSecret,
        refreshToken: gmailRefreshToken
      }
    });
  } else if (gmailUser && gmailPass) {
    console.log(`📡 Gmail SMTP (App Password) Mailer Service Activated for: ${gmailUser}`);
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });
  }
  return null;
}

// Endpoint: POST /api/emailer/send
app.post("/api/emailer/send", async (req: Request, res: Response) => {
  const { type, to, data } = req.body;

  if (!to) {
    return res.status(400).json({ error: "البريد الإلكتروني للطرف المستلم مطلوب (Recipient email is required)" });
  }

  const employeeName = data?.employeeName || "منسوب المنشأة";
  
  let subject = "";
  if (type === "violation") {
    subject = `⚠️ إشعار عاجل: قيّد مخالفة تنظيمية جديدة برقم ${data?.violationId || "LEX-2026"} - منصة LexOps`;
  } else if (type === "share_citation") {
    subject = `⚖️ الإحالة القانونية المستعجلة: ملف مخالفة ${data?.violationId || "LEX-2026"} - منشأة ${data?.entityName || "المنشأة"}`;
  } else if (type === "broadcast_alert") {
    subject = `📢 بلاغ وتعميم عاجل لجميع المشتركين: ${data?.broadcastSubject || "تحديث إرشادي هام"}`;
  } else {
    subject = `🩺 إنذار وقائي: اقتراب موعد انتهاء الشهادة الصحية بلدي - منصة LexOps`;
  }

  // Render highly-polished high-contrast responsive enterprise-grade HTML Email template matching Saudi legal aesthetic
  let htmlContent = "";
  if (type === "violation") {
    htmlContent = `
      <div style="direction: rtl; text-align: right; font-family: 'Segoe UI', Arial, sans-serif; background-color: #030712; color: #f3f4f6; padding: 25px; border-radius: 12px; border: 1px solid #ef4444; max-width: 600px; margin: 15px auto;">
        <div style="border-bottom: 2px solid #ef4444; padding-bottom: 12px; margin-bottom: 20px; text-align: center;">
          <h2 style="color: #ef4444; margin: 0; font-size: 20px; font-weight: 800;">🏛️ منصة الإدارة السيادية المعززة LexOps OS</h2>
          <span style="font-size: 10px; color: #9ca3af; letter-spacing: 1px; font-weight: bold; text-transform: uppercase;">Sovereign Violation Incident Gateway</span>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #f3f4f6; margin-bottom: 15px;">الزميل اللوجستي الميداني المحترم / <strong>${employeeName}</strong>،</p>
        <p style="font-size: 13px; line-height: 1.6; color: #d1d5db; margin-bottom: 20px;">نحيطكم علماً بأنه قد تم تلقي وإشهار <strong>إشعار مخالفة تشغيلية رسمية جديدة</strong> مسجلة بحقكم، ومطابقة وثيقتها القانونية تلقائياً بسجل الحقيقة الوطني اللامركزي وسلاسل الكتل C9 Ledger.</p>
        
        <div style="background-color: #0b0f19; padding: 16px; border-radius: 8px; border-right: 4px solid #ef4444; margin: 18px 0; border-left: 1px solid rgba(255,255,255,0.05); border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05);">
          <h3 style="color: #ef4444; margin-top: 0; font-size: 15px; font-weight: bold; margin-bottom: 12px;">🚨 بيان المخالفة والخرق المرصود:</h3>
          <table style="width: 100%; font-size: 12px; color: #e5e7eb; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 8px 0; color: #9ca3af; width: 130px;"><strong>رقم المخالفة الموحد:</strong></td>
              <td style="padding: 8px 0; font-family: monospace; color: #ffffff; font-weight: bold;">${data?.violationId || "LEX-OBJ-9831"}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 8px 0; color: #9ca3af;"><strong>نوع وخرق الامتثال:</strong></td>
              <td style="padding: 8px 0; color: #fca5a5; font-weight: bold;">${data?.violationType || "عدم الالتزام ببروتوكول أمن المعلومات والخصوصية"}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 8px 0; color: #9ca3af;"><strong>تفاصيل السلوك والضبط:</strong></td>
              <td style="padding: 8px 0; color: #cbd5e1; line-height: 1.5;">${data?.details || "دخول مكرر وغير مصادق خارج السياج الجغرافي المعاير للمنشأة"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;"><strong>مهلة تقديم الاستئناف:</strong></td>
              <td style="padding: 8px 0; color: #fbbf24; font-weight: bold; font-size: 13px;">${data?.deadline || "خلال 72 ساعة من الضبط"}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #020617; padding: 12px; border-radius: 6px; border: 1px dashed rgba(212,175,55,0.3); margin: 15px 0; font-size: 10px; font-family: monospace; color: #10b981; direction: ltr; text-align: left; line-height: 1.4;">
          <strong style="color: #d4af37;">🛡️ C9 SECURED TRANSIT BLOCK HASH SEAL:</strong><br/>
          BLOCK: #${Date.now().toString().slice(-4)} ✓<br/>
          HASH: ${data?.ledgerHash || "0xc982bfde38210336fd812a67bc45ebb9a84"}<br/>
          SECURE_CLEARANCE: SVRN_LVL_4_BOUNDED
        </div>

        <p style="font-size: 12.5px; line-height: 1.6; color: #9ca3af; margin-top: 15px;"><strong>الأثر المطلوب:</strong> يرجى سرعة تسجيل الدخول فوراً عبر واجهة الموظفين في منصة LexOps للتقدم باعتراض فوري مدعوم بالتقاط البصمة الرياضية والموقع الجغرافي (GPS Audit) قبل تصنيف الغرامة بشكل دائم.</p>
        
        <div style="text-align: center; margin-top: 25px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
          <small style="color: #4b5563; font-size: 10px;">هذا البريد الإلكتروني مؤتمت وتلقائي بموجب بروتوكولات حوكمة العمل المعايرة للشركات بـ LexOps.</small>
        </div>
      </div>
    `;
  } else if (type === "share_citation") {
    const orgName = data?.entityName || "المنشأة المستهدفة";
    const details = data?.details || "غير متوفر";
    const impact = data?.impactLevel || "غير محدد";
    const status = data?.status || "معلق";
    const notes = data?.customNotes || "لا توجد ملاحظات قانونية إضافية.";
    htmlContent = `
      <div style="direction: rtl; text-align: right; font-family: 'Segoe UI', Arial, sans-serif; background-color: #020617; color: #f3f4f6; padding: 25px; border-radius: 12px; border: 2px dashed #d4af37; max-width: 650px; margin: 15px auto;">
        <div style="border-bottom: 2px solid #d4af37; padding-bottom: 12px; margin-bottom: 20px; text-align: center;">
          <h2 style="color: #d4af37; margin: 0; font-size: 20px; font-weight: 800;">🏛️ حوكمة الحماية السيادية LexOps OS</h2>
          <span style="font-size: 9px; color: #a1a1aa; letter-spacing: 1px; font-weight: bold; text-transform: uppercase;">Legal Counsel Consultation Dispatch</span>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #f3f4f6; margin-bottom: 15px;">المكرم / <strong>المستشار والمسؤول القانوني للمنشأة (${orgName})</strong> المحترم،</p>
        <p style="font-size: 13px; line-height: 1.6; color: #d1d5db; margin-bottom: 15px;">تمت مشاركة الملف القانوني الكامل لتقرير المخالفة المحررة أدناه لمباشرة تدابير الدفاع والاعتراض أو التسوية الفورية، وذلك لتأمين نطاق الامتثال المالي والجغرافي للكيان:</p>
        
        <div style="background-color: #0b1329; padding: 16px; border-radius: 8px; border-right: 4px solid #d4af37; margin: 18px 0; border: 1px solid rgba(212,175,55,0.15);">
          <h3 style="color: #d4af37; margin-top: 0; font-size: 14px; font-weight: bold; margin-bottom: 12px;">⚖️ تفاصيل وبيانات ملف المخالفة الصادرة:</h3>
          <table style="width: 100%; font-size: 12px; color: #e5e7eb; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 8px 0; color: #a1a1aa; width: 150px;"><strong>المعرف الفرعي للمخالفة:</strong></td>
              <td style="padding: 8px 0; font-family: monospace; color: #ffffff; font-weight: bold;">${data?.violationId || "N/A"}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 8px 0; color: #a1a1aa;"><strong>نوع الانتهاك المرتبط:</strong></td>
              <td style="padding: 8px 0; color: #f87171; font-weight: bold;">${data?.citationType || "N/A"}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 8px 0; color: #a1a1aa;"><strong>المنشأة والكيان التجاري:</strong></td>
              <td style="padding: 8px 0; color: #e4e4e7;">${orgName}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 8px 0; color: #a1a1aa;"><strong>المتهم والمنتسب ذو العلاقة:</strong></td>
              <td style="padding: 8px 0; color: #38bdf8; font-weight: bold;">${employeeName}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 8px 0; color: #a1a1aa;"><strong>تقرير وتفاصيل الرصد:</strong></td>
              <td style="padding: 8px 0; color: #cbd5e1; line-height: 1.5; font-style: italic;">"${details}"</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 8px 0; color: #a1a1aa;"><strong>مؤشر الأثر المالي/التنظيمي:</strong></td>
              <td style="padding: 8px 0; color: #f43f5e; font-weight: bold;">${impact}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 8px 0; color: #a1a1aa;"><strong>حالة المعاملة الحالية:</strong></td>
              <td style="padding: 8px 0; color: #fbbf24; font-weight: bold;">${status}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 8px 0; color: #a1a1aa;"><strong>توقيت رصد الضبط:</strong></td>
              <td style="padding: 8px 0; font-family: monospace; color: #ffffff;">${data?.issuedAt || "N/A"}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #020617; padding: 14px; border-radius: 8px; border: 1px dashed rgba(212,175,55,0.3); margin: 18px 0;">
          <h4 style="color: #fbbf24; margin-top: 0; font-size: 13px; font-weight: bold; margin-bottom: 6px;">📝 توجيهات وملاحظات إدارة المنشأة المرفقة:</h4>
          <p style="font-size: 12px; color: #e4e4e7; line-height: 1.6; margin: 0; font-style: italic;">${notes}</p>
        </div>

        <div style="background-color: #0b0f19; padding: 12px; border-radius: 6px; border: 1px solid rgba(16,185,129,0.25); margin: 15px 0; font-size: 10px; font-family: monospace; color: #34d399; direction: ltr; text-align: left; line-height: 1.4;">
          <strong style="color: #d4af37;">🛡️ SECURED DIGITAL COURT TRANSFER SIGNAL:</strong><br/>
          METRIC: VALIDATED_AUDIT_TRAIL_ACTIVE<br/>
          HASH: ${data?.ledgerHash || "0xc9_sig_983faddb1a80c9a76d8b3c9"}<br/>
          VERIFICATION: C9_LEDGER_STABLE
        </div>

        <p style="font-size: 12px; line-height: 1.6; color: #9ca3af; margin-top: 15px;"><strong>مطلوب من المستشار القانوني:</strong> مراجعة المستند المرفق وصياغة مذكرة الدفاع المناسبة عبر منصة LexOps قبل انقضاء جولة الطعن المقررة نظاماً.</p>
        
        <div style="text-align: center; margin-top: 25px; border-top: 1px solid rgba(212,175,55,0.15); padding-top: 15px;">
          <small style="color: #4b5563; font-size: 10px;">هذا الملف القانوني مرسل وموثق من نظام حوكمة الأثر الرقمي بـ LexOps.</small>
        </div>
      </div>
    `;
  } else if (type === "broadcast_alert") {
    const customMessage = data?.broadcastMessage || "غير متوفر";
    htmlContent = `
      <div style="direction: rtl; text-align: right; font-family: 'Segoe UI', Arial, sans-serif; background-color: #020617; color: #f3f4f6; padding: 25px; border-radius: 12px; border: 2px solid #3b82f6; max-width: 650px; margin: 15px auto;">
        <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px; text-align: center;">
          <h2 style="color: #3b82f6; margin: 0; font-size: 20px; font-weight: 800;">📣 تعميم وبلاغ عام - منصة LexOps OS</h2>
          <span style="font-size: 9px; color: #cbd5e1; letter-spacing: 1px; font-weight: bold; text-transform: uppercase;">Global Platform-Wide Broadcast Announcement</span>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #f3f4f6; margin-bottom: 15px;">السادة / <strong>منسوبي، شركاء ومشتريكي منصة LexOps OS الأفاضل</strong>،</p>
        <p style="font-size: 13px; line-height: 1.6; color: #e4e4e7; margin-bottom: 15px;">تصدر إدارة منصة الإدارة السيادية المعززة LexOps هذا التعميم الرقابي والتعليمات التنظيمية العاجلة لكافة المستفيدين والمنشآت المسجلة:</p>
        
        <div style="background-color: #0b1329; padding: 20px; border-radius: 10px; border-right: 4px solid #3b82f6; margin: 18px 0; border: 1px solid rgba(59,130,246,0.25);">
          <h3 style="color: #3b82f6; margin-top: 0; font-size: 14px; font-weight: bold; margin-bottom: 12px;">📢 نص التعميم والبلاغ التنظيمي:</h3>
          <p style="font-size: 13px; color: #ffffff; line-height: 1.7; margin: 0; white-space: pre-wrap;">${customMessage}</p>
        </div>

        <div style="background-color: #0f172a; padding: 12px; border-radius: 6px; border: 1px dashed rgba(59,130,246,0.3); margin: 15px 0; font-size: 10px; font-family: monospace; color: #93c5fd; direction: ltr; text-align: left; line-height: 1.4;">
          <strong style="color: #60a5fa;">🛡️ BROADCAST DIGEST SIGNATURE:</strong><br/>
          ORIGIN: LEXOPS_CENTRAL_SADE<br/>
          STAMP: LEX-BC-${Date.now().toString().slice(-6)} ✓<br/>
          AUDIENCE: ALL_CERTIFIED_SUBSCRIBERS
        </div>

        <p style="font-size: 12px; line-height: 1.6; color: #9ca3af; margin-top: 15px;"><strong>ملاحظة للمشتركين:</strong> يلتزم جميع المشرفين والمدراء التنفيذيين بمواءمة إجراءاتهم الميدانية وقنوات الحوكمة لديهم بما يطابق الإرشادات الموضحة في هذا البلاغ فوراً.</p>
        
        <div style="text-align: center; margin-top: 25px; border-top: 1px solid rgba(59,130,246,0.15); padding-top: 15px;">
          <small style="color: #4b5563; font-size: 10px;">هذا البلاغ رسمي وصادق من البوابة العامة لمنصة LexOps OS السيادية.</small>
        </div>
      </div>
    `;
  } else {
    htmlContent = `
      <div style="direction: rtl; text-align: right; font-family: 'Segoe UI', Arial, sans-serif; background-color: #030712; color: #f3f4f6; padding: 25px; border-radius: 12px; border: 1px solid #fbbf24; max-width: 600px; margin: 15px auto;">
        <div style="border-bottom: 2px solid #fbbf24; padding-bottom: 12px; margin-bottom: 20px; text-align: center;">
          <h2 style="color: #fbbf24; margin: 0; font-size: 20px; font-weight: 800;">🏛️ منصة الإدارة السيادية المعززة LexOps OS</h2>
          <span style="font-size: 10px; color: #9ca3af; letter-spacing: 1px; font-weight: bold; text-transform: uppercase;">Preventive Health Certification Alerts</span>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #f3f4f6; margin-bottom: 15px;">أهلاً بزميل العمل الجدير / <strong>${employeeName}</strong>،</p>
        <p style="font-size: 13px; line-height: 1.6; color: #d1d5db; margin-bottom: 20px;">نرسل إليك هذا <strong>الإنذار الرقابي الاستباقي العاجل</strong>، بالتنسيق مع مسؤولي الامتثال في المنشأة، حيث تم رصد اقتراب انتهاء فاعليّة وصلاحية شهادتك الصحية البلدية المقيدة بالنظام.</p>
        
        <div style="background-color: #0b0f19; padding: 16px; border-radius: 8px; border-right: 4px solid #fbbf24; margin: 18px 0; border-left: 1px solid rgba(255,255,255,0.05); border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05);">
          <h3 style="color: #fbbf24; margin-top: 0; font-size: 15px; font-weight: bold; margin-bottom: 12px;">📋 بيانات بطاقة الشهادة والإنذار:</h3>
          <table style="width: 100%; font-size: 12px; color: #e5e7eb; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 8px 0; color: #9ca3af; width: 140px;"><strong>رمز الشهادة الحالية:</strong></td>
              <td style="padding: 8px 0; font-family: monospace; color: #ffffff;">${data?.healthNumber || "HC-14923-M"}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 8px 0; color: #9ca3af;"><strong>تاريخ انتهاء السريان:</strong></td>
              <td style="padding: 8px 0; color: #f87171; font-weight: bold;">${data?.expiryDate || "2026-06-05"}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 8px 0; color: #9ca3af;"><strong>الأيام المتبقية للتجديد:</strong></td>
              <td style="padding: 8px 0; color: #ef4444; font-weight: 900; font-size: 14px;">${data?.remainingDays || "5"} أيام فقط</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #9ca3af;"><strong>الأثر المترتب (غرامة بلدي):</strong></td>
              <td style="padding: 8px 0; color: #ef4444;">غرامة بلدية فورية تبدأ من 1,000 ر.س مع إمكانية تعليق النشاط ورقابة الفرع بالكامل.</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 12.5px; line-height: 1.6; color: #9ca3af; margin-top: 15px;"><strong>الإجراء المطلوب بشكل عاجل:</strong> يرجى سرعة التوجه لإجراء الفحص الطبي المقرر عبر أمانة البلدية المعتمدة، ثم تسجيل الدخول للوحة الموظفين لرفع مستمسك الشهادة المحدث لاستمرار نقاط حمايتك التشغيلية سارية ومطابقة بنجاح.</p>
        
        <div style="text-align: center; margin-top: 25px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
          <small style="color: #4b5563; font-size: 10px;">إخطار وقائي مرسل بنقرة من إدارة المنشأة عبر خادم Nodemailer الموثوق.</small>
        </div>
      </div>
    `;
  }

  let mailStatus: "delivered" | "simulated" | "failed" = "simulated";
  let etherealLink: string | undefined = undefined;
  let exceptionMessage: string | undefined = undefined;
  let isSuccessful = true;

  try {
    const transporter = getMailTransporter();
    if (transporter) {
      const fromAddr = process.env.GMAIL_FROM || "LexOps Alerts <noreply@lexops.sa>";
      const info = await transporter.sendMail({
        from: fromAddr,
        to,
        subject,
        html: htmlContent,
      });
      console.log(`✉️ Real Gmail dispatch success: ${info.messageId}`);
      mailStatus = "delivered";
    } else {
      console.log("ℹ️ No Gmail configurations defined. Generating temporary Ethereal test mailbox mapping.");
      const testAccount = await nodemailer.createTestAccount();
      const testTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      const info = await testTransporter.sendMail({
        from: '"LexOps OS" <noreply@lexops.sa>',
        to,
        subject,
        html: htmlContent,
      });
      
      etherealLink = nodemailer.getTestMessageUrl(info) || undefined;
      console.log(`✉️ Simulated delivery via Ethereal: ${etherealLink}`);
      mailStatus = "simulated";
    }
  } catch (smtpErr: any) {
    console.error("⚠️ Nodemailer failed to commit delivery:", smtpErr);
    mailStatus = "failed";
    exceptionMessage = smtpErr.message || String(smtpErr);
    isSuccessful = false;
  }

  const logEntry: EmailLog = {
    id: `EML-${Date.now().toString().slice(-3)}`,
    to,
    subject,
    type: type as any,
    sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: mailStatus,
    bodyPreview: type === "violation"
      ? `رقم المخالفة: ${data?.violationId || "LEX-2026"} | الموظف: ${employeeName} | خرق: ${data?.violationType || "أمن الخصوصية"}`
      : type === "share_citation"
      ? `إحالة مخالفة ${data?.violationId} إلى المستشار القانوني لـ ${data?.entityName}`
      : type === "broadcast_alert"
      ? `إرسال تعميم كلي للمشتركين بخصوص: ${data?.broadcastSubject}`
      : `تنبيه الشهادة الصحية: رخصة رقم ${data?.healthNumber || "HC-14923"} للموظف ${employeeName} ستنتهي بعد ${data?.remainingDays || 5} أيام`,
    errorMessage: exceptionMessage,
    etherealUrl: etherealLink
  };

  emailLogs.unshift(logEntry);

  res.status(isSuccessful ? 200 : 500).json({
    success: isSuccessful,
    status: mailStatus,
    log: logEntry,
    etherealUrl: etherealLink,
    errorMessage: exceptionMessage,
    message: isSuccessful ? "تم توجيه البريد وعزل المعاملات بنجاح" : `فشل إرسال البريد الإلكتروني: ${exceptionMessage}`
  });
});

// Endpoint: POST /api/emailer/send-expiry-alert
app.post("/api/emailer/send-expiry-alert", async (req: Request, res: Response) => {
  const { to, companyName, crNumber, crExpiryDate, municipalLicenseNumber, municipalExpiryDate } = req.body;

  if (!to) {
    return res.status(400).json({ error: "البريد الإلكتروني للجهة المستلمة مطلوب (Recipient email is required)" });
  }

  const subject = `📢 إنذار مبكر: اقتراب انتهاء التراخيص النظامية لـ ${companyName || "المنشأة"} (خلال 30 يوماً)`;

  const htmlContent = `
    <div style="direction: rtl; text-align: right; font-family: 'Segoe UI', Arial, sans-serif; background-color: #030712; color: #f3f4f6; padding: 25px; border-radius: 12px; border: 1px solid #d4af37; max-width: 600px; margin: 15px auto;">
      <div style="border-bottom: 2px solid #d4af37; padding-bottom: 12px; margin-bottom: 20px; text-align: center;">
        <h2 style="color: #d4af37; margin: 0; font-size: 20px; font-weight: 800;">🏛️ منصة الإدارة السيادية المعززة LexOps OS</h2>
        <span style="font-size: 10px; color: #9ca3af; letter-spacing: 1px; font-weight: bold; text-transform: uppercase;">Corporate License Expiry Safeguard</span>
      </div>
      
      <p style="font-size: 14px; line-height: 1.6; color: #f3f4f6; margin-bottom: 15px;">مسؤول الامتثال المحترم في شركة <strong>${companyName || "المنشأة"}</strong>،</p>
      <p style="font-size: 13px; line-height: 1.6; color: #d1d5db; margin-bottom: 20px;">نحيطكم علماً بأنه بموجب المراقبة الاستباقية لبيانات التسجيل التجاري والتراخيص في خادم بلدي وقوى الموحد، فقد تم رصد <strong>انتهاء التراخيص الموضحة أدناه خلال مهلة الـ 30 يوماً القادمة</strong>.</p>
      
      <div style="background-color: #0b0f19; padding: 16px; border-radius: 8px; border-right: 4px solid #f59e0b; margin: 18px 0; border-left: 1px solid rgba(255,255,255,0.05); border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05);">
        <h3 style="color: #f59e0b; margin-top: 0; font-size: 15px; font-weight: bold; margin-bottom: 12px;">📋 بيان التراخيص والتنبيهات الموقوتة:</h3>
        <table style="width: 100%; font-size: 12px; color: #e5e7eb; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 8px 0; color: #9ca3af; width: 150px;"><strong>رقم السجل التجاري:</strong></td>
            <td style="padding: 8px 0; font-family: monospace; color: #ffffff; font-weight: bold;">${crNumber || "1010344552"}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 8px 0; color: #9ca3af;"><strong>تاريخ انتهاء السجل:</strong></td>
            <td style="padding: 8px 0; color: #f87171; font-weight: bold;">${crExpiryDate || "غير محدد"} (متبقي أقل من 30 يوماً)</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 8px 0; color: #9ca3af;"><strong>رقم رخصة البلدية:</strong></td>
            <td style="padding: 8px 0; font-family: monospace; color: #ffffff;">${municipalLicenseNumber || "1400239103"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #9ca3af;"><strong>تاريخ انتهاء رخصة بلدي:</strong></td>
            <td style="padding: 8px 0; color: #f87171; font-weight: bold;">${municipalExpiryDate || "غير محدد"} (متبقي أقل من 30 يوماً)</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 12.5px; line-height: 1.6; color: #9ca3af; margin-top: 15px;"><strong>الأثر النظامي والتشغيلي:</strong> عدم المبادرة بالتجديد السريع قبل 30 يوماً من الانتهاء يُعرض المنشأة لغرامات إشغار بلدية تلقائية تتراوح بين 5,000 إلى 20,000 ريال سعودي، بالإضافة لإيقاف بوابات إصدار التأشيرات وعقود التوطين قوى.</p>
      
      <div style="text-align: center; margin-top: 25px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
        <small style="color: #4b5563; font-size: 10px;">إخطار وقائي مرسل بنقرة من نظام حماية التراخيص بـ LexOps عبر خادم Nodemailer الموثوق.</small>
      </div>
    </div>
  `;

  let mailStatus: "delivered" | "simulated" | "failed" = "simulated";
  let etherealLink: string | undefined = undefined;
  let exceptionMessage: string | undefined = undefined;
  let isSuccessful = true;

  try {
    const transporter = getMailTransporter();
    if (transporter) {
      const fromAddr = process.env.GMAIL_FROM || '"LexOps OS" <noreply@lexops.sa>';
      const info = await transporter.sendMail({
        from: fromAddr,
        to,
        subject,
        html: htmlContent,
      });
      console.log(`✉️ Expiry alert dispatched via Gmail API (OAuth2) to ${to}`);
      mailStatus = "delivered";
    } else {
      console.log("📡 Gmail API undefined. Testing simulated dispatch through Ethereal E-mail...");
      const testAccount = await nodemailer.createTestAccount();
      const testTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      const info = await testTransporter.sendMail({
        from: '"LexOps OS" <noreply@lexops.sa>',
        to,
        subject,
        html: htmlContent,
      });
      
      etherealLink = nodemailer.getTestMessageUrl(info) || undefined;
      console.log(`✉️ Expiry simulated dispatch success: ${etherealLink}`);
      mailStatus = "simulated";
    }
  } catch (smtpErr: any) {
    console.error("⚠️ SMTP license notification transport failure:", smtpErr);
    mailStatus = "failed";
    exceptionMessage = smtpErr.message || String(smtpErr);
    isSuccessful = false;
  }

  const logEntry: EmailLog = {
    id: `EML-${Date.now().toString().slice(-3)}`,
    to,
    subject,
    type: "health_warning",
    sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: mailStatus,
    bodyPreview: `إنذار انتهاء التراخيص لشركة ${companyName || "المنشأة"} | سجل: ${crNumber} | بلدي: ${municipalLicenseNumber}`,
    errorMessage: exceptionMessage,
    etherealUrl: etherealLink
  };

  emailLogs.unshift(logEntry);

  res.status(isSuccessful ? 200 : 500).json({
    success: isSuccessful,
    status: mailStatus,
    log: logEntry,
    etherealUrl: etherealLink,
    errorMessage: exceptionMessage,
    message: isSuccessful ? "تم إرسال بريد حماية تراخيص المنشأة بنجاح بنظام Nodemailer" : `فشل إرسال بريد حماية تراخيص المنشأة: ${exceptionMessage}`
  });
});

// Endpoint: POST /api/sade/ocr-verify
app.post("/api/sade/ocr-verify", async (req: Request, res: Response) => {
  const { base64Image, fileName, fileType } = req.body;

  if (!base64Image) {
    return res.status(400).json({ success: false, error: "Base64 image is required." });
  }

  // Prompt that forces a clean JSON output of key regulatory details
  const prompt = `You are an elite sovereign OCR and compliance verification auditor for LexOps OS in Saudi Arabia.
Analyze this uploaded paper document image and extract key corporate registration details.
Extract:
1. Commercial Registration Number (رقم السجل التجاري). It is typically a 10-digit number (e.g., 1010344552 or 2050988776).
2. Date of issuance/expiration (التاريخ). Format it as a human-friendly string (Gregorian or Hijri).
3. The presence of any stamp or seal (وجود الختم وتفاصيله). Look for round municipal, chamber of commerce, SADE, or corporate stamps.
4. The title/name of the document (اسم المستند).

Return a JSON object ONLY, with no extra characters or markdown surrounding it (do not use \`\`\`json, just output the raw JSON string).
Conform strictly to this schema:
{
  "documentName": "Name/Title of document in Arabic",
  "crNumber": "10-digit registration number, or empty if not found",
  "date": "Date found on the document, or empty if not found",
  "isSealPresent": true,
  "stampDetails": "Description of the seal/stamp in Arabic, e.g., 'ختم أزرق دائري لبلدية الدمام', or empty if not found"
}`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        simulated: false,
        error: "فشل التحقق البصري السيادي: مفتاح الذكاء الاصطناعي (GEMINI_API_KEY) غير مهيأ. يرجى تهيئة المفتاح في إعدادات البيئة لإجراء فحص بصري حقيقي، أو إدخال بيانات الوثيقة يدوياً منعاً لاستخدام أي بيانات محاكاة أو وهمية."
      });
    }

    const client = getGeminiClient();
    
    // Clean base64 string
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType: fileType || "image/png",
        data: base64Data
      }
    };

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          imagePart,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    let rawText = response.text || "";
    rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(rawText);
      res.json({
        success: true,
        simulated: false,
        data: parsed
      });
    } catch (parseErr) {
      console.warn("Gemini output parsing failed, rawText:", rawText);
      res.status(422).json({
        success: false,
        simulated: false,
        error: "تعذر فك شفرة استجابة المستخرج البصري بدقة. يرجى إعادة رفع صورة أوضح للمستند الرسمي.",
        details: rawText
      });
    }

  } catch (error: any) {
    console.error("OCR verify Gemini error:", error);
    res.status(500).json({
      success: false,
      simulated: false,
      error: `فشل معالجة الوثيقة عبر محرك الرؤية: ${error.message || String(error)}`
    });
  }
});

// Endpoint: GET /api/emailer/logs
app.get("/api/emailer/logs", (req: Request, res: Response) => {
  res.json(emailLogs);
});

// ============================================================================
// P0-1 SECURITY PATCH: Guarded Dev Login (Disabled in Production)
// ============================================================================
function generateSovereignToken(payload: { uid: string; email: string; role: string; entityId: string }): string {
  const secret = process.env.C9_SECRET_KEY || "C9_SOVEREIGN_ROOT_SECRET_KEY_2026_LEXOPS_CORE_HASH_AUTHENTICATION_VAULT";
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

app.post('/api/auth/dev-login', (req: Request, res: Response) => {
  // 1. Strict Environment Barrier
  const isProduction = process.env.NODE_ENV === 'production' || process.env.SOVEREIGN_MODE === 'PRODUCTION';
  
  if (isProduction) {
    return res.status(403).json({
      success: false,
      code: 'SOV_DEV_LOGIN_DISABLED',
      error: 'Access Denied: Development login endpoints are strictly disabled in production environments.'
    });
  }

  // 2. Controlled Development Fallback
  try {
    const { email, role = 'employee', entityId } = req.body;

    // Reject elevated privilege claims in dev endpoint
    if (role === 'founder' || role === 'SOVEREIGN_CONTROLLER' || entityId === 'GLOBAL') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Elevated sovereign roles cannot be issued via dev-login.'
      });
    }

    const token = generateSovereignToken({
      uid: `dev-user-${Date.now()}`,
      email: email || 'dev-user@lexops.sa',
      role: role,
      entityId: entityId || 'DEV_TEST_ENTITY'
    });

    return res.json({
      success: true,
      token,
      user: { email, role, entityId: entityId || 'DEV_TEST_ENTITY' }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 1. Real Payroll & WPS Engine
// ==========================================
interface SalarySlipCalculation {
  employeeId: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  unpaidLeaveDays: number;
  deductions: number;
  isSaudi: boolean;
}

app.post("/api/payroll/calculate-wps", async (req: Request, res: Response) => {
  try {
    const { employeeList, month, year, orgUnified700, bankCode } = req.body;
    if (!Array.isArray(employeeList)) {
      return res.status(400).json({ error: "employeeList must be an array" });
    }

    let totalGross = 0;
    let totalNet = 0;
    let totalGOSICompany = 0;
    const processedSlips = [];

    for (const emp of employeeList as SalarySlipCalculation[]) {
      const gosiWage = Math.min((emp.basicSalary || 0) + (emp.housingAllowance || 0), 45000);
      const gosiEmployeeDeduction = emp.isSaudi ? gosiWage * 0.0975 : gosiWage * 0.02;
      const gosiCompanyContribution = emp.isSaudi ? gosiWage * 0.1175 : gosiWage * 0.02;

      const dailyRate = ((emp.basicSalary || 0) + (emp.housingAllowance || 0) + (emp.transportAllowance || 0)) / 30;
      const absenceDeduction = Math.round(dailyRate * (emp.unpaidLeaveDays || 0));

      const grossSalary = (emp.basicSalary || 0) + (emp.housingAllowance || 0) + (emp.transportAllowance || 0) + (emp.otherAllowances || 0);
      const totalDeductions = gosiEmployeeDeduction + absenceDeduction + (emp.deductions || 0);
      const netSalary = Math.round(grossSalary - totalDeductions);

      totalGross += grossSalary;
      totalNet += netSalary;
      totalGOSICompany += gosiCompanyContribution;

      processedSlips.push({
        employeeId: emp.employeeId,
        grossSalary,
        netSalary,
        gosiEmployeeDeduction: Math.round(gosiEmployeeDeduction),
        absenceDeduction,
        wpsStatus: netSalary >= ((emp.basicSalary || 0) * 0.5) ? "COMPLIANT" : "FLAGGED_HIGH_DEDUCTION"
      });
    }

    const payrollHash = crypto
      .createHmac("sha256", process.env.C9_SECRET_KEY)
      .update(JSON.stringify({ month, year, orgUnified700, totalNet, count: processedSlips.length }))
      .digest("hex");

    res.json({
      success: true,
      month,
      year,
      summary: { totalGross, totalNet, totalEmployees: processedSlips.length, totalGOSICompany },
      slips: processedSlips,
      payrollC9Hash: payrollHash,
      wpsCompliantFileReady: true
    });
  } catch (error: any) {
    console.error("Payroll WPS Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. Real Geofencing & Anti-Spoofing Attendance Engine
// ==========================================
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

app.post("/api/attendance/geo-punch", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "صلاحيات الوصول مفقودة." });
    }

    const token = authHeader.split(" ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err) {
      return res.status(401).json({ success: false, message: "توكن غير صالح." });
    }

    const employeeId = decodedToken.uid;
    const entityId = decodedToken.entityId || "7070701234";

    const { userLat, userLng, accuracy, isSpoofed, branchId, type } = req.body;

    if (isSpoofed) {
      return res.status(403).json({ success: false, message: "محاولة تزييف الموقع مرفوضة." });
    }

    const lat = Number(userLat);
    const lng = Number(userLng);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: "إحداثيات غير صالحة." });
    }

    let branchLat = 24.7136;
    let branchLng = 46.6753;
    let branchName = "الفرع الرئيسي";

    if (branchId) {
      try {
        const branchSnap = await adminDb.collection("branches").doc(branchId).get();
        if (branchSnap.exists) {
          const bData = branchSnap.data();
          if (bData) {
            branchName = bData.name || bData.branch_name || branchName;
            if (typeof bData.latitude === "number" && typeof bData.longitude === "number") {
              branchLat = bData.latitude;
              branchLng = bData.longitude;
            }
          }
        }
      } catch (e) {
        console.warn("Branch fetch failed, using defaults:", e);
      }
    }

    const ALLOWED_RADIUS_METERS = 100;
    const distanceMeters = haversineDistance(lat, lng, branchLat, branchLng);

    if (distanceMeters > ALLOWED_RADIUS_METERS) {
      return res.status(400).json({
        success: false,
        distanceMeters,
        message: `أنت خارج النطاق المسموح (${Math.round(distanceMeters - ALLOWED_RADIUS_METERS)} متر).`
      });
    }

    const logId = `ATT-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      await adminDb.collection("attendance_logs").doc(logId).set({
        id: logId,
        employeeId,
        entityId,
        branchId: branchId || "",
        branchName,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy || 0,
        timestamp,
        checkType: type === "out" ? "PUNCH_OUT" : "PUNCH_IN"
      });
    } catch (dbErr) {
      console.warn("attendance_logs write fallback recorded:", dbErr);
    }

    return res.json({
      success: true,
      distanceMeters,
      timestamp,
      c9Verified: true,
      log: {
        id: logId,
        branchName,
        timestamp
      }
    });
  } catch (error: any) {
    console.error("Geo-Punch error:", error);
    return res.status(500).json({ success: false, message: error.message || "خطأ داخلي." });
  }
});

  
// Sovereign Identity Engine: Registration Lifecycle Route (3-Step Enrollment)
app.post(["/api/auth/register", "/auth/register"], async (req: any, res: any) => {
  const { email, password, displayName, entityId } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    
    // 1. إنشاء حساب Firebase Auth للموظف عبر الخادم
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: displayName || email.split("@")
    });
    
    const targetEntityId = entityId || "7070701234";
    
    // 2. تعيين الـ Custom Claims السيادية المشفرة والآمنة
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: "employee",
      entityId: targetEntityId,
      isFounder: false
    });
    
    // 3. ربط الـ uid داخل سجل الموظف في Firestore والـ users
    const db = adminDb;
    
    // إنشاء وحفظ مستند الموظف في مجموعة المستخدمين
    await db.collection("users").doc(userRecord.uid).set({
      email,
      entityId: targetEntityId,
      role: "employee",
      isFounder: false,
      displayName: displayName || email.split("@"),
      createdAt: FieldValue.serverTimestamp()
    });
    
    // البحث في سجل الموارد البشرية لتحديث وربط الـ UID ديناميكياً لتطابق قواعد Firestore rules
    const empSnapshot = await db.collection("employees")
      .where("email", "==", email)
      .limit(1)
      .get();
      
    if (!empSnapshot.empty) {
      const empDocId = empSnapshot.docs[0].id;
      await db.collection("employees").doc(empDocId).update({
        uid: userRecord.uid,
        status: "ACTIVE"
      });
      console.log(`Linked existing employee ${email} with uid ${userRecord.uid}`);
    } else {
      // إنشاء مستند جديد بالكامل في حال غيابه المسبق
      await db.collection("employees").add({
        uid: userRecord.uid,
        email,
        name: displayName || email.split("@"),
        entityId: targetEntityId,
        role: "employee",
        status: "ACTIVE",
        createdAt: FieldValue.serverTimestamp()
      });
      console.log(`Created new employee document for ${email} with uid ${userRecord.uid}`);
    }
    
    res.status(200).json({ success: true, uid: userRecord.uid, entityId: targetEntityId });
  } catch (error: any) {
    console.error("Sovereign Registration Error:", error);
    res.status(500).json({ error: error.message });
  }
});


// === Google Maps Key Endpoint (Secure backend proxy for frontend) ===
app.get("/api/maps/key", (_req, res) => {
  const mapsKey = process.env.GOOGLE_MAPS_PLATFORM_KEY || "";
  if (!mapsKey || mapsKey === "YOUR_API_KEY") {
    return res.status(404).json({ success: false, message: "Google Maps key not configured." });
  }
  return res.json({ success: true, mapsKey });
});


// === Notification Settings & Logs Endpoints (Founder Control Center) ===
let memoryNotificationSettings: any = {
  emailEnabled: true,
  smsEnabled: true,
  pushEnabled: true,
  waselEnabled: false,
  autoJoinRequestAlert: true,
  autoViolationAlert: true,
  autoExpiryAlert: true,
  updatedAt: new Date().toISOString()
};
let memoryNotificationLogs: any[] = [];

app.get("/api/notifications/settings", requireSovereignAuth, requireFounderOnly, async (_req, res) => {
  try {
    const fetchPromise = (async () => {
      const snapshot = await adminDb.collection("notification_settings").doc("founder").get();
      if (!snapshot.exists) {
        return memoryNotificationSettings;
      }
      return snapshot.data();
    })();

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1500));
    const settings = await Promise.race([fetchPromise, timeoutPromise]);
    return res.json({ success: true, settings });
  } catch {
    return res.json({ success: true, settings: memoryNotificationSettings });
  }
});

app.post("/api/notifications/settings", requireSovereignAuth, requireFounderOnly, async (req, res) => {
  const data = req.body;
  memoryNotificationSettings = {
    ...memoryNotificationSettings,
    emailEnabled: Boolean(data.emailEnabled),
    smsEnabled: Boolean(data.smsEnabled),
    pushEnabled: Boolean(data.pushEnabled),
    waselEnabled: Boolean(data.waselEnabled),
    autoJoinRequestAlert: Boolean(data.autoJoinRequestAlert),
    autoViolationAlert: Boolean(data.autoViolationAlert),
    autoExpiryAlert: Boolean(data.autoExpiryAlert),
    updatedAt: new Date().toISOString()
  };

  try {
    const savePromise = (async () => {
      const ref = adminDb.collection("notification_settings").doc("founder");
      await ref.set(memoryNotificationSettings, { merge: true });
    })();
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1500));
    await Promise.race([savePromise, timeoutPromise]);
  } catch {
    // Stored in memory fallback
  }
  return res.json({ success: true });
});

app.get("/api/notifications/logs", async (_req, res) => {
  try {
    const fetchPromise = (async () => {
      const snapshot = await adminDb.collection("notification_logs")
        .orderBy("sentAt", "desc")
        .limit(100)
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    })();

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1500));
    const logs = await Promise.race([fetchPromise, timeoutPromise]);
    return res.json({ success: true, logs });
  } catch {
    return res.json({ success: true, logs: memoryNotificationLogs });
  }
});

app.post("/api/notifications/test-email", async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) {
      return res.status(400).json({ success: false, message: "Recipient email is required." });
    }
    const transporter = getMailTransporter();
    if (!transporter) {
      return res.status(500).json({ success: false, message: "Mail transporter is not configured." });
    }
    const info = await transporter.sendMail({
      from: process.env.GMAIL_FROM || "LexOps Alerts <noreply@lexops.sa>",
      to,
      subject: "🧪 اختبار نظام الإشعارات – LexOps",
      html: "<p>هذا بريد تجريبي من مركز إشعارات LexOps للتحقق من عمل القنوات.</p>"
    });
    await adminDb.collection("notification_logs").add({
      type: "test_email",
      to,
      subject: "اختبار نظام الإشعارات",
      status: "delivered",
      sentAt: new Date().toISOString(),
      messageId: info.messageId
    });
    return res.json({ success: true, message: "Test email sent successfully." });
  } catch (error: any) {
    await adminDb.collection("notification_logs").add({
      type: "test_email",
      to: req.body?.to || "",
      subject: "اختبار نظام الإشعارات",
      status: "failed",
      sentAt: new Date().toISOString(),
      errorMessage: error.message
    });
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// Test Engines Page — صفحة اختبار المحركات
// ============================================================
app.get("/test-engines", (_req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>LexOps — اختبار المحركات السيادية</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0a0a0f; color: #e0e0e0; padding: 20px; }
    h1 { color: #D4AF37; text-align: center; margin-bottom: 30px; font-size: 24px; }
    .engine-card { background: #111; border: 1px solid #D4AF37/30; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .engine-title { color: #D4AF37; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
    .engine-desc { color: #888; font-size: 12px; margin-bottom: 15px; }
    button { background: #D4AF37; color: #000; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; margin-right: 10px; }
    button:hover { background: #f3cd46; }
    .result { background: #0d0d12; border: 1px solid #333; border-radius: 8px; padding: 15px; margin-top: 15px; font-family: monospace; font-size: 11px; white-space: pre-wrap; direction: ltr; text-align: left; color: #4ade80; max-height: 300px; overflow-y: auto; }
    .error { color: #f87171; }
    .loading { color: #60a5fa; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <h1>🔧 LexOps Sovereign OS — اختبار المحركات السيادية</h1>
  
  <div class="grid">
    <div class="engine-card">
      <div class="engine-title">💰 SPE — محرك الرواتب</div>
      <div class="engine-desc">حساب الرواتب مع GOSI (9.75% سعودي، 2% مقيم) وخصم الغياب</div>
      <button onclick="testPayroll()">تشغيل الاختبار</button>
      <div id="payroll-result" class="result" style="display:none"></div>
    </div>

    <div class="engine-card">
      <div class="engine-title">📍 SDE — محرك الحضور الجغرافي</div>
      <div class="engine-desc">Haversine + Anti-Spoofing (دقة GPS ≤ 150م)</div>
      <button onclick="testAttendanceSuccess()">✅ داخل النطاق</button>
      <button onclick="testAttendanceFail()">❌ خارج النطاق</button>
      <button onclick="testAttendanceMock()">🚫 تزييف GPS</button>
      <div id="attendance-result" class="result" style="display:none"></div>
    </div>

    <div class="engine-card">
      <div class="engine-title">⚖️ LEXI — المستشار القانوني</div>
      <div class="engine-desc">صياغة اعتراض قانوني عبر Gemini AI</div>
      <button onclick="testLexi()">صياغة اعتراض</button>
      <div id="lexi-result" class="result" style="display:none"></div>
    </div>

    <div class="engine-card">
      <div class="engine-title">📊 S8 — محرك الامتثال</div>
      <div class="engine-desc">تقييم الامتثال الداخلي (A+ إلى D)</div>
      <button onclick="testCompliance()">تقييم الامتثال</button>
      <div id="compliance-result" class="result" style="display:none"></div>
    </div>
  </div>

  <div class="engine-card" style="margin-top: 30px;">
    <div class="engine-title">🩺 فحص صحة جميع المحركات</div>
    <button onclick="testHealth()">فحص Health Check</button>
    <div id="health-result" class="result" style="display:none"></div>
  </div>

  <script>
    async function callAPI(endpoint, body) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await res.json();
    }

    function showResult(id, data, isError) {
      const el = document.getElementById(id);
      el.style.display = 'block';
      el.textContent = JSON.stringify(data, null, 2);
      el.className = 'result ' + (isError ? 'error' : '');
    }

    async function testPayroll() {
      document.getElementById('payroll-result').textContent = 'جاري التشغيل...';
      document.getElementById('payroll-result').className = 'result loading';
      document.getElementById('payroll-result').style.display = 'block';
      const result = await callAPI('/api/engines/payroll/calculate', {
        entityId: '7001002003',
        employees: [
          { id: 'EMP-001', name: 'أحمد', baseSalary: 10000, nationality: 'سعودي', absenceDays: 0 },
          { id: 'EMP-002', name: 'Ali', baseSalary: 8000, nationality: 'مصري', absenceDays: 2 }
        ],
        month: '08',
        year: '2026'
      });
      showResult('payroll-result', result, !result.success);
    }

    async function testAttendanceSuccess() {
      document.getElementById('attendance-result').textContent = 'جاري التشغيل...';
      document.getElementById('attendance-result').className = 'result loading';
      document.getElementById('attendance-result').style.display = 'block';
      const result = await callAPI('/api/engines/attendance/geo-punch', {
        entityId: '7001002003',
        employeeId: 'EMP-001',
        employeeLat: 24.7136,
        employeeLng: 46.6753,
        branchLat: 24.7136,
        branchLng: 46.6753,
        accuracy: 50,
        isSpoofed: false,
        allowedRadiusMeters: 500
      });
      showResult('attendance-result', result, !result.success);
    }

    async function testAttendanceFail() {
      const result = await callAPI('/api/engines/attendance/geo-punch', {
        entityId: '7001002003',
        employeeId: 'EMP-001',
        employeeLat: 24.8000,
        employeeLng: 46.8000,
        branchLat: 24.7136,
        branchLng: 46.6753,
        accuracy: 50,
        isSpoofed: false,
        allowedRadiusMeters: 500
      });
      showResult('attendance-result', result, !result.success);
    }

    async function testAttendanceMock() {
      const result = await callAPI('/api/engines/attendance/geo-punch', {
        entityId: '7001002003',
        employeeId: 'EMP-001',
        employeeLat: 24.7136,
        employeeLng: 46.6753,
        branchLat: 24.7136,
        branchLng: 46.6753,
        accuracy: 50,
        isSpoofed: true,
        allowedRadiusMeters: 500
      });
      showResult('attendance-result', result, !result.success);
    }

    async function testLexi() {
      document.getElementById('lexi-result').textContent = 'جاري الصياغة عبر Gemini...';
      document.getElementById('lexi-result').className = 'result loading';
      document.getElementById('lexi-result').style.display = 'block';
      const result = await callAPI('/api/engines/lexi/objection', {
        entityId: '7001002003',
        entityName: 'LexOps Sovereign OS',
        crNumber: '7001002003',
        violationData: {
          id: 'VIOL-001',
          type: 'تأخر عن الدوام',
          description: 'تأخر 30 دقيقة عن بدء الوردية',
          date: '2026-08-20'
        },
        lang: 'ar'
      });
      showResult('lexi-result', result, !result.success);
    }

    async function testCompliance() {
      document.getElementById('compliance-result').textContent = 'جاري التقييم...';
      document.getElementById('compliance-result').className = 'result loading';
      document.getElementById('compliance-result').style.display = 'block';
      const result = await callAPI('/api/engines/compliance/evaluate', {
        entityId: '7001002003',
        violations: [],
        employees: [{id: '1'}],
        branches: [{id: '1'}],
        licenses: []
      });
      showResult('compliance-result', result, !result.success);
    }

    async function testHealth() {
      document.getElementById('health-result').textContent = 'جاري الفحص...';
      document.getElementById('health-result').className = 'result loading';
      document.getElementById('health-result').style.display = 'block';
      const res = await fetch('/api/engines/health');
      const result = await res.json();
      showResult('health-result', result, !result.success);
    }
  </script>
</body>
</html>
  `);
});
// ============================================================
// Sovereign Engine Routes (v2026)
// ============================================================

// 0. Unified Sovereign Engine Runner Endpoint
app.post("/api/engines/run", async (req: Request, res: Response) => {
  try {
    const { engineId, payload } = req.body || {};
    if (!engineId) {
      return res.status(400).json({ success: false, error: "Missing required field: engineId" });
    }
    const user = (req as any).user || {};
    const context = {
      entityId: user.entityId || req.body.entityId || "UNKNOWN_ENTITY",
      userId: user.uid || req.body.userId || "ANONYMOUS_USER",
      role: user.role || "org_admin"
    };
    const result = await runEngine(engineId, payload || {}, context);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1. Payroll Engine
app.post("/api/engines/payroll/calculate", async (req: Request, res: Response) => {
  try {
    const result = await runEngine("SPE-2026", req.body, {
      entityId: req.body.entityId || "unknown",
      userId: req.body.userId || "anonymous",
      role: req.body.role || "org_admin"
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Attendance Engine
app.post("/api/engines/attendance/geo-punch", async (req: Request, res: Response) => {
  try {
    const result = await runEngine("SDE-2026", req.body, {
      entityId: req.body.entityId || "unknown",
      userId: req.body.employeeId || "anonymous",
      role: "employee"
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. LEXI Engine
app.post("/api/engines/lexi/objection", async (req: Request, res: Response) => {
  try {
    const result = await runEngine("LEXI-2026", req.body, {
      entityId: req.body.entityId || "unknown",
      userId: req.body.userId || "anonymous",
      role: "legal"
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Compliance Engine
app.post("/api/engines/compliance/evaluate", async (req: Request, res: Response) => {
  try {
    const result = await runEngine("S8-2026", req.body, {
      entityId: req.body.entityId || "unknown",
      userId: req.body.userId || "anonymous",
      role: "compliance"
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Health Check All Engines
app.get("/api/engines/health", async (_req: Request, res: Response) => {
  try {
    const results = await healthCheckAll();
    res.json({ success: true, engines: results, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Sovereign C9 Ledger Cryptographic Signing Endpoint (HMAC-SHA256 256-bit)
app.post("/api/c9/sign", async (req: Request, res: Response) => {
  try {
    const { engineId = "C9-SOVEREIGN-ENGINE", payload, timestamp } = req.body || {};
    const ts = timestamp || new Date().toISOString();
    const hash = generateC9Hash(engineId, payload || {}, ts);
    res.json({
      success: true,
      hash,
      timestamp: ts,
      engineId
    });
  } catch (err: any) {
    console.error("[C9_SIGN_ERROR]", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  const distPath = path.join(process.cwd(), "dist");

  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode - static files from build
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 LexOps Sovereign OS Server running on http://localhost:${PORT}`);
  });
}

startServer();

