const { sequelize } = require("../configs/database.js");
const { DataTypes } = require("sequelize");

const Memorie = sequelize.define(
  "Memorie",
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
    uploaded_by_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    media_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    media_type: {
      type: DataTypes.ENUM('image', 'video'),
      allowNull: false,
    },
    caption: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    taken_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "memories",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Memorie;
