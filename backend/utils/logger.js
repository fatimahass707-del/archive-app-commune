const pool = require("../config/db");

/**
 * توثيق العمليات والأنشطة في النظام (Audit Log)
 * @param {number|null} userId - معرف المستخدم الذي قام بالعملية
 * @param {'create'|'update'|'delete'|'login'} action - نوع العملية
 * @param {string|null} tableName - اسم الجدول المعني (documents, categories, users...)
 * @param {string|number|null} recordId - معرف السجل المعني
 * @param {string|null} description - وصف تفصيلي إنساني باللغة العربية
 */
async function logActivity(userId, action, tableName = null, recordId = null, description = null) {
  try {
    const validActions = ["create", "update", "delete", "login"];
    const finalAction = validActions.includes(action) ? action : "update";

    await pool.query(
      `INSERT INTO activity_logs (user_id, action, table_name, record_id, description)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId || null,
        finalAction,
        tableName || null,
        recordId ? String(recordId) : null,
        description || null,
      ]
    );
  } catch (err) {
    console.error("خطأ في تسجيل النشاط (Audit Log):", err.message);
  }
}

module.exports = { logActivity };
