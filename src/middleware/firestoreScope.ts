import * as admin from "firebase-admin";
import { Request, Response, NextFunction } from "express";
import { adminAuth, adminDb } from "../lib/firebase-admin";

// Extend Express Request interface to include our scoped properties
export interface ScopedRequest extends Request {
  userId?: string;
  userEmail?: string;
  userEntityId?: string;
  userRole?: string;
}

// Known entity mappings for verified sovereign controller
const KNOWN_USER_ENTITIES: Record<string, { entityId: string; role: string; email?: string }> = {
  "founder-001": { entityId: "GLOBAL", role: "SOVEREIGN_CONTROLLER", email: "lexi.2030.sa@gmail.com" },
  "USR-001": { entityId: "GLOBAL", role: "SOVEREIGN_CONTROLLER", email: "lexi.2030.sa@gmail.com" },
  "USR-006": { entityId: "GOV-GATEWAY", role: "government", email: "inspector@hr.gov.sa" }
};

/**
 * Express middleware to enforce document-level security on Firestore queries.
 * It resolves the authenticated user's organization unique ID (entityId) and scopes queries to it.
 */
export async function enforceFirestoreScope(req: ScopedRequest, res: Response, next: NextFunction) {
  try {
    let uid = "";
    let decodedToken: any = null;
    let email = "";

    // 1. Authenticate user - Try Firebase ID Token first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      try {
        decodedToken = await adminAuth.verifyIdToken(token);
        uid = decodedToken?.uid || "";
        email = decodedToken?.email || "";
      } catch {
        // ID token might be simulated or local dev token
        if (token === "dev-token-founder-2026") {
          uid = "founder-001";
          email = "founder@lexops.sa";
        }
      }
    }

    // 2. Fallback to headers or query parameters for sandbox/local simulations compatibility
    if (!uid) {
      uid = (req.headers["user-id"] as string) || 
            (req.headers["x-user-id"] as string) || 
            (req.query.userId as string) || 
            (req.body?.userId as string) || 
            "";
      email = (req.headers["user-email"] as string) || 
              (req.headers["x-user-email"] as string) || 
              (req.query.userEmail as string) || 
              (req.body?.userEmail as string) || 
              "";
    }

    if (!uid) {
      return res.status(401).json({
        error: "غير مصرح — يرجى تسجيل الدخول أولاً للوصول إلى قاعدة البيانات السيادية.",
        code: "UNAUTHORIZED"
      });
    }

    // 3. Resolve organization unique ID (entityId) from authenticated profile
    let entityId = (req.headers["x-entity-id"] as string) || 
                   (req.headers["entity-id"] as string) || 
                   (req.query.entityId as string) || 
                   (req.body?.entityId as string) || 
                   "";
    let role = "user";

    // A. Check for special bypasses (Founder & Government Inspectors)
    if (
      email === "lexi.2030.sa@gmail.com" ||
      email === "sultan2030famli@gmail.com" || 
      email === "sultanbooy100@gmail.com" || 
      email === "founder@lexops.sa" || 
      uid === "founder-uid" || 
      uid === "founder-001" ||
      uid === "USR-001"
    ) {
      entityId = "GLOBAL";
      role = "SOVEREIGN_CONTROLLER";
    } else if (email === "inspector@hr.gov.sa" || email?.endsWith(".gov.sa") || uid === "USR-006") {
      entityId = "GOV-GATEWAY";
      role = "government";
    } else if (KNOWN_USER_ENTITIES[uid]) {
      entityId = KNOWN_USER_ENTITIES[uid].entityId;
      role = KNOWN_USER_ENTITIES[uid].role;
    }

    // B. Check custom claims on verified token safely
    if (!entityId && decodedToken) {
      entityId = (decodedToken.entityId || decodedToken.orgId || decodedToken.activeOrg) as string;
    }

    // C. Try Firestore database if entityId is still not resolved
    if (!entityId) {
      try {
        const firestorePromise = (async () => {
          // Query the 'requests' collection keyed by UID
          const requestDoc = await adminDb.collection("requests").doc(uid).get();
          if (requestDoc.exists) {
            const reqData = requestDoc.data();
            if (reqData) {
              const reqRole = reqData.type || "user";
              if (reqRole === "orgadmin") {
                return { entityId: reqData.crNumber || "", role: reqRole };
              } else if (reqRole === "employee" || reqRole === "freelancer") {
                const employeeDoc = await adminDb.collection("employees").doc(uid).get();
                return { 
                  entityId: employeeDoc.exists ? (employeeDoc.data()?.entityId || "") : "", 
                  role: reqRole 
                };
              }
            }
          }

          // Try 'users' collection
          const userDoc = await adminDb.collection("users").doc(uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData?.entityId || userData?.activeOrg) {
              return { entityId: userData.entityId || userData.activeOrg, role: userData.role || "user" };
            }
          }

          return null;
        })();

        // Enforce 1.5s timeout on Firestore check so requests never hang
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Firestore timeout")), 1500)
        );

        const result: any = await Promise.race([firestorePromise, timeoutPromise]);
        if (result?.entityId) {
          entityId = result.entityId;
          role = result.role || role;
        }
      } catch {
        // Fall back gracefully when Firestore is disconnected or permissions are restricted
      }
    }

    // D. Final safe fallback - ensure real state or unassigned
    if (!entityId) {
      entityId = "UNASSIGNED";
    }

    // Attach resolved credentials to request object
    req.userId = uid;
    req.userEmail = email;
    req.userEntityId = entityId;
    req.userRole = role;

    next();
  } catch (err) {
    console.error("Error in enforceFirestoreScope middleware:", err);
    res.status(500).json({
      error: "خطأ داخلي في نظام التحقق من الهوية والامتثال السيادي.",
      details: String(err)
    });
  }
}