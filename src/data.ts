export interface CrowdsourceEntry {
  id: string;
  orgName: string;
  sector: string;
  employeeCount: number;
  challenges: string;
  usesDigitalSystem: string;
  email: string;
  phone: string;
  submittedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  crNumber: string;
  email?: string;
  sector: string;
  tier: "سيادي مبارك" | "مؤسسي متقدم" | "رقابة أساسية";
  onboardedAt: string;
  status?: string;
  employeesCount?: number;
  sovereignId?: string;
}

export interface Employee {
  id: string;
  name: string;
  nationalId: string;
  email: string;
  role: string;
  jobTitle?: string;
  entityId: string;
  entityName: string;
  joinedAt?: string;
  employmentStatus?: "active" | "terminated";
  terminationDate?: string;
  iqamaExpiryDate?: string;
  sovereignId?: string;
  approvedByOrgAdmin?: boolean;
  approvedByFounder?: boolean;
  branch?: string;
  branchId?: string;
}

export interface Citation {
  id: string;
  entityId?: string;
  entityName: string;
  employeeName: string;
  type: string;
  violationType?: string;
  details: string;
  impactLevel: "عالي الأثر" | "متوسط الأثر" | "منخفض الأثر";
  status: "قيد المراجعة" | "تم الاستئناف" | "مقبول التسوية" | "مرفوض";
  issuedAt: string;
  markdownContent?: string;
  sourceType?: "ORG_INTERNAL" | "GOVERNMENT";
  citationReportNumber?: string;
  citationDocumentUrl?: string;
  govAuthority?: "MHRSD" | "Balady" | "GOSI" | "ZATCA" | "CivilDefense";
}

export interface Appeal {
  id: string;
  entityId?: string;
  citationId: string;
  employeeName: string;
  grounds: string;
  status: "قيد التدقيق" | "تم قبول العذر" | "مرفوض مع التخفيف" | "مرفوض كليا";
  submittedAt: string;
  markdownContent?: string;
}

export const INITIAL_CROWDSOURCE_ENTRIES: CrowdsourceEntry[] = [];

// Empty initial arrays - all live data is loaded exclusively from Firestore and authenticated entities
export const INITIAL_ORGANIZATIONS: Organization[] = [];
export const INITIAL_EMPLOYEES: Employee[] = [];
export const INITIAL_CITATIONS: Citation[] = [];

