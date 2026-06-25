const { sequelize } = require("../configs/database.js");
const { DataTypes } = require("sequelize");

const Trip = sequelize.define(
  "Trip",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    cover_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('upcoming', 'ongoing', 'completed'),
      allowNull: false,
      defaultValue: 'upcoming',
    },
    lead_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    total_budget: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    member_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: "trips",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Trip;
