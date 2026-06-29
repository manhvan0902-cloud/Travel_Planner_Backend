const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || "access_secret_key", {
    expiresIn: "1h",
  });


  const refreshToken = crypto.randomBytes(40).toString("hex");

  return { accessToken, refreshToken };
};

module.exports = {
  generateTokens,
};
