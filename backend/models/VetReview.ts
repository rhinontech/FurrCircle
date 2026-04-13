import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const VetReview = sequelize.define(
        "vet_reviews",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4
            },
            // Maps to existing 'vet_id' column in DB
            vetId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'vet_id',
            },
            // Maps to existing 'user_id' column in DB
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'user_id',
            },
            rating: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            review: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
        },
        {
            tableName: "vet_reviews",
            timestamps: true,
        }
    );

    (VetReview as any).associate = (models: any) => {
        if (models.vets) VetReview.belongsTo(models.vets, { foreignKey: 'vetId', as: 'vet' });
        if (models.users) VetReview.belongsTo(models.users, { foreignKey: 'userId', as: 'user' });
    };

    return VetReview;
};
