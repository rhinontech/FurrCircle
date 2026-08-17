import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const PlaydateLike = sequelize.define(
        "playdate_likes",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            swiperId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            swiperPetId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            targetPetId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            // 'playdate' | 'breed'
            type: {
                type: DataTypes.ENUM('playdate', 'breed'),
                allowNull: false,
                defaultValue: 'playdate',
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
            tableName: "playdate_likes",
            timestamps: true,
            indexes: [
                {
                    unique: true,
                    fields: ['swiperId', 'targetPetId', 'type'],
                },
            ],
        }
    );

    (PlaydateLike as any).associate = (models: any) => {
        if (models.users) PlaydateLike.belongsTo(models.users, { foreignKey: 'swiperId', as: 'swiper' });
        if (models.pets) {
            PlaydateLike.belongsTo(models.pets, { foreignKey: 'swiperPetId', as: 'swiperPet' });
            PlaydateLike.belongsTo(models.pets, { foreignKey: 'targetPetId', as: 'targetPet' });
        }
    };

    return PlaydateLike;
};
