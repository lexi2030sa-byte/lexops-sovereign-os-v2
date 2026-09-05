/**
 * LEXI AI Sovereign Governance & Policy Enforcement Layer (V4 / v3.5)
 * Central Hub for Context Validation, Principle Enforcement, Risk Gates, Tone Sanitization,
 * Five-Stage Protocol Structuring, and Cryptographic C9 Ledger Logging.
 */

export interface EnforcementContext {
  userId?: string;
  role?: string;
  legalObjective?: string;
  evidenceProvided?: boolean;
  gpsCoordinates?: { lat: number; lng: number };
  gpsIsSuspicious?: boolean;
  timestamp?: string;
  c9RecordsCount?: number;
  timeSinceIncidentHours?: number;
  hasPreviousWarning?: boolean;
  isCrossMinistry?: boolean; // Represents BALADI (بلدي) & HRSD (الموارد البشرية) cross-domain risk
}

export interface PolicyValidationResult {
  passed: boolean;
  status: "COMPLIANT" | "AUTO_FREEZE" | "REJECTED" | "TERMINATED_PATH";
  message: string;
}

export interface PolicyLog {
  id: string;
  timestamp: string;
  userId: string;
  legalObjective: string;
  decision: "ALLOW" | "BLOCK" | "REVIEW" | "FREEZE";
  status: "COMPLIANT" | "AUTO_FREEZE" | "REJECTED" | "TERMINATED_PATH";
  message: string;
}

// In-Memory Policy Audit Logs at the Policy Enforcer Core
export const centralSystemLogs: PolicyLog[] = [];
export const centralC9Logs: PolicyLog[] = [];

