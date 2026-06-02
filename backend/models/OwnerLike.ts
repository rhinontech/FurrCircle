import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const OwnerLike = sequelize.define(
        "owner_likes",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            likerId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            targetId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            direction: {
                type: DataTypes.ENUM('like', 'pass'),
                allowNull: false,
            },
            matchedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            conversationId: {
                type: DataTypes.UUID,
                allowNull: true,
            },
        },
        {
            tableName: "owner_likes",
            timestamps: true,
            indexes: [
                {
                    unique: true,
                    fields: ['likerId', 'targetId'],
                },
            ],
        }
    );

    (OwnerLike as any).associate = (models: any) => {
        if (models.users) {
            OwnerLike.belongsTo(models.users, { foreignKey: 'likerId', as: 'liker' });
            OwnerLike.belongsTo(models.users, { foreignKey: 'targetId', as: 'target' });
        }
    };

    return OwnerLike;
};
