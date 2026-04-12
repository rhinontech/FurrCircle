import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Vaccine = sequelize.define(
        "vaccines",
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
            dateAdministered: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            nextDueDate: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: "done",
            },
            veterinarian: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            hasCertificate: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            certificateUrl: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            addedByRole: {
                type: DataTypes.STRING,
                allowNull: true, // 'vet' | 'owner'
            },
            addedByVetId: {
                type: DataTypes.UUID,
                allowNull: true,
            },
        },
        {
            tableName: "vaccines",
            timestamps: true,
        }
    );

    (Vaccine as any).associate = (models: any) => {
        if (models.pets) Vaccine.belongsTo(models.pets, { foreignKey: 'petId', as: 'pet' });
    };

    return Vaccine;
};
