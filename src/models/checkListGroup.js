const { sequelize } = require("../configs/database.js");
const { DataTypes } = require("sequelize");

const CheckList_group = sequelize.define(
    "CheckList_group",
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
                model: "trips",
                key: "id",
            },
        },
        category: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
    },
    {
        tableName: "checklist_groups",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
    }
);

module.exports = CheckList_group;
