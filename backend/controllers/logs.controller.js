const pool = require("../config/db");

// جلب سجلات النشاط مع الترقيم والفلترة للمدير
async function getActivityLogs(req, res) {
  try {
    const { page = 1, limit = 20, user_id, action, startDate, endDate, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];

    if (user_id) {
      conditions.push("al.user_id = ?");
      params.push(user_id);
    }

    if (action) {
      conditions.push("al.action = ?");
      params.push(action);
    }

    if (startDate) {
      conditions.push("al.created_at >= ?");
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      conditions.push("al.created_at <= ?");
      params.push(`${endDate} 23:59:59`);
    }

    if (search) {
      conditions.push("(al.description LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT al.*, u.full_name AS user_name, u.email AS user_email, u.role AS user_role
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id ${whereClause}`,
      params
    );

    res.json({
      logs: rows,
      total: countRows[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countRows[0].total / parseInt(limit)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

module.exports = { getActivityLogs };
