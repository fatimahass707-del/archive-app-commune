const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/stats.controller");
const { verifyToken } = require("../middleware/auth");

router.get("/dashboard", verifyToken, getDashboardStats);

module.exports = router;
