const pool = require("../config/db");
const { logActivity } = require("../utils/logger");

// جلب أعضاء مساحة معينة
async function getCategoryMembers(req, res) {
  try {
    const categoryId = req.params.id;
    const [rows] = await pool.query(
      `SELECT cm.id, cm.category_id, cm.user_id, cm.role_in_space, cm.assigned_at,
              u.full_name, u.email, u.department, u.role
       FROM category_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.category_id = ?
       ORDER BY cm.role_in_space DESC, u.full_name ASC`,
      [categoryId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

// إضافة أو تحديث دور موظف داخل مساحة
async function addCategoryMember(req, res) {
  try {
    const categoryId = req.params.id;
    const { user_id, role_in_space = "member" } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "الرجاء اختيار الموظف" });
    }

    const [userRows] = await pool.query("SELECT full_name, email FROM users WHERE id = ?", [user_id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: "الموظف غير موجود" });
    }

    const [catRows] = await pool.query("SELECT name FROM categories WHERE id = ?", [categoryId]);
    if (catRows.length === 0) {
      return res.status(404).json({ message: "الصنف غير موجود" });
    }

    await pool.query(
      `INSERT INTO category_members (category_id, user_id, role_in_space)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE role_in_space = VALUES(role_in_space)`,
      [categoryId, user_id, role_in_space]
    );

    await logActivity(
      req.user.id,
      "update",
      "categories",
      categoryId,
      JSON.stringify({
        key: "log.memberAssigned",
        params: {
          employee: userRows[0].full_name,
          space: catRows[0].name,
          role: role_in_space === "lead" ? "spaceManager" : "member"
        }
      })
    );

    res.status(201).json({ message: "تمت إضافة الموظف للمساحة بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

// إزالة موظف من مساحة
async function removeCategoryMember(req, res) {
  try {
    const categoryId = req.params.id;
    const userId = req.params.userId;

    const [userRows] = await pool.query("SELECT full_name FROM users WHERE id = ?", [userId]);
    const [catRows] = await pool.query("SELECT name FROM categories WHERE id = ?", [categoryId]);

    await pool.query("DELETE FROM category_members WHERE category_id = ? AND user_id = ?", [
      categoryId,
      userId,
    ]);

    const userName = userRows.length > 0 ? userRows[0].full_name : userId;
    const catName = catRows.length > 0 ? catRows[0].name : categoryId;

    await logActivity(
      req.user.id,
      "update",
      "categories",
      categoryId,
      JSON.stringify({
        key: "log.memberRemoved",
        params: {
          employee: userName,
          space: catName
        }
      })
    );

    res.json({ message: "تمت إزالة الموظف من المساحة بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

// جلب جميع أعضاء المساحات لتجنب استدعاءات API المتكررة
async function getAllCategoryMembers(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT cm.id, cm.category_id, cm.user_id, cm.role_in_space, cm.assigned_at,
              u.full_name, u.email, u.department, u.role
       FROM category_members cm
       JOIN users u ON cm.user_id = u.id
       ORDER BY cm.category_id ASC, cm.role_in_space DESC, u.full_name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

module.exports = {
  getAllCategoryMembers,
  getCategoryMembers,
  addCategoryMember,
  removeCategoryMember,
};
