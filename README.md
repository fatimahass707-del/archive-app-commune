# نظام الأرشفة الإلكترونية للجماعة

تطبيق ويب كامل (Full Stack) لتدبير أرشيف الوثائق فالجماعة: رفع، تصنيف، بحث، فلترة، صلاحيات مستخدمين، ولوحة إحصائيات.

## المكونات (Stack)

- **Backend**: Node.js + Express + MySQL (mysql2) + JWT + Multer
- **Frontend**: React (Vite) + React Router + Recharts + Axios

## المميزات

- تسجيل دخول آمن (JWT) مع صلاحيتين: **مدير (admin)** و **موظف (agent)**
- إضافة/تعديل/حذف الوثائق مع رفع ملفات (PDF, صور, Word)
- رقم مرجعي تلقائي فريد لكل وثيقة (مثال: `DOC-2026-000123`)
- بحث وفلترة حسب العنوان، الصنف، السنة، الحالة
- تدبير أصناف الوثائق (حالة مدنية، صفقات، عقارات...)
- لوحة قيادة (Dashboard) بإحصائيات ورسوم بيانية
- تدبير حسابات الموظفين (فقط للمدير)

---

## 1. تحضير قاعدة البيانات

خاصك MySQL مثبت (يمكن تستعملي XAMPP أو WAMP إلا كنتي فوندوز).

```bash
mysql -u root -p < backend/database.sql
```

هذا غادي يخلق قاعدة البيانات `archive_jamaa` مع الجداول، وأصناف افتراضية، وحساب مدير جاهز:
- **الإيميل**: `admin@jamaa.ma`
- **كلمة السر**: `Admin@1234`

⚠️ بدلي هاد الكلمة السرية بعد أول دخول.

## 2. تشغيل الـ Backend

```bash
cd backend
npm install
cp .env.example .env
```

عدلي ملف `.env` وعبئي فيه معلومات قاعدة البيانات ديالك (`DB_USER`, `DB_PASSWORD`...) و `JWT_SECRET` بقيمة عشوائية طويلة.

```bash
npm run dev
```

السيرفر غادي يخدم على `http://localhost:5000`

## 3. تشغيل الـ Frontend

فـ terminal جديد:

```bash
cd frontend
npm install
npm run dev
```

التطبيق غادي يفتح على `http://localhost:5173`

---

## بنية المشروع

```
archive-app/
├── backend/
│   ├── config/db.js          # الاتصال بقاعدة البيانات
│   ├── controllers/          # منطق كل عملية (auth, documents, categories...)
│   ├── middleware/           # auth.js (JWT) و upload.js (multer)
│   ├── routes/                # مسارات الـ API
│   ├── uploads/               # الملفات المرفوعة (يتخلق تلقائياً)
│   ├── database.sql          # سكيما قاعدة البيانات
│   └── server.js             # نقطة انطلاق السيرفر
└── frontend/
    └── src/
        ├── api/axios.js       # عميل HTTP مع JWT تلقائي
        ├── context/AuthContext.jsx
        ├── components/        # Sidebar, ProtectedRoute
        └── pages/              # Login, Dashboard, Documents...
```

## أفكار للتطوير المستقبلي (بعد الـ MVP)

- OCR على الوثائق الممسوحة باش النص يولي قابل للبحث (Tesseract.js)
- سجل تتبع العمليات (Audit log): شكون بدل/حذف شنو وفوقاش
- تصدير قوائم الوثائق كـ Excel/PDF
- استضافة الملفات على تخزين سحابي (MinIO/S3) بدل السيرفر المحلي
- إشعارات للوثائق اللي خاصها تتجدد أو تتراجع

## ملاحظة أمنية مهمة

هذا نظام MVP معد للتعلم والعرض. قبل الاستعمال الحقيقي فالجماعة:
- بدلي `JWT_SECRET` بقيمة قوية وعشوائية
- استعملي HTTPS فالإنتاج
- فكري فـ backup دوري لقاعدة البيانات ومجلد `uploads`
