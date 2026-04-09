import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Post = sequelize.define(
        "posts",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            category: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            imageUrl: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'pending', // pending | approved | rejected
            },
        },
        {
            tableName: "posts",
            timestamps: true,
        }
    );

    (Post as any).associate = (models: any) => {
        if (models.users) Post.belongsTo(models.users, { foreignKey: 'userId', as: 'author' });
        if (models.comments) Post.hasMany(models.comments, { foreignKey: 'postId', as: 'comments' });
        if (models.likes) Post.hasMany(models.likes, { foreignKey: 'postId', as: 'likes' });
    };

    return Post;
};
