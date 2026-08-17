import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Circle = sequelize.define(
        "circles",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            category: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: "general",
            },
            coverImage: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            createdBy: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            memberCount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
            isPublic: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        },
        {
            tableName: "circles",
            timestamps: true,
        }
    );

    (Circle as any).associate = (models: any) => {
        if (models.users) Circle.belongsTo(models.users, { foreignKey: "createdBy", as: "creator" });
        if (models.circle_members) Circle.hasMany(models.circle_members, { foreignKey: "circleId", as: "members" });
        if (models.questions) Circle.hasMany(models.questions, { foreignKey: "circleId", as: "questions" });
    };

    return Circle;
};
