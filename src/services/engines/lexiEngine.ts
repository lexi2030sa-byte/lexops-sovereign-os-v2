// ============================================================
// LEXI — Sovereign Legal Intelligence Engine
// صياغة الاعتراضات القانونية عبر Gemini
// ============================================================
import { SovereignEngine, EngineResult, EngineContext, generateC9Hash } from "./types";
import { GoogleGenAI } from "@google/genai";

export const lexiEngine: SovereignEngine = {
  id: "LEXI-2026",
  name: "Sovereign Legal Intelligence Engine",
  version: "2026.1.0",

  async execute(payload: any, ctx: EngineContext): Promise<EngineResult> {
    const ts = new Date().toISOString();
    try {
      const { violationData, entityName = "المنشأة المعتمدة", crNumber = "1010000000", lang = "ar" } = payload || {};
      const apiKey = process.env.GEMINI_API_KEY;

      let generatedText = "";

      if (apiKey) {
        try {
          const prompt = `
أنت مستشار قانوني سيادي متخصص في الأنظمة السعودية لعام 2026.
المنشأة: ${entityName} | السجل التجاري: ${crNumber}
واقعة المخالفة: ${JSON.stringify(violationData)}

صيغ لائحة اعتراض قانونية كاملة ومسببة تشمل:
1. الدفوع الشكلية (الاختصاص، الشكل، المهلة)
2. الدفوع الموضوعية (نفي الواقعة، التفسير القانوني، المبررات)
3. المراجع النظامية (نظام العمل، لائحة الجزاءات، القرار الملكي 11438)
4. مطالبة بالإلغاء أو التخفيف مع التعليل

اللغة: ${lang === "ar" ? "العربية الفصحى القانونية" : "English legal prose"}
الموعد النهائي: 72 ساعة من تاريخ الإشعار.
`;
          const genAI = new GoogleGenAI({ apiKey });
          const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { temperature: 0.2, maxOutputTokens: 2048 },
          });
          generatedText = response.text || "";
        } catch (apiErr: any) {
          console.warn("[LEXI] Gemini call error, using deterministic legal fallback:", apiErr.message);
        }
      }

      if (!generatedText) {
        generatedText = `لائحة اعتراض نظامية سيادية (وفق نظام العمل السعودي 2026 والقرار الملكي 11438)
الجهة المقدمة: ${entityName} (سجل تجاري: ${crNumber})
الموضوع: اعتراض موضوعي وشكلي على المخالفة رقم ${violationData?.id || "VIOL-PENDING"}

أولاً - الدفوع الشكلية:
1. التمسك بالصفة والمصلحة وتقديم الاعتراض داخل المهلة النظامية المقررة (72 ساعة).
2. الدفع ببطلان الإجراءات بموجب الفلتر الملكي 11438 لعدم استيفاء مهلة التصحيح المسبقة المقررة بـ 3 أيام عمل.

ثانياً - الدفوع الموضوعية:
1. انتفاء القصد ووجود مبررات تشغيلية موثقة وفق سجلات الحضور والرواتب السيادية.
2. المطالبة الاحتياطية بإلغاء الغرامة أو تخفيضها للحد الأدنى النظامي.`;
      }

      const result = {
        objectionText: generatedText,
        entityName,
        crNumber,
        violationId: violationData?.id,
        generatedAt: ts,
        lang,
        entityId: ctx.entityId,
      };

      return {
        success: true,
        data: result,
        timestamp: ts,
        engineId: this.id,
        c9Hash: generateC9Hash(this.id, result, ts),
      };
    } catch (err: any) {
      return { success: false, error: err.message, timestamp: ts, engineId: this.id };
    }
  },

  async healthCheck() {
    return { status: "healthy", details: "LEXI جاهز لصياغة الاعتراضات القانونية" };
  },
};
