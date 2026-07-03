const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 10000,
});

const createStorage = (folderName, transformations) => {
  return new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const isVideo = file && file.mimetype && file.mimetype.startsWith('video');
      return {
        folder: `Travel_Planner_Cloud/${folderName}`,
        allowed_formats: isVideo ? ["mp4", "mov", "avi", "mkv", "webm"] : ["jpg", "png", "jpeg", "gif", "webp"],
        resource_type: isVideo ? "video" : "image",
        transformation: isVideo ? [] : transformations,
        timeout: 60000,
      };
    },
  });
};

const avatarStorage = createStorage("avatars", [
  { width: 500, height: 500, crop: "fill", gravity: "face" },
]);
const uploadAvatar = multer({ storage: avatarStorage });

const memorieStorage = createStorage("memories", [{ width: 1200, crop: "limit" }]);
const uploadMemorie = multer({ storage: memorieStorage });

const tripCoverStorage = createStorage("trip_covers", [{ width: 1200, crop: "limit" }]);
const uploadTripCover = multer({ storage: tripCoverStorage });

module.exports = {
  cloudinary,
  uploadAvatar,
  uploadMemorie,
  uploadTripCover,
};
