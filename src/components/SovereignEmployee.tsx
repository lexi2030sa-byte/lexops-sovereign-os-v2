import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { auth } from "../firebase";
import SovereignMap from "./SovereignMap";
import LexiVideoGenerator from "./LexiVideoGenerator";
import { Employee } from "../data";
import {
  User,
  ShieldCheck,
  FileCheck,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
  FilePen,
  Clock,
  Sparkles,
  Award,
  Upload,
  Building,
  Info,
  ChevronLeft,
  ChevronRight,
  Lock,
  Compass,
  Database,
  Trash2,
  FileText,
  BookmarkCheck,
  Zap,
  Activity,
  CheckCircle,
  XCircle,
  HelpCircle,
  Fingerprint,
  Mail,
  Camera,
  Play,
  RotateCcw,
  Wifi,
  Smartphone,
  Signal,
  Battery,
  X,
  CreditCard,
  Briefcase,
  Layers,
  Video,
  Film,
  Check,
  Download
} from "lucide-react";

interface SovereignEmployeeProps {
  citations: any[];
  setCitations: React.Dispatch<React.SetStateAction<any[]>>;
  objections: any[];
  setObjections: React.Dispatch<React.SetStateAction<any[]>>;
  attendanceLogs: any[];
  setAttendanceLogs: React.Dispatch<React.SetStateAction<any[]>>;
  alerts: any[];
  setAlerts: React.Dispatch<React.SetStateAction<any[]>>;
  pushNewC9Event: (type: string, refId: string, payload: any) => void;
  lang: "ar" | "en";
  setLang: (lang: "ar" | "en") => void;
  employees?: Employee[];
  currentUser?: {
    id: string;
    email: string;
    role: string;
    entityId: string;
    entityName: string;
    name?: string;
  };
  supportRequests?: any[];
  setSupportRequests?: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function SovereignEmployee({
  citations,
  setCitations,
  objections,
  setObjections,
  attendanceLogs,
  setAttendanceLogs,
  alerts,
  setAlerts,
  pushNewC9Event,
  lang,
  setLang,
  employees,
  currentUser,
  supportRequests = [],
  setSupportRequests
}: SovereignEmployeeProps) {
  // Demo simulation state controls
  const [demoStep, setDemoStep] = useState<number>(3); 
  const [isActivated, setIsActivated] = useState<boolean>(true);
  const [activationStep, setActivationStep] = useState<"step1" | "step2">("step1");
  const [loginEmail, setLoginEmail] = useState<string>("fahad.qarni@raedlog.sa");
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [userOtp, setUserOtp] = useState<string>("");
  const [agreeCheckbox, setAgreeCheckbox] = useState<boolean>(false);

  // Active Bottom Navigation View: Default to "home"
  const [activeTab, setActiveTab] = useState<"home" | "attendance" | "leaves" | "payroll" | "profile">("home");

  // Skeleton screen loading simulation state
  const [isScreenLoading, setIsScreenLoading] = useState<boolean>(false);

  // Active Bottom Sheet Modal state
  const [activeBottomSheet, setActiveBottomSheet] = useState<
    | null
    | "payslip"
    | "new_leave_wizard"
    | "violation_detail"
    | "new_appeal_wizard"
    | "gps_fault"
    | "video_generator"
  >(null);

  const [videoPromptText, setVideoPromptText] = useState<string>("");
  const [videoPromptContext, setVideoPromptContext] = useState<"document" | "evidence" | "objection" | "general">("general");
  const [activeEvidenceIndexes, setActiveEvidenceIndexes] = useState<Record<string, number>>({});
  const [timelineFilter, setTimelineFilter] = useState<"all" | "major">("all");
  const [expandedTimelineItem, setExpandedTimelineItem] = useState<string | null>(null);

  // Selected records for Bottom Sheet focus
  const [selectedViolation, setSelectedViolation] = useState<any | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  // Simulated GPS boundary coordinate tracking states
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean>(true);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [successAnimation, setSuccessAnimation] = useState<boolean>(false);
  const [hapticTrigger, setHapticTrigger] = useState<string | null>(null);

  // Step-by-step Wizards
  const [leaveStep, setLeaveStep] = useState<number>(1);
  const [appealStep, setAppealStep] = useState<number>(1);

  // Find matched employee from global list
  const matchedEmp = employees?.find(e => e.email?.toLowerCase() === currentUser?.email?.toLowerCase() || e.id === currentUser?.id);

  // Local Employee Profile Details (Fahad Al-Qarni or dynamic user)
  const profile = {
    name: matchedEmp?.name || currentUser?.name || "م. فهد القرني",
    nationalId: matchedEmp?.nationalId || "1098822334",
    profession: matchedEmp?.role || "رئيس قسم التخطيط اللوجستي",
    entity: matchedEmp?.entityName || currentUser?.entityName || "رائد التقنية للاستشارات اللوجستية",
    email: matchedEmp?.email || currentUser?.email || "fahad.qarni@raedlog.sa",
    mobile: "0501122334",
    avatar: "👨‍💼",
    residencyStatus: "سارية ✅",
    healthCertStatus: "سارية ✅ (HC-99210-A)",
    compliancePct: 94,
    baseWage: 5500,
    allowanceHousing: 1500,
    allowanceTransport: 500,
    deductionsGosi: 550,
    netSalary: 6950,
    workHours: 8,
    branch: "فرع جدة - حي الشاطئ",
    joinDate: matchedEmp?.joinedAt || "2025-01-01"
  };

  // Local Attendance Problem Form States
  const [probType, setProbType] = useState<string>("GPS لا يعمل");
  const [probDesc, setProbDesc] = useState<string>("");
  const [probPhotoEvidence, setProbPhotoEvidence] = useState<string>("");

  // Leaves Log
  const [leafBalance, setLeafBalance] = useState<number>(18);
  const [leavesList, setLeavesList] = useState<any[]>([]);
  const [newLeaveType, setNewLeaveType] = useState<string>("إجازة سنوية");
  const [newLeaveDuration, setNewLeaveDuration] = useState<number>(3);
  const [newLeaveRange, setNewLeaveRange] = useState<string>("2026-07-01 - 2026-07-04");

  // Payslips list
  const payslips = [
    { id: "SLIP-MAY", month: "مايو 2026", monthEn: "May 2026", basic: 5500, housing: 1500, transport: 500, deductions: 550, net: 6950, status: "تم غسيل الراتب ومطابقته ✓" },
    { id: "SLIP-APR", month: "أبريل 2026", monthEn: "April 2026", basic: 5500, housing: 1500, transport: 500, deductions: 550, net: 6950, status: "مسحوب ومطابق ✓" },
    { id: "SLIP-MAR", month: "مارس 2026", monthEn: "March 2026", basic: 5500, housing: 1500, transport: 500, deductions: 750, net: 6750, status: "مسحوب ومطابق ✓" }
  ];

  // Violations list
  const [openViolationTab, setOpenViolationTab] = useState<"open" | "closed">("open");
  const [localViolations, setLocalViolations] = useState<any[]>([
    { id: "VIO-801", title: "مخالفة: عدم الالتزام بالزي الرسمي المحدد باللائحة", titleEn: "Violation: Non-compliance with corporate dress code", status: "نشطة", impact: "خصم 200 ر.س", date: "2026-05-18", evidenceMsg: "صورة كاميرا المراقبة لمدخل المستودع تظهر تيشرت مخالف عشوائي.", evidenceFile: "camera_log_clothing_match.png" },
    { id: "VIO-802", title: "مخالفة: تأخير متكرر عن بدء خط الانتاج الثاني", titleEn: "Violation: Repeated delay on production line starting", status: "مغلقة", impact: "تنبيه خطي وحفظ السجل", date: "2026-05-10", evidenceMsg: "تقرير رصد الدخول بعد الساعة 09:15 ص لثلاثة أيام متتالية.", evidenceFile: "system_attendance_slip_times.pdf" }
  ]);

  // Appeals State
  const [appealGrounds, setAppealGrounds] = useState<string>("");
  const [generatedAppealDoc, setGeneratedAppealDoc] = useState<string>("");
  const [aiGeneratingAppeal, setAiGeneratingAppeal] = useState<boolean>(false);

  // Employee Support Form States
  const [empSupportSubject, setEmpSupportSubject] = useState("");
  const [empSupportMessage, setEmpSupportMessage] = useState("");
  const [isSubmittingEmpSupport, setIsSubmittingEmpSupport] = useState(false);

  const handleSubmitEmpSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empSupportSubject.trim() || !empSupportMessage.trim()) {
      alert("⚠️ فضلاً أدخل موضوع وتفاصيل طلب الدعم.");
      return;
    }
    setIsSubmittingEmpSupport(true);
    const newTicket = {
      id: "SR-" + Date.now(),
      senderId: currentUser?.id || "EMP-01",
      senderName: "الموظف: " + (currentUser?.name || "سليمان بن خالد الخالدي"),
      senderRole: "employee",
      entityId: currentUser?.entityId || "7009418374",
      entityName: currentUser?.entityName || "مجموعة قصر الأغذية للضيافة F&B",
      title: empSupportSubject,
      details: empSupportMessage,
      status: "pending" as const,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      reply: ""
    };

