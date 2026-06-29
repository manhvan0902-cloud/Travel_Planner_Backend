// const { Suspense } = require("react");
const { Notification } = require("../models");
const { emitToUser } = require("../socketIO/socket.js");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;

    const notifications = await Notification.findAndCountAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      attributes: { exclude: ["metadata"] },
    });
    
    
    res.status(200).json({
      success: true,
      message: "Lấy danh sách thông báo thành công",
      data: notifications.rows,
      total: notifications.count,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(notifications.count / limit),
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Lỗi server", 
      error: error.message 
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });

    res.status(200).json({
      success: true,
      message: "Lấy số lượng thông báo chưa đọc thành công",
      unreadCount: count,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Lỗi server", 
      error: error.message 
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        user_id: userId,
      },
      attributes: { exclude: ["metadata"] },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông báo" });
    }

    notification.is_read = true;
    await notification.save();

    emitToUser(userId, "notificationsUpdated", { notificationId });

    res.status(200).json({
      success: true,
      message: "Đã đánh dấu thông báo là đã đọc",
      data: notification,
    });
  } catch (error) {
    console.log( "Lỗi khi đánh dấu thông báo là đã đọc:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Lỗi server", 
      error: error.message 
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: userId,
          is_read: false,
        },
      }
    );

    emitToUser(userId, "notificationsUpdated", { all: true });

    res.status(200).json({
      success: true,
      message: "Đã đánh dấu tất cả thông báo là đã đọc",
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Lỗi server", 
      error: error.message 
    });
  }
};
