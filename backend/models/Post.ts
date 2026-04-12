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
            userType: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'user', // user | vet
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
            shareCount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
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
        if (models.users) Post.belongsTo(models.users, { foreignKey: 'userId', as: 'author', constraints: false });
        if (models.comments) Post.hasMany(models.comments, { foreignKey: 'postId', as: 'comments' });
        if (models.likes) Post.hasMany(models.likes, { foreignKey: 'postId', as: 'likes' });
        if (models.saved_posts) Post.hasMany(models.saved_posts, { foreignKey: 'postId', as: 'savedPosts' });
    };

    return Post;
};
