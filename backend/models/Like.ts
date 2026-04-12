import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Like = sequelize.define(
        "likes",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4
            },
            postId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            userType: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'user', // user | vet
            },
        },
        {
            tableName: "likes",
            timestamps: true,
            indexes: [
                { unique: true, fields: ['postId', 'userId'] } // prevent duplicate likes
            ],
        }
    );

    (Like as any).associate = (models: any) => {
        if (models.posts) Like.belongsTo(models.posts, { foreignKey: 'postId' });
        if (models.users) Like.belongsTo(models.users, { foreignKey: 'userId' });
    };

    return Like;
};
