import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Vet = sequelize.define(
        "vets",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            verified: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            hospital_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            profession: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            experience: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            working_hours: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            profile_photo: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            phone_number: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            address: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            tableName: "vets",
            timestamps: true,
        }
    );

    (Vet as any).associate = (models: any) => {
        if (models.VetReview) Vet.hasMany(models.VetReview, { foreignKey: 'vet_id', as: 'reviews' });
        if (models.Appointment) Vet.hasMany(models.Appointment, { foreignKey: 'vet_id', as: 'appointments' });
    };

    return Vet;
};
