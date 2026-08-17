import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Memory = sequelize.define(
        "memories",
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
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            media_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            tableName: "memories",
            timestamps: true,
        }
    );

    (Memory as any).associate = (models: any) => {
        if (models.pets) {
            Memory.belongsTo(models.pets, { foreignKey: 'petId', as: 'pet' });
        }
    };

    return Memory;
};
