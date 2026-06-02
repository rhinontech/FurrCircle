import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Follow = sequelize.define(
        "follows",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            followerId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            followingId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
                allowNull: false,
                defaultValue: 'accepted',
            },
        },
        {
            tableName: "follows",
            timestamps: true,
            indexes: [
                {
                    unique: true,
                    fields: ['followerId', 'followingId'],
                },
            ],
        }
    );

    (Follow as any).associate = (models: any) => {
        if (models.users) {
            Follow.belongsTo(models.users, { foreignKey: 'followerId', as: 'follower' });
            Follow.belongsTo(models.users, { foreignKey: 'followingId', as: 'following' });
        }
    };

    return Follow;
};
