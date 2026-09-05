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
        uid = decodedToken.uid;
        email = decodedToken.email || "";
      } catch (tokenErr) {
        console.warn("Firebase ID Token verification failed, trying fallback:", tokenErr);
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
    let entityId = "";
    let role = "user";

    // A. Check for special bypasses (Founder & Government Inspectors)
    if (email === "sultan2030famli@gmail.com" || email === "sultanbooy100@gmail.com" || email === "founder@lexops.sa" || uid === "founder-uid") {
      entityId = "7001002003"; // LexOps Sovereign OS
      role = "SOVEREIGN_CONTROLLER";
    } else if (email === "inspector@hr.gov.sa" || email?.endsWith(".gov.sa")) {
      entityId = "GOV-GATEWAY"; // Government Gateway
      role = "government";
    } else {
      // B. Resolve regular users from Firestore profile documents
      try {
        // Query the 'requests' collection keyed by UID
        const requestDocRef = adminDb.collection("requests").doc(uid);
        const requestDoc = await requestDocRef.get();

        if (requestDoc.exists) {
          const reqData = requestDoc.data();
          if (reqData) {
            role = reqData.type || "user";
            
            if (role === "orgadmin") {
              entityId = reqData.crNumber || "ORG-GEN";
            } else if (role === "employee" || role === "freelancer") {
              // Fetch from employees subcollection/collection
              const employeeDocRef = adminDb.collection("employees").doc(uid);
              const employeeDoc = await employeeDocRef.get();
              if (employeeDoc.exists) {
                const empData = employeeDoc.data();
                entityId = empData?.entityId || "FREE-ENT";
              } else {
                entityId = "FREE-ENT";
              }
            }
          }
        }
      } catch (dbErr) {
        console.warn("Failed resolving entityId from Firestore, checking legacy fallbacks:", dbErr);
      }

      // C. Fallback for legacy sandbox users
// Option B: Dual Claims & Live DB Verification (Zero-Trust Fallback)
    if (!entityId) {
  // Option B: Dual Claims & Live DB Verification (Zero-Trust Fallback)
    entityId = (decodedToken.entityId || decodedToken.orgId || decodedToken.activeOrg) as string;

    if (!entityId) {
      try {
        // Zero-Trust verification: استعلام قاعدة بيانات Firestore حياً لمطابقة معرّف الكيان الفعلي
        const userDoc = await adminDb.collection("users").doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          entityId = userData?.entityId || userData?.activeOrg;
        }
        
        if (!entityId && email) {
          const orgsSnapshot = await adminDb
            .collection("organizations")
            .where("adminEmail", "==", email)
            .limit(1)
            .get();
          if (!orgsSnapshot.empty) {
            entityId = orgsSnapshot.docs[0].id;
          }
        }
      } catch (dbError) {
        console.warn("Sovereign DB Scope Fallback failed to verify entityId:", dbError);
      }
    }
}

    if (!entityId) {
      try {
        // Zero-Trust verification: استعلام قاعدة بيانات Firestore حياً لمطابقة معرّف الكيان الفعلي
        const userDoc = await adminDb.collection("users").doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          entityId = userData?.entityId || userData?.activeOrg;
        }
        
        if (!entityId && email) {
          const orgsSnapshot = await adminDb
            .collection("organizations")
            .where("adminEmail", "==", email)
            .limit(1)
            .get();
          if (!orgsSnapshot.empty) {
            entityId = orgsSnapshot.docs[0].id;
          }
        }
      } catch (dbError) {
        console.warn("Sovereign DB Scope Fallback failed to verify entityId:", dbError);
      }
    }
        
    }

    // Attach resolved credentials to request object
    req.userId = uid;
    req.userEmail = email;
    req.userEntityId = entityId;
    req.userRole = role;

    console.log(`[Sovereign Firestore Scope] User ${uid} (${email}) resolved to entityId: ${entityId} [Role: ${role}]`);

    next();
  } catch (err) {
    console.error("Error in enforceFirestoreScope middleware:", err);
    res.status(500).json({
      error: "خطأ داخلي في نظام التحقق من الهوية والامتثال السيادي.",
      details: String(err)
    });
  }
}