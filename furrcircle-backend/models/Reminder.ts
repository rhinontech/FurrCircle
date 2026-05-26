import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Reminder = sequelize.define(
        "reminders",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            petId: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            time: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            recurrence: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'none', // none | daily | weekly | monthly
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'general', // general | vaccine | medication | appointment
            },
            isDone: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            appointmentId: {
                type: DataTypes.UUID,
                allowNull: true,
            },
        },
        {
            tableName: "reminders",
            timestamps: true,
        }
    );

    (Reminder as any).associate = (models: any) => {
        if (models.users) Reminder.belongsTo(models.users, { foreignKey: 'userId', as: 'user' });
        if (models.pets) Reminder.belongsTo(models.pets, { foreignKey: 'petId', as: 'pet' });
    };

    return Reminder;
};
