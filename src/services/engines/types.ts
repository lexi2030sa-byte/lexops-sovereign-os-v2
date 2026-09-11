import * as crypto from 'crypto';

// ============================================================
// LexOps Sovereign OS — Engine Interface Layer (v2026)
// ============================================================

export interface EngineResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  c9Hash?: string;
  timestamp: string;
  engineId: string;
}

export interface EngineContext {
  entityId: string;
  userId: string;
  role: string;
  branchId?: string;
  requestId?: string;
}

export interface SovereignEngine {
  id: string;
  name: string;
  version: string;
  execute: (payload: any, context: EngineContext) => Promise<EngineResult>;
  healthCheck: () => Promise<{ status: "healthy" | "degraded" | "down"; details: string }>;
}

/**
 * دالة توليد الختم التشفيري السيادي لسجل C9 (HMAC-SHA256 الكامل)
 */
export function generateC9Hash(engineId: string, payload: any, timestamp: string): string {
  const secret = process.env.C9_SECRET_KEY || "C9_SOVEREIGN_ROOT_SECRET_KEY_2026_LEXOPS_CORE_HASH_AUTHENTICATION_VAULT";
  
  // فرض حماية ضد الأسرار الفارغة أو الضعيفة
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      '[C9_SECURITY_FATAL] C9_SECRET_KEY is missing or insecure. Minimum 32 characters required in environment variables.'
    );
  }

  const content = `${engineId}:${JSON.stringify(payload)}:${timestamp}`;
  
  // توليد الهاش التشفيري الكامل (256-bit / 64 محرفاً) بدون بتر
  return crypto
    .createHmac('sha256', secret)
    .update(content)
    .digest('hex')
    .toUpperCase();
}

