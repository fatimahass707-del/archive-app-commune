const pool = require("../config/db");

// 1. جلب إشعارات المستخدم الحالي مع إمكانية إضافة ترشيح حسب حالة القراءة
async function getMyNotifications(req, res) {
  try {
    console.log(`[Notifications Controller] Fetching notifications for user_id: ${req.user.id}`);
    const [rows] = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

// 2. تعليم إشعار كمقروء
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    console.log(`[Notifications Controller] Marking notification ${id} as read for user_id: ${req.user.id}`);
    
    const [result] = await pool.query(
      `UPDATE notifications SET is_read = TRUE 
       WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "الإشعار غير موجود أو لا تملك الصلاحية لتعديله" });
    }

    res.json({ message: "تم تحديث حالة الإشعار بنجاح" });
  } catch (err) {
    console.error("❌ Error marking notification as read:", err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

// 3. تعليم كل الإشعارات كمقروءة
async function markAllAsRead(req, res) {
  try {
    console.log(`[Notifications Controller] Marking all notifications as read for user_id: ${req.user.id}`);
    
    await pool.query(
      `UPDATE notifications SET is_read = TRUE 
       WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({ message: "تم تعليم جميع الإشعارات كمقروءة" });
  } catch (err) {
    console.error("❌ Error marking all notifications as read:", err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

// 4. حذف إشعار معين
async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    console.log(`[Notifications Controller] Deleting notification ${id} for user_id: ${req.user.id}`);
    
    const [result] = await pool.query(
      `DELETE FROM notifications 
       WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "الإشعار غير موجود أو لا تملك الصلاحية لحذفه" });
    }

    res.json({ message: "تم حذف الإشعار بنجاح" });
  } catch (err) {
    console.error("❌ Error deleting notification:", err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
