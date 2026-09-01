const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { logActivity } = require("../utils/logger");

async function getUsers(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT id, full_name, email, role, department, is_active, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

async function updateUser(req, res) {
  try {
    const { full_name, role, department, is_active } = req.body;
    await pool.query(
      "UPDATE users SET full_name=?, role=?, department=?, is_active=? WHERE id=?",
      [full_name, role, department || null, is_active === undefined ? true : is_active, req.params.id]
    );

    await logActivity(
      req.user.id,
      "update",
      "users",
      req.params.id,
      JSON.stringify({ key: "log.userUpdated", params: { name: full_name } })
    );

    res.json({ message: "تم تعديل المستخدم بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

async function resetPassword(req, res) {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ message: "كلمة السر خاصها 6 حروف على الأقل" });
    }
    const password_hash = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE users SET password_hash=? WHERE id=?", [password_hash, req.params.id]);

    await logActivity(
      req.user.id,
      "update",
      "users",
      req.params.id,
      JSON.stringify({ key: "log.userPasswordReset", params: { id: req.params.id } })
    );

    res.json({ message: "تم تغيير كلمة السر بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

async function deleteUser(req, res) {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: "ما يمكنش تحذفي الحساب ديالك بنفسك" });
    }
    const [userRows] = await pool.query("SELECT full_name FROM users WHERE id=?", [req.params.id]);
    const targetName = userRows.length > 0 ? userRows[0].full_name : req.params.id;

    await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);

    await logActivity(
      req.user.id,
      "delete",
      "users",
      req.params.id,
      JSON.stringify({ key: "log.userDeleted", params: { name: targetName } })
    );

    res.json({ message: "تم حذف المستخدم بنجاح" });
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2" || err.code === "ER_ROW_IS_REFERENCED") {
      return res.status(400).json({
        message: "لا يمكن حذف هذا المستخدم لأنه قام برفع وثائق في النظام. يمكنك تعطيل حسابه بدلاً من الحذف.",
      });
    }
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

module.exports = { getUsers, updateUser, resetPassword, deleteUser };
