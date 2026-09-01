const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { logActivity } = require("../utils/logger");
const { getUserSpaces } = require("../middleware/space.middleware");

const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || "archive_refresh_secret_key_2026";

// توليد وحفظ رمز التجديد (Refresh Token) في القاعدة والكوكيز
async function createAndSendRefreshToken(user, res) {
  const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: "7d" });
  const tokenHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // إزالة الرموز القديمة للمستخدم للحفاظ على نظافة القاعدة
  await pool.query("DELETE FROM refresh_tokens WHERE user_id = ?", [user.id]);
  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [user.id, tokenHash, expiresAt]
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true في HTTPS/الإنتاج، false في التطوير
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return refreshToken;
}

// تسجيل الدخول
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "الرجاء إدخال الإيميل وكلمة السر" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ? AND is_active = TRUE",
      [email]
    );
    const user = rows[0];
    if (!user) {
      await logActivity(null, "login", "users", null, JSON.stringify({ key: "log.loginFailed", params: { email } }));
      return res.status(401).json({ message: "الإيميل أو كلمة السر غير صحيحة" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      await logActivity(user.id, "login", "users", user.id, JSON.stringify({ key: "log.loginWrongPassword", params: { email } }));
      return res.status(401).json({ message: "الإيميل أو كلمة السر غير صحيحة" });
    }

    // Access token قصيرة الصلاحية (15 دقيقة)
    const token = jwt.sign(
      { id: user.id, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    await createAndSendRefreshToken(user, res);
    await logActivity(user.id, "login", "users", user.id, JSON.stringify({ key: "log.loginSuccess", params: { name: user.full_name } }));

    const spaces = await getUserSpaces(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        department: user.department,
        spaces,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

// تجديد رمز الوصول (Refresh Access Token)
async function refreshToken(req, res) {
  try {
    const tokenFromCookie = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!tokenFromCookie) {
      return res.status(401).json({ message: "رمز التجديد مفقود" });
    }

    let decoded;
    try {
      decoded = jwt.verify(tokenFromCookie, REFRESH_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "رمز التجديد غير صالح أو منتهي الصلاحية" });
    }

    const [dbTokens] = await pool.query(
      "SELECT * FROM refresh_tokens WHERE user_id = ? AND expires_at > NOW()",
      [decoded.id]
    );

    if (dbTokens.length === 0) {
      return res.status(401).json({ message: "جلسة التجديد منتهية، الرجاء تسجيل الدخول مجدداً" });
    }

    let validToken = false;
    for (const row of dbTokens) {
      if (await bcrypt.compare(tokenFromCookie, row.token_hash)) {
        validToken = true;
        break;
      }
    }

    if (!validToken) {
      return res.status(401).json({ message: "رمز التجديد غير مطابق" });
    }

    const [userRows] = await pool.query("SELECT id, role, full_name, email, department FROM users WHERE id = ? AND is_active = TRUE", [decoded.id]);
    if (userRows.length === 0) {
      return res.status(401).json({ message: "المستخدم غير موجود أو معطل" });
    }

    const user = userRows[0];
    const newToken = jwt.sign(
      { id: user.id, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ token: newToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في تجديد الجلسة" });
  }
}

// تسجيل الخروج وإلغاء الكوكيز ورمز التجديد
async function logout(req, res) {
  try {
    const tokenFromCookie = req.cookies?.refreshToken;
    if (tokenFromCookie) {
      try {
        const decoded = jwt.decode(tokenFromCookie);
        if (decoded?.id) {
          await pool.query("DELETE FROM refresh_tokens WHERE user_id = ?", [decoded.id]);
        }
      } catch (e) {}
    }
    res.clearCookie("refreshToken");
    res.json({ message: "تم تسجيل الخروج بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في تسجيل الخروج" });
  }
}

// إنشاء مستخدم جديد (فقط admin)
async function register(req, res) {
  try {
    const { full_name, email, password, role, department } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: "الرجاء تعبئة كل الحقول المطلوبة" });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "هاد الإيميل مستعمل من قبل" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (full_name, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?)",
      [full_name, email, password_hash, role || "agent", department || null]
    );

    await logActivity(
      req.user.id,
      "create",
      "users",
      result.insertId,
      JSON.stringify({
        key: "log.userCreated",
        params: { name: full_name, email, role: role || "agent" }
      })
    );

    res.status(201).json({ id: result.insertId, message: "تم إنشاء المستخدم بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

// معلومات المستخدم الحالي
async function me(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT id, full_name, email, role, department, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "المستخدم غير موجود" });

    const user = rows[0];
    const spaces = await getUserSpaces(user.id);
    res.json({
      ...user,
      spaces,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

// تغيير كلمة السر للمستخدم الحالي
async function changePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: "الرجاء إدخال كلمة السر الحالية والجديدة" });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ message: "كلمة السر الجديدة يجب أن تكون 6 أحرف على الأقل" });
    }

    const [rows] = await pool.query("SELECT password_hash FROM users WHERE id = ?", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: "المستخدم غير موجود" });

    const match = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!match) {
      return res.status(400).json({ message: "كلمة السر الحالية غير صحيحة" });
    }

    const new_hash = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [new_hash, req.user.id]);

    await logActivity(
      req.user.id,
      "update",
      "users",
      req.user.id,
      JSON.stringify({ key: "log.userChangePassword" })
    );

    res.json({ message: "تم تغيير كلمة السر بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

module.exports = { login, register, me, changePassword, refreshToken, logout };
