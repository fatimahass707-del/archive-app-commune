const pool = require("./config/db");

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS category_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        user_id INT NOT NULL,
        role_in_space ENUM('member', 'lead') NOT NULL DEFAULT 'member',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_category_user (category_id, user_id),
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log("✅ category_members table created/verified successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  }
}

migrate();