export const VIDEO_SCRIPT_PAGES = [
  {
    sec: "0 - 10",
    title: "المشكلة: فجوة الامتثال والعمليات التقليدية",
    narration: "هل تعلم أن 65٪ من المنشآت والشركات اليوم تواجه غرامات وأعباءً تنظيمية قاسية بسبب فجوة الامتثال اللحظي وسجلات حضور الموظفين اليدوية المبعثرة؟ الحوكمة الورقية والتعامل البطيء يدمران مرونة ونمو الأعمال الحديثة.",
    visuals: "العرض البصري: شاشة معتمة مظلمة تتطاير فيها ملفات ورقية قديمة وملفات إكسل مبعثرة مع ظهور مؤشرات خطوط حمراء متصاعدة بالخسائر وأرقام الغرامات بدقة ثواني متتالية.",
    focus: "المشكلة الرقابية"
  },
  {
    sec: "10 - 20",
    title: "الحل: LexOps Sovereign OS",
    narration: "يرحب بكم LexOps Sovereign OS – أول نظام تشغيل سيادي يحول نصوص القانون الطويلة وسياسات الحوكمة المعقدة إلى كود برمجى ذكي، تفاعلي ومستمر يسري تلقائياً في شرايين عمليات جهتك الفورية!",
    visuals: "العرض البصري: شعار ميزان العدالة يتحد مع خطوط اللوحة الأم الإلكترونية والدوائر بوميض ذهبي ساحر، لتتحول الشاشة إلى واجهة سوداء بالكامل وتتوزع من الميزان أشرطة ذهبية دافئة.",
    focus: "السيادة والامتثال"
  },
  {
    sec: "20 - 30",
    title: "كيف يعمل: ترابط لحظي حكيم",
    narration: "ببساطة متناهية؛ سجل منشأتك لتفعيل لوحة التحكم، وثبّت حضور موظفيك الذكي عبر التحقق البيومتري الجغرافي المعزز بالأقمار، ليقوم النظام تلقائياً برصد أي حيود وصياغة المخالفات أو ممرات الدفاع الإستراتيجي بدعم وكيلنا القانوني الذكي.",
    visuals: "العرض البصري: انسياب واجهات سريعة ثلاثية الأبعاد: تسجيل شركة ➔ تحقق حضور على خريطة دائرية ➔ صدور نموذج المخالفة بضغطة زر ➔ تقارير الوكيل الذكي.",
    focus: "حوكمة لحظية"
  },
  {
    sec: "30 - 45",
    title: "التأثير ودعوة عاجلة للتسجيل",
    narration: "مستقبل الامتثال هو الحوكمة اللحظية المبرمجة؛ مرونة غير مسبوقة، صفر غرامات تشغيلية، وسيادة كاملة لبياناتك وجهود منسوبيك. سجل منشأتك معنا الآن في نموذج التعهيد الجماعي وانطلق بامتثالك إلى فضاء السيادة المطلقة!",
    visuals: "العرض البصري: وميض ذهبي معزز يحيط بزر 'سجل منشأتك الآن'، متبوعاً بمعلومات تواصل مبهجة وحوائط امتثال سيادي تضيء باللون الأزرق الملوكي والذهبي الخالص.",
    focus: "دعوة ومستقبل واعد"
  }
];

export const CROWDSOURCE_STRATEGY = [
  {
    phase: "الأولى: النشر وصناعة التوعية (Publish & Outsource)",
    items: [
      "إطلاق هذا النموذج الأولي Sovereign Portal ومشاركته مع المستشارين القانونيين وصناع القرار بالشركات والمؤسسات السعودية.",
      "توعية المستهدفين بمخاطر الالتزام السلبي من خلال حملات تسويقية تركز على مفهوم 'الحوكمة ككود برمجي' (Law as Code).",
      "نشر رابط نموذج التعهيد الجماعي من خلال مجتمعات التمويل، الحوكمة الرقمية، وغرف التجارة القانونية."
    ]
  },
  {
    phase: "الثانية: تعهيد وجمع البيانات التحديات الرقابية",
    items: [
      "استقبال ردود الشركات والمنشآت على الأسئلة السبعة الاستراتيجية المقررة بالنموذج.",
      "تخزين وتصنيف الصعوبات حسب نوع قطاع المستفيد (لوجستي، إنشائي، مالي، طبي) لقياس مدى تكرار العوائق ومعدل الموظفين.",
      "بناء شبكة تواصل واعدة مع مسؤولي الامتثال المتفاعلين داخل النموذج للحصول على شراكات استباقية للمرحلة التجريبية وبيان الاحتياج."
    ]
  },
  {
    phase: "الثالثة: التوليد الاستباقي للحلول وتحفيز الامتثال",
    items: [
      "استخدام الوكيل الذكي (Sovereign OS AI-Agent) لتحويل الأرقام المجمعة والصعوبات المدخلة إلى اقتراحات مرنة ومشاريع لحماية السوق.",
      "تحديث لوحة الحوكمة العامة بانتظام لعرض 'مؤشر الامتثال الوطني السيادي' وجلب الثقة كمنظومة داعمة للتشريعات وعقود العمل واللوائح.",
      "صناعة شراكات وعقد لقاءات رسمية مع لجان مراجعة الأنظمة بوزارة الموارد البشرية والامتثال التقني لتصميم النماذج المعتمدة رسمياً."
    ]
  }
];
