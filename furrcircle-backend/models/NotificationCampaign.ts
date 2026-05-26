import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const NotificationCampaign = sequelize.define(
        "notification_campaigns",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            body: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            categoryLabel: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "draft",
            },
            publishMode: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "draft",
            },
            scheduledFor: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            startedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            completedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            ctaLabel: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            target: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            filters: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            createdById: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            targetedCount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            sentCount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            failedCount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            lastError: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            tableName: "notification_campaigns",
            timestamps: true,
            indexes: [
                { fields: ["status"] },
                { fields: ["scheduledFor"] },
            ],
        }
    );

    return NotificationCampaign;
};
