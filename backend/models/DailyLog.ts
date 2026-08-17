import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const DailyLog = sequelize.define(
        "daily_logs",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4
            },
            petId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'pet_id',
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            appetite: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            waterIntake: {
                type: DataTypes.STRING,
                allowNull: false,
                field: 'water_intake',
            },
            mood: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            tableName: "daily_logs",
            timestamps: true,
        }
    );

    (DailyLog as any).associate = (models: any) => {
        if (models.pets) DailyLog.belongsTo(models.pets, { foreignKey: 'petId', as: 'pet' });
    };

    return DailyLog;
};
