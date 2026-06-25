const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || "travel_planner",
  process.env.MYSQL_USER || "root",
  process.env.MYSQL_PASSWORD || "",
  {
    host: process.env.MYSQL_HOST || "localhost",
    dialect: "mysql",
    timezone: "+07:00",
    logging: false,
    port: process.env.MYSQL_PORT || 3307,
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

module.exports = { sequelize };
