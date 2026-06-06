import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const QuestionVote = sequelize.define(
        "question_votes",
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
        },
        {
            tableName: "question_votes",
            timestamps: true,
            indexes: [
                {
                    unique: true,
                    fields: ["questionId", "userId"],
                    name: "question_votes_question_user_unique",
                },
            ],
        }
    );

    (QuestionVote as any).associate = (models: any) => {
        if (models.questions) QuestionVote.belongsTo(models.questions, { foreignKey: "questionId", as: "question" });
        if (models.users) QuestionVote.belongsTo(models.users, { foreignKey: "userId", as: "voter" });
    };

    return QuestionVote;
};
