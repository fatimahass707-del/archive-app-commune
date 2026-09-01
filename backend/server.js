/**
 * Application d'Archivage Électronique pour la Commune
 * Copyright (c) 2026 HASSANI FATIMA. Tous droits réservés.
 * Auteur / Développeur : HASSANI FATIMA
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");

const authRoutes = require("./routes/auth.routes");
const documentsRoutes = require("./routes/documents.routes");
const categoriesRoutes = require("./routes/categories.routes");
const usersRoutes = require("./routes/users.routes");
const statsRoutes = require("./routes/stats.routes");
const logsRoutes = require("./routes/logs.routes");
const notificationsRoutes = require("./routes/notifications.routes");

const app = express();

// 1. Helmet: يحمي تطبيق Express عن طريق تعيين ترويسات HTTP أمان مختلفة (مثل حماية XSS و no-sniff)
// مع السماح لـ iframe الخاص بالـ Frontend لعرض المعاينة بدون مشاكل الـ CSP أو X-Frame-Options
// دعم عدة عناوين Frontend مفصولة بفاصلة (مثال: dev server + preview server)
const frontendUrls = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);
const frontendUrl = frontendUrls[0]; // للاستخدام في CSP و Socket.io

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "frame-ancestors": ["'self'", ...frontendUrls],
      },
    },
    frameguard: false, // تعطيل X-Frame-Options للسماح للمتصفح بالاعتماد على CSP frame-ancestors الأكثر مرونة
    crossOriginResourcePolicy: false, // السماح بتحميل الموارد الثابتة (مثل الصور وملفات المعاينة) من أصل مختلف (Cross-Origin)
  })
);

// 2. Compression: يضغط استجابات JSON والنصوص (gzip) لتقليل حجم البيانات المنقولة
app.use(compression());

// في بيئة التطوير: السماح لأي منفذ على localhost (dev server, preview, إلخ)
// في بيئة الإنتاج: السماح فقط للعناوين المحددة في FRONTEND_URL
const isProduction = process.env.NODE_ENV === "production";
const corsOrigin = isProduction
  ? frontendUrls
  : (origin, callback) => {
      // السماح لأي طلب بدون origin (مثل Postman أو curl) أو أي localhost
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    };

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. التخزين المؤقت للمرفقات المرفوعة لمدة 7 أيام لتسريع التصفح وتجنب التحميل المتكرر للملفات الثابتة
app.use("/uploads", express.static(path.join(__dirname, "uploads"), { maxAge: "7d" }));

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/activity-logs", logsRoutes);
app.use("/api/notifications", notificationsRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.get("/api/copyright", (req, res) => {
  res.json({
    appName: "Système d'Archivage Électronique",
    author: "HASSANI FATIMA",
    year: "2026",
    license: "Tous droits réservés"
  });
});

// 4. معالج الأخطاء العام: يقوم بحجب تفاصيل مسار الخطأ (stack trace) في بيئة الإنتاج لمنع تسريب المسارات الداخلية
app.use((err, req, res, next) => {
  console.error(err);
  const errorResponse = { message: err.message || "خطأ في السيرفر" };

  if (process.env.NODE_ENV !== "production") {
    errorResponse.stack = err.stack;
  }

  res.status(err.status || 500).json(errorResponse);
});

const PORT = process.env.PORT || 5000;
const http = require("http");
const { Server } = require("socket.io");
const { setIoInstance } = require("./utils/notifications");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: frontendUrl,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

setIoInstance(io);

io.on("connection", (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);
  
  socket.on("join_user_room", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`[Socket] User ${userId} joined room: user_${userId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`✅ السيرفر خدام على http://localhost:${PORT}`);
});
