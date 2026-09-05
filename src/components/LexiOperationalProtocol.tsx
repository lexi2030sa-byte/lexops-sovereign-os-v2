import React, { useState } from "react";
import {
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Database,
  Layers,
  AlertTriangle,
  Zap,
  Play,
  RotateCcw,
  CheckCircle,
  FileCode,
  Lock,
  Compass,
  FileCheck,
  Scale,
  GitCommit,
  Fingerprint,
  FileText,
  Calendar,
  Eye,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  Award,
  Activity,
  BookOpen
} from "lucide-react";
import SovereignAutoDocumentationEngine from "./SovereignAutoDocumentationEngine";

interface LexiOperationalProtocolProps {
  lang?: "ar" | "en";
  pushNewC9Event?: (type: string, refId: string, payload: any) => Promise<void> | void;
  c9Events?: any[];
}

export default function LexiOperationalProtocol({ lang = "ar", pushNewC9Event, c9Events = [] }: LexiOperationalProtocolProps) {
  const isAr = lang === "ar";
  const [activeTab, setActiveTab] = useState<number>(0);

  // Tab Definitions (27 Sovereign Protocols)
  const tabs = [
    { id: 0, title: isAr ? "1. الدمج التشغيلي" : "1. Operational Integration", category: "core" },
    { id: 1, title: isAr ? "2. اليقين الاستدلالي" : "2. Inferential Certainty", category: "core" },
    { id: 2, title: isAr ? "3. التحقق المتقاطع" : "3. Cross-Inference", category: "core" },
    { id: 3, title: isAr ? "4. كشف التلاعب" : "4. Tampering Detection", category: "core" },
    { id: 4, title: isAr ? "5. المنطق أولاً" : "5. JSON Logic", category: "core" },
    { id: 5, title: isAr ? "6. الفلتر الملكي 11438" : "6. Royal Filter 11438", category: "compliance" },
    { id: 6, title: isAr ? "7. المسارات الثلاثة" : "7. Three-Path Consensus", category: "compliance" },
    { id: 7, title: isAr ? "8. الختم الرقمي C9" : "8. C9 Immutable Sealing", category: "compliance" },
    { id: 8, title: isAr ? "9. التنفيذ السيادي" : "9. Sovereign Execution", category: "compliance" },
    { id: 9, title: isAr ? "10. إدارة المخالفات" : "10. Violations Logic", category: "compliance" },
    { id: 10, title: isAr ? "11. إنهاء الخدمة" : "11. End of Service", category: "ops" },
    { id: 11, title: isAr ? "12. الرواتب والسياسات" : "12. Salaries & Policies", category: "ops" },
    { id: 12, title: isAr ? "13. الترقيات والتنقلات" : "13. Promotions & Transfers", category: "ops" },
    { id: 13, title: isAr ? "14. الروابط السيادية" : "14. Sovereign Links", category: "system" },
    { id: 14, title: isAr ? "15. الدستور التشغيلي" : "15. Sovereign Map", category: "system" },
    { id: 15, title: isAr ? "16. إدارة الحضور والغياب" : "16. Attendance Management", category: "ops" },
    { id: 16, title: isAr ? "17. السلوكيات المهنية" : "17. Professional Behaviors", category: "compliance" },
    { id: 17, title: isAr ? "18. الأداء والتقييم السنوي" : "18. Performance Evaluation", category: "ops" },
    { id: 18, title: isAr ? "19. إدارة العقود" : "19. Contracts Management", category: "compliance" },
    { id: 19, title: isAr ? "20. الامتثال النظامي" : "20. Regulatory Compliance", category: "system" },
    { id: 20, title: isAr ? "21. إدارة التحقيقات" : "21. Investigations Management", category: "compliance" },
    { id: 21, title: isAr ? "22. تحليل الصور والمستندات" : "22. Image Analysis Logic", category: "core" },
    { id: 22, title: isAr ? "23. المخاطر التشغيلية" : "23. Operational Risks", category: "ops" },
    { id: 23, title: isAr ? "24. الإشعارات السيادية" : "24. Sovereign Notifications", category: "system" },
    { id: 24, title: isAr ? "25. الوحدات الـ 14" : "25. 14 Sovereign Units", category: "system" },
    { id: 25, title: isAr ? "26. المبادئ السيادية" : "26. Sovereign Principles", category: "system" },
    { id: 26, title: isAr ? "27. الخريطة السيادية" : "27. Sovereign Operational Map", category: "system" },
    { id: 27, title: isAr ? "28. محرك التوثيق الذاتي (SADE)" : "28. Auto-Documentation (SADE)", category: "system" }
  ];

  // Helper categorized labels
  const categories = {
    core: isAr ? "الأركان والاستدلال" : "Core Inference",
    compliance: isAr ? "الرقابة والامتثال" : "Compliance Rules",
    ops: isAr ? "الوحدات التشغيلية" : "Operational Units",
    system: isAr ? "البنية السيادية الموحدة" : "Unified Sovereign Grid"
  };

  // Protocols State managers
  // P1: Operational Integration
  const [p1EventLog, setP1EventLog] = useState<Array<{ time: string; event: string; status: string; c9Hash: string }>>([
    { time: "12:04:12", event: isAr ? "تأصيل عقد موظف: فرع الرياض" : "Origin employee contract: Riyadh branch", status: isAr ? "تم الربط والدمج" : "Merged & Synced", c9Hash: "C9-ACT-338B" }
  ]);
  const p1Databases = [
    { name: isAr ? "قاعدة بيانات الموظفين" : "Employee Directory", status: "دمج مباشر" },
    { name: isAr ? "الحضور والانصراف" : "Attendance Tracker", status: "دمج مباشر" },
    { name: isAr ? "سجل الرواتب والسياسات" : "Payroll ledger", status: "دمج مباشر" },
    { name: isAr ? "السجل السيادي الموحد C9" : "C9 sovereign record", status: "دمج مباشر" }
  ];

  // P2: Inferential Certainty
  const [p2CertaintyScore, setP2CertaintyScore] = useState<number>(85);
  const [p2InputCase, setP2InputCase] = useState<string>(isAr ? "تحذير الأرصاد وبلاغات المطر الكثيف بالرياض" : "Riyadh Met department severe weather report");

  // P3: Cross-Inference
  const [p3Check1, setP3Check1] = useState(true);
  const [p3Check2, setP3Check2] = useState(true);
  const [p3Check3, setP3Check3] = useState(false);

  // P4: Tampering Detection
  const [p4Alerts, setP4Alerts] = useState<Array<{ id: string; type: string; description: string }>>([]);
  const [isP4Tilted, setIsP4Tilted] = useState(false);

  // P5: JSON Logic
  const [selectedLaw, setSelectedLaw] = useState(0);
  const legislativeSources = [
    {
      source: isAr ? "نظام العمل السعودي - مادة 38" : "Saudi Labor Law - Article 38",
      rule: { and: [{ "==": [{ var: "has_work_cert" }, true] }, { ">": [{ var: "probation_days" }, 90] }] },
      outcome: isAr ? "مباشرة عمل بصفة دائمة" : "Authorize permanent staff status"
    },
    {
      source: isAr ? "لائحة الجزاءات البلدية - مادة 15" : "Municipal Fines - Article 15",
      rule: { or: [{ "==": [{ var: "food_safety_compliant" }, false] }, { "==": [{ var: "valid_doc" }, false] }] },
      outcome: isAr ? "تسجيل مخالفة درجة ثانية ومخاطرة فورية" : "Issue second grade fine & dispatch audit team"
    }
  ];

  // P6: Royal Filter 11438
  const [p6ViolationSeverity, setP6ViolationSeverity] = useState<"grave" | "non-grave">("non-grave");
  const [p6Name, setP6Name] = useState(isAr ? "تجاوز طفيف في حد رخصة التجهيزات الغذائية" : "Minor food accessory licensing delay");

  // P7: Three-Path Consensus
  const [p7PathText, setP7PathText] = useState(true);
  const [p7PathProcedure, setP7PathProcedure] = useState(true);
  const [p7PathPhysical, setP7PathPhysical] = useState(true);

  // P8: C9 Digital Sealing
  const [p8DocContent, setP8DocContent] = useState<string>(isAr ? "نشرة لغوية وتدقيق عقد موظف الرياض رقم 4492" : "Validation log of Riyadh Employee Contract #4492");
  const [p8GeneratedSeal, setP8GeneratedSeal] = useState<string>("");
  const [p8SealedAt, setP8SealedAt] = useState<string>("");

  // P9: Sovereign Execution
  const [p9ActiveStep, setP9ActiveStep] = useState<number>(-1);
  const [p9ExecutionLogs, setP9ExecutionLogs] = useState<string[]>([]);

  // P10: Violations Log state
  const [p10ActionType, setP10ActionType] = useState<string>("register");
  const [p10Severity, setP10Severity] = useState<"grave" | "non-grave">("non-grave");
  const [p10PriorWarnings, setP10PriorWarnings] = useState<number>(0);
  const [p10HasConfession, setP10HasConfession] = useState<boolean>(true);
  const [p10IsInvestigationDone, setP10IsInvestigationDone] = useState<boolean>(true);
  const [p10EvidenceLevel, setP10EvidenceLevel] = useState<number>(90);
  const [violationReport, setViolationReport] = useState<any | null>(null);

  // P11: End Of Service state
  const [p11YearsOfService, setP11YearsOfService] = useState<number>(3);
  const [p11MonthlySalary, setP11MonthlySalary] = useState<number>(8000);
  const [p11Reason, setP11Reason] = useState<string>("resignation"); // resignation, article_80, article_81, end_of_contract, force_majeure, company_termination
  const [p11IsNotified, setP11IsNotified] = useState<boolean>(true);
  const [p11IsDocumented, setP11IsDocumented] = useState<boolean>(true);
  const [p11Report, setP11Report] = useState<any | null>(null);

  // P12: Salaries & Policies state
  const [p12HasSovereignId, setP12HasSovereignId] = useState<boolean>(true);
  const [p12BasicSalary, setP12BasicSalary] = useState<number>(10000);
  const [p12DeductionAmount, setP12DeductionAmount] = useState<number>(1200);
  const [p12IsLinkedToViolation, setP12IsLinkedToViolation] = useState<boolean>(true);
  const [p12HasPriorInvestigation, setP12HasPriorInvestigation] = useState<boolean>(true);
  const [p12IsEmployeeNotified, setP12IsEmployeeNotified] = useState<boolean>(true);
  const [p12AuditResult, setP12AuditResult] = useState<any | null>(null);

  // P13: Promotions & Transfers state
  const [p13HasSovereignId, setP13HasSovereignId] = useState<boolean>(true);
  const [p13SelectedCandidate, setP13SelectedCandidate] = useState<number>(0);
  const [p13ActionType, setP13ActionType] = useState<string>("promotion"); // promotion, transfer
  const [p13NewSalary, setP13NewSalary] = useState<number>(12000);
  const [p13EligibilityResult, setP13EligibilityResult] = useState<any | null>(null);

  const p13Candidates = [
    { name: isAr ? "أحمد المطيري" : "Ahmed Al-Mutairi", currentRole: isAr ? "أخصائي عمليات" : "Operations Specialist", grade: "G5", tenure: 4, complianceScore: 99, violationCount: 0, reviews: 94 },
    { name: isAr ? "سارة الرويلي" : "Sarah Al-Rowaily", currentRole: isAr ? "محاسبة مبتدئة" : "Junior Accountant", grade: "G4", tenure: 1.5, complianceScore: 92, violationCount: 1, reviews: 88 },
    { name: isAr ? "بندر الدوسري" : "Bandar Al-Dawsari", currentRole: isAr ? "فني لوجستي" : "Logistics Technician", grade: "G3", tenure: 6, complianceScore: 78, violationCount: 3, reviews: 74 }
  ];

  // P14: Sovereign Links
  const [p14SelectedNode, setP14SelectedNode] = useState<string>("C9");

  // P16: Attendance Management Logic
  const [p16HasSovereignId, setP16HasSovereignId] = useState<boolean>(true);
  const [p16ActionType, setP16ActionType] = useState<string>("check_in");
  const [p16EmployeeName, setP16EmployeeName] = useState<string>("سلمان الحارثي");
  const [p16HoursWorked, setP16HoursWorked] = useState<number>(8);
  const [p16OvertimeHours, setP16OvertimeHours] = useState<number>(2);
  const [p16AbsenceDays, setP16AbsenceDays] = useState<number>(0);
  const [p16DelayMinutes, setP16DelayMinutes] = useState<number>(15);
  const [p16Reason, setP16Reason] = useState<string>("excused");
  const [p16CertaintyScore, setP16CertaintyScore] = useState<number>(85);
  const [p16Result, setP16Result] = useState<any | null>(null);

  // P17: Professional Behaviors Management Logic
  const [p17HasSovereignId, setP17HasSovereignId] = useState<boolean>(true);
  const [p17ActionType, setP17ActionType] = useState<string>("positive");
  const [p17BehaviorScale, setP17BehaviorScale] = useState<"positive_reward" | "simple_warning" | "grave_violation">("positive_reward");
  const [p17BehaviorDescription, setP17BehaviorDescription] = useState<string>(isAr ? "المبادرة في تقديم حلول مبتكرة للعملاء وتطوير نظام العمل" : "Proactive customer problem solving initiative & process automation");
  const [p17PathText, setP17PathText] = useState<boolean>(true);
  const [p17PathProcedure, setP17PathProcedure] = useState<boolean>(true);
  const [p17PathPhysical, setP17PathPhysical] = useState<boolean>(true);
  const [p17Result, setP17Result] = useState<any | null>(null);

  // P18: Performance & Annual Evaluation Logic
  const [p18HasSovereignId, setP18HasSovereignId] = useState<boolean>(true);
  const [p18ActionType, setP18ActionType] = useState<string>("create");
  const [p18Productivity, setP18Productivity] = useState<number>(85);
  const [p18Commitment, setP18Commitment] = useState<number>(90);
  const [p18Quality, setP18Quality] = useState<number>(80);
  const [p18Cooperation, setP18Cooperation] = useState<number>(85);
  const [p18PolicyCompliance, setP18PolicyCompliance] = useState<number>(95);
  const [p18GoalAchievement, setP18GoalAchievement] = useState<number>(80);
  const [p18CertaintyScore, setP18CertaintyScore] = useState<number>(85);
  const [p18Result, setP18Result] = useState<any | null>(null);

  // P19: Contracts Management Logic
  const [p19HasSovereignId, setP19HasSovereignId] = useState<boolean>(true);
  const [p19ActionType, setP19ActionType] = useState<string>("verify");
  const [p19ContractWritten, setP19ContractWritten] = useState<boolean>(true);
  const [p19HasAllClausules, setP19HasAllClausules] = useState<boolean>(true);
  const [p19SalaryClear, setP19SalaryClear] = useState<boolean>(true);
  const [p19HoursDefined, setP19HoursDefined] = useState<boolean>(true);
  const [p19VacationDefined, setP19VacationDefined] = useState<boolean>(true);
  const [p19IsSigned, setP19IsSigned] = useState<boolean>(true);
  const [p19IsRegisteredC9, setP19IsRegisteredC9] = useState<boolean>(true);
  const [p19CertaintyScore, setP19CertaintyScore] = useState<number>(85);
  const [p19Result, setP19Result] = useState<any | null>(null);

  // P20: Regulatory Compliance Logic
  const [p20HasSovereignId, setP20HasSovereignId] = useState<boolean>(true);
  const [p20ActionType, setP20ActionType] = useState<string>("review_firm");
  const [p20WpsActive, setP20WpsActive] = useState<boolean>(true);
  const [p20HasWrittenContracts, setP20HasWrittenContracts] = useState<boolean>(true);
  const [p20HoursInsideLimits, setP20HoursInsideLimits] = useState<boolean>(true);
  const [p20GosiRegistered, setP20GosiRegistered] = useState<boolean>(true);
  const [p20SafeEnv, setP20SafeEnv] = useState<boolean>(true);
  const [p20InvestigationBeforeDeduction, setP20InvestigationBeforeDeduction] = useState<boolean>(true);
  const [p20PathText, setP20PathText] = useState<boolean>(true);
  const [p20PathProcedure, setP20PathProcedure] = useState<boolean>(true);
  const [p20PathPhysical, setP20PathPhysical] = useState<boolean>(true);
  const [p20Result, setP20Result] = useState<any | null>(null);

  // P21: Investigations Management Logic
  const [p21HasSovereignId, setP21HasSovereignId] = useState<boolean>(true);
  const [p21InstructionText, setP21InstructionText] = useState<string>(isAr ? "التحقيق في تسريب بيانات فرع الملز ومخالفة إفشاء الأسرار" : "Investigation regarding confidential data leakage at Al-Malaz branch");
  const [p21EvidencePhotos, setP21EvidencePhotos] = useState<boolean>(true);
  const [p21EvidenceDocs, setP21EvidenceDocs] = useState<boolean>(true);
  const [p21EvidenceC9Logs, setP21EvidenceC9Logs] = useState<boolean>(true);
  const [p21EvidenceSignatures, setP21EvidenceSignatures] = useState<boolean>(true);
  const [p21InterrogateParties, setP21InterrogateParties] = useState<boolean>(true);
  const [p21BehaviorScore, setP21BehaviorScore] = useState<number>(85);
  const [p21LawArticle, setP21LawArticle] = useState<string>("article_80");
  const [p21CertaintyScore, setP21CertaintyScore] = useState<number>(85);
  const [p21PathText, setP21PathText] = useState<boolean>(true);
  const [p21PathProcedure, setP21PathProcedure] = useState<boolean>(true);
  const [p21PathPhysical, setP21PathPhysical] = useState<boolean>(true);
  const [p21Result, setP21Result] = useState<any | null>(null);

  // P22: Image Analysis Logic
  const [p22HasSovereignId, setP22HasSovereignId] = useState<boolean>(true);
  const [p22ImageName, setP22ImageName] = useState<string>("injury_report_r12.jpg");
  const [p22Format, setP22Format] = useState<string>("JPG");
  const [p22MetadataHealthy, setP22MetadataHealthy] = useState<boolean>(true);
  const [p22OriginalVerified, setP22OriginalVerified] = useState<boolean>(true);
  const [p22GeoMatch, setP22GeoMatch] = useState<boolean>(true);
  const [p22CertaintyScore, setP22CertaintyScore] = useState<number>(85);
  const [p22Result, setP22Result] = useState<any | null>(null);

  // P23: Operational Risks Management Logic
  const [p23HasSovereignId, setP23HasSovereignId] = useState<boolean>(true);
  const [p23ActionType, setP23ActionType] = useState<string>("new_assess"); // new_assess, review_current, mitigation, log_incident
  const [p23RiskCategory, setP23RiskCategory] = useState<string>("compliance"); // compliance, personnel, procedural, technical
  const [p23GraveEventsCount, setP23GraveEventsCount] = useState<number>(0);
  const [p23WpsScore, setP23WpsScore] = useState<number>(95);
  const [p23CertaintyScore, setP23CertaintyScore] = useState<number>(85);
  const [p23Result, setP23Result] = useState<any | null>(null);

  // P24: Sovereign Notifications Logic
  const [p24CertaintyTriggerActive, setP24CertaintyTriggerActive] = useState<boolean>(true);
  const [p24SpoofTriggerActive, setP24SpoofTriggerActive] = useState<boolean>(true);
  const [p24InfractionTriggerActive, setP24InfractionTriggerActive] = useState<boolean>(true);
  const [p24RoyalGraceTriggerActive, setP24RoyalGraceTriggerActive] = useState<boolean>(true);
  const [p24IncidentTriggerActive, setP24IncidentTriggerActive] = useState<boolean>(true);
  const [p24Notifications, setP24Notifications] = useState<Array<{ id: string; type: string; trigger: string; score: number; content: string; ts: string }>>([
    {
      id: "SOV-NTF-01A",
      type: isAr ? "تحذير الفلتر الملكي 11438" : "Royal Filter 11438 Grace Alert",
      trigger: isAr ? "انتهاء مهلة التصحيح للإنذار غير الجسيم" : "3-Days Correction Grace Period Issued",
      score: 95,
      content: isAr ? "الموظف سلمان الحارثي: تم إصدار مهلة 3 أيام لتسوية التأخر المسجل." : "Employee Salman Al-Harthi: Offered 3 days correction grace window.",
      ts: "2026-06-11 02:12:00"
    }
  ]);

  const [p25SelectedUnit, setP25SelectedUnit] = useState<number>(0);
  const [p27SelectedStage, setP27SelectedStage] = useState<string>("operational");

  const handleP24TriggerEventSim = () => {
    const alertsList = isAr ? [
      {
        type: "التحليل المتقاطع المالي",
        trigger: "فجوة سداد WPS للرواتب",
        content: "رصد خلل في مطابقة البيانات البنكية وقيد WPS لـ 3 موظفين بفرع الملز."
      },
      {
        type: "كشف التلاعب الجغرافي",
        trigger: "انتحال البصمة الرقمية",
        content: "تم رفض البصمة لارتفاع التباين الجغرافي من جهاز غير معتمد بفرع جدة."
      },
      {
        type: "إنذار الفلتر الملكي 11438",
        trigger: "الإنذار السلوكي غير الجسيم",
        content: "الموظف بندر الدوسري: تفعيل مهلة 3 أيام تصحيحية نظامية قبل اعتماد الحسم."
      }
    ] : [
      {
        type: "WPS Payroll Audit Alert",
        trigger: "Discrepancy in WPS Settlement",
        content: "Discovered variant payroll matches across 3 active profiles at Al-Malaz branch."
      },
      {
        type: "Biometric Spoofing Detection",
        trigger: "Identity verification failure",
        content: "Bypassed unauthorized mobile device signature attempting check-in."
      },
      {
        type: "Royal Filter 11438 Warning",
        trigger: "Minor disciplinary infraction detected",
        content: "Employee Bandar Al-Dawsari: Activated 3-day royal warning correction grace."
      }
    ];

    const randomAlert = alertsList[0];
    const timeNow = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const notificationId = Date.now().toString();

    setP24Notifications(prev => [
      {
        id: notificationId,
        type: randomAlert.type,
        trigger: randomAlert.trigger,
        score: 99,
        content: randomAlert.content,
        ts: timeNow
      },
      ...prev
    ].slice(0, 6));
  };

  // P21 Evaluator
  const handleP21EvaluateInvestigation = () => {
    if (!p21HasSovereignId) {
      setP21Result({
        blocked: true,
        reason: isAr ? "فشل التحقق السيادي المانع: الجلسة غير مرتبطة بهوية سيادية صالحة." : "Sovereign checks failed: Session is not associated with a valid sovereign_user_id."
      });
      return;
    }

    if (p21CertaintyScore < 80) {
      setP21Result({
        blocked: false,
        frozen: true,
        reason: isAr ? "تجميد التحقيق فورياً وتحويله للمراجعة: مستوى اليقين الاستدلالي المطلوب دون عتبة الـ 80%." : "Investigation Frozen and escalated: Certainty score falls below the mandatory 80% threshold."
      });
      return;
    }

    const hasPathConsensus = p21PathText && p21PathProcedure && p21PathPhysical;
    if (!hasPathConsensus) {
      setP21Result({
        blocked: false,
        frozen: true,
        reason: isAr ? "تجميد التحقيق: عدم توافق بروتوكول المسارات الثلاثة للأدلة الرقمية والشهادات العينية." : "Investigation Frozen: Multi-Path consensus mismatch across Textual, Procedural, and Material lanes."
      });
      return;
    }

    let targetArticle = "";
    let regulationAction = "";
    if (p21LawArticle === "article_80") {
      targetArticle = isAr ? "المادة 80 من نظام العمل (إقالة بدون مكافأة في الحالات الجسيمة)" : "Saudi Labor Law Article 80 (Termination without compensation on gross misconduct)";
      regulationAction = isAr ? "إنشاء محضر تحقيق مكتوب تفصيلي مسجل بالبصمة لتوقيع الأطراف لتفادي بطلان الإقالة" : "Generate micro-structured written hearings log signed digitally to safeguard against back-payment claims";
    } else {
      targetArticle = isAr ? "المادة 38 من نظام العمل (الالتزامات العينية والسرية)" : "Saudi Labor Law Article 38 (Employer/Employee structural confidentiality duties)";
      regulationAction = isAr ? "إصدار لفت نظر رسمي مكتوب للموظف بقيد سجل C9 وتنبيه بمهلة 3 أيام للتصحيح" : "Issue documented warning certificate & flag 3-day royal grace window for corrective action";
    }

    const compiledEvidence: string[] = [];
    if (p21EvidencePhotos) compiledEvidence.push(isAr ? "تحليل الصور الرقمية الموثقة" : "Digital Forensics Photos");
    if (p21EvidenceDocs) compiledEvidence.push(isAr ? "مستندات الاتفاق والملفات النصية" : "Contractual Documents");
    if (p21EvidenceC9Logs) compiledEvidence.push(isAr ? "سجلات تسلسل الكود C9" : "C9 Immutable Footprints");
    if (p21EvidenceSignatures) compiledEvidence.push(isAr ? "البصمات الرقمية والمصادقة المزدوجة" : "Two-factor digital signatures");

    const c9Hash = "PENDING_SERVER_SYNC";

    setP21Result({
      blocked: false,
      frozen: false,
      targetArticle,
      regulationAction,
      compiledEvidence,
      c9Hash
    });
  };

  // P22 Evaluator
  const handleP22EvaluateImage = () => {
    if (!p22HasSovereignId) {
      setP22Result({
        blocked: true,
        reason: isAr ? "فشل التحقق السيادي المانع: الجلسة غير مرتبطة بهوية سيادية صالحة." : "Sovereign checks failed: Session is not associated with a valid sovereign_user_id."
      });
      return;
    }

    if (p22CertaintyScore < 80) {
      setP22Result({
        blocked: false,
        frozen: true,
        reason: isAr ? "تم تجميد استخدام الصورة ونقلها للمراجعة البشرية لانخفاض درجة اليقين البصري عن 80%." : "Image usage frozen and escalated to manual review: Optical evidence certainty metric is below 80%."
      });
      return;
    }

    const hasNoSpoof = p22MetadataHealthy && p22OriginalVerified && p22GeoMatch;
    if (!hasNoSpoof) {
      setP22Result({
        blocked: false,
        frozen: true,
        reason: isAr ? "تم رفض وإثارة تضمن الصورة لعلامات تلاعب أو فجوات جغرافية في البيانات الوصفية (Metadata Shift)." : "Rejected: Detected evidence of digital alteration, GPS spoofing, or invalid metadata headers."
      });
      return;
    }

    const extractionResult = {
      ocrTexts: isAr ? "نص مطبوع: إثبات حضور الموظف في نطاق العمل الرسمي بفرع العليا الرياض." : "OCR Decoded Text: Official proof of staff attendance within Al-Olaya branch authorized parameters.",
      facesDetected: 1,
      geoCoordinates: "24.7136° N, 46.6753° E",
      signatureVerified: p22OriginalVerified ? (isAr ? "توقيع سيادي صالح ومطابق" : "Sovereign SHA256 Signature Valid") : (isAr ? "بدون تتبع سيادي" : "No tracing header found")
    };

    const c9Hash = "PENDING_SERVER_SYNC";

    setP22Result({
      blocked: false,
      frozen: false,
      extractionResult,
      c9Hash
    });
  };

  // P23 Evaluator
  const handleP23EvaluateRisk = () => {
    if (!p23HasSovereignId) {
      setP23Result({
        blocked: true,
        reason: isAr ? "فشل التحقق السيادي المانع: الجلسة غير مرتبطة بهوية سيادية صالحة." : "Sovereign checks failed: Session is not associated with a valid sovereign_user_id."
      });
      return;
    }

    if (p23CertaintyScore < 80) {
      setP23Result({
        blocked: false,
        frozen: true,
        reason: isAr ? "تم تجميد تقييمات المخاطر بسبب ضعف شواهد اليقين الاستدلالي المغذي للنظام." : "Risk evaluation frozen: Input certainty metric fails to satisfy 80% benchmark."
      });
      return;
    }

    let riskLevel = "low";
    let mitigationPlan = "";
    let riskDescription = "";

    if (p23RiskCategory === "compliance") {
      riskDescription = isAr ? "تتبع غرامات بلدية أو تأخر في توثيق عقود الكوادر" : "Audit gaps in regulatory filings or delayed contracts formal log";
      if (p23GraveEventsCount > 0 || p23WpsScore < 90) {
        riskLevel = "critical";
        mitigationPlan = isAr ? "تدخل فوري طارئ: فرض عقود موثقة ومطابقة أجر نظام حماية الأجور WPS وتلافي الغرامة البالغة 10,000 ر.س" : "CRITICAL Action needed: Force 100% formal contract registry and adjust WPS payroll files within 24 hours";
      } else if (p23WpsScore < 95) {
        riskLevel = "high";
        mitigationPlan = isAr ? "خطة تصحيح خلال 7 أيام: تسوية رواتب الكوادر والمكافآت وتوثيق التوقيع الرقمي" : "HIGH ALERT Correction plan: Rectify wage delays and commit structural digital signatures within 7 days";
      } else {
        riskLevel = "medium";
        mitigationPlan = isAr ? "مراقبة نظامية: تدقيق ملف الأجر والسياسة الداخلية الربع سنوية" : "MEDIUM Advisory: Audit payroll records and update general handbook metrics quarterly";
      }
    } else if (p23RiskCategory === "personnel") {
      riskDescription = isAr ? "غياب متكرر، انخفاض إنتاجية الموظفين، مخالفات سلوكية بدون تحقيق" : "Chronic attendance delays, low annual reviews, or disciplinary penalties issued without a written hearing";
      if (p23GraveEventsCount >= 2) {
        riskLevel = "critical";
        mitigationPlan = isAr ? "بدء تحقيق رسمي مكتوب مع الأطراف وتجميد قرارات الخصم من الرواتب العشوائية للامتثال للمادة 80" : "Urgent: Trigger formal written compliance investigations & freeze arbitrary wage cuts immediately";
      } else if (p23GraveEventsCount === 1) {
        riskLevel = "high";
        mitigationPlan = isAr ? "توجيه إنذارات مسبقة وتطبيق الفلتر الملكي لتوفير مهلة 3 أيام للموظف" : "Issue pre-sanction warning letters with a 3-day royal corrective grace window";
      } else {
        riskLevel = "low";
        mitigationPlan = isAr ? "إدراج الموظف في برنامج تطوير PIP وإكسابه المعايير التشغيلية" : "Enroll targeted coworkers in performance mitigation plans (PIP)";
      }
    } else {
      riskDescription = isAr ? "مخاطر فنية وإجرائية في دمج السجلات وتناقض توافق المسارات الثلاثة" : "Technical/Structural discrepancies in database syncing or Three-Path verification check variations";
      riskLevel = "medium";
      mitigationPlan = isAr ? "إعادة مطابقة البيانات المادية مع البصمات الجغرافية والمسجلات الرقمية في C9" : "Run global operational audits to realign local databases with secure C9 ledger stamps";
    }

    const c9Hash = "PENDING_SERVER_SYNC";

    setP23Result({
      blocked: false,
      frozen: false,
      riskLevel,
      riskDescription,
      mitigationPlan,
      c9Hash
    });
  };

  // P16 Evaluator
  const handleP16EvaluateAttendance = () => {
    if (!p16HasSovereignId) {
      setP16Result({
        blocked: true,
        reason: isAr ? "فشل التحقق السيادي المانع: الجلسة غير مرتبطة بهوية سيادية صالحة." : "Sovereign checks failed: Session is not associated with a valid sovereign_user_id."
      });
      return;
    }

    if (p16CertaintyScore < 80) {
      setP16Result({
        blocked: false,
        frozen: true,
        reason: isAr ? "تم تجميد العملية وتحويلها إلى المؤسس بسبب انخفاض مستوى اليقين الاستدلالي (أقل من 80%)." : "Process frozen and forwarded to Founder: Inferential certainty score falls below 80%."
      });
      return;
    }

    const c9Hash = "PENDING_SERVER_SYNC";
    let analysisMsg = "";
    if (p16ActionType === "check_in") {
      analysisMsg = isAr ? `تم تسجيل حضور الموظف ${p16EmployeeName} بنجاح ومطابقة البصمة المكانية والجغرافية بطلب المعرف الموحد.` : `Successfully logged check-in for ${p16EmployeeName} with verified GPS coordinates and unified ID.`;
    } else if (p16ActionType === "check_out") {
      analysisMsg = isAr ? `تم تسجيل انصراف الموظف ${p16EmployeeName} واحتساب ساعات العمل الفعلية (${p16HoursWorked} ساعة) بنجاح.` : `Logged check-out for ${p16EmployeeName} successfully. Cumulative hours: ${p16HoursWorked} hrs.`;
    } else if (p16ActionType === "delay") {
      analysisMsg = isAr ? `تم رصد وتوثيق تأخير بقيمة ${p16DelayMinutes} دقيقة. عذر التأخير: (${p16Reason === "excused" ? "مقبول نظامياً" : "غير مقبول - يحسم جزئياً"}).` : `Recorded delay of ${p16DelayMinutes} minutes. Class: ${p16Reason === "excused" ? "Excused" : "Unexcused - penalty applies"}.`;
    } else if (p16ActionType === "absence") {
      analysisMsg = isAr ? `تم تسجيل غياب الموظف. نوع الغياب: (${p16Reason === "excused" ? "عذر طبي/رسمي معتمد" : "غياب غير مبرر - يقيد أثره على الرواتب"}).` : `Logged absence. Reason: ${p16Reason === "excused" ? "Excused/Approved leave" : "Unexcused - penalty applied to payroll"}.`;
    } else {
      analysisMsg = isAr ? `تم تسييل ومعالجة الإجراء [${p16ActionType}] والتحقق المادي المتقاطع مع سجل C9.` : `Processed attendance action [${p16ActionType}] successfully with C9 cross-checks.`;
    }

    setP16Result({
      blocked: false,
      frozen: false,
      analysisMsg,
      c9Hash,
      salaryImpact: p16ActionType === "absence" && p16Reason !== "excused" ? (isAr ? "حسم يوم عمل بموجب المادة 84 من نظام العمل لعدم ثبوت العذر" : "Deduction of 1 day base wage based on unexcused absence") : (isAr ? "لا يوجد أثر مالي سلبي" : "No negative payroll impact")
    });
  };

  // P17 Evaluator
  const handleP17EvaluateBehavior = () => {
    if (!p17HasSovereignId) {
      setP17Result({
        blocked: true,
        reason: isAr ? "فشل التحقق السيادي المانع: الجلسة غير مرتبطة بهوية سيادية صالحة." : "Sovereign checks failed: Session is not associated with a valid sovereign_user_id."
      });
      return;
    }

    const pathConsensus = p17PathText && p17PathProcedure && p17PathPhysical;
    if (!pathConsensus) {
      setP17Result({
        blocked: false,
        frozen: true,
        reason: isAr ? "تجميد العملية: فشل بروتوكول المسارات الثلاثة في التوافق الرقمي والوثائقي والفيزيائي." : "Frozen process: Failed Three-Path consensus verification (Textual, Procedural, and Material mismatch)."
      });
      return;
    }

    const c9Hash = "PENDING_SERVER_SYNC";
    let actionRecommendation = "";
    let systemResponse = "";

    if (p17BehaviorScale === "positive_reward") {
      actionRecommendation = isAr ? "إصدار توصية فورية بتقديم مكافأة معنوية وإدراج السلوك في سجل الترقيات المادية بنظام C9" : "Issue dynamic positive recognition certificate & queue for promotions";
      systemResponse = isAr ? "سلوك إيجابي متميز ومطابق للمهنية الرفيعة يعزز معايير الإثبات التنافسي." : "Highly compliant positive professional behavior. Cleared and recommended for rewards.";
    } else if (p17BehaviorScale === "simple_warning") {
      actionRecommendation = isAr ? "تفعيل الفلتر الملكي 11438: حظر العقوبة وتوجيه إنذار كتابي لمنح الموظف مهلة 3 أيام للتصحيح" : "Issue warning and 3-days correction grace (Royal Filter 11438)";
      systemResponse = isAr ? "مخالفة غير جسيمة (سلوك سلبي بسيط). لا يُسمح بتدوين عقوبة مادية قبل إبلاغ كتابي ومهلة 3 أيام." : "Non-grave negative behavior. Immediate deduction blocked; must provide 3 days to self-correct.";
    } else {
      actionRecommendation = isAr ? "إحالة ملف السلوك فوراً للتحقيق المكتوب والمسجل بمحضر رسمي لإثبات الواقعة الجسيمة" : "Send immediately to formal documented compliance disciplinary investigation";
      systemResponse = isAr ? "سلوك سلبي جسيم يهدد سلاسة الإنتاج والعملية التنظيمية بموجب اللائحة الداخلية للمنشأة." : "Grave violation. Disciplinary investigation triggered according to statutory labor regulations.";
    }

    setP17Result({
      blocked: false,
      frozen: false,
      actionRecommendation,
      systemResponse,
      c9Hash
    });
  };

  // P18 Evaluator
  const handleP18EvaluatePerformance = () => {
    if (!p18HasSovereignId) {
      setP18Result({
        blocked: true,
        reason: isAr ? "فشل التحقق السيادي المانع: الجلسة غير مرتبطة بهوية سيادية صالحة." : "Sovereign checks failed: Session is not associated with a valid sovereign_user_id."
      });
      return;
    }

    if (p18CertaintyScore < 80) {
      setP18Result({
        blocked: false,
        frozen: true,
        reason: isAr ? "تجميد التقييم الأداء وتحويله للمراجعة: اليقين الاستدلالي للمؤشرات دون 80%." : "Performance evaluation frozen: Verification certainty metric is below 80%."
      });
      return;
    }

    const averageRating = (p18Productivity + p18Commitment + p18Quality + p18Cooperation + p18PolicyCompliance + p18GoalAchievement) / 6;
    let rank = "";
    let recommendation = "";

    if (averageRating >= 90) {
      rank = isAr ? "ممتاز (Excellent)" : "Excellent";
      recommendation = isAr ? "التوصية السيادية: مستحق فوري لترقية وظيفية ومكافأة تميز معنوية ومادية بالـ C9" : "Sovereign Recommendation: Eligible for immediate promotion & high-performance bonus log in C9";
    } else if (averageRating >= 75) {
      rank = isAr ? "جيد جداً (Very Good)" : "Very Good";
      recommendation = isAr ? "التوصية السيادية: استمرار خط السلوك المهني الثابت مع تمديد الأهداف السنوية" : "Sovereign Recommendation: Maintain developmental alignment with higher objective thresholds";
    } else if (averageRating >= 60) {
      rank = isAr ? "جيد (Good)" : "Good";
      recommendation = isAr ? "التوصية السيادية: إلحاق الموظف بمسار تطوير لتعزيز الإنتاجية والكفاءة الإدارية" : "Sovereign Recommendation: Enroll in performance enhancement plans to bridge productivity gaps";
    } else if (averageRating >= 40) {
      rank = isAr ? "تحت المستهدف (Needs Improvement)" : "Needs Improvement";
      recommendation = isAr ? "التوصية السيادية: وضع خطة تطوير أداء PIP إلزامية ومتابعة دقيقة لمدة 60 يوماً" : "Sovereign Recommendation: Place on a mandatory 60-day Performance Improvement Plan (PIP)";
    } else {
      rank = isAr ? "ضعيف (Poor)" : "Poor";
      recommendation = isAr ? "التوصية السيادية: توجيه إنذار أداء رسمي متقدم والتدقيق المتبادل في شروط العمل" : "Sovereign Recommendation: Formal notice issued regarding chronic poor productivity";
    }

    const c9Hash = "PENDING_SERVER_SYNC";
    setP18Result({
      blocked: false,
      frozen: false,
      score: averageRating.toFixed(1),
      rank,
      recommendation,
      c9Hash
    });
  };

  // P19 Evaluator
  const handleP19EvaluateContract = () => {
    if (!p19HasSovereignId) {
      setP19Result({
        blocked: true,
        reason: isAr ? "فشل التحقق السيادي المانع: الجلسة غير مرتبطة بهوية سيادية صالحة." : "Sovereign checks failed: Session is not associated with a valid sovereign_user_id."
      });
      return;
    }

    if (p19CertaintyScore < 80) {
      setP19Result({
        blocked: false,
        frozen: true,
        reason: isAr ? "تجميد وثيقة العقد وتحويلها للمؤسس بسبب انخفاض مستوى اليقين (أقل من 80%)." : "Contract document evaluation frozen: Certainty metric for verification falls below 80%."
      });
      return;
    }

    const hasAllChecks = p19ContractWritten && p19HasAllClausules && p19SalaryClear && p19HoursDefined && p19VacationDefined && p19IsSigned && p19IsRegisteredC9;
    const errors: string[] = [];
    if (!p19ContractWritten) errors.push(isAr ? "العقد غير مكتوب أو بصيغة شفهية باطلة" : "Contract is unwritten (invalid standard under Labor Law)");
    if (!p19HasAllClausules) errors.push(isAr ? "افتقاد بنود إلزامية جوهرية (المسمى، البيانات، الحقوق)" : "Lacks critical statutory labor standard clauses");
    if (!p19SalaryClear) errors.push(isAr ? "الأجر الأساسي والبدلات الشهرية غير محددة صراحة" : "Base salary or explicit monthly allowances are undefined");
    if (!p19HoursDefined) errors.push(isAr ? "أوقات العمل وساعات الدوام تخالف المحدد بالنظام" : "Daily working hours are missing or conflict with statutory 8-hr cap");
    if (!p19VacationDefined) errors.push(isAr ? "افتقاد بيان صريح للإجازات السنوية والراحة الأسبوعية" : "Fails to configure necessary statutory weekend & annual leaves");
    if (!p19IsSigned) errors.push(isAr ? "افتقاد التواقيع الرقمية/الكتابية اللازمة لقانونية الرابط المباشر" : "Missing wet or qualified digital signatures of the parties");
    if (!p19IsRegisteredC9) errors.push(isAr ? "العقد غير مربوط بقيد الفهرس السيادي المشفر C9" : "Document is not registered into the secure blockchain C9 ledger");

    const c9Hash = "PENDING_SERVER_SYNC";

    setP19Result({
      blocked: false,
      frozen: false,
      valid: hasAllChecks,
      errors,
      c9Hash
    });
  };

  // P20 Evaluator
  const handleP20EvaluateCompliance = () => {
    if (!p20HasSovereignId) {
      setP20Result({
        blocked: true,
        reason: isAr ? "فشل التحقق السيادي المانع: الجلسة غير مرتبطة بهوية سيادية صالحة." : "Sovereign checks failed: Session is not associated with a valid sovereign_user_id."
      });
      return;
    }

    const hasPathConsensus = p20PathText && p20PathProcedure && p20PathPhysical;
    if (!hasPathConsensus) {
      setP20Result({
        blocked: false,
        frozen: true,
        reason: isAr ? "تجميد التقرير: فشل بروتوكول توافق المسارات الثلاثة لبيانات الامتثال التاريخية." : "Compliance Assessment Frozen: Discovered variance in the Three-Path cross-validation logs."
      });
      return;
    }

    const checkpoints = [
      { name: isAr ? "دفع الأجور بموجب حماية الأجور (WPS)" : "Unimpaired WPS payroll execution", status: p20WpsActive },
      { name: isAr ? "توفر نسخ عقود عمل مكتوبة وموثقة" : "100% formal documented contracts matching real titles", status: p20HasWrittenContracts },
      { name: isAr ? "ساعات العمل والراحة ضمن الحدود القانونية" : "Working hours within Saudi labor caps (8 hrs standard)", status: p20HoursInsideLimits },
      { name: isAr ? "تسجيل الموظفين والاشتراكات في التأمينات الاجتماعية (GOSI)" : "Co-workers enrolled in GOSI tracker system", status: p20GosiRegistered },
      { name: isAr ? "توفير بيئة عمل آمنة وصحية ومستدامة بمواصفات وزارة الموارد" : "Occupation health, safety and hazard environment index compliant", status: p20SafeEnv },
      { name: isAr ? "إجراء تحقيق مكتوب وسماع أقوال الموظف قبل أي خصم" : "Formal written investigation and hearings completed before deductions", status: p20InvestigationBeforeDeduction }
    ];

    const passedCount = checkpoints.filter(c => c.status).length;
    const ratio = (passedCount / checkpoints.length) * 100;
    let riskLevel = "";
    if (ratio >= 90) {
      riskLevel = isAr ? "منخفض جداً (امتثال أخضر متميز)" : "Very Low (Green Compliant State)";
    } else if (ratio >= 70) {
      riskLevel = isAr ? "متوسط الاستقرار (امتثال واعد يتطلب مراجعة بسيطة)" : "Moderate Risk (Yellow Alert State)";
    } else {
      riskLevel = isAr ? "عالي الخطورة (يتطلب معالجة طارئة وضبط العقود والمحاضر سريعا لتجنب المخالفات السيادية)" : "High Risk (Critical Compliance Breaches Found)";
    }

    const c9Hash = "PENDING_SERVER_SYNC";

    setP20Result({
      blocked: false,
      frozen: false,
      complianceRatio: ratio.toFixed(0),
      riskLevel,
      checkpoints,
      c9Hash
    });
  };

  // Interaction handlers
  const handleP1TriggerEvent = (eventName: string) => {
    const timeNow = new Date().toLocaleTimeString("ar-SA", { hour12: false });
    const randId = "PENDING";
    setP1EventLog(prev => [
      { time: timeNow, event: eventName, status: isAr ? "تم الختم بمطابقة البصمة" : "Stamped & Signature verified", c9Hash: `C9-ACT-${randId}` },
      ...prev
    ].slice(0, 4));
  };

  const handleP4TriggerTampering = () => {
    setIsP4Tilted(true);
    const randId = "PENDING";
    setP4Alerts(prev => [
      {
        id: `ALRT-${randId}`,
        type: isAr ? "تلاعب جغرافي منتحل" : "Identity GPS Spoof Detected",
        description: isAr 
          ? "التحليل المتقاطع كشف تباين مسافة جغرافي في نافذة زمنية ضيقة (تنسيق GPS خاطئ أو أداة منتحلة)."
          : "Discovered extreme spatial drift in GPS check-in device metadata."
      }
    ]);
  };

  const handleP8Sealing = () => {
    if (!p8DocContent.trim()) return;
    const timeNow = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const pendingHash = "SYNC_PENDING";
    setP8GeneratedSeal(pendingHash);
    setP8SealedAt(timeNow);
  };

  const handleRunP9Execution = () => {
    setP9ActiveStep(0);
    const steps = [
      isAr ? "دورة دمج الأكواد والباركودات لـ LEXI" : "Compiling query logic instructions...",
      isAr ? "التحقق السيادي ومطابقة الأركان التشغيلية في C9" : "Running sovereign validation loops in C9...",
      isAr ? "توجيه الملف لوحدة المعالجة التلقائية وحماية الجزاءات" : "Locating compliant processing unit...",
      isAr ? "تنفيذ المنطق المستقطب ومعادلات الاستحقاق" : "Resolving JSON operational logic paths...",
      isAr ? "المطابقة المباشرة بلائحة نظام العمل مادة (38)" : "Mapping output to Saudi Labor Law parameters...",
      isAr ? "الختم النهائي الآمن وتسجيل الدفعة في سجل C9 Ledger" : "Sealed and committed in C9 Ledger!"
    ];
    setP9ExecutionLogs([]);
    let c = 0;
    const interval = setInterval(() => {
      setP9ActiveStep(c);
      setP9ExecutionLogs(prev => [...prev, steps[c]]);
      c++;
      if (c >= steps.length) {
        clearInterval(interval);
      }
    }, 450);
  };

  // P10 Algorithm Evaluator
  const handleEvaluateP10Violation = () => {
    let certainty = p10EvidenceLevel;
    if (!p10HasConfession) certainty -= 15;
    if (!p10IsInvestigationDone) certainty -= 20;

    const isRuleOk = p7PathText && p7PathProcedure && p7PathPhysical;
    const isRoyalFilterGraceActive = p10Severity === "non-grave";

    let recAction = "";
    let isFrozen = false;
    let justification = "";

    if (certainty < 80) {
      isFrozen = true;
      recAction = isAr ? "تجميد فوري للعملية والمخالفة" : "Operation Frozen - Weak Evidence";
      justification = isAr ? "مستوى اليقين الاستدلائي أقل من 80%، فاقد للأركان الثبوتية." : "Certainty score below 80% minimum mandate.";
    } else if (!isRuleOk) {
      isFrozen = true;
      recAction = isAr ? "تجميد - فشل مطابقة المسارات الثلاثة" : "Frozen - Path Consensus failed";
      justification = isAr ? "خلل مادي أو مستندي في التوفيق المتبادل بين المسار النصي والفعلي واللوائح." : "Verification path variance detected between files & physical logs.";
    } else if (isRoyalFilterGraceActive) {
      recAction = isAr ? "حظر الغرامة وتفعيل مهلة 3 أيام للتصحيح" : "Block Violation - Issue 3-Day Grace";
      justification = isAr ? "تم إعمال الفلتر الملكي 11438: يمنع تسييل عقوبة غير جسيمة قبل إنذار ومهلة 3 أيام." : "Enforcing Royal Filter 11438: offer 3 days correction grace for non-grave violations.";
    } else {
      if (p10PriorWarnings === 0) {
        recAction = isAr ? "إنذار مكتوب مع لفت نظر رسمي" : "Official written warning";
      } else if (p10PriorWarnings === 1) {
        recAction = isAr ? "خصم يوم من الأجر الأساسي" : "1-day salary deduction";
      } else {
        recAction = isAr ? "خصم 3 أيام وعقوبة من الدرجة الثالثة" : "3-day salary deduction & grade-3 penalty";
      }
      justification = isAr ? "اكتمال أركان المخالفة وتجاوز مرشحات المنع وثقة 99%." : "Complete verification pillars satisfied with zero legal blocks.";
    }

    setViolationReport({ certainty, isFrozen, recAction, justification });
  };

  // P11: EOS Formula Engine (Saudi Labor Law Article 84, 85, 87)
  const handleCalculateP11EOS = () => {
    let isLegal = true;
    let errors: string[] = [];

    if (!p11IsDocumented) {
      isLegal = false;
      errors.push(isAr ? "العقد غير موثق بسجلات الوزارة (نقص ركن الوثيقة)" : "Contract lacking ministry certification");
    }
    if (!p11IsNotified && p11Reason !== "article_80" && p11Reason !== "resignation") {
      isLegal = false;
      errors.push(isAr ? "لم يثبت إرسال الإشعار المكتوب بمدة 60 يوماً متواصلة" : "Missing required 60-day written notice track");
    }

    let baseAnnualEOSFee = 0;
    if (p11YearsOfService <= 5) {
      baseAnnualEOSFee = p11YearsOfService * 0.5 * p11MonthlySalary;
    } else {
      baseAnnualEOSFee = (5 * 0.5 * p11MonthlySalary) + ((p11YearsOfService - 5) * 1.0 * p11MonthlySalary);
    }

    let scaleFactor = 1.0;
    let isForfeited = false;
    let targetArticle = "المادة 84 (نهاية الخدمة القياسية)";

    if (p11Reason === "resignation") {
      targetArticle = "المادة 85 (الاستقالة المتدرجة)";
      if (p11YearsOfService < 2) {
        isForfeited = true;
        scaleFactor = 0;
      } else if (p11YearsOfService >= 2 && p11YearsOfService < 5) {
        scaleFactor = 1 / 3;
      } else if (p11YearsOfService >= 5 && p11YearsOfService < 10) {
        scaleFactor = 2 / 3;
      } else {
        scaleFactor = 1.0;
      }
    } else if (p11Reason === "article_80") {
      targetArticle = "المادة 80 (المخالفات الجسيمة والفسخ)";
      isForfeited = true;
      scaleFactor = 0;
    } else if (p11Reason === "article_81") {
      targetArticle = "المادة 81 (الإخلال بالالتزامات من المنشأة)";
      scaleFactor = 1.0;
    } else if (p11Reason === "force_majeure") {
      targetArticle = "المادة 87 (القوة القاهرة والظروف الطبيعية)";
      scaleFactor = 1.0;
    }

    const calculatedReward = isForfeited ? 0 : baseAnnualEOSFee * scaleFactor;

    setP11Report({
      isLegal,
      errors,
      calculatedReward,
      baseAnnualEOSFee,
      scaleFactorText: `${(scaleFactor * 100).toFixed(0)}%`,
      targetArticle,
      isForfeited
    });
  };

  // P12 Audit execution
  const handleAuditP12Salaries = () => {
    if (!p12HasSovereignId) {
      setP12AuditResult({
        blocked: true,
        reason: isAr ? "فشل التحقق السيادي المانع: الجلة خالية من هوية sovereign_user_id صالحة." : "Sovereign checks failed: Missing mandatory sovereign_user_id query variable."
      });
      return;
    }

    const maxLegalLimit = (p12BasicSalary / 30) * 5;
    const isExceeded = p12DeductionAmount > maxLegalLimit;

    let legal = true;
    let remark = "";

    if (!p12IsLinkedToViolation) {
      legal = false;
      remark = isAr ? "الخصم المالي مجهول الهوية ولم يربط بمخالفة مسجلة في سجل C9." : "Unreferenced payroll deductions are strictly prohibited under national law.";
    } else if (!p12HasPriorInvestigation) {
      legal = false;
      remark = isAr ? "لم يتم إثبات قيام لجنة الامتثال بمحضر تحقيق مكتوب قبل إصدار الحسم." : "Deduction requires formal signed investigation logs before executing wages change.";
    } else if (isExceeded) {
      legal = false;
      remark = isAr 
        ? `الحسم (${p12DeductionAmount} ر.س) يتجاوز الحد القانوني البالغ 5 أيام وهو (${maxLegalLimit.toFixed(0)} ر.س).` 
        : `Deduction violates continuous cap limit of 5 days worth of base salary.`;
    } else if (!p12IsEmployeeNotified) {
      legal = false;
      remark = isAr ? "القرار لم يُبلغ بصفة رسمية ومطابقة إلكترونية للموظف." : "The policy checks failed due to missing digital notification signatures.";
    } else {
      legal = true;
      remark = isAr ? "الخصم نظامي ومطابق لمعايير الامتثال وحماية الأجور (WPS)." : "Deduction and wage alignment comply fully with WPS regulations.";
    }

    setP12AuditResult({
      blocked: false,
      legal,
      remark,
      maxLegalLimit,
      wpsLabel: p12BasicSalary >= 4000 ? "COMPLIANT (المنشأة خضراء)" : "WARNING (أقل من الحد الأدنى للأجور الوطنية)"
    });
  };

  // P13 Audit execution
  const handleP13EvaluateEligibility = () => {
    if (!p13HasSovereignId) {
      setP13EligibilityResult({
        blocked: true,
        reason: isAr ? "فشل التحقق السيادي المانع: الملف غير مرتبط بمعرف sovereign_user_id." : "Missing sovereign credentials header."
      });
      return;
    }

    const item = p13Candidates[p13SelectedCandidate];
    let eligible = true;
    let score = 50;
    let notes: string[] = [];

    if (item.tenure < 2) {
      score += 10;
      notes.push(isAr ? "مدة الخدمة أقل من 24 شهراً" : "Tenure with firm less than 24 months");
    } else {
      score += 30;
    }

    if (item.reviews >= 85) {
      score += 25;
    } else {
      eligible = false;
      notes.push(isAr ? "التقييم السنوي أقل من الحد المستهدف (85%)" : "Annual reviews fall below 85% requirement");
    }

    if (item.violationCount > 1) {
      score -= 20;
      eligible = false;
      notes.push(isAr ? "وجود تكرار للمخالفات في الـ C9" : "Elevated frequency of recorded past violations");
    } else {
      score += 15;
    }

    setP13EligibilityResult({
      blocked: false,
      eligible: eligible && score >= 70,
      score,
      notes,
      candName: item.name,
      candRole: item.currentRole,
      newRole: p13ActionType === "promotion" ? (isAr ? "مدير فرع / مشرف درجة أولى" : "Store Manager / Grade A") : (isAr ? "النقل لنفس المسار بفروع شمال الرياض" : "Branch transfer - North Riyadh")
    });
  };

  return (
    <div className="bg-[#1c2541] border border-white/10 rounded-2xl p-4 sm:p-6 relative overflow-hidden backdrop-blur-md text-right space-y-6" style={{ direction: "rtl" }}>
      <div className="absolute top-0 left-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Sovereign Title Suite */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="text-base font-extrabold text-white tracking-wide font-sans">
              {isAr ? "الدستور التشغيلي و 27 بروتوكولاً سيادياً لـ LEXI" : "LEXI Sovereign Constitution & 27 Protocols"}
            </h2>
          </div>
          <p className="text-[10px] text-gray-400 max-w-2xl leading-relaxed">
            {isAr
              ? "حوكمة الأنشطة التنظيمية، وإثبات الأركان القانونية ومطابقة بصمة الـ C9 التشغيلية تلقائياً لمنع القرارات والغرامات الباطلة نظامياً بموجب أنظمة العمل السعودية."
              : "Absolute validation protocols linking operational outputs directly to Saudi labor regulations, preventing unsanctioned or unverified warnings."
            }
          </p>
        </div>
        <span className="text-[9px] bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] px-2.5 py-1 rounded-full font-mono font-extrabold uppercase shrink-0">
          OS LexOps Sovereign v1.2
        </span>
      </div>

      {/* Categorized Protocol Selection Rail */}
      <div className="space-y-3">
        {["core", "compliance", "ops", "system"].map((catKey) => (
          <div key={catKey} className="space-y-1.5">
            <span className="text-[9px] font-extrabold text-gray-500 uppercase tracking-wider font-mono block">
              // {categories[catKey as keyof typeof categories]}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
              {tabs
                .filter((t) => t.category === catKey)
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`py-1.5 px-2 rounded-lg text-center font-bold text-[9.5px] transition cursor-pointer ${
                      activeTab === t.id
                        ? "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {t.title}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Render Dynamic Live Sandbox Grid */}
      <div className="pt-2">
        
        {/* 1. OPERATIONAL INTEGRATION */}
        {activeTab === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3 font-sans text-xs">
              <span className="text-[#D4AF37] font-bold block">// {isAr ? "الربط التشغيلي المباشر" : "Integrated System Databases"}</span>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                {isAr
                  ? "دمج LEXI بكامل قواعد بيانات الموظفين، الحضور والانصراف، سجل التحقيقات، لإرسال التنبيهات والأحداث وتعديلها تلقائياً."
                  : "LEXI operates as a direct agent interacting in real time with enterprise databases and sovereign ledgers."
                }
              </p>
              <div className="space-y-1 pt-1.5">
                {p1Databases.map((db, i) => (
                  <div key={i} className="flex justify-between items-center text-[9px] bg-[#1c2541] p-1.5 rounded border border-white/5">
                    <span className="text-emerald-400">● {db.status}</span>
                    <span className="text-gray-300 font-bold">{db.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-8 bg-[#1c2541] border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-gray-500 font-mono">LIVE_EVENT_BROADCAST_POOL</span>
                <span className="text-white">{isAr ? "محاكي بث الأحداث للتلقيح والختم" : "Simulate Live Events Ingestion"}</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => handleP1TriggerEvent(isAr ? "دخول موظف بفرع جدة" : "Employee check-in - Jeddah Branch")}
                  className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 text-[9.5px] font-bold rounded cursor-pointer transition"
                >
                  🚀 {isAr ? "تسجيل دخول حضور" : "Simulate Attendance Log"}
                </button>
                <button
                  onClick={() => handleP1TriggerEvent(isAr ? "رصد تأخير بدون عذر" : "Unexcused delay recorded")}
                  className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 text-[9.5px] font-bold rounded cursor-pointer transition"
                >
                  ⚠️ {isAr ? "رصد تعارض بصمة" : "Simulate Registry Conflict"}
                </button>
              </div>
              <div className="bg-[#1c2541] rounded border border-white/5 p-2 font-mono text-[9px] space-y-1.5 min-h-[90px]">
                {p1EventLog.map((log, i) => (
                  <div key={i} className="flex justify-between text-gray-300 border-b border-white/[0.03] pb-1">
                    <span className="text-[#D4AF37] font-bold">{log.c9Hash}</span>
                    <span className="truncate max-w-[150px] sm:max-w-[300px]">{log.event}</span>
                    <span className="text-gray-500 font-bold">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. INFERENTIAL CERTAINTY */}
        {activeTab === 1 && (
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4 font-sans text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#D4AF37] font-bold block">// {isAr ? "مستوى اليقين الاستدلالي (80%)" : "Certainty Threshold Guard"}</span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${p2CertaintyScore >= 80 ? 'bg-emerald-500/15 text-emerald-400 animate-pulse' : 'bg-red-500/15 text-red-400'}`}>
                {isAr ? "معدل الثبات الحالي:" : "Evidence Index:"} {p2CertaintyScore}%
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed max-w-xl">
              {isAr
                ? "يمنع تفعيل أو تسجيل أي عقوبة أو غرامة أو تغيير تعاقدي في حال كان يقين القرارات والأدلة المأخوذة أقل من 80%، مع إحالة الملف فوراً للمكتب السيادي للتدقيق اليدوي."
                : "No compliance output or penalty can be authorized if the aggregate certainty level of physical proofs falls below 80%."
              }
            </p>
            <div className="space-y-3 max-w-md pt-2">
              <input
                type="range"
                min="30"
                max="100"
                value={p2CertaintyScore}
                onChange={(e) => setP2CertaintyScore(Number(e.target.value))}
                className="w-full accent-[#D4AF37] bg-white/5 rounded-lg h-2"
              />
              <input
                type="text"
                value={p2InputCase}
                onChange={(e) => setP2InputCase(e.target.value)}
                className="w-full bg-[#1c2541] border border-white/10 p-2 text-[10px] text-white rounded text-right focus:outline-none"
              />
            </div>
            {p2CertaintyScore < 80 ? (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                <span>{isAr ? "⚠️ تجميد معنوي فوري: اليقين لا يستوفي الأركان المادية (تم تجميد الختم C9)" : "⚠️ BLOCK MANDATE ACTIVE: Certainty below 80%. Stamping and sealing frozen."}</span>
              </div>
            ) : (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>{isAr ? "✓ تجاوزت حد الحظر السيادي: القرار مرخص للتسجيل الآلي." : "✓ Verified: Complete proof matches standard guidelines. Sovereign Seal Unlocked."}</span>
              </div>
            )}
          </div>
        )}

        {/* 3. CROSS-INFERENCE */}
        {activeTab === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3 font-sans text-xs">
              <span className="text-[#D4AF37] font-bold block">// {isAr ? "التحقق المتقاطع والمطابقة للمكان" : "Cross-Inference Verifier"}</span>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                {isAr
                  ? "مقارنة السجلات بجميع المتغيرات: مطابقة البعد المكاني (الإحداثيات الجغرافية) والتواقيع الرقمية والأزمان للحدث بالتوالي."
                  : "Requires consistent proof from digital token signature, geolocation coordinate metrics, and device metadata alignment."
                }
              </p>
              <div className="space-y-1.5 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-[10px]">
                  <input type="checkbox" checked={p3Check1} onChange={(e) => setP3Check1(e.target.checked)} className="accent-[#D4AF37]" />
                  <span>{isAr ? "مطابقة البصمة المكانية والـ GPS" : "GPS coordinates within 50m tolerance"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[10px]">
                  <input type="checkbox" checked={p3Check2} onChange={(e) => setP3Check2(e.target.checked)} className="accent-[#D4AF37]" />
                  <span>{isAr ? "التوقيع المشفر للجهاز والشبكة" : "Active corporate secure network token"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[10px]">
                  <input type="checkbox" checked={p3Check3} onChange={(e) => setP3Check3(e.target.checked)} className="accent-[#D4AF37]" />
                  <span>{isAr ? "أثر الصورة والواقعة البيومترية المعزوة" : "Verified biometric confirmation (face/fingerprint)"}</span>
                </label>
              </div>
            </div>
            <div className="lg:col-span-7 bg-[#1c2541] border border-white/10 rounded-xl p-4 space-y-4 text-center flex flex-col justify-center items-center">
              <span className="text-[10px] text-gray-400 font-mono block">CROSS_PROOF_STRENGTH</span>
              <div className="text-3xl font-extrabold text-[#D4AF37] font-mono">
                {((p3Check1 ? 30 : 0) + (p3Check2 ? 30 : 0) + (p3Check3 ? 40 : 0))}%
              </div>
              <span className="text-[9.5px] text-gray-300">
                {((p3Check1 ? 30 : 0) + (p3Check2 ? 30 : 0) + (p3Check3 ? 40 : 0)) >= 60
                  ? (isAr ? "✓ الركن المادي موثق بكفاية جغرافية ومكتمل" : "✓ Material presence indicators accepted.")
                  : (isAr ? "❌ ثقة ضعيفة - حظر فوري للدمج التلقائي" : "❌ Integrity compromised. Auto-sign blocked.")
                }
              </span>
            </div>
          </div>
        )}

        {/* 4. TAMPERING DETECTION */}
        {activeTab === 3 && (
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3 font-sans text-xs">
            <span className="text-[#D4AF37] font-bold block">// {isAr ? "بروتوكول كشف التلاعب الفوري" : "Counterfeit telemetry detection"}</span>
            <p className="text-[10px] text-gray-400 leading-relaxed max-w-xl">
              {isAr
                ? "قيد الحماية النشط الجغرافي: في حال ثبوت استخدام نظام GPS وهمي، أو تزييف توقيت الحدث، يتم إصدار خفض تلقائي لنظام الصلاحية لـ 0% مع بث 'الحادثة السيادية' في Ledger."
                : "Continuous checks detect spoofed coordinate headers, developer settings anomalies, and browser-spoofed telemetry."
              }
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleP4TriggerTampering}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded cursor-pointer transition text-[10px]"
              >
                🚨 {isAr ? "محاكاة خرق وإرسال إحداثية وهمية" : "Mock GPS Tampering Signal"}
              </button>
              <button
                onClick={() => { setIsP4Tilted(false); setP4Alerts([]); }}
                className="px-3 py-1.5 border border-white/10 text-gray-400 rounded hover:bg-white/5 cursor-pointer text-[10px]"
              >
                {isAr ? "إعادة ضبط المستشعرات" : "Reset Sensors"}
              </button>
            </div>
            {isP4Tilted && p4Alerts.map((alert, i) => (
              <div key={i} className="p-3 bg-red-500/15 border border-red-500/30 text-red-300 rounded-lg space-y-1">
                <div className="flex justify-between font-bold text-[9.5px]">
                  <span>{alert.type}</span>
                  <span className="font-mono text-[#D4AF37]">SOVEREIGN_SYSTEM_LOCKED</span>
                </div>
                <p className="text-[9px] text-gray-300">{alert.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* 5. JSON LOGIC */}
        {activeTab === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3 font-sans text-xs">
              <span className="text-[#D4AF37] font-bold block">// {isAr ? "تمثيل اللوائح بصيغة JSON Logic" : "Deterministic Rule Engines"}</span>
              <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                {isAr
                  ? "يتحرك ذكاء LEXI حصراً على كتل منطقية برمجية محكمة، مما يلغي إمكانية التوليد التلقائي للجزاء بصفة تفسيرية فضفاضة من محرك النصوص."
                  : "All compliance constraints and municipal articles are coded as deterministic JSON constructs before translation."
                }
              </p>
              <div className="space-y-1">
                {legislativeSources.map((ls, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedLaw(idx)}
                    className={`w-full text-right p-2 text-[9.5px] rounded border transition ${
                      selectedLaw === idx ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white" : "bg-[#1c2541] border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    ⚖️ {ls.source}
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-7 bg-[#1c2541] border border-white/10 rounded-xl p-4 space-y-3 font-mono text-[9px]">
              <div className="text-gray-500">// PARSED_LOGIC_BLOCK</div>
              <pre className="text-[#D4AF37] font-bold whitespace-pre-wrap bg-[#1c2541] border border-white/5 p-2 rounded">
                {JSON.stringify(legislativeSources[selectedLaw].rule, null, 2)}
              </pre>
              <div className="text-[10px] text-emerald-400 font-sans border-t border-white/5 pt-2 flex justify-between">
                <span>{isAr ? "الصياغة القانونية المقيّدة:" : "Constrained Decisional Output:"}</span>
                <span className="font-bold">{legislativeSources[selectedLaw].outcome}</span>
              </div>
            </div>
          </div>
        )}

        {/* 6. ROYAL FILTER 11438 */}
        {activeTab === 5 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-6 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <span className="text-[#D4AF37] font-bold block">// {isAr ? "قيد الفلتر الملكي 11438" : "Royal Grace Filter 11438"}</span>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                {isAr
                  ? "هذا القيد محكم دستورياً: يمنع توقيع أي جزاء أو مخالفة غير جسيمة فوراً. بدلاً عن ذلك، يعطي النظام تلقائياً مهلة 3 أيام للتصحيح والإنذار أولاً."
                  : "Enforces a mandatory 3-day correction buffer on non-grave items prior to actual penalty generation."
                }
              </p>
              <div className="space-y-2 pt-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setP6ViolationSeverity("non-grave")}
                    className={`py-1.5 px-2 rounded font-bold text-center transition ${p6ViolationSeverity === "non-grave" ? "bg-amber-500/20 border border-amber-500 text-amber-300" : "bg-[#1c2541] text-gray-400"}`}
                  >
                    🌱 {isAr ? "غير جسيمة (مهلة 3 أيام)" : "Non-Grave"}
                  </button>
                  <button
                    onClick={() => setP6ViolationSeverity("grave")}
                    className={`py-1.5 px-2 rounded font-bold text-center transition ${p6ViolationSeverity === "grave" ? "bg-red-500/20 border border-red-500 text-red-300" : "bg-[#1c2541] text-gray-400"}`}
                  >
                    🔥 {isAr ? "جسيمة (رصد مباشر)" : "Grave (Direct)"}
                  </button>
                </div>
                <input
                  type="text"
                  value={p6Name}
                  onChange={(e) => setP6Name(e.target.value)}
                  className="w-full bg-[#1c2541] border border-white/10 p-2 text-[10px] text-white rounded text-right focus:outline-none"
                />
              </div>
            </div>
            <div className="lg:col-span-6 bg-[#020510] border border-white/10 rounded-xl p-4 flex flex-col justify-center">
              {p6ViolationSeverity === "non-grave" ? (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-lg space-y-1.5 text-right font-sans text-[10.5px]">
                  <span className="font-extrabold block">🌱 {isAr ? "تم حظر إصدار الغرامة فورا" : "Fine Blocked - Active Grace"}</span>
                  <p className="text-[9.5px] text-gray-300">
                    {isAr 
                      ? `تم تفعيل مهلة الـ 3 أيام عمل لـ: "${p6Name}". لم تقيد أي عقوبة بسجلات الـ C9.` 
                      : "Standard 3 days corrections allocated. System bypasses formal warning storage."}
                  </p>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-lg space-y-1.5 text-right font-sans text-[10.5px]">
                  <span className="font-extrabold block">🔥 {isAr ? "رصد مباشر متاح" : "Direct Tracking Authorized"}</span>
                  <p className="text-[9.5px] text-gray-300">
                    {isAr 
                      ? "المخالفات الجسيمة (تهدد الأمن أو الصحة أو الأرواح بلدي) مستثناة بشكل مباشر وتمرر للختم الفوري." 
                      : "Critical food safety or structural hazards are processed instantly without corrective grace."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. THREE-PATH CONSENSUS */}
        {activeTab === 6 && (
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3 font-sans text-xs">
            <span className="text-[#D4AF37] font-bold block">// {isAr ? "بروتوكول توافق المسارات الثلاثة" : "Three-Path Evidence Loop"}</span>
            <p className="text-[10px] text-gray-400 leading-relaxed max-w-xl">
              {isAr
                ? "يتحقق الدستور من توافق الأركان الثلاثة: المسار النصي للتوصية، المسار الإجرائي (جلسة التحقيق والتوقيع)، والمسار الفعلي لـ C9 Ledger. أي تضارب يلغي صيانة الملف ويجمد تسييله."
                : "Guarantees data integrity by matching textual recommendation, procedural file, and physical transactional Ledger block."
              }
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { checked: p7PathText, set: setP7PathText, title: isAr ? "المسار النصي (لائحة المنشأة)" : "Textual Standard" },
                { checked: p7PathProcedure, set: setP7PathProcedure, title: isAr ? "المسار الإجرائي (التحقيق والمذكرة)" : "Procedural Document" },
                { checked: p7PathPhysical, set: setP7PathPhysical, title: isAr ? "المسار الفعلي (سجلات الحضور/الـ GPS)" : "Physical Logs (C9 Ledger)" }
              ].map((path, i) => (
                <div key={i} className="bg-[#1c2541] border border-white/5 p-2 rounded flex justify-between items-center">
                  <input type="checkbox" checked={path.checked} onChange={(e) => path.set(e.target.checked)} className="accent-[#D4AF37]" />
                  <span className="text-[10px] font-bold text-gray-300">{path.title}</span>
                </div>
              ))}
            </div>
            {p7PathText && p7PathProcedure && p7PathPhysical ? (
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9.5px]">
                {isAr ? "✓ تطابق كامل: تماسك خطوط الاتصال الثلاثة يرفع ثقة استخلاص LEXI لـ 99.9%" : "✓ Consensus maintained successfully. Safe state verification."}
              </div>
            ) : (
              <div className="p-2.5 bg-red-500/10 text-red-400 rounded-lg text-[9.5px]">
                {isAr ? "❌ فشل المسارات الثلاثة: تجميد فوري وصارم كإجراء أمان لمنع الخروقات." : "❌ Path consensus mismatch. System locked until manually vetted."}
              </div>
            )}
          </div>
        )}

        {/* 8. C9 DIGITAL SEALING */}
        {activeTab === 7 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <span className="text-[#D4AF37] font-bold block">// {isAr ? "محاكي وحدة التشفير السيادي C9" : "C9 Cryptographic Seal"}</span>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                {isAr
                  ? "يحول أي قرار، أو ورقة إشعار، أو توصية إلى سجل مغلق غير قابل للتعديل ومقيد بهوية مستخدم ونظام تشفير SHA-256."
                  : "Generates an immutable signature of compliance reports, storing the metadata on-chain to block post-facto alterations."
                }
              </p>
              <textarea
                value={p8DocContent}
                onChange={(e) => setP8DocContent(e.target.value)}
                rows={3}
                className="w-full bg-[#1c2541] border border-white/10 p-2 text-[10px] rounded focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                onClick={handleP8Sealing}
                className="w-full py-1.5 bg-[#D4AF37] text-black font-extrabold rounded hover:bg-[#c4a12f] text-[10px]"
              >
                🔒 {isAr ? "الختم والتسجيل غير القابل للتعديل" : "Sealing Immutable Evidence"}
              </button>
            </div>
            <div className="lg:col-span-7 bg-[#1c2541] border border-white/10 rounded-xl p-4 flex flex-col justify-center min-h-[140px]">
              {p8GeneratedSeal ? (
                <div className="space-y-3">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded text-[10px] space-y-1 font-mono text-left">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span>✓ C9_SEAL_SUCCESS</span>
                      <span>{p8SealedAt}</span>
                    </div>
                    <span className="text-[#D4AF37] font-bold select-all">{p8GeneratedSeal}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 text-[10px]">
                  {isAr ? "قم بنقر الختم في اليمين لإجراء محاكاة التشفير والتحصين" : "Unsealed state. Direct change allowed only in draft mode."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9. SOVEREIGN EXECUTION */}
        {activeTab === 8 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-4 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <span className="text-[#D4AF37] font-bold block">// {isAr ? "مراحل التنفيذ السيادي المستقل" : "Autonomous Pipeline Flow"}</span>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                {isAr
                  ? "تسلسل مبرمج مغلق من 6 خطوات يضمن التحقق والمنطق قبل السماح للذكاء الاصطناعي بإكمال مهامه."
                  : "A strictly ordered state machine ensuring logical alignment before releasing any notification text."
                }
              </p>
              <button
                onClick={handleRunP9Execution}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[10px]"
              >
                ⚙️ {isAr ? "تشغيل محاكاة دورة المعالجة" : "Execute System Machine"}
              </button>
            </div>
            <div className="lg:col-span-8 bg-[#1c2541] border border-white/10 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: 0, title: isAr ? "1. الاستعلام" : "1. Query" },
                  { id: 1, title: isAr ? "2. التحقق C9" : "2. C9 Verify" },
                  { id: 2, title: isAr ? "3. لوائح العمل" : "3. Policies" },
                  { id: 3, title: isAr ? "4. تنفيذ المنطق" : "4. Evaluate" },
                  { id: 4, title: isAr ? "5. قانون العمل" : "5. Laws" },
                  { id: 5, title: isAr ? "6. تسجيل الختم" : "6. Seal C9" }
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded border text-center transition ${
                      p9ActiveStep === idx
                        ? "bg-[#D4AF37] border-[#D4AF37] text-black font-extrabold scale-105"
                        : p9ActiveStep > idx
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-[#1c2541]/45 border-white/5 text-gray-500"
                    }`}
                  >
                    <div className="text-[9px] font-black truncate">{step.title}</div>
                  </div>
                ))}
              </div>
              <div className="bg-[#1c2541] p-2.5 rounded border border-white/5 font-mono text-[9px] space-y-1 text-right max-h-36 overflow-y-auto">
                {p9ExecutionLogs.map((log, index) => (
                  <div key={index} className="text-gray-300">
                    <span className="text-emerald-400">✓</span> {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 10. VIOLATIONS LOGIC */}
        {activeTab === 9 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <span className="text-[#D4AF37] font-bold block">// {isAr ? "مدير حوكمة المخالفات والجزاءات" : "Violations Evaluation Suite"}</span>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[9px] text-gray-400">{isAr ? "سجل إنذارات الموظف:" : "Warnings logged:"}</label>
                    <input
                      type="number"
                      min="0"
                      value={p10PriorWarnings}
                      onChange={(e) => setP10PriorWarnings(Number(e.target.value))}
                      className="w-full bg-[#1c2541] border border-white/10 p-1 rounded text-white text-center focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400">{isAr ? "يقين الأدلة المادية %:" : "Evidence level %:"}</label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={p10EvidenceLevel}
                      onChange={(e) => setP10EvidenceLevel(Number(e.target.value))}
                      className="w-full bg-[#1c2541] border border-white/10 p-1 rounded text-white text-center focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-between gap-2 text-[9.5px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={p10HasConfession} onChange={(e) => setP10HasConfession(e.target.checked)} className="accent-[#D4AF37]" />
                    <span>{isAr ? "يوجد إقرار / اعتراف" : "Confession details"}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={p10IsInvestigationDone} onChange={(e) => setP10IsInvestigationDone(e.target.checked)} className="accent-[#D4AF37]" />
                    <span>{isAr ? "محضر تحقيق موقع" : "Investigation certified"}</span>
                  </label>
                </div>
                <button
                  onClick={handleEvaluateP10Violation}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-extrabold rounded-lg text-[10px]"
                >
                  ⚖️ {isAr ? "تطبيق خوارزمية الجزاءات والفلتر" : "Run Legal Resolver"}
                </button>
              </div>
            </div>
            <div className="lg:col-span-7 bg-[#020510] border border-white/10 rounded-xl p-4 flex flex-col justify-center">
              {violationReport ? (
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg border ${violationReport.isFrozen ? "bg-red-500/10 border-red-500/30 text-red-300" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"}`}>
                    <span className="text-[10px] text-gray-400 block">{isAr ? "الإجراء أو العقوبة القانونية الصادرة:" : "Verdict output:"}</span>
                    <h4 className="text-sm font-extrabold text-white">{violationReport.recAction}</h4>
                    <p className="text-[9.5px] text-gray-300 mt-1"><strong>{isAr ? "التبرير المنشئي:" : "Legal basis:"}</strong> {violationReport.justification}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 text-[10px]">
                  {isAr ? "بانتظار الضغط على إنتاج وصرف التقرير السيادي" : "No violation record queried yet."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 11. END OF SERVICE PROTOCOL */}
        {activeTab === 10 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <span className="text-[#D4AF37] font-bold block">// {isAr ? "11. محاكي إنهاء الخدمة والمكافآت" : "11. End of Service Calculator"}</span>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-[9px] text-gray-400">{isAr ? "الراتب الأساسي الأخير:" : "Last Basic Salary:"}</label>
                    <input
                      type="number"
                      value={p11MonthlySalary}
                      onChange={(e) => setP11MonthlySalary(Number(e.target.value))}
                      className="w-full bg-[#1c2541] border border-white/10 p-1 rounded text-white text-center focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400">{isAr ? "مدة الخدمة بالسنوات:" : "Tenure in Years:"}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={p11YearsOfService}
                      onChange={(e) => setP11YearsOfService(Number(e.target.value))}
                      className="w-full bg-[#1c2541] border border-white/10 p-1 rounded text-white text-center focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9.5px] text-gray-400 block pb-1">{isAr ? "سبب انتهاء العلاقة والإنهاء:" : "Separation Reason:"}</label>
                  <select
                    value={p11Reason}
                    onChange={(e) => setP11Reason(e.target.value)}
                    className="w-full bg-[#1c2541] border border-white/10 text-[10px] p-1.5 rounded text-white font-bold"
                  >
                    <option value="resignation">{isAr ? "استقالة الموظف (المادة 85)" : "Resignation (Graduated Art 85)"}</option>
                    <option value="article_80">{isAr ? "فصل بموجب المادة 80 (مخالفة جسيمة)" : "Disciplinary Dissolution (Art 80)"}</option>
                    <option value="article_81">{isAr ? "ترك العمل بسبب إخلال المنشأة (المادة 81)" : "Employer Breach (Art 81)"}</option>
                    <option value="end_of_contract">{isAr ? "انتهاء عقد محدد المدة أو إشعار" : "End of Specified Contract Term"}</option>
                    <option value="force_majeure">{isAr ? "ترك العمل بسبب ظروف قهرية / بلدية" : "Force Majeure State (Art 87)"}</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] pt-1">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={p11IsNotified} onChange={(e) => setP11IsNotified(e.target.checked)} className="accent-[#D4AF37]" />
                    <span>{isAr ? "تم إشعار الموظف 60 يوماً" : "60-Days Notice Done"}</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={p11IsDocumented} onChange={(e) => setP11IsDocumented(e.target.checked)} className="accent-[#D4AF37]" />
                    <span>{isAr ? "تم توثيق الإنهاء بالمنصة" : "Termination Documented"}</span>
                  </label>
                </div>
                <button
                  onClick={handleCalculateP11EOS}
                  className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold rounded-lg text-[10px]"
                >
                  🧮 {isAr ? "حساب مكافأة نهاية الخدمة وتدقيق الأهلية" : "Calculate Saudi EOS Reward"}
                </button>
              </div>
            </div>
            <div className="lg:col-span-7 bg-[#020510] border border-white/10 rounded-xl p-4 flex flex-col justify-center">
              {p11Report ? (
                <div className="space-y-3 font-sans">
                  <div className="flex justify-between items-center border-b border-white/5 pb-1 text-[10.5px]">
                    <span className="text-gray-400">{isAr ? "المادة النظامية المرتبطة:" : "Applicable Law Code:"}</span>
                    <span className="text-[#D4AF37] font-black">{p11Report.targetArticle}</span>
                  </div>
                  {p11Report.isLegal ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10.5px] space-y-1">
                      <span className="font-extrabold block">✓ {isAr ? "سلامة الإنهاء ونظاميته: معتمد" : "✓ Legal Conformity Checked"}</span>
                      <p className="text-[9.5px] text-gray-300">
                        {isAr ? "تم اتباع كامل النظم المشرعة والمواعيد القانونية بنجاح." : "Standard administrative timeline matches. No statutory violations detected."}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-400/10 border border-red-500/20 text-red-300 rounded-lg text-[10.5px] space-y-1">
                      <span className="font-extrabold block">⚠️ {isAr ? "خلل إجرائي يستدعي الحذر" : "⚠️ Procedural Warnings Detected"}</span>
                      {p11Report.errors.map((err: string, idx: number) => (
                        <p key={idx} className="text-[9.5px] text-slate-300">• {err}</p>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 bg-[#1c2541] p-2.5 rounded border border-white/5 text-[9.5px]">
                    <div>
                      <span className="text-gray-500 block">{isAr ? "المكافأة الأساسية المفترضة:" : "Standard Base EOS Amount:"}</span>
                      <span className="text-white font-bold">{p11Report.baseAnnualEOSFee.toLocaleString()} ر.س</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">{isAr ? "نسبة الاستحقاق حسب المادة:" : "Earned Scale Factor:"}</span>
                      <span className="text-[#D4AF37] font-bold">{p11Report.scaleFactorText}</span>
                    </div>
                    <div className="col-span-2 border-t border-white/5 pt-1 mt-1 flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-bold">{isAr ? "إجمالي مكافأة نهاية الخدمة لتسوية الحساب:" : "Final Standard EOS Payout:"}</span>
                      <span className="text-emerald-400 font-black text-sm">{p11Report.calculatedReward.toLocaleString()} ر.س</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 text-[10px]">
                  {isAr ? "اضغط زر الاحتساب لتدقيق الخدمة والنسب والمكافآت." : "Input params and calculate end of service."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 12. SALARIES & POLICIES */}
        {activeTab === 11 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#D4AF37] font-bold block">// {isAr ? "12. إدارة الرواتب والـ WPS" : "12. Wages & Policies Audit"}</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p12HasSovereignId} onChange={(e) => setP12HasSovereignId(e.target.checked)} className="accent-[#D4AF37]" />
                  <span className="text-[9px] text-amber-400 font-mono">SOV_ID</span>
                </label>
              </div>
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-gray-400 block">{isAr ? "الراتب الأساسي الشهري:" : "Basic Salary Month:"}</label>
                    <input
                      type="number"
                      value={p12BasicSalary}
                      onChange={(e) => setP12BasicSalary(Number(e.target.value))}
                      className="w-full bg-[#1c2541] border border-white/10 p-1 rounded text-white text-center focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 block">{isAr ? "مبلغ الحسم / الخصم:" : "Proposed Deduction:"}</label>
                    <input
                      type="number"
                      value={p12DeductionAmount}
                      onChange={(e) => setP12DeductionAmount(Number(e.target.value))}
                      className="w-full bg-[#1c2541] border border-white/10 p-1 rounded text-white text-center focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-1.5 text-[9.5px] pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={p12IsLinkedToViolation} onChange={(e) => setP12IsLinkedToViolation(e.target.checked)} className="accent-[#D4AF37]" />
                    <span>{isAr ? "مرتبط بمخالفة قانونية مثبتة بالسيستم" : "Linked to documented active infraction"}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={p12HasPriorInvestigation} onChange={(e) => setP12HasPriorInvestigation(e.target.checked)} className="accent-[#D4AF37]" />
                    <span>{isAr ? "تم كتابة محضر استبيان رسمي ومكاشفة" : "Formal staff investigation report signed"}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={p12IsEmployeeNotified} onChange={(e) => setP12IsEmployeeNotified(e.target.checked)} className="accent-[#D4AF37]" />
                    <span>{isAr ? "تم إخطار الموظف خطياً عبر القنوات" : "Prior formal notification issued"}</span>
                  </label>
                </div>
                <button
                  onClick={handleAuditP12Salaries}
                  className="w-full py-1.5 bg-[#D4AF37] hover:bg-[#b0912c] text-black font-extrabold rounded text-[10px]"
                >
                  🔍 {isAr ? "التحقق من التزام الأجور والمخالفات الماليّة" : "Run Wages Compliance Check (WPS)"}
                </button>
              </div>
            </div>
            <div className="lg:col-span-7 bg-[#020510] border border-white/10 rounded-xl p-4 flex flex-col justify-center">
              {p12AuditResult ? (
                p12AuditResult.blocked ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-lg text-right text-[10px] space-y-1">
                    <span className="font-bold block">🚫 {isAr ? "الوصول التشغيلي مرفوض!" : "Access Rejected"}</span>
                    <p>{p12AuditResult.reason}</p>
                  </div>
                ) : (
                  <div className="space-y-3 font-sans text-[10px]">
                    <div className="flex justify-between items-center text-[11px] border-b border-white/5 pb-1">
                      <span className="text-gray-400">{isAr ? "حالة حماية الأجور (WPS Index):" : "WPS Status Indicator:"}</span>
                      <span className="text-emerald-400 font-extrabold">{p12AuditResult.wpsLabel}</span>
                    </div>
                    {p12AuditResult.legal ? (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                        <span className="font-extrabold block">✓ {isAr ? "حسم معتمد ومطابق لنظام العمل" : "✓ Deductions Cleared to Execute"}</span>
                        <p className="text-[9px] text-gray-300 mt-1">{p12AuditResult.remark}</p>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-400/10 border border-red-500/20 text-red-300 rounded-lg">
                        <span className="font-extrabold block font-sans">🛑 {isAr ? "مخالفة نظام الأجور والخصومات!" : "🛑 Wage System Violation Flagged!"}</span>
                        <p className="text-[9px] text-gray-300 mt-1">{p12AuditResult.remark}</p>
                      </div>
                    )}
                    <div className="bg-[#1c2541] p-2 rounded border border-white/5 font-mono text-[9px] text-left flex justify-between">
                      <span className="text-[#D4AF37]">{p12AuditResult.hash}</span>
                      <span className="text-gray-400">{isAr ? "الحد القانوني للخصم شهرياً (5 أيام):" : "Max statutory monthly cap:"} {p12AuditResult.maxLegalLimit.toFixed(0)} ر.س</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center text-gray-500 text-[10px]">
                  {isAr ? "بانتظار إجراء مراجعة الأجور والتحقق من الهوية السيادية." : "Awaiting secure WPS audit initiation."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 13. PROMOTIONS & TRANSFERS */}
        {activeTab === 12 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#D4AF37] font-bold block">// {isAr ? "13. الترقيات والنقل الوظيفي" : "13. Career Transitions Hub"}</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p13HasSovereignId} onChange={(e) => setP13HasSovereignId(e.target.checked)} className="accent-[#D4AF37]" />
                  <span className="text-[9px] text-amber-400 font-mono">SOV_ID</span>
                </label>
              </div>
              <div className="space-y-1.5">
                <div>
                  <label className="text-[9.5px] text-gray-400 block pb-1">{isAr ? "اختر الملف التعريفي للمرشح:" : "Select Transition Target:"}</label>
                  <select
                    value={p13SelectedCandidate}
                    onChange={(e) => setP13SelectedCandidate(Number(e.target.value))}
                    className="w-full bg-[#1c2541] border border-white/10 text-[10px] p-1 rounded text-white"
                  >
                    {p13Candidates.map((cand, idx) => (
                      <option key={idx} value={idx}>{cand.name} ({cand.currentRole})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={() => setP13ActionType("promotion")}
                    className={`py-1 rounded font-bold text-center text-[10px] transition ${p13ActionType === "promotion" ? "bg-[#D4AF37]/20 border border-#D4AF37 text-white" : "bg-[#1c2541] text-gray-500"}`}
                  >
                    🏆 {isAr ? "ترقية وظيفية" : "Promotion"}
                  </button>
                  <button
                    onClick={() => setP13ActionType("transfer")}
                    className={`py-1 rounded font-bold text-center text-[10px] transition ${p13ActionType === "transfer" ? "bg-[#D4AF37]/20 border border-#D4AF37 text-white" : "bg-[#1c2541] text-gray-500"}`}
                  >
                    🚚 {isAr ? "نقل وظيفي/فرع" : "Transfer Team"}
                  </button>
                </div>
                <div>
                  <label className="text-[9px] text-gray-400 block">{isAr ? "الراتب الأساسي المقترح:" : "Target Proposed Salary:"}</label>
                  <input
                    type="number"
                    value={p13NewSalary}
                    onChange={(e) => setP13NewSalary(Number(e.target.value))}
                    className="w-full bg-[#1c2541] border border-white/10 p-1 rounded text-white text-center focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleP13EvaluateEligibility}
                  className="w-full py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold rounded text-[10px]"
                >
                  🚀 {isAr ? "تسييل واستحقاق تقييم الأهلية السيادية" : "Evaluate Transition Eligibility Score"}
                </button>
              </div>
            </div>
            <div className="lg:col-span-7 bg-[#020510] border border-white/10 rounded-xl p-4 flex flex-col justify-center">
              {p13EligibilityResult ? (
                p13EligibilityResult.blocked ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded text-[10px]">
                    🚫 {p13EligibilityResult.reason}
                  </div>
                ) : (
                  <div className="space-y-3 font-sans text-[10.5px]">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">{isAr ? "المرشح الفردي:" : "Evaluated Individual:"}</span>
                      <strong className="text-white text-sm">{p13EligibilityResult.candName}</strong>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">{isAr ? "مستوى أهلية العقد والمخالفات:" : "Transition Score Result:"}</span>
                      <span className="text-[#D4AF37] font-mono font-bold text-xs">{p13EligibilityResult.score} / 100</span>
                    </div>
                    {p13EligibilityResult.eligible ? (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg space-y-1">
                        <span className="font-extrabold block">✓ {isAr ? "توصية معتمدة: العضو مستوفي كامل الأركان" : "✓ Candidate Cleared for Transfer"}</span>
                        <p className="text-[9.5px] text-gray-300 leading-normal">
                          {isAr 
                            ? `تم اجتياز فلتر الأهلية للتصعيد لـ "${p13EligibilityResult.newRole}" براتب ${p13NewSalary} ر.س.`
                            : `Conforms properly with company policies and Saudi Labor standards. Approved.`}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-400/10 border border-red-500/20 text-red-300 rounded-lg space-y-1">
                        <span className="font-extrabold block">🛑 {isAr ? "المرشح غير مؤهل نظامياً في الوقت الحالي!" : "🛑 Transition Blocked: Compliance Ineligible"}</span>
                        {p13EligibilityResult.notes.map((note: string, i: number) => (
                          <p key={i} className="text-[9.5px] text-gray-200 leading-none">• {note}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="text-center text-gray-500 text-[10px]">
                  {isAr ? "اختر المترشح والعملية لإصدار شهادة الأهلية للـ C9." : "Select candidate to pull dynamic career log reports."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 14. SOVEREIGN LINKS */}
        {activeTab === 13 && (
          <div className="space-y-4 font-sans text-xs">
            <span className="text-[#D4AF37] font-bold block">// {isAr ? "14. معمارية الروابط السيادية بين الوحدات" : "14. Inter-Unit Sovereign Links Map"}</span>
            <p className="text-[10px] text-gray-400 leading-relaxed max-w-2xl">
              {isAr
                ? "الدستور التشغيلي يحكم تدفق البيانات بين جميع الأنظمة لمنع اتخاذ قرارات في أي فرع بمعزل عن سجل الموظف المادي الموحد في سجل الـ C9."
                : "Operational architecture governing the live sync between isolated systems (Payroll, Attendance, Discipline, Contract, C9 core Ledger)."
              }
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {[
                { id: "Salaries", label: isAr ? "إدارة الرواتب والأجور" : "Payroll System", links: ["Attendance", "Violations", "EOS", "C9"] },
                { id: "Attendance", label: isAr ? "سجل الحضور والانصراف" : "Attendance Tracker", links: ["Salaries", "Violations", "C9"] },
                { id: "Violations", label: isAr ? "وحدة إدارة المخالفات" : "Disciplinary Desk", links: ["Salaries", "Compliance", "C9"] },
                { id: "EOS", label: isAr ? "إجراءات نهاية الخدمة" : "End Of Service Desk", links: ["Salaries", "C9"] },
                { id: "Contracts", label: isAr ? "إدارة المستندات والعقود" : "Resource Contracts", links: ["C9", "Compliance"] },
                { id: "Compliance", label: isAr ? "لائحة الفلتر والامتثال" : "National Compliance", links: ["all"] },
                { id: "C9", label: isAr ? "السجل السيادي المشفر C9" : "C9 Secure Core", links: ["all"] }
              ].map((node) => (
                <button
                  key={node.id}
                  onClick={() => setP14SelectedNode(node.id)}
                  className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                    p14SelectedNode === node.id 
                      ? "bg-[#D4AF37]/20 border-[#D4AF37] text-white" 
                      : "bg-[#1c2541] border-white/5 text-gray-400"
                  }`}
                >
                  <span className="font-bold text-xs block">{node.label}</span>
                  <span className="text-[8px] text-gray-500 font-mono">ID: {node.id}</span>
                </button>
              ))}
            </div>
            <div className="p-4 bg-[#1c2541] border border-white/10 rounded-xl space-y-2">
              <span className="text-[9.5px] text-gray-400 uppercase font-mono block">Active Sovereign Mesh Relations:</span>
              <div className="text-gray-300 text-[10.5px]">
                {p14SelectedNode === "Compliance" || p14SelectedNode === "C9" ? (
                  isAr 
                    ? "✓ هذا المركز متصل دائمياً وتثبيت فوري بكافة الوحدات الـ 14 الأخرى بشكل تناسقي لضمان سلامة الإثبات."
                    : "✓ This core node is structurally synced to all 14 active satellite system databases."
                ) : (
                  isAr
                    ? `الوحدة المختارة [${p14SelectedNode}] تمرر التحديثات المادية لـ: [${[
                        { id: "Salaries", labels: "الأجور ↔ الحضور، الأجور ↔ المخالفات، الأجور ↔ نهاية الخدمة" },
                        { id: "Attendance", labels: "الرواتب، الحضور، سجل بصمة GPS السيادي" },
                        { id: "Violations", labels: "المخالفات ↔ التحقيقات، المخالفات ↔ الامتثال" },
                        { id: "EOS", labels: "الرواتب ↔ نهاية الخدمة، نهاية الخدمة ↔ العقود" },
                        { id: "Contracts", labels: "العقود ↔ التحقيقات، العقود ↔ الرواتب" }
                      ].find((f) => f.id === p14SelectedNode)?.labels || "السجل السيادي C9"}].`
                    : `Active pipeline maintains bidirectional integrity between: ${JSON.stringify(
                        [
                          { id: "Salaries", links: ["Attendance", "Violations", "EOS", "C9"] },
                          { id: "Attendance", links: ["Salaries", "Violations", "C9"] },
                          { id: "Violations", links: ["Salaries", "Compliance", "C9"] },
                          { id: "EOS", links: ["Salaries", "C9"] },
                          { id: "Contracts", links: ["C9", "Compliance"] }
                        ].find((f) => f.id === p14SelectedNode)?.links || ["C9"]
                      )}`
                )}
              </div>
            </div>
          </div>
        )}

        {/* 15. SOVEREIGN MAP */}
        {activeTab === 14 && (
          <div className="space-y-4 font-sans text-xs">
            <div className="border-b border-white/5 pb-2">
              <span className="text-[#D4AF37] font-bold block text-sm">// 15. الدستور التشغيلي والخريطة السيادية v1.0</span>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                {isAr
                  ? "القواعد المطلقة والمبادئ التشغيلية العليا التي تضمن تحويل نظام العمل واللوائح إلى محرك برمجي سيادي آمن لا يمكن تلافيه."
                  : "The Supreme Constitution governing LexOps OS environment, creating deterministic compliance checks with zero human bias."
                }
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {[
                { t: isAr ? "السيادة والوكالة المستقلة" : "Autonomous Agency", d: isAr ? "يعمل نظام LEXI كعامل مستقل تماماً ضمن بيئة سيادية مغلقة لضمان سلامة الإثبات." : "LEXI runs natively within the sovereign container with isolated decisional rules blocks." },
                { t: isAr ? "المرجعية المشروطة بالهوية" : "Identity Contingent Access", d: isAr ? "يمنع تسييل أي حسم أو تغيير راتب دون استيراد وتأكيد هوية sovereign_user_id النشطة." : "Session metadata dictates operation state. No untracked payroll changes allowed." },
                { t: isAr ? "قيد الأمان الـ C9 الدائم" : "Immutable C9 Commitment", d: isAr ? "كل توصية، غرامة، أو مستند، يسجل بالختم SHA-256 في Ledger لمنع أي تلاعب لاحق." : "Every action produces a tamper-proof cryptographic block in the unified ledger." },
                { t: isAr ? "مرشحات الامتثال الوطنية" : "National Legislative Alignments", d: isAr ? "كل القرارات مطابقة لنص ومادة لوائح وزارة العمل والبلديات كمرشح أمان إلزامي." : "Rigid alignment to Saudi Labor Law articles ensures standard legally binding outputs." }
              ].map((item, i) => (
                <div key={i} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1 hover:border-[#D4AF37]/35 transition">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                    <span>{item.t}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-normal">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 16. ATTENDANCE MANAGEMENT */}
        {activeTab === 15 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#D4AF37] font-bold block">// {isAr ? "16. إدارة الحضور والانصراف" : "16. Attendance Engine"}</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p16HasSovereignId} onChange={(e) => setP16HasSovereignId(e.target.checked)} className="accent-[#D4AF37]" />
                  <span className="text-[9px] text-[#D4AF37] font-mono">SOV_ID</span>
                </label>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[9.5px] text-gray-400 block pb-1">{isAr ? "الموظف المستهدف:" : "Target Employee:"}</label>
                  <input
                    type="text"
                    value={p16EmployeeName}
                    onChange={(e) => setP16EmployeeName(e.target.value)}
                    className="w-full bg-[#1c2541] border border-white/10 text-[10px] p-1 rounded text-white text-center"
                    placeholder={isAr ? "الاسم الموثق" : "Documented Name"}
                  />
                </div>
                <div>
                  <label className="text-[9.5px] text-gray-400 block pb-1">{isAr ? "نوع الإجراء التنظيمي:" : "Select Action Type:"}</label>
                  <select
                    value={p16ActionType}
                    onChange={(e) => setP16ActionType(e.target.value)}
                    className="w-full bg-[#1c2541] border border-white/10 text-[10px] p-1 rounded text-white"
                  >
                    <option value="check_in">{isAr ? "تسجيل حضور (Check-In)" : "Register Check-In"}</option>
                    <option value="check_out">{isAr ? "تسجيل انصراف (Check-Out)" : "Register Check-Out"}</option>
                    <option value="delay">{isAr ? "تسجيل تأخير (Delay)" : "Log Delay"}</option>
                    <option value="absence">{isAr ? "تسجيل غياب (Absence)" : "Log Absence"}</option>
                  </select>
                </div>

                {p16ActionType === "check_out" && (
                  <div>
                    <label className="text-[9.5px] text-gray-400 block pb-1">{isAr ? "ساعات العمل الفعلية:" : "Actual Hours Worked:"}</label>
                    <input
                      type="number"
                      value={p16HoursWorked}
                      onChange={(e) => setP16HoursWorked(Number(e.target.value))}
                      className="w-full bg-[#1c2541] border border-white/10 text-[10px] p-1 rounded text-white text-center"
                    />
                  </div>
                )}

                {p16ActionType === "delay" && (
                  <div>
                    <label className="text-[9.5px] text-gray-400 block pb-1">{isAr ? "مدة التأخير (بالدقائق):" : "Delay (Minutes):"}</label>
                    <input
                      type="number"
                      value={p16DelayMinutes}
                      onChange={(e) => setP16DelayMinutes(Number(e.target.value))}
                      className="w-full bg-[#1c2541] border border-white/10 text-[10px] p-1 rounded text-white text-center"
                    />
                  </div>
                )}

                {(p16ActionType === "absence" || p16ActionType === "delay") && (
                  <div>
                    <label className="text-[9.5px] text-gray-400 block pb-1">{isAr ? "طبیعة مبرر الغياب/التأخير:" : "Excuse Status:"}</label>
                    <select
                      value={p16Reason}
                      onChange={(e) => setP16Reason(e.target.value)}
                      className="w-full bg-[#1c2541] border border-white/10 text-[10px] p-1 rounded text-white"
                    >
                      <option value="excused">{isAr ? "بعذر رسمي معتمد (Excused)" : "Verified/Excused"}</option>
                      <option value="unexcused">{isAr ? "بدون عذر معتمد (Unexcused)" : "Unexcused"}</option>
                    </select>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center text-[9px] text-gray-400 pb-1">
                    <span>{isAr ? "مقياس اليقين الاستدلالي (80% المانع):" : "Certainty Threshold (80% Cap):"}</span>
                    <span className="font-mono text-[#D4AF37] font-bold">{p16CertaintyScore}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={p16CertaintyScore}
                    onChange={(e) => setP16CertaintyScore(Number(e.target.value))}
                    className="w-full bg-[#1c2541] h-1 rounded-lg cursor-pointer accent-[#D4AF37]"
                  />
                </div>

                <button
                  onClick={handleP16EvaluateAttendance}
                  className="w-full py-1.5 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded text-[10px] uppercase transition cursor-pointer"
                >
                  ⚡ {isAr ? "معالجة الحضور وبصمة الـ C9" : "Process Core Attendance & Seal C9"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#020510] border border-white/10 rounded-xl p-4 flex flex-col justify-center text-right">
              {p16Result ? (
                p16Result.blocked ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded text-[10px]">
                    🚫 {p16Result.reason}
                  </div>
                ) : p16Result.frozen ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded text-[10px]">
                    ⚠️ {p16Result.reason}
                  </div>
                ) : (
                  <div className="space-y-3 text-right">
                    <div className="border-b border-white/5 pb-2">
                      <span className="text-[#D4AF37] text-[10px] font-mono block">LEDGER EXITS: SUCCEEDED</span>
                      <strong className="text-white text-xs">{isAr ? "تقرير الدخول الموحد ومعايير الالتزام:" : "Attendance Audit Output:"}</strong>
                    </div>
                    <p className="text-[10.5px] text-emerald-400 leading-normal font-medium bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                      ✓ {p16Result.analysisMsg}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-white/[0.02] border border-white/5 p-2 rounded">
                        <span className="text-gray-400 block">{isAr ? "الأثر على مسير الرواتب:" : "Wage Deduction Impact:"}</span>
                        <strong className="text-gray-200 mt-1 block">{p16Result.salaryImpact}</strong>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 p-2 rounded">
                        <span className="text-gray-400 block">{isAr ? "بصمة الختم الجغرافي C9:" : "Immutable C9 Block Seal:"}</span>
                        <strong className="text-[#D4AF37] font-mono mt-1 block">{p16Result.c9Hash}</strong>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center text-gray-500 text-[10px]">
                  {isAr ? "الرجاء تأكيد الإجراء الاستدلالي لتسجيل حضور الموظفين بالختم الجغرافي السيادي." : "Provide inputs above and request verification to render live C9 attendance stamps."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 17. PROFESSIONAL BEHAVIORS */}
        {activeTab === 16 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#D4AF37] font-bold block">// {isAr ? "17. إدارة السلوكيات المهنية" : "17. Disciplinary Behaviors"}</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p17HasSovereignId} onChange={(e) => setP17HasSovereignId(e.target.checked)} className="accent-[#D4AF37]" />
                  <span className="text-[9px] text-[#D4AF37] font-mono">SOV_ID</span>
                </label>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[9.5px] text-gray-400 block pb-1">{isAr ? "تصنيف السلوكيات المهنية:" : "Behavior Classification:"}</label>
                  <select
                    value={p17BehaviorScale}
                    onChange={(e) => setP17BehaviorScale(e.target.value as any)}
                    className="w-full bg-[#1c2541] border border-white/10 text-[10px] p-1 rounded text-white"
                  >
                    <option value="positive_reward">{isAr ? "سلوك إيجابي يستحق التحفيز" : "Positive/Rewarding Behavior"}</option>
                    <option value="simple_warning">{isAr ? "مخالفة سلوكية غير جسيمة" : "Minor/Non-grave Infraction"}</option>
                    <option value="grave_violation">{isAr ? "مخالفة سلوكية جسيمة (رادعة)" : "Major/Grave Workplace Breach"}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9.5px] text-gray-400 block pb-1">{isAr ? "تلخيص السلوك المرصود:" : "Behavior Narrative Description:"}</label>
                  <textarea
                    value={p17BehaviorDescription}
                    onChange={(e) => setP17BehaviorDescription(e.target.value)}
                    className="w-full bg-[#1c2541] border border-white/10 text-[10px] p-1 rounded text-white h-12 text-right focus:outline-none focus:border-[#D4AF37]/50"
                  />
                </div>

                <div className="space-y-1 bg-[#1c2541] p-2 rounded border border-white/5">
                  <span className="text-[9px] text-gray-400 block font-bold">// {isAr ? "بروتوكول توافق المسارات الثلاث:" : "Three-Path Consensus Status:"}</span>
                  <div className="grid grid-cols-3 gap-1 pt-1">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={p17PathText} onChange={(e) => setP17PathText(e.target.checked)} className="accent-[#D4AF37]" />
                      <span className="text-[8px] text-gray-300">{isAr ? "1. مسار نصي" : "1. Textual"}</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={p17PathProcedure} onChange={(e) => setP17PathProcedure(e.target.checked)} className="accent-[#D4AF37]" />
                      <span className="text-[8px] text-gray-300">{isAr ? "2. مسار إجرائي" : "2. Procedural"}</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={p17PathPhysical} onChange={(e) => setP17PathPhysical(e.target.checked)} className="accent-[#D4AF37]" />
                      <span className="text-[8px] text-gray-300">{isAr ? "3. مسار مادي" : "3. Material"}</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleP17EvaluateBehavior}
                  className="w-full py-1.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white font-extrabold rounded text-[10px] uppercase transition cursor-pointer"
                >
                  ⚖️ {isAr ? "إثبات السلوك وتطبيق الفلتر الملكي" : "Commit Behavior & Apply Rules Filters"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#020510] border border-white/10 rounded-xl p-4 flex flex-col justify-center text-right">
              {p17Result ? (
                p17Result.blocked ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded text-[10px]">
                    🚫 {p17Result.reason}
                  </div>
                ) : p17Result.frozen ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded text-[10px] leading-normal">
                    ⚠️ {p17Result.reason}
                    <p className="text-[9px] text-gray-400 mt-1">
                      {isAr 
                        ? "(لا يمكن قيد أي مخالفة سلوكية دون تطابق مسارات التحقق المادية والمنهجية.)" 
                        : "(Behavior and statutory compliance actions require active concurrence across all physical investigation lines.)"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 text-right">
                    <div className="border-b border-white/5 pb-2">
                      <span className="text-[#D4AF37] text-[10px] font-mono block">C9 SECURITY LEDGER CLEARANCE</span>
                      <strong className="text-white text-xs">{isAr ? "موائمة الفلاتر السلوكية الملكية:" : "Royal Behavioral Filter Output:"}</strong>
                    </div>
                    
                    <p className="text-[10px] text-gray-200 leading-normal">
                      <span className="text-gray-400 font-bold block">{isAr ? "سلوك مصنف:" : "Evaluated Aspect:"}</span>
                      {p17Result.systemResponse}
                    </p>

                    <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg text-amber-300 font-sans text-[10px] leading-relaxed">
                      <strong className="block text-[#D4AF37] font-extrabold mb-0.5">📌 {isAr ? "الإجراء والتحفيز التشغيلي المنفذ:" : "Operational Recommendation Action:"}</strong>
                      {p17Result.actionRecommendation}
                    </div>

                    <div className="bg-[#1c2541] p-2 rounded border border-white/5 font-mono text-[9px] text-left flex justify-between">
                      <span className="text-[#D4AF37]">{p17Result.c9Hash}</span>
                      <span className="text-gray-400">{isAr ? "بروتوكول اليقين والمسارات الثلاثة: متطابقة" : "Three Path Evidence Consensus Matching: STABLE"}</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center text-gray-500 text-[10px]">
                  {isAr ? "بانتظار رصد السلوك وحوكمة المسارات لتطويع الفلتر الملكي 11438 نظامياً." : "Waiting behavioral reporting metrics inputs above to evaluate regulatory grace parameters."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 18. PERFORMANCE EVALUATION */}
        {activeTab === 17 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-6 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#D4AF37] font-bold block">// {isAr ? "18. إدارة الأداء والتقييم السنوي" : "18. Performance Metrics"}</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p18HasSovereignId} onChange={(e) => setP18HasSovereignId(e.target.checked)} className="accent-[#D4AF37]" />
                  <span className="text-[9px] text-[#D4AF37] font-mono">SOV_ID</span>
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-right" style={{ direction: isAr ? "rtl" : "ltr" }}>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between items-center text-[8.5px] text-gray-400 mb-0.5">
                      <span>{isAr ? "مقياس الإنتاجية:" : "Productivity Scale:"}</span>
                      <span className="text-white font-mono">{p18Productivity}%</span>
                    </div>
                    <input type="range" min="30" max="100" value={p18Productivity} onChange={(e) => setP18Productivity(Number(e.target.value))} className="w-full h-1 bg-[#1c2541] rounded cursor-pointer accent-[#D4AF37]" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[8.5px] text-gray-400 mb-0.5">
                      <span>{isAr ? "الالتزام بالوقت وساعات العمل:" : "Time & Schedule:"}</span>
                      <span className="text-white font-mono">{p18Commitment}%</span>
                    </div>
                    <input type="range" min="30" max="100" value={p18Commitment} onChange={(e) => setP18Commitment(Number(e.target.value))} className="w-full h-1 bg-[#1c2541] rounded cursor-pointer accent-[#D4AF37]" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[8.5px] text-gray-400 mb-0.5">
                      <span>{isAr ? "جودة المخرجات والحلول المثلى:" : "Work Output Quality:"}</span>
                      <span className="text-white font-mono">{p18Quality}%</span>
                    </div>
                    <input type="range" min="30" max="100" value={p18Quality} onChange={(e) => setP18Quality(Number(e.target.value))} className="w-full h-1 bg-[#1c2541] rounded cursor-pointer accent-[#D4AF37]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between items-center text-[8.5px] text-gray-400 mb-0.5">
                      <span>{isAr ? "التعاون وروح الفريق:" : "Cooperation Index:"}</span>
                      <span className="text-white font-mono">{p18Cooperation}%</span>
                    </div>
                    <input type="range" min="30" max="100" value={p18Cooperation} onChange={(e) => setP18Cooperation(Number(e.target.value))} className="w-full h-1 bg-[#1c2541] rounded cursor-pointer accent-[#D4AF37]" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[8.5px] text-gray-400 mb-0.5">
                      <span>{isAr ? "الالتزام بالأنظمة والسياسات:" : "Policy Compliance:"}</span>
                      <span className="text-white font-mono">{p18PolicyCompliance}%</span>
                    </div>
                    <input type="range" min="30" max="100" value={p18PolicyCompliance} onChange={(e) => setP18PolicyCompliance(Number(e.target.value))} className="w-full h-1 bg-[#1c2541] rounded cursor-pointer accent-[#D4AF37]" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[8.5px] text-gray-400 mb-0.5">
                      <span>{isAr ? "تحقيق الأهداف الأساسية:" : "OKRs Achievement:"}</span>
                      <span className="text-white font-mono">{p18GoalAchievement}%</span>
                    </div>
                    <input type="range" min="30" max="100" value={p18GoalAchievement} onChange={(e) => setP18GoalAchievement(Number(e.target.value))} className="w-full h-1 bg-[#1c2541] rounded cursor-pointer accent-[#D4AF37]" />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between items-center text-[8.5px] text-gray-400 mb-0.5">
                    <span>{isAr ? "اليقين الاستدلالي المطلوب:" : "Aesthetic Certainty Needed:"}</span>
                    <span className="text-[#D4AF37] font-mono font-bold">{p18CertaintyScore}%</span>
                  </div>
                  <input type="range" min="50" max="100" value={p18CertaintyScore} onChange={(e) => setP18CertaintyScore(Number(e.target.value))} className="w-full h-1 bg-[#1c2541] rounded cursor-pointer accent-amber-500" />
                </div>
                <button
                  onClick={handleP18EvaluatePerformance}
                  className="py-1.5 bg-gradient-to-l from-indigo-700 to-purple-700 hover:from-indigo-800 hover:to-purple-800 text-white font-extrabold rounded text-[9.5px] shadow cursor-pointer"
                >
                  📊 {isAr ? "احتساب وتوليد بطاقة الأداء" : "Calculate Performance Score"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 bg-[#020510] border border-white/10 rounded-xl p-4 flex flex-col justify-center text-right">
              {p18Result ? (
                p18Result.blocked ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded text-[10px]">
                    🚫 {p18Result.reason}
                  </div>
                ) : p18Result.frozen ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded text-[10px]">
                    ⚠️ {p18Result.reason}
                  </div>
                ) : (
                  <div className="space-y-3 text-right">
                    <div className="border-b border-white/5 pb-1 text-[11px] flex justify-between items-center">
                      <strong className="text-white">{isAr ? "تحليل الكفاءة ومجموع الأداء السنوي:" : "Performance Analytics Summary:"}</strong>
                      <span className="text-emerald-400 font-mono font-extrabold text-sm">{p18Result.score}%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                      <div className="p-2 bg-white/[0.01] border border-white/5 rounded-lg">
                        <span className="text-gray-400 block">{isAr ? "درجة التقييم الحالية:" : "Performance Grade:"}</span>
                        <strong className="text-yellow-400 text-xs block mt-1">{p18Result.rank}</strong>
                      </div>
                      <div className="p-2 bg-white/[0.01] border border-white/5 rounded-lg">
                        <span className="text-gray-400 block">{isAr ? "رمز الموثوقية بالـ C9:" : "Security Hash Identifier:"}</span>
                        <strong className="text-gray-300 font-mono text-[9px] block mt-1">{p18Result.c9Hash}</strong>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-[10.5px]">
                      <span className="font-extrabold block">✓ {isAr ? "توصية تدرج الكفاءة الوطنية النشطة:" : "Clearance Directive:"}</span>
                      <p className="text-[9.5px] text-gray-300 mt-1 leading-normal">{p18Result.recommendation}</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center text-gray-500 text-[10px]">
                  {isAr ? "الرجاء ضبط مؤشرات أداء الموظف لحساب تصنيف الأداء والتوصية التشغيلية السيادية." : "Set evaluation weights and click run calculation to audit annual metrics against benchmark guidelines."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 19. CONTRACTS MANAGEMENT */}
        {activeTab === 18 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-12 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#D4AF37] font-bold block">// {isAr ? "19. إدارة وصحة العقود" : "19. Contracts Integrity Logic"}</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p19HasSovereignId} onChange={(e) => setP19HasSovereignId(e.target.checked)} className="accent-[#D4AF37]" />
                  <span className="text-[9px] text-[#D4AF37] font-mono">SOV_ID</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[9px] text-gray-400 block font-bold">// {isAr ? "البنود والشروط الجوهرية للعقد:" : "Statutory Contract Parameters Checks:"}</span>
                  
                  <div className="space-y-1 bg-[#1c2541] p-2 rounded border border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer pb-0.5">
                      <input type="checkbox" checked={p19ContractWritten} onChange={(e) => setP19ContractWritten(e.target.checked)} className="accent-[#D4AF37]" />
                      <span className="text-[9.5px] text-gray-300">{isAr ? "العقد مكتوب وموثق بنصوص صريحة" : "Contract formally written"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer pb-0.5">
                      <input type="checkbox" checked={p19HasAllClausules} onChange={(e) => setP19HasAllClausules(e.target.checked)} className="accent-[#D4AF37]" />
                      <span className="text-[9.5px] text-gray-300">{isAr ? "يضم المسمى والواجبات والحقوق المتكاملة" : "Contains all statutory core clauses"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer pb-0.5">
                      <input type="checkbox" checked={p19SalaryClear} onChange={(e) => setP19SalaryClear(e.target.checked)} className="accent-[#D4AF37]" />
                      <span className="text-[9.5px] text-gray-300">{isAr ? "الأجر الأساسي والبدلات الشهرية واضحة ومسماة" : "Base salary and allowances clearly itemized"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer pb-0.5">
                      <input type="checkbox" checked={p19HoursDefined} onChange={(e) => setP19HoursDefined(e.target.checked)} className="accent-[#D4AF37]" />
                      <span className="text-[9.5px] text-gray-300">{isAr ? "ساعات الدوام اليومي والراحة معينة ومقيدة" : "Work hours explicitly capped at 8 hrs"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer pb-0.5">
                      <input type="checkbox" checked={p19VacationDefined} onChange={(e) => setP19VacationDefined(e.target.checked)} className="accent-[#D4AF37]" />
                      <span className="text-[9.5px] text-gray-300">{isAr ? "تنظيم الإجازات السنوية والرخص المرضية معزز" : "Statutory annual/sick leave specified"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer pb-0.5">
                      <input type="checkbox" checked={p19IsSigned} onChange={(e) => setP19IsSigned(e.target.checked)} className="accent-[#D4AF37]" />
                      <span className="text-[9.5px] text-gray-300">{isAr ? "العقد ممهور بالتواقيع المعتمدة للطرفين" : "Properly signed by both parties"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={p19IsRegisteredC9} onChange={(e) => setP19IsRegisteredC9(e.target.checked)} className="accent-[#D4AF37]" />
                      <span className="text-[9.5px] text-gray-300">{isAr ? "العقد مسجل في مستند الـ C9 المشفر" : "Synchronized & registered in C9 ledger"}</span>
                    </label>
                  </div>

                  <div className="pt-1 select-none">
                    <div className="flex justify-between items-center text-[9px] text-gray-400 pb-0.5">
                      <span>{isAr ? "يقين إثبات المستندات (عتبة الأمان 80%):" : "Certainty audit confidence index:"}</span>
                      <span className="text-[#D4AF37] font-mono">{p19CertaintyScore}%</span>
                    </div>
                    <input type="range" min="50" max="100" value={p19CertaintyScore} onChange={(e) => setP19CertaintyScore(Number(e.target.value))} className="w-full h-1 bg-[#1c2541] rounded" />
                  </div>

                  <button
                    onClick={handleP19EvaluateContract}
                    className="w-full py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-extrabold rounded text-[10px] cursor-pointer"
                  >
                    📑 {isAr ? "تدقيق الرابط التعاقدي والتسجيل بالـ C9" : "Audit Contract Compliance & Commit"}
                  </button>
                </div>

                <div className="bg-[#020510] border border-white/10 rounded-xl p-4 flex flex-col justify-center text-right">
                  {p19Result ? (
                    p19Result.blocked ? (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded text-[10px]">
                        🚫 {p19Result.reason}
                      </div>
                    ) : p19Result.frozen ? (
                      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded text-[10px]">
                        ⚠️ {p19Result.reason}
                      </div>
                    ) : p19Result.valid ? (
                      <div className="space-y-3 text-right">
                        <div className="border-b border-white/5 pb-2 text-xs flex justify-between">
                          <strong className="text-white">{isAr ? "حالة تدقيق العقد التشغيلي:" : "Contract Verifier Output:"}</strong>
                          <span className="text-emerald-400 font-extrabold font-mono uppercase text-[10px]">// INTEGRITY PASS</span>
                        </div>

                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg text-[10.5px] leading-relaxed">
                          ✓ {isAr ? "كل شروط ومواد الرابط التعاقدي مطابقة للكود المنظم وقواعد وزارة الموارد والتطابق مادي وتام." : "All contract terms explicitly meet Saudi labor rules, structural parameters, and GOSI sync standard."}
                        </div>

                        <div className="bg-[#1c2541] p-2 rounded border border-white/5 font-mono text-[9px] text-left flex justify-between">
                          <span className="text-[#D4AF37]">{p19Result.c9Hash}</span>
                          <span className="text-gray-400">{isAr ? "رمز القيد المشفر النشط في الـ C9 Ledger" : "C9 Cryptographic Verification Block ID"}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 text-right">
                        <div className="border-b border-white/5 pb-2 text-xs flex justify-between">
                          <strong className="text-white">{isAr ? "عيوب وثوقية تم كشفها بالعقد:" : "Statutory Vulnerabilities Discovered:"}</strong>
                          <span className="text-red-400 font-extrabold font-mono text-[10px] uppercase">// INTEGRITY FAIL</span>
                        </div>
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg space-y-1">
                          {p19Result.errors.map((err: string, i: number) => (
                            <p key={i} className="text-[10px]">• {err}</p>
                          ))}
                        </div>
                        <p className="text-[9px] text-red-400 leading-normal">
                          {isAr 
                            ? "🛑 لا يُنصح بتفعيل أو التوقيع بصورة قانونية على هذا المخطط حتى تلتزم بكافة معايير الاستحقاق الوطنية وتلافي الثغرات."
                            : "🛑 This draft misses core requirements and must not be committed to avoid regulatory fines."}
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="text-center text-gray-500 text-[10px]">
                      {isAr ? "الرجاء مراجعة شروط الرابط التعاقدي والضغط للتأكد من مطابقة شروط وزارة الموارد البشرية." : "Complete target parameters Checklist checklist and execute verification to evaluate contract legal status."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 20. REGULATORY COMPLIANCE */}
        {activeTab === 19 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#D4AF37] font-bold block">// {isAr ? "20. الامتثال النظامي والالتزام" : "20. Global Regulatory Compliance"}</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p20HasSovereignId} onChange={(e) => setP20HasSovereignId(e.target.checked)} className="accent-[#D4AF37]" />
                  <span className="text-[9px] text-[#D4AF37] font-mono">SOV_ID</span>
                </label>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] text-gray-400 block font-bold">// {isAr ? "سجل مؤشرات الأمان والامتثال المادي بالمنشأة:" : "Firm Compliance Operations Audit Grid:"}</span>
                
                <div className="space-y-1 bg-[#1c2541] p-2 rounded border border-white/5 text-[9.5px]">
                  <label className="flex items-center gap-2 cursor-pointer pb-0.5">
                    <input type="checkbox" checked={p20WpsActive} onChange={(e) => setP20WpsActive(e.target.checked)} className="accent-[#D4AF37]" />
                    <span className="text-gray-300">{isAr ? "نظام حماية الأجور (WPS) يسجل نسب تسليم > 95%" : "WPS payroll index conforms (>95%)"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer pb-0.5">
                    <input type="checkbox" checked={p20HasWrittenContracts} onChange={(e) => setP20HasWrittenContracts(e.target.checked)} className="accent-[#D4AF37]" />
                    <span className="text-gray-300">{isAr ? "توفير عقود مكتوبة وموثقة لكافة كوادر العمل" : "Written contracts verified for 100% staff"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer pb-0.5">
                    <input type="checkbox" checked={p20HoursInsideLimits} onChange={(e) => setP20HoursInsideLimits(e.target.checked)} className="accent-[#D4AF37]" />
                    <span className="text-gray-300">{isAr ? "ساعات الدوام الأسبوعية والراحة مطابقة للأحكام" : "Official rest cycles and standard hour limits met"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer pb-0.5">
                    <input type="checkbox" checked={p20GosiRegistered} onChange={(e) => setP20GosiRegistered(e.target.checked)} className="accent-[#D4AF37]" />
                    <span className="text-gray-300">{isAr ? "تسجيل الموظفين والاشتراكات في التأمينات (GOSI)" : "Co-workers registered in GOSI tracker"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer pb-0.5">
                    <input type="checkbox" checked={p20SafeEnv} onChange={(e) => setP20SafeEnv(e.target.checked)} className="accent-[#D4AF37]" />
                    <span className="text-gray-300">{isAr ? "بيئة العمل صحية ومطابقة لحماية السلامة المهنية" : "Secure environment & hazard checks done"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={p20InvestigationBeforeDeduction} onChange={(e) => setP20InvestigationBeforeDeduction(e.target.checked)} className="accent-[#D4AF37]" />
                    <span className="text-gray-300">{isAr ? "إجراء تحقيق كتابي وسماع أقوال الموظف قبل أي خصم" : "Signed investigation completed before deduction"}</span>
                  </label>
                </div>

                <div className="space-y-0.5 bg-[#1c2541] p-1.5 rounded border border-white/5">
                  <span className="text-[8px] text-gray-500 block font-bold">// {isAr ? "توافق المسارات الثلاث:" : "Three-Path Presence:"}</span>
                  <div className="grid grid-cols-3 gap-1">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={p20PathText} onChange={(e) => setP20PathText(e.target.checked)} className="accent-rose-500" />
                      <span className="text-[8px] text-gray-300">{isAr ? "نصي" : "Text"}</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={p20PathProcedure} onChange={(e) => setP20PathProcedure(e.target.checked)} className="accent-rose-500" />
                      <span className="text-[8px] text-gray-300">{isAr ? "إجرائي" : "Proc"}</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={p20PathPhysical} onChange={(e) => setP20PathPhysical(e.target.checked)} className="accent-rose-500" />
                      <span className="text-[8px] text-gray-300">{isAr ? "مادي" : "Material"}</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleP20EvaluateCompliance}
                  className="w-full py-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-extrabold rounded text-[10px] cursor-pointer"
                >
                  🎯 {isAr ? "تسييل وفحص امتثال المنشأة بالكامل" : "Run Comprehensive Firm Compliance Audit"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#020510] border border-white/10 rounded-xl p-4 flex flex-col justify-center text-right font-sans">
              {p20Result ? (
                p20Result.blocked ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded text-[10px]">
                    🚫 {p20Result.reason}
                  </div>
                ) : p20Result.frozen ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded text-[10px]">
                    ⚠️ {p20Result.reason}
                  </div>
                ) : (
                  <div className="space-y-3 text-right">
                    <div className="border-b border-white/5 pb-2 text-[11px] flex justify-between items-center">
                      <strong className="text-white">{isAr ? "خريطة الالتزام ومستوى الامتثال القانوني:" : "Global Operational Scorecard Result:"}</strong>
                      <span className={`font-mono font-extrabold text-sm ${Number(p20Result.complianceRatio) >= 90 ? "text-emerald-400" : Number(p20Result.complianceRatio) >= 70 ? "text-yellow-400" : "text-rose-400"}`}>{p20Result.complianceRatio}%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                      <div className="bg-white/[0.01] border border-white/5 p-2 rounded">
                        <span className="text-gray-400">{isAr ? "مستوى المخاطر الكلي:" : "Global Risk Classification:"}</span>
                        <strong className="text-gray-200 mt-1 block font-extrabold text-[10.5px]">{p20Result.riskLevel}</strong>
                      </div>
                      <div className="bg-white/[0.01] border border-white/5 p-2 rounded">
                        <span className="text-gray-400">{isAr ? "بصمة الـ C9 الاستدلالية:" : "C9 Index Reference Hash:"}</span>
                        <strong className="text-[#D4AF37] mt-1 block font-mono">{p20Result.c9Hash}</strong>
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300 text-[10px] leading-relaxed">
                      <strong className="block text-[#D4AF37] font-extrabold mb-1">{isAr ? "مؤشرات المطابقة الوطنية النشطة:" : "Evaluated Checkpoints Details:"}</strong>
                      <div className="grid grid-cols-2 gap-1 gap-x-3 text-[9px]">
                        {p20Result.checkpoints.map((cp: any, idx: number) => (
                          <div key={idx} className="flex justify-between border-b border-white/5 pb-0.5">
                            <span className="text-gray-300 truncate max-w-[125px]" title={cp.name}>{cp.name}</span>
                            <span className={cp.status ? "text-emerald-400 font-extrabold" : "text-rose-400 font-extrabold"}>{cp.status ? "✓ COMPLIANT" : "✗ EXPOSED"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center text-gray-500 text-[10px]">
                  {isAr ? "بانتظار تسييل محرك المطابقة الوطنية وإجرائية فحص البنود للتوليد الشامل." : "Awaiting user trigger to run regulatory compliance checklist evaluation."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 21. INVESTIGATIONS MANAGEMENT */}
        {activeTab === 20 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#D4AF37] font-bold block">// {isAr ? "21. إدارة التحقيقات السيادية" : "21. Investigations Management"}</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p21HasSovereignId} onChange={(e) => setP21HasSovereignId(e.target.checked)} className="accent-[#D4AF37]" />
                  <span className="text-[9px] text-[#D4AF37] font-mono">SOV_ID</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] text-gray-400 block font-bold">// {isAr ? "التعليمات والوقائع المراد تقصيها:" : "Investigation Scope & Statement:"}</label>
                <textarea
                  value={p21InstructionText}
                  onChange={(e) => setP21InstructionText(e.target.value)}
                  className="w-full h-16 bg-[#1c2541] border border-white/10 rounded p-2 text-[10.5px] text-gray-200 focus:outline-none focus:border-[#D4AF37]"
                />

                <span className="text-[9px] text-gray-400 block font-bold">// {isAr ? "قنوات ومصادر جمع الأدلة برمجياً:" : "Programmatic Evidence Sources:"}</span>
                <div className="grid grid-cols-2 gap-1.5 bg-[#1c2541] p-2 rounded border border-white/5 text-[9.5px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={p21EvidencePhotos} onChange={(e) => setP21EvidencePhotos(e.target.checked)} className="accent-[#D4AF37]" />
                    <span>{isAr ? "الصور المرفقة" : "Attached Photos"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={p21EvidenceDocs} onChange={(e) => setP21EvidenceDocs(e.target.checked)} className="accent-[#D4AF37]" />
                    <span>{isAr ? "المستندات الورقية" : "Documents OCR"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={p21EvidenceC9Logs} onChange={(e) => setP21EvidenceC9Logs(e.target.checked)} className="accent-[#D4AF37]" />
                    <span>{isAr ? "سجلات C9" : "C9 Cryptographic Logs"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={p21EvidenceSignatures} onChange={(e) => setP21EvidenceSignatures(e.target.checked)} className="accent-[#D4AF37]" />
                    <span>{isAr ? "بصمات رقمية" : "Biometric Signatures"}</span>
                  </label>
                </div>

                <div className="flex justify-between items-center bg-[#1c2541] p-2 rounded border border-white/5 text-[9.5px]">
                  <span>{isAr ? "طلب استجواب عيني للأطراف:" : "Trigger physical coworker interrogation:"}</span>
                  <input type="checkbox" checked={p21InterrogateParties} onChange={(e) => setP21InterrogateParties(e.target.checked)} className="accent-[#D4AF37] cursor-pointer" />
                </div>

                <div className="space-y-1.5 p-2 bg-[#1c2541] rounded border border-white/5">
                  <div className="flex justify-between text-[9px] text-gray-400">
                    <span>{isAr ? "المادة النظامية المستهدفة:" : "Target Saudi statutory article:"}</span>
                  </div>
                  <select
                    value={p21LawArticle}
                    onChange={(e) => setP21LawArticle(e.target.value)}
                    className="w-full bg-[#1c2541] border border-white/10 rounded p-1 text-[10px] text-gray-300 focus:outline-none"
                  >
                    <option value="article_80">{isAr ? "المادة 80 (مخالفات جسيمة / فسخ)" : "Article 80 (Gross misconduct / Dissolution)"}</option>
                    <option value="article_38">{isAr ? "المادة 38 (غير مبررة / فلتر مالي)" : "Article 38 (Minor violation / Royal grace)"}</option>
                  </select>
                </div>

                <div className="space-y-2 bg-[#1c2541] p-2 rounded border border-white/5">
                  <span className="text-[8px] text-gray-500 block font-bold">// {isAr ? "توافق المسارات الثلاث للتحقيق:" : "Three-Path Investigation consensus:"}</span>
                  <div className="grid grid-cols-3 gap-1">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={p21PathText} onChange={(e) => setP21PathText(e.target.checked)} className="accent-[#D4AF37]" />
                      <span className="text-[8px] text-gray-300">{isAr ? "نصي" : "Text"}</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={p21PathProcedure} onChange={(e) => setP21PathProcedure(e.target.checked)} className="accent-[#D4AF37]" />
                      <span className="text-[8px] text-gray-300">{isAr ? "إجرائي" : "Proc"}</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={p21PathPhysical} onChange={(e) => setP21PathPhysical(e.target.checked)} className="accent-[#D4AF37]" />
                      <span className="text-[8px] text-gray-300">{isAr ? "مادي" : "Material"}</span>
                    </label>
                  </div>
                </div>

                <div className="pt-1 select-none">
                  <div className="flex justify-between items-center text-[9px] text-gray-400 pb-0.5">
                    <span>{isAr ? "يقين القرائن الاستدلالية (الحد الأدنى 80%):" : "Investigation confidence coefficient:"}</span>
                    <span className="text-[#D4AF37] font-mono font-extrabold">{p21CertaintyScore}%</span>
                  </div>
                  <input type="range" min="50" max="100" value={p21CertaintyScore} onChange={(e) => setP21CertaintyScore(Number(e.target.value))} className="w-full h-1 bg-[#1c2541] rounded" />
                </div>

                <button
                  onClick={handleP21EvaluateInvestigation}
                  className="w-full py-1.5 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-black font-extrabold rounded text-[10px] cursor-pointer shadow-lg shadow-yellow-600/10"
                >
                  ⚖️ {isAr ? "تشغيل محاكاة ومطابقة التحقيق بالنظام" : "Execute Compliance Investigation Simulation"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#020510] border border-white/10 rounded-xl p-4 flex flex-col justify-center text-right">
              {p21Result ? (
                p21Result.blocked ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded text-[10px]">
                    🚫 {p21Result.reason}
                  </div>
                ) : p21Result.frozen ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded text-[10px]">
                    ⚠️ {p21Result.reason}
                  </div>
                ) : (
                  <div className="space-y-3 text-right">
                    <div className="border-b border-white/5 pb-2 text-xs flex justify-between items-center">
                      <strong className="text-white">{isAr ? "نتائج تحقيق محرك الأدلة السيادي:" : "Sovereign Investigation Audit results:"}</strong>
                      <span className="text-emerald-400 font-extrabold text-[10px] font-mono">// C9 LEGI RECORDED</span>
                    </div>

                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded text-[10px] leading-relaxed">
                      <strong>{isAr ? "المادة المطبقة:" : "Statutory Article Linkage:"} </strong> {p21Result.targetArticle}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-400 block font-bold">// {isAr ? "الأدلة الرقمية التي تم سحبها برمجياً:" : "Programmatic evidence items parsed:"}</span>
                      <div className="flex flex-wrap gap-1">
                        {p21Result.compiledEvidence.map((ev: string, idx: number) => (
                          <span key={idx} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded font-bold text-[9px] text-gray-300">{ev}</span>
                        ))}
                        {p21Result.compiledEvidence.length === 0 && (
                          <span className="text-rose-400 text-[9.5px] font-bold">{isAr ? "لم يتم تحديد أي أدلة رقمية" : "Zero digital sources specified!"}</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded text-gray-300 text-[10px]">
                      <span className="font-bold text-[#D4AF37] block">✓ {isAr ? "توجيه إجرائي وقائي للجنة الامتثال:" : "Statutory hearing instructions:"}</span>
                      <p className="text-[9.5px] mt-1 leading-normal">{p21Result.regulationAction}</p>
                    </div>

                    <div className="bg-[#1c2541] p-2 rounded border border-white/5 font-mono text-[9px] text-left flex justify-between">
                      <span className="text-[#D4AF37]">{p21Result.c9Hash}</span>
                      <span className="text-gray-400">{isAr ? "محضر موثق في سجل المحاضر C9" : "Committed under SECURE BLOCKID in C9 ledger"}</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center text-gray-500 text-[10px]">
                  {isAr ? "الرجاء صياغة فرضيات التحقيق وتشغيل المطابقة لإصدار تقارير الإثبات المتقاطع السيادي." : "Verify target metrics guidelines, select programmatic indicators source and execute audit."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 22. IMAGE ANALYSIS LOGIC */}
        {activeTab === 21 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-12 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#D4AF37] font-bold block">// {isAr ? "22. بروتوكول فحص وتحليل الصور والمستندات" : "22. Image & Document Analysis Logic"}</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p22HasSovereignId} onChange={(e) => setP22HasSovereignId(e.target.checked)} className="accent-[#D4AF37]" />
                  <span className="text-[9px] text-[#D4AF37] font-mono">SOV_ID</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <span className="text-[9px] text-gray-400 block font-bold">// {isAr ? "تحديد المستند/الصورة للفحص التلقائي:" : "Select Image/File blueprint to inspect:"}</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: "injury_report_r12.jpg", format: "JPG" },
                      { name: "overtime_proof_c3.png", format: "PNG" },
                      { name: "attendance_tampered.tiff", format: "TIFF" }
                    ].map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setP22ImageName(img.name);
                          setP22Format(img.format);
                          if (img.name.includes("tampered")) {
                            setP22MetadataHealthy(false);
                            setP22OriginalVerified(false);
                            setP22GeoMatch(false);
                          } else {
                            setP22MetadataHealthy(true);
                            setP22OriginalVerified(true);
                            setP22GeoMatch(true);
                          }
                        }}
                        className={`p-2 rounded border transition text-left cursor-pointer ${
                          p22ImageName === img.name
                            ? "bg-[#D4AF37]/10 border-[#D4AF37] text-white"
                            : "bg-[#1c2541] border-white/10 text-gray-400 hover:border-white/20"
                        }`}
                      >
                        <span className="block font-bold text-[9px] truncate">{img.name}</span>
                        <span className="text-[7.5px] text-gray-500 font-mono block mt-0.5">{img.format} FILE</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5 bg-[#1c2541] p-2 rounded border border-white/5 text-[9.5px]">
                    <span className="text-[8px] text-gray-500 block font-bold">// {isAr ? "فحوص التحقق التلقائي للبيانات الوصفية (Exif Metadata Checks):" : "Optical Validation & Anti-Tampering Checklists:"}</span>
                    
                    <label className="flex items-center gap-2 cursor-pointer pb-0.5">
                      <input type="checkbox" checked={p22MetadataHealthy} onChange={(e) => setP22MetadataHealthy(e.target.checked)} className="accent-[#D4AF37]" />
                      <span className="text-gray-300">{isAr ? "سلامة البيانات التعريفية Exif وعدم تعديل التواريخ" : "Dates and timestamps in Exif metadata are unaltered"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer pb-0.5">
                      <input type="checkbox" checked={p22OriginalVerified} onChange={(e) => setP22OriginalVerified(e.target.checked)} className="accent-[#D4AF37]" />
                      <span className="text-gray-300">{isAr ? "شهادة صحة وتوقيع الكاميرا الرقمية سليمة" : "SHA250 digital trace of capture hardware verified"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={p22GeoMatch} onChange={(e) => setP22GeoMatch(e.target.checked)} className="accent-[#D4AF37]" />
                      <span className="text-gray-300">{isAr ? "مطابقة الإحداثيات الجغرافية لمقر العمل الرسمي" : "GPS coordinate tracking matches authorized corporate branch"}</span>
                    </label>
                  </div>

                  <div className="pt-1 select-none">
                    <div className="flex justify-between items-center text-[9px] text-gray-400 pb-0.5">
                      <span>{isAr ? "يقين إثبات التعرف البصري (عتبة الأمان 80%):" : "Optical recognition confidence metric:"}</span>
                      <span className="text-[#D4AF37] font-mono font-extrabold">{p22CertaintyScore}%</span>
                    </div>
                    <input type="range" min="50" max="100" value={p22CertaintyScore} onChange={(e) => setP22CertaintyScore(Number(e.target.value))} className="w-full h-1 bg-[#1c2541] rounded" />
                  </div>

                  <button
                    onClick={handleP22EvaluateImage}
                    className="w-full py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded text-[10px] cursor-pointer"
                  >
                    🔍 {isAr ? "فك وقراءة وثيقة الصورة والتأصيل نظامياً" : "Run Optical Verification & OCR Text Extraction"}
                  </button>
                </div>

                <div className="bg-[#020510] border border-white/10 rounded-xl p-4 flex flex-col justify-center text-right font-sans">
                  {p22Result ? (
                    p22Result.blocked ? (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded text-[10px]">
                        🚫 {p22Result.reason}
                      </div>
                    ) : p22Result.frozen ? (
                      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded text-[10px]">
                        ⚠️ {p22Result.reason}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="border-b border-white/5 pb-2 text-[10.5px] flex justify-between items-center">
                          <strong className="text-white">{isAr ? "تقرير تحليل الأدلة المصورة الفوري:" : "Image compliance verified response:"}</strong>
                          <span className="text-emerald-400 font-extrabold text-[9px] font-mono">// ANALYSIS SUCCESS</span>
                        </div>

                        <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 rounded text-[9.5px]">
                          <strong>✓ {isAr ? "نص OCR المستخرج:" : "OCR Extracted Text content:"}</strong>
                          <p className="text-gray-300 italic text-[9px] mt-1">{p22Result.extractionResult.ocrTexts}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[9px] text-[#D4AF37]">
                          <div className="bg-[#1c2541] p-1.5 rounded border border-white/5">
                            <span className="text-gray-400 block">{isAr ? "عدد الوجوه المكتشفة:" : "Biometric Faces Count:"}</span>
                            <strong>{p22Result.extractionResult.facesDetected} VERIFIED FACE</strong>
                          </div>
                          <div className="bg-[#1c2541] p-1.5 rounded border border-white/5">
                            <span className="text-gray-400 block">{isAr ? "الإحداثيات الجغرافية للكاميرا:" : "Camera GPS Stamps:"}</span>
                            <strong className="font-mono text-[8px]">{p22Result.extractionResult.geoCoordinates}</strong>
                          </div>
                        </div>

                        <div className="bg-[#1c2541] p-2 rounded border border-white/5 font-mono text-[9px] text-left flex justify-between">
                          <span className="text-emerald-400">{p22Result.c9Hash}</span>
                          <span className="text-gray-400">{isAr ? "سجل إثبات مادي بالصورة في C9" : "Committed Image Signature Code"}</span>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-center text-gray-500 text-[10px]">
                      {isAr ? "الرجاء اختيار مستند وفحص سلامة التلاعب للوصول لتحليلات الأبعاد والبيانات." : "Select document file from presets and click verify button to parse OCR & Metadata validations."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 23. OPERATIONAL RISKS */}
        {activeTab === 22 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#D4AF37] font-bold block">// {isAr ? "23. إدارة المخاطر والإنذار بالمنشأة" : "23. Operational Risks Auditor"}</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={p23HasSovereignId} onChange={(e) => setP23HasSovereignId(e.target.checked)} className="accent-[#D4AF37]" />
                  <span className="text-[9px] text-[#D4AF37] font-mono">SOV_ID</span>
                </label>
              </div>

              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[8.5px] text-gray-400 block font-bold">// {isAr ? "تصنيف المخاطر:" : "Risk Class Category:"}</span>
                    <select
                      value={p23RiskCategory}
                      onChange={(e) => setP23RiskCategory(e.target.value)}
                      className="w-full bg-[#1c2541] border border-white/10 rounded p-1 text-[9.5px] text-gray-300"
                    >
                      <option value="compliance">{isAr ? "مخاطر الالتزام والرواتب" : "Compliance & Wages"}</option>
                      <option value="personnel">{isAr ? "مخاطر الكوادر العقابية" : "Personnel Disciplinary"}</option>
                      <option value="procedural">{isAr ? "مخاطر التوثيق والبيانات" : "Procedural Document"}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8.5px] text-gray-400 block font-bold">// {isAr ? "نمط التدقيق:" : "Audit Mode:"}</span>
                    <select
                      value={p23ActionType}
                      onChange={(e) => setP23ActionType(e.target.value)}
                      className="w-full bg-[#1c2541] border border-white/10 rounded p-1 text-[9.5px] text-gray-300"
                    >
                      <option value="new_assess">{isAr ? "تقييم جديد" : "New Assessment"}</option>
                      <option value="review_current">{isAr ? "تدقيق سجل حالي" : "Review Current"}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#1c2541] p-2 rounded border border-white/5">
                  <div className="space-y-1">
                    <span className="text-[8px] text-gray-400 block font-bold">{isAr ? "المخالفات الجسيمة الموثقة:" : "Gross Violations Tracked:"}</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={p23GraveEventsCount}
                      onChange={(e) => setP23GraveEventsCount(Number(e.target.value))}
                      className="w-full bg-[#1c2541] border border-white/10 rounded p-1 text-center font-mono text-[10.5px] text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] text-gray-400 block font-bold">{isAr ? "نسبة الامتثال للأجور WPS:" : "WPS payroll ratio:"}</span>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={p23WpsScore}
                      onChange={(e) => setP23WpsScore(Number(e.target.value))}
                      className="w-full bg-[#1c2541] border border-white/10 rounded p-1 text-center font-mono text-[10.5px] text-white"
                    />
                  </div>
                </div>

                <div className="pt-1 select-none">
                  <div className="flex justify-between items-center text-[9px] text-gray-400 pb-0.5">
                    <span>{isAr ? "يقين البيانات المجمعة (الحد الأدنى 80%):" : "Certainty indicator confidence:"}</span>
                    <span className="text-[#D4AF37] font-mono font-extrabold">{p23CertaintyScore}%</span>
                  </div>
                  <input type="range" min="50" max="100" value={p23CertaintyScore} onChange={(e) => setP23CertaintyScore(Number(e.target.value))} className="w-full h-1 bg-[#1c2541] rounded" />
                </div>

                <button
                  onClick={handleP23EvaluateRisk}
                  className="w-full py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold rounded text-[10px] cursor-pointer"
                >
                  ⚠️ {isAr ? "تشخيص وحساب مستويات خطورة المنشأة" : "Evaluate & Calculate Risks Index"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#020510] border border-white/10 rounded-xl p-4 flex flex-col justify-center text-right font-sans">
              {p23Result ? (
                p23Result.blocked ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded text-[10px]">
                    🚫 {p23Result.reason}
                  </div>
                ) : p23Result.frozen ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded text-[10px]">
                    ⚠️ {p23Result.reason}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-b border-white/5 pb-2 text-[10.5px] flex justify-between items-center">
                      <strong className="text-white">{isAr ? "تقرير موازنة المخاطر والتدابير الاستباقية:" : "Dynamic Operational risk response scorecard:"}</strong>
                      <span className={`font-mono font-extrabold uppercase text-[10px] ${
                        p23Result.riskLevel === "critical"
                          ? "text-red-500"
                          : p23Result.riskLevel === "high"
                          ? "text-amber-500"
                          : p23Result.riskLevel === "medium"
                          ? "text-yellow-400"
                          : "text-emerald-400"
                      }`}>{p23Result.riskLevel} alert</span>
                    </div>

                    <div className="bg-white/[0.01] border border-white/5 p-2 rounded">
                      <span className="text-gray-400 block text-[8px]">{isAr ? "تعريف وتتبع الخطر المكتشف:" : "Vulnerability details identified:"}</span>
                      <strong className="text-gray-300 text-[9.5px] mt-1 block font-bold leading-normal">{p23Result.riskDescription}</strong>
                    </div>

                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded text-[9.5px]">
                      <strong className="block text-[#D4AF37] font-extrabold text-[10px]">{isAr ? "التوجيه السيادي المانع للغرامات والخسائر:" : "Preventative statutory mitigation plan directive:"}</strong>
                      <p className="mt-1 leading-normal text-gray-200">{p23Result.mitigationPlan}</p>
                    </div>

                    <div className="bg-[#1c2541] p-2 rounded border border-white/5 font-mono text-[9px] text-left flex justify-between">
                      <span className="text-amber-500">{p23Result.c9Hash}</span>
                      <span className="text-gray-400">{isAr ? "تم تسجيل تقييم الخطر ومطابقة الأثر في الـ C9" : "Logged in risk catalog in C9 ledgers"}</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center text-gray-500 text-[10px]">
                  {isAr ? "الرجاء اختيار معلمات قياس الخطورة والنظام لفرز نسب التعرض للغرامات." : "Input core risk matrices data such as WPS compliance, gross violation metrics & run diagnostic tool."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 24. SOVEREIGN NOTIFICATIONS */}
        {activeTab === 23 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <span className="text-[#D4AF37] font-bold block">// {isAr ? "24. الإشعارات والإنذار بالمسارك السيادية" : "24. Sovereign Alert & Triggers Dispatcher"}</span>
              
              <div className="space-y-2">
                <span className="text-[9px] text-gray-400 block font-bold">// {isAr ? "محددات تفعيل الإشعارات التلقائية:" : "Active Auto-Dispatch triggers configuration:"}</span>
                
                <div className="space-y-2.5 bg-[#1c2541] p-2.5 rounded border border-white/5 text-[9.5px]">
                  <label className="flex items-center justify-between cursor-pointer border-b border-white/5 pb-1.5 home-notif">
                    <span className="text-gray-300">{isAr ? "إنذار تدني نسبة الموثوقية (< 80%)" : "Certainty index falls below minimal 80%"}</span>
                    <input type="checkbox" checked={p24CertaintyTriggerActive} onChange={(e) => setP24CertaintyTriggerActive(e.target.checked)} className="accent-[#D4AF37]" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer border-b border-white/5 pb-1.5 home-notif">
                    <span className="text-gray-300">{isAr ? "إنذار تلاعب جغرافي (GPS Spoof)" : "GPS hardware geolocation spoof flag"}</span>
                    <input type="checkbox" checked={p24SpoofTriggerActive} onChange={(e) => setP24SpoofTriggerActive(e.target.checked)} className="accent-[#D4AF37]" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer border-b border-white/5 pb-1.5 home-notif">
                    <span className="text-gray-300">{isAr ? "إنذار مخالفة أركان في نظام الموارد" : "Labor standard compliance breach logged"}</span>
                    <input type="checkbox" checked={p24InfractionTriggerActive} onChange={(e) => setP24InfractionTriggerActive(e.target.checked)} className="accent-[#D4AF37]" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer border-b border-white/5 pb-1.5 home-notif">
                    <span className="text-gray-300">{isAr ? "إنذار تشغيل الفلتر الملكي 11438" : "Royal Filter 11438 correction window flag"}</span>
                    <input type="checkbox" checked={p24RoyalGraceTriggerActive} onChange={(e) => setP24RoyalGraceTriggerActive(e.target.checked)} className="accent-[#D4AF37]" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer home-notif">
                    <span className="text-gray-300">{isAr ? "إنذار تسييل المخاطر وخلل الـ WPS" : "WPS critical wage delays flag active"}</span>
                    <input type="checkbox" checked={p24IncidentTriggerActive} onChange={(e) => setP24IncidentTriggerActive(e.target.checked)} className="accent-[#D4AF37]" />
                  </label>
                </div>

                <button
                  onClick={handleP24TriggerEventSim}
                  className="w-full py-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-black font-extrabold rounded text-[10px] cursor-pointer transition-all"
                >
                  ⚡ {isAr ? "توليد ومحاكاة إشعارات سيادية جديدة" : "Dispatch & Simulate New Sovereign Alert"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#020510] border border-white/10 rounded-xl p-4 flex flex-col justify-between text-right font-sans">
              <div className="space-y-2 w-full">
                <div className="border-b border-white/5 pb-2 text-[10.5px] flex justify-between items-center">
                  <strong className="text-white font-extrabold">{isAr ? "سجل التنبيهات الموفدة وقيد الـ C9:" : "Active live notification logs array in C9 ledger:"}</strong>
                  <span className="text-amber-500 font-bold text-[9px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                    {p24Notifications.length} ALERTS ACTIVE
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {p24Notifications.map((notif) => (
                    <div key={notif.id} className="bg-white/[0.02] border border-white/5 rounded p-2 text-[9.5px] flex items-start justify-between gap-3 text-right">
                      <div className="space-y-0.5">
                        <strong className="text-red-400 font-extrabold font-sans inline-block">{notif.type}</strong>
                        <span className="text-gray-400 block font-bold text-[8.5px]">{notif.trigger}</span>
                        <p className="text-gray-300 text-[9px] mt-0.5 leading-normal">{notif.content}</p>
                      </div>
                      <div className="shrink-0 text-left font-mono">
                        <span className="text-gray-500 text-[8px] block">{notif.ts}</span>
                        <strong className="text-[#D4AF37] block text-[8px] mt-1">{notif.id}</strong>
                      </div>
                    </div>
                  ))}
                  {p24Notifications.length === 0 && (
                    <p className="text-center text-gray-500 p-8 text-[10px]">{isAr ? "لا توجد تنبيهات سيادية نشطة حالياً." : "No active alerts in dispatch log history."}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 25. 14 SOVEREIGN UNITS */}
        {activeTab === 24 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-12 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <span className="text-[#D4AF37] font-bold block">// {isAr ? "25. الوحدات التشغيلية السيادية الـ 14 المعتمدة" : "25. The 14 Standard Sovereign Operational Units"}</span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-5 space-y-1 max-h-64 overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { id: 0, ar: "وحدة إدارة الموارد الاستراتيجية", en: "Human Resources Strategy Unit", tag: "HR-01", db: "Employee Directory SQL" },
                      { id: 1, ar: "وحدة الضبط والتحقق المعياري", en: "Standard Checks & Tracing Unit", tag: "CHECK-02", db: "Regulatory Checkpoints C9" },
                      { id: 2, ar: "وحدة إدارة الأجور والبدلات", en: "Payroll & Benefits Sovereign Unit", tag: "PR-03", db: "National WPS Database" },
                      { id: 3, ar: "وحدة البصمة المكانية والجغرافية", en: "Sovereign Geo-Location Unit", tag: "GEO-04", db: "Coordinate Geofencing Ledger" },
                      { id: 4, ar: "وحدة التحقيق وصحة المحاضر", en: "Investigations & Hearings Unit", tag: "INV-05", db: "Investigations C9 Index" },
                      { id: 5, ar: "وحدة الختم الرقمي وحوكمة البيانات", en: "C9 Cryptographic Sealing Unit", tag: "SEAL-06", db: "Secure Blockchain C9 Ledger" },
                      { id: 6, ar: "وحدة مكافحة التلاعب والتحايل", en: "Anti-Spoofing & Auditing Unit", tag: "SPOOF-07", db: "Device Metadata Registry" },
                      { id: 7, ar: "وحدة إدارة إنهاء الخدمات والاستحقاق", en: "End of Service Sovereign Unit", tag: "EOS-08", db: "Saudi Labor Articles v2026" },
                      { id: 8, ar: "وحدة رصد الأجر والحدود الائتمانية", en: "WPS & Credit Monitoring Unit", tag: "WPS-09", db: "Saudi Central Bank Interconnect" },
                      { id: 9, ar: "وحدة إدارة الترقيات والمسارات الوظيفية", en: "Promotions & Career Units", tag: "PRO-10", db: "Appraisals & Core Metrics Logs" },
                      { id: 10, ar: "وحدة حوكمة العمليات والمسارات الثلاثة", en: "Three-Path Consensus Unit", tag: "PATH-11", db: "Database Synchronization Matrix" },
                      { id: 11, ar: "وحدة الدعم والتدخل والامتثال الطارئ", en: "Sovereign Intervention Unit", tag: "INT-12", db: "Emergency Compliance Triggers" },
                      { id: 12, ar: "وحدة الفلتر الملكي والحماية الإنسانية", en: "Royal Filter 11438 Protection Unit", tag: "ROYAL-13", db: "Labor Protection Ordinances" },
                      { id: 13, ar: "وحدة إدارة الأصول والملفات المركزية", en: "Sovereign Digital Asset & Files Unit", tag: "FILE-14", db: "Decentralized File Storage Protocol" }
                    ].map((unit) => (
                      <button
                        key={unit.id}
                        onClick={() => setP25SelectedUnit(unit.id)}
                        className={`p-2 rounded text-right transition border cursor-pointer flex justify-between items-center ${
                          p25SelectedUnit === unit.id
                            ? "bg-[#D4AF37]/10 border-[#D4AF37] text-white"
                            : "bg-[#1c2541] border-white/5 text-gray-400 hover:border-white/10"
                        }`}
                      >
                        <div className="truncate">
                          <strong className="block text-[9.5px]/none truncate">{isAr ? unit.ar : unit.en}</strong>
                          <span className="text-[7.5px] text-gray-500 font-mono block mt-1">{unit.db}</span>
                        </div>
                        <span className="text-[8px] bg-white/5 border border-white/10 font-mono block px-1 rounded shrink-0">{unit.tag}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-1 bg-[#020510] border border-white/10 p-4 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="border-b border-white/5 pb-2">
                      <strong className="text-white text-[10.5px] block">{isAr ? "تعليق المرجعية السيادية للوحدة:" : "Sovereign unit configuration detail:"}</strong>
                      <span className="text-[8px] text-yellow-500 font-mono block mt-0.5">ACTIVE & RE-ROUTE READY</span>
                    </div>

                    <p className="text-[10px] text-gray-300 mt-2.5 leading-relaxed">
                      {isAr
                        ? `تمثل هذه الوحدة ذراع الحوكمة التقنية والارتباط المباشر بقوانين المملكة. توفر حماية مادية ومطابقة أجر كاملة وتوثق المتبوع مباشرة بقيد C9 وتدقق مستويات الثقة قبل اعتماد أي جزاء أو قرار نهائي.`
                        : `This specialized unit handles advanced metadata auditing and direct connectivity with Middle East statutory standards. It integrates closely with the C9 cryptographic distributed block index.`}
                    </p>
                  </div>

                  <div className="bg-[#1c2541]/55 p-2 rounded border border-white/5 text-[9px] text-gray-400 space-y-1">
                    <div>
                      <span className="text-[8px] text-yellow-500 block">{isAr ? "مجرى البيانات المعتمد:" : "Bound Database System:"}</span>
                      <strong className="font-mono text-gray-200">
                        {p25SelectedUnit === 0 && "dbo.employees_sql_v"}
                        {p25SelectedUnit === 1 && "dbo.checkpoint_audit_ledger"}
                        {p25SelectedUnit === 2 && "wps_compliance_index_table"}
                        {p25SelectedUnit === 3 && "coordinate_geofence_log"}
                        {p25SelectedUnit === 4 && "investigation_c9_indices"}
                        {p25SelectedUnit === 5 && "blockchain_immutable_c9"}
                        {p25SelectedUnit === 6 && "exif_metadata_device_db"}
                        {p25SelectedUnit === 7 && "saudi_labor_code_lex"}
                        {p25SelectedUnit > 7 && "sovereign_internal_ledger_c9"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 26. SUPREME SOVEREIGN PRINCIPLES */}
        {activeTab === 25 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-12 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4">
              <span className="text-[#D4AF37] font-bold block">// {isAr ? "26. المبادئ السيادية العليا ومحاكمة العمليات" : "26. Dynamic Sovereign Core Directives & Principles"}</span>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  {
                    title: isAr ? "السيادة المطلقة للدولة" : "Absolute Rule of Labor Law",
                    desc: isAr ? "لا يعتد في نظام LEXI بأي لوائح أو عقوبات أو قرارات داخلية للمنشأة تخالف صخرة مواد الأنظمة السعودية ووزارة الموارد البشرية." : "Local employee Handbooks or penalties that conflict with standard Saudi labor rules are dynamically bypassed and flagged.",
                    principle: "المادة الأولى"
                  },
                  {
                    title: isAr ? "أولوية مهلة ورحمة الفرد" : "Humanitarian Correction Grace first",
                    desc: isAr ? "لا يُقيد الفلتر الملكي 11438 أي قرار عقابي سلبي موجه للموظف دون منحه فرصة تصحيحية وإخطاراً مكتوباً صالحاً لمدة 3 أيام." : "Enforced through Royal Filter 11438: protects workers from lightning salary cuts by inserting a 3-day buffer.",
                    principle: "الفلتر 11438"
                  },
                  {
                    title: isAr ? "شروط ويقين الإثبات المطلق" : "Absolute Evidence Certainty Level",
                    desc: isAr ? "تجميد شامل لقرارات ولجان الحذف والقطع ما لم تبلغ ثقة القرائن والمستخرجات البصرية والوصفية عتبة اليقين الحاسمة البالغة 80%." : "Any violation profile with combined verification certainty metrics lower than 80% is locked and routed to the Founder.",
                    principle: "الاستدلالي الـ 80"
                  },
                  {
                    title: isAr ? "بروتوكول تدرج الإجراء وتلازمه" : "The Three-Path Consensus Standard",
                    desc: isAr ? "المطابقة المتقاطعة الإلزامية في قيد C9 بين مسار النص (اللوائح) ومسار الإجراء (التدرج والتحقيق) ومسار الواقع المادي." : "No decision can stand unless verified simultaneously across three independent lanes (Textual, Procedural, and Material).",
                    principle: "المسارات الـ 3"
                  }
                ].map((princ, idx) => (
                  <div key={idx} className="bg-[#1c2541] border border-white/5 rounded-xl p-3 flex flex-col justify-between hover:border-[#D4AF37]/35 transition-all">
                    <div>
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <strong className="text-white text-[10px]">{princ.title}</strong>
                        <span className="text-[#D4AF37] font-mono text-[8px] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded uppercase">{princ.principle}</span>
                      </div>
                      <p className="text-[9px] text-gray-400 mt-2 leading-relaxed">{princ.desc}</p>
                    </div>
                    <div className="text-left mt-2.5">
                      <span className="text-[8px] text-gray-500">// Sovereign Constitution v2.26</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 27. SOVEREIGN OPERATIONAL MAP */}
        {activeTab === 26 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-sans text-xs">
            <div className="lg:col-span-12 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4">
              <span className="text-[#D4AF37] font-bold block">// {isAr ? "27. الخريطة المادية ومسار تدفق العمليات السيادية" : "27. Interactive Sovereign Transaction Flowchart Map"}</span>
              
              <div className="bg-[#1c2541] border border-white/5 p-4 rounded-xl flex flex-col items-center">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full max-w-3xl pb-4 border-b border-white/5">
                  {[
                    { id: "operational", ar: "1. العملية التشغيلية", en: "1. Client Operations", desc: isAr ? "تسجيل الحضور والغياب وصيانة عقود الموظفين" : "Coworker check-in logging or raw payroll updates" },
                    { id: "consensus", ar: "2. فحص المسارات الثلاثة", en: "2. Three-Path Consensus", desc: isAr ? "توفيق البينات بين مسار النص والإجراء المادي" : "Exponents textual, procedural & physical logs" },
                    { id: "royal", ar: "3. مرشح الفلتر الملكي", en: "3. Royal Filter Buffer", desc: isAr ? "حماية وحسم التجاوزات السلوكية بمستند 3 أيام" : "Grants warning grace if minor infractions trigger" },
                    { id: "c9", ar: "4. الختم في سجل C9 Ledger", en: "4. C9 Immutable Ledger", desc: isAr ? "الحفظ بالتشفير النهائي في بلوكشين الالتزام" : "Sealed and cryptographically indexed in ledger" }
                  ].map((stage) => (
                    <button
                      key={stage.id}
                      onClick={() => setP27SelectedStage(stage.id)}
                      className={`p-2.5 rounded-xl border text-right transition cursor-pointer relative ${
                        p27SelectedStage === stage.id
                          ? "bg-[#D4AF37]/10 border-[#D4AF37] text-white"
                          : "bg-[#1c2541] border-white/5 text-gray-400 hover:border-white/10"
                      }`}
                    >
                      <strong className="block text-[10px]">{isAr ? stage.ar : stage.en}</strong>
                      <p className="text-[8.5px] text-gray-400 mt-1 leading-normal truncate">{stage.desc}</p>
                      {p27SelectedStage === stage.id && (
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#D4AF37] rotate-45" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-4 text-center max-w-xl">
                  <strong className="text-yellow-500 font-extrabold text-[11px] block">
                    {isAr ? "تحليل مسار البيانات النشطة للفقرة المختارة:" : "Selected dynamic pipeline stage response metadata:"}
                  </strong>
                  
                  <p className="text-[10px] text-gray-200 mt-2 leading-relaxed">
                    {p27SelectedStage === "operational" && (isAr
                      ? "المرحلة الأولى: تقع هذه الخطوة في نطاق حاسم لنظام LEXI لاستخلاص وتغذية البصمات المكانية OCR وعقود وسلوكيات الموظف الجسيمة أو الطفيفة."
                      : "Stage 1: Extracts parameters in real time (biometrics, photos, OCR, checkin times, contract definitions) to calculate inputs.")}
                    {p27SelectedStage === "consensus" && (isAr
                      ? "المرحلة الثانية: تشترط مطابقة صارمة لجميع المسارات: مسير نظام العمل ومسير صحة الإجراء وعقود الموظفين من واقع البينة المادية."
                      : "Stage 2: Runs programmatic validation ensuring absolute parity between statutory Middle East regulations, HR step histories, and real material facts.")}
                    {p27SelectedStage === "royal" && (isAr
                      ? "المرحلة الثالثة: يتم تفعيل الفلتر الملكي 11438 لمنع قرارات لجان الرواتب الخاطئة وتوفير مهلة 3 أيام تصحيحية بنص قانوني صريح."
                      : "Stage 3: Employs the Royal Filter 11438 security check. It shields from immediate arbitrary deductions by introducing a 3-day correction buffer.")}
                    {p27SelectedStage === "c9" && (isAr
                      ? "المرحلة الرابعة: تشفير البينات المتطابقة وإصدار وبث رمز الالتزام (C9 Audit Hash) النهائي الذي يمنع أي غرامات حكومية مستقبلية."
                      : "Stage 4: Successfully hashes variables to produce a final, unalterable C9 Seal. Fully audit-ready for national inspections.")}
                  </p>

                  <div className="font-mono text-[8px] text-gray-500 mt-3 block">
                    {isAr ? "مسلك معتمد من مركز عمليات النزاعات التنظيمية" : "Verified flow matching Ministry of Human Resources regulatory standards"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 28. SOVEREIGN AUTO‑DOCUMENTATION ENGINE (SADE) */}
        {activeTab === 27 && (
          <SovereignAutoDocumentationEngine
            lang={lang}
            pushNewC9Event={pushNewC9Event}
            c9Events={c9Events}
          />
        )}

      </div>
    </div>
  );
}
