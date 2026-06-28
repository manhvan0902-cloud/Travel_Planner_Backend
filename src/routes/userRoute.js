const express = require("express");
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  uploadAvatar, 
  updateSettings, 
  deleteAccount,
  updateFCMToken
} = require("../controllers/userController");
const authenticateToken = require("../middlewares/authMiddleware");
const { uploadAvatar: uploadAvatarMiddleware } = require("../configs/cloudinary");

router.use(authenticateToken);

router.get("/me", getProfile);
router.put("/me", updateProfile);
router.post("/me/avatar", uploadAvatarMiddleware.single("avatar"), uploadAvatar);
router.put("/me/settings", updateSettings);
router.put("/me/fcm-token", updateFCMToken);
router.delete("/me", deleteAccount);

module.exports = router;
