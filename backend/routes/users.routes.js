const express = require("express");
const router = express.Router();
const { getUsers, updateUser, resetPassword, deleteUser } = require("../controllers/users.controller");
const { verifyToken, requireRole } = require("../middleware/auth");

router.use(verifyToken, requireRole("admin")); // كل عمليات المستخدمين فقط لل admin

router.get("/", getUsers);
router.put("/:id", updateUser);
router.put("/:id/password", resetPassword);
router.delete("/:id", deleteUser);

module.exports = router;
