import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Medication = sequelize.define(
        "medications",
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
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            dosage: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            frequency: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            startDate: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            endDate: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            prescribedBy: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            imageUrl: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            tableName: "medications",
            timestamps: true,
        }
    );

    (Medication as any).associate = (models: any) => {
        if (models.pets) Medication.belongsTo(models.pets, { foreignKey: 'petId', as: 'pet' });
    };

    return Medication;
};
