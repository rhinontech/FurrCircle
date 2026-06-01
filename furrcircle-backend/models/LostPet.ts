import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const LostPet = sequelize.define(
        "lost_pets",
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
            imageUrl: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            address: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM("lost", "spotted"),
                allowNull: false,
                defaultValue: "lost",
            },
        },
        {
            tableName: "lost_pets",
            timestamps: true,
        }
    );

    (LostPet as any).associate = (models: any) => {
        if (models.users) {
            LostPet.belongsTo(models.users, { foreignKey: "userId", as: "author", constraints: false });
        }
    };

    return LostPet;
};
