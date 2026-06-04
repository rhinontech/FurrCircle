import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Report = sequelize.define(
        "reports",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4
            },
            reporterId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            reportedId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            subject: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            tableName: "reports",
            timestamps: true,
        }
    );

    (Report as any).associate = (models: any) => {
        if (models.users) {
            Report.belongsTo(models.users, { foreignKey: "reporterId", as: "reporter" });
            Report.belongsTo(models.users, { foreignKey: "reportedId", as: "reported" });
        }
    };

    return Report;
};
