import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const QuestionAnswer = sequelize.define(
        "question_answers",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
            },
            questionId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            text: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            upvotes: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            isAccepted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },
        {
            tableName: "question_answers",
            timestamps: true,
        }
    );

    (QuestionAnswer as any).associate = (models: any) => {
        if (models.questions) QuestionAnswer.belongsTo(models.questions, { foreignKey: "questionId" });
        if (models.users) QuestionAnswer.belongsTo(models.users, { foreignKey: "userId", as: "author", constraints: false });
    };

    return QuestionAnswer;
};
