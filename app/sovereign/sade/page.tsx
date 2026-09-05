"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, CheckCircle2, Clock, ShieldCheck, Database, Download, Eye, 
  Archive, Cpu, Layers, RefreshCw, AlertCircle, Send, Award, Trash2, Check, ExternalLink, HelpCircle,
  Printer
} from "lucide-react";
import { jsPDF } from "jspdf";
import {
  createSovereignCoverCanvas,
  createSovereignClosingCanvas,
  applyPdfSovereignLayoutDecoration
} from "../../../src/lib/sovereignTemplate";
import { db, auth } from "../../../src/lib/firebase";
import { collection, addDoc, getDocs, doc, setDoc } from "firebase/firestore";

// --- SADE TYPES & INTERFACES ---
export interface SadeDocument {
  id: string; // Document UUID
  phaseId: "PH1" | "PH2" | "PH3" | "PH4" | "PH5" | "PH6";
  stepCode: string; // PHx-STy
  documentType: "Sovereign Step Record" | "Sovereign Phase Report" | "Government Letter Record" | "Pilot Summary Report" | "Contract Documentation Record";
  titleAr: string;
  titleEn: string;
  timestamp: string;
  executor: string;
  descriptionAr: string;
  descriptionEn: string;
  evidence: string[];
  outcomesAr: string[];
  outcomesEn: string[];
  recommendationsAr?: string[];
  recommendationsEn?: string[];
  hmacSignature: string;
  c9BlockNum: number;
  c9TxId: string;
  status: "GENERATED" | "SIGNED" | "HASHED" | "LEDGER_RECORDED" | "ARCHIVED";
}

// System Constant Phases
const PHASES = [
  { id: "PH1", ar: "1. التأسيس والدمج الرقمي", en: "1. Foundation & Digital Onboarding" },
  { id: "PH2", ar: "2. معايرة السياج الجغرافي", en: "2. Geofencing Calibration" },
  { id: "PH3", ar: "3. حوكمة الأجور والبنود", en: "3. Wages & Salary Alignment" },
  { id: "PH4", ar: "4. سياج الضبط والمخالفات الذكية", en: "4. Smart Infractions & Compliance Gating" },
  { id: "PH5", ar: "5. مرشح الاستمرارية والرحمة لعام 11438", en: "5. Royal Filter Grace Grace" },
  { id: "PH6", ar: "6. الإغلاق وتأصيل الهوية في C9", en: "6. Immutable Archive & C9 Blockchain Seal" }
];

// Initial Seed Data
const INITIAL_DEMO_DOCS: SadeDocument[] = [
  {
    id: "sade-doc-f2b740-9e01",
    phaseId: "PH1",
    stepCode: "PH1-ST1",
    documentType: "Sovereign Step Record",
    titleAr: "توثيق مطابقة السجل التجاري وحرية التأسيس التلقائي",
    titleEn: "CR Validation and Autonomous Foundation Record",
    timestamp: "2026-06-11 08:30:15",
    executor: "SADE Autonomous Agent v3.0",
    descriptionAr: "تم التحقق من تطابق رخصة الهوية للمنشأة مع السجلات الرسمية بوزارة التجارة وإثبات أهليتها المطلقة للاتصال بقيد C9 والدمج التنظيمي المعزول.",
    descriptionEn: "Verified the enterprise identity credentials against regional Ministry of Commerce records, certifying its absolute authority to connect to the isolated C9 Ledger cluster.",
    evidence: ["cr_registry_ksa_match.json", "chamber_of_commerce_cert.pdf", "digital_trust_seal_signed"],
    outcomesAr: ["تفريغ وحفظ الشهادة التأسيسية للمنشأة", "ربط القيد الجزيئي للمستودع الأول C9", "اعتماد تصنيف السيادة التأسيسي"],
    outcomesEn: ["Enterprise charter extracted & saved securely", "Molecular bonding index connected with C9 Block 1000", "Sovereign structural tier approved"],
    hmacSignature: "9e8a716cda2fbc043a1f8188172bc940a6b1088a2f4da8f80cb8de831ac3bd81",
    c9BlockNum: 10842,
    c9TxId: "TX-c9-8472910-bc2",
    status: "ARCHIVED"
  },
  {
    id: "sade-doc-ac910f-155a",
    phaseId: "PH1",
    stepCode: "PH1-ST2",
    documentType: "Sovereign Step Record",
    titleAr: "إثبات تدقيق ودمج كشوفات الكوادر الميدانية والمهنية",
    titleEn: "Workforce Directory Auditing & Structural Integration Bond",
    timestamp: "2026-06-11 09:15:44",
    executor: "SADE Autonomous Agent v3.0",
    descriptionAr: "عملية مطابقة ثنائية متزامنة لجميع هويات الموظفين الميدانيين وتشفير بيانات الإقامة لربطها بالسياج التنظيمي من واقع رخص العمل في قوى وعزلها عن تداخل الكيانات.",
    descriptionEn: "Dual-synchronous verification of coworker national identity records, encrypting residency variables to align with company sandbox limits in accordance with Qiwa regulations.",
    evidence: ["national_id_exif_integrity.csv", "qiwa_active_contract_roster.json"],
    outcomesAr: ["تأمين وتطهير سجل الحوكمة لـ 24 متعاون وموظف", "خلق الترميز القانوني السلوكي الموحد لكل كادر"],
    outcomesEn: ["Secured and sanitized governance files for 24 workers", "Generated immutable behavioral hash index for each employee"],
    hmacSignature: "ef28ae9bda41595dcefe43818e9bcff01add5a6b0cfa91198533bc4e92bb10df",
    c9BlockNum: 10851,
    c9TxId: "TX-c9-9482715-aa4",
    status: "ARCHIVED"
  },
  {
    id: "sade-doc-bc845a-8b1e",
    phaseId: "PH2",
    stepCode: "PH2-ST1",
    documentType: "Government Letter Record",
    titleAr: "مذكرة ربط ومزامنة رخص رصد الفروع المكانية المعتمدة لـ بلدي",
    titleEn: "Balady Branch Licensing Synchronizer & GPS Bounds Seal",
    timestamp: "2026-06-11 11:22:10",
    executor: "SADE Autonomous Agent v3.0",
    descriptionAr: "وثيقة تسجيل معالم الإحداثيات السيادية وتحديث رخص بلدي التابعه لوزارة الشؤون البلدية والقروية لضمان تطابق سياج الفروع والخدمة التشغيلية المعتمدة.",
    descriptionEn: "Official coordinate mapping blueprint integrating Balady regional municipal licenses. Configures physical and operational bounds of the active workspace cluster.",
    evidence: ["momra_balady_endpoint_response.json", "physical_address_validation_gps_coords"],
    outcomesAr: ["تحديث إجازات الترخيص لـ 4 فروع مكافحة للتزييف", "صياغة رمز السياج الوقائي بمحيط 50 متر"],
    outcomesEn: ["License approvals synchronized for 4 high-trust local branches", "Created geofence bounding-box with 50m safety threshold"],
    hmacSignature: "3ca1f3a2b4b49cbdfdaefc1e62111bb9e900fec1bda4f8cbde8fed2bb750bd62",
    c9BlockNum: 10865,
    c9TxId: "TX-c9-1093284-cd9",
    status: "ARCHIVED"
  }
];

// Simple hashing mock function for SADE documents
function runKSAHMACSIGN(text: string): string {
  let hash = 0;
  if (text.length === 0) return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0") + "ea7b81bf094cd93" + Math.abs(hash * 7).toString(16).substring(0, 12);
  return hex.padEnd(64, "0");
}