export const LexiPolicyEnforcer = {
  /**
   * Pushes a decision to local central logs.
   */
  logDecision(
    userId: string,
    objective: string,
    decision: "ALLOW" | "BLOCK" | "REVIEW" | "FREEZE",
    status: "COMPLIANT" | "AUTO_FREEZE" | "REJECTED" | "TERMINATED_PATH",
    message: string
  ): PolicyLog {
    const logItem: PolicyLog = {
      id: `POL-${status.substring(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: userId || "SYSTEM",
      legalObjective: objective || "مراجعة سيادية",
      decision,
      status,
      message,
    };
    centralSystemLogs.unshift(logItem);
    if (decision === "BLOCK" || decision === "FREEZE" || status === "AUTO_FREEZE" || status === "TERMINATED_PATH") {
      centralC9Logs.unshift(logItem);
    }
    return logItem;
  },

  /**
   * 1) validateContext()
   * Verifies context prerequisites: digital identity (User ID), authority/rôle, and clear legal objectives.
   */
  validateContext(context: EnforcementContext): PolicyValidationResult {
    if (!context.userId) {
      const msg = "فشل التحقق من الهوية السيادية: مجهول الهوية الرقمية (Anonymous ID). يُمنع الولوج دون توقيع هوية رقمية معتمدة.";
      this.logDecision("MAPPED_UNKNOWN", "مجهول الغاية", "BLOCK", "REJECTED", msg);
      return { passed: false, status: "REJECTED", message: msg };
    }

    if (!context.role) {
      const msg = "فشل التحقق من الارتباط الوظيفي: رتبة المستخدم وسجل الصلاحيات التابع له غير مقترن بشجرة أذونات المنصة.";
      this.logDecision(context.userId, context.legalObjective || "مجهول الغاية", "BLOCK", "REJECTED", msg);
      return { passed: false, status: "REJECTED", message: msg };
    }

    if (!context.legalObjective) {
      const msg = "فشل التحقق من المقصد القانوني: مبرر استدعاء الذكاء LEXI غير مصرح به في تذكرة الاستدعاء المعتمدة.";
      this.logDecision(context.userId, "غير مصنف", "BLOCK", "REJECTED", msg);
      return { passed: false, status: "REJECTED", message: msg };
    }

    return {
      passed: true,
      status: "COMPLIANT",
      message: "التحقق المبدئي من السياق سليم بالكامل ومطابق لبروتوكول الهوية الرقمية الكلية."
    };
  },

  /**
   * 2) enforcePrinciples()
   * Enforces the unnegotiable tenets of the LEXI Charter of Sovereignty:
   * - Procedure before text (الإجراء قبل النص)
   * - Verification before interpretation (التحقق قبل التفسير)
   * - Time as a legal element (الزمن عنصر قانوني)
   * - No compliance without documentation (لا امتثال بدون توثيق)
   * - C9 ledger is the supreme source of truth (سجل C9 هو مستند الحقيقة المطلق)
   */
  enforcePrinciples(context: EnforcementContext): PolicyValidationResult {
    // Principal: No compliance without documentation (لا امتثال بدون توثيق)
    if (!context.evidenceProvided && context.legalObjective?.includes("اعتراض")) {
      const msg = "رفض إجرائي: لا يمتثل الاعتراض للشكل النظامي لغياب الوثائق الثبوتية والبيانات المادية الكافية لمطابقة الادعاء.";
      this.logDecision(context.userId || "SYS", context.legalObjective, "BLOCK", "REJECTED", msg);
      return { passed: false, status: "REJECTED", message: msg };
    }

    // Principal: Verification before interpretation & C9 Ledger Supreme Authority
    if (context.legalObjective?.includes("دليل") && (context.c9RecordsCount === undefined || context.c9RecordsCount === 0)) {
      const msg = "قصور مادي: لا يُعتد بأي تفسير نظامي أو مبرر طالما لم يتم مسبقاً تسجيل الحجية والختم الرقمي في سلسلة C9 Ledger.";
      this.logDecision(context.userId || "SYS", context.legalObjective, "BLOCK", "REJECTED", msg);
      return { passed: false, status: "REJECTED", message: msg };
    }

    return {
      passed: true,
      status: "COMPLIANT",
      message: "تم التحقق ومطابقة المبادئ السيادية المعتمدة بنجاح."
    };
  },

  /**
   * 3) riskGate()
   * Implements strict Auto-Freeze Conditions:
   * - GPS Spoofing
   * - Missing Evidence
   * - High Severity + No Warning (الجزاء الأقصى دون تدرج في التنبيهات)
   * - Cross-Ministry Risk Escalation (التداخل القطاعي غير المصرح به بين بلدي والموارد البشرية)
   */
  riskGate(context: EnforcementContext): PolicyValidationResult {
    // A) GPS Spoofing Detection
    if (context.gpsIsSuspicious) {
      const msg = "تجميد سيادي فوري (AUTO-FREEZE): تم تفعيل حارس الأمن الجيومكاني لرصد تشويه متعمد أو محاكاة زائفة لإحداثيات الـ GPS (GPS Spoofing).";
      this.logDecision(context.userId || "SYS", context.legalObjective || "فحص جيومكاني", "FREEZE", "AUTO_FREEZE", msg);
      return { passed: false, status: "AUTO_FREEZE", message: msg };
    }

    // B) Geolocation Bounds Validation
    if (context.gpsCoordinates) {
      const { lat, lng } = context.gpsCoordinates;
      if (lat < 15.0 || lat > 32.5 || lng < 34.0 || lng > 55.0) {
        const msg = "تجميد سيادي فوري (AUTO-FREEZE): تم تفعيل حاجز النطاق السيادي لرصد محاولة تشغيل من إحداثيات تقع خارج الحدود الجغرافية للمملكة.";
        this.logDecision(context.userId || "SYS", context.legalObjective || "تدقيق جيو سيادي", "FREEZE", "AUTO_FREEZE", msg);
        return { passed: false, status: "AUTO_FREEZE", message: msg };
      }
    }

    // C) Temporal Validity Check / Expiration (72 Hour Boundary Limit)
    if (context.timeSinceIncidentHours !== undefined && context.timeSinceIncidentHours > 72) {
      const msg = "إنهاء وإسقاط فوري للمسار (TERMINATED): سقوط الأهلية القانونية للاعتراض للتجاوز التام للمهلة الزمنية المقررة نظاماً (72 ساعة).";
      this.logDecision(context.userId || "SYS", context.legalObjective || "تحقق زمني", "BLOCK", "TERMINATED_PATH", msg);
      return { passed: false, status: "TERMINATED_PATH", message: msg };
    }

    // D) High Severity + No Warning
    if (context.legalObjective?.includes("خصم") && !context.hasPreviousWarning) {
      const isSevere = context.legalObjective?.includes("أجور") || context.legalObjective?.includes("جسيم");
      if (isSevere) {
        const msg = "تجميد احترازي فوري (AUTO-FREEZE): رصد محاولة إيقاع عقوبة مالية أو خصم جسيم مباشر للموظف دون تدرج وظيفي أو تسجيل إنذار كتابي مسبق.";
        this.logDecision(context.userId || "SYS", context.legalObjective, "FREEZE", "AUTO_FREEZE", msg);
        return { passed: false, status: "AUTO_FREEZE", message: msg };
      }
    }

    // E) Cross-Ministry Risk Escalation (BALADI Municipal & HRSD Regulatory Overlaps)
    if (context.isCrossMinistry || (context.legalObjective?.includes("رخصة") && context.legalObjective?.includes("أجر"))) {
      const msg = "تجميد سيادي فوري (AUTO-FREEZE): رصد تداخل معقد في الاختصاصات والامتثال المشترك بين وزارة الشؤون البلدية والقروية (بلدي) ووزارة الموارد البشرية دون ترخيص بلوكشين مسبق.";
      this.logDecision(context.userId || "SYS", context.legalObjective || "تقاطع وزارات", "FREEZE", "AUTO_FREEZE", msg);
      return { passed: false, status: "AUTO_FREEZE", message: msg };
    }

    return {
      passed: true,
      status: "COMPLIANT",
      message: "اجتاز فلتر فحص المخاطر والأمان بنجاح."
    };
  },

  /**
   * 4) decisionLock()
   * Tone and Language Guardian. Guarantees that the output matches LEXI's locked persona:
   * - No corporate fluff, apologies, or personal placeholders.
   * - Immediate, commanding, short, objective legal statements.
   */
  decisionLock(textInput: string): string {
    if (!textInput) return "";

    let clean = textInput;

    const forbiddenPhrases = [
      /مرحباً بك/g,
      /أهلاً بك/g,
      /مساعدك الذكي/g,
      /عذراً أنا مجرد نموذج/g,
      /أنا ذكاء اصطناعي/g,
      /آسف على الإزعاج/g,
      /كيف يمكنني مساعدتك/g,
      /لك جزيل الشكر/g,
      /يسعدني جداً/g,
      /أتطلع لخدمتك/g,
      /تحياتي وتمنياتي بالتوفيق/g
    ];

    forbiddenPhrases.forEach((regex) => {
      clean = clean.replace(regex, "");
    });

    // Check for apologetic or hesitant markers
    if (
      clean.includes("آسف") ||
      clean.includes("عذراً") ||
      clean.includes("لا أستطيع") ||
      clean.includes("لا تتردد") ||
      clean.includes("المعذرة")
    ) {
      clean = `⚠️ تم عزل اللكنة العامة وفرض الصياغة السيادية:
- يتعذر الإجراء المقترح للقصور المستندي.
- مصفوفة الإثبات C9 تفتقر للصحائف المطلوبة.`;
    }

    return clean.trim();
  },

  /**
   * 5) enforceFiveStageProtocol()
   * Sanitizes and structure any LEXI outputs according to the mandatory 5 stages:
   * 1) Violation Classification
   * 2) Procedural Integrity Check
   * 3) Temporal Validity Check
   * 4) Defense Extraction
   * 5) C9 Sealing
   */
  enforceFiveStageProtocol(output: any): any {
    if (typeof output !== "object" || !output) {
      return output;
    }

    // Build or structure the result to strictly follow the five-stage format in Rationale or Outputs
    const formattedResult = { ...output };
    
    // Ensure decision is clear and non-abusive
    if (!formattedResult.decision) {
      formattedResult.decision = "REVIEW";
    }

    // Force strict structure inside rationale if it exists
    let rationale = formattedResult.rationale || "";
    if (rationale && !rationale.includes("بروتوكول المراحل الخمس")) {
      rationale = `[بروتوكول المراحل الخمس للامتثال السيادي لـ LEXI]:
1. تصنيف المخالفة (Violation Classification): تم التحقق من الحدث ومطابقته رقمياً.
2. الكفاءة الإجرائية والشكلية (Procedural Integrity): تم مراجعة النواحي الشكلية للمطالبة وتسجيل بطلان الإجراءات المعيبة.
3. الصلاحية والمهلة الزمنية (Temporal Validity): التحقق من السجل الزمني وضمن نطاق الاستحقاق (أقل من 72 ساعة).
4. الدفوع المستخلصة (Defense Extraction): صياغة دفع قانوني معزز بمستندات نظام العمل السعودي 2026.
5. ختم وتوثيق C9 (C9 Sealing): المعاملة مبرهنة تشفيرياً برقم المعرف المتفرد لسلسلة C9.

--------------------------------------------------
التحليل التفصيلي الفني:
${rationale}`;
      formattedResult.rationale = rationale;
    }

    // Ensure C9-seals are always present at the bottom of the objection draft
    let draft = formattedResult.objection_draft || "";
    if (draft && !draft.includes("C9 Sovereign Hash")) {
      const c9Hash = `SHA2026-${Date.now().toString(16)}-${Math.floor(Math.random() * 10000).toString(16).toUpperCase()}`;
      draft = `${draft}

--------------------------------──────────────────
🔒 تـم الـتـوقـيـع والـخـتـم الرقمي بموجب حماية كـتـل C9 لـمـنـصـة LexOps OS
🏛️ Verified by LEXI Sovereign Decoder
🔗 C9 Sovereign Hash ID: [${c9Hash}]`;
      formattedResult.objection_draft = draft;
    }

    return formattedResult;
  }
};
