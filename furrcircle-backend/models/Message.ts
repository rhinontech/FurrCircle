import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Message = sequelize.define(
        "messages",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4
            },
            conversationId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            senderId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            senderType: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "user",
            },
            text: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            petId: {
                type: DataTypes.UUID,
                allowNull: true,
            },
        },
        {
            tableName: "messages",
            timestamps: true,
        }
    );

    (Message as any).associate = (models: any) => {
        if (models.conversations) Message.belongsTo(models.conversations, { foreignKey: "conversationId" });
    };

    return Message;
};
