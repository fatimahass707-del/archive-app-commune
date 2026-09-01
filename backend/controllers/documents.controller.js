const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { logActivity } = require("../utils/logger");
const { getUserSpaces } = require("../middleware/space.middleware");
const QRCode = require("qrcode");
const { notifyAgentsInCategory, notifyAdmins } = require("../utils/notifications");


// توليد رقم مرجعي فريد تلقائي: مثال DOC-2026-000123
async function generateReferenceCode() {
  const year = new Date().getFullYear();
  const [rows] = await pool.query(
    "SELECT reference_code FROM documents WHERE doc_year = ? AND reference_code LIKE ? ORDER BY id DESC LIMIT 1",
    [year, `DOC-${year}-%`]
  );
  let nextSeq = 1;
  if (rows.length > 0) {
    const parts = rows[0].reference_code.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }
  const nextNumber = nextSeq.toString().padStart(6, "0");
  return `DOC-${year}-${nextNumber}`;
}

// جلب الوثائق النشيطة فقط (غير المحذوفات) مع بحث وفلترة وترقيم صفحات مقيدة بالمساحة
async function getDocuments(req, res) {
  try {
    const { search, category_id, year, status, department, page = 1, limit = 20 } = req.query;
    const conditions = ["d.deleted_at IS NULL"];
    const params = [];

    // تقييد الوصول للموظفين بحسب المساحات المسندة
    if (req.user.role === "agent") {
      const userSpaces = await getUserSpaces(req.user.id);
      const assignedIds = userSpaces.map((s) => s.category_id);

      if (assignedIds.length === 0) {
        return res.json({
          documents: [],
          total: 0,
          page: parseInt(page),
          totalPages: 0,
          message: "ما زال ماعندكش مساحة معينة، تواصل مع المدير",
        });
      }

      if (category_id) {
        if (!assignedIds.includes(parseInt(category_id))) {
          return res.json({
            documents: [],
            total: 0,
            page: parseInt(page),
            totalPages: 0,
            message: "هاد المساحة غير مسندة لك",
          });
        }
        conditions.push("d.category_id = ?");
        params.push(category_id);
      } else {
        conditions.push(`d.category_id IN (${assignedIds.map(() => "?").join(",")})`);
        params.push(...assignedIds);
      }
    } else if (category_id) {
      conditions.push("d.category_id = ?");
      params.push(category_id);
    }

    if (search) {
      const trimmedSearch = search.trim();
      if (trimmedSearch.length >= 3) {
        const searchWords = trimmedSearch.split(/\s+/).map(word => `+${word}*`).join(' ');
        conditions.push("(MATCH(d.title, d.description) AGAINST(? IN BOOLEAN MODE) OR d.reference_code LIKE ?)");
        params.push(searchWords, `%${trimmedSearch}%`);
      } else {
        conditions.push("(d.title LIKE ? OR d.reference_code LIKE ? OR d.description LIKE ?)");
        params.push(`%${trimmedSearch}%`, `%${trimmedSearch}%`, `%${trimmedSearch}%`);
      }
    }
    if (year) {
      conditions.push("d.doc_year = ?");
      params.push(year);
    }
    if (status) {
      conditions.push("d.status = ?");
      params.push(status);
    }
    if (department) {
      conditions.push("d.department LIKE ?");
      params.push(`%${department}%`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [rows] = await pool.query(
      `SELECT d.*, c.name AS category_name, u.full_name AS uploaded_by_name
       FROM documents d
       JOIN categories c ON d.category_id = c.id
       JOIN users u ON d.uploaded_by = u.id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM documents d ${whereClause}`,
      params
    );

    res.json({
      documents: rows,
      total: countRows[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countRows[0].total / parseInt(limit)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

// جلب وثيقة واحدة غير محذوفة
async function getDocumentById(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, c.name AS category_name, u.full_name AS uploaded_by_name
       FROM documents d
       JOIN categories c ON d.category_id = c.id
       JOIN users u ON d.uploaded_by = u.id
       WHERE d.id = ? AND d.deleted_at IS NULL`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "الوثيقة غير موجودة" });

    const doc = rows[0];

    if (req.user.role === "agent") {
      const userSpaces = await getUserSpaces(req.user.id);
      const assignedIds = userSpaces.map((s) => s.category_id);
      if (!assignedIds.includes(doc.category_id)) {
        return res.status(403).json({ message: "ما عندكش الصلاحية للوصول لهاد الوثيقة" });
      }
    }

    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

// تحميل ملف الوثيقة باسمه الأصلي
async function downloadDocument(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL", [req.params.id]);
    if (rows.length === 0 || !rows[0].file_path) {
      return res.status(404).json({ message: "الملف غير موجود" });
    }
    const doc = rows[0];

    if (req.user.role === "agent") {
      const userSpaces = await getUserSpaces(req.user.id);
      const assignedIds = userSpaces.map((s) => s.category_id);
      if (!assignedIds.includes(doc.category_id)) {
        return res.status(403).json({ message: "ما عندكش الصلاحية لـ تحميل ملف هاد الوثيقة" });
      }
    }

    const absolutePath = path.join(__dirname, "..", doc.file_path);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "الملف غير موجود على السيرفر" });
    }
    const filename = doc.file_original_name || path.basename(absolutePath);
    res.download(absolutePath, filename);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في تحميل الملف" });
  }
}

// إضافة وثيقة جديدة
async function createDocument(req, res) {
  try {
    const { title, category_id, department, doc_year, description } = req.body;
    if (!title || !category_id || !doc_year) {
      return res.status(400).json({ message: "الرجاء تعبئة العنوان والصنف والسنة" });
    }

    if (req.user.role === "agent") {
      const userSpaces = await getUserSpaces(req.user.id);
      const assignedIds = userSpaces.map((s) => s.category_id);
      if (!assignedIds.includes(parseInt(category_id))) {
        return res.status(403).json({ message: "ما عندكش الصلاحية لإضافة وثيقة في هاد المساحة" });
      }
    }

    const reference_code = await generateReferenceCode();
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;
    const file_original_name = req.file ? req.file.originalname : null;

    const [result] = await pool.query(
      `INSERT INTO documents
        (reference_code, title, category_id, department, doc_year, description, file_path, file_original_name, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [reference_code, title, category_id, department || null, doc_year, description || null, file_path, file_original_name, req.user.id]
    );

    await logActivity(
      req.user.id,
      "create",
      "documents",
      result.insertId,
      JSON.stringify({ key: "log.documentCreated", params: { code: reference_code, title } })
    );

    // إرسال الإشعارات
    console.log(`[Document Controller] Triggering notifications for new document: ${title}`);
    const notificationOptions = {
      excludeUserId: req.user.id,
      type: "document_create",
      title: "وثيقة جديدة مضافة",
      message: `تمت إضافة وثيقة جديدة بعنوان "${title}" بالرقم المرجعي: ${reference_code}`,
      referenceType: "documents",
      referenceId: result.insertId,
    };

    await notifyAgentsInCategory(category_id, notificationOptions);
    await notifyAdmins(notificationOptions);

    res.status(201).json({ id: result.insertId, reference_code, message: "تمت إضافة الوثيقة بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

// تعديل وثيقة
async function updateDocument(req, res) {
  try {
    const { title, category_id, department, doc_year, description, status } = req.body;
    const [existing] = await pool.query("SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL", [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: "الوثيقة غير موجودة" });

    if (req.user.role === "agent") {
      const userSpaces = await getUserSpaces(req.user.id);
      const assignedIds = userSpaces.map((s) => s.category_id);
      if (!assignedIds.includes(existing[0].category_id)) {
        return res.status(403).json({ message: "ما عندكش الصلاحية لتعديل الوثائق في هاد المساحة" });
      }
      if (category_id && !assignedIds.includes(parseInt(category_id))) {
        return res.status(403).json({ message: "ما عندكش الصلاحية لنقل الوثيقة لمساحة غير مسندة لك" });
      }
    }

    let file_path = existing[0].file_path;
    let file_original_name = existing[0].file_original_name;

    if (req.file) {
      if (file_path) {
        // بدلاً من مسح الملف القديم، نخزنه في جدول النسخ السابقة
        await pool.query(
          "INSERT INTO document_versions (document_id, file_path, file_original_name, uploaded_by) VALUES (?, ?, ?, ?)",
          [req.params.id, file_path, file_original_name, existing[0].uploaded_by]
        );
      }
      file_path = `/uploads/${req.file.filename}`;
      file_original_name = req.file.originalname;
    }

    const newTitle = title || existing[0].title;
    const newCategory = category_id || existing[0].category_id;
    const newDocYear = doc_year || existing[0].doc_year;

    await pool.query(
      `UPDATE documents SET title=?, category_id=?, department=?, doc_year=?, description=?, status=?, file_path=?, file_original_name=?
       WHERE id=?`,
      [
        newTitle,
        newCategory,
        department !== undefined ? department : existing[0].department,
        newDocYear,
        description !== undefined ? description : existing[0].description,
        status || existing[0].status,
        file_path,
        file_original_name,
        req.params.id,
      ]
    );

    await logActivity(
      req.user.id,
      "update",
      "documents",
      req.params.id,
      JSON.stringify({ key: "log.documentUpdated", params: { code: existing[0].reference_code, title: newTitle } })
    );

    // إرسال الإشعارات
    console.log(`[Document Controller] Triggering notifications for updated document: ${newTitle}`);
    const notificationOptions = {
      excludeUserId: req.user.id,
      type: "document_update",
      title: "تحديث وثيقة",
      message: `تم تحديث الوثيقة: "${newTitle}" (الرقم المرجعي: ${existing[0].reference_code})`,
      referenceType: "documents",
      referenceId: req.params.id,
    };

    await notifyAgentsInCategory(newCategory, notificationOptions);
    await notifyAdmins(notificationOptions);

    res.json({ message: "تم تعديل الوثيقة بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

// حذف مؤقت لوثيقة (Soft Delete)
async function deleteDocument(req, res) {
  try {
    const [existing] = await pool.query("SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL", [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: "الوثيقة غير موجودة أو محذوفة سابقاً" });

    if (req.user.role === "agent") {
      const userSpaces = await getUserSpaces(req.user.id);
      const assignedIds = userSpaces.map((s) => s.category_id);
      if (!assignedIds.includes(existing[0].category_id)) {
        return res.status(403).json({ message: "ما عندكش الصلاحية لحذف وثيقة في هاد المساحة" });
      }
    }

    await pool.query("UPDATE documents SET deleted_at = NOW() WHERE id = ?", [req.params.id]);

    await logActivity(
      req.user.id,
      "delete",
      "documents",
      req.params.id,
      JSON.stringify({ key: "log.documentTrashed", params: { code: existing[0].reference_code, title: existing[0].title } })
    );

    // إرسال الإشعارات
    console.log(`[Document Controller] Triggering notifications for deleted document: ${existing[0].title}`);
    const notificationOptions = {
      excludeUserId: req.user.id,
      type: "document_delete",
      title: "حذف وثيقة",
      message: `تم نقل الوثيقة: "${existing[0].title}" (الرقم المرجعي: ${existing[0].reference_code}) إلى سلة المحذوفات`,
      referenceType: "documents",
      referenceId: req.params.id,
    };

    await notifyAgentsInCategory(existing[0].category_id, notificationOptions);
    await notifyAdmins(notificationOptions);

    res.json({ message: "تم نقل الوثيقة لسلة المحذوفات بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

// جلب الوثائق المحذوفة مؤقتاً (سلة المحذوفات - للمدير)
async function getTrashDocuments(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [rows] = await pool.query(
      `SELECT d.*, c.name AS category_name, u.full_name AS uploaded_by_name
       FROM documents d
       JOIN categories c ON d.category_id = c.id
       JOIN users u ON d.uploaded_by = u.id
       WHERE d.deleted_at IS NOT NULL
       ORDER BY d.deleted_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    const [countRows] = await pool.query(
      "SELECT COUNT(*) AS total FROM documents WHERE deleted_at IS NOT NULL"
    );

    res.json({
      documents: rows,
      total: countRows[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countRows[0].total / parseInt(limit)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

// استرجاع وثيقة محذوفة مؤقتاً (Restore)
async function restoreDocument(req, res) {
  try {
    const [existing] = await pool.query("SELECT * FROM documents WHERE id = ? AND deleted_at IS NOT NULL", [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: "الوثيقة غير موجودة في سلة المحذوفات" });

    await pool.query("UPDATE documents SET deleted_at = NULL WHERE id = ?", [req.params.id]);

    await logActivity(
      req.user.id,
      "update",
      "documents",
      req.params.id,
      JSON.stringify({ key: "log.documentRestored", params: { code: existing[0].reference_code, title: existing[0].title } })
    );

    res.json({ message: "تمت استعادة الوثيقة بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

// حذف وثيقة نهائياً (Permanent Delete)
async function permanentDeleteDocument(req, res) {
  try {
    const [existing] = await pool.query("SELECT * FROM documents WHERE id = ? AND deleted_at IS NOT NULL", [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: "الوثيقة غير موجودة في سلة المحذوفات" });

    if (existing[0].file_path) {
      const filePath = path.join(__dirname, "..", existing[0].file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.query("DELETE FROM documents WHERE id = ?", [req.params.id]);

    await logActivity(
      req.user.id,
      "delete",
      "documents",
      req.params.id,
      JSON.stringify({ key: "log.documentPermanentlyDeleted", params: { code: existing[0].reference_code, title: existing[0].title } })
    );

    res.json({ message: "تم حذف الوثيقة نهائياً بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر أثناء الحذف النهائي", error: err.message });
  }
}

// جلب النسخ السابقة للوثيقة
async function getDocumentVersions(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT v.*, u.full_name AS uploaded_by_name 
       FROM document_versions v
       JOIN users u ON v.uploaded_by = u.id
       WHERE v.document_id = ?
       ORDER BY v.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

// تحميل ملف نسخة سابقة
async function downloadDocumentVersion(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM document_versions WHERE id = ? AND document_id = ?", [req.params.versionId, req.params.id]);
    if (rows.length === 0 || !rows[0].file_path) {
      return res.status(404).json({ message: "النسخة السابقة غير موجودة" });
    }
    const version = rows[0];

    const absolutePath = path.join(__dirname, "..", version.file_path);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "الملف غير موجود على السيرفر" });
    }
    const filename = version.file_original_name || path.basename(absolutePath);
    res.download(absolutePath, filename);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في تحميل الملف" });
  }
}

const ExcelJS = require("exceljs");

// تصدير الوثائق إلى Excel
async function exportDocumentsExcel(req, res) {
  try {
    const { search, category_id, year, status, department } = req.query;
    const conditions = ["d.deleted_at IS NULL"];
    const params = [];

    if (req.user.role === "agent") {
      const userSpaces = await getUserSpaces(req.user.id);
      const assignedIds = userSpaces.map((s) => s.category_id);

      if (assignedIds.length === 0) {
        return res.status(403).json({ message: "لا تملك صلاحيات" });
      }

      if (category_id) {
        if (!assignedIds.includes(parseInt(category_id))) {
          return res.status(403).json({ message: "هاد المساحة غير مسندة لك" });
        }
        conditions.push("d.category_id = ?");
        params.push(category_id);
      } else {
        conditions.push(`d.category_id IN (${assignedIds.map(() => "?").join(",")})`);
        params.push(...assignedIds);
      }
    } else if (category_id) {
      conditions.push("d.category_id = ?");
      params.push(category_id);
    }

    if (search) {
      const trimmedSearch = search.trim();
      if (trimmedSearch.length >= 3) {
        const searchWords = trimmedSearch.split(/\s+/).map(word => `+${word}*`).join(' ');
        conditions.push("(MATCH(d.title, d.description) AGAINST(? IN BOOLEAN MODE) OR d.reference_code LIKE ?)");
        params.push(searchWords, `%${trimmedSearch}%`);
      } else {
        conditions.push("(d.title LIKE ? OR d.reference_code LIKE ? OR d.description LIKE ?)");
        params.push(`%${trimmedSearch}%`, `%${trimmedSearch}%`, `%${trimmedSearch}%`);
      }
    }
    if (year) {
      conditions.push("d.doc_year = ?");
      params.push(year);
    }
    if (status) {
      conditions.push("d.status = ?");
      params.push(status);
    }
    if (department) {
      conditions.push("d.department LIKE ?");
      params.push(`%${department}%`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await pool.query(
      `SELECT d.*, c.name AS category_name, u.full_name AS uploaded_by_name
       FROM documents d
       JOIN categories c ON d.category_id = c.id
       JOIN users u ON d.uploaded_by = u.id
       ${whereClause}
       ORDER BY d.created_at DESC`,
      params
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("الوثائق");

    worksheet.columns = [
      { header: "الرقم المرجعي", key: "reference_code", width: 20 },
      { header: "العنوان", key: "title", width: 40 },
      { header: "الصنف", key: "category_name", width: 30 },
      { header: "السنة", key: "doc_year", width: 10 },
      { header: "المصلحة", key: "department", width: 30 },
      { header: "الحالة", key: "status", width: 15 },
      { header: "أضيفت من طرف", key: "uploaded_by_name", width: 25 },
      { header: "التاريخ", key: "created_at", width: 20 },
    ];

    rows.forEach(doc => {
      worksheet.addRow({
        reference_code: doc.reference_code,
        title: doc.title,
        category_name: doc.category_name,
        doc_year: doc.doc_year,
        department: doc.department || "—",
        status: doc.status === "active" ? "نشيطة" : "مؤرشفة",
        uploaded_by_name: doc.uploaded_by_name,
        created_at: new Date(doc.created_at).toLocaleString("fr-FR"),
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=documents.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ أثناء تصدير الملف" });
  }
}

async function getDocumentQrCode(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, c.name AS category_name
       FROM documents d
       JOIN categories c ON d.category_id = c.id
       WHERE d.id = ? AND d.deleted_at IS NULL`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "الوثيقة غير موجودة" });
    }
    const doc = rows[0];

    if (req.user.role === "agent") {
      const userSpaces = await getUserSpaces(req.user.id);
      const assignedIds = userSpaces.map((s) => s.category_id);
      if (!assignedIds.includes(doc.category_id)) {
        return res.status(403).json({ message: "ما عندكش الصلاحية للوصول لهاد الوثيقة" });
      }
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const documentUrl = `${frontendUrl}/documents/${doc.id}`;

    const qrCodeBuffer = await QRCode.toBuffer(documentUrl, { type: "png" });

    res.type("png");
    res.send(qrCodeBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
}

module.exports = {
  getDocuments,
  getDocumentById,
  downloadDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  getTrashDocuments,
  restoreDocument,
  permanentDeleteDocument,
  getDocumentVersions,
  downloadDocumentVersion,
  exportDocumentsExcel,
  getDocumentQrCode,
};
