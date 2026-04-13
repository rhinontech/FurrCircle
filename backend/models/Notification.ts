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
                // appointment_update | event_booking | post_moderation | chat_message | reminder | general
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
        },
        {
            tableName: "notifications",
            timestamps: true,
        }
    );

    return Notification;
};
