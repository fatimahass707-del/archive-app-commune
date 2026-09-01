const pool = require("../config/db");
let ioInstance = null;

function setIoInstance(io) {
  ioInstance = io;
}

async function createNotification({ userId, type, title, message, referenceType, referenceId }) {
  try {
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, title, message, referenceType, referenceId]
    );

    const notificationData = {
      id: result.insertId,
      user_id: userId,
      type,
      title,
      message,
      reference_type: referenceType,
      reference_id: referenceId,
      is_read: 0,
      created_at: new Date()
    };

    if (ioInstance) {
      ioInstance.to(`user_${userId}`).emit("new_notification", notificationData);
      console.log(`[Socket] Emitted new_notification event to user_${userId}`);
    }

    return result.insertId;
  } catch (err) {
    console.error("❌ Error creating notification:", err);
    throw err;
  }
}

async function notifyAgentsInCategory(categoryId, options = {}) {
  try {
    const { excludeUserId, type, title, message, referenceType, referenceId } = options;
    
    // جلب جميع الموظفين (agents) المنتمين للمساحة
    const [members] = await pool.query(
      `SELECT cm.user_id 
       FROM category_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.category_id = ? AND u.role = 'agent'`,
      [categoryId]
    );
    
    console.log(`[Notification System] Found ${members.length} agents in category_id ${categoryId}`);

    let notifyCount = 0;
    for (const member of members) {
      if (excludeUserId && Number(member.user_id) === Number(excludeUserId)) {
        continue;
      }
      await createNotification({
        userId: member.user_id,
        type,
        title,
        message,
        referenceType,
        referenceId
      });
      notifyCount++;
    }
    
    console.log(`[Notification System] Sent ${notifyCount} notifications to agents in category_id ${categoryId}`);
  } catch (err) {
    console.error("❌ Error notifying agents in category:", err);
  }
}

async function notifyAdmins(options = {}) {
  try {
    const { excludeUserId, type, title, message, referenceType, referenceId } = options;

    const [admins] = await pool.query(
      `SELECT id FROM users WHERE role = 'admin'`
    );

    console.log(`[Notification System] Found ${admins.length} admins`);

    let notifyCount = 0;
    for (const admin of admins) {
      if (excludeUserId && Number(admin.id) === Number(excludeUserId)) {
        continue;
      }
      await createNotification({
        userId: admin.id,
        type,
        title,
        message,
        referenceType,
        referenceId
      });
      notifyCount++;
    }

    console.log(`[Notification System] Sent ${notifyCount} notifications to admins`);
  } catch (err) {
    console.error("❌ Error notifying admins:", err);
  }
}

module.exports = {
  createNotification,
  notifyAgentsInCategory,
  notifyAdmins,
  setIoInstance
};
