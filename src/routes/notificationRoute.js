const express = require("express");
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");
const authenticateToken = require("../middlewares/authMiddleware");

router.use(authenticateToken);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/:notificationId/read", markAsRead);
router.put("/read-all", markAllAsRead);

module.exports = router;
