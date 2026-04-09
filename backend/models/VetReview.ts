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
            vet_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
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
        if (models.Vet) VetReview.belongsTo(models.Vet, { foreignKey: 'vet_id', as: 'vet' });
        if (models.User) VetReview.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    };

    return VetReview;
};
