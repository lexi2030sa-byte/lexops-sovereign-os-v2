import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  Cpu, 
  MapPin, 
  FileCheck, 
  Search, 
  ExternalLink,
  AlertTriangle,
  Award,
  Sparkles,
  SearchCode,
  QrCode,
  Map,
  BadgeAlert,
  Clock,
  Briefcase,
  TrendingUp,
  FileSignature
} from "lucide-react";

interface SovereignUserGuideProps {
  lang?: "ar" | "en";
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser?: any;
  isInline?: boolean;
}

export default function SovereignUserGuide({ 
  lang = "ar", 
  activeTab, 
  setActiveTab,
  currentUser,
  isInline = false
}: SovereignUserGuideProps) {
  const isAr = lang === "ar";

  // Map roles to guide categories
  // 1. Founder & Financial Owner -> founder, orgadmin
  // 2. Compliance Director & Legal -> compliance, legal
  // 3. Employee -> employee, freelancer
  // 4. Inspector / External Auditor -> government, inspector
  
  const userRole = currentUser?.role?.toLowerCase() || "";
  
  let detectedGuideType: "founder" | "compliance" | "employee" | "inspector" | null = null;
  if (userRole === "founder" || userRole === "orgadmin" || userRole === "sovereign_controller") {
    detectedGuideType = "founder";
  } else if (userRole === "compliance" || userRole === "legal") {
    detectedGuideType = "compliance";
  } else if (userRole === "employee" || userRole === "freelancer") {
    detectedGuideType = "employee";
  } else if (userRole === "government" || userRole === "inspector") {
    detectedGuideType = "inspector";
  }

  // State to hold the guide currently being viewed. Defaults to the user's detected guide type.
  const [activeGuideType, setActiveGuideType] = useState<"founder" | "compliance" | "employee" | "inspector" | null>(null);

  useEffect(() => {
    if (detectedGuideType) {
      setActiveGuideType(detectedGuideType);
    }
  }, [detectedGuideType]);

  const guideType = activeGuideType || detectedGuideType || "founder";

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentChapter, setCurrentChapter] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Guide checklists (custom per role to fulfill the compliance milestones)
  const [founderChecklist, setFounderChecklist] = useState({
    id700: false,
    geofence: false,
    payroll: false,
    complianceAudit: false,
    exeDeed: false
  });

  const [complianceChecklist, setComplianceChecklist] = useState({
    violationScan: false,
    lexiObjection: false,
    pdfExport: false,
    article101: false,
    salarySync: false
  });

  const [employeeChecklist, setEmployeeChecklist] = useState({
    geofenceClockin: false,
    restPeriodTracker: false,
    salaryIntegrityCheck: false,
    proactiveAlerts: false,
    contractMatch: false
  });

  const [inspectorChecklist, setInspectorChecklist] = useState({
    c9HashVerify: false,
    qrLiveMatch: false,
    isic4Check: false,
    contractWpsCompare: false,
    realtimeScore: false
  });

  // Chapter interactive states
  // ID validation
  const [input700, setInput700] = useState<string>("7005432109");
  const [validation700Result, setValidation700Result] = useState<{
    valid: boolean;
    msg: string;
    c9Hash?: string;
  } | null>(null);

  // WPS conflict solver
  const [wpsConflictState, setWpsConflictState] = useState<"unresolved" | "resolving" | "resolved">("unresolved");
  const [pdfProgress, setPdfProgress] = useState<boolean>(false);

  // LEXI Generator Sandbox
  const [lexiTargetViolation, setLexiTargetViolation] = useState<string>("wps_gap");
  const [lexiResult, setLexiResult] = useState<string>("");
  const [lexiGenerating, setLexiGenerating] = useState<boolean>(false);

  // Employee Geofence distance tool
  const [geoDistance, setGeoDistance] = useState<number>(140);
  const [geoStatusResult, setGeoStatusResult] = useState<{
    allowed: boolean;
    msgAr: string;
    msgEn: string;
    c9Lock?: string;
  } | null>(null);

  // Inspector Security Hash analyzer
  const [inspectTargetHash, setInspectTargetHash] = useState<string>("C9-F83A20B9-9D21");
  const [inspectResult, setInspectResult] = useState<{
    valid: boolean;
    timestamp: string;
    operator: string;
    complianceScore: string;
    titleAr: string;
    titleEn: string;
  } | null>(null);

  // 🔒 SECURITY CHECKPOINT: Must NOT show before login, loaded profile, and resolved role
  if (!currentUser || !currentUser.role || currentUser.role === "guest" || currentUser.id === "GUEST") {
    return null;
  }

  // Auto show logic has been removed so that the learning guide does not pop up automatically 
  // on first-time user login and is strictly accessible on-demand from the sidebar.

  const markGuideAsRead = () => {
    localStorage.setItem(`lexops_first_time_guide_seen_${currentUser.id}`, "true");
    setIsOpen(false);
  };

  // HANDLERS
  const handleValidate700 = () => {
    const cleanId = input700.trim();
    if (/^7\d{9}$/.test(cleanId)) {
      setValidation700Result({
        valid: true,
        msg: isAr 
          ? `✓ المعرف الموحد ${cleanId} صالح ومطابق لقيود التوطين والـ C9 Ledger لمنطقة الشرقية.` 
          : `✓ Corporate ID ${cleanId} is verified on Eastern Province C9 ledger subnet.`,
        c9Hash: "PENDING_C9_SYNC"
      });
      setFounderChecklist(prev => ({ ...prev, id700: true }));
    } else {
      setValidation700Result({
        valid: false,
        msg: isAr 
          ? "✗ صيغة خاطئة: المعرف الموحد للمنشأة 700 يجب أن يتألف من 10 خانات ويبدأ بالرقم 7." 
          : "✗ Invalid Format: Corporate ID must be exactly 10 decimals beginning with 7."
      });
    }
  };

  const handleSettleWpsConflicts = () => {
    setWpsConflictState("resolving");
    setTimeout(() => {
      setWpsConflictState("resolved");
      setFounderChecklist(prev => ({ ...prev, complianceAudit: true }));
    }, 1500);
  };

  const handleRunEmployeeGeofenceCheck = () => {
    if (geoDistance <= 100) {
      setGeoStatusResult({
        allowed: true,
        msgAr: "✓ موقع الحضور معتمد: أنت داخل النطاق المرخص 100م للمنشأة. تم فك حظر البصمة.",
        msgEn: "✓ Allowed: Coordinates match valid 100m geofenced terminal. Handshake signature locked.",
        c9Lock: "PENDING_GEOFENCE"
      });
      setEmployeeChecklist(prev => ({ ...prev, geofenceClockin: true }));
    } else {
      setGeoStatusResult({
        allowed: false,
        msgAr: "✗ خطأ حضور: المسافة الحالية تتعدى النطاق الأمني (100 متر). يرجى موازنة الإحداثيات.",
        msgEn: "✗ Denied: Detected cell drift exceeds system limit (100m buffer). Reposition device GPS."
      });
    }
  };

  const handleGenerateLexiSandbox = () => {
    setLexiGenerating(true);
    setLexiResult("");
    setTimeout(() => {
      let draftText = "";
      if (lexiTargetViolation === "wps_gap") {
        draftText = `سعادة مدير عام وزارة الموارد البشرية المحترم،
السلام عليكم ورحمة الله وبركاته،
الموضوع: اعتراض قانوني متكامل على فجوة الأجور برقم (TX-WPS-491)
بالإشارة إلى التنويه الصادر بخصوص مسيرات شهر مايو، نبين لفضيلتكم بأن المنشأة تمتثل امتثالاً تاماً لكافة العقود الموثقة عبر منصة قوى. الفروقات البسيطة والبالغة 242 ريالاً هي بدل إجارة مأذون به بمستند رسمي ومثبت بـ C9 Ledger كتلة 19284. نرجو توثيق التسوية وإلغاء التعميم فورًا.
نظام LEXI AI للاعتراضات بالذكاء الاصطناعي السيادي - المنطقة الشرقية.`;
      } else if (lexiTargetViolation === "gps_deviation") {
        draftText = `المكرمون في مكتب العمل بمدينة الدمام،
بعد التحية والتقدير،
رداً على إشعار رصد الحضور الطارئ للموظف (EMP-409)، نثبت بنص هذا الخطاب أن المنشأة طورت سياجاً هيدروليكياً رقمياً بسعة 100 متر وفق الترخيص التقني. عدم تزامن الإشارة كان لوجود غيوم رعدية أثرت على الأقمار الخلوية بقصر صاهود. إثبات الوجود الفعلي مدون بختم SADE المحمي.
لذا نلتمس قبول عذر الموظف وإسقاط المخالفة التشغيلية.`;
      } else {
        draftText = `السادة المحترمون بلجنة الفصل والمخالفات البلدية،
السلام عليكم ورحمة الله،
نفيدكم بموجب السجل التجاري والترخيص الهندسي للموقع رقم (B-49271) أن المنشأة طبقت كافة معايير الإصحاح المهني والفحص الحراري v1.2 وفق جداول معيار تصنيف الأنشطة ISIC4. الختم الأزرق والتقرير الهندسي متاح برمز التحقق (HMAC-SHA256).
شاكرين لكم تعاونكم الرقابي الدائم.`;
      }
      setLexiResult(draftText);
      setLexiGenerating(false);
      setComplianceChecklist(prev => ({ ...prev, lexiObjection: true }));
    }, 1200);
  };

  const handleInspectHash = () => {
    const cleanHash = inspectTargetHash.toUpperCase().trim();
    if (cleanHash.includes("C9-")) {
      setInspectResult({
        valid: true,
        timestamp: "2026-06-13 09:27:57 UTC",
        operator: isAr ? "النظام المستقل الموحد لإدارة السندات (SADE)" : "Sovereign Autonomous Node (SADE)",
        complianceScore: "98.4%",
        titleAr: "سند رصد أجور وبراءة ذمة للمنشأة",
        titleEn: "Wage Protection Certificate of Discharge"
      });
      setInspectorChecklist(prev => ({ ...prev, c9HashVerify: true }));
    } else {
      setInspectResult(null);
    }
  };

  // Chapters Content for Founder & Financial Owner
  const founderChapters = [
    {
      titleAr: "🏛️ 1. العقيدة السيادية للنظام والوقاية",
      titleEn: "🏛️ 1. Financial Sovereign Doctrine",
      contentAr: `مرحباً بك يا حضرة المؤسس في لوحة قيادة LexOps OS. إن هذا النظام مصمم خصيصاً ليحكم العلاقة التعاقدية ويقي منشأتك من قرارات وعقوبات تجميد الخدمات وغرامات البلدية وحماية الأجور WPS.

نركز هنا على أقصى درجات اليقين الرقمي ونمنع الأخطاء البشرية باستخدام السجلات غير القابلة للتبديل (C9 Ledger) التي تقدم مستندات قطعية صالحة للمخاصمة مباشرة.`,
      contentEn: `Welcome Founder to the custom command architecture of LexOps OS. This interface blocks manual compliance slippage, defending your trade licence from payroll freezes, WPS locks, and labor violations.

By anchoring your operation to C9's immutable record ledger, you transform dynamic payroll and geofence data into certified judicial-ready proof.`
    },
    {
      titleAr: "🛠️ 2. ربط الهوية المؤسسية (700)",
      titleEn: "🛠️ 2. Wire Corporate 700 Key",
      contentAr: `الخطوة الأولى لتأسيس المنشأة وتأصيل حضور سليم:
تتحقق هذه الأداة التقنية من رمز التوظيف الموحد المكون من 10 خانات ويبدأ برقم 7 للبدء في تشفير كافة التراخيص وسندات صرف الراتب وربطها بالهيئة الوطنية ومكتب العمل لتفادي غرامات السجل التجاري المزدوج.`,
      contentEn: `The baseline cryptographic step to establish safe operational parameters:
This controller validates the 10-digit Saudi consolidated business registration key (starting with '7') to anchor every single payment sheet, contract, and geofence boundary.`
    },
    {
      titleAr: "📡 3. قواعد السياج الآمن وحماية الجيوفينس",
      titleEn: "📡 3. 100m Spatial Geofence Mandates",
      contentAr: `يفرض نظام LexOps OS نطاقاً خلوياً صارماً بقطر 100 متر حول كل فرع مرخص. 
يمنع هذا التدبير التلاعب بمواقع العمال، ويقوم بموازنة الإحداثيات الخاضعة بموجب عقود قوى المربوطة. غياب الموظف خارج النطاق لـ 12 متراً يُنذر النظام لصياغة إرشادات التصحيح وتجنب المخالفات الفورية.`,
      contentEn: `LexOps OS enforces a strict 100-meter cellular perimeter around your branches.
This blocks cellular spoofing and matches spatial logs against employment folders. Any cellular breach over 12m generates early warnings, helping staff realign coordinates.`
    },
    {
      titleAr: "📑 4. مسيرات الأجور الوطنية الصارمة",
      titleEn: "📑 4. Wage Protection Suite (WPS) Policy",
      contentAr: `النظام يربط ملفات حماية الرواتب الوطنية (WPS) المصدرة من البنوك آلياً بالعقود الموثقة بالموارد البشرية من منصة قوى.
يمنع النظام الخصومات العشوائية غير النظامية والمخدرة، وتتم تسوية كل فروق بنكي آلياً في محرك الامتثال لخلق شهادة تفتيش نظيفة.`,
      contentEn: `The system links bank wage protection registry files with Qiwa employment records automatically.
This blocks unverified regulatory deductions, enabling the WPS compliance engine to balance gaps on the fly.`
    },
    {
      titleAr: "⚡ 5. تصفية وحل التعارضات في الأجور تلقائياً",
      titleEn: "⚡ 5. Automated Mismatch Settlement",
      contentAr: `عند تفعيل محرك الامتثال، يقوم الروبوت برصد الفجوات ومقارنتها بسجلات الغياب والبدلات ثم تصفية الكسور.
استخدم زر "تسوية التعارضات التلقائية" لإرسال مبالغ الفروق والتسويات القانونية تلقائياً لإغلاق القلق الرقابي بمكاتب العمل بدقيقة واحدة.`,
      contentEn: `Our WPS Auditing suite tracks wage shortages and checks them against unexcused leaves and travel records.
Triggering automated settlements issues corrective payouts, ensuring your enterprise stays within the 100% compliance bracket.`
    },
    {
      titleAr: "🏛️ 6. إصدار السند التنفيذي وحيازة السند",
      titleEn: "🏛️ 6. Issue Certified Legal Deeds",
      contentAr: `لكل تسوية أجور ناجحة، يقوم محرك SADE وعقدة C9 Ledger بختم صك براءة الذمة. 
تنتج هذه الأداة سنداً تنفيذياً بصيغة PDF سيادي يحتوي على كود الختم الذهبي وتوقيع HMAC-SHA256 المشفر ومرفق بباركود QR للتحقق الميداني المباشر من قبل مفتشي الوزارة العابرين.`,
      contentEn: `For every balanced payroll, the SADE engine compiles a certified document packet.
The output is a sovereign compliance deed (highly-scannable PDF) featuring our signature cryptographic watermark, verification QR, and unique HMAC hash.`
    }
  ];

  // Chapters Content for Compliance Director
  const complianceChapters = [
    {
      titleAr: "🏛️ 1. المنهجية القضائية لمحرك الاعتراضات",
      titleEn: "🏛️ 1. Systematic Legal Defense",
      contentAr: `مرحباً بك يا مدير الامتثال والشؤون القانونية في معسكر LEXI AI. 
إن دورك الجوهري هو حماية مصادر المنشأة بمقارنة أي مخالفة أو محضر ضبط يرسل من بلدي أو قوى أو إيفاء وصياغة الدفوع القانونية المبرهنة تقنياً. يعتمد النظام على اليقين الرقمي لحجب مئات آلاف الريالات من الغرامات الباطلة.`,
      contentEn: `Welcome Director to LEXI AI's corporate defense workstation.
Your crucial mandate is isolating regulatory infraction notices, crosschecking them with local digital trails, and generating courtroom-ready Arabic petitions to stop automated citations.`
    },
    {
      titleAr: "🔍 2. عزل وتحليل المخالفات الاستباقي",
      titleEn: "🔍 2. Interactive Violation Diagnostics",
      contentAr: `يفحص محرك LexOps كافة تنبيهات الفروع ونشاط الكادر الجغرافي.
عند الكشف عن أي مخالفة (كحضور خارج النطاق أو تفاوت الأجور للمادة 92)، تفرز المخالفة مؤقتاً باللوحة لإتاحة صياغة ردود تقنية مشفوعة بقرائن الـ C9 blockchain قبل تصعيد الغرامة الموجهة.`,
      contentEn: `LexOps audits all branch activities and staff cellular coordinates.
Upon detecting minor infractions (such as localized GPS drifts or paycheck adjustments), Citations are isolated, buying time to compile certified proof archives.`
    },
    {
      titleAr: "⚖️ 3. توليد عرائض اعتراض رسمية بـ LEXI AI",
      titleEn: "⚖️ 3. Create Arabic Objections in LEXI",
      contentAr: `بوابة الدفاع التقني الذكي:
صك عريضة الرد العربي بقوة الذكاء الفذ في LEXI AI. يركب المحرك مواد قانون العمل والمادة 95 و101 بصياغة بليغة محكمة تفيد مكاتب التسوية الودية، وتدمج بصمة الختم لتثبيت التواجد الفعلي للموظف بقوة.`,
      contentEn: `The core of sovereign legal tech:
Generate official defense letters incorporating Saudi labor articles. LEXI formats these documents with exquisite legal phrasing, embedding cellular forensic logs.`
    },
    {
      titleAr: "📥 4. فك الأختام وتصدير مستند الـ PDF السيادي",
      titleEn: "📥 4. Render and Download Certified PDF",
      contentAr: `لحفظ الحقوق وصيانة الالتزام، تُطبع الدفوع والاعتراضات بلون مذهب رسمي معزز برمز التحقق والأختام السيادية المشفرة لبيئة الدمام الشرقية.
قم بتحميل سند المخاصمة بصيغة PDF لرفعه الفوري بمنصات إيفاء أو بلدي أو الرفع كخطاب إستئناف بمجال المنازعات العمالية.`,
      contentEn: `To preserve compliance, our system stamps agreements with SADE's cryptographic seal.
Export and download these reports instantly as high-contrast corporate PDF files properly scaled for official legal procedures.`
    }
  ];

  // Chapters Content for Employee
  const employeeChapters = [
    {
      titleAr: "👤 1. ميثاق وواجبات الامتثال للموظف",
      titleEn: "👤 1. Employee Operational Protocol",
      contentAr: `مرحباً بك في نظام التشغيل السيادي.
إن تفعيل معايير التواجد الجغرافي وحماية الأجر يهدف بالدرجة الأولى لصيانة مستحقاتك المالية وإثبات انضباطك التشغيلي في مقار العمل بالمنطقة الشرقية دون أي تأخير أو تدخل بشري عابث.`,
      contentEn: `Welcome to the company's autonomous compliance framework.
Enforcing geometric geofencing limits and payroll checks safeguards your regulatory wages. Active tracking validates your physical work presence securely.`
    },
    {
      titleAr: "📍 2. مطابقة موقع العمل والجيوفينس (100م)",
      titleEn: "📍 2. Geofenced Workspaces & GPS Sync",
      contentAr: `لتسجيل حضورك وانصرافك بنجاح، يجب أن يكون الهاتف داخل السياج الأمني المعتمد لفرعك ومصنعك (سعة 100 متر).
يقوم النظام بمطابقة إشارات هاتف الجوال مع قمر الملاحة بشكل متقطع. تظهر لك أداة المحاكاة بالأسفل قدرة النظام على كشف الانحرافات ومساعدتك على المعايرة.`,
      contentEn: `Clocking actions must occur within the authorized 100m geofence bubble of your facility.
The system queries satellite coordinates periodically. Utilize the geospace simulator below to verify your alignment and fix any signals.`
    },
    {
      titleAr: "⏱️ 3. ساعات العمل وفترات الاستراحة (المادة 101)",
      titleEn: "⏱️ 3. Work Hour Safety & Article 101",
      contentAr: `صيانة لصحتك الجسدية والتزاماً بنظام العمل، يمنع العمل لأكثر من 5 ساعات متواصلة دون استراحة غداء أو صلاة.
يرسل النظام تنبيهات إرشادية لهاتفك لعرقلة الإجهاد الزائد، ويقيد ساعات العمل وتوثيق الأوفرتايم (فوق 8 ساعات) آلياً لحفظ حقك بـ C9.`,
      contentEn: `Defending your safety and complying with labor regulations: continuous work is capped at 5 hours without rest.
LexOps alerts your device proactively, registering overtime schedules in C9 ledger blocks so no extra hours go unpaid.`
    },
    {
      titleAr: "💳 4. صون الأجر ومنع الخصوم الجوفاء",
      titleEn: "💳 4. Wage Protection Policy & Article 92",
      contentAr: `مستحقاتك المالية محصنة بمحرك WPS.
يمنع النظام الخصومات اليدوية العشوائية للراتب الأساسي دون تعهد موقع أو تحقيق رسمي مشفر بكتلة Ledger. الرواتب البنكية المودعة شهرياً يجب أن تطابق بدقة أرقام العقد الموثق.`,
      contentEn: `Your wage represents a legally protected covenant.
The platform blocks arbitrary deductions, matching bank payroll logs with employment agreement sheets to ensure perfect consistency.`
    }
  ];

  // Chapters Content for Inspectors
  const inspectorChapters = [
    {
      titleAr: "🔍 1. المنهجية الرقابية لليقين القضائي المتبادل",
      titleEn: "🔍 1. Inspection and Audit Core",
      contentAr: `مرحباً بك يا سعادة المفتش الميداني في بوابة الرقابة بنظام LexOps.
إن هذا النظام يدعم مهمتكم في رصد التجاوزات وضمان التوطين الفعلي وحماية الأجور WPS عبر تحويل السجلات لقرائن تقنية متكاملة. نعتمد اليقين الرقمي بدلاً من الذاكرة البشرية.`,
      contentEn: `Welcome Inspector to the state-of-the-art administrative audit platform.
This framework speeds up official field checks, cross-analyzing localized payroll databases with cellular geofences in real-time, backed by cryptographic logs.`
    },
    {
      titleAr: "🔗 2. فك الرموز والتفتيش اليدوي عبر C9 Ledgers",
      titleEn: "🔗 2. C9 Encrypted Hash Audit Module",
      contentAr: `كل سند دفع أو سجل استراحة أو محضر تحقيق صادر من المنشأة يتم ختامه برمز HMAC-SHA256 مسجل بكتل C9 Ledger غير القابلة للعبث.
يمكنك إدخال رمز التحقق في المحاكي للتأكد من الموثوقية وسلامة التاريخ المالي للموظف.`,
      contentEn: `Every legal action is stamped with a cryptographic signature and written to C9 blocks.
Input any verification code into the inspection analyzer to audit the exact timestamp, validating compliance records instantly.`
    },
    {
      titleAr: "📲 3. فحص البصمة والتحقق عبر QR LIVE MATCH",
      titleEn: "📲 3. QR Live Match & Compliance Metrics",
      contentAr: `تحقق ميداني متطور:
بمجرد مسح رمز الباركود المعروض على واجهات الموظفين، يطابق النظام إحداثيات المشرف الجغرافية مع عقد منصة قوى وحساب البنك شهيداً. يضمن ذلك حيوية العمل ومحاربة محاولات السداد الوهمي.`,
      contentEn: `Scanning dynamic verification QR tags unlocks live coordinate handshakes.
It aggregates payroll data, geofenced actions, and enterprise ISIC4 classifications, ensuring absolute truth in seconds.`
    }
  ];

  // Selecting active chapters list based on role
  let activeChapters = founderChapters;
  if (guideType === "compliance") {
    activeChapters = complianceChapters;
  } else if (guideType === "employee") {
    activeChapters = employeeChapters;
  } else if (guideType === "inspector") {
    activeChapters = inspectorChapters;
  }

  // Bound the current chapter pointer safely
  const safeChapterIndex = currentChapter >= activeChapters.length ? 0 : currentChapter;
  const activeChapterObj = activeChapters[safeChapterIndex] || activeChapters[0];

  const searchFilteredChapters = activeChapters.filter(c => {
    const text = searchTerm.toLowerCase();
    return c.titleAr.toLowerCase().includes(text) || 
           c.titleEn.toLowerCase().includes(text) || 
           c.contentAr.toLowerCase().includes(text) || 
           c.contentEn.toLowerCase().includes(text);
  });

  const mainLayout = (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 15 }}
      className={`bg-[#030612] border-2 border-yellow-600/40 rounded-2xl w-full text-right flex flex-col md:flex-row shadow-[0_0_35px_rgba(212,175,55,0.15)] ${
        isInline ? "min-h-[75vh]" : "max-w-5xl h-full max-h-[85vh] overflow-hidden"
      }`}
      style={{ direction: isAr ? "rtl" : "ltr" }}
    >
              
              {/* SIDEBAR */}
              <div className="w-full md:w-80 bg-[#1c2541] border-b md:border-b-0 md:border-r border-yellow-500/10 p-5 flex flex-col justify-between overflow-y-auto shrink-0 font-sans gap-5">
                
                <div className="space-y-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <h2 className="text-white text-xs font-black tracking-wide font-sans leading-none">
                        {isAr ? "دليل الأمان السيادي" : "Sovereign Guidebook"}
                      </h2>
                      <span className="text-[9px] text-[#D4AF37] block font-mono mt-1">
                        ROLE: {guideType.toUpperCase()} // DAMMAM SUBNET
                      </span>
                    </div>
                  </div>

                  {/* ROLE SELECTION TABS FOR GUIDES */}
                  <div className="space-y-1.5 bg-[#101424]/40 border border-yellow-500/15 p-2 rounded-xl text-right">
                    <span className="text-[9px] text-yellow-500/90 font-mono font-black uppercase tracking-wider block mb-1">
                      {isAr ? "👤 اختر دليل فئة المستخدم:" : "👤 Select Target Learning Guide:"}
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { type: "founder", ar: "المالك والمؤسس", en: "Founder" },
                        { type: "compliance", ar: "مدير الامتثال", en: "Compliance" },
                        { type: "employee", ar: "الموظف العامل", en: "Employee" },
                        { type: "inspector", ar: "المفتش الرقابي", en: "Inspector" }
                      ].map((btn) => (
                        <button
                          key={btn.type}
                          onClick={() => {
                            setActiveGuideType(btn.type as any);
                            setCurrentChapter(0);
                            if (typeof navigator !== "undefined" && navigator.vibrate) {
                              navigator.vibrate(10);
                            }
                          }}
                          className={`px-1.5 py-1 text-[9px] font-bold border rounded transition-all duration-200 cursor-pointer text-center leading-tight ${
                            guideType === btn.type
                              ? "bg-gradient-to-r from-amber-600 to-yellow-500 text-black border-yellow-400 font-black shadow-[0_0_10px_rgba(212,175,55,0.25)]"
                              : "bg-[#1c2541] text-gray-400 hover:text-white border-white/5 hover:bg-white/5"
                          }`}
                        >
                          {isAr ? btn.ar : btn.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ACTIVE ROLE PROFILE BADGE */}
                  <div className="bg-[#0b0f19] border border-yellow-500/20 p-3 rounded-xl space-y-1.5 text-right">
                    <span className="text-[10px] text-yellow-500 font-extrabold block">
                      🛡️ {isAr ? "الدور النشط بالمنظومة" : "Active Regulatory Role"}
                    </span>
                    <span className="text-[12px] text-white block font-sans font-bold leading-normal">
                      {guideType === "founder" && (isAr ? "المؤسس والمالك المالي للمنشأة" : "Enterprise Founder & Owner")}
                      {guideType === "compliance" && (isAr ? "مدير الامتثال والشؤون القانونية" : "Compliance Director & Legal")}
                      {guideType === "employee" && (isAr ? "الموظف والكادر الميداني" : "Corporate Field Staff / Employee")}
                      {guideType === "inspector" && (isAr ? "المفتش والجهة الحكومية الرقابية" : "Government Inspector / Auditor")}
                    </span>
                    <div className="h-1 bg-yellow-500/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 w-full" />
                    </div>
                  </div>

                  {/* CUSTOM TIMESTEP CHECKLIST FOR EACH DEDICATED ROLE */}
                  <div className="p-3 bg-yellow-500/[0.02] border border-yellow-500/10 rounded-xl space-y-2.5 text-right">
                    <span className="text-[9px] text-yellow-500/90 block font-black uppercase tracking-wider font-mono">
                      {isAr ? "مصفوفة الامتثال المطلوبة" : "Target Compliance Checklist"}
                    </span>
                    
                    <div className="space-y-1.5">
                      {/* FOUNDER CHECKLIST */}
                      {guideType === "founder" && [
                        { key: "id700", ar: "ربط الرقم التجاري 700", en: "Establish Corporate 700 Key" },
                        { key: "geofence", ar: "تفعيل الجوفينس (100 متر)", en: "Configure 100m Geofence Buffer" },
                        { key: "payroll", ar: "تفعيل أجور WPS الوطنية", en: "Link Bank WPS Wage File" },
                        { key: "complianceAudit", ar: "إتمام مطابقة فروقات الأجور", en: "Execute Automated Reconciliation" },
                        { key: "exeDeed", ar: "تصدير السند والختم السيادي", en: "Generate Certified SADE Deed" }
                      ].map((item) => {
                        const checked = (founderChecklist as any)[item.key];
                        return (
                          <button
                            key={item.key}
                            onClick={() => setFounderChecklist(p => ({ ...p, [item.key]: !checked }))}
                            className="w-full flex items-center justify-between text-[10px] text-gray-400 hover:text-white leading-normal cursor-pointer text-right p-1 rounded hover:bg-white/5"
                          >
                            <span className={checked ? "line-through text-emerald-400" : ""}>
                              {isAr ? item.ar : item.en}
                            </span>
                            <CheckCircle2 className={`w-3.5 h-3.5 ${checked ? "text-emerald-400 fill-emerald-500/10" : "text-gray-700"}`} />
                          </button>
                        );
                      })}

                      {/* COMPLIANCE CHECKLIST */}
                      {guideType === "compliance" && [
                        { key: "violationScan", ar: "جرد وتحليل المخالفات الاستباقي", en: "Proactive Citation Isolation" },
                        { key: "lexiObjection", ar: "توليد اعتراض بـ LEXI AI", en: "Draft Arabic Court Objection" },
                        { key: "pdfExport", ar: "تصدير عريضة المخاصمة PDF", en: "Download Signed Defense PDF" },
                        { key: "article101", ar: "إدراج شروط المادة 101 و90", en: "Enforce Article 101/90 Constraints" },
                        { key: "salarySync", ar: "مواءمة حضور الكادر الجغرافي", en: "Audit Unified Geospace Ledger" }
                      ].map((item) => {
                        const checked = (complianceChecklist as any)[item.key];
                        return (
                          <button
                            key={item.key}
                            onClick={() => setComplianceChecklist(p => ({ ...p, [item.key]: !checked }))}
                            className="w-full flex items-center justify-between text-[10px] text-gray-400 hover:text-white leading-normal cursor-pointer text-right p-1 rounded hover:bg-white/5"
                          >
                            <span className={checked ? "line-through text-emerald-400" : ""}>
                              {isAr ? item.ar : item.en}
                            </span>
                            <CheckCircle2 className={`w-3.5 h-3.5 ${checked ? "text-emerald-400 fill-emerald-500/10" : "text-gray-700"}`} />
                          </button>
                        );
                      })}

                      {/* EMPLOYEE CHECKLIST */}
                      {guideType === "employee" && [
                        { key: "geofenceClockin", ar: "البصمة داخل الجيوفينس (100م)", en: "Cellular Attendance Verification" },
                        { key: "restPeriodTracker", ar: "تطبيق فترات الراحة (المادة 101)", en: "Lock continuous limit (5 hours)" },
                        { key: "salaryIntegrityCheck", ar: "حظر وتحري الحسميات العشوائية", en: "Decline unverified wage deduction" },
                        { key: "proactiveAlerts", ar: "متابعة التنبيهات والإنذارات", en: "Monitor Proactive Mobile Signals" },
                        { key: "contractMatch", ar: "مطابقة الراتب البنكي شهرياً", en: "Audit Live Payroll-Qiwa Matching" }
                      ].map((item) => {
                        const checked = (employeeChecklist as any)[item.key];
                        return (
                          <button
                            key={item.key}
                            onClick={() => setEmployeeChecklist(p => ({ ...p, [item.key]: !checked }))}
                            className="w-full flex items-center justify-between text-[10px] text-gray-400 hover:text-white leading-normal cursor-pointer text-right p-1 rounded hover:bg-white/5"
                          >
                            <span className={checked ? "line-through text-emerald-400" : ""}>
                              {isAr ? item.ar : item.en}
                            </span>
                            <CheckCircle2 className={`w-3.5 h-3.5 ${checked ? "text-emerald-400 fill-emerald-500/10" : "text-gray-700"}`} />
                          </button>
                        );
                      })}

                      {/* INSPECTOR CHECKLIST */}
                      {guideType === "inspector" && [
                        { key: "c9HashVerify", ar: "التحقق من رمز C9 Ledger Hash", en: "Audit C9 Ledger Digital Signature" },
                        { key: "qrLiveMatch", ar: "مطابقة رصد البصمة (QR Live)", en: "Verify QR Attendance Match" },
                        { key: "isic4Check", ar: "مطابقة نشاط السجل التجاري ISIC4", en: "Inspect Branch activity code" },
                        { key: "contractWpsCompare", ar: "مراجعة عقود الكادر وقيمة الحسمية", en: "Audit Qiwa agreements" },
                        { key: "realtimeScore", ar: "استخراج تقرير الامتثال الفوري", en: "Generate Live Compliance Affidavits" }
                      ].map((item) => {
                        const checked = (inspectorChecklist as any)[item.key];
                        return (
                          <button
                            key={item.key}
                            onClick={() => setInspectorChecklist(p => ({ ...p, [item.key]: !checked }))}
                            className="w-full flex items-center justify-between text-[10px] text-gray-400 hover:text-white leading-normal cursor-pointer text-right p-1 rounded hover:bg-white/5"
                          >
                            <span className={checked ? "line-through text-emerald-400" : ""}>
                              {isAr ? item.ar : item.en}
                            </span>
                            <CheckCircle2 className={`w-3.5 h-3.5 ${checked ? "text-emerald-400 fill-emerald-500/10" : "text-gray-700"}`} />
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-gray-400">
                      <span>{isAr ? "معدل الإنجاز السيادي:" : "Compliance Completed:"}</span>
                      <span className="text-[#D4AF37] font-bold">
                        {Math.round((() => {
                          const list = guideType === "founder" ? founderChecklist :
                                       guideType === "compliance" ? complianceChecklist :
                                       guideType === "employee" ? employeeChecklist : inspectorChecklist;
                          return (Object.values(list).filter(Boolean).length / 5) * 100;
                        })())}%
                      </span>
                    </div>
                  </div>

                  {/* Search inside currently scoped chapters */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-gray-500" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={isAr ? "ابحث بالدليل التوجيهي..." : "Search guidelines..."}
                      className="w-full bg-[#1c2541] border border-[#D4AF37]/20 rounded-lg py-1.5 pr-8 pl-3 text-[10px] text-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-yellow-500 font-sans text-right placeholder-gray-600"
                    />
                  </div>

                  {/* Scope Chapters list */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                      {isAr ? "فصول الدليل النشط:" : "Active Guide Chapters:"}
                    </span>
                    {(searchTerm ? searchFilteredChapters : activeChapters).map((ch, idx) => {
                      const actualIdx = activeChapters.findIndex(c => c.titleAr === ch.titleAr);
                      return (
                        <button
                          key={actualIdx}
                          onClick={() => setCurrentChapter(actualIdx)}
                          className={`w-full p-2 text-right rounded-lg text-[10px] transition-all flex items-center justify-between cursor-pointer ${
                            safeChapterIndex === actualIdx
                              ? "bg-yellow-500/10 border border-yellow-500/35 text-yellow-400 font-bold"
                              : "text-gray-400 hover:text-white border border-transparent hover:bg-white/5"
                          }`}
                        >
                          <span className="truncate">{isAr ? ch.titleAr : ch.titleEn}</span>
                          <span className="text-[8px] font-mono text-gray-600 shrink-0 ml-1">SEC-{actualIdx + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 text-[9px] text-gray-500 space-y-1 font-mono">
                  <div>LEXOPS SOVEREIGN SHELL</div>
                  <div>DAMMAM BIOMASS CORE // SECURED</div>
                </div>

              </div>

              {/* MAIN RENDER VIEW */}
              <div className="flex-grow p-6 flex flex-col justify-between overflow-y-auto bg-gradient-to-b from-[#020510] via-black to-[#01040d]">
                
                {/* Header inside content */}
                <div className="flex justify-between items-start gap-4 border-b border-white/5 pb-4 mb-4">
                  <div>
                    <span className="text-[9px] font-mono text-yellow-500 font-bold block uppercase tracking-wider">
                      {isAr ? `دليل التوجيه التفاعلي - ${guideType.toUpperCase()}` : `Interactive Action Guide - ${guideType.toUpperCase()}`}
                    </span>
                    <h1 className="text-white text-sm font-black mt-1 font-sans">
                      {isAr ? activeChapterObj.titleAr : activeChapterObj.titleEn}
                    </h1>
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer border border-white/5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub content and simulation widgets */}
                <div className="space-y-6 flex-grow pb-4">
                  
                  {/* Danger Alert box */}
                  {safeChapterIndex === 0 && (
                    <div className="bg-amber-500/[0.03] border border-yellow-500/25 rounded-xl p-3 flex gap-3 text-right">
                      <ShieldAlert className="w-5 h-5 text-yellow-500 shrink-0" />
                      <div className="text-[10px] leading-relaxed text-gray-400">
                        <strong className="text-yellow-500 block">
                          {isAr ? "تحذير امتثال قضائي وتشغيلي:" : "Critical Sovereign Citation Warning:"}
                        </strong>
                        {isAr 
                          ? "إن إشعارات مكاتب العمل و غرامات الأمانات لا تحتمل التهاون. صمم LexOps OS لسد الثغرات القانونية آلياً والاعتماد على الكتل المشفرة للـ C9 Ledger."
                          : "Labor or municipal citations carry immediate frozen assets or license limits. Use LexOps C9 block entries to prove state fact."}
                      </div>
                    </div>
                  )}

                  {/* Core instruction explanation */}
                  <div className="text-xs text-gray-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {isAr ? activeChapterObj.contentAr : activeChapterObj.contentEn}
                  </div>

                  {/* ──────────────────────────────────────────────────────── */}
                  {/* INTERACTIVE COMPLIANCE SANDBOXES BASED ON SELECTED SCENES */}
                  {/* ──────────────────────────────────────────────────────── */}

                  {/* FOUNDER & FINANCIAL INTEGRATIVE TOOLS */}
                  {guideType === "founder" && safeChapterIndex === 1 && (
                    <div className="bg-[#1c2541] border border-yellow-500/10 p-4 rounded-xl space-y-3 font-sans">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                        <strong className="text-white text-[10px] block">
                          ⚡ {isAr ? "محاكي التحقق وتثبيت المعرف الموحد 700" : "Saudi Unified 700 Corporate Sync Widget"}
                        </strong>
                        <span className="text-[8px] font-mono text-yellow-500">interactive sandbox</span>
                      </div>
                      
                      <div className="flex gap-2.5">
                        <input
                          type="text"
                          value={input700}
                          onChange={(e) => setInput700(e.target.value)}
                          placeholder="7001234567"
                          className="flex-grow bg-[#1c2541] border border-white/10 rounded-md py-1 px-2.5 text-xs text-yellow-400 font-mono focus:outline-none text-right"
                        />
                        <button
                          onClick={handleValidate700}
                          className="bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-[10px] px-3.5 py-1.5 rounded transition cursor-pointer"
                        >
                          {isAr ? "تحقق ومطابقة القيد" : "Validate ID"}
                        </button>
                      </div>

                      {validation700Result && (
                        <div className={`p-2.5 rounded-lg text-[10px] leading-relaxed ${
                          validation700Result.valid ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400" : "bg-red-500/10 border border-red-500/25 text-red-400"
                        }`}>
                          <div>{validation700Result.msg}</div>
                          {validation700Result.c9Hash && (
                            <div className="font-mono text-[9px] mt-1 text-gray-400">
                              C9-ANCHOR-HASH: {validation700Result.c9Hash}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {guideType === "founder" && safeChapterIndex === 4 && (
                    <div className="bg-[#1c2541] border border-yellow-500/10 p-4 rounded-xl space-y-3 font-sans">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                        <strong className="text-white text-[10px] block">
                          ⚡ {isAr ? "معالج تسوية الأجور والوقاية WPS" : "Wage Protection (WPS) Automated Balancing Tool"}
                        </strong>
                        <span className="text-[8px] font-mono text-yellow-500">interactive sandbox</span>
                      </div>

                      {wpsConflictState === "unresolved" && (
                        <div className="space-y-3">
                          <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2.5 flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                              <div className="text-right">
                                <span className="text-red-400 font-bold block">{isAr ? "تفاوت رواتب مسيرات شهري" : "WPS Shortage Deviation Detected"}</span>
                                <span className="text-gray-500 block text-[9px]">{isAr ? "الفرع: الدمام - الكادر: سليمان الخالدي (تفاوت بقيمة 120 ريال)" : "Branch: Dammam - Staff: Suliman (120 SAR Variance)"}</span>
                              </div>
                            </div>
                            <span className="text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded text-[8px] font-mono">WPS DEV BLOCK</span>
                          </div>
                          
                          <button
                            onClick={handleSettleWpsConflicts}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10.5px] py-2 rounded transition cursor-pointer text-center"
                          >
                            {isAr ? "تسوية التعارضات التلقائية وإيداع السند" : "Compute Core WPS Adjustments & Wire"}
                          </button>
                        </div>
                      )}

                      {wpsConflictState === "resolving" && (
                        <div className="text-center py-4 space-y-2 select-none">
                          <div className="animate-spin w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto" />
                          <span className="text-yellow-500 text-[10px] block font-mono">ALIGNING BANK WPS METRICS & SEALING...</span>
                        </div>
                      )}

                      {wpsConflictState === "resolved" && (
                        <div className="space-y-2.5 animate-fade-in text-right">
                          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg text-[10px] leading-relaxed">
                            <strong>✓ {isAr ? "تمت تسوية فروقات الأجور المعتمدة!" : "WPS reconciliation successful!"}</strong>
                            <p className="text-[9.5px] text-gray-400 mt-1">
                              {isAr 
                                ? "تم الكشف التلقائي وفك التعميم، وتدوين شهادة الصرف بخامتنا السيادية C9 Ledger بنجاح." 
                                : "Adjusted wage computed, bank file aligned, has been locked to live C9 audit trails."}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setPdfProgress(true);
                                setTimeout(() => setPdfProgress(false), 1500);
                              }}
                              className="flex-grow bg-white/5 hover:bg-white/10 border border-white/10 text-[#D4AF37] font-bold text-[10px] py-1.5 rounded transition cursor-pointer text-center"
                            >
                              {pdfProgress ? (isAr ? "جاري تصدير السند..." : "Exporting Affidavit...") : (isAr ? "طباعة السند التنفيذي" : "Print Compliance Deed")}
                            </button>
                            <button
                              onClick={() => setWpsConflictState("unresolved")}
                              className="bg-[#1c2541] hover:bg-slate-900 border border-white/5 text-gray-500 p-1.5 rounded transition cursor-pointer text-center"
                            >
                              Restart
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ⚖️ COMPLIANCE & LEGAL EMULATOR */}
                  {guideType === "compliance" && safeChapterIndex === 2 && (
                    <div className="bg-[#1c2541] border border-yellow-500/10 p-4 rounded-xl space-y-3 font-sans">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                        <strong className="text-white text-[10px] block">
                          ⚡ {isAr ? "محاكي مولد الاعتراضات القضائية LEXI AI" : "LEXI AI Courtroom-Ready objection assembler"}
                        </strong>
                        <span className="text-[8px] font-mono text-yellow-500">interactive sandbox</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { key: "wps_gap", ar: "تفاوت حماية الأجور (WPS)", en: "Wage Mismatch Objection" },
                          { key: "gps_deviation", ar: "تجاوز حضور GPS الفوري", en: "GPS Drift Verification" },
                          { key: "balady_filter", ar: "مخالفة فلتر البلدية", en: "Municipal Filter Compliance" },
                        ].map((badge) => (
                          <button
                            key={badge.key}
                            onClick={() => setLexiTargetViolation(badge.key)}
                            className={`p-2 rounded border text-[9.5px] transition text-center cursor-pointer ${
                              lexiTargetViolation === badge.key
                                ? "bg-yellow-500/15 border-yellow-500 text-yellow-400 font-bold"
                                : "bg-[#1c2541] border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
                            }`}
                          >
                            {isAr ? badge.ar : badge.en}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleGenerateLexiSandbox}
                        disabled={lexiGenerating}
                        className="w-full bg-[#0a1a3a] hover:bg-[#0c2a5c] border border-blue-500/30 text-blue-300 font-bold text-[10.5px] py-1.5 rounded transition cursor-pointer text-center"
                      >
                        {lexiGenerating ? (isAr ? "جاري صياغة مذكرات الدفع الـقضائي..." : "LEXI assembling legal defense...") : (isAr ? "صياغة عريضة الاعتراض بـ LEXI AI" : "Generate Certified Objection Letter")}
                      </button>

                      {lexiResult && (
                        <div className="bg-[#1c2541] p-3.5 rounded-lg border border-white/5 space-y-2 leading-relaxed animate-fade-in font-sans text-[11px] text-gray-200 text-right">
                          <div className="flex justify-between items-center text-[8px] font-mono text-gray-500 border-b border-white/5 pb-1">
                            <span>LEXI HIGH-TRUST OUTPUT</span>
                            <span>C9 LEDGER SECURED</span>
                          </div>
                          <p className="whitespace-pre-line leading-relaxed">
                            {lexiResult}
                          </p>
                          <div className="pt-2 border-t border-white/5 flex justify-end gap-1.5">
                            <span className="text-[8.5px] font-mono text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-300/10 animate-pulse">
                              HMAC-SHA256 SECURED CERTIFICATE
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 👤 EMPLOYEE GEOFENCE MATCH TOOL */}
                  {guideType === "employee" && safeChapterIndex === 1 && (
                    <div className="bg-[#1c2541] border border-yellow-500/10 p-4 rounded-xl space-y-3 font-sans text-right">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                        <strong className="text-white text-[10px] block">
                          ⚡ {isAr ? "محاكي قياس المسافة وتحقق الجيوفينس (100م)" : "Live GPS geofence buffer matcher"}
                        </strong>
                        <span className="text-[8px] font-mono text-yellow-500">interactive sandbox</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>{isAr ? "المسافة الحالية عن مركز العمل:" : "Distance from building coordinates:"}</span>
                          <span className="text-yellow-500 font-mono font-bold">{geoDistance} {isAr ? "متر" : "meters"}</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="250"
                          value={geoDistance}
                          onChange={(e) => setGeoDistance(Number(e.target.value))}
                          className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                      </div>

                      <button
                        onClick={handleRunEmployeeGeofenceCheck}
                        className="w-full bg-[#05162e] hover:bg-[#092954] border border-blue-500/30 text-blue-300 font-bold text-[10px] py-1.5 rounded transition cursor-pointer text-center"
                      >
                        {isAr ? "تأصيل البصمة ومطابقة السياج" : "Simulate Geofenced Clock-in"}
                      </button>

                      {geoStatusResult && (
                        <div className={`p-2.5 rounded-lg text-[10px] leading-relaxed ${
                          geoStatusResult.allowed ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400" : "bg-red-500/10 border border-red-500/25 text-red-400"
                        }`}>
                          <div>{isAr ? geoStatusResult.msgAr : geoStatusResult.msgEn}</div>
                          {geoStatusResult.c9Lock && (
                            <div className="font-mono text-[9px] mt-1 text-gray-500">
                              C9-TRANSACTION: {geoStatusResult.c9Lock}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 🔍 INSPECTOR HASH RECONSTRUCT TOOL */}
                  {guideType === "inspector" && safeChapterIndex === 1 && (
                    <div className="bg-[#1c2541] border border-yellow-500/10 p-4 rounded-xl space-y-3 font-sans">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                        <strong className="text-white text-[10px] block">
                          ⚡ {isAr ? "محاكي تفكيك و فحص توقيع HMAC-SHA256" : "C9 Cryptographic Signature Decoder"}
                        </strong>
                        <span className="text-[8px] font-mono text-yellow-500">interactive sandbox</span>
                      </div>

                      <div className="flex gap-2.5">
                        <input
                          type="text"
                          value={inspectTargetHash}
                          onChange={(e) => setInspectTargetHash(e.target.value)}
                          placeholder="C9-..."
                          className="flex-grow bg-[#1c2541] border border-white/10 rounded-md py-1 px-2.5 text-xs text-yellow-400 font-mono focus:outline-none text-right"
                        />
                        <button
                          onClick={handleInspectHash}
                          className="bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-[10px] px-3.5 py-1.5 rounded transition cursor-pointer"
                        >
                          {isAr ? "تشغيل التدقيق المشفر" : "Decode C9 Seal"}
                        </button>
                      </div>

                      {inspectResult && (
                        <div className="bg-[#1c2541] p-3 rounded-lg border border-white/5 space-y-1.5 text-[10px] text-gray-300 font-sans text-right leading-loose">
                          <div className="text-emerald-400 font-bold flex items-center justify-between">
                            <span>{isAr ? "✓ توقيع رقمي أصيل وسند صالح" : "✓ Active Verified SADE Record"}</span>
                            <span className="text-[8px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.2 rounded font-mono">AUTHENTIC INTEGRITY</span>
                          </div>
                          <div><strong>{isAr ? "نوع السند:" : "Event Description:"}</strong> {isAr ? inspectResult.titleAr : inspectResult.titleEn}</div>
                          <div><strong>{isAr ? "وقت التسجيل في C9 Ledger:" : "Timestamp Locked:"}</strong> <span className="font-mono text-gray-400">{inspectResult.timestamp}</span></div>
                          <div><strong>{isAr ? "الجهة المنفذة للختم:" : "Authorized Sovereign Node:"}</strong> {inspectResult.operator}</div>
                          <div><strong>{isAr ? "مستوى الامتثال الكلي للمنشأة:" : "Total Compliance Score:"}</strong> <span className="text-yellow-400 font-bold">{inspectResult.complianceScore}</span></div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FOOTER DIRECT LINKS FOR ROAD NAVIGATION */}
                  <div className="bg-gradient-to-l from-black to-[#05070f] border border-white/5 p-4 rounded-xl space-y-3 text-right">
                    <strong className="text-yellow-500/95 text-[10px] block font-sans">
                      🧭 {isAr ? "روابط الخريطة التفاعلية والتحكم السريع" : "Quick Navigator Links"}
                    </strong>
                    <p className="text-[10px] text-gray-500 leading-normal">
                      {isAr 
                        ? "اضغط الروابط للاختصار والانتقال المباشر لأجهزة وواجهات نظام التشغيل السيادي المعني بالامتثال:" 
                        : "Use any shortcut below to navigate to respective dashboard tools directly:"}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
                      {[
                        { tab: "compliance", labelAr: "محرك الامتثال", labelEn: "WPS Engine" },
                        { tab: "sade", labelAr: "محرك SADE", labelEn: "SADE Engine" },
                        { tab: "violations", labelAr: "لوحة المخالفات", labelEn: "Citations" },
                        { tab: "c9ledger", labelAr: "الـ C9 Ledger", labelEn: "C9 Ledger" },
                      ].map((btn) => (
                        <button
                          key={btn.tab}
                          onClick={() => {
                            setActiveTab(btn.tab);
                            setIsOpen(false);
                          }}
                          className="bg-[#050c1f] hover:bg-[#07163c] border border-white/5 py-2 px-2.5 rounded-lg text-[10.5px] text-gray-300 hover:text-white font-bold transition flex items-center justify-between cursor-pointer"
                        >
                          <span>{isAr ? btn.labelAr : btn.labelEn}</span>
                          <ExternalLink className="w-3 text-yellow-500/70" />
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Confirm footer controls */}
                <div className="mt-5 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => currentChapter > 0 && setCurrentChapter(currentChapter - 1)}
                      disabled={currentChapter === 0}
                      className="px-3.5 py-1.5 rounded-lg bg-white/5 disabled:opacity-40 text-gray-400 hover:text-white text-[10px] hover:bg-white/10 transition cursor-pointer select-none leading-none border border-white/5"
                    >
                      {isAr ? "الفصل السابق" : "Previous"}
                    </button>
                    
                    <button
                      onClick={() => currentChapter < activeChapters.length - 1 && setCurrentChapter(currentChapter + 1)}
                      disabled={currentChapter === activeChapters.length - 1}
                      className="px-3.5 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-[10px] transition cursor-pointer select-none leading-none"
                    >
                      {isAr ? "الفصل التالي" : "Next Chapter"}
                    </button>
                  </div>

                  <button
                    onClick={markGuideAsRead}
                    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-extrabold text-[11px] hover:from-amber-500 hover:to-yellow-400 transition cursor-pointer select-none leading-relaxed text-center shadow-lg hover:shadow-yellow-500/10"
                  >
                    {isAr ? "مصدق ومثبت: تفعيل المنصة الذكية السيادية" : "Sovereign Acknowledged & Resolved"}
                  </button>
                </div>

              </div>

            </motion.div>
  );

  if (isInline) {
    return (
      <div className="w-full h-full p-1 animate-fade-in text-right">
        {mainLayout}
      </div>
    );
  }

  // Strictly hidden when not rendered inline inside the sidebar menu
  return null;
}
