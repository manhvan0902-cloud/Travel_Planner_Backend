const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const path = require("path");

// Resolve the path to the serviceAccountKey.json file
const serviceAccountPath = path.resolve(__dirname, "../../serviceAccountKey.json");

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error("Lỗi khi tải file serviceAccountKey.json. Đảm bảo file tồn tại ở thư mục gốc:", error);
}

if (serviceAccount && !getApps().length) {
  try {
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log("Firebase Admin SDK đã load credential thành công.");
  } catch (error) {
    console.error("Lỗi khi load credential Firebase Admin:", error);
  }
}

const messaging = getMessaging();

const checkFCMConnection = async () => {
  try {
    // Gửi một tin nhắn thử nghiệm với cờ dryRun = true (không gửi thật)
    await messaging.send({
      token: 'dummy-token-for-testing-connection',
      notification: { title: 'Test', body: 'Test' }
    }, true);
  } catch (error) {
    if (error.code === 'messaging/invalid-argument' || error.code === 'messaging/invalid-registration-token') {
      console.log(" Xác thực thành công: Kết nối FCM tới server Google hoạt động bình thường!");
    } else {
      console.error(" Lỗi kết nối tới FCM (Có thể do serviceAccountKey sai hoặc mạng):", error.message);
    }
  }
};

// Khởi chạy test kết nối
checkFCMConnection();

module.exports = {
  messaging
};