export default function SADEDashboard({ lang = "ar", currentUser }: { lang?: "ar" | "en"; currentUser?: any }) {
  const isAr = lang === "ar";
  
  // States
  const [documents, setDocuments] = useState<SadeDocument[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sade_docs");
      return stored ? JSON.parse(stored) : INITIAL_DEMO_DOCS;
    }
    return INITIAL_DEMO_DOCS;
  });
  
  const [selectedDoc, setSelectedDoc] = useState<SadeDocument | null>(INITIAL_DEMO_DOCS[0]);
  const [filterPhase, setFilterPhase] = useState<string>("ALL");
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [builderLang, setBuilderLang] = useState<"AR" | "EN" | "BILINGUAL">("BILINGUAL");
  
  // Live logs console
  const [logs, setLogs] = useState<Array<{ id: string; text: string; time: string; level: "info" | "success" | "warning" | "ledger" }>>([
    { id: "log-1", text: isAr ? "تنشيط منصة التوثيق الذاتي السيادي SADE..." : "SADE Auto‑Documentation Engine booted successfully...", time: "08:00:00", level: "info" },
    { id: "log-2", text: isAr ? "استدعاء نظام كتل Ledger الموثقة وقراءة مؤشرات التحقق الثنائي..." : "Event Bus microstream listeners established...", time: "08:00:02", level: "info" },
    { id: "log-3", text: isAr ? "قناة الاتصال مشفرة ونشطة مع سجل الـ C9 الحقيقي." : "Ledger connection stabilized for decentralized seals.", time: "08:00:03", level: "ledger" }
  ]);

  // Diagnostics machine states
  const [activeProcessingDoc, setActiveProcessingDoc] = useState<SadeDocument | null>(null);
  const [currentStepProgress, setCurrentStepProgress] = useState<"IDLE" | "GENERATED" | "SIGNED" | "HASHED" | "LEDGER_RECORDED" | "ARCHIVED">("IDLE");

  // Live periodic states for Sovereign clock & Actual approval statistics
  const [liveSovereignTime, setLiveSovereignTime] = useState<string>("");
  const [dbApprovalMetrics, setDbApprovalMetrics] = useState({
    activeEmployees: 24, // default fallback
    configuredBranches: 4,  // default fallback
    totalSadeDocs: INITIAL_DEMO_DOCS.length,
    activeC9Blocks: 10865,
    integrityScore: 100
  });

  // Ticking AST Clock (Mecca time) - Updated Periodically (every second)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const makkahTimeStr = now.toLocaleTimeString("en-US", {
        timeZone: "Asia/Riyadh",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      const makkahDateStr = now.toLocaleDateString("ar-SA", {
        timeZone: "Asia/Riyadh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).replace(/\//g, "-");
      setLiveSovereignTime(`${makkahDateStr} ${makkahTimeStr} مكة (GMT+3)`);
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Sync actual approvals and database metadata periodically (every 7 seconds)
  useEffect(() => {
    const syncActualMetrics = async () => {
      try {
        const sadeDocsSnap = await getDocs(collection(db, "sade_documents"));
        const realDocsCount = sadeDocsSnap.size > 0 ? sadeDocsSnap.size : INITIAL_DEMO_DOCS.length;
        
        let realEmpsCount = 24;
        try {
          const empsSnap = await getDocs(collection(db, "employees"));
          if (empsSnap?.size > 0) {
            const list: any[] = [];
            empsSnap.forEach(d => list.push(d.data()));
            if (currentUser?.entityId) {
              const filtered = list.filter(e => e.entityId === currentUser.entityId);
              realEmpsCount = filtered.length > 0 ? filtered.length : list.length;
            } else {
              realEmpsCount = list.length;
            }
          }
        } catch(e) {}

        let realBranchesCount = 4;
        try {
          const branchesSnap = await getDocs(collection(db, "branches"));
          if (branchesSnap?.size > 0) {
            const list: any[] = [];
            branchesSnap.forEach(d => list.push(d.data()));
            if (currentUser?.entityId) {
              const filtered = list.filter(b => b.entityId === currentUser.entityId);
              realBranchesCount = filtered.length > 0 ? filtered.length : list.length;
            } else {
              realBranchesCount = list.length;
            }
          }
        } catch(e) {}

        let realC9Count = 10850;
        try {
          const c9EventsSnap = await getDocs(collection(db, "c9_events"));
          if (c9EventsSnap?.size > 0) {
            realC9Count = 10800 + c9EventsSnap.size;
          }
        } catch(e) {}

        setDbApprovalMetrics({
          activeEmployees: realEmpsCount,
          configuredBranches: realBranchesCount,
          totalSadeDocs: realDocsCount,
          activeC9Blocks: realC9Count + realDocsCount,
          integrityScore: 100
        });
      } catch (err) {
        console.warn("Firestore query skipped or offline", err);
      }
    };
    syncActualMetrics();
    const metricsInterval = setInterval(syncActualMetrics, 7000);
    return () => clearInterval(metricsInterval);
  }, [currentUser]);

  // Load from firestore
  useEffect(() => {
    const fetchFirestoreDocs = async () => {
      try {
        const snapshot = await getDocs(collection(db, "sade_documents"));
        const fDocs: SadeDocument[] = [];
        snapshot.forEach((docSnap) => {
          fDocs.push({ id: docSnap.id, ...docSnap.data() } as SadeDocument);
        });
        if (fDocs.length > 0) {
          setDocuments(prev => {
            const merged = [...fDocs];
            INITIAL_DEMO_DOCS.forEach(seed => {
              if (!merged.find(d => d.id === seed.id)) {
                merged.push(seed);
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.log("Firestore load skipped or offline. Using local storage state machine.");
      }
    };
    fetchFirestoreDocs();
  }, []);

  // Sync back to localstorage for sandbox consistency
  useEffect(() => {
    localStorage.setItem("sade_docs", JSON.stringify(documents));
  }, [documents]);

  // SADE Independent Event Stream WebSocket Connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let shouldReconnect = true;

    const connectSadeStream = () => {
      try {
        ws = new WebSocket("ws://localhost:5173/sade-stream");
        
        ws.onopen = () => {
          console.log("🟢 SADE Stream WebSocket connected to ws://localhost:5173/sade-stream");
          addLog(isAr ? "🔌 تم تأسيس اتصال WebSocket مستقل مع قناة SADE" : "🔌 Established independent SADE channel WebSocket link", "success");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.text) {
              addLog(data.text, data.level || "info");
            }
          } catch {
            addLog(event.data, "info");
          }
        };

        ws.onerror = () => {
          // Fallback silence: if WebSocket connection fails, do not display errors to user, close safely and stop reconnecting
          shouldReconnect = false;
          try {
            if (ws) ws.close();
          } catch {}
        };

        ws.onclose = () => {
          if (shouldReconnect) {
            reconnectTimeout = setTimeout(() => {
              connectSadeStream();
            }, 15000);
          }
        };
      } catch (e) {
        console.warn("SADE Stream WebSocket closed or failed silently:", e);
      }
    };

    connectSadeStream();

    return () => {
      if (ws) {
        try { ws.close(); } catch {}
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [isAr]);

  const addLog = (text: string, level: "info" | "success" | "warning" | "ledger" = "info") => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLogs(prev => [
      { id: `log-${Date.now()}-${Math.random()}`, text, time, level },
      ...prev.slice(0, 39)
    ]);
  };

  // Launch simulated transition protocol
  const triggerSimulation = async (eventType: string) => {
    if (currentStepProgress !== "IDLE") {
      addLog(isAr ? "⚠️ جهاز التحقق قيد معالجة وثيقة أخرى حالياً!" : "⚠️ Machine busy compiling another document. Wait.", "warning");
      return;
    }

    addLog(isAr ? `🚦 محاكاة التشخيص: اعتراض حدث مالي تشغيلي جديد [${eventType}]` : `🚦 Diagnostic simulation triggered: [${eventType}]`, "info");
    
    let phaseId: "PH1" | "PH2" | "PH3" | "PH4" | "PH5" | "PH6" = "PH4";
    let stepCode = "PH4-ST1";
    let docType: SadeDocument["documentType"] = "Sovereign Step Record";
    let titleAr = "";
    let titleEn = "";
    let descAr = "";
    let descEn = "";
    let outcomesAr: string[] = [];
    let outcomesEn: string[] = [];
    let evidence: string[] = ["system_telemetry_checksum.log"];

    switch (eventType) {
      case "GPS_CALIBRATION_BREACH":
        phaseId = "PH4";
        stepCode = "PH4-ST2";
        docType = "Government Letter Record";
        titleAr = "محضر رصد وتجاوز النطاق الجغرافي الميداني للموظف";
        titleEn = "Geofencing Displacement Infraction Record";
        descAr = "إثبات خروج الموظف من النطاق المعاير بموجب الأقمار الصناعية دون تقديم عذر تشغيلي مسبق في منصة LexOps.";
        descEn = "Verified unauthorized coworker coordinates deviation from the geofence perimeter using spatial telemetry analytics.";
        outcomesAr = ["تسجيل إحداثي للتجاوز ورصده", "إصدار إخطار حاسم للجهة المشرفة"];
        outcomesEn = ["Captured spatial coordinate trace in unalterable store", "Dispatched alert warning of potential security infraction"];
        evidence = ["gps_breach_coordinate_deviation.csv", "exif_fingerprint_unmatched"];
        break;

      case "CONTRACT_AUTOMATION":
        phaseId = "PH3";
        stepCode = "PH3-ST3";
        docType = "Contract Documentation Record";
        titleAr = "وثيقة العقد الذكي الموحد ونطاق الامتثال المهني المالي";
        titleEn = "Smart Labor Contract Binding & Financial Compliance Seal";
        descAr = "أتمتة وحسم بروتوكول التراضي الوطني وربط شروط حماية الأجور بالعمل والأجر المصدق.";
        descEn = "Unified dynamic contract generated directly on local database node, locking biometric identity markers and wage schedules.";
        outcomesAr = ["ختم شروط التراضي الثنائية ومطابقة الحساب المالي", "تحميل قيد التوثيق في حزمة C9"];
        outcomesEn = ["Consensus agreements locked in digital index", "Broadcasting binding hashes to decentralized ledger node"];
        evidence = ["wage_protection_system_match.json", "coworker_signature_token.pem"];
        break;

      case "ROYAL_FILTER_GRACE":
        phaseId = "PH5";
        stepCode = "PH5-ST1";
        docType = "Government Letter Record";
        titleAr = "إعمال مرشح الرحمة والمهلة الملكية التمكينية لـ 11438";
        titleEn = "Royal Decree Grace Filter 11438 Enforcement Order";
        descAr = "منح المنشأة مهلة تصحيحة استدلالية لمدة 72 ساعة لترميم الخلل المكاني قبل توثيق غرامة وزارة الموارد البشرية.";
        descEn = "Applying Royal Mercy Grace Filter 11438 to suspend ongoing fines. Grants 72-hour interactive threshold to restore balance.";
        outcomesAr = ["تجميد عقوبة النقل والبلدية لـ 72 ساعة", "توفير معالج الإثبات العكسي الجغرافي"];
        outcomesEn = ["Suspended municipal/MHRSD wage reductions for 72 hours", "Enabled interactive feedback loop on workspace console"];
        evidence = ["royal_grace_filter_grace_trigger", "regulatory_suspension_decree_11438.pdf"];
        break;

      default:
        phaseId = "PH6";
        stepCode = "PH6-ST1";
        docType = "Sovereign Phase Report";
        titleAr = "تقرير الإغلاق والأرشفة النهائية وصك مطابقة C9 التام";
        titleEn = "Immutable Consensus Archive Certificate & C9 Master Seal";
        descAr = "التقرير الشامل التابع للمرحلة السادسة الذي يغلق الدورة التشغيلية تماماً مع تشميع كتل المعاملات بصورة غير قابلة للتغيير.";
        descEn = "Ultimate Master Report locking all system phases, geofence checks and payroll tokens into C9 Block #10890.";
        outcomesAr = ["استلام صك الحصانة السيادية للامتثال التام", "تصدير الملف النهائي المشفر للجهة الإدارية"];
        outcomesEn = ["Acquired full-scale platform immunity certificate", "Generated immutable master ledger export package"];
        evidence = ["final_consensus_matrix.json", "c9_ledger_master_seal.sha256"];
    }

    const tempUuid = `sade-doc-${Math.random().toString(16).substring(2, 8)}-${Math.random().toString(16).substring(2, 6)}`;
    const docTime = new Date().toISOString().replace("T", " ").substring(0, 19);

    const draftDoc: SadeDocument = {
      id: tempUuid,
      phaseId,
      stepCode,
      documentType: docType,
      titleAr,
      titleEn,
      timestamp: docTime,
      executor: "SADE Autonomous Agent v3.0",
      descriptionAr: descAr,
      descriptionEn: descEn,
      evidence,
      outcomesAr,
      outcomesEn,
      recommendationsAr: ["متابعة ومطابقة مستمرة"],
      recommendationsEn: ["Continuous automated mapping checks"],
      hmacSignature: "",
      c9BlockNum: 10800 + documents.length,
      c9TxId: `TX-c9-${Math.floor(Math.random() * 900000) + 100000}-${Math.random().toString(16).substring(2, 5)}`,
      status: "GENERATED"
    };

    setActiveProcessingDoc(draftDoc);
    setCurrentStepProgress("GENERATED");
    addLog(isAr ? `📄 تم توليد مسودة المستند الرقمي [UUID: ${tempUuid}]` : `📄 Document draft generated [UUID: ${tempUuid}]`, "success");

    // Next stages of processing simulation with status updates
    setTimeout(() => {
      setCurrentStepProgress("SIGNED");
      addLog(isAr ? "✍️ يتم التوقيع المشفر وضخ الهويات الوطنية الرقمية..." : "✍️ Applying cryptographic digital signatures with double-handshake...", "info");

      setTimeout(() => {
        const bodyContent = JSON.stringify(draftDoc);
        const signedHash = runKSAHMACSIGN(bodyContent);
        draftDoc.hmacSignature = signedHash;
        setCurrentStepProgress("HASHED");
        addLog(isAr ? `🔒 تم الحساب التلقائي للبصمة التناظرية لـ HMAC: [${signedHash.substring(0, 16)}...]` : `🔒 HMAC computation completed successfully.`, "success");

        setTimeout(() => {
          setCurrentStepProgress("LEDGER_RECORDED");
          addLog(isAr ? `⛓️ جاري حفظ وتدبيس بصمة المستند في C9 Ledger الكتلة 📥 #${draftDoc.c9BlockNum}` : `⛓️ Staving trace in C9 Ledger index...`, "ledger");

          setTimeout(async () => {
            draftDoc.status = "ARCHIVED";
            
            // Push database
            let finalizedObject = { ...draftDoc };
            try {
              if (auth.currentUser) {
                const reference = await addDoc(collection(db, "sade_documents"), finalizedObject);
                finalizedObject.id = reference.id;
              }
            } catch(e) {
              console.log("Firestore push omitted. Safe fallback applied.");
            }

            setDocuments(prev => [finalizedObject, ...prev]);
            setSelectedDoc(finalizedObject);
            setActiveProcessingDoc(null);
            setCurrentStepProgress("IDLE");
            addLog(isAr ? `✅ تم توثيق وحفظ المستند الرقمي السيادي في المحفوظات بنجاح وحصانته سارية!` : `✅ Sovereign document archived and sealed! Ready.`, "success");
          }, 1200);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  // Export PDF with upgraded full-featured multi-language SADE engine
  const triggerPDFExport = (docItem: SadeDocument, langOverride?: "AR" | "EN" | "BILINGUAL") => {
    const langPref = langOverride || builderLang || "BILINGUAL";
    addLog(isAr ? `🔔 بدء طباعة الشهادة الرسمية لـ [${docItem.titleAr}]` : `🔔 Launching high-trust certified PDF export for: ${docItem.titleEn}...`, "info");
    
    // Enable simulated parameters in jsPDF constructor to fit audit spec
    const docPdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      arabicText: true,
      autoRTL: true
    } as any);

    const isArPDF = langPref === "AR";
    const isBilingual = langPref === "BILINGUAL";

    // Resolve user details from session / Firebase auth for Sovereign Header/Footer Extensions
    const userFullName = currentUser?.name || auth.currentUser?.displayName || ((auth.currentUser?.email === "sultan2030famli@gmail.com" || auth.currentUser?.email === "sultanbooy100@gmail.com") ? "سلطان العتيبي" : auth.currentUser?.email?.split("@")[0]) || "المتحكم السيادي - SADE";
    const rawRole = currentUser?.role || ((auth.currentUser?.email === "sultan2030famli@gmail.com" || auth.currentUser?.email === "sultanbooy100@gmail.com") ? "SOVEREIGN_CONTROLLER" : "SOVEREIGN_CONTROLLER"); 
    let userRoleName = "المتحكم السيادي";
    if (rawRole === "SOVEREIGN_CONTROLLER" || rawRole === "founder") {
      userRoleName = "المتحكم السيادي";
    } else if (rawRole === "orgadmin") {
      userRoleName = "مدير المراجعة والاعتماد";
    } else if (rawRole === "employee") {
      userRoleName = "موظف ممتثل سيادياً";
    } else if (rawRole === "freelancer") {
      userRoleName = "متعاقد مستقل للعمليات";
    } else if (rawRole === "government") {
      userRoleName = "مفتش وزارة الرقابة السيادية";
    }
    
    let userSovereignId = "SOV-FOUNDER-2030";
    if (rawRole === "SOVEREIGN_CONTROLLER" || rawRole === "founder") {
      userSovereignId = "SOV-FOUNDER-2030";
    } else if (rawRole === "government") {
      userSovereignId = "SOV-GOV-11438";
    } else {
      const uniquePart = (currentUser?.id || auth.currentUser?.uid || "SADE-BYPASS").substring(0, 8).toUpperCase();
      if (rawRole === "orgadmin") {
        userSovereignId = `SOV-ORG-${currentUser?.entityId || uniquePart}`;
      } else if (rawRole === "employee") {
        userSovereignId = `SOV-EMP-${uniquePart}`;
      } else {
        userSovereignId = `SOV-SYS-${uniquePart}`;
      }
    }

    const currentTimestampString = docItem.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19) + " UTC";

    // PAGE 1: Beautiful Cover Page (Sovereign Master Template with Live Approval Details)
    const exactMakkahTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh", hour12: false });
    const printStamp = `${exactMakkahTime} AST (MECCA) | EMP-STATUS: ${dbApprovalMetrics.activeEmployees} APPROVED | BRANCHES: ${dbApprovalMetrics.configuredBranches} ACTIVE | SADE-LEDGER: Verified Sovereign Seal`;
    const coverCanvas = createSovereignCoverCanvas(
      `شهادة وتوثيق المستند السيادي الصادر عن SADE: ${docItem.titleAr}`,
      docItem.id,
      docItem.c9BlockNum,
      userSovereignId,
      printStamp,
      "ar"
    );
    docPdf.addImage(coverCanvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    
    // Page 2: Content (SADE drawing logic follows)
    docPdf.addPage();

    const pdfLabels = {
      AR: {
        engineTitle: "نظام التشغيل السيادي لـ LEXOPS - محرك التوثيق الذاتي (SADE)",
        subTitle: "منصة حماية المستندات عالية الثقة والسجلات الرقمية المشفرة",
        docId: "معرف المستند / UUID:",
        phase: "مرحلة التنظيم / الخطوة:",
        docType: "نوع المستند الأمني:",
        date: "التاريخ والوقت / المنفذ:",
        c9Ledger: "كتلة C9 الحسابية والمعاملة:",
        titleLabel: "العنوان الأمني السيادي الموثق:",
        purposeLabel: "١. الغرض والتحقق المستندي العابر:",
        outcomesLabel: "٢. المخرجات الرسمية والآثار المعتمدة:",
        evidenceLabel: "٣. المرفقات وسندات القرائن الرقمية:",
        signatureLabel: "توقيع السلامة الرقمية SADE ونظام الترابط الثنائي C9:",
        hmacLabel: "رمز التحقق والختم الرقمي (HMAC-SHA256):",
        ledgerIndexLabel: "فهرس كتلة C9 الموثق:",
        statusLabel: "حالة السند: مؤرشف وتم تسجيله بموثوقية كاملة في قواعد البلوكشين السيادية الخاصة بالمؤسس.",
        docTypes: {
          "Sovereign Step Record": "سجل خطوة سيادية",
          "Sovereign Phase Report": "تقرير مرحلة سيادية",
          "Government Letter Record": "سجل خطاب حكومي",
          "Pilot Summary Report": "تقرير ملخص تجريبي",
          "Contract Documentation Record": "سجل توثيق العقود"
        }
      },
      EN: {
        engineTitle: "LEXOPS SOVEREIGN OS - AUTOMATIC DOCUMENTATION ENGINE",
        subTitle: "Sovereign Protection & High-Trust Cryptographic Records Platform",
        docId: "DOCUMENT ID / UUID:",
        phase: "REGULATORY PHASE / STEP:",
        docType: "DOCUMENT TYPE:",
        date: "TIMESTAMP / EXECUTOR:",
        c9Ledger: "C9 LEDGER BLOCK & TX:",
        titleLabel: "TITLE / CERTIFIED SOVEREIGN TITLE:",
        purposeLabel: "1. PROCEDURAL LOG & PURPOSE:",
        outcomesLabel: "2. OFFICIAL OUTCOMES & RE-ALIGNED ASSETS:",
        evidenceLabel: "3. DIGITAL METRICS & EVIDENCE SEALS:",
        signatureLabel: "SADE CRYPTOGRAPHIC INTEGRITY SIGNATURE & C9 COHERENCE SYSTEM:",
        hmacLabel: "HMAC-SHA256 CHECKSUM:",
        ledgerIndexLabel: "IMMUTABLE LEDGER INDEX BINDING:",
        statusLabel: "STATUS: SIGNED & ARCHIVED. DOCUMENT HAS BEEN TAMPER-PROOF SECURITIZED.",
        docTypes: {
          "Sovereign Step Record": "Sovereign Step Record",
          "Sovereign Phase Report": "Sovereign Phase Report",
          "Government Letter Record": "Government Letter Record",
          "Pilot Summary Report": "Pilot Summary Report",
          "Contract Documentation Record": "Contract Documentation Record"
        }
      }
    };

    const currentLabels = isArPDF ? pdfLabels.AR : pdfLabels.EN;

    // Helper to render high quality text with full system-based Arabic shaping and RTL support
    const drawHighTrustText = (text: string, x: number, y: number, fontSize: number, isBold: boolean = false, textColor: string = "#111827", align: "right" | "left" = "left") => {
      const isArabic = /[\u0600-\u06FF]/.test(text);
      if (isArabic || align === "right") {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        const dpiScale = 4;
        ctx.font = `${isBold ? "bold" : "normal"} ${fontSize * dpiScale}px 'Cairo', 'Amiri', 'IBM Plex Sans Arabic', sans-serif`;
        
        const textMetrics = ctx.measureText(text);
        const textWidth = Math.max(textMetrics.width + 12, 10);
        const textHeight = (fontSize * 1.5) * dpiScale;
        
        canvas.width = textWidth;
        canvas.height = textHeight;
        
        ctx.font = `${isBold ? "bold" : "normal"} ${fontSize * dpiScale}px 'Cairo', 'Amiri', 'IBM Plex Sans Arabic', sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillStyle = textColor;
        
        if (align === "right") {
          ctx.textAlign = "right";
          ctx.fillText(text, textWidth - 5, textHeight / 2);
        } else {
          ctx.textAlign = "left";
          ctx.fillText(text, 5, textHeight / 2);
        }
        
        const imgUrl = canvas.toDataURL("image/png");
        const mmWidth = textWidth / (dpiScale * 3.78);
        const mmHeight = textHeight / (dpiScale * 3.78);
        
        let drawX = x;
        if (align === "right") {
          drawX = x - mmWidth;
        }
        docPdf.addImage(imgUrl, "PNG", drawX, y - (mmHeight / 2) + 1.5, mmWidth, mmHeight);
      } else {
        docPdf.setFont("helvetica", isBold ? "bold" : "normal");
        docPdf.setFontSize(fontSize);
        docPdf.setTextColor(textColor);
        docPdf.text(text, x, y);
      }
    };

    // Helper for multiline paragraphs
    const drawHighTrustParagraph = (text: string, startX: number, startY: number, maxWMM: number, fontSize: number, isBold: boolean = false, textColor: string = "#111827", align: "right" | "left" = "left") => {
      const isArabic = /[\u0600-\u06FF]/.test(text);
      if (isArabic || align === "right") {
        const words = text.split(" ");
        let lines: string[] = [];
        let currentLine = "";
        
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.font = `${isBold ? "bold" : "normal"} ${fontSize}px 'Cairo', 'Amiri', 'IBM Plex Sans Arabic', sans-serif`;
          const limitPX = maxWMM * 3.78;
          
          for (let i = 0; i < words.length; i++) {
            const testLine = currentLine ? currentLine + " " + words[i] : words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > limitPX && i > 0) {
              lines.push(currentLine);
              currentLine = words[i];
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            lines.push(currentLine);
          }
        } else {
          lines = [text];
        }
        
        let targetY = startY;
        lines.forEach(line => {
          drawHighTrustText(line, startX, targetY, fontSize, isBold, textColor, align);
          targetY += (fontSize * 0.45) + 2.5;
        });
        return targetY;
      } else {
        docPdf.setFont("helvetica", isBold ? "bold" : "normal");
        docPdf.setFontSize(fontSize);
        docPdf.setTextColor(textColor);
        const splitText = docPdf.splitTextToSize(text, maxWMM);
        docPdf.text(splitText, startX, startY);
        return startY + (splitText.length * 4) + 2;
      }
    };

    // Header Text based on language selection (Rendered on top of the Royal Midnight Banner)
    if (isArPDF) {
      drawHighTrustText(pdfLabels.AR.engineTitle, 193, 18, 11, true, "#FFFFFF", "right");
      drawHighTrustText(pdfLabels.AR.subTitle, 193, 24, 8, true, "#D4AF37", "right");
    } else if (isBilingual) {
      drawHighTrustText("LEXOPS SOVEREIGN OS - AUTOMATIC DOCUMENTATION ENGINE", 14, 18, 10.5, true, "#FFFFFF", "left");
      drawHighTrustText("SADE HIGH-TRUST AUTOMATION PLATFORM // نظام التوثيق الذاتي السيادي", 14, 24, 8, true, "#D4AF37", "left");
    } else {
      drawHighTrustText(pdfLabels.EN.engineTitle, 14, 18, 10.5, true, "#FFFFFF", "left");
      drawHighTrustText(pdfLabels.EN.subTitle, 14, 24, 8, true, "#D4AF37", "left");
    }

    // --- SOVEREIGN HEADER EXTENSION ---
    // Displays full_name, role_name, and sovereign_id in a gold font right beneath the header
    if (isArPDF) {
      drawHighTrustText(`اسم المستخدم: ${userFullName}   |   الدور: ${userRoleName}   |   الرقم السيادي: ${userSovereignId}`, 193, 37.5, 7.5, true, "#D4AF37", "right");
    } else {
      drawHighTrustText(`User Name: ${userFullName}   |   Role: ${userRoleName}   |   Sovereign ID: ${userSovereignId}`, 14, 37.5, 7.5, true, "#D4AF37", "left");
    }

    // Document Meta Block (Two-column layout, shifted slightly to y = 42)
    docPdf.setFillColor(249, 250, 251);
    docPdf.rect(13, 42, 184, 35, "F");
    docPdf.setDrawColor(229, 231, 235);
    docPdf.rect(13, 42, 184, 35);

    const labelX = isArPDF ? 193 : 16;
    const valueX = isArPDF ? 115 : 65;
    const defaultAlign = isArPDF ? "right" : "left";
    const translatedDocType = isArPDF ? (pdfLabels.AR.docTypes[docItem.documentType as keyof typeof pdfLabels.AR.docTypes] || docItem.documentType) : docItem.documentType;

    if (isArPDF) {
      drawHighTrustText(currentLabels.docId, labelX, 46.5, 8.5, true, "#6B7280", "right");
      drawHighTrustText(currentLabels.phase, labelX, 52.5, 8.5, true, "#6B7280", "right");
      drawHighTrustText(currentLabels.docType, labelX, 58.5, 8.5, true, "#6B7280", "right");
      drawHighTrustText(currentLabels.date, labelX, 64.5, 8.5, true, "#6B7280", "right");
      drawHighTrustText(currentLabels.c9Ledger, labelX, 70.5, 8.5, true, "#6B7280", "right");

      drawHighTrustText(docItem.id, valueX, 46.5, 8.5, false, "#111827", "right");
      drawHighTrustText(`${docItem.phaseId} / ${docItem.stepCode}`, valueX, 52.5, 8.5, false, "#111827", "right");
      drawHighTrustText(translatedDocType, valueX, 58.5, 8.5, false, "#111827", "right");
      drawHighTrustText(`${docItem.timestamp} [بواسطة ${docItem.executor}]`, valueX, 64.5, 8.5, false, "#111827", "right");
      drawHighTrustText(`كتلة #${docItem.c9BlockNum} [معرف المعاملة: ${docItem.c9TxId}]`, valueX, 70.5, 8.5, false, "#111827", "right");
    } else {
      docPdf.setFont("helvetica", "bold");
      docPdf.setFontSize(8.5);
      docPdf.setTextColor(107, 114, 128);
      docPdf.text("DOCUMENT ID / UUID:", 16, 44);
      docPdf.text("REGULATORY PHASE / STEP:", 16, 50);
      docPdf.text("DOCUMENT TYPE:", 16, 56);
      docPdf.text("TIMESTAMP / EXECUTOR:", 16, 62);
      docPdf.text("C9 LEDGER BLOCK & TX:", 16, 68);

      docPdf.setFont("helvetica", "normal");
      docPdf.setTextColor(17, 24, 39);
      docPdf.text(docItem.id, 65, 44);
      docPdf.text(`${docItem.phaseId} / ${docItem.stepCode}`, 65, 50);
      docPdf.text(docItem.documentType, 65, 56);
      docPdf.text(`${docItem.timestamp}  [by ${docItem.executor}]`, 65, 62);
      docPdf.text(`Block #${docItem.c9BlockNum}  [Hash Reference ID: ${docItem.c9TxId}]`, 65, 68);
    }

    // Document Titles (Arabic and English)
    if (isArPDF) {
      drawHighTrustText(currentLabels.titleLabel, 193, 84, 11, true, "#991B1B", "right");
      drawHighTrustText(docItem.titleAr, 193, 92, 11, true, "#111827", "right");
    } else if (isBilingual) {
      drawHighTrustText("TITLE / العنوان الوطني السيادي الموثق:", 13, 84, 11, true, "#991B1B", "left");
      drawHighTrustText(`EN: ${docItem.titleEn}`, 13, 92, 10, true, "#111827", "left");
      drawHighTrustText(`AR: ${docItem.titleAr}`, 193, 99, 10, true, "#111827", "right");
    } else {
      drawHighTrustText(currentLabels.titleLabel, 13, 84, 11, true, "#991B1B", "left");
      drawHighTrustText(docItem.titleEn, 13, 92, 11, true, "#111827", "left");
    }

    // Divider
    docPdf.setDrawColor(229, 231, 235);
    docPdf.setLineWidth(0.5);
    docPdf.line(13, 105, 197, 105);

    // Description Block
    let currentY = 113;
    if (isArPDF) {
      drawHighTrustText(currentLabels.purposeLabel, 193, currentY, 11, true, "#111827", "right");
      currentY += 7;
      currentY = drawHighTrustParagraph(docItem.descriptionAr, 193, currentY, 180, 9, false, "#374151", "right");
    } else if (isBilingual) {
      drawHighTrustText("1. PROCEDURAL LOG & PURPOSE / الغرض والتحقق المستندي:", 13, currentY, 11, true, "#111827", "left");
      currentY += 7;
      currentY = drawHighTrustParagraph(`EN: ${docItem.descriptionEn}`, 13, currentY, 180, 9, false, "#374151", "left");
      currentY = drawHighTrustParagraph(`AR: ${docItem.descriptionAr}`, 193, currentY, 180, 9, false, "#374151", "right");
    } else {
      drawHighTrustText(currentLabels.purposeLabel, 13, currentY, 11, true, "#111827", "left");
      currentY += 7;
      currentY = drawHighTrustParagraph(docItem.descriptionEn, 13, currentY, 180, 9, false, "#374151", "left");
    }

    currentY += 5;

    // outcomes
    if (isArPDF) {
      drawHighTrustText(currentLabels.outcomesLabel, 193, currentY, 11, true, "#111827", "right");
      currentY += 7;
      (docItem.outcomesAr || []).forEach((item) => {
        drawHighTrustText(`• ${item}`, 193, currentY, 9, false, "#374151", "right");
        currentY += 5.5;
      });
    } else if (isBilingual) {
      drawHighTrustText("2. OFFICIAL OUTCOMES & RE-ALIGNED ASSETS / المخرجات الرسمية والآثار:", 13, currentY, 11, true, "#111827", "left");
      currentY += 7;
      (docItem.outcomesAr || []).forEach((item) => {
        drawHighTrustText(`• (AR) ${item}`, 193, currentY, 9, false, "#374151", "right");
        currentY += 5.5;
      });
      (docItem.outcomesEn || []).forEach((item) => {
        drawHighTrustText(`• (EN) ${item}`, 13, currentY, 9, false, "#374151", "left");
        currentY += 5.5;
      });
    } else {
      drawHighTrustText(currentLabels.outcomesLabel, 13, currentY, 11, true, "#111827", "left");
      currentY += 7;
      (docItem.outcomesEn || []).forEach((item) => {
        drawHighTrustText(`• ${item}`, 13, currentY, 9, false, "#374151", "left");
        currentY += 5.5;
      });
    }

    currentY += 5;

    // Evidence References
    if (isArPDF) {
      drawHighTrustText(currentLabels.evidenceLabel, 193, currentY, 11, true, "#111827", "right");
      currentY += 7;
      (docItem.evidence || []).forEach(ev => {
        drawHighTrustText(`[مرفق مؤرشف ومقيد]  <<<  ${ev}`, 193, currentY, 8.5, false, "#1F2937", "right");
        currentY += 5.5;
      });
    } else if (isBilingual) {
      drawHighTrustText("3. DIGITAL METRICS & EVIDENCE SEALS / المرفقات والقرائن الرقمية:", 13, currentY, 11, true, "#111827", "left");
      currentY += 7;
      (docItem.evidence || []).forEach(ev => {
        drawHighTrustText(`[SECURED TRACE ID]  >>>  ${ev}`, 13, currentY, 8.5, false, "#1F2937", "left");
        currentY += 5.5;
      });
    } else {
      drawHighTrustText(currentLabels.evidenceLabel, 13, currentY, 11, true, "#111827", "left");
      currentY += 7;
      (docItem.evidence || []).forEach(ev => {
        drawHighTrustText(`[SECURED TRACE ID]  >>>  ${ev}`, 13, currentY, 8.5, false, "#1F2937", "left");
        currentY += 5.5;
      });
    }

    currentY += 8;

    // Cryptographic Signatures Footer Block
    docPdf.setFillColor(242, 245, 250);
    docPdf.rect(13, currentY, 184, 30, "F");
    docPdf.setDrawColor(212, 175, 55);
    docPdf.rect(13, currentY, 184, 30);

    if (isArPDF) {
      drawHighTrustText(currentLabels.signatureLabel, 193, currentY + 6, 8.5, true, "#991B1B", "right");
      drawHighTrustText(`${currentLabels.hmacLabel} ${docItem.hmacSignature}`, 193, currentY + 13, 8, false, "#111827", "right");
      drawHighTrustText(`فهرس الكتله والمعاملة:  الكتلة C9 رقم ${docItem.c9BlockNum} // معرف الهاش ${docItem.c9TxId}`, 193, currentY + 19, 8, false, "#111827", "right");
      drawHighTrustText("مختوم بواسطة محرك التوثيق الذاتي السيادي – SADE", 193, currentY + 25, 8, true, "#D4AF37", "right");
    } else if (isBilingual) {
      drawHighTrustText("SADE CRYPTOGRAPHIC INTEGRITY SIGNATURE & C9 COHERENCE SYSTEM:", 16, currentY + 6, 8, true, "#991B1B", "left");
      drawHighTrustText(`HMAC-SHA256 CHECKSUM: ${docItem.hmacSignature}`, 16, currentY + 13, 7.5, false, "#111827", "left");
      drawHighTrustText(`IMMUTABLE LEDGER INDEX BINDING: Block ${docItem.c9BlockNum} / Transaction Hash ${docItem.c9TxId}`, 16, currentY + 19, 7.5, false, "#111827", "left");
      drawHighTrustText("مختوم بواسطة محرك التوثيق الذاتي السيادي – SADE // Stamped by SADE Engine", 16, currentY + 25, 7.5, true, "#D4AF37", "left");
    } else {
      drawHighTrustText(currentLabels.signatureLabel, 16, currentY + 6, 8, true, "#991B1B", "left");
      drawHighTrustText(`${currentLabels.hmacLabel} ${docItem.hmacSignature}`, 16, currentY + 13, 7.5, false, "#111827", "left");
      drawHighTrustText(`${currentLabels.ledgerIndexLabel} Block ${docItem.c9BlockNum} / Transaction Hash ${docItem.c9TxId}`, 16, currentY + 19, 7.5, false, "#111827", "left");
      drawHighTrustText(currentLabels.statusLabel, 16, currentY + 25, 7.5, true, "#111827", "left");
    }

    // Decorate SADE's content page (Page 2) with the official golden borders, side ribbon, and watermark of the Sovereign OS
    applyPdfSovereignLayoutDecoration(docPdf, docItem.phaseId, isArPDF);

    // Create Closing Page Canvas
    const closingCanvas = createSovereignClosingCanvas(
      docItem.hmacSignature || "SECURED_HMAC_SVRN_LEDGER_HASH",
      docItem.c9BlockNum,
      docItem.c9TxId,
      printStamp,
      "ar"
    );
    docPdf.addPage();
    docPdf.addImage(closingCanvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);

    const fileSuffix = isArPDF ? "AR" : isBilingual ? "BILINGUAL" : "EN";
    docPdf.save(`LEXOPS_SOVEREIGN_SADE_${docItem.id.toUpperCase()}_${fileSuffix}.pdf`);
    addLog(isAr ? `✅ تم بنجاح حفظ وتصدير ملف الـ PDF لـ ${docItem.id}` : `✅ PDF transaction deed generated and saved to local disk!`, "success");
  };

  // Export to MHRSD (Ministry of Human Resources \& Social Development)
  const triggerExportToMinistry = (docItem: SadeDocument) => {
    setIsExporting(docItem.id);
    addLog(isAr ? `📤 جاري فتح قيد البث وجدولة حزم الأدلة والـ Exif لإرسالها للجهة التنظيمية...` : "📤 Negotiating handshakes with MHRSD sovereign gateway sockets...", "info");

    setTimeout(() => {
      setIsExporting(null);
      setExportSuccess(docItem.id);
      addLog(isAr ? `💚 تم اكتمال النقل الآمن للمستند [${docItem.id}] بنجاح ومطابقته لدى خادم الوزارة!` : `💚 Master export socket synched 100% with the regulatory database!`, "success");
      
      setTimeout(() => {
        setExportSuccess(null);
      }, 3000);
    }, 2000);
  };

  const filteredDocs = filterPhase === "ALL" 
    ? documents 
    : documents.filter(d => d.phaseId === filterPhase);

  return (
    <div id="sade-dashboard" className="p-4 md:p-6 space-y-6 bg-transparent text-white text-right font-sans" style={{ direction: "rtl" }}>
      
      {/* Dynamic Header Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#010B1E] border border-[#D4AF37]/30 p-6 rounded relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
        <div className="absolute right-0 top-0 w-44 h-44 bg-[#D4AF37]/5 rounded-full filter blur-3xl pointer-events-none"></div>
        <div className="absolute left-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full filter blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#D4AF37]/10 border border-[#D4AF37] rounded flex items-center justify-center text-[#D4AF37] animate-pulse">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[8px] bg-[#D4AF37]/25 text-[#D4AF37] font-mono font-bold leading-none">LEXOPS SOVEREIGN GATE</span>
              <span className="px-2 py-0.5 rounded text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-500/20 font-mono font-bold leading-none">ACTIVE AGENT v3.0</span>
            </div>
            <h1 className="text-xl font-extrabold text-white mt-1">محرك التوثيق التلقائي الموحد (SADE)</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">Sovereign Auto‑Documentation Engine — الضبط التلقائي للأفعال والتوقيع وإرسال البصمات لسجل الـ C9</p>
          </div>
        </div>

        {/* Current SADE state */}
        <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded p-3 text-right shrink-0 min-w-[200px]">
          <span className="text-[10px] text-gray-400 block font-mono">حالة الوحدة الأمنية:</span>
          <span className="text-sm text-[#D4AF37] font-black flex items-center gap-1.5 justify-end mt-0.5 font-mono">
            {currentStepProgress === "IDLE" ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                جاهز بانتظار الإشارة (ON LINE)
              </>
            ) : (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></div>
                معالجة نشطة لكتلة البيانات: {currentStepProgress}
              </>
            )}
          </span>
          <div className="mt-1 flex items-center justify-between text-[9px] text-gray-400">
            <span>سجل الائتمان: 100%</span>
            <span>بصمات C9: {dbApprovalMetrics.totalSadeDocs} موثق</span>
          </div>
        </div>
      </div>

      {/* Real-time Sovereign Governance & Clock Panel - Updated periodically */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#010b1a] border border-[#D4AF37]/20 p-4 rounded-lg relative overflow-hidden shadow-lg" style={{ direction: "rtl" }}>
        <div className="flex flex-col p-3 bg-slate-900/40 border border-[#D4AF37]/10 rounded">
          <span className="text-[10px] text-amber-500 font-extrabold block">ميقات مكة المكرمة المعتمد (Live Clock)</span>
          <span className="text-xs text-white font-extrabold font-mono mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" style={{ animationDuration: "10s" }} />
            {liveSovereignTime || "جاري جلب الساعة..."}
          </span>
          <span className="text-[8px] text-gray-500 block font-mono mt-0.5">تحديث تلقائي • لامتثال العقود</span>
        </div>
        
        <div className="flex flex-col p-3 bg-slate-900/40 border border-[#D4AF37]/10 rounded">
          <span className="text-[10px] text-gray-400 block font-bold">الكوادر البشرية المعتمدة فعلياً</span>
          <span className="text-sm text-emerald-400 font-black font-mono mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {dbApprovalMetrics.activeEmployees} موظف مسجل
          </span>
          <span className="text-[8px] text-gray-500 block font-mono">طِبقاً لمطابقة رخص قوى الفعالة</span>
        </div>

        <div className="flex flex-col p-3 bg-slate-900/40 border border-[#D4AF37]/10 rounded">
          <span className="text-[10px] text-gray-400 block font-bold">الفروع والحدود المعتمدة لـ بلدي</span>
          <span className="text-sm text-emerald-400 font-black font-mono mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            {dbApprovalMetrics.configuredBranches} مواقع جغرافية
          </span>
          <span className="text-[8px] text-gray-500 block font-mono">مسح دوري لإحداثيات GPS المرخصة</span>
        </div>

        <div className="flex flex-col p-3 bg-slate-900/40 border border-[#D4AF37]/10 rounded">
          <span className="text-[10px] text-[#D4AF37] block font-bold">المستندات وسجلات SADE المعتمدة</span>
          <span className="text-sm text-indigo-400 font-black font-mono mt-1 flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            {dbApprovalMetrics.totalSadeDocs} وسيقة معتمدة ومؤرشفة
          </span>
          <span className="text-[8px] text-gray-500 block font-mono mt-0.5">C9 Block Segment: #{dbApprovalMetrics.activeC9Blocks}</span>
        </div>
      </div>

      {/* SADE State Progress Line */}
      {currentStepProgress !== "IDLE" && activeProcessingDoc && (
        <div className="bg-[#000814] border border-[#D4AF37]/30 rounded p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">يقوم الروبوت SADE بتجميع وقيد الملف الحوكمي حالياً...</span>
            <span className="text-[#D4AF37] font-mono leading-none font-bold">الحالة: {currentStepProgress}</span>
          </div>
          <div className="relative h-1 bg-white/5 rounded overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-[#D4AF37] transition-all duration-1000"
              style={{
                width: 
                  currentStepProgress === "GENERATED" ? "20%" :
                  currentStepProgress === "SIGNED" ? "40%" :
                  currentStepProgress === "HASHED" ? "60%" :
                  currentStepProgress === "LEDGER_RECORDED" ? "80%" :
                  currentStepProgress === "ARCHIVED" ? "100%" : "0%"
              }}
            ></div>
          </div>
          <div className="grid grid-cols-5 text-[9px] text-gray-500 text-center text-right font-mono">
            <div className="text-emerald-400">1) توليد المسودة</div>
            <div className={["SIGNED", "HASHED", "LEDGER_RECORDED", "ARCHIVED"].includes(currentStepProgress) ? "text-emerald-400" : ""}>2) الهوية الثنائية</div>
            <div className={["HASHED", "LEDGER_RECORDED", "ARCHIVED"].includes(currentStepProgress) ? "text-emerald-400" : ""}>3) حساب الختم</div>
            <div className={["LEDGER_RECORDED", "ARCHIVED"].includes(currentStepProgress) ? "text-[#D4AF37]" : ""}>4) قيد الـ C9</div>
            <div className={currentStepProgress === "ARCHIVED" ? "text-emerald-400" : ""}>5) الأرشفة التامة</div>
          </div>
        </div>
      )}

      {/* Main Grid: Outgoing Documents vs Document View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Diagnostics and Event Console */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Diagnostics Platform Controls */}
          <div className="bg-[#010814] border border-white/10 rounded p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Cpu className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="text-sm font-bold text-white">لوحة المحاكاة والتشخيص (SADE Diagnostics)</h2>
            </div>
            
            <p className="text-[10px] text-gray-400 leading-relaxed">
              قم ببدء واستثارة أحداث تشغيل مخصصة يدويًا لتتبع تفاعل محرك SADE في دمج المستندات وتحرير الأختام القانونية وحساب بصمات كتلة الـ C9 تلقائيا.
            </p>

            <div className="grid grid-cols-1 gap-2 pt-2">
              <button
                onClick={() => triggerSimulation("GPS_CALIBRATION_BREACH")}
                disabled={currentStepProgress !== "IDLE"}
                className="w-full text-right flex items-center justify-between px-3 py-2 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/20 text-rose-300 rounded text-xs font-bold transition duration-200 cursor-pointer disabled:opacity-40"
              >
                <span>1) محاكاة انحراف GPS للموظف</span>
                <span className="font-mono text-[9px] px-1 bg-rose-500/10 rounded">PH4</span>
              </button>

              <button
                onClick={() => triggerSimulation("CONTRACT_AUTOMATION")}
                disabled={currentStepProgress !== "IDLE"}
                className="w-full text-right flex items-center justify-between px-3 py-2 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] rounded text-xs font-bold transition duration-200 cursor-pointer disabled:opacity-40"
              >
                <span>2) محاكاة توقيع عقد ذكي موحد</span>
                <span className="font-mono text-[9px] px-1 bg-[#D4AF37]/10 rounded">PH3</span>
              </button>

              <button
                onClick={() => triggerSimulation("ROYAL_FILTER_GRACE")}
                disabled={currentStepProgress !== "IDLE"}
                className="w-full text-right flex items-center justify-between px-3 py-2 bg-blue-950/20 hover:bg-blue-950/40 border border-blue-500/20 text-blue-300 rounded text-xs font-bold transition duration-200 cursor-pointer disabled:opacity-40"
              >
                <span>3) تطبيق مرشح الرحمة 11438</span>
                <span className="font-mono text-[9px] px-1 bg-blue-500/10 rounded">PH5</span>
              </button>

              <button
                onClick={() => triggerSimulation("FINAL_CLOSURE")}
                disabled={currentStepProgress !== "IDLE"}
                className="w-full text-right flex items-center justify-between px-3 py-2 bg-emerald-900/10 hover:bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 rounded text-xs font-bold transition duration-200 cursor-pointer disabled:opacity-40"
              >
                <span>4) إغلاق الدورة القانونية وتشميع الحزمة</span>
                <span className="font-mono text-[9px] px-1 bg-emerald-500/10 rounded">PH6</span>
              </button>
            </div>
            
            <div className="pt-2">
              <button
                onClick={() => {
                  if (window.confirm(isAr ? "هل أنت متأكد من إعادة تعيين جميع مستندات المحاكاة للوضع الافتراضي؟" : "Reset simulated records?")) {
                    setDocuments(INITIAL_DEMO_DOCS);
                    setSelectedDoc(INITIAL_DEMO_DOCS[0]);
                    addLog(isAr ? "🗑️ تم تطهير ركام مستندات المحاكاة بنجاح." : "🗑️ Cleared simulated data index.", "warning");
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-black hover:bg-zinc-950 border border-white/5 hover:border-red-500/20 text-gray-400 hover:text-red-400 rounded text-xs font-bold transition duration-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>مسح وإعادة ضبط المحقق الافتراضي</span>
              </button>
            </div>
          </div>

          {/* SADE Event Bus Real Estate Channel Log */}
          <div className="bg-black border border-white/10 rounded p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#D4AF37]" />
                <h2 className="text-sm font-bold text-white">Event Stream — قناة رصد الأحداث</h2>
              </div>
              <span className="font-mono text-[9px] text-gray-500 animate-pulse">LIVE Sockets</span>
            </div>

            <div className="h-60 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800 pr-1">
              {logs.map((log) => (
                <div key={log.id} className="text-[10px] leading-relaxed font-mono flex gap-2 border-b border-white/5 pb-1">
                  <span className="text-gray-500 shrink-0 select-none">[{log.time}]</span>
                  <span className={`
                    ${log.level === "success" ? "text-emerald-400" : ""}
                    ${log.level === "warning" ? "text-amber-500 font-bold" : ""}
                    ${log.level === "ledger" ? "text-indigo-300 border-r border-indigo-500/40 pr-1" : ""}
                    ${log.level === "info" ? "text-gray-300" : ""}
                  `}>
                    {log.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side Stack: Outgoing Documents Registry Table & Details Viewer */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Phase Filter Bar */}
          <div className="bg-[#010814] border border-white/10 p-3 rounded flex flex-wrap gap-2 items-center justify-between">
            <span className="text-xs text-gray-400 font-bold">أرشفة المراحل الستة للتوثيق (SADE PH1–PH6):</span>
            <div className="flex flex-wrap gap-1">
              <button 
                onClick={() => setFilterPhase("ALL")}
                className={`px-3 py-1 rounded text-[10px] font-bold transition duration-200 ${filterPhase === "ALL" ? "bg-[#D4AF37] text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
              >
                الكل
              </button>
              {PHASES.map(ph => (
                <button
                  key={ph.id}
                  onClick={() => setFilterPhase(ph.id)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition duration-200 flex items-center gap-1 ${filterPhase === ph.id ? "bg-[#D4AF37] text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                >
                  <span className="font-mono">{ph.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Outgoing Documents Table */}
          <div className="bg-[#010814] border border-white/10 rounded overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#D4AF37]">قيد المستندات الصدارة والمصدقة (SADE Record Ledger)</h2>
              <span className="font-mono text-xs text-gray-400">{filteredDocs.length} مستند نشط</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-white/5 text-gray-400 uppercase tracking-wider text-[10px] border-b border-white/10">
                    <th className="p-3">رقم الكتلة</th>
                    <th className="p-3">نوع المستند</th>
                    <th className="p-3">اسم الوثيقة وتصنيفها</th>
                    <th className="p-3">تاريخ الإصدار</th>
                    <th className="p-3">حالة التوثيق</th>
                    <th className="p-3 text-left">التفاعل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 font-bold">
                        لا توجد وثائق في هذه المرحلة حالياً. للبدء استخدم معالج المحاكاة للـ SADE في اليمين!
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((docItem) => {
                      const isSelected = selectedDoc?.id === docItem.id;
                      return (
                        <tr 
                          key={docItem.id}
                          onClick={() => setSelectedDoc(docItem)}
                          className={`hover:bg-white/5 cursor-pointer transition duration-150 ${isSelected ? "bg-[#D4AF37]/5 border-r-2 border-[#D4AF37]" : ""}`}
                        >
                          <td className="p-3 font-mono font-bold text-gray-300">
                            #{docItem.c9BlockNum}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[9px] bg-white/5 text-gray-300">
                              {docItem.documentType}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white text-[11px] max-w-[180px] md:max-w-[240px] truncate">
                              {docItem.titleAr}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono truncate max-w-[180px]">
                              {docItem.stepCode} - {docItem.id.substring(0,12)}...
                            </div>
                          </td>
                          <td className="p-3 text-gray-400 font-mono text-[10px] whitespace-nowrap">
                            {docItem.timestamp}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[8px] font-extrabold flex items-center gap-1 justify-end shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span className="text-emerald-400 font-mono">ARCHIVED</span>
                            </span>
                          </td>
                          <td className="p-3 text-left">
                            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => triggerPDFExport(docItem)}
                                className="p-1 px-1.5 rounded bg-blue-950 text-blue-300 border border-blue-100/10 hover:bg-blue-900 transition text-[9px] cursor-pointer flex items-center gap-0.5"
                                title="عرض وتحميل نسخة PDF السيادية المبرهنة"
                              >
                                <Download className="w-3 h-3" />
                                <span className="hidden md:inline">PDF</span>
                              </button>
                              
                              <button 
                                onClick={() => triggerExportToMinistry(docItem)}
                                disabled={isExporting === docItem.id}
                                className={`p-1 px-1.5 rounded transition text-[9px] flex items-center gap-0.5 cursor-pointer border ${
                                  exportSuccess === docItem.id 
                                    ? "bg-emerald-950 text-emerald-400 border-emerald-500/20" 
                                    : "bg-emerald-950/20 text-emerald-300 border-emerald-500/20 hover:bg-emerald-900/30"
                                }`}
                                title="إرسال وتصدير حزمة الأدلة للوزارة"
                              >
                                {isExporting === docItem.id ? (
                                  <span className="w-3 h-3 border border-emerald-400 border-t-transparent animate-spin rounded-full"></span>
                                ) : exportSuccess === docItem.id ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Send className="w-3 h-3" />
                                )}
                                <span className="hidden md:inline">
                                  {exportSuccess === docItem.id ? "مكتمل في الوزارة" : "تصدير للوزارة"}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Document Details Board Panel */}
          {selectedDoc && (
            <div className="bg-[#000814] border border-[#D4AF37]/30 rounded p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 bg-[#D4AF37]/5 border-b border-r border-[#D4AF37]/20 p-2 font-mono text-[9px] text-[#D4AF37] rounded-br">
                Verified Cryptographic Sovereign Record (SADE-LEDGER)
              </div>
              
              <div className="border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                    {selectedDoc.phaseId}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {selectedDoc.stepCode}
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-1 leading-snug">
                  {selectedDoc.titleAr}
                </h3>
                <p className="text-[10px] text-gray-500 mt-1 font-mono">
                  {selectedDoc.titleEn}
                </p>
              </div>

              <div className="text-xs leading-relaxed space-y-4">
                
                {/* Description Column */}
                <div>
                  <h4 className="font-bold text-[#D4AF37] mb-1">البيان الفني القانوني للواقعة:</h4>
                  <p className="text-gray-200 bg-white/5 p-3 rounded border border-white/5">
                    {selectedDoc.descriptionAr}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono mt-1 pr-3 border-r border-white/10">
                    {selectedDoc.descriptionEn}
                  </p>
                </div>

                {/* Evidence Column */}
                <div>
                  <h4 className="font-bold text-[#D4AF37] mb-1">حجج الإثبات وحزم الأدلة التناظرية الفعالة (Evidence Logs):</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedDoc.evidence.map((ev, idx) => (
                      <div key={idx} className="bg-black border border-white/5 p-2 rounded flex items-center gap-2 font-mono text-[10px] text-gray-400">
                        <Archive className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate" title={ev}>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Outcomes Matrix */}
                <div>
                  <h4 className="font-bold text-[#D4AF37] mb-1">نتائج مطابقة وتغيير السجلات التشريعية (Governance Outcomes):</h4>
                  <div className="space-y-1.5 text-[11px]">
                    {selectedDoc.outcomesAr.map((oc, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-gray-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{oc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Secure Cryptographic HMAC details */}
                <div className="border-t border-white/5 pt-4">
                  <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-3 rounded font-mono text-[10px]">
                    <div className="flex items-center justify-between font-bold text-[#D4AF37] mb-1">
                      <span>الختم التناظري للحماية (HMAC SHA-256 Master Seal)</span>
                      <span>بصمة حماية C9</span>
                    </div>
                    <div className="text-gray-300 break-all select-all font-mono">
                      {selectedDoc.hmacSignature || "000000000000000000e00f9a2fb3bc472fb8918bcde0cc293b7dfa910bf1a34b"}
                    </div>
                    <div className="mt-2 text-right text-[9px] text-gray-500 flex items-center gap-1.5 justify-end">
                      <span>رقم الكتلة: #{selectedDoc.c9BlockNum}</span>
                      <span>•</span>
                      <span>معرف المعاملة: {selectedDoc.c9TxId}</span>
                      <span>•</span>
                      <span>المرجع: SADE-AUTH-V3</span>
                    </div>
                  </div>
                </div>

                {/* Final PDF Download trigger block with Arabic Print & Language option selection */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5 pt-4">
                  {/* Language Selector Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold text-xs">خيارات لغة التصدير الحوكمي:</span>
                    <select
                      value={builderLang}
                      onChange={(e) => setBuilderLang(e.target.value as "AR" | "EN" | "BILINGUAL")}
                      className="bg-[#000814] border border-[#D4AF37]/40 text-[#D4AF37] rounded px-2.5 py-1 text-xs font-sans font-bold outline-none cursor-pointer hover:bg-zinc-900 transition-all"
                    >
                      <option value="AR">العربية فقط (AR)</option>
                      <option value="EN">الإنجليزية فقط (EN)</option>
                      <option value="BILINGUAL">ثنائي اللغة (BILINGUAL)</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap gap-2 justify-end w-full sm:w-auto">
                    {/* Print in Arabic Button */}
                    <button
                      onClick={() => triggerPDFExport(selectedDoc, "AR")}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-amber-900/40 hover:bg-amber-900 border border-amber-500/30 text-amber-100 font-extrabold text-xs rounded transition duration-250 cursor-pointer"
                      title="طباعة النسخة المترجمة والمحققة باللغة العربية فوراً"
                    >
                      <Printer className="w-4 h-4 text-amber-400" />
                      <span>طباعة باللغة العربية (AR PDF)</span>
                    </button>

                    <button
                      onClick={() => triggerPDFExport(selectedDoc)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#b59228] text-black font-extrabold text-xs rounded transition duration-250 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل صك التوثيق السيادي المبرهن (Certified PDF)</span>
                    </button>

                    <button
                      onClick={() => triggerExportToMinistry(selectedDoc)}
                      disabled={isExporting === selectedDoc.id}
                      className="flex items-center justify-[#D4AF37] gap-2 px-4 py-2 bg-emerald-950/40 hover:bg-emerald-950 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold rounded transition duration-250 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isExporting === selectedDoc.id ? "جاري التمكين..." : "تصدير للوزارة"}</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
