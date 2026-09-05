import React, { useState, useEffect } from "react";

interface SovereignLandingProps {
  onNavigate: (view: "register-org" | "register-freelancer" | "login" | "dashboard") => void;
}

export default function SovereignLanding({ onNavigate }: SovereignLandingProps) {
  const [currentLang, setCurrentLang] = useState<"ar" | "en">("ar");

  useEffect(() => {
    // Star canvas animation setup
    const canvas = document.getElementById('cosmicCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let stars: any[] = [];
    const maxStars = 65;
    const connectionDist = 115;
    
    const initCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = [];
      for(let i=0; i<maxStars; i++) {
        stars.push({
          x: Math.random() * canvas.width, y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 2 + 1, twinkleSpeed: 0.01 + Math.random() * 0.02,
          alpha: Math.random(), increasing: true
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for(let i=0; i<stars.length; i++) {
        let s1 = stars[i];
        s1.x += s1.vx; s1.y += s1.vy;
        if(s1.x < 0 || s1.x > canvas.width) s1.vx *= -1;
        if(s1.y < 0 || s1.y > canvas.height) s1.vy *= -1;
        if(s1.increasing) { s1.alpha += s1.twinkleSpeed; if(s1.alpha >= 1) s1.increasing = false; } 
        else { s1.alpha -= s1.twinkleSpeed; if(s1.alpha <= 0.1) s1.increasing = true; }
        ctx.beginPath(); ctx.arc(s1.x, s1.y, s1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 213, 163, ${s1.alpha})`; ctx.shadowBlur = 6; ctx.shadowColor = '#C8A96B'; ctx.fill(); ctx.shadowBlur = 0;
        for(let j=i+1; j<stars.length; j++) {
          let s2 = stars[j]; let dx = s1.x - s2.x; let dy = s1.y - s2.y; let dist = Math.sqrt(dx*dx + dy*dy);
          if(dist < connectionDist) {
            let lineAlpha = (1 - (dist / connectionDist)) * 0.16;
            ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y);
            ctx.strokeStyle = `rgba(200, 169, 107, ${lineAlpha})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    };
    
    window.addEventListener('resize', initCanvas);
    initCanvas();
    animate();
    return () => window.removeEventListener('resize', initCanvas);
  }, []);

  const toggleLanguage = () => {
    setCurrentLang(prev => prev === "ar" ? "en" : "ar");
  };

  const t = currentLang === "ar" ? {
    navAbout: "من نحن", navVision: "الرؤية", navFaq: "الأسئلة",
    badge: "النسخة السيادية النشطة v2.4a // معالجة مستمرة",
    title1: "ثقة تنظيمية", title2: "مطلقة", title3: "بإدارة الذكاء السيادي المدمج LexOps",
    desc: "نوحد السجلات، ونؤمن الفروع جغرافياً، وندقق المستندات لحظياً بامتثال آلي متوافق مع لوائح الأمانات الحضرية ووزارة الموارد البشرية السعودية وقواعد حوكمة البيانات الصارمة.",
    orgTitle: "توثيق وتسجيل المنشآت", orgDesc: "تسجيل الكيان القانوني للمؤسسة وربط الهوية التجارية بالامتثال الوطني الشامل آلياً.", orgAction: "انضم الآن واستكشف المنصة",
    freeTitle: "الكادر الفني والمهنيين", freeDesc: "إنشاء الهوية المهنية وربط بطاقات العمل الفورية والتراخيص الصحية بالأنظمة الحكومية المعتمدة.", freeAction: "تسجيل الهوية الفنية المستقلة",
    consoleTitle: "جسر الدخول الموحد", consoleDesc: "الولوج إلى لوحة الحوكمة السيادية ومباشرة تدقيق البيانات وحصر سجل المخالفات والأنشطة.", consoleAction: "دخول البوابة الدبلوماسية",
    aboutTag: "من نحن", aboutTitle: "منصة LexOps السيادية",
    aboutP1: "نحن منصة سعودية متخصصة في تصميم أنظمة التشغيل السيادية للحوكمة والامتثال الرقابي. تأسست على يد نخبة من الخبراء في الأنظمة القانونية، والامتثال الحكومي، والذكاء الاصطناعي التطبيقي.",
    aboutP2: "نجمع بين قوة الذكاء الاصطناعي (LEXI Engine) وسلسلة الكتل المشفرة (C9 Ledger) لتقديم تجربة حوكمة لا مثيل لها، تضمن الشفافية، والأمان الجنائي، والتوافق التام مع لوائح 2026.",
    stat1: "منشأة مُدارة", stat2: "وقت تشغيل", stat3: "كتلة C9 موثقة", stat4: "دعم سيادي",
    vmTitle: "رؤيتنا وهدفنا السيادي", vmDesc: "نسعى لبناء بيئة أعمال سعودية رقمية ذات سيادة تنظيمية كاملة.",
    visionTitle: "الرؤية", visionDesc: "أن نكون المنصة السيادية الأولى في المنطقة للحوكمة الرقمية والامتثال المؤسسي، ونضع المعيار الذهبي للثقة التنظيمية.",
    missionTitle: "الهدف", missionDesc: "تمكين كل منشأة في المملكة من تحقيق الامتثال الآلي الكامل مع لوائح الأمانات، وزارة الموارد البشرية، وهيئة الزكاة والضريبة.",
    faqTitle: "إجابات على استفساراتك", faqDesc: "كل ما تحتاج معرفته عن منصة LexOps السيادية قبل الانضمام.",
    faqQ1: "ما هو نظام LexOps Sovereign OS?", faqA1: "نظام تشغيل سيادي متكامل يجمع بين الحوكمة الرقمية، الامتثال الآلي، وسلسلة الكتل المشفرة (C9 Ledger).",
    faqQ2: "هل يتكامل مع الجهات الحكومية؟", faqA2: "نعم، يتكامل لحظياً مع منصة بلدي، قوى، هيئة الزكاة، ونفاذ الوطني.",
    faqQ3: "ما هي سلسلة C9 المشفرة؟", faqA3: "سلسلة كتل سيادية بتقنية WORM تضمن أن كل عملية تُختم ببصمة جنائية غير قابلة للتعديل.",
    faqQ4: "هل بياناتي آمنة؟", faqA4: "نعم، بنية تحتية على Google Cloud مع تشفير AES-256 وعزل تام بين بيانات كل منشأة.",
    faqQ5: "كم يستغرق التفعيل؟", faqA5: "أقل من 24 ساعة، تشمل التسجيل، ربط السجل التجاري، واعتماد الكادر البشري.",
    faqQ6: "هل يدعم العمل الحر؟", faqA6: "نعم، وحدة متكاملة لإدارة عقود العمل الحر وتوثيقها في C9 وإصدار فواتير ZATCA.",
    faqQ7: "ما هو محرك LEXI الذكي؟", faqA7: "محرك ذكاء اصطناعي مبني على Gemini 2.5 Flash، مُدرَّب على اللوائح السعودية لصياغة الاعتراضات وتحليل العقود."
  } : {
    navAbout: "About", navVision: "Vision", navFaq: "FAQ",
    badge: "Sovereign Build Live v2.4a // Continuous Cognitive Cycle",
    title1: "Absolute Regulatory", title2: "Trust", title3: "managed by LexOps Symmetrical Sovereign Mind",
    desc: "Consolidate workforce ledgers, geofence physical facilities, and validate instant documentation fully compliant with Balady Municipal standards and local labor laws.",
    orgTitle: "Corporate Registries", orgDesc: "Register legal entity and synthesize corporate business credentials with national compliance guidelines.", orgAction: "Establish Organization ledger",
    freeTitle: "Technical & Field Experts", freeDesc: "Create freelance trust cards and synchronize sanitary licenses directly with regulatory standards.", freeAction: "Configure Expert Identity",
    consoleTitle: "Sovereign Access Gateway", consoleDesc: "Authenticate and enter the primary dashboard to explore citation objections, tracking, and logs.", consoleAction: "Access Sovereign Console",
    aboutTag: "About Us", aboutTitle: "The LexOps Sovereign Platform",
    aboutP1: "We are a Saudi platform specialized in designing sovereign operating systems for governance and regulatory compliance. Founded by an elite team of experts.",
    aboutP2: "We combine the power of AI (LEXI Engine) and encrypted blockchain (C9 Ledger) to deliver an unmatched governance experience.",
    stat1: "Managed Orgs", stat2: "Uptime", stat3: "C9 Blocks", stat4: "Sovereign Support",
    vmTitle: "Our Vision & Sovereign Mission", vmDesc: "We strive to build a Saudi digital business environment with full regulatory sovereignty.",
    visionTitle: "Vision", visionDesc: "To be the region's first sovereign platform for digital governance and institutional compliance.",
    missionTitle: "Mission", missionDesc: "To empower every organization in the Kingdom to achieve full automated compliance with Municipal, HR, and ZATCA regulations.",
    faqTitle: "Answers to Your Questions", faqDesc: "Everything you need to know about the LexOps sovereign platform before joining.",
    faqQ1: "What is LexOps Sovereign OS?", faqA1: "An integrated sovereign operating system combining digital governance, automated compliance, and encrypted blockchain (C9 Ledger).",
    faqQ2: "Does it integrate with government entities?", faqA2: "Yes, real-time integration with Balady, Qiwa, ZATCA, and Nafath.",
    faqQ3: "What is the encrypted C9 chain?", faqA3: "A sovereign blockchain encrypted with WORM technology, ensuring every operation is sealed with an immutable forensic fingerprint.",
    faqQ4: "Is my data secure?", faqA4: "Yes, Google Cloud infrastructure with AES-256 encryption, Multi-Tenancy isolation, and daily encrypted backups.",
    faqQ5: "How long to activate?", faqA5: "Less than 24 hours, including registration, CR linkage, and workforce approval.",
    faqQ6: "Does it support freelancers?", faqA6: "Yes, integrated unit for freelance contracts, C9 documentation, and ZATCA e-invoicing.",
    faqQ7: "What is the LEXI AI engine?", faqA7: "Sovereign AI engine built on Gemini 2.5 Flash, trained on Saudi regulations to draft objections and analyze contracts."
  };

  return (
    <div className="selection:bg-goldRoyal selection:text-black" dir={currentLang === "ar" ? "rtl" : "ltr"}>
      <style>{`
        body { background-color: #000000 !important; color: #F8FAFC; overflow-x: hidden; }
        .glass-card { background: rgba(4, 5, 12, 0.88); backdrop-filter: blur(18px); border: 1px solid rgba(200, 169, 107, 0.2); border-radius: 18px; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
        .glass-card:hover { border-color: rgba(200, 169, 107, 0.45); box-shadow: 0 0 25px rgba(200, 169, 107, 0.15); transform: translateY(-2px); }
        .glass-button { background: rgba(200, 169, 107, 0.08); backdrop-filter: blur(8px); border: 1px solid rgba(200, 169, 107, 0.25); border-radius: 11px; transition: all 0.25s ease; }
        .glass-button:hover { background: rgba(200, 169, 107, 0.2); border-color: #E8D5A3; box-shadow: 0 0 14px rgba(200, 169, 107, 0.35); }
        .gold-gradient-text { background: linear-gradient(135deg, #E8D5A3 0%, #C8A96B 50%, #9A7F45 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: inline-block; }
        .sovereign-glow-gold { box-shadow: 0 0 18px rgba(200, 169, 107, 0.4); }
        .glow-success { box-shadow: 0 0 15px rgba(52, 211, 153, 0.3); }
        @keyframes rotateClockwise { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes subtlePulse { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.02); } }
        .animate-rotate-cw { animation: rotateClockwise 25s linear infinite; }
        .nebula-glow { animation: subtlePulse 8s infinite ease-in-out; }
        details summary { cursor: pointer; list-style: none; }
        details summary::-webkit-details-marker { display: none; }
        details[open] summary .faq-icon { transform: rotate(45deg); }
        .faq-icon { transition: transform 0.3s ease; }
      `}</style>

      <canvas id="cosmicCanvas" className="fixed inset-0 z-0 pointer-events-none w-full h-full select-none" />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30 mix-blend-screen">
        <div className="absolute top-[10%] left-[25%] w-[450px] h-[450px] rounded-full bg-gradient-to-br from-[#C8A96B]/10 to-transparent blur-[110px] nebula-glow"></div>
        <div className="absolute bottom-[20%] right-[15%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-[#22D3EE]/10 to-transparent blur-[140px] nebula-glow" style={{ animationDelay: "3s" }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col justify-between">
        {/* HEADER */}
        <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6">
          <div className="glass-card p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border" style={{ background: "rgba(4, 5, 12, 0.85)", backdropFilter: "blur(20px)" }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 border-2 border-goldRoyal flex items-center justify-center bg-cosmicBlack rotate-45 transform hover:scale-110 transition-transform duration-300 sovereign-glow-gold">
                <div className="-rotate-45 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-goldLight" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black font-mono tracking-wider text-highContrast">Lex<span className="gold-gradient-text">Ops</span></span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-widest bg-goldRoyal/15 text-goldLight border border-goldRoyal/25">SOVEREIGN V2</span>
                </div>
                <p className="text-[10px] text-slateMuted font-mono">نظام التشغيل السيادي للحوكمة والامتثال الرقابي والأخلاقي</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <a href="#about" className="text-xs font-semibold text-slateMuted hover:text-goldLight transition-colors duration-150 px-2 py-1">{t.navAbout}</a>
              <a href="#vision" className="text-xs font-semibold text-slateMuted hover:text-goldLight transition-colors duration-150 px-2 py-1">{t.navVision}</a>
              <a href="#faq" className="text-xs font-semibold text-slateMuted hover:text-goldLight transition-colors duration-150 px-2 py-1">{t.navFaq}</a>
              <button className="glass-button text-xs font-bold text-goldLight px-4 py-2 font-mono" onClick={toggleLanguage}>
                {currentLang === "ar" ? "ENGLISH" : "العربية"}
              </button>
            </div>
          </div>
        </header>

        {/* HERO SECTION */}
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-4xl text-center space-y-8 py-10">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cosmicDark/85 border border-goldRoyal/20 shadow-[0_0_15px_rgba(200,169,107,0.08)] mx-auto animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-emeraldGlow glow-success"></span>
              <span className="text-xs font-extrabold tracking-wide text-highContrast font-mono">{t.badge}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-highContrast leading-tight tracking-tight">
              {t.title1} <span className="gold-gradient-text">{t.title2}</span><br />
              {t.title3}
            </h1>
            <p className="text-sm md:text-md text-slateMuted max-w-2xl mx-auto leading-relaxed">{t.desc}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 max-w-3xl mx-auto">
              {/* Card 1: Register Org */}
              <div onClick={() => onNavigate("register-org")} className="glass-card p-6 flex flex-col justify-between text-right cursor-pointer group hover:border-goldRoyal/60 transition-all duration-300">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-goldRoyal/10 border border-goldRoyal/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110 sovereign-glow-gold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-goldLight" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <h3 className="text-md font-black text-highContrast tracking-tight group-hover:text-goldLight">{t.orgTitle}</h3>
                  <p className="text-xs text-slateMuted leading-normal">{t.orgDesc}</p>
                </div>
                <div className="pt-4 flex items-center gap-1.5 text-xs text-goldLight font-bold font-mono">
                  <span>{t.orgAction}</span><span>←</span>
                </div>
              </div>

              {/* Card 2: Freelancer */}
              <div onClick={() => onNavigate("register-freelancer")} className="glass-card p-6 flex flex-col justify-between text-right cursor-pointer group hover:border-[#22D3EE]/50 transition-all duration-300">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-cyanGlow/10 border border-[#22D3EE]/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#22D3EE]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 014 0v3m-6 8a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <h3 className="text-md font-black text-highContrast tracking-tight group-hover:text-[#22D3EE]">{t.freeTitle}</h3>
                  <p className="text-xs text-slateMuted leading-normal">{t.freeDesc}</p>
                </div>
                <div className="pt-4 flex items-center gap-1.5 text-xs text-[#22D3EE] font-bold font-mono">
                  <span>{t.freeAction}</span><span>←</span>
                </div>
              </div>

              {/* Card 3: Login */}
              <div onClick={() => onNavigate("login")} className="glass-card p-6 flex flex-col justify-between text-right cursor-pointer group bg-gradient-to-br from-[#E8D5A3] to-[#9A7F45] text-cosmicBlack hover:shadow-[0_0_25px_rgba(200,169,107,0.5)] border-transparent transition-all duration-300">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-cosmicBlack/15 border border-cosmicBlack/20 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-cosmicBlack" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <h3 className="text-md font-black tracking-tight">{t.consoleTitle}</h3>
                  <p className="text-xs text-cosmicBlack/80 leading-normal">{t.consoleDesc}</p>
                </div>
                <div className="pt-4 flex items-center gap-1.5 text-xs text-cosmicBlack font-black font-mono">
                  <span>{t.consoleAction}</span><span>←</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ABOUT US */}
        <section id="about" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16">
          <div className="glass-card p-8 md:p-12 border relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(200,169,107,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(200,169,107,0.015)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2 space-y-5 text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-goldRoyal/15 text-goldLight border border-goldRoyal/30 text-xs font-mono font-bold">
                  <span>🏛️ {t.aboutTag}</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-highContrast leading-tight">{t.aboutTitle}</h2>
                <p className="text-sm md:text-base text-slateMuted leading-relaxed">{t.aboutP1}</p>
                <p className="text-sm md:text-base text-slateMuted leading-relaxed">{t.aboutP2}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 text-center border-goldRoyal/20"><div className="text-3xl font-black gold-gradient-text">+500</div><div className="text-[10px] text-slateMuted font-mono mt-1">{t.stat1}</div></div>
                <div className="glass-card p-4 text-center border-goldRoyal/20"><div className="text-3xl font-black text-emeraldGlow">99.8%</div><div className="text-[10px] text-slateMuted font-mono mt-1">{t.stat2}</div></div>
                <div className="glass-card p-4 text-center border-goldRoyal/20"><div className="text-3xl font-black text-cyanGlow">+1M</div><div className="text-[10px] text-slateMuted font-mono mt-1">{t.stat3}</div></div>
                <div className="glass-card p-4 text-center border-goldRoyal/20"><div className="text-3xl font-black text-amberGlow">24/7</div><div className="text-[10px] text-slateMuted font-mono mt-1">{t.stat4}</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* VISION & MISSION */}
        <section id="vision" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-highContrast mb-3">{t.vmTitle}</h2>
            <p className="text-sm text-slateMuted max-w-2xl mx-auto">{t.vmDesc}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="glass-card p-8 border-goldRoyal/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-goldRoyal/10 to-transparent rounded-full blur-3xl"></div>
              <div className="relative z-10 space-y-4 text-right">
                <h3 className="text-xl font-black text-highContrast">{t.visionTitle}</h3>
                <p className="text-sm text-slateMuted leading-relaxed">{t.visionDesc}</p>
              </div>
            </div>
            <div className="glass-card p-8 border-cyanGlow/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyanGlow/10 to-transparent rounded-full blur-3xl"></div>
              <div className="relative z-10 space-y-4 text-right">
                <h3 className="text-xl font-black text-highContrast">{t.missionTitle}</h3>
                <p className="text-sm text-slateMuted leading-relaxed">{t.missionDesc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-highContrast mb-3">{t.faqTitle}</h2>
            <p className="text-sm text-slateMuted max-w-2xl mx-auto">{t.faqDesc}</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <details key={i} className="glass-card border-goldRoyal/20 group">
                <summary className="p-5 flex justify-between items-center gap-4">
                  <h3 className="text-sm md:text-base font-bold text-highContrast group-hover:text-goldLight transition-colors">{t[`faqQ${i}` as keyof typeof t]}</h3>
                  <span className="faq-icon text-goldLight text-2xl font-light flex-shrink-0">+</span>
                </summary>
                <div className="px-5 pb-5 text-sm text-slateMuted leading-relaxed border-t border-goldRoyal/10 pt-4">
                  {t[`faqA${i}` as keyof typeof t]}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 border-t border-goldRoyal/10 mt-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-right">
            <p className="text-xs text-slateMuted font-mono">&copy; 2026 LexOps. جميع الحقوق السيادية والتنظيمية محفوظة.</p>
            <span className="text-[10px] bg-goldRoyal/10 text-goldLight px-3 py-1 rounded-full border border-goldRoyal/20 font-mono">SECURE KSA REGULATORY LEDGER TRUST v2.4</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
