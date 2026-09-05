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

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: "7009418374",
    name: "مجموعة قصر الأغذية للضيافة F&B",
    crNumber: "1010776451",
    email: "ops@foodpalace.sa",
    sector: "قطاع الأغذية والضيافة F&B",
    tier: "سيادي مبارك",
    onboardedAt: "2026-02-12",
    status: "active"
  },
  {
    id: "7001092837",
    name: "شركة الحصن الموحد للمقاولات العامة",
    crNumber: "2050114923",
    email: "info@alhosncorp.sa",
    sector: "المقاولات والإنشاءات",
    tier: "مؤسسي متقدم",
    onboardedAt: "2026-03-05",
    status: "active"
  },
  {
    id: "7005432109",
    name: "مؤسسة منافذ التجزئة للاتصالات",
    crNumber: "1010993012",
    email: "retail_ops@manafidh.sa",
    sector: "التجزئة والتموين",
    tier: "رقابة أساسية",
    onboardedAt: "2026-04-18",
    status: "active"
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "EMP-401",
    name: "سليمان بن خالد الخالدي",
    nationalId: "1098822334",
    email: "s.khaledi@foodpalace.sa",
    role: "مدير صيانة الفروع والتموين",
    entityId: "7009418374",
    entityName: "مجموعة قصر الأغذية للضيافة F&B",
    joinedAt: "2025-01-01"
  },
  {
    id: "EMP-402",
    name: "م. فيصل بن فهد العتيبي",
    nationalId: "1023344556",
    email: "faisal.f@foodpalace.sa",
    role: "مشرف التشغيل والصحة والسلامة",
    entityId: "7009418374",
    entityName: "مجموعة قصر الأغذية للضيافة F&B",
    joinedAt: "2025-03-12"
  },
  {
    id: "EMP-403",
    name: "عبدالمحسن بن هويمل",
    nationalId: "1034455667",
    email: "abdulmohsen@alhosncorp.sa",
    role: "مهندس سلامة مواقع إنشائية",
    entityId: "7001092837",
    entityName: "شركة الحصن الموحد للمقاولات العامة",
    joinedAt: "2025-05-10"
  },
  {
    id: "EMP-404",
    name: "خالد بن صالح الحربي",
    nationalId: "1045566778",
    email: "k.harbi@manafidh.sa",
    role: "أخصائي مبيعات وكاشير معتمد",
    entityId: "7005432109",
    entityName: "مؤسسة منافذ التجزئة للاتصالات",
    joinedAt: "2025-06-20"
  }
];

export const INITIAL_CITATIONS: Citation[] = [
  {
    id: "CIT-001",
    entityId: "7009418374",
    entityName: "مجموعة قصر الأغذية للضيافة F&B",
    employeeName: "سليمان بن خالد الخالدي",
    type: "تنبيه عدم مطابقة السلوك المكاني (Geofence Deviation Warning)",
    details: "رصد خروج مؤقت عن حدود فرع الدمام الشرقي بمسافة 150 متر لغرض توريد اللوازم العاجلة.",
    impactLevel: "منخفض الأثر",
    status: "مقبول التسوية",
    issuedAt: "2026-05-15 09:30:00"
  },
  {
    id: "CIT-002",
    entityId: "7001092837",
    entityName: "شركة الحصن الموحد للمقاولات العامة",
    employeeName: "عبدالمحسن بن هويمل",
    type: "إنذار غياب أدوات الوقاية المهنية بالموقع (Occupational Safety Warning)",
    details: "رصد عابر لثلاثة عمال في موقع حفريات العزيزية دون ارتداء خوذ السلامة والسترات الفسفورية.",
    impactLevel: "عالي الأثر",
    status: "قيد المراجعة",
    issuedAt: "2026-05-20 14:15:00"
  },
  {
    id: "CIT-003",
    entityId: "7005432109",
    entityName: "مؤسسة منافذ التجزئة للاتصالات",
    employeeName: "خالد بن صالح الحربي",
    type: "مخالفة تجاوز ساعات العمل الرسمية (Working Hours Violation)",
    details: "رصد تشغيل الكاشير خارج الساعات الرسمية دون رخصة تشغيل إضافية بلدي سارية.",
    impactLevel: "متوسط الأثر",
    status: "قيد المراجعة",
    issuedAt: "2026-05-22 22:45:00"
  }
];

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
