const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE ,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST ,
    dialect: "mysql",
    timezone: "+07:00",
    logging: false,
    port: process.env.MYSQL_PORT,
    dialectOptions: {
      dateStrings: true,
      typeCast: function (field, next) {
        if (
          field.type === "DATETIME" ||
          field.type === "DATE" ||
          field.type === "TIME"
        ) {
          return field.string();
        }
        return next();
      },
    },
  },
);

// Kiểm tra kết nối khi khởi động
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Connected to Railway MySQL successfully!");
  })
  .catch((err) => {
    console.error("Unable to connect to Railway MySQL:");
    console.error(err);
  });

module.exports = { sequelize };