    try {
      await setDoc(doc(db, "support_requests", newTicket.id), newTicket);
      if (setSupportRequests) {
        setSupportRequests(prev => [newTicket, ...prev]);
      }
      setEmpSupportSubject("");
      setEmpSupportMessage("");
      alert("✅ تم إرسال طلب الدعم للمؤسس بنجاح! سيظهر في لوحة مراجعة المؤسس فورًا.");
    } catch (err: any) {
      console.error(err);
      if (setSupportRequests) {
        setSupportRequests(prev => [newTicket, ...prev]);
      }
      setEmpSupportSubject("");
      setEmpSupportMessage("");
      alert("✅ تم حفظ طلب الدعم محلياً بنجاح!");
    } finally {
      setIsSubmittingEmpSupport(false);
    }
  };

  // Digital Signature Canvas Refs & States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string>("");

  // Clock dynamic statusbar KSA Time
  const [statusBarTime, setStatusBarTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setStatusBarTime(now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Whenever the tab is changed, show a quick realistic Loading Skeleton + simulated haptic
  const transitionToTab = (tab: typeof activeTab) => {
    simulateHaptic(tab);
    setIsScreenLoading(true);
    setActiveTab(tab);
    setTimeout(() => {
      setIsScreenLoading(false);
    }, 450);
  };

  // Simulate haptic action feedback
  const simulateHaptic = (tabName: string) => {
    setHapticTrigger(tabName);
    setTimeout(() => setHapticTrigger(null), 150);
    if (navigator.vibrate) {
      navigator.vibrate(12); // Small haptic bump
    }
  };

  // Signature drawing behaviors
  const getEventPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#4d90fe"; // legal blue
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const pos = getEventPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getEventPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    e.preventDefault();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveSignatureImage();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData("");
  };

  const saveSignatureImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasDrawings = imgData.data.some((channel, index) => index % 4 === 3 && channel > 0);
    if (hasDrawings) {
      setSignatureData(canvas.toDataURL());
    } else {
      setSignatureData("");
    }
  };

  // Dual OTP activation validation
  const sendOtpEmail = () => {
    if (!loginEmail.includes("@")) {
      alert(lang === "ar" ? "⚠️ لم نتثبت من نمط البريد المدخل" : "⚠️ Incorrect email format.");
      return;
    }
    setOtpSent(true);
    alert(lang === "ar" ? "✉️ تم توليد كود المرور الثنائي وإرساله للخلية بريداً! كود الفحص هو (1229)" : "✉️ Security code pushed to mailbox! Testing token: (1229)");
  };

  const confirmOtpVerify = () => {
    if (userOtp === "1229") {
      setActivationStep("step2");
      simulateHaptic("otp-success");
    } else {
      alert(lang === "ar" ? "❌ كود غير صحيح. استخدم 1229 للعبور المباشر" : "❌ Refused code. Enter 1229 for demo path.");
    }
  };

  const activateSovereignAccount = () => {
    if (!agreeCheckbox) {
      alert(lang === "ar" ? "⚠️ الرجاء الموافقة على صحة الرابط اللوجستي والبيانات" : "⚠️ Please accept terms.");
      return;
    }
    setIsActivated(true);
    setDemoStep(3);
    transitionToTab("home");
    pushNewC9Event("تنشيط البوابة الميدانية للموظف الجديد", profile.nationalId, {
      name: profile.name,
      wage: profile.baseWage,
      geofence: profile.branch
    });
  };

  // Perform Geo Checkin/Checkout simulation
  const triggerGpsCheckIn = async (type: "in" | "out") => {
    setGpsLoading(true);

    if (!navigator.geolocation) {
      alert("تحديد الموقع الجغرافي غير مدعوم في هذا المتصفح.");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;
          const isSpoofed = (position as any).mocked || false;

          const idToken = await auth.currentUser?.getIdToken();
          if (!idToken) {
            alert("فشل التحقق من الهوية الرقمية. يرجى إعادة تسجيل الدخول.");
            setGpsLoading(false);
            return;
          }

          const employeeBranchId = matchedEmp?.branchId || "BR-101-7070701234";

          const response = await fetch("/api/attendance/geo-punch", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify({
              userLat: latitude,
              userLng: longitude,
              accuracy: accuracy || 0,
              isSpoofed,
              branchId: employeeBranchId,
              type
            })
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || "فشل تسجيل البصمة الجغرافية.");
          }

          if (result.success && result.log) {
            const logId = result.log.id;
            const displayTime = new Date(result.log.timestamp).toLocaleTimeString("ar-SA");
            const logCoords = `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`;

            const newLog = {
              id: logId,
              employeeName: currentUser?.name || profile.name,
              time: displayTime,
              coords: logCoords,
              locStatus: "داخل النطاق الجغرافي المعتمد",
              checkType: type === "in" ? "حضور" : "انصراف",
              alert: "بصمة جغرافية موثقة",
              branchName: result.log.branchName || "الفرع الرئيسي"
            };

            setAttendanceLogs((prev: any) => [newLog, ...prev]);

            if (pushNewC9Event) {
              pushNewC9Event(
                type === "in" ? "حضور عبر تطبيق الجوال" : "انصراف عبر تطبيق الجوال",
                logId,
                { geofenceValidated: true, coords: logCoords }
              );
            }

            alert(`تم توثيق بصمة ${type === "in" ? "الحضور" : "الانصراف"} بنجاح.`);
          }
        } catch (error: any) {
          console.error("Geo-punch error:", error);
          alert(`خطأ في المعالجة: ${error.message}`);
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMsg = "فشل تحديد الموقع الجغرافي.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "تم رفض إذن جلب الموقع الجغرافي.";
        }
        alert(errorMsg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };


  // Report technical GPS fault to organization admin
  const handleSendProblemForm = (e: React.FormEvent) => {
    e.preventDefault();
    const problemReport = {
      id: `PRB-${Date.now().toString().slice(-3)}`,
      issueType: probType,
      description: probDesc || "فشل مزامنة الموقع مع خوادم التتبع الجغرافي.",
      evidencePhoto: probPhotoEvidence,
      date: new Date().toLocaleDateString("ar-SA"),
      status: "بانتظار تصديق المنشأة"
    };

    pushNewC9Event("تقديم استثناء تقني لخلل الـ GPS للجوال", problemReport.id, {
      probType,
      probDesc
    });
    
    alert(lang === "ar" ? "🟢 تم إراسال البلاغ الاستثنائي لنظام الحوكمة" : "🟢 Out-of-bounds bypass appeal forwarded to control ledger.");
    setActiveBottomSheet(null);
    setDemoStep(6);
  };

  // Wizard Leaves submission
  const nextLeaveStep = () => {
    if (leaveStep < 3) {
      setLeaveStep(prev => prev + 1);
    }
  };

  const handleAddLeaveSubmit = () => {
    if (newLeaveDuration > leafBalance) {
      alert(lang === "ar" ? "❌ الرصيد المطالب به يتجاوز المحفظة المتاحة" : "❌ Deficit leave balance.");
      return;
    }
    const newLeave = {
      id: `LV-${Date.now().toString().slice(-3)}`,
      range: newLeaveRange,
      duration: newLeaveDuration,
      type: newLeaveType,
      status: "مقبولة"
    };

    setLeavesList([newLeave, ...leavesList]);
    setLeafBalance(prev => prev - newLeaveDuration);
    pushNewC9Event("تصفية ومصادقة إجازة موظف", newLeave.id, {
      type: newLeaveType,
      duration: newLeaveDuration
    });
    
    alert(lang === "ar" ? "✅ تم توثيق واعتماد المحسوبية بنجاح" : "✅ Successfully registered on C9.");
    setActiveBottomSheet(null);
    setLeaveStep(1);
  };

  // Appeals Wizard
  const handleGenerateAppealAI = async (violation: any) => {
    setAiGeneratingAppeal(true);
    setAppealGrounds(`التماس مسبب بطلب إسقاط كود الملاءمة رقم ${violation.id} لتوافر التزام خدمي خارج النطاق بجدة.`);
    
    try {
      const response = await fetch("/api/agent/generate-objection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          violationText: `${violation.title}: ${violation.evidenceMsg}`,
          grounds: "تفويض شفهي فوري لدعم فرع حي الشاطئ وسحب أجهزة لمدد زمنية.",
          userRole: "employee"
        })
      });
      const data = await response.json();
      setGeneratedAppealDoc(data.text);
    } catch {
      const fallback = `### مستند اعتراض آلي (LEXOPS AUTO-APPEAL)
**المرجع الكودي:** OB-VIO-801
**الطرف المعترض:** المنسوب فهد القرني
**المبررات المودعة:** 
- تطلب التواجد الفوري لدعم فرع الشاطئ من أجل استلام تجهيزات الـ C9.
- لا يوجد نية للتهرب الإجرائي الجغرافي.
- نرجو إلغاء الخصم المالي المقدر بـ **200 ر.س** وتوحيد شهادة الالتزام.`;
      setGeneratedAppealDoc(fallback);
    } finally {
      setAiGeneratingAppeal(false);
    }
  };

  const submitAppealToLedger = (violationId: string) => {
    const oppId = `APP-${Date.now().toString().slice(-3)}`;
    const newAppeal = {
      id: oppId,
      violationId: violationId,
      text: appealGrounds || "مذكرة اعتراضية مكتوبة وموثقة بالتوقيع.",
      date: new Date().toLocaleDateString("ar-SA"),
      status: "تحت التدقيق الرقابي ⚖️",
      signature: signatureData || null
    };

    setObjections([newAppeal, ...objections]);
    alert(lang === "ar" ? "⚖️ تم إرسال مذكرة الاعتراض الموقعة إلى النظام بنجاح" : "⚖️ Transmitted signature block payload to the legal board.");
    setActiveBottomSheet(null);
    setGeneratedAppealDoc("");
    setSignatureData("");
    setAppealStep(1);
    setDemoStep(11);
    transitionToTab("profile");
  };

  // Jump Step directly in Demo steppers
  const selectStepperDirectly = (stepId: number) => {
    setDemoStep(stepId);
    if (stepId <= 2) {
      setIsActivated(false);
      setActivationStep(stepId === 1 ? "step1" : "step2");
    } else {
      setIsActivated(true);
      if (stepId === 3) transitionToTab("home");
      else if (stepId === 4 || stepId === 5 || stepId === 6 || stepId === 7) transitionToTab("attendance");
      else if (stepId === 8) transitionToTab("leaves");
      else if (stepId === 9) transitionToTab("payroll");
      else if (stepId === 10 || stepId === 11) transitionToTab("profile");
      else if (stepId === 12) transitionToTab("profile");
    }
  };

  const isAr = lang === "ar";

  return (
    <div id="sovereign-employee-portal-root" className="space-y-6 w-full text-right" style={{ direction: "rtl" }}>
      
      {/* 🛠️ SIMULATION SCENARIO STEPPER CONTROLS */}
      <section id="demo-guide-stepper" className="bg-[#0b0f19] border border-[#D4AF37]/40 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 pb-3 mb-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h4 className="text-xs font-black text-[#D4AF37] tracking-wider font-mono">
              {isAr ? "محاكي سيناريو تجربة الموظف الميداني (Compact Mobile Portal Steppers)" : "Field Employee Mobile Simulation Suite"}
            </h4>
          </div>
          <button 
            type="button"
            onClick={() => {
              setIsActivated(true);
              setDemoStep(3);
              transitionToTab("home");
            }}
            className="px-2.5 py-1 text-[10px] bg-white/5 hover:bg-white/10 text-[#D4AF37] rounded border border-[#D4AF37]/20 flex items-center gap-1 cursor-pointer transition"
          >
            <RotateCcw className="w-3" />
            <span>{isAr ? "إعادة التعيين الافتراضي" : "Reset Portal Simulator"}</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-400 mb-3">
          {isAr 
            ? "استخدم هذه الأزرار المباشرة للانتقال تلقائياً بين شاشات الهاتف المحاكي وتجرّب ميزات التحقق ثنائي الأجهزة، تسجيل الحضور، والتدقيق والاعتراض بالتوقيع والذكاء الاصطناعي:" 
            : "Directly trigger each specialized sub-flow inside the flagship mobile view chassis:"}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
          {[
            { id: 1, label: isAr ? "1. بريد التحقق" : "1. Onboard PIN" },
            { id: 2, label: isAr ? "2. مطابقة العقد" : "2. Bio Terms" },
            { id: 3, label: isAr ? "3. اللوحة الرئيسية" : "3. Mobile Home" },
            { id: 4, label: isAr ? "4. تسجيل الـ GPS" : "4. GPS Clock-In" },
            { id: 5, label: isAr ? "5. عطل فني" : "5. GPS Mismatch" },
            { id: 6, label: isAr ? "6. تدقيق الإدارة" : "6. Manager Log" },
            { id: 7, label: isAr ? "7. سيناريو الرفض" : "7. Sandbox Refused" },
            { id: 8, label: isAr ? "8. تقديم إجازة" : "8. Leave Wizard" },
            { id: 9, label: isAr ? "9. قسيمة الأجر" : "9. Payroll Hub" },
            { id: 10, label: isAr ? "10. المخالفات" : "10. Infraction List" },
            { id: 11, label: isAr ? "11. صياغة اعتراض" : "11. Interactive App" },
            { id: 12, label: isAr ? "12. وثائق الملف" : "12. Dossier PDF" }
          ].map(it => (
            <button
              key={it.id}
              onClick={() => selectStepperDirectly(it.id)}
              className={`p-1.5 text-[10px] rounded-lg border text-center transition-all duration-155 cursor-pointer block ${
                demoStep === it.id
                  ? "bg-gradient-to-r from-blue-700 to-indigo-800 text-white border-blue-400 font-extrabold shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                  : "bg-[#1c2541] border-white/5 text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="block text-[8px] text-[#D4AF37] opacity-80">خطوة {it.id}</span>
              <span className="block text-[10.5px] truncate">{it.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 📱 CORE INTELLIGENT EXPERIMENTAL SMARTPHONE DEVICE */}
      <div id="mobile-viewport-container" className="flex justify-center items-center py-2 px-1">
        
        {/* Absolute High-Contrast Realistic Mobile Chassis Shell */}
        <div className="relative w-full max-w-[395px] min-h-[750px] bg-[#02050c] rounded-[48px] border-[11px] border-[#151923] shadow-[0_24px_50px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col font-sans text-white ring-1 ring-white/10">
          
          {/* Top Speaker / Camera Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#151923] rounded-b-xl z-50 flex items-center justify-center pointer-events-none">
            <div className="w-1.5 h-1.5 bg-[#090d16] rounded-full mr-1" />
            <div className="w-8 h-0.5 bg-[#0e121b] rounded-full" />
          </div>

          {/* Device Telephony Status Header */}
          <div className="h-9 px-5 pt-1.5 select-none flex justify-between items-center text-[10px] font-black tracking-wide font-mono z-40 bg-[#02050c] border-b border-white/5">
            <span className="text-gray-300 font-bold">{statusBarTime || "08:15"}</span>
            <div className="flex items-center gap-1.5 text-gray-400">
              <Signal className="w-3 h-3 text-white" />
              <span className="text-[8px] text-white">5G</span>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <div className="flex items-center gap-0.5">
                <span className="text-[8px] text-gray-300">97%</span>
                <Battery className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
              </div>
            </div>
          </div>

          {/* ONBOARDING FLOW STATUSES (IF NOT ACTIVATED) */}
          {!isActivated ? (
            <div className="flex-1 flex flex-col justify-between p-4 bg-[#030611] overflow-y-auto">
              {activationStep === "step1" ? (
                <div className="space-y-5 pt-3 flex-1 flex flex-col justify-center text-center">
                  <div className="inline-flex p-3 bg-blue-500/10 rounded-full border border-blue-500/20 text-[#D4AF37] mx-auto">
                    <Fingerprint className="w-10 h-10 stroke-[1.5]" />
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-blue-400 tracking-widest block font-bold">LEXOPS COVENANT PROTOCOL</span>
                    <h2 className="text-base font-black text-white">{isAr ? "الولوج الكودي ثنائي الأثر" : "Secure Employee Sign-On"}</h2>
                    <p className="text-[10px] text-gray-400 max-w-[250px] mx-auto leading-normal">
                      {isAr ? "يرجى مطابقة بريدك الوظيفي المربوط بمنصات قوى لتلقي كود الموثوقية:" : "Authenticate your corporate-backed email credentials."}
                    </p>
                  </div>

                  <div className="space-y-3 bg-[#070b1a] p-3.5 rounded-xl border border-white/5 text-right">
                    <div>
                      <label className="block text-[9px] text-gray-400 mb-1 font-bold">{isAr ? "البريد الإلكتروني المعتمد للموظف" : "Corporate Email Address"}</label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#D4AF37]" />
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="fahad.qarni@raedlog.sa"
                          className="w-full bg-[#02040b] border border-white/10 rounded-xl py-2 pl-8 pr-3 text-[11px] font-mono text-white focus:outline-none focus:border-[#D4AF37] text-left"
                        />
                      </div>
                    </div>

                    {!otpSent ? (
                      <button
                        type="button"
                        onClick={sendOtpEmail}
                        className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl cursor-pointer transition shadow-lg flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3 h-3" />
                        <span>{isAr ? "توليد كود الموثوقية ✉️" : "Send Dual-Verification Key"}</span>
                      </button>
                    ) : (
                      <div className="space-y-2 pt-1">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 py-1.5 px-2 rounded text-[8px] text-center text-emerald-400 font-bold">
                          {isAr ? "كود الفحص للتجربة السريعة هو (1229)" : "Enter (1229) to simulate OTP match."}
                        </div>
                        <input
                          type="text"
                          maxLength={4}
                          value={userOtp}
                          onChange={(e) => setUserOtp(e.target.value)}
                          placeholder="••••"
                          className="w-full bg-[#02040b] border border-white/10 rounded-xl py-1.5 text-center text-base font-black font-mono tracking-widest text-white focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={confirmOtpVerify}
                          className="w-full py-2 bg-[#D4AF37] hover:bg-[#bda036] text-black font-extrabold text-xs rounded-xl cursor-pointer transition"
                        >
                          {isAr ? "التحقق والتقدم ✓" : "Verify Token"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-center space-y-1">
                      <span className="text-[8px] font-mono text-emerald-400 font-bold block">LEXOPS SECURE DATABASE</span>
                      <h2 className="text-base font-black text-white">{isAr ? "مراجعة ميثاق وجدول التعويض" : "Review Terms & Bound Geofence"}</h2>
                      <p className="text-[10px] text-gray-400 leading-none">
                        {isAr ? "يرجى مطقة العقد ونطاق التموضع لاعتماده على السلسلة:" : "Validate geolocking and compensation layout below:"}
                      </p>
                    </div>

                    <div className="bg-[#070b1a] border border-white/5 rounded-xl p-3 space-y-2 text-xs leading-relaxed max-h-[340px] overflow-y-auto text-right">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                          <span className="text-gray-400 block text-[7.5px]">{isAr ? "اسم المنسوب" : "Employee"}</span>
                          <span className="text-white font-extrabold block text-[10px] mt-0.5">{profile.name}</span>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                          <span className="text-gray-400 block text-[7.5px]">{isAr ? "الهوية الوطنية" : "ID Code"}</span>
                          <span className="text-white font-mono font-bold block text-[10px] mt-0.5">{profile.nationalId}</span>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg border border-white/5 col-span-2">
                          <span className="text-gray-400 block text-[7.5px]">{isAr ? "المهنة المعتمدة" : "Designated Role"}</span>
                          <span className="text-white font-bold block text-[10.5px] mt-0.5">{profile.profession}</span>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                          <span className="text-gray-400 block text-[7.5px]">{isAr ? "الراتب الأساسي" : "Contract Wage"}</span>
                          <span className="text-emerald-400 font-extrabold block text-[11px] mt-0.5">{profile.baseWage} ر.س</span>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                          <span className="text-gray-400 block text-[7.5px]">{isAr ? "ساعات الالتزام" : "Daily Shift"}</span>
                          <span className="text-white font-bold block text-[10px] mt-0.5">{profile.workHours} {isAr ? "ساعات" : "Hours"}</span>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg border border-white/5 col-span-2">
                          <span className="text-gray-400 block text-[7.5px]">{isAr ? "فرع الحضور المعتمد" : "Work Branch Limit"}</span>
                          <span className="text-[#D4AF37] font-bold block text-[10.5px] mt-0.5">{profile.branch}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <label className="flex items-start gap-2 cursor-pointer text-right">
                      <input
                        type="checkbox"
                        checked={agreeCheckbox}
                        onChange={(e) => setAgreeCheckbox(e.target.checked)}
                        className="mt-0.5 w-3.5 h-3.5 text-[#D4AF37] border-white/10 rounded bg-[#02040b]"
                      />
                      <span className="text-[9px] text-gray-300 leading-snug">
                        {isAr ? "أقر بمطابقة كافة البيانات وربطها بجهازي المحمول وتطبيق قوى." : "Confirm agreement on the compensation scale and geospatial work branch details."}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={activateSovereignAccount}
                      disabled={!agreeCheckbox}
                      className={`w-full py-2.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        agreeCheckbox
                          ? "bg-[#D4AF37] hover:bg-[#cdaf35] text-black shadow-lg"
                          : "bg-white/10 text-gray-500 cursor-not-allowed border border-white/5"
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isAr ? "تنشيط وتوثيق الباقة" : "Provision Portal Access"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            
            /* DYNAMIC ACTIVE SIMULATED SMARTPHONE ENVIRONMENT */
            <div className="flex-1 flex flex-col justify-between overflow-hidden relative">

              {/* 🏆 MOBILE APPLICATION STICKY HEADER (UPGRADED: Mini-cards inside Header) */}
              <div className="px-3.5 py-3 bg-[#030713] border-b border-white/5 space-y-2 z-10 shadow-lg">
                <div className="flex justify-between items-center text-right">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-900 border border-white/15 flex items-center justify-center text-sm shadow">
                      {profile.avatar}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white leading-tight">{profile.name}</h3>
                      <div className="flex items-center gap-1 text-[8.5px] text-gray-400 mt-0.5">
                        <Building className="w-2 text-blue-400" />
                        <span className="truncate max-w-[95px]">{profile.entity}</span>
                      </div>
                    </div>
                  </div>

                  {/* Circular Compliance Ring mini loader on top */}
                  <div className="flex items-center gap-1.5 bg-[#1c2541]/45 py-1 px-2 rounded-full border border-white/5">
                    <div className="relative w-4.5 h-4.5 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.06)" strokeWidth="1.8" fill="transparent" />
                        <circle 
                          cx="9" 
                          cy="9" 
                          r="7" 
                          stroke="#10b981" 
                          strokeWidth="1.8" 
                          fill="transparent" 
                          strokeDasharray={44} 
                          strokeDashoffset={44 * (1 - 0.94)} 
                        />
                      </svg>
                      <span className="absolute text-[6.5px] font-black font-mono text-emerald-400">94</span>
                    </div>
                    <span className="text-[8.5px] text-gray-400">{isAr ? "الامتثال" : "Compliance"}</span>
                  </div>
                </div>

                {/* UPGRADED: Mobile State Card Headers (Iqama & Health Certificate indicators as Small Cards) */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <div className="bg-white/5 border border-white/5 rounded-lg py-1 px-2 flex justify-between items-center text-[8.5px]">
                    <span className="text-gray-400">{isAr ? "رخصة الإقامة" : "Iqama id"}:</span>
                    <span className="text-emerald-400 font-extrabold">{profile.residencyStatus}</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-lg py-1 px-2 flex justify-between items-center text-[8.5px]">
                    <span className="text-gray-400">{isAr ? "الشهادة الصحية" : "Health Cert"}:</span>
                    <span className="text-emerald-400 font-extrabold">{profile.healthCertStatus.split(" ")[0]}</span>
                  </div>
                </div>
              </div>

              {/* ACTIVE TAB VIEWS WINDOW (With loading indicator overlay and full responsive content) */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-4 bg-gradient-to-b from-[#030612] via-[#01030b] to-[#010207] pb-24 relative">
                
                {isScreenLoading ? (
                  /* Loading Skeletons layout (High-performance simulated database load) */
                  <div className="space-y-3.5 animate-pulse pt-2">
                    <div className="h-16 bg-white/5 rounded-xl" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-16 bg-white/5 rounded-lg" />
                      <div className="h-16 bg-white/5 rounded-lg" />
                    </div>
                    <div className="h-28 bg-white/5 rounded-xl" />
                    <div className="h-16 bg-white/5 rounded-xl" />
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    
                    {/* 1. MAIN APP HOME SCREEN (الرئيسية) */}
                    {activeTab === "home" && (
                      <motion.div
                        key="mb-home"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        {/* Interactive UI: Sovereign Ring and Personal Progress bar */}
                        <div className="p-3.5 bg-gradient-to-br from-[#060b1c] to-[#040713] border border-white/5 rounded-2xl text-right space-y-3 shadow shadow-blue-900/10">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-xs font-black text-white">{isAr ? "نقاط حوكمة الالتزام الوظيفي" : "Corporate Compliance Score"}</h4>
                              <p className="text-[9px] text-gray-500 mt-0.5">
                                {isAr ? "محسوبة بموجب مصفوفة البصمة والمستندات الرسمية" : "Based on GPS checks and official IDs validation."}
                              </p>
                            </div>
                            <div className="p-1 px-2 text-[9px] font-mono font-bold bg-[#10b981]/10 text-emerald-400 border border-[#10b981]/15 rounded-full">
                              94%
                            </div>
                          </div>

                          {/* UPGRADED: Real-time Compliance Progress Bar Grid */}
                          <div className="space-y-1.5">
                            <div className="w-full bg-white/5 rounded-full h-2">
                              <div className="bg-gradient-to-r from-[#D4AF37] to-[#10b981] h-2 rounded-full" style={{ width: "94%" }} />
                            </div>
                            <div className="flex justify-between items-center text-[8.5px]">
                              <span className="text-gray-500">{isAr ? "المستهدف الرقمي: 98%" : "Goal: 98%"}</span>
                              <span className="text-[#D4AF37] font-bold">{isAr ? "94% مستقر" : "Stable"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Direct Notification Alert Panel if open infractions exist */}
                        {localViolations.filter(v => v.status === "نشطة").map(v => (
                          <div key={v.id} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between text-right gap-2">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 bg-rose-500/20 rounded-lg text-rose-400">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                              <div>
                                <span className="text-[10px] text-rose-300 block font-bold">{isAr ? "تنبيه مخالفة نشطة معلقة" : "Active Infraction Alert"}</span>
                                <span className="text-[8.5px] text-gray-400 block max-w-[150px] truncate">{isAr ? v.title : v.titleEn}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedViolation(v);
                                setActiveBottomSheet("violation_detail");
                              }}
                              className="bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold px-2 py-1 text-[9px] rounded-lg cursor-pointer transition hover:bg-rose-500/30"
                            >
                              {isAr ? "تظلم الذكاء الاصطناعي ←" : "Appel AI"}
                            </button>
                          </div>
                        ))}

                        {/* Thumb-Friendly Bento Navigation Grid (UPGRADED: interactive scale + labels) */}
                        <div className="grid grid-cols-2 gap-2.5">
                          
                          <div 
                            onClick={() => transitionToTab("attendance")}
                            className="p-3 bg-gradient-to-tr from-[#050b1a] to-[#040813] border border-white/5 hover:border-amber-400/30 rounded-xl text-right flex flex-col justify-between h-24 cursor-pointer transition select-none shadow hover:shadow-indigo-950/20"
                          >
                            <span className="p-1 px-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg self-start">
                              <Clock className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <span className="text-xs font-black block text-white">{isAr ? "الحضور والـ GPS" : "GPS Clock"}</span>
                              <span className="text-[8.5px] text-gray-500">{isAr ? "تسجيل الموقع الفوري" : "Geofencing map"}</span>
                            </div>
                          </div>

                          <div 
                            onClick={() => transitionToTab("leaves")}
                            className="p-3 bg-gradient-to-tr from-[#050b1a] to-[#040813] border border-white/5 hover:border-blue-400/30 rounded-xl text-right flex flex-col justify-between h-24 cursor-pointer transition select-none shadow hover:shadow-indigo-950/20"
                          >
                            <span className="p-1 px-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg self-start">
                              <Calendar className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <span className="text-xs font-black block text-white">{isAr ? "رصيد الإجازات" : "Leave ledger"}</span>
                              <span className="text-[8.5px] text-gray-400">{isAr ? "أيام الصلاحية: 18 يوم" : "18 days remaining"}</span>
                            </div>
                          </div>

                          <div 
                            onClick={() => transitionToTab("payroll")}
                            className="p-3 bg-gradient-to-tr from-[#050b1a] to-[#040813] border border-white/5 hover:border-emerald-400/30 rounded-xl text-right flex flex-col justify-between h-24 cursor-pointer transition select-none shadow hover:shadow-indigo-950/20"
                          >
                            <span className="p-1 px-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg self-start">
                              <DollarSign className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <span className="text-xs font-black block text-white">{isAr ? "الأجور والمسيرات" : "Payroll Slips"}</span>
                              <span className="text-[8.5px] text-gray-500">{isAr ? "تفقد المستحقات" : "Pay checkup"}</span>
                            </div>
                          </div>

                          <div 
                            onClick={() => transitionToTab("profile")}
                            className="p-3 bg-gradient-to-tr from-[#050b1a] to-[#040813] border border-white/5 hover:border-indigo-400/30 rounded-xl text-right flex flex-col justify-between h-24 cursor-pointer transition select-none shadow hover:shadow-indigo-950/20"
                          >
                            <span className="p-1 px-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg self-start">
                              <User className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <span className="text-xs font-black block text-white">{isAr ? "الملف الوظيفي" : "Dossier bio"}</span>
                              <span className="text-[8.5px] text-gray-500">{isAr ? "الوثائق وعقود قوى" : "Official docs"}</span>
                            </div>
                          </div>

                        </div>

                        {/* Recent ledger compliance announcements */}
                        <div className="bg-[#050a17] rounded-xl border border-white/5 p-3.5 space-y-3 text-right">
                          <h4 className="text-[10px] font-black text-gray-300 border-r-2 border-[#D4AF37] pr-1.5 uppercase">
                            {isAr ? "آخر المعاملات المتلقاة في المنشأة" : "Latest C9 Compliance Events"}
                          </h4>
                          <div className="space-y-2">
                            <div className="p-2 bg-[#1c2541] border border-white/5 rounded-lg text-[9.5px] space-y-1">
                              <div className="flex justify-between items-center text-[8px]">
                                <span className="text-emerald-400 font-bold">C9_LEDGER ✓</span>
                                <span className="text-gray-500 font-mono">2026-05-24</span>
                              </div>
                              <p className="text-gray-300 leading-relaxed font-bold">
                                {isAr ? "تم إيداع مسير موازنة الرواتب لشهر مايو للمطابقة." : "May salary structures fully synchronized."}
                              </p>
                            </div>

                            <div className="p-2 bg-[#1c2541] border border-white/5 rounded-lg text-[9.5px] space-y-1">
                              <div className="flex justify-between items-center text-[8px]">
                                <span className="text-blue-300 font-bold">QAWARIB ✓</span>
                                <span className="text-gray-500 font-mono">2025-01-01</span>
                              </div>
                              <p className="text-gray-300 leading-relaxed font-bold">
                                {isAr ? "تم ربط الكيان رائع التقنية وتأكيد تعيينك رئيسا للتخطيط." : "Initial onboarding registration completed."}
                              </p>
                            </div>
                          </div>
                        </div>

                      </motion.div>
                    )}

                    {/* 2. ATTENDANCE SCREEN (شاشة الحضور والـ GPS) */}
                    {activeTab === "attendance" && (
                      <motion.div
                        key="mb-attendance"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4"
                      >
                        {/* Attendance state card */}
                        <div className="p-4 bg-[#050a17] rounded-xl border border-white/5 text-center space-y-3">
                          <div className="flex justify-between items-center text-[9px] text-gray-400 border-b border-white/5 pb-2">
                            <span>{isAr ? "نطاق التحكيم الجيومكاني" : "Geospatial Boundary Map"}</span>
                            <span className="font-mono text-[#D4AF37]">{profile.branch.split(" - ")[0]}</span>
                          </div>

                          {/* Interactive Sovereign Live GPS Map Grounding */}
                          <div className="mb-4 text-right">
                            <SovereignMap
                              centerAddress={profile.branch}
                              geofenceRadiusMeters={300}
                              onLocationUpdate={(lat, lng, inBounds) => {
                                setIsInsideGeofence(inBounds);
                              }}
                              lang={isAr ? "ar" : "en"}
                            />
                          </div>

                          {/* Toggle Simulation coordinates to test out-of-bounds */}
                          <div className="flex justify-between items-center bg-[#1c2541] p-2.5 rounded-xl border border-white/5">
                            <div className="text-right">
                              <span className="text-[10px] text-gray-400 block">{isAr ? "تحكيم موقع البصمة" : "Geofence Enforcement"}</span>
                              <span className={`text-[11px] font-black ${isInsideGeofence ? "text-emerald-400" : "text-amber-400"}`}>
                                {isInsideGeofence ? (isAr ? "داخل حي الشاطئ ✓" : "Inside Geofence Boundary ✓") : (isAr ? "خارج نطاق الفرع المعتمد ⚠️" : "Outside Geofence Limits ⚠️")}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsInsideGeofence(!isInsideGeofence);
                                simulateHaptic("bounds-toggle");
                              }}
                              className="px-2 py-1 text-[8px] bg-white/5 hover:bg-white/10 text-[#D4AF37] rounded border border-[#D4AF37]/20 cursor-pointer font-bold"
                            >
                              {isInsideGeofence ? (isAr ? "محاكاة خروج عن النطاق" : "Simulate Out of Bounds") : (isAr ? "إعادة لنطاق العمل فرع جدة" : "Restore Work limits")}
                            </button>
                          </div>

                          {/* UPGRADED: GIANT DYNAMIC CHECKIN BUTTON WITH ANIMATIONS */}
                          <div className="py-4 flex justify-center items-center relative">
                            {/* Animated ring backgrounds */}
                            <div className="absolute w-36 h-36 rounded-full bg-blue-500/10 animate-ping duration-1000 opacity-60 pointer-events-none" />
                            <div className="absolute w-28 h-28 rounded-full bg-[#D4AF37]/5 animate-pulse duration-1000 pointer-events-none" />

                            <button
                              type="button"
                              onClick={() => triggerGpsCheckIn("in")}
                              disabled={gpsLoading}
                              className={`w-28 h-28 rounded-full border-4 ${
                                isInsideGeofence 
                                  ? "border-emerald-500/30 bg-gradient-to-tr from-emerald-600 to-teal-800 shadow-xl shadow-emerald-950/20" 
                                  : "border-amber-500/30 bg-gradient-to-tr from-amber-600 to-rose-800 shadow-xl shadow-amber-950/20"
                              } flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 text-white font-black`}
                            >
                              {gpsLoading ? (
                                <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              ) : (
                                <>
                                  <Fingerprint className="w-8 h-8 stroke-[2.5]" />
                                  <span className="text-xs font-black block mt-1">
                                    {isAr ? "تسجيل النبضة" : "Clock Device"}
                                  </span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* UPGRADED: Success Animation Box on Successful GPS Stamp */}
                          {successAnimation && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-emerald-300 text-[10px] text-center"
                            >
                              <CheckCircle className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
                              <span className="font-extrabold block">{isAr ? "تم إصدار طابع الحضور والمطابقة بالسيادة الكودية!" : "GPS Clock-In Successfully Verified on Live Grid!"}</span>
                            </motion.div>
                          )}

                          {/* Link to submit manual out-of-bound / GPS issue bypass */}
                          <p className="text-[9.5px] text-gray-400">
                            {isAr ? "تواجه مشاكل بالتتبع الجيولوجي بالجهاز؟" : "GPS network lag or system mismatch?"}{" "}
                            <button 
                              onClick={() => setActiveBottomSheet("gps_fault")}
                              className="text-blue-400 underline font-extrabold cursor-pointer"
                            >
                              {isAr ? "قدم بلاغ التماس موقعي الآن ←" : "File high accuracy claim"}
                            </button>
                          </p>
                        </div>

                        {/* Attendance Log List */}
                        <div id="attendance-log-listing" className="space-y-2">
                          <h4 className="text-[10px] text-gray-400 font-extrabold text-right uppercase tracking-wider">{isAr ? "السجل الزمني للبصمات اليوم" : "Today's GPS Signal Logs"}</h4>
                          
                          {attendanceLogs.length === 0 ? (
                            <p className="text-xs text-center py-4 text-gray-500">{isAr ? "لا توجد حركات حضور حالياً." : "Empty device records."}</p>
                          ) : (
                            attendanceLogs.slice(0, 3).map((log, i) => (
                              <div key={log.id || i} className="p-3 bg-[#1c2541] border border-white/5 rounded-xl flex justify-between items-center text-right">
                                <span className="text-[8.5px] text-gray-500 font-mono font-bold">{log.time}</span>
                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-bold block text-white">{log.checkType}</span>
                                  <span className={`text-[8.5px] ${log.alert ? "text-amber-400" : "text-gray-400"}`}>{log.locStatus}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                      </motion.div>
                    )}

                    {/* 3. LEAVES SCREEN (شاشة الإجازات) */}
                    {activeTab === "leaves" && (
                      <motion.div
                        key="mb-leaves"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4"
                      >
                        {/* Vacation balance indicator */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-[#050a17] border border-white/5 rounded-xl text-center">
                            <span className="text-[8.5px] text-gray-400 block">{isAr ? "الرصيد الكلي المتاح" : "Max entitlement"}</span>
                            <span className="text-lg font-black font-mono text-emerald-400 block mt-1">{leafBalance} {isAr ? "يوم" : "Days"}</span>
                          </div>
                          <div className="p-3 bg-[#050a17] border border-white/5 rounded-xl text-center">
                            <span className="text-[8.5px] text-gray-400 block">{isAr ? "طلبات قيد التدقيق" : "Under review"}</span>
                            <span className="text-lg font-black font-mono text-blue-400 block mt-1">1</span>
                          </div>
                        </div>

                        {/* UPGRADED: Mini Calendar visualizer for leaves */}
                        <div className="bg-[#050a17] border border-white/5 rounded-xl p-3 text-right space-y-2">
                          <span className="text-[9.5px] font-black text-gray-400 block">{isAr ? "الجدول الزمني الميداني للإجازات السنوية" : "Leave Schedule Visualizer"}</span>
                          <div className="grid grid-cols-7 gap-1 text-center text-[8.5px] font-mono border-b border-white/5 pb-1 text-gray-500">
                            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                          </div>
                          <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-mono py-1">
                            {Array.from({ length: 14 }).map((_, idx) => (
                              <span key={idx} className={`py-1 rounded ${idx === 3 || idx === 10 ? "bg-emerald-500/20 text-emerald-400 font-extrabold" : "text-gray-400"}`}>
                                {idx + 1}
                              </span>
                            ))}
                          </div>
                          <span className="text-[7.5px] text-gray-500 block text-center">
                            {isAr ? "الأخضر المظلل يمثّل عطلاً وإجازات سنوية مقبولة مسبقاً" : "Green zones represent verified rest periods."}
                          </span>
                        </div>

                        {/* Request leave button trigger (with layout transition) */}
                        <button
                          type="button"
                          onClick={() => {
                            setLeaveStep(1);
                            setActiveBottomSheet("new_leave_wizard");
                          }}
                          className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#bfa035] text-black font-bold text-xs rounded-xl cursor-pointer shadow-lg transition"
                        >
                          {isAr ? "+ تقديم طلب إجازة كودية جديدة" : "+ Draft New Leave Request"}
                        </button>

                        {/* Leaves list with status tags */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] text-gray-400 font-extrabold text-right uppercase tracking-wider">{isAr ? "سجل طلباتي والخطوات السابقة" : "Previous Leaves Records"}</h4>
                          
                          {leavesList.map(item => (
                            <div key={item.id} className="p-3 bg-[#050a17] border border-white/5 rounded-xl flex justify-between items-center text-right">
                              
                              {/* Strict Status tag with colored tags for compliance */}
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                item.status === "مقبولة" 
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" 
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/15"
                              }`}>
                                {item.status}
                              </span>

                              <div className="space-y-0.5">
                                <span className="text-[10.5px] font-bold block text-white">{item.type}</span>
                                <span className="text-[9px] text-gray-400 block font-mono">
                                  {item.range} ({item.duration} {isAr ? "أيام" : "Days"})
                                </span>
                              </div>

                            </div>
                          ))}
                        </div>

                      </motion.div>
                    )}

                    {/* 4. PAYROLL SCREEN (شاشة الرواتب) */}
                    {activeTab === "payroll" && (
                      <motion.div
                        key="mb-payroll"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4"
                      >
                        {/* Salary Summary Card */}
                        <div className="p-4 bg-gradient-to-tr from-blue-950/20 to-black/80 border border-white/5 rounded-2xl text-right space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[8.5px] text-gray-400">{isAr ? "المرتب الصافي المستحق شهرياً" : "Monthly Net Earnings"}</span>
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 py-0.5 px-2 rounded-full font-bold">
                              {isAr ? "مطابق وقوى ✓" : "Qiwa Compliant ✓"}
                            </span>
                          </div>
                          <div>
                            <span className="text-2xl font-black font-mono text-emerald-400 block">{profile.netSalary} ر.س</span>
                            <span className="text-[8.5px] text-gray-500 mt-0.5 block">{isAr ? "الراتب الأساسي: 5500 ر.س" : "Base salary: SAR 5500"}</span>
                          </div>
                        </div>

                        {/* UPGRADED: Pay slips horizontal carousel cards */}
                        <div className="space-y-2 text-right">
                          <span className="text-[10px] text-gray-400 font-extrabold block">{isAr ? "آخر شهادات الدفع المسجلة" : "Available Statements Slips"}</span>
                          
                          <div className="flex gap-2 w-full overflow-x-auto pb-2 snap-x">
                            {payslips.map(slip => (
                              <div 
                                key={slip.id}
                                onClick={() => {
                                  setSelectedPayslip(slip);
                                  setActiveBottomSheet("payslip");
                                  simulateHaptic(`slip-${slip.id}`);
                                }}
                                className="snap-start min-w-[200px] flex-1 bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-between h-24 hover:border-emerald-400/40 cursor-pointer transition text-right"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black text-white">{isAr ? slip.month : slip.monthEn}</span>
                                  <ArrowUpRightIcon className="w-3 h-3 text-emerald-400" />
                                </div>
                                <div>
                                  <span className="text-[13px] font-mono font-bold block text-emerald-300">{slip.net} ر.س</span>
                                  <span className="text-[8.5px] text-gray-500 block mt-0.5">{slip.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* UPGRADED: Allowances & deductions table */}
                        <div className="bg-[#050a17] rounded-xl p-3 border border-white/5 space-y-2 text-right">
                          <span className="text-[10px] text-gray-400 font-extrabold block">{isAr ? "تفاصيل بنود الراتب الافتراضي" : "Standard Compensations Matrix"}</span>
                          
                          <div className="space-y-1.5 text-[9.5px]">
                            <div className="flex justify-between py-1 border-b border-white/5">
                              <span className="text-gray-400">{isAr ? "بدل السكن المقرر" : "Housing Allowance"}</span>
                              <span className="text-white font-mono font-bold">{profile.allowanceHousing} ر.س</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-white/5">
                              <span className="text-gray-400">{isAr ? "بدل الانتقال" : "Transport Allowance"}</span>
                              <span className="text-white font-mono font-bold">{profile.allowanceTransport}  ر.س</span>
                            </div>
                            <div className="flex justify-between py-1 text-red-400 border-b border-white/5">
                              <span>{isAr ? "استقطاع التأمينات والـ GOSI" : "GOSI Deductions"}</span>
                              <span className="font-mono font-bold">-{profile.deductionsGosi} ر.س</span>
                            </div>
                          </div>
                        </div>

                      </motion.div>
                    )}

                    {/* 5. PROFILE & VIOLATIONS & APPEALS SCREEN (الملف الوظيفي والاعتراضات والمخالفات) */}
                    {activeTab === "profile" && (
                      <motion.div
                        key="mb-profile"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4"
                      >
                        {/* Profile User Info card */}
                        <div className="p-3 bg-[#050a17] border border-white/5 rounded-xl space-y-2 text-right">
                          <span className="text-[8px] font-mono text-indigo-400 block">LEXOPS DOSSIER CONTRACT</span>
                          <div className="flex items-center gap-2 justify-end">
                            <h3 className="text-xs font-black text-white">{profile.name}</h3>
                            <span className="text-lg">{profile.avatar}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-normal">{profile.profession}</p>
                          <div className="text-[9px] text-[#D4AF37] bg-[#D4AF37]/10 p-1 rounded inline-block">
                            {isAr ? "تاريخ التعيين والمجموع:" : "Hired Since:"} {profile.joinDate}
                          </div>
                        </div>

                        {/* UPGRADED: SOVEREIGN CAREER LIFELINE TIMELINE */}
                        <div className="p-3.5 bg-gradient-to-b from-[#060c1d] to-[#040815] border border-white/5 rounded-xl space-y-3 text-right">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-[10px] font-black text-white">{isAr ? "خط الحياة الالتزامي والمهني" : "Sovereign Career Lifeline"}</span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setTimelineFilter("all");
                                  simulateHaptic("timeline-all");
                                }}
                                className={`px-2 py-0.5 rounded text-[8.5px] font-bold border ${
                                  timelineFilter === "all"
                                    ? "bg-[#D4AF37]/20 border-[#D4AF37] text-white"
                                    : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                                }`}
                              >
                                {isAr ? "الكل" : "All"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setTimelineFilter("major");
                                  simulateHaptic("timeline-major");
                                }}
                                className={`px-2 py-0.5 rounded text-[8.5px] font-bold border ${
                                  timelineFilter === "major"
                                    ? "bg-[#D4AF37]/20 border-[#D4AF37] text-white"
                                    : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                                }`}
                              >
                                {isAr ? "المحطات" : "Major"}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3 relative before:absolute before:top-1.5 before:bottom-1.5 before:right-2 before:w-0.5 before:bg-white/10">
                            {[
                              { id: "e1", date: "2026-05-18", title: "رصد تفاوت هندامي بالمسح البصري", titleEn: "Dress code anomaly detected", isMajor: false, category: "notice", details: "رصد تيشرت غير رسمي مخالف للائحة المعتمدة عند مدخل فرع جدة للمستودع المالي.", hash: "SHA256-ANOM-902x" },
                              { id: "e2", date: "2026-03-01", title: "تنشيط وتوثيق التأمينات الاجتماعية GOSI", titleEn: "GOSI registration activated", isMajor: true, category: "gosi", details: "تم تأكيد تسجيل المنشأة والمطابقة الكلية لسجلات الموازنة والتأمين ساند رقمياً.", hash: "SHA256-GOSI-4882" },
                              { id: "e3", date: "2026-01-10", title: "مباشرة العمل الرسمي وتفعيل البوابة", titleEn: "Official onboarding to LexOps OS", isMajor: true, category: "onboard", details: "إقرار الوثائق والتوقيع الجيومكاني وبدء دورة العمل التشغيلي للموظف.", hash: "SHA256-ONBD-773a" }
                            ]
                              .filter(item => timelineFilter === "all" || item.isMajor)
                              .map(item => {
                                const isExpanded = expandedTimelineItem === item.id;
                                return (
                                  <div key={item.id} className="relative pr-6">
                                    {/* Timeline node dot */}
                                    <div className={`absolute right-[5px] top-1.5 w-1.5 h-1.5 rounded-full z-15 ${
                                      item.category === "notice" 
                                        ? "bg-rose-500 ring-4 ring-rose-500/20" 
                                        : item.category === "gosi"
                                          ? "bg-emerald-500 ring-4 ring-emerald-500/20"
                                          : "bg-[#D4AF37] ring-4 ring-[#D4AF37]/20"
                                    }`} />

                                    <div 
                                      onClick={() => {
                                        setExpandedTimelineItem(isExpanded ? null : item.id);
                                        simulateHaptic("timeline-item");
                                      }}
                                      className="bg-[#1c2541] p-2 border border-white/5 rounded-lg text-right cursor-pointer hover:border-white/10 transition space-y-1"
                                    >
                                      <div className="flex justify-between items-center">
                                        <span className="text-[7.5px] font-mono text-gray-500">{item.date}</span>
                                        <span className="text-[8px] text-gray-400 bg-white/5 px-1 rounded">{item.category}</span>
                                      </div>
                                      <h5 className="text-[9.5px] font-bold text-white max-w-[200px] truncate">{isAr ? item.title : item.titleEn}</h5>
                                      
                                      {isExpanded && (
                                        <motion.div 
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: "auto" }}
                                          className="text-[8.5px] text-gray-400 leading-normal border-t border-white/5 pt-1.5 mt-1 text-right space-y-1"
                                        >
                                          <p>{item.details}</p>
                                          <p className="font-mono text-[7px] text-[#D4AF37]">{item.hash}</p>
                                        </motion.div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {/* UPGRADED: OPEN vs CLOSED tab selector for violations */}
                        <div className="bg-[#050a17] p-1 border border-white/5 rounded-xl grid grid-cols-2 gap-1 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenViolationTab("open");
                              simulateHaptic("tab-open");
                            }}
                            className={`py-1 text-[10.5px] font-bold rounded-lg transition-all ${
                              openViolationTab === "open" ? "bg-red-500/10 text-red-400 font-black" : "text-gray-500 hover:text-white"
                            }`}
                          >
                            {isAr ? `مخالفات مفتوحة (${localViolations.filter(v => v.status === "نشطة").length})` : "Open Code Mismatch"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenViolationTab("closed");
                              simulateHaptic("tab-closed");
                            }}
                            className={`py-1 text-[10.5px] font-bold rounded-lg transition-all ${
                              openViolationTab === "closed" ? "bg-emerald-500/10 text-emerald-400 font-black" : "text-gray-500 hover:text-white"
                            }`}
                          >
                            {isAr ? `مخالفات مغلقة (${localViolations.filter(v => v.status === "مغلقة").length})` : "Closed Logs"}
                          </button>
                        </div>

                        {/* Violations listing according to the selected tab with evidence lightbox button */}
                        <div className="space-y-2">
                          {localViolations
                            .filter(v => (openViolationTab === "open" ? v.status === "نشطة" : v.status === "مغلقة"))
                            .map(viol => (
                              <div key={viol.id} className="p-3 bg-[#1c2541] border border-white/5 rounded-xl text-right space-y-2">
                                <span className="text-[9px] text-red-400 font-mono font-bold bg-red-500/10 px-1 py-0.2 rounded">
                                  {viol.id}
                                </span>
                                <h5 className="text-[11px] text-white font-bold leading-relaxed">{isAr ? viol.title : viol.titleEn}</h5>
                                <div className="text-[10px] text-gray-400">
                                  {isAr ? "الأثر المالي:" : "Deduction value:"} <span className="text-red-300 font-bold">{viol.impact}</span>
                                </div>

                                {/* UPGRADED: INTERACTIVE SWIPEABLE EVIDENCE CAROUSEL */}
                                <div className="bg-[#02050c] p-2.5 rounded-xl border border-white/5 space-y-2">
                                  <div className="flex justify-between items-center text-[8.5px] border-b border-white/5 pb-1 select-none">
                                    <span className="text-gray-400 font-extrabold">{isAr ? "المستعرض التفاعلي للأدلة" : "Sovereign Evidence Carousel"}</span>
                                    <span className="text-[#D4AF37] font-mono font-black">
                                      {((activeEvidenceIndexes[viol.id] || 0) + 1)} / 3
                                    </span>
                                  </div>

                                  <div className="min-h-[50px] flex items-center justify-center text-center py-2 px-1">
                                    {(activeEvidenceIndexes[viol.id] || 0) === 0 && (
                                      <div className="space-y-1 w-full">
                                        <span className="text-[8px] bg-red-500/15 text-rose-300 py-0.5 px-1 rounded inline-block font-mono">{isAr ? "لقطة الكاميرا" : "Camera Frame"}</span>
                                        <p className="text-[10px] text-gray-300 font-bold">{viol.evidenceFile}</p>
                                        <p className="text-[8.5px] text-gray-500">{isAr ? "رصد آلي للكائن بموجب النموذج البصري" : "Automated object recognition scan"}</p>
                                      </div>
                                    )}

                                    {(activeEvidenceIndexes[viol.id] || 0) === 1 && (
                                      <div className="space-y-1 w-full">
                                        <span className="text-[8px] bg-indigo-500/15 text-indigo-300 py-0.5 px-1 rounded inline-block font-mono">{isAr ? "البيانات الوصفية" : "System Metadata"}</span>
                                        <p className="text-[9.5px] text-gray-300 font-mono font-bold">SHA-256: 0x9c4f...d89a</p>
                                        <p className="text-[8.5px] text-[#D4AF37]">{isAr ? "رصد جغرافي: 21.6166°N, 39.1051°E" : "Coord: 21.6166°N, 39.1051°E"}</p>
                                      </div>
                                    )}

                                    {(activeEvidenceIndexes[viol.id] || 0) === 2 && (
                                      <div className="space-y-1.5 w-full">
                                        <span className="text-[8px] bg-amber-500/15 text-[#D4AF37] py-0.5 px-1 rounded inline-block font-mono">{isAr ? "فيلم Veo 3" : "Veo 3 Movie"}</span>
                                        <p className="text-[9.5px] text-emerald-400 font-bold">{isAr ? "جاهز للتوليف والمطابقة" : "Synthetic Reconstruction Ready"}</p>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setVideoPromptText(isAr 
                                              ? `إعادة صياغة ومحاكاة فيديو للحدث المرصود في المخالفة ${viol.id} وتأكيد تتبع الـ GPS لخط فرع جدة` 
                                              : `Reconstruction and video simulation of incident ${viol.id} confirming GPS tracking`
                                            );
                                            setVideoPromptContext("evidence");
                                            setActiveBottomSheet("video_generator");
                                            simulateHaptic("veo-trigger");
                                          }}
                                          className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/25 rounded text-[8.5px] font-black cursor-pointer transition mx-auto"
                                        >
                                          {isAr ? "توليد سيناريو بالفيديو (Veo 3) ←" : "Generate Video Scene ←"}
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Carousel Navigation Buttons */}
                                  <div className="flex justify-between items-center bg-[#1c2541] p-1 rounded-lg border border-white/5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const current = activeEvidenceIndexes[viol.id] || 0;
                                        const next = current === 0 ? 2 : current - 1;
                                        setActiveEvidenceIndexes({ ...activeEvidenceIndexes, [viol.id]: next });
                                        simulateHaptic("carousel-prev");
                                      }}
                                      className="px-1.5 py-0.5 text-[8.5px] bg-white/5 hover:bg-white/10 text-white rounded cursor-pointer font-bold"
                                    >
                                      {isAr ? "السابق ◀" : "◀ Prev"}
                                    </button>
                                    <div className="flex gap-1">
                                      {[0, 1, 2].map(idx => (
                                        <span
                                          key={idx}
                                          className={`w-1 h-1 rounded-full transition ${
                                            (activeEvidenceIndexes[viol.id] || 0) === idx ? "bg-[#D4AF37]" : "bg-white/20"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const current = activeEvidenceIndexes[viol.id] || 0;
                                        const next = current === 2 ? 0 : current + 1;
                                        setActiveEvidenceIndexes({ ...activeEvidenceIndexes, [viol.id]: next });
                                        simulateHaptic("carousel-next");
                                      }}
                                      className="px-1.5 py-0.5 text-[8.5px] bg-white/5 hover:bg-white/10 text-white rounded cursor-pointer font-bold"
                                    >
                                      {isAr ? "التالي ▶" : "Next ▶"}
                                    </button>
                                  </div>
                                </div>

                                {openViolationTab === "open" && (
                                  <button
                                    onClick={() => {
                                      setSelectedViolation(viol);
                                      setActiveBottomSheet("violation_detail");
                                    }}
                                    className="w-full py-1.5 bg-rose-500/10 text-rose-300 border border-rose-500/15 text-[10px] font-bold rounded-lg hover:bg-rose-500/20 cursor-pointer"
                                  >
                                    {isAr ? "صياغة تظلم مسبب عبر مساعد LEXI AI" : "Object on live ledger framework"}
                                  </button>
                                )}
                              </div>
                            ))}
                        </div>

                        {/* UPGRADED: FLOATING ACTION BUTTON (FAB) for instant general query objection */}
                        <div className="relative pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedViolation(localViolations[0]);
                              setActiveBottomSheet("new_appeal_wizard");
                              setAppealStep(1);
                              simulateHaptic("fab-appeal");
                            }}
                            className="w-full py-2 bg-gradient-to-r from-red-600 to-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow"
                          >
                            <FilePen className="w-3.5 h-3.5" />
                            <span>{isAr ? "تحرير مذكرة اعتراض قضائي مستعجل" : "Draft Emergency C9 Appeal"}</span>
                          </button>
                        </div>

                        {/* Listed Submitted Answers (Objections props connection) */}
                        <div className="space-y-1.5 pt-2">
                          <h4 className="text-[10px] text-gray-400 font-extrabold text-right uppercase tracking-wider">
                            {isAr ? "الاعتراضات المودعة بسجل التدقيق القوى" : "Your Submitted Appeals"}
                          </h4>
                          {objections.length === 0 ? (
                            <p className="text-[9.5px] text-center text-gray-500 py-2">{isAr ? "لم يتم إيداع عينات اعتراض بالملف" : "No pending appeals registered."}</p>
                          ) : (
                            objections.map(app => (
                              <div key={app.id} className="p-2.5 bg-[#050a17] border border-white/5 rounded-xl text-right text-[10px] space-y-1">
                                <div className="flex justify-between items-center text-[8.5px]">
                                  <span className="text-blue-300 font-extrabold">{app.status}</span>
                                  <span className="text-gray-500">{app.id}</span>
                                </div>
                                <p className="text-gray-300 truncate">{app.text}</p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* UPGRADED: Downloadable Official Documents Grid */}
                        <div className="bg-[#050a17] rounded-xl p-3 border border-white/5 space-y-2 text-right text-[9.5px]">
                          <span className="font-extrabold block text-gray-400">{isAr ? "الوثائق الحكومية وعقد قوى المصدق" : "Official Digital Dossier Assets"}</span>
                          
                          <div className="space-y-2 pt-1">
                            <a href="#" className="flex justify-between items-center p-2 bg-[#1c2541] border border-white/5 rounded-lg text-white hover:border-[#D4AF37]/35">
                              <div className="flex items-center gap-2">
                                <FileCheck className="w-4 h-4 text-[#D4AF37]" />
                                <span className="font-mono">{isAr ? "عقد العمل الرقمي المنسق.pdf" : "Contract.pdf"}</span>
                              </div>
                              <Download className="w-3.5 h-3.5 text-gray-400" />
                            </a>

                            <a href="#" className="flex justify-between items-center p-2 bg-[#1c2541] border border-white/5 rounded-lg text-[#D4AF37] hover:border-[#D4AF37]/35">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span className="font-mono">{isAr ? "البيانات الطبية والتأمين.pdf" : "Insurance.pdf"}</span>
                              </div>
                              <Download className="w-3.5 h-3.5 text-gray-400" />
                            </a>
                          </div>
                        </div>

                        {/* 🛡️ Employee Direct Support Request To Founder */}
                        <div className="bg-[#050a17] rounded-xl p-3 border border-white/5 space-y-2 text-right text-[9.5px]">
                          <span className="font-extrabold block text-[#D4AF37]">{isAr ? "الدعم الفني والمراسلة السيادية للمؤسس" : "Direct Founder Support Request"}</span>
                          <p className="text-[9px] text-gray-400">
                            {isAr ? "يمكنك تقديم استفسار أو شكوى للتوجيه المباشر والرد المصدق من قبل المؤسس." : "Submit queries or technical grievances directly to the founder's review dashboard."}
                          </p>

                          <form onSubmit={handleSubmitEmpSupport} className="space-y-2 mt-2">
                            <input 
                              type="text"
                              value={empSupportSubject}
                              onChange={(e) => setEmpSupportSubject(e.target.value)}
                              placeholder={isAr ? "عنوان تذكرة الدعم..." : "Support subject..."}
                              className="w-full text-right text-xs bg-[#1c2541] text-white p-2 rounded border border-white/10 focus:border-[#D4AF37] outline-none"
                            />
                            <textarea 
                              value={empSupportMessage}
                              onChange={(e) => setEmpSupportMessage(e.target.value)}
                              placeholder={isAr ? "اكتب تفاصيل التظلم أو الاستفسار هنا للتوجيه والتحري..." : "Describe your issue or grievance..."}
                              className="w-full text-right text-xs bg-[#1c2541] text-white p-2 rounded border border-white/10 focus:border-[#D4AF37] outline-none min-h-[50px] resize-y"
                            />
                            <div className="flex justify-end">
                              <button 
                                type="submit"
                                disabled={isSubmittingEmpSupport}
                                className="cursor-pointer bg-[#D4AF37] hover:bg-[#b08f2e] text-black font-extrabold px-3 py-1 rounded text-[8.5px] transition duration-200"
                              >
                                {isSubmittingEmpSupport ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال التذكرة للمؤسس 🔐" : "Send to Founder 🔐")}
                              </button>
                            </div>
                          </form>

                          {/* Senders tickets log */}
                          <div className="border-t border-white/5 pt-2 space-y-1.5">
                            <span className="text-[8.5px] text-gray-400 block font-bold">{isAr ? "تذاكر الدعم والردود الخاصة بك:" : "Your submitted tickets & responses:"}</span>
                            {supportRequests.filter((s: any) => s.senderId === (currentUser?.id || "EMP-04")).length === 0 ? (
                              <p className="text-[8.5px] text-gray-500 text-center">{isAr ? "لا توجد تذاكر دعم سابقة مسجلة." : "No support tickets sent yet."}</p>
                            ) : (
                              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                {supportRequests.filter((s: any) => s.senderId === (currentUser?.id || "EMP-04")).map((ticket: any) => (
                                  <div key={ticket.id} className="p-2 bg-[#1c2541] rounded border border-white/5 space-y-1">
                                    <div className="flex justify-between items-center text-[7.5px] flex-row-reverse">
                                      <span className={`px-1 rounded font-bold ${ticket.status === "pending" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                                        {ticket.status === "pending" ? (isAr ? "قيد المراجعة" : "Pending") : (isAr ? "تم الحل" : "Resolved")}
                                      </span>
                                      <span className="text-gray-500 font-mono text-[7px]">{ticket.id}</span>
                                    </div>
                                    <h6 className="text-[9px] font-bold text-white font-sans">{ticket.title}</h6>
                                    <p className="text-[8.5px] text-gray-400 font-sans">{ticket.details}</p>
                                    
                                    {ticket.status === "resolved" && (
                                      <div className="bg-emerald-950/20 border border-emerald-500/20 p-1.5 rounded-lg text-right mt-1 space-y-0.5 font-sans">
                                        <span className="text-[8px] text-emerald-400 font-bold block">🛡️ رد وتوجيه المؤسس:</span>
                                        <p className="text-[8.5px] text-gray-200">{ticket.reply}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                      </motion.div>
                    )}

                  </AnimatePresence>
                )}

              </div>

              {/* 🏆 CORE REDESIGNED BOTTOM NAVIGATION BAR */}
              <nav className="absolute bottom-0 left-0 right-0 h-16 bg-[#040815] border-t border-white/10 flex justify-around items-center px-2 pb-1 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
                
                {[
                  { id: "home", labelAr: "الرئيسية", labelEn: "Home", icon: Compass },
                  { id: "attendance", labelAr: "الحضور", labelEn: "Clock", icon: Clock },
                  { id: "leaves", labelAr: "الإجازات", labelEn: "Leaves", icon: Calendar },
                  { id: "payroll", labelAr: "الرواتب", labelEn: "Wages", icon: CreditCard },
                  { id: "profile", labelAr: "الملفي", labelEn: "Dossier", icon: User }
                ].map(tab => {
                  const IconComponent = tab.icon;
                  const isTabActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => transitionToTab(tab.id as any)}
                      className="relative flex flex-col items-center justify-center flex-1 h-full cursor-pointer focus:outline-none focus:ring-0 select-none"
                    >
                      {/* Spring Active glow scale indicator */}
                      <div className={`p-1 rounded-full transition-all duration-200 ${
                        isTabActive 
                          ? "text-[#D4AF37] scale-110 drop-shadow-[0_0_6px_rgba(212,175,55,0.4)]" 
                          : "text-gray-400 hover:text-white"
                      }`}>
                        <IconComponent className="w-5.5 h-5.5" />
                      </div>
                      
                      {/* Text undericon label */}
                      <span className={`text-[8px] font-bold mt-1 tracking-wide transition-all ${
                        isTabActive ? "text-white font-black" : "text-gray-500"
                      }`}>
                        {isAr ? tab.labelAr : tab.labelEn}
                      </span>

                      {isTabActive && (
                        <span className="absolute bottom-0.5 w-1 h-1 bg-[#D4AF37] rounded-full" />
                      )}
                    </button>
                  );
                })}

              </nav>

            </div>
          )}

          {/* 🔽 INTERACTIVE REUSABLE BOTTOM SHIELD (Upgraded Bottom Sheets) */}
          <AnimatePresence>
            {activeBottomSheet && (
              <div className="absolute inset-0 z-50">
                {/* Backdrop overlay and tap off to close */}
                <div 
                  className="absolute inset-0 bg-[#1c2541] backdrop-blur-sm transition-opacity"
                  onClick={() => {
                    setActiveBottomSheet(null);
                    setLeaveStep(1);
                    setAppealStep(1);
                  }}
                />

                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="absolute bottom-0 left-0 right-0 max-h-[90%] bg-[#061021] border-t-2 border-[#D4AF37]/50 rounded-t-[32px] p-5 overflow-y-auto text-right font-sans"
                >
                  
                  {/* Pull notch */}
                  <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-4" />
                  
                  <div className="flex justify-between items-center border-b border-white/5 pb-2.5 mb-3">
                    <button 
                      onClick={() => {
                        setActiveBottomSheet(null);
                        setLeaveStep(1);
                        setAppealStep(1);
                      }}
                      className="p-1 text-gray-400 hover:text-white cursor-pointer bg-white/5 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <h3 className="text-xs font-black text-[#D4AF37]">
                      {activeBottomSheet === "payslip" && (isAr ? "بيان الراتب المصدق" : "Payslip Details")}
                      {activeBottomSheet === "new_leave_wizard" && (isAr ? "مساعد تقديم الإجازات بالتتابع" : "New Leave Application Wizard")}
                      {activeBottomSheet === "violation_detail" && (isAr ? "مذكرة اعتراض كاشف بالذكاء الاصطناعي" : "AI Legal Objection Workspace")}
                      {activeBottomSheet === "new_appeal_wizard" && (isAr ? "تحرير وثيقة اعتراض عاجل" : "Emergency Objection Editor")}
                      {activeBottomSheet === "gps_fault" && (isAr ? "تسجيل خلل تقني بالتموضع الجغرافي" : "File GPS Interruption Bypass Code")}
                      {activeBottomSheet === "video_generator" && (isAr ? "محرك توليد إثباتات الفيديو LEXI Video (Veo 3)" : "LEXI Video Generation (Veo 3)")}
                    </h3>
                  </div>

                  {/* SHEET VEO: Video Generator Block */}
                  {activeBottomSheet === "video_generator" && (
                    <div className="space-y-4">
                      <LexiVideoGenerator
                        initialPrompt={videoPromptText}
                        contextType={videoPromptContext}
                        lang={isAr ? "ar" : "en"}
                      />
                    </div>
                  )}

                  {/* SHEET A: Payslip full detailed breakup */}
                  {activeBottomSheet === "payslip" && selectedPayslip && (
                    <div className="space-y-4">
                      <div className="text-center p-3.5 bg-[#1c2541] border border-white/5 rounded-2xl">
                        <span className="text-[10px] text-gray-400 block">{selectedPayslip.month}</span>
                        <span className="text-xl font-bold font-mono text-emerald-400 block mt-1">{selectedPayslip.net} ر.س</span>
                      </div>

                      <div className="space-y-2.5 text-xs text-white">
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-gray-400">{isAr ? "المرتب الأساسي" : "Base Salary"}</span>
                          <span className="font-mono">{selectedPayslip.basic} ر.س</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-gray-400">{isAr ? "بدل السكن الموزع" : "Housing Allowance"}</span>
                          <span className="font-mono">{selectedPayslip.housing} ر.س</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-gray-400">{isAr ? "بدل النقل البري" : "Transport Allowance"}</span>
                          <span className="font-mono">{selectedPayslip.transport} ر.س</span>
                        </div>
                        <div className="flex justify-between text-red-400 pb-1">
                          <span>{isAr ? "المقدار المستقطع (ساند والتأمينات)" : "GOSI Deductions"}</span>
                          <span className="font-mono">-{selectedPayslip.deductions} ر.س</span>
                        </div>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 text-[9px] text-center text-emerald-300 rounded">
                        {isAr ? "تم غسيل ومطابقة الراتب بموجب معايير الربط الكلي مع قوى." : "Validated automatically under national labor specifications."}
                      </div>
                    </div>
                  )}

                  {/* SHEET B: Stepped Leave Wizard */}
                  {activeBottomSheet === "new_leave_wizard" && (
                    <div className="space-y-4 text-xs">
                      {/* Step trackers */}
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 border-b border-white/5 pb-2">
                        <span className={leaveStep >= 1 ? "text-[#D4AF37]" : ""}>{isAr ? "1) نوع الإجازة" : "1) Leave Type"}</span>
                        <span className={leaveStep >= 2 ? "text-[#D4AF37]" : ""}>{isAr ? "2) اختيار المدى" : "2) Select Range"}</span>
                        <span className={leaveStep >= 3 ? "text-[#D4AF37]" : ""}>{isAr ? "3) إرسال ومصادقة" : "3) Confirm"}</span>
                      </div>

                      {leaveStep === 1 && (
                        <div className="space-y-3 pt-2 text-right">
                          <label className="block text-[10px] text-gray-450 mr-1">{isAr ? "اختر بنية الإجازة المراد احتسابها:" : "Choose policy type:"}</label>
                          <select 
                            value={newLeaveType} 
                            onChange={(e) => setNewLeaveType(e.target.value)}
                            className="w-full bg-[#1c2541] border border-white/10 rounded-xl py-2 px-3 focus:outline-none focus:border-[#D4AF37]"
                          >
                            <option value="إجازة سنوية">{isAr ? "إجازة سنوية اعتيادية من المحفظة" : "Annual Paid Leave"}</option>
                            <option value="إجازة مرضية">{isAr ? "مرضية طارئة بموجب تقرير صحتي" : "Sick Leave with report"}</option>
                            <option value="استثنائية">{isAr ? "استثنائية بدون راتب وتتطلب موافقة" : "Exceptional Unpaid"}</option>
                          </select>

                          <button 
                            type="button" 
                            onClick={nextLeaveStep}
                            className="w-full py-2 bg-[#D4AF37] text-black font-bold rounded-lg cursor-pointer"
                          >
                            {isAr ? "التالي: اختيار التواريخ والمدى" : "Next: Input dates"}
                          </button>
                        </div>
                      )}

                      {leaveStep === 2 && (
                        <div className="space-y-3 pt-2">
                          <label className="block text-[10px] text-gray-400 mr-1">{isAr ? "تحديد تواريخ التواجد الميداني المطلوبة:" : "Dates:"}</label>
                          <input 
                            type="text" 
                            value={newLeaveRange} 
                            onChange={(e) => setNewLeaveRange(e.target.value)}
                            placeholder="2026-07-01 - 2026-07-04"
                            className="w-full bg-[#1c2541] border border-white/10 rounded-xl py-2 px-3 font-mono focus:border-[#D4AF37] focus:outline-none"
                          />

                          <div className="space-y-2">
                            <label className="block text-[10px] text-gray-400 mr-1">{isAr ? "عدد الأيام المطلوبة:" : "Days duration:"}</label>
                            <input 
                              type="number" 
                              value={newLeaveDuration} 
                              onChange={(e) => setNewLeaveDuration(Number(e.target.value))}
                              min={1} 
                              max={leafBalance}
                              className="w-full bg-[#1c2541] border border-white/10 rounded-xl py-2 px-3 font-mono focus:border-[#D4AF37]"
                            />
                          </div>

                          <button 
                            type="button" 
                            onClick={nextLeaveStep}
                            className="w-full py-2 bg-[#D4AF37] text-black font-bold rounded-lg cursor-pointer"
                          >
                            {isAr ? "التالي: مراجعة العقد والإيداع" : "Next: Review submission"}
                          </button>
                        </div>
                      )}

                      {leaveStep === 3 && (
                        <div className="space-y-3 pt-2">
                          <div className="bg-[#1c2541] border border-white/5 p-3 rounded-lg text-xs leading-relaxed space-y-1">
                            <p className="text-gray-400">{isAr ? "الصحيفة الكاشفة للأطراف:" : "Summary Details:"}</p>
                            <p className="text-[#D4AF37] font-bold">{newLeaveType} | {newLeaveDuration} {isAr ? "أيام" : "Days"}</p>
                            <p className="font-mono text-white text-[10.5px]">{newLeaveRange}</p>
                          </div>

                          <p className="text-[9px] text-[#D4AF37]">
                            {isAr ? "عند الضغط سيتم حجز هذه المدة وخصم الرصيد تلقائياً بقانون الجريدة." : "This will immediately update contract balance ledger on approval."}
                          </p>

                          <button 
                            type="button" 
                            onClick={handleAddLeaveSubmit}
                            className="w-full py-2 bg-emerald-500 font-bold text-white rounded-lg cursor-pointer"
                          >
                            {isAr ? "تأكيد وإيداع الطلب النهائي" : "Confirm and Push Verification"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SHEET C: AI Appeal generator with digital signature */}
                  {(activeBottomSheet === "violation_detail" || activeBottomSheet === "new_appeal_wizard") && selectedViolation && (
                    <div className="space-y-4">
                      <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-right">
                        <span className="text-[8px] bg-red-500/10 text-red-400 py-0.2 px-1 rounded block w-max mb-1 font-mono">{selectedViolation.id}</span>
                        <h4 className="text-[11px] font-bold text-white leading-normal">{isAr ? selectedViolation.title : selectedViolation.titleEn}</h4>
                        <span className="text-[10px] text-gray-400 block mt-1">{isAr ? "القيمة المالية للخصم:" : "Deduction Impact:"} <span className="text-red-300 font-bold">{selectedViolation.impact}</span></span>
                      </div>

                      {/* Companion Veo 3 Video trigger button */}
                      <button
                        type="button"
                        onClick={() => {
                          setVideoPromptText(isAr 
                            ? `صياغة سيناريو مرئي للأثر الجغرافي المسجل للمخالفة رقم ${selectedViolation.id} وتفويض الموقع في تاريخ ${selectedViolation.date}` 
                            : `Generate visual scene mapping geographical limits for record ${selectedViolation.id} on date ${selectedViolation.date}`
                          );
                          setVideoPromptContext("objection");
                          setActiveBottomSheet("video_generator");
                          simulateHaptic("veo-trigger");
                        }}
                        className="w-full py-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-xl text-[10px] items-center justify-center gap-1.5 transition cursor-pointer flex font-bold"
                      >
                        <Video className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{isAr ? "توليد إثبات فيديو مرافق بالـ (Veo 3)" : "Generate Evidence Video (Veo 3)"}</span>
                      </button>

                      {appealStep === 1 && (
                        <div className="space-y-3 text-right">
                          <p className="text-[10px] text-gray-400 leading-normal">
                            {isAr ? "يقوم الذكاء الاصطناعي Lexi AI بصياغة مذكرة اعتراضية قانونية كاشفة لحيثيات الموقع:" : "Lexi AI wizard generates formal objection statement based on geofence mismatch parameters:"}
                          </p>

                          <button
                            type="button"
                            onClick={() => handleGenerateAppealAI(selectedViolation)}
                            disabled={aiGeneratingAppeal}
                            className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90 text-white text-xs font-bold rounded-xl cursor-pointer transition flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>{aiGeneratingAppeal ? (isAr ? "جاري الاستشارة القانونية الكودية..." : "Legalizing...") : (isAr ? "كبس وتوليد نموذج الاعتراض فوراً" : "Generate Legal Appeal Draft")}</span>
                          </button>

                          {generatedAppealDoc && (
                            <div className="space-y-3 pt-2">
                              <div className="p-3 bg-[#1c2541] border border-white/5 rounded-xl font-mono text-[10px] text-gray-300 max-h-[160px] overflow-y-auto text-right leading-relaxed whitespace-pre-line">
                                {generatedAppealDoc}
                              </div>

                              <button
                                type="button"
                                onClick={() => setAppealStep(2)}
                                className="w-full py-2 bg-[#D4AF37] text-black font-bold text-xs rounded-xl cursor-pointer"
                              >
                                {isAr ? "الانتقال للتوقيع الإلكتروني والمصادقة" : "Proceed to digital signature"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {appealStep === 2 && (
                        <div className="space-y-3 text-right">
                          <span className="text-[10px] text-gray-400 block">{isAr ? "يرجى التوقيع داخل الصندوق الإلكتروني تالياً لمصادقة التظلم:" : "Sign within the perimeter below to certify objection:"}</span>
                          
                          {/* Signature board */}
                          <div className="bg-[#1c2541] border border-white/10 rounded-xl overflow-hidden relative h-32">
                            <canvas
                              ref={canvasRef}
                              width={350}
                              height={128}
                              className="w-full h-full cursor-crosshair bg-[#1c2541]"
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              onTouchStart={startDrawing}
                              onTouchMove={draw}
                              onTouchEnd={stopDrawing}
                            />
                            <button
                              type="button"
                              onClick={clearSignature}
                              className="absolute top-2 left-2 p-1.5 bg-[#121926]/90 border border-white/5 hover:bg-[#1c273a] text-gray-400 hover:text-white rounded-lg text-[9px] cursor-pointer"
                            >
                              {isAr ? "مسح" : "Clear"}
                            </button>
                          </div>

                          <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-[9px] text-gray-400">
                            {isAr ? "التوقيع مشفر ومقفل على سجلات الـ C9 لمطابقة قوى." : "Cryptographic signature node will lock coordinates for live submission."}
                          </div>

                          <button
                            type="button"
                            onClick={() => submitAppealToLedger(selectedViolation.id)}
                            disabled={!signatureData}
                            className={`w-full py-2 text-xs font-black rounded-xl transition ${
                              signatureData 
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer" 
                                : "bg-white/10 text-gray-500 cursor-not-allowed border border-white/5"
                            }`}
                          >
                            {isAr ? "مصادقة الاعتراض وإرساله للمحكمة" : "Submit signature payload"}
                          </button>
                        </div>
                      )}

                    </div>
                  )}

                  {/* SHEET D: GPS Fault Reporting */}
                  {activeBottomSheet === "gps_fault" && (
                    <form onSubmit={handleSendProblemForm} className="space-y-3 text-right">
                      <p className="text-[9.5px] text-gray-400 leading-normal">
                        {isAr ? "إذا تعذر تحديد إحداثياتك بنطاق المنشأة جراء عطل هاتفي، قدم عذر الاستباقية لتلافيه مسبقاً:" : "File proactive bypass appeal regarding GPS or telecom hardware miscalculations:"}
                      </p>

                      <div>
                        <label className="block text-[8.5px] text-gray-400 mb-1">{isAr ? "شرح وتصنيف المشكلة" : "Issue category"}</label>
                        <select 
                          value={probType} 
                          onChange={(e) => setProbType(e.target.value)}
                          className="w-full bg-[#1c2541] border border-white/10 rounded-lg py-1.5 px-3 text-xs focus:outline-none"
                        >
                          <option value="عطل GPS">{{ ar: "عطل تتبع الموقع بنطاق الجوال", en: "GPS tracking hardware crash" }[lang]}</option>
                          <option value="انقطاع شبكة">{{ ar: "ضعف تغطية شركة الاتصالات بالمنطقة", en: "Carrier networks lack connectivity" }[lang]}</option>
                          <option value="أخرى">{{ ar: "حضور ميداني طارئ بتفويض مدير الوردية", en: "Direct field order bypass delegation" }[lang]}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[8.5px] text-gray-400 mb-1">{isAr ? "الشرح الإيضاحي المكتوب" : "Supporting context text"}</label>
                        <textarea
                          rows={2}
                          value={probDesc}
                          onChange={(e) => setProbDesc(e.target.value)}
                          placeholder={{ ar: "اشرح السبب المبرر للتأخير أو الانقطاع الجغرافي...", en: "Provide necessary contextual justification details here..." }[lang]}
                          className="w-full bg-[#1c2541] border border-white/10 rounded-lg py-1.5 px-3 text-xs focus:outline-none"
                        />
                      </div>

                      {/* Attachment Simulation */}
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                        <div className="text-right">
                          <span className="text-[9px] text-white block font-bold">{isAr ? "إثبات عطل تداخل الإشارة.png" : "gps_interruption_screenshot.png"}</span>
                          <span className="text-[8px] text-emerald-400 block font-bold">{isAr ? "مرفق مصدق تم تحميله ✓" : "System verified report ✓"}</span>
                        </div>
                        <Check className="w-5 h-5 text-emerald-500" />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-[#D4AF37] text-black text-xs font-black rounded-xl cursor-pointer hover:bg-[#c9af38] transition"
                      >
                        {isAr ? "إرسال البلاغ والمطابقة بمحضر العقد" : "Push Proactive Bypass Code"}
                      </button>

                    </form>
                  )}

                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}

// Reusable SVG/Icon for visual richness
function ArrowUpRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={2.5} 
      stroke="currentColor" 
      className={props.className}
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  );
}
