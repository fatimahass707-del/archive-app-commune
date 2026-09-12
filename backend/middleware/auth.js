const jwt = require("jsonwebtoken");

// يتحقق من صحة الـ token ويضيف معلومات المستخدم إلى req.user
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "الرجاء تسجيل الدخول أولاً" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, full_name }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(403).json({ message: "الجلسة منتهية أو غير صالحة، الرجاء تسجيل الدخول من جديد" });
  }
}

// يسمح فقط لأدوار معينة بالوصول (مثال: requireRole("admin"))
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "ما عندكش الصلاحية لهاد العملية" });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
