const express = require("express");
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categories.controller");
const {
  getCategoryMembers,
  addCategoryMember,
  removeCategoryMember,
} = require("../controllers/members.controller");
const { verifyToken, requireRole } = require("../middleware/auth");
const { requireSpaceLeadOrAdmin, requireSpaceAccess } = require("../middleware/space.middleware");

router.use(verifyToken);

router.get("/", getCategories);
router.post("/", requireRole("admin"), createCategory);
router.put("/:id", requireRole("admin"), updateCategory);
router.delete("/:id", requireRole("admin"), deleteCategory);

// مسارات أعضاء ومسؤولي المساحة
router.get("/:id/members", requireSpaceAccess, getCategoryMembers);
router.post("/:id/members", requireSpaceLeadOrAdmin, addCategoryMember);
router.delete("/:id/members/:userId", requireSpaceLeadOrAdmin, removeCategoryMember);

module.exports = router;
