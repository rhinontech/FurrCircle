import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const StoryView = sequelize.define(
        "story_views",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
            },
            storyId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            viewerId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            viewerType: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "user",
            },
        },
        {
            tableName: "story_views",
            timestamps: true,
            indexes: [
                {
                    unique: true,
                    fields: ["storyId", "viewerId", "viewerType"],
                },
            ],
        }
    );

    (StoryView as any).associate = (models: any) => {
        if (models.stories) StoryView.belongsTo(models.stories, { foreignKey: "storyId" });
    };

    return StoryView;
};
