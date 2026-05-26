import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const CampaignDelivery = sequelize.define(
        "campaign_deliveries",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
            },
            campaignId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            actorId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            actorType: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "pending",
            },
            error: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            deliveredAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            tableName: "campaign_deliveries",
            timestamps: true,
            indexes: [
                { fields: ["campaignId", "status"] },
                { unique: true, fields: ["campaignId", "actorId", "actorType"] },
            ],
        }
    );

    return CampaignDelivery;
};
