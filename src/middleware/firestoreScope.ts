import { Request, Response, NextFunction } from "express";
import { adminAuth, adminDb } from "../lib/firebase-admin";

/**
 * Authenticated user context attached to Express Request by requireFirebaseAuth
 */
export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role?: string;
  entityId?: string;
}

/**
 * Extend Express global Request interface to include authenticated user context
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Extend Express Request interface to include verified user context
export interface ScopedRequest extends Request {
  userId?: string;
  userEmail?: string;
  userEntityId?: string;
  userRole?: string;
}

/**
 * Fail-closed Firebase Bearer token authentication middleware.
 * 
 * Validates Authorization: Bearer <idToken> using Firebase Admin SDK.
 * No client-controlled fallback from headers, query, body, email heuristics, or defaults.
 * 
 * On success: attaches verified identity to req.user and calls next()
 * On failure: returns 401
 */
export async function requireFirebaseAuth(req: ScopedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    // Fail-closed: Missing or malformed Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required.",
        code: "AUTH_REQUIRED"
      });
    }

    const token = authHeader.slice("Bearer ".length).trim();

    // Fail-closed: Empty bearer token
    if (!token) {
      return res.status(401).json({
        error: "Authentication required.",
        code: "AUTH_REQUIRED"
      });
    }

    let decodedToken: any;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (tokenErr) {
      console.error("Firebase ID Token verification failed:", tokenErr);
      return res.status(401).json({
        error: "Invalid or expired token.",
        code: "INVALID_TOKEN"
      });
    }

    // Attach verified identity to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || undefined,
      role: decodedToken.role || undefined,
      entityId: decodedToken.entityId || undefined
    };

    // Backward compatibility: also attach to individual fields
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email || "";

    console.log(`[requireFirebaseAuth] User ${decodedToken.uid} (${decodedToken.email}) authenticated`);
    next();
  } catch (err) {
    console.error("Error in requireFirebaseAuth middleware:", err);
    return res.status(500).json({
      error: "Internal authentication error.",
      code: "AUTH_INTERNAL_ERROR"
    });
  }
}

/**
 * Express middleware to enforce document-level security on Firestore queries.
 * 
 * REQUIRES: requireFirebaseAuth has already verified and attached req.user.uid
 * 
 * Resolves entityId from:
 * 1. verified token claim (entityId)
 * 2. server-side users/{verifiedUid} document (entityId or activeOrg field)
 * 
 * Resolves role from:
 * 1. verified token claim (role)
 * 2. server-side users/{verifiedUid} document (role field)
 * 
 * Does NOT accept:
 * - client headers (user-id, x-user-id, user-email, x-user-email)
 * - query parameters (userId, userEmail)
 * - request body (userId, userEmail)
 * - email heuristics (hard-coded emails, .gov.sa rules)
 * - hard-coded UIDs or default entity IDs
 * - requests collection lookup
 * - employees collection lookup by UID
 * - organizations collection email lookup
 */
export async function enforceFirestoreScope(req: ScopedRequest, res: Response, next: NextFunction) {
  try {
    // Prerequisite: requireFirebaseAuth must have run first
    if (!req.user || !req.user.uid) {
      return res.status(401).json({
        error: "Authentication required.",
        code: "AUTH_REQUIRED"
      });
    }

    const verifiedUid = req.user.uid;
    const tokenEntityId = req.user.entityId;
    const tokenRole = req.user.role;
    let userData: any = null;

    // Read users/{verifiedUid} once if either entityId or role is missing from token
    if (!tokenEntityId || !tokenRole) {
      try {
        const userDoc = await adminDb.collection("users").doc(verifiedUid).get();
        if (userDoc.exists) {
          userData = userDoc.data();
        }
      } catch (dbErr) {
        console.warn("Failed to resolve entity/role from users collection:", dbErr);
      }
    }

    // Resolve entityId: prefer token claim, then userData fallback
    const entityId = tokenEntityId || userData?.entityId || userData?.activeOrg || "";

    // Resolve role: prefer token claim, then userData fallback
    const role = tokenRole || userData?.role || "user";

    // Fail-closed: If no entityId could be resolved, deny access
    if (!entityId) {
      return res.status(403).json({
        error: "Authorization context missing.",
        code: "AUTHORIZATION_CONTEXT_MISSING"
      });
    }

    // Update trusted user context with resolved entity and role
    req.user.entityId = entityId;
    req.user.role = role;

    // Attach resolved context to request
    req.userId = verifiedUid;
    req.userEmail = req.user.email || "";
    req.userEntityId = entityId;
    req.userRole = role;

    console.log(`[enforceFirestoreScope] User ${verifiedUid} resolved to entityId: ${entityId} [Role: ${role}]`);
    next();
  } catch (err) {
    console.error("Error in enforceFirestoreScope middleware:", err);
    return res.status(500).json({
      error: "Internal authorization error.",
      code: "AUTHZ_INTERNAL_ERROR"
    });
  }
}
