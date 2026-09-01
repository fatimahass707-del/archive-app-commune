const express = require("express");
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notifications.controller");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

router.get("/", getMyNotifications);
router.put("/all-read", markAllAsRead);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
