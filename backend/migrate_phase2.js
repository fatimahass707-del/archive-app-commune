const pool = require("./config/db");

async function migratePhase2() {
  try {
    // 1. Add FULLTEXT INDEX to documents table
    try {
      await pool.query("ALTER TABLE documents ADD FULLTEXT INDEX ft_title_desc (title, description)");
      console.log("✅ Added FULLTEXT index ft_title_desc to documents table.");
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log("✅ FULLTEXT index ft_title_desc already exists.");
      } else {
        throw e;
      }
    }

    // 2. Create document_versions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_versions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id INT NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_original_name VARCHAR(255) NOT NULL,
        uploaded_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
      )
    `);
    console.log("✅ Created document_versions table.");

    console.log("✅ Phase 2 Database Migration Complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  }
}

migratePhase2();
