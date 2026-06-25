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
    params: async (req, file) => ({
      folder: `Travel_Planner_Cloud/${folderName}`,
      allowed_formats: ["jpg", "png", "jpeg", "gif", "webp"],
      transformation: transformations,
      timeout: 10000,
    }),
  });
};

const avatarStorage = createStorage("avatars", [
  { width: 500, height: 500, crop: "fill", gravity: "face" },
]);
const uploadAvatar = multer({ storage: avatarStorage });

const postStorage = createStorage("posts", [{ width: 1200, crop: "limit" }]);
const uploadPost = multer({ storage: postStorage });

module.exports = {
  cloudinary,
  uploadAvatar,
  uploadPost,
};
