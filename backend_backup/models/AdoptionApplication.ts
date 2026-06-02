import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const AdoptionApplication = sequelize.define(
        "adoption_applications",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
            },
            petId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            ownerId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: "The user/shelter who owns the pet being applied for",
            },
            applicantId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            applicantType: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "user",
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "adoption", // adoption | foster
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "pending", // pending | approved | rejected
            },
            message: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            applicantName: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            applicantEmail: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            applicantPhone: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            applicantCity: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            ownerNotes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            tableName: "adoption_applications",
            timestamps: true,
        }
    );

    return AdoptionApplication;
};
