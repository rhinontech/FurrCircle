import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Story = sequelize.define(
        "stories",
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
            userType: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "user",
            },
            mediaUrl: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            mediaType: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "image", // image | video
            },
            city: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            viewCount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: "stories",
            timestamps: true,
        }
    );

    (Story as any).addHook("beforeCreate", (story: any) => {
        story.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    });

    (Story as any).associate = (models: any) => {
        if (models.users) Story.belongsTo(models.users, { foreignKey: "userId", as: "author", constraints: false });
        if (models.story_views) Story.hasMany(models.story_views, { foreignKey: "storyId", as: "views" });
    };

    return Story;
};
