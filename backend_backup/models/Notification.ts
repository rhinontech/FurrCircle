import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Notification = sequelize.define(
        "notifications",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            userType: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "user", // "user" or "vet"
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "general",
                // appointment | event | adoption | vaccine_review | reminder | general
            },
            category: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "activity",
                // activity | campaign
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            message: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            isRead: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            relatedId: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            relatedType: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            actionType: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            actionPayload: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            campaignId: {
                type: DataTypes.UUID,
                allowNull: true,
            },
        },
        {
            tableName: "notifications",
            timestamps: true,
        }
    );

    return Notification;
};
