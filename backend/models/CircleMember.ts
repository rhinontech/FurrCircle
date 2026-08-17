import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const CircleMember = sequelize.define(
        "circle_members",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
            },
            circleId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            role: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "member", // 'admin' | 'member'
            },
        },
        {
            tableName: "circle_members",
            timestamps: true,
        }
    );

    (CircleMember as any).associate = (models: any) => {
        if (models.circles) CircleMember.belongsTo(models.circles, { foreignKey: "circleId", as: "circle" });
        if (models.users) CircleMember.belongsTo(models.users, { foreignKey: "userId", as: "user" });
    };

    return CircleMember;
};
