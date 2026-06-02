import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Vital = sequelize.define(
        "vitals",
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
            },
            temperature: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            heartRate: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            weight: {
                type: DataTypes.FLOAT,
                allowNull: true,
            },
            bloodPressure: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            timestamp: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: "vitals",
            timestamps: true,
        }
    );

    (Vital as any).associate = (models: any) => {
        if (models.pets) Vital.belongsTo(models.pets, { foreignKey: 'petId', as: 'pet' });
    };

    return Vital;
};
