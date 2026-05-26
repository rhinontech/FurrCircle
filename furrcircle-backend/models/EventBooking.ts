import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const EventBooking = sequelize.define(
        "event_bookings",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4
            },
            eventId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            userType: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "user",
            },
            note: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "booked",
            },
        },
        {
            tableName: "event_bookings",
            timestamps: true,
            indexes: [
                { unique: true, fields: ["eventId", "userId", "userType"] }
            ],
        }
    );

    (EventBooking as any).associate = (models: any) => {
        if (models.events) EventBooking.belongsTo(models.events, { foreignKey: "eventId", as: "event" });
    };

    return EventBooking;
};
