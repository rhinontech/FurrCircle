import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const SavedVet = sequelize.define(
        "saved_vets",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
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
            vetId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
        },
        {
            tableName: "saved_vets",
            timestamps: true,
            indexes: [
                { unique: true, fields: ["userId", "vetId"] },
            ],
        }
    );

    return SavedVet;
};
