import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Conversation = sequelize.define(
        "conversations",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4
            },
            initiatorId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            initiatorType: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "user",
            },
            recipientId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            recipientType: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "user",
            },
            petId: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            tableName: "conversations",
            timestamps: true,
        }
    );

    (Conversation as any).associate = (models: any) => {
        if (models.messages) Conversation.hasMany(models.messages, { foreignKey: "conversationId", as: "messages" });
        if (models.pets) Conversation.belongsTo(models.pets, { foreignKey: "petId", as: "pet" });
    };

    return Conversation;
};
