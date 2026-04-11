import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Event = sequelize.define(
        "events",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4
            },
            organizerId: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            time: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            location: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            category: {
                type: DataTypes.STRING,
                allowNull: true, // e.g. Social, Health, Training
            },
            imageUrl: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            tableName: "events",
            timestamps: true,
        }
    );

    (Event as any).associate = (models: any) => {
        if (models.users) Event.belongsTo(models.users, { foreignKey: 'organizerId', as: 'organizer' });
    };

    return Event;
};
