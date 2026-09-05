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

export function generateC9Hash(engineId: string, payload: any, timestamp: string): string {
  const crypto = require("crypto");
  const secret = process.env.C9_SECRET_KEY || "";
  const content = `${engineId}:${JSON.stringify(payload)}:${timestamp}`;
  return crypto.createHmac("sha256", secret).update(content).digest("hex").slice(0, 32).toUpperCase();
}
