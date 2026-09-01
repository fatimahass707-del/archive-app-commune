const pool = require("./config/db");

async function migrate() {
  try {
    // Check if columns already exist
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'name_en'`
    );

    if (cols.length === 0) {
      await pool.query(`
        ALTER TABLE categories 
        ADD COLUMN name_en VARCHAR(120) NULL AFTER name,
        ADD COLUMN name_fr VARCHAR(120) NULL AFTER name_en,
        ADD COLUMN description_en VARCHAR(255) NULL AFTER description,
        ADD COLUMN description_fr VARCHAR(255) NULL AFTER description_en
      `);
      console.log("✅ Added translation columns to categories table.");
    } else {
      console.log("ℹ️ Translation columns already exist on categories table.");
    }

    // Populate translations for default categories
    const updates = [
      {
        name: "الحالة المدنية",
        name_en: "Civil Status",
        name_fr: "État Civil",
        description_en: "Birth, marriage, and death certificates",
        description_fr: "Actes de naissance, de mariage et de décès"
      },
      {
        name: "رخص البناء والتعمير",
        name_en: "Building & Urban Planning Permits",
        name_fr: "Permis de Construire et Urbanisme",
        description_en: "Building permit applications",
        description_fr: "Demandes de permis de construire"
      },
      {
        name: "الصفقات العمومية",
        name_en: "Public Procurement",
        name_fr: "Marchés Publics",
        description_en: "Tender specifications and contracts",
        description_fr: "Cahiers des charges et marchés"
      },
      {
        name: "المراسلات الإدارية",
        name_en: "Administrative Correspondence",
        name_fr: "Correspondance Administrative",
        description_en: "Incoming and outgoing correspondence",
        description_fr: "Courrier entrant et sortant"
      },
      {
        name: "الميزانية والمحاسبة",
        name_en: "Budget and Accounting",
        name_fr: "Budget et Comptabilité",
        description_en: "Financial and accounting documents",
        description_fr: "Documents financiers et comptables"
      },
      {
        name: "الموارد البشرية",
        name_en: "Human Resources",
        name_fr: "Ressources Humaines",
        description_en: "Employee files and decisions",
        description_fr: "Dossiers du personnel et décisions"
      }
    ];

    for (const update of updates) {
      await pool.query(
        `UPDATE categories 
         SET name_en = ?, name_fr = ?, description_en = ?, description_fr = ?
         WHERE name = ?`,
        [update.name_en, update.name_fr, update.description_en, update.description_fr, update.name]
      );
    }
    console.log("✅ Populated translations for default categories.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err);
    process.exit(1);
  }
}

migrate();
