const { sequelize } = require("../configs/database.js");
const { DataTypes } = require("sequelize");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    bio: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    language: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "vi",
    },
    dark_mode: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    total_trips: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    fcm_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Method to verify password
User.prototype.validPassword = async function (password) {
  const bcrypt = require("bcrypt");
  return await bcrypt.compare(password, this.password);
};

// Hook to hash password before saving
User.beforeCreate(async (user) => {
  const bcrypt = require("bcrypt");
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.beforeUpdate(async (user) => {
  const bcrypt = require("bcrypt");
  if (user.changed("password")) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

module.exports = User;