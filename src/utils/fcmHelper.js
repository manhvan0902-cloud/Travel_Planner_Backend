const { messaging } = require("../configs/firebase");
const { User } = require("../models");

const sendPushNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user || !user.fcm_token) {
      console.log(`User ${userId} không có fcm_token. Bỏ qua gửi Push Notification.`);
      return false;
    }

    // 2. Cấu trúc payload
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: {
        // Data chỉ nhận string
        ...data,
      },
      token: user.fcm_token,
    };

    // 3. Gọi FCM API để gửi
    const response = await messaging.send(message);
    console.log(`Đã gửi Push Notification thành công tới user ${userId}:`, response);
    return true;

  } catch (error) {
    console.error(`Lỗi gửi Push Notification tới user ${userId}:`, error.message);
    
    // Nếu token hết hạn hoặc không hợp lệ, có thể cân nhắc xoá khỏi DB
    if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
      try {
        await User.update({ fcm_token: null }, { where: { id: userId } });
        console.log(`Đã xoá fcm_token không hợp lệ của user ${userId}`);
      } catch (dbError) {
        console.error('Lỗi khi xoá fcm_token:', dbError);
      }
    }
    
    return false;
  }
};

module.exports = {
  sendPushNotificationToUser,
};
