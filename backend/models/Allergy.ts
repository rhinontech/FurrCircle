import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Allergy = sequelize.define(
        "allergies",
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
            allergen: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            severity: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "moderate",
            },
            reaction: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            diagnosedAt: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
        },
        {
            tableName: "allergies",
            timestamps: true,
        }
    );

    (Allergy as any).associate = (models: any) => {
        if (models.pets) Allergy.belongsTo(models.pets, { foreignKey: "petId", as: "pet" });
    };

    return Allergy;
};
