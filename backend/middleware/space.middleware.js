const pool = require("../config/db");

// جلب كل المساحات المسندة للمستخدم
async function getUserSpaces(userId) {
  const [rows] = await pool.query(
    `SELECT cm.category_id, c.name AS category_name, cm.role_in_space
     FROM category_members cm
     JOIN categories c ON cm.category_id = c.id
     WHERE cm.user_id = ?
     ORDER BY c.name ASC`,
    [userId]
  );
  return rows;
}

// يتحقق أن الموظف (agent) ينتمي إلى صنف/مساحة الوثيقة
async function requireSpaceAccess(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "الرجاء تسجيل الدخول أولاً" });
    }

    // المدير يملك جميع الصلاحيات
    if (req.user.role === "admin") {
      return next();
    }

    let categoryId = req.body?.category_id || req.query?.category_id || req.params?.categoryId;

    // إذا كانت العملية تعتمد على معرف وثيقة (req.params.id)، نجلب category_id للوثيقة من القاعدة
    if (!categoryId && req.params?.id) {
      const [docRows] = await pool.query("SELECT category_id FROM documents WHERE id = ?", [req.params.id]);
      if (docRows.length > 0) {
        categoryId = docRows[0].category_id;
      }
    }

    if (!categoryId) {
      return res.status(400).json({ message: "لم يتم تحديد صنف المساحة المطلوبة" });
    }

    const [rows] = await pool.query(
      "SELECT role_in_space FROM category_members WHERE category_id = ? AND user_id = ?",
      [categoryId, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: "ما عندكش الصلاحية للوصول لهاد المساحة" });
    }

    req.spaceRole = rows[0].role_in_space;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في تحقق صلاحية المساحة" });
  }
}

// يسمح فقط لمدير النظام أو مسؤول المساحة (Lead) بإدارة أعضاء المساحة
async function requireSpaceLeadOrAdmin(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "الرجاء تسجيل الدخول أولاً" });
    }

    if (req.user.role === "admin") {
      return next();
    }

    const categoryId = req.params?.id || req.params?.categoryId || req.body?.category_id;
    if (!categoryId) {
      return res.status(400).json({ message: "لم يتم تحديد صنف المساحة" });
    }

    const [rows] = await pool.query(
      "SELECT role_in_space FROM category_members WHERE category_id = ? AND user_id = ?",
      [categoryId, req.user.id]
    );

    if (rows.length === 0 || rows[0].role_in_space !== "lead") {
      return res.status(403).json({ message: "خاصك تكون مسؤول على هاد المساحة باش تدير هاد العملية" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

module.exports = {
  getUserSpaces,
  requireSpaceAccess,
  requireSpaceLeadOrAdmin,
};
