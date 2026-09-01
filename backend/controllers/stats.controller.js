const pool = require("../config/db");
const { getUserSpaces } = require("../middleware/space.middleware");

async function getDashboardStats(req, res) {
  try {
    const conditions = ["d.deleted_at IS NULL"];
    const params = [];
    const isAgent = req.user.role === "agent";
    let assignedCategoryIds = [];

    if (isAgent) {
      const userSpaces = await getUserSpaces(req.user.id);
      assignedCategoryIds = userSpaces.map((s) => s.category_id);

      if (assignedCategoryIds.length === 0) {
        return res.json({
          totals: { documents: 0, active: 0, archived: 0, users: 0, categories: 0 },
          byCategory: [],
          byYear: [],
          byMonth: [],
          recentDocs: [],
          message: "ما زال ماعندكش مساحة معينة، تواصل مع المدير",
        });
      }

      if (req.query.category_id && assignedCategoryIds.includes(parseInt(req.query.category_id))) {
        conditions.push("d.category_id = ?");
        params.push(req.query.category_id);
      } else {
        conditions.push(`d.category_id IN (${assignedCategoryIds.map(() => "?").join(",")})`);
        params.push(...assignedCategoryIds);
      }
    } else if (req.query.category_id) {
      conditions.push("d.category_id = ?");
      params.push(req.query.category_id);
    }

    const whereDoc = `WHERE ${conditions.join(" AND ")}`;
    const whereActive = `WHERE ${[...conditions, "d.status='active'"].join(" AND ")}`;
    const whereArchived = `WHERE ${[...conditions, "d.status='archived'"].join(" AND ")}`;
    const where6Month = `WHERE ${[...conditions, "d.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)"].join(" AND ")}`;

    const [[totalDocs]] = await pool.query(`SELECT COUNT(*) AS total FROM documents d ${whereDoc}`, params);
    const [[totalActive]] = await pool.query(`SELECT COUNT(*) AS total FROM documents d ${whereActive}`, params);
    const [[totalArchived]] = await pool.query(`SELECT COUNT(*) AS total FROM documents d ${whereArchived}`, params);

    // عدد المستخدمين: عام للمدير، محدود بأعضاء المساحة (فقط للمسؤول lead)، مخفي للعضو العادي
    let totalUsersCount = 0;
    let showUsersCard = true;

    if (isAgent) {
      const userSpaces = await getUserSpaces(req.user.id);
      const isLead = userSpaces.some((s) => s.role_in_space === "lead");

      if (isLead) {
        const [[agentUsersCount]] = await pool.query(
          `SELECT COUNT(DISTINCT cm.user_id) AS total
           FROM category_members cm
           JOIN users u ON u.id = cm.user_id
           WHERE u.is_active = TRUE
           AND cm.category_id IN (${assignedCategoryIds.map(() => "?").join(",")})`,
          assignedCategoryIds
        );
        totalUsersCount = agentUsersCount.total;
      } else {
        // موظف عادي (member): ماعندوش داعي يشوف هاد الإحصائية
        showUsersCard = false;
      }
    } else {
      const [[globalUsersCount]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE is_active=TRUE");
      totalUsersCount = globalUsersCount.total;
    }

    let totalCategoriesCount = 0;
    if (isAgent) {
      totalCategoriesCount = assignedCategoryIds.length;
    } else {
      const [[catCount]] = await pool.query("SELECT COUNT(*) AS total FROM categories");
      totalCategoriesCount = catCount.total;
    }

    let byCategory = [];
    if (isAgent) {
      const [rows] = await pool.query(
        `SELECT c.name AS category, COUNT(d.id) AS count
         FROM categories c
         LEFT JOIN documents d ON d.category_id = c.id AND d.deleted_at IS NULL
         WHERE c.id IN (${assignedCategoryIds.map(() => "?").join(",")})
         GROUP BY c.id ORDER BY count DESC`,
        assignedCategoryIds
      );
      byCategory = rows;
    } else {
      const [rows] = await pool.query(
        `SELECT c.name AS category, COUNT(d.id) AS count
         FROM categories c LEFT JOIN documents d ON d.category_id = c.id AND d.deleted_at IS NULL
         GROUP BY c.id ORDER BY count DESC`
      );
      byCategory = rows;
    }

    const [byYear] = await pool.query(
      `SELECT d.doc_year AS year, COUNT(*) AS count
       FROM documents d ${whereDoc} GROUP BY d.doc_year ORDER BY d.doc_year DESC LIMIT 8`,
      params
    );

    const [recentDocs] = await pool.query(
      `SELECT d.id, d.reference_code, d.title, d.created_at, c.name AS category_name, u.full_name AS uploaded_by_name
       FROM documents d
       JOIN categories c ON d.category_id = c.id
       JOIN users u ON d.uploaded_by = u.id
       ${whereDoc}
       ORDER BY d.created_at DESC LIMIT 6`,
      params
    );

    const [byMonth] = await pool.query(
      `SELECT DATE_FORMAT(d.created_at, '%Y-%m') AS month, COUNT(*) AS count
       FROM documents d
       ${where6Month}
       GROUP BY month ORDER BY month ASC`,
      params
    );

    res.json({
      totals: {
        documents: totalDocs.total,
        active: totalActive.total,
        archived: totalArchived.total,
        users: totalUsersCount,
        categories: totalCategoriesCount,
      },
      usersLabel: isAgent ? "أعضاء مساحتي" : "المستخدمون النشيطون",
      showUsersCard,
      byCategory,
      byYear,
      byMonth,
      recentDocs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

module.exports = { getDashboardStats };