/**
 * سكريبت النسخ الاحتياطي - نظام الأرشفة الإلكترونية للجماعة
 * ==========================================================
 * كيدير: mysqldump لقاعدة البيانات + ضغط مجلد uploads
 * فأرشيف واحد مؤرخ داخل مجلد backend/backups/
 *
 * الاستعمال:
 *   1. npm install archiver --save-dev   (مرة وحدة فمجلد backend/)
 *   2. node backup.js
 *
 * للتشغيل التلقائي اليومي على Windows:
 *   Task Scheduler → Create Task → Trigger: Daily →
 *   Action: node.exe C:\path\to\backend\backup.js
 */

const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
require("dotenv").config();

const BACKUP_DIR = path.join(__dirname, "backups");
const UPLOADS_DIR = path.join(__dirname, "uploads");

const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
const sqlDumpPath = path.join(BACKUP_DIR, `db-${timestamp}.sql`);
const finalZipPath = path.join(BACKUP_DIR, `backup-${timestamp}.zip`);

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || "3306";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "archive_jamaa";

// ⚠️ تعديل مهم لـ Windows/XAMPP: المسار المباشر لـ mysqldump
const MYSQLDUMP_PATH = "C:\\xampp\\mysql\\bin\\mysqldump.exe";

// عدد أيام الاحتفاظ بالنسخ القديمة قبل حذفها تلقائياً
const RETENTION_DAYS = 14;

function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
}

function dumpDatabase() {
    return new Promise((resolve, reject) => {
        const passArg = DB_PASSWORD ? `-p${DB_PASSWORD}` : "";
        // استخدام المسار المباشر مع وضع علامات تنصيص حول المسار واسم الملف لتجنب مشاكل المسافات في Windows
        const cmd = `"${MYSQLDUMP_PATH}" -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} ${passArg} ${DB_NAME} > "${sqlDumpPath}"`;

        console.log("⏳ جاري تصدير قاعدة البيانات...");
        exec(cmd, { shell: "cmd.exe" }, (error) => {
            if (error) {
                console.error("❌ فشل تصدير قاعدة البيانات.");
                console.error("تفاصيل الخطأ:", error.message);
                return reject(error);
            }
            console.log("✅ تم تصدير قاعدة البيانات:", sqlDumpPath);
            resolve();
        });
    });
}

function zipEverything() {
    return new Promise((resolve, reject) => {
        console.log("⏳ جاري ضغط الملفات...");
        const output = fs.createWriteStream(finalZipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => {
            const sizeMb = (archive.pointer() / 1024 / 1024).toFixed(2);
            console.log(`✅ تم إنشاء النسخة الاحتياطية: ${finalZipPath} (${sizeMb} MB)`);
            resolve();
        });

        archive.on("error", reject);
        archive.pipe(output);

        // نزيدو ملف الـ SQL
        archive.file(sqlDumpPath, { name: `database.sql` });

        // نزيدو مجلد uploads كامل (إلا كان موجود وفيه حاجة)
        if (fs.existsSync(UPLOADS_DIR)) {
            archive.directory(UPLOADS_DIR, "uploads");
        }

        archive.finalize();
    });
}

function cleanupOldBackups() {
    if (!fs.existsSync(BACKUP_DIR)) return;

    const files = fs.readdirSync(BACKUP_DIR);
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let removed = 0;

    files.forEach((file) => {
        const filePath = path.join(BACKUP_DIR, file);
        const stat = fs.statSync(filePath);
        if (stat.mtimeMs < cutoff) {
            fs.unlinkSync(filePath);
            removed++;
        }
    });

    if (removed > 0) {
        console.log(`🗑️  تم حذف ${removed} نسخة احتياطية قديمة (أكثر من ${RETENTION_DAYS} يوم)`);
    }
}

async function run() {
    try {
        ensureBackupDir();
        await dumpDatabase();
        await zipEverything();
        // نحيدو ملف الـ SQL الخام، بقى غير جوة الـ zip
        if (fs.existsSync(sqlDumpPath)) {
            fs.unlinkSync(sqlDumpPath);
        }
        cleanupOldBackups();
        console.log("🎉 النسخ الاحتياطي تم بنجاح!");
    } catch (err) {
        console.error("❌ فشل النسخ الاحتياطي:", err.message);
        process.exit(1);
    }
}

run();