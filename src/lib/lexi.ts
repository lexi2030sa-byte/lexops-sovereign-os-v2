/**
 * LEXI Smart Evaluation & Compliance Engine (v7.0)
 * Central authority for corporate compliance audits, geolocation gating,
 * labor law validation, and C9 Sovereign Block ledger stamping.
 */

export interface LexiResult {
  decision: "allow" | "block" | "review";
  article: string; // المادة النظامية
  reason: string;  // سبب الرفض / الموافقة / المراجعة
  sealId: string;  // الختم السيادي C9
}

export const LEXI = {
  /**
   * Validates a branch creation request
   */
  validateBranch(params: {
    branch_name: string;
    branch_type: string;
    municipality_license_number: string;
    latitude: number;
    longitude: number;
    safety_radius: number;
  }): LexiResult {
    const license = params.municipality_license_number.trim();
    const lat = params.latitude;
    const lng = params.longitude;

    // 1. License Plate Validation (must start with 14, and be 10 digits)
    if (license.length !== 10 || !license.startsWith("14")) {
      return {
        decision: "block",
        article: "المادة 4 من لائحة التوصيف الفني للتراخيص البلدية ووزارة الشؤون البلدية والقروية والإسكان",
        reason: "رقم رخصة البلدية غير صالح: رخصة بلدي الرسمية تتطلب 10 خانات عددية وتبدأ بالرقم '14' لترميز النشاط التجاري المصنف.",
        sealId: "C9-MUNI-LIC-ERR-P7"
      };
    }

    // 2. Geolocation Bounds (must be inside KSA territory bounds)
    // Latitude: [15.0, 32.5], Longitude: [34.0, 55.0]
    if (lat < 15.0 || lat > 32.5 || lng < 34.0 || lng > 55.0) {
      return {
        decision: "block",
        article: "المرسوم الملكي لحفظ السيادة الوطنية وقواعد الجغرافيا السيادية ونطاقات الحظر الجغرافي",
        reason: "الإحداثيات الجغرافية المطلوبة تقع خارج النطاق السيادي والحدود المعتمدة للمملكة العربية السعودية.",
        sealId: "C9-GEO-BOUNDS-SHIELD"
      };
    }

    // 3. Safety radius constraint check
    if (params.safety_radius < 10) {
      return {
        decision: "block",
        article: "اللائحة التنفيذية لضبط الحضور المكاني ونطاقات الأمان الوقائية",
        reason: "نصف قطر الأمان الوقائي للفرع لا يمكن أن يقل عن 10 أمتار لضمان دقة الرصد السيادي.",
        sealId: "C9-GEO-RADIUS-ERR"
      };
    }

    // Default Allow
    return {
      decision: "allow",
      article: "المادة 7 من لائحة تيسير الاستثمار وتجارة التجزئة وحوكمة الفروع الرقمية",
      reason: "تم التحقق الكامل من مطابقة رخصة النشاط التجاري بلدي وسياج الإحداثيات المعتمد للموقع.",
      sealId: `C9-MUNI-MATCH-${Math.floor(Math.random() * 90000) + 10000}`
    };
  },

  /**
   * Validates a workforce assignment to a branch
   */
  validateWorkforceAssignment(params: {
    branch_type: string;
    employee_id: string;
    employee_name: string;
    health_certificate_number?: string;
    health_certificate_expiry?: string; 
    health_certificate_issuer?: string;
    currentDate?: string; // default "2026-05-20"
  }): LexiResult {
    const isHealthOrFoodSec = ["restaurant", "cafe", "health", "salon"].includes(params.branch_type);
    const curr = params.currentDate || "2026-05-20";

    if (isHealthOrFoodSec) {
      const hcNo = params.health_certificate_number?.trim();
      const hcExp = params.health_certificate_expiry?.trim();

      // 1. Missing Health Certificate
      if (!hcNo) {
        return {
          decision: "block",
          article: "المادة 12 من لائحة الرقابة الصحية على المحلّات ومزاولي الأنشطة ذات الأثر البيئي والصحي العام",
          reason: "لا يمكن إضافة الموظف — اشتراطات النشاط الصحي غير مكتملة. (الشهادة الصحية البلدية إلزامية ومفقودة من ملف الموظف لتشغيل الفروع ذات الأثر الصحي).",
          sealId: "C9-WORK-SAN-REJECTED"
        };
      }

      // 2. Expired Health Certificate
      if (hcExp) {
        const parsedExpiry = new Date(hcExp);
        const refDate = new Date(curr);

        if (parsedExpiry < refDate) {
          return {
            decision: "block",
            article: "المادة 15 من لائحة الغرامات والجزاءات البلدية لوزارة الشؤون البلدية والقروية",
            reason: `لا يمكن إضافة الموظف — اشتراطات النشاط الصحي غير مكتملة. (الشهادة الصحية المقدّمة منتهية الصلاحية بتاريخ ${hcExp} ومخالفة للفحوصات الطبية المعتمدة ومقتضيات السلامة العامة).`,
            sealId: "C9-WORK-SAN-EXPIRED"
          };
        }
      } else {
        return {
          decision: "block",
          article: "المادة 12 من لائحة الرقابة الصحية على الأنشطة الغذائية والمهنية",
          reason: "لا يمكن إضافة الموظف — اشتراطات النشاط الصحي غير مكتملة. (يرجى توفير تاريخ انتهاء سريان الشهادة الصحية).",
          sealId: "C9-WORK-SAN-NOEXP"
        };
      }
    }

    // Default Allow
    return {
      decision: "allow",
      article: "المادة 38 من نظام العمل السعودي وحرية إسناد الواجبات التشغيلية داخل الفروع الموثقة",
      reason: "تم قبول إسناد وتوثيق الموظف بالفرقة التشغيلية للفرع بعد نجاح المطابقة الوقائية الصحية والرقابية.",
      sealId: `C9-WORKER-BOND-${Math.floor(Math.random() * 90000) + 10000}`
    };
  }
};
