const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
require("dotenv").config();

let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  } else {
    const path = require("path");
    const serviceAccountPath = path.resolve(__dirname, "../../serviceAccountKey.json");
    serviceAccount = require(serviceAccountPath);
  }
} catch (error) {
  console.error(
    "❌ Không đọc được file cấu hình Firebase (FIREBASE_SERVICE_ACCOUNT hoặc serviceAccountKey.json):",
    error.message
  );
  process.exit(1);
}

let messaging;

try {
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK initialized.");
  }

  messaging = getMessaging();
} catch (error) {
  // In rõ lỗi gốc (sai project_id, sai private_key, JSON thiếu field...)
  console.error("❌ Firebase init failed:", error.message);
  process.exit(1);
}

// Chỉ test kết nối FCM ở môi trường dev, tránh làm chậm cold start trên production
const checkFCMConnection = async () => {
  try {
    await messaging.send(
      {
        token: "dummy-token-for-testing-connection",
        notification: {
          title: "Test",
          body: "Test",
        },
      },
      true
    );
  } catch (error) {
    if (
      error.code === "messaging/invalid-argument" ||
      error.code === "messaging/invalid-registration-token"
    ) {
      console.log("✅ Kết nối FCM tới Google thành công!");
    } else {
      console.error("❌ Lỗi kết nối FCM:", error.message);
    }
  }
};

if (process.env.NODE_ENV === "development") {
  checkFCMConnection();
}

module.exports = {
  messaging,
};