const { sequelize } = require("../configs/database.js");
const { DataTypes } = require("sequelize");

const ItineraryDay = sequelize.define(
  "ItineraryDay",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    trip_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'trips',
        key: 'id',
      },
    },
    day_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "itinerary_days",
    timestamps: false,
  }
);

module.exports = ItineraryDay;
