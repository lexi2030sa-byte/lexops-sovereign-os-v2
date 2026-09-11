import { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";
import { adminAuth } from "../lib/firebase-admin";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * P0-2 Middleware: requireFirebaseAuth
 * Enforces Firebase Auth or Sovereign HMAC-SHA256 Token on protected routes.
 */
export async function requireFirebaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      code: "SOV_AUTH_REQUIRED",
      error: "Unauthorized: Missing or invalid authorization header. Bearer token required."
    });
  }

  const token = authHeader.split("Bearer ")[1].trim();

  // 1. Try Firebase Admin verification
  try {
    if (adminAuth) {
      const decoded = await adminAuth.verifyIdToken(token);
      req.user = decoded;
      return next();
    }
  } catch (firebaseErr: any) {
    // Continue to sovereign HMAC-SHA256 verification
  }

  // 2. Sovereign HMAC-SHA256 Token fallback verification
  try {
    const secret =
      process.env.C9_SECRET_KEY ||
      "C9_SOVEREIGN_ROOT_SECRET_KEY_2026_LEXOPS_CORE_HASH_AUTHENTICATION_VAULT";
    const parts = token.split(".");
    if (parts.length === 3) {
      const [headerB64, payloadB64, signatureB64] = parts;
      const expectedSig = crypto
        .createHmac("sha256", secret)
        .update(`${headerB64}.${payloadB64}`)
        .digest("base64url");

      if (crypto.timingSafeEqual(Buffer.from(signatureB64), Buffer.from(expectedSig))) {
        const decodedPayload = JSON.parse(
          Buffer.from(payloadB64, "base64url").toString("utf-8")
        );
        req.user = decodedPayload;
        return next();
      }
    }
  } catch (tokenErr) {
    // Fall through to 401
  }

  return res.status(401).json({
    success: false,
    code: "SOV_INVALID_TOKEN",
    error: "Unauthorized: Access token verification failed or expired."
  });
}
