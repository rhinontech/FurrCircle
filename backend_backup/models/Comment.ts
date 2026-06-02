import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Comment = sequelize.define(
        "comments",
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
            text: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
        },
        {
            tableName: "comments",
            timestamps: true,
        }
    );

    (Comment as any).associate = (models: any) => {
        if (models.posts) Comment.belongsTo(models.posts, { foreignKey: 'postId' });
        if (models.users) Comment.belongsTo(models.users, { foreignKey: 'userId', as: 'author', constraints: false });
    };

    return Comment;
};
