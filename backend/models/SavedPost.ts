import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const SavedPost = sequelize.define(
        "saved_posts",
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
                defaultValue: "user",
            },
        },
        {
            tableName: "saved_posts",
            timestamps: true,
            indexes: [
                { unique: true, fields: ["postId", "userId", "userType"] }
            ],
        }
    );

    (SavedPost as any).associate = (models: any) => {
        if (models.posts) SavedPost.belongsTo(models.posts, { foreignKey: "postId" });
    };

    return SavedPost;
};
