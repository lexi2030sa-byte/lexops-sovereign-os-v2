import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, 
  FileText, 
  Users, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Cpu, 
  ChevronRight, 
  ChevronLeft, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Scale, 
  Calendar,
  CheckCircle2,
  Info
} from "lucide-react";

// ============================================================================
// 1. Day One Setup Wizard Component
// ============================================================================
interface SovereignSetupWizardProps {
  lang: "ar" | "en";
  currentUser: any;
  onComplete: (setupData: {
    facilityName: string;
    sector: string;
    baladyLicense: string;
    licenseExpiry: string;
    zatcaTaxNum: string;
    employeeCount: number;
    branches: string[];
  }) => void;
}

export function SovereignSetupWizard({ lang, currentUser, onComplete }: SovereignSetupWizardProps) {
  const isAr = lang === "ar";
  const [step, setStep] = useState<number>(1);
  const [facilityName, setFacilityName] = useState<string>(currentUser?.entityName || "منشأة الامتثال النموذجية");
  const [sector, setSector] = useState<string>("قطاع الأغذية والضيافة F&B");
  const [baladyLicense, setBaladyLicense] = useState<string>("BL-45920-2026");
  const [licenseExpiry, setLicenseExpiry] = useState<string>("2027-06-15");
  const [zatcaTaxNum, setZatcaTaxNum] = useState<string>("300012345600003");
  const [employeeCount, setEmployeeCount] = useState<number>(18);
  const [branchInput, setBranchInput] = useState<string>("");
  const [branches, setBranches] = useState<string[]>([
    "فرع الرياض - السليمانية (الرئيسي)",
    "فرع جدة - شارع التحلية"
  ]);

  const addBranch = () => {
    if (branchInput.trim() && !branches.includes(branchInput.trim())) {
      setBranches([...branches, branchInput.trim()]);
      setBranchInput("");
    }
  };

  const removeBranch = (index: number) => {
    setBranches(branches.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete({
        facilityName,
        sector,
        baladyLicense,
        licenseExpiry,
        zatcaTaxNum,
        employeeCount,
        branches
      });
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4 relative antialiased select-none" style={{ direction: "rtl" }}>
      {/* Dynamic Cyber-Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-5 z-0">
        <svg width="100%" height="100%">
          <pattern id="wizard-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D4AF37" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#wizard-grid)" />
        </svg>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-slate-950 border-2 border-[#D4AF37] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.15)] relative z-10"
      >
        {/* Top Gold Gradient Bar */}
        <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-[#D4AF37] to-yellow-600"></div>

        {/* Content Wrapper */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/25 mb-1 animate-pulse">
              <Scale className="w-7 h-7 text-[#D4AF37]" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              🛠️ تهيئة بيانات اليوم الأول والربط السيادي للامتثال
            </h2>
            <p className="text-xs text-gray-400">
              يرجى إدخال البيانات الإلزامية لتفعيل محركات الضبط والذكاء السيادي LEXI وحساب المؤشرات بدقة.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between px-2 max-w-md mx-auto relative pt-4">
            <div className="absolute top-[34px] left-0 right-0 h-0.5 bg-slate-800 z-0"></div>
            <div 
              className="absolute top-[34px] right-0 h-0.5 bg-[#D4AF37] z-0 transition-all duration-300" 
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            ></div>

            {/* Step 1 Bubble */}
            <div className="flex flex-col items-center gap-1.5 relative z-10">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                step >= 1 ? "bg-[#1c2541] border-[#D4AF37] text-[#D4AF37]" : "bg-slate-900 border-slate-700 text-slate-500"
              }`}>
                1
              </div>
              <span className={`text-[10px] font-bold ${step >= 1 ? "text-white" : "text-slate-500"}`}>نشاط المنشأة</span>
            </div>

            {/* Step 2 Bubble */}
            <div className="flex flex-col items-center gap-1.5 relative z-10">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                step >= 2 ? "bg-[#1c2541] border-[#D4AF37] text-[#D4AF37]" : "bg-slate-900 border-slate-700 text-slate-500"
              }`}>
                2
              </div>
              <span className={`text-[10px] font-bold ${step >= 2 ? "text-white" : "text-slate-500"}`}>تراخيص بلدي وزكاة</span>
            </div>

            {/* Step 3 Bubble */}
            <div className="flex flex-col items-center gap-1.5 relative z-10">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                step >= 3 ? "bg-[#1c2541] border-[#D4AF37] text-[#D4AF37]" : "bg-slate-900 border-slate-700 text-slate-500"
              }`}>
                3
              </div>
              <span className={`text-[10px] font-bold ${step >= 3 ? "text-white" : "text-slate-500"}`}>الكادر والفروع</span>
            </div>
          </div>

          {/* Form Step Contents */}
          <div className="pt-4 min-h-[220px]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-bold block flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>اسم المنشأة التجاري (المطابق للسجل):</span>
                    </label>
                    <input 
                      type="text" 
                      value={facilityName} 
                      onChange={(e) => setFacilityName(e.target.value)}
                      className="w-full text-sm bg-[#1c2541] border border-white/10 p-3 rounded-lg text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none"
                      placeholder="أدخل اسم المنشأة الكامل"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-bold block flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>نشاط المنشأة الرئيسي (لتخصيص لوائح ومحركات الامتثال):</span>
                    </label>
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full text-sm bg-[#1c2541] border border-white/10 p-3 rounded-lg text-white focus:border-[#D4AF37] outline-none"
                    >
                      <option value="قطاع الأغذية والضيافة F&B">🍔 قطاع الأغذية والضيافة والتقديم الفوري (F&B)</option>
                      <option value="التجارة والتجزئة والأسواق">🛍️ قطاع التجارة والتجزئة والمجمعات الاستهلاكية</option>
                      <option value="المقاولات والإنشاءات والمباني">🏗️ قطاع المقاولات والإنشاءات والمقالع</option>
                      <option value="الخدمات اللوجستية والنقل والتخزين">🚚 قطاع الخدمات اللوجستية والنقل والتوصيل السريع</option>
                      <option value="تقنية المعلومات والاتصالات">💻 قطاع الاتصالات والتقنية الرقمية والذكاء الاصطناعي</option>
                      <option value="الخدمات الصحية والعيادات والمجمعات">🏥 قطاع الرعاية الطبية والخدمات الصحية والصيدلانية</option>
                    </select>
                  </div>

                  <div className="p-3 bg-blue-950/20 border border-blue-500/10 rounded-lg">
                    <p className="text-[10px] text-gray-300 leading-relaxed text-right">
                      💡 اختيار النشاط الصحيح يساعد محرك <strong>LEXI</strong> على مطابقة التصنيف الوطني الموحد للأنشطة الاقتصادية <strong>(ISIC4)</strong> بدقة متناهية وإدراج متطلبات وزارة البلديات والموارد البشرية الخاصة بقطاعك.
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-bold block flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>رقم رخصة بلدي الموحدة (Balady):</span>
                      </label>
                      <input 
                        type="text" 
                        value={baladyLicense} 
                        onChange={(e) => setBaladyLicense(e.target.value)}
                        className="w-full text-sm bg-[#1c2541] border border-white/10 p-3 rounded-lg text-white font-mono focus:border-[#D4AF37] outline-none"
                        placeholder="مثال: BL-12345"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-bold block flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>تاريخ انتهاء الرخصة البلدية:</span>
                      </label>
                      <input 
                        type="date" 
                        value={licenseExpiry} 
                        onChange={(e) => setLicenseExpiry(e.target.value)}
                        className="w-full text-sm bg-[#1c2541] border border-white/10 p-3 rounded-lg text-white font-mono focus:border-[#D4AF37] outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-bold block flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>الرقم الضريبي الموحد لهيئة الزكاة والضريبة (ZATCA):</span>
                    </label>
                    <input 
                      type="text" 
                      maxLength={15}
                      value={zatcaTaxNum} 
                      onChange={(e) => setZatcaTaxNum(e.target.value)}
                      className="w-full text-sm bg-[#1c2541] border border-white/10 p-3 rounded-lg text-white font-mono focus:border-[#D4AF37] outline-none"
                      placeholder="مثال: 300012345600003"
                    />
                  </div>

                  <div className="p-3 bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-lg text-right">
                    <p className="text-[10px] text-amber-300">
                      🔒 حماية وتشفير: كافة أرقام التراخيص يتم مطابقتها بسجل التشفير السيادي C9 Ledger لضمان سرية البيانات ومرور آمن عبر بوابات الهوية الرقمية الحكومية.
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center flex-row-reverse">
                      <span className="text-xs text-yellow-400 font-mono font-bold">{employeeCount} موظفاً</span>
                      <label className="text-xs text-gray-400 font-bold flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>حجم الكادر البشري التقريبي بالمنشأة:</span>
                      </label>
                    </div>
                    <input 
                      type="range" 
                      min={1} 
                      max={100}
                      value={employeeCount} 
                      onChange={(e) => setEmployeeCount(Number(e.target.value))}
                      className="w-full accent-[#D4AF37] bg-slate-800 h-2 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-bold block flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>قائمة الفروع والمواقع التشغيلية:</span>
                    </label>
                    
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={branchInput}
                        onChange={(e) => setBranchInput(e.target.value)}
                        placeholder="مثال: فرع المنطقة الشرقية - الدمام"
                        className="flex-1 text-xs bg-[#1c2541] border border-white/10 p-2.5 rounded-lg text-white"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBranch(); } }}
                      />
                      <button
                        type="button"
                        onClick={addBranch}
                        className="bg-[#D4AF37] hover:bg-yellow-500 text-black px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة فرع</span>
                      </button>
                    </div>

                    <div className="max-h-[85px] overflow-y-auto border border-white/5 rounded-lg p-2 bg-[#1c2541] space-y-1.5">
                      {branches.length === 0 ? (
                        <p className="text-[10px] text-gray-500 text-center py-2">لا توجد فروع مدرجة حالياً. الرجاء إضافة فرع واحد على الأقل.</p>
                      ) : (
                        branches.map((br, index) => (
                          <div key={index} className="flex justify-between items-center bg-white/5 p-1.5 rounded border border-white/5 flex-row-reverse text-xs">
                            <span className="text-gray-300 font-medium">{br}</span>
                            <button
                              onClick={() => removeBranch(index)}
                              className="text-red-400 hover:text-red-300 p-0.5 rounded hover:bg-red-500/10 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/10 flex justify-between items-center flex-row-reverse">
            <button
              onClick={handleNext}
              disabled={step === 3 && branches.length === 0}
              className={`px-6 py-2.5 rounded-lg font-black text-xs transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                step === 3 && branches.length === 0
                  ? "bg-slate-800 text-slate-500 border border-slate-700 pointer-events-none"
                  : "bg-[#D4AF37] hover:bg-yellow-500 text-black shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-[1.02]"
              }`}
            >
              <span>{step === 3 ? "تأكيد وتفعيل الامتثال السيادي 🚀" : "التالي"}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>

            {step > 1 && (
              <button
                onClick={handlePrev}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-5 py-2.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}


// ============================================================================
// 2. Interactive Onboarding Tour Component
// ============================================================================
interface OnboardingStep {
  targetId: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  highlightClass?: string;
}

interface SovereignOnboardingTourProps {
  lang: "ar" | "en";
  onDismiss: () => void;
}

export function SovereignOnboardingTour({ lang, onDismiss }: SovereignOnboardingTourProps) {
  const isAr = lang === "ar";
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const steps: OnboardingStep[] = [
    {
      targetId: "compliance-panel",
      titleAr: "لوحة التحكم والامتثال الذكي (Sovereign Dashboard)",
      titleEn: "Sovereign Compliance Dashboard",
      descAr: "قمر قيادتك السيادي لمراقبة وإدارة متطلبات وأنظمة الامتثال لوزارات الموارد البشرية والبلديات والتأمينات والدفاع المدني بمرونة وحيوية تامة.",
      descEn: "Your central control room to monitor all compliance KPIs, municipal permits, and regulatory guidelines."
    },
    {
      targetId: "lexi-engine",
      titleAr: "محرك LEXI للذكاء الصياغي والاستشارة (LEXI AI Legal Advisor)",
      titleEn: "LEXI AI Legal Advisor",
      descAr: "مستشارك القانوني الذكي صائغ الاعتراضات المعتمد على اللوائح الوطنية السعودية. اضغط عليه في شريط الأدوات وسيقوم بصياغة فورية للردود والاعتراضات والتحقق من سلامة كادرك.",
      descEn: "Our state-of-the-art sovereign legal assistant trained in Saudi labor and commercial laws. Instant objection drafter."
    },
    {
      targetId: "c9-ledger",
      titleAr: "سجل الأحداث السيادي المشفر (C9 Cryptographic Event Ledger)",
      titleEn: "C9 Event Ledger",
      descAr: "سلسلة الكتل الرقمية والتوثيق الموحد لكل إجراء يتم بالمنصة. يسجل فوراً أي تنبيه، شهادة صحية جديدة، أو فحص إثبات حضور لضمان النزاهة والموثوقية المطلقة.",
      descEn: "A secure, decentralized ledger logs every regulatory change, alert broadcast, and workforce check permanently."
    },
    {
      targetId: "notification-engine",
      titleAr: "مركز الإشعارات الموائم (Multichannel Alerts Engine)",
      titleEn: "Multichannel Alerts Engine",
      descAr: "خصّص قنوات الإرسال المفضلة لديك (SMS، البريد الإلكتروني، إشعارات المتصفح) مع تحديد مستوى خطورة المخالفة لتلقي التنبيهات في الوقت الفعلي وتصحيح أوضاع الكادر الميداني.",
      descEn: "Configure notification channels and map custom severity levels per violation category to take proactive legal action."
    }
  ];

  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onDismiss();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[20000] bg-[#1c2541]/85 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Spotlight highlight effects */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[380px] h-[380px] rounded-full bg-yellow-500/5 filter blur-[120px] animate-pulse"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-950 border-2 border-[#D4AF37] rounded-xl overflow-hidden shadow-[0_0_80px_rgba(212,175,55,0.3)] text-right relative"
        style={{ direction: "rtl" }}
      >
        {/* Step indicator top line */}
        <div className="absolute top-0 right-0 left-0 h-1 bg-slate-800"></div>
        <div 
          className="absolute top-0 right-0 h-1 bg-[#D4AF37] transition-all duration-300" 
          style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
        ></div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Badge & Close Button */}
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-[9px] font-black bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/35 px-2.5 py-0.5 rounded-full font-mono uppercase">
              جولة المنصة الاسترشادية ({currentStepIndex + 1} من {steps.length})
            </span>
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-white transition text-xs font-bold"
            >
              تخطي الجولة ✕
            </button>
          </div>

          {/* Graphic Icon depending on step */}
          <div className="flex justify-center py-2">
            <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/30 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.1)]">
              {currentStepIndex === 0 && <Building2 className="w-8 h-8 text-[#D4AF37]" />}
              {currentStepIndex === 1 && <Sparkles className="w-8 h-8 text-[#D4AF37]" />}
              {currentStepIndex === 2 && <Cpu className="w-8 h-8 text-[#D4AF37]" />}
              {currentStepIndex === 3 && <ShieldCheck className="w-8 h-8 text-[#D4AF37]" />}
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-white flex items-center gap-1.5 justify-end">
              <span>{isAr ? currentStep.titleAr : currentStep.titleEn}</span>
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed font-medium">
              {isAr ? currentStep.descAr : currentStep.descEn}
            </p>
          </div>

          {/* Highlight Indicator simulating visual spot */}
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2 flex-row-reverse">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-ping" />
            <span className="text-[10px] text-gray-400 font-mono">
              عنصر واجهة الاستخدام المستهدف: <strong className="text-[#D4AF37]">#{currentStep.targetId}</strong>
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-white/10 flex justify-between items-center flex-row-reverse">
            <button
              onClick={handleNext}
              className="bg-[#D4AF37] hover:bg-yellow-500 text-black font-extrabold px-5 py-2 rounded text-xs transition cursor-pointer flex items-center gap-1"
            >
              <span>{currentStepIndex === steps.length - 1 ? "فهمت وابدأ العمل الرقابي ✓" : "التالي"}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>

            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-4 py-2 rounded text-xs transition cursor-pointer flex items-center gap-1"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
