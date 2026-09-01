const pool = require("../config/db");
const { logActivity } = require("../utils/logger");

async function getCategories(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(d.id) AS documents_count
       FROM categories c
       LEFT JOIN documents d ON d.category_id = c.id AND d.deleted_at IS NULL
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

async function createCategory(req, res) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "الرجاء إدخال اسم الصنف" });

    const [result] = await pool.query(
      "INSERT INTO categories (name, description) VALUES (?, ?)",
      [name, description || null]
    );

    await logActivity(
      req.user.id,
      "create",
      "categories",
      result.insertId,
      JSON.stringify({ key: "log.categoryCreated", params: { name } })
    );

    res.status(201).json({ id: result.insertId, message: "تمت إضافة الصنف بنجاح" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "هاد الصنف موجود من قبل" });
    }
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

async function updateCategory(req, res) {
  try {
    const { name, description } = req.body;
    await pool.query("UPDATE categories SET name=?, description=? WHERE id=?", [
      name,
      description || null,
      req.params.id,
    ]);

    await logActivity(
      req.user.id,
      "update",
      "categories",
      req.params.id,
      JSON.stringify({ key: "log.categoryUpdated", params: { name } })
    );

    res.json({ message: "تم تعديل الصنف بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

async function deleteCategory(req, res) {
  try {
    const [docs] = await pool.query("SELECT COUNT(*) AS count FROM documents WHERE category_id = ? AND deleted_at IS NULL", [
      req.params.id,
    ]);
    if (docs[0].count > 0) {
      return res.status(400).json({
        message: "ما يمكنش تحذفي هاد الصنف، كاينين وثائق مرتبطة بيه",
      });
    }

    const [catRows] = await pool.query("SELECT name FROM categories WHERE id = ?", [req.params.id]);
    const catName = catRows.length > 0 ? catRows[0].name : req.params.id;

    await pool.query("DELETE FROM categories WHERE id = ?", [req.params.id]);

    await logActivity(
      req.user.id,
      "delete",
      "categories",
      req.params.id,
      JSON.stringify({ key: "log.categoryDeleted", params: { name: catName } })
    );

    res.json({ message: "تم حذف الصنف بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
