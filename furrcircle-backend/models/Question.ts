import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Question = sequelize.define(
        "questions",
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
            circleId: {
                type: DataTypes.UUID,
                allowNull: true, // null = global/no circle
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            body: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            tags: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                allowNull: false,
                defaultValue: [],
            },
            upvotes: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            answerCount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            tableName: "questions",
            timestamps: true,
        }
    );

    (Question as any).associate = (models: any) => {
        if (models.users) Question.belongsTo(models.users, { foreignKey: "userId", as: "author", constraints: false });
        if (models.circles) Question.belongsTo(models.circles, { foreignKey: "circleId", as: "circle" });
        if (models.question_answers) Question.hasMany(models.question_answers, { foreignKey: "questionId", as: "answers" });
    };

    return Question;
};
