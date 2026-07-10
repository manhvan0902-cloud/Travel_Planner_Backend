const { sequelize } = require("../configs/database.js");
const { DataTypes } = require("sequelize");

const CheckList_item = sequelize.define(
    "CheckList_item",
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
        group_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "checklist_groups",
                key: "id",
            },
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        is_completed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        assigned_to: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: "users",
                key: "id",
            },
        },
        due_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        created_by_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
    },
    {
        tableName: "checklist_items",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
    }
);

module.exports = CheckList_item;