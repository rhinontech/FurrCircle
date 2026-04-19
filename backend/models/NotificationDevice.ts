import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const NotificationDevice = sequelize.define(
        "notification_devices",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
            },
            actorId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            actorType: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            installationId: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            platform: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            expoPushToken: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            pushEnabled: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            lastSeenAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            tableName: "notification_devices",
            timestamps: true,
            indexes: [
                { fields: ["actorId", "actorType"] },
                { unique: true, fields: ["installationId"] },
            ],
        }
    );

    return NotificationDevice;
};
