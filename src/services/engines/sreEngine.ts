// ============================================================
// SRE — Sovereign Rules Engine (محرك القواعد والأنظمة السيادية)
// التحقق من القواعد القانونية، الفلتر الملكي 11438، والمدد النظامية
// ============================================================
import { SovereignEngine, EngineResult, EngineContext, generateC9Hash } from "./types";

export interface SREEvaluationRequest {
  ruleId?: string;
  violationType?: "GRAVE" | "NON_GRAVE";
  hasPriorWarning?: boolean;
  warningDate?: string;
  incidentDate?: string;
  graceDaysGranted?: number;
  saudizationRatio?: number;
  targetRatio?: number;
  probationDays?: number;
}

export const sreEngine: SovereignEngine = {
  id: "SRE-2026",
  name: "Sovereign Rules Engine",
  version: "2026.1.0",

  async execute(payload: any, ctx: EngineContext): Promise<EngineResult> {
    const ts = new Date().toISOString();
    try {
      const evaluation: any = {
        evaluatedAt: ts,
        entityId: ctx.entityId,
        rulesPassed: true,
        flags: [] as string[],
        royalFilter11438: {
          enforced: false,
          status: "PASS",
          details: "المخالفة لا تتطلب إعمال قيد الفلتر 11438 أو استوفت الشروط."
        }
      };

      // 1. فحص الفلتر الملكي 11438 (Royal Filter 11438)
      // يشترط للمخالفات غير الجسيمة وجود إنذار مسبق ومهلة تصحيح 3 أيام
      if (payload.violationType === "NON_GRAVE" || payload.isNonGrave) {
        evaluation.royalFilter11438.enforced = true;
        const hasWarning = Boolean(payload.hasPriorWarning);
        const graceDays = Number(payload.graceDaysGranted) || 0;

        if (!hasWarning || graceDays < 3) {
          evaluation.rulesPassed = false;
          evaluation.royalFilter11438.status = "BLOCKED_BY_ROYAL_FILTER";
          evaluation.royalFilter11438.details = 
            "بطلان إجرائي (PROCEDURAL_INVALIDITY): القرار الملكي 11438 يمنع فرض عقوبة غير جسيمة دون إنذار مكتوب ومهلة تصحيح 3 أيام عمل على الأقل.";
          evaluation.flags.push("ROYAL_FILTER_11438_DEFENSE");
        } else {
          evaluation.royalFilter11438.status = "CLEARED";
          evaluation.royalFilter11438.details = "تم استيفاء متطلبات الفلتر الملكي 11438 بنجاح (إنذار موثق + مهلة 3 أيام).";
        }
      }

      // 2. فحص قاعدة التكرار والازدواج (Double Penalty Rule - 180 Days)
      if (payload.daysSinceLastViolation && Number(payload.daysSinceLastViolation) <= 180) {
        evaluation.flags.push("DOUBLE_PENALTY_APPLICABLE");
        evaluation.repeatViolation = true;
      }

      // 3. فحص مهلة الاعتراض النظامية (72 Hours Objection Window)
      if (payload.noticeTimestamp) {
        const noticeTime = new Date(payload.noticeTimestamp).getTime();
        const diffHours = (Date.now() - noticeTime) / (1000 * 60 * 60);
        evaluation.objectionWindow = {
          elapsedHours: Math.round(diffHours),
          isOpen: diffHours <= 72,
          remainingHours: Math.max(0, Math.round(72 - diffHours))
        };
        if (diffHours > 72) {
          evaluation.flags.push("OBJECTION_WINDOW_EXPIRED");
        }
      }

      const c9Hash = generateC9Hash(this.id, payload, ts);

      return {
        success: true,
        data: evaluation,
        timestamp: ts,
        engineId: this.id,
        c9Hash
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        timestamp: ts,
        engineId: this.id
      };
    }
  },

  async healthCheck() {
    return {
      status: "healthy",
      details: "SRE-2026 جاهز ومحمل بكافة القواعد النظامية والفلتر الملكي 11438"
    };
  }
};

export default sreEngine;
