const express = require("express");
const router = express.Router();
const { getActivityLogs } = require("../controllers/logs.controller");
const { verifyToken, requireRole } = require("../middleware/auth");

router.use(verifyToken);
router.use(requireRole("admin"));

router.get("/", getActivityLogs);

module.exports = router;
