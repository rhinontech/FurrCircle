import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const UserBlock = sequelize.define(
        "user_blocks",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
            },
            blockerId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            blockedId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
        },
        {
            tableName: "user_blocks",
            timestamps: true,
        }
    );

    (UserBlock as any).associate = (models: any) => {
        if (models.users) {
            UserBlock.belongsTo(models.users, { foreignKey: "blockerId", as: "blocker" });
            UserBlock.belongsTo(models.users, { foreignKey: "blockedId", as: "blocked" });
        }
    };

    return UserBlock;
};
