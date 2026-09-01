const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { login, register, me, changePassword, refreshToken, logout } = require("../controllers/auth.controller");
const { verifyToken, requireRole } = require("../middleware/auth");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // 5 محاولات لكل عنوان IP
  message: { message: "تمت تجاوز عدد محاولات الدخول المسموح بها (5 محاولات). الرجاء الانتظار 15 دقيقة والتجربة من جديد." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.get("/me", verifyToken, me);
router.put("/change-password", verifyToken, changePassword);
// فقط admin هو اللي يقدر يخلق حسابات جداد للموظفين
router.post("/register", verifyToken, requireRole("admin"), register);

module.exports = router;
