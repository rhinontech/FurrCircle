import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const NotificationPreference = sequelize.define(
        "notification_preferences",
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
            marketingEnabled: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        },
        {
            tableName: "notification_preferences",
            timestamps: true,
            indexes: [
                { unique: true, fields: ["actorId", "actorType"] },
            ],
        }
    );

    return NotificationPreference;
};
