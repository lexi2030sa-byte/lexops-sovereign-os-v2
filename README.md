# LexOps Sovereign OS (v2026) ⚖️🇸🇦

نظام التشغيل السيادي الشامل للرقابة والامتثال وحوكمة بيئة العمل والأجور والنزاعات العمالية 2026.

---

## 🏛️ النواة المعمارية (Architecture & Engines)

1. **SDE-2026 (Sovereign Dispatch Engine):** إدارة الحضور الجغرافي والتحقق من النطاق المكاني ومنع التلاعب بالإحداثيات (GPS Geofencing).
2. **SPE-2026 (Sovereign Payroll Engine):** محرك احتساب الرواتب الداخلي واقتطاعات التأمينات الاجتماعية وساعات العمل والغياب.
3. **LEXI-2026 (Sovereign Legal Intelligence):** مستشار صياغة اللوائح والاعتراضات القانونية المسببة وفق نظام العمل 2026.
4. **S8-2026 (Sovereign Compliance Engine):** رصد الامتثال المؤسسي التراكمي وتدقيق المخالفات وإدارة النزاعات.
5. **SRE-2026 (Sovereign Rules Engine):** محرك القواعد النظامية وفرض **الفلتر الملكي 11438** ومهل التصحيح (3 أيام) وقاعدة التكرار (180 يوماً).
6. **سجل C9 السيادي (C9 Immutable Ledger):** سجل تشفيري صلب غير قابل للتعديل أو الحذف (HMAC-SHA256 كامل بـ 64 محرفاً) لتوثيق كافة الأحداث والقرارات.

---

## 🛡️ مصفوفة التحصين الأمني (P0 Security Guards)

- **P0-1:** إغلاق وتحصين مسار التطوير `dev-login`، ومنع صلاحيات المؤسس عبره، وحظره كلياً في الإنتاج (`403 Forbidden`).
- **P0-2:** فرض وسيط `requireFirebaseAuth` والتحقق التشفيري على كافة المسارات الحساسة (`/api/payroll`, `/api/attendance`, `/api/agent`, `/api/engines`, `/api/c9/sign`, `/api/firestore`).
- **P0-3:** تفعيل وسيط الحظر الإنتاجي `PRODUCTION_BLOCKLIST` لمنع مسارات المحاكاة والاختبار في بيئة التشغيل الفعلية.
- **P0-4:** تطبيق قواعد Firestore الصارمة (Fortress 700) وحظر التعديل والحذف لمجموعات `c9_ledger`.
- **P0-5:** تحصين مسارات المحركات والإعدادات السيادية وحصر تعديل التنبيهات برتبة المؤسس (`requireFounderOnly`).

---

## 🚀 التشغيل والتطوير (Local & Production Execution)

### المتطلبات الأساسية
- Node.js 20+
- npm أو bun

### 1. إعداد البيئة
انسخ ملف الإعدادات واملأ المتغيرات المطلوبة:
```bash
cp .env.example .env
```

### 2. تثبيت الحزم
```bash
npm install
```

### 3. تشغيل وضع التطوير
```bash
npm run dev
```

### 4. البناء والتحقق الإنتاجي
```bash
npm run lint
npm run build
npm start
```

---

## 🐳 النشر عبر الحاويات (Docker & Cloud Run)
```bash
# بناء الحاوية
docker build -t lexops-sovereign-os:2026 .

# تشغيل بيئة متكاملة عبر Docker Compose
docker-compose up -d
```
