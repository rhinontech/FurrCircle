import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const MedicalRecord = sequelize.define(
        "medical_records",
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
            date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            type: {
                type: DataTypes.STRING,
                allowNull: true, // e.g. checkup, surgery, emergency
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            veterinarian: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            tableName: "medical_records",
            timestamps: true,
        }
    );

    (MedicalRecord as any).associate = (models: any) => {
        if (models.pets) MedicalRecord.belongsTo(models.pets, { foreignKey: 'petId', as: 'pet' });
    };

    return MedicalRecord;
};
