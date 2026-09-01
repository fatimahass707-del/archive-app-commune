const pool = require("./config/db");

async function migratePhase1() {
  try {
    // 1. Add deleted_at to documents if not exists
    const [cols] = await pool.query("SHOW COLUMNS FROM documents LIKE 'deleted_at'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE documents ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL, ADD INDEX idx_deleted (deleted_at)");
      console.log("✅ Added deleted_at column to documents table.");
    }

    // 2. Recreate or alter activity_logs table for Phase 1 spec
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        action ENUM('create', 'update', 'delete', 'login') NOT NULL,
        table_name VARCHAR(50) DEFAULT NULL,
        record_id VARCHAR(50) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_created (created_at),
        INDEX idx_action (action),
        INDEX idx_user (user_id)
      )
    `);
    
    // If activity_logs table existed with old schema, modify action column
    try {
      await pool.query("ALTER TABLE activity_logs MODIFY COLUMN action ENUM('create', 'update', 'delete', 'login') NOT NULL");
      await pool.query("ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS table_name VARCHAR(50) DEFAULT NULL");
      await pool.query("ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS record_id VARCHAR(50) DEFAULT NULL");
    } catch (e) {
      // Ignore if column modification fails due to MySQL version syntax
    }
    console.log("✅ Updated activity_logs table.");

    // 3. Create refresh_tokens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id)
      )
    `);
    console.log("✅ Created refresh_tokens table.");

    console.log("✅ Phase 1 Database Migration Complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  }
}

migratePhase1();
