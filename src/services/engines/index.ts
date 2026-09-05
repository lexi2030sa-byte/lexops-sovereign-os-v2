// ============================================================
// Engine Orchestrator — نقطة التجميع المركزية
// ============================================================
export * from "./types";
export { payrollEngine } from "./payrollEngine";
export { attendanceEngine } from "./attendanceEngine";
export { lexiEngine } from "./lexiEngine";
export { complianceEngine } from "./complianceEngine";

import { SovereignEngine } from "./types";
import { payrollEngine } from "./payrollEngine";
import { attendanceEngine } from "./attendanceEngine";
import { lexiEngine } from "./lexiEngine";
import { complianceEngine } from "./complianceEngine";

export const engineRegistry: Record<string, SovereignEngine> = {
  [payrollEngine.id]: payrollEngine,
  [attendanceEngine.id]: attendanceEngine,
  [lexiEngine.id]: lexiEngine,
  [complianceEngine.id]: complianceEngine,
};

export async function runEngine(engineId: string, payload: any, context: any) {
  const engine = engineRegistry[engineId];
  if (!engine) throw new Error(`المحرك ${engineId} غير مسجل في النظام`);
  return engine.execute(payload, context);
}

export async function healthCheckAll() {
  const results: Record<string, any> = {};
  for (const [id, engine] of Object.entries(engineRegistry)) {
    results[id] = await engine.healthCheck();
  }
  return results;
}
