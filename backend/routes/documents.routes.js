const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/documents.controller");
const { verifyToken, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const validate = require("../middleware/validate");
const { createDocumentSchema, updateDocumentSchema } = require("../schemas/document.schema");

router.use(verifyToken); // كل عمليات الوثائق خاصها تسجيل دخول

router.get("/", getDocuments);
router.get("/export", exportDocumentsExcel);
router.get("/trash", requireRole("admin"), getTrashDocuments);
router.get("/:id/qrcode", getDocumentQrCode);
router.get("/:id", getDocumentById);
router.get("/:id/versions", getDocumentVersions);
router.get("/:id/versions/:versionId/download", downloadDocumentVersion);
router.get("/:id/download", downloadDocument);
router.post("/", upload.single("file"), validate(createDocumentSchema), createDocument);
router.put("/:id", upload.single("file"), validate(updateDocumentSchema), updateDocument);
router.post("/:id/restore", requireRole("admin"), restoreDocument);
router.delete("/:id/permanent", requireRole("admin"), permanentDeleteDocument);
router.delete("/:id", deleteDocument);

module.exports = router;
