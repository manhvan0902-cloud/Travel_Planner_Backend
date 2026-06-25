const { sequelize } = require("../configs/database.js");
const { DataTypes } = require("sequelize");

const TripMember = sequelize.define(
  "TripMember",
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
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.ENUM('lead', 'member'),
      allowNull: false,
      defaultValue: 'member',
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "trip_members",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = TripMember;
