// ============================================================
// LEXI — Sovereign Legal Intelligence Engine
// صياغة الاعتراضات القانونية عبر Gemini
// ============================================================
import { SovereignEngine, EngineResult, EngineContext, generateC9Hash } from "./types";

export const lexiEngine: SovereignEngine = {
  id: "LEXI-2026",
  name: "Sovereign Legal Intelligence Engine",
  version: "2026.1.0",

  async execute(payload: any, ctx: EngineContext): Promise<EngineResult> {
    const ts = new Date().toISOString();
    try {
      const { violationData, entityName, crNumber, lang = "ar" } = payload;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return { success: false, error: "مفتاح GEMINI_API_KEY غير مضبوط", timestamp: ts, engineId: this.id };
      }

      const prompt = `
أنت مستشار قانوني سيادي متخصص في الأنظمة السعودية لعام 2026.
المنشأة: ${entityName} | السجل التجاري: ${crNumber}
واقعة المخالفة: ${JSON.stringify(violationData)}

صيغ لائحة اعتراض قانونية كاملة ومسببة تشمل:
1. الدفوع الشكلية (الاختصاص، الشكل، المهلة)
2. الدفوع الموضوعية (نفي الواقعة، التفسير القانوني، المبررات)
3. المراجع النظامية (نظام العمل، لائحة الجزاءات)
4. مطالبة بالإلغاء أو التخفيف مع التعليل

اللغة: ${lang === "ar" ? "العربية الفصحى القانونية" : "English legal prose"}
الموعد النهائي: 72 ساعة من تاريخ الإشعار.
`;

      const { GoogleGenAI } = require("@google/genai");
      const genAI = new GoogleGenAI({ apiKey });
      const response = await genAI.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: { temperature: 0.2, maxOutputTokens: 2048 },
      });

      const generatedText = response.text || "⚠️ لم يتم توليد نص";

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
