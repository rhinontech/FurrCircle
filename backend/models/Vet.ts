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
            // Maps to existing 'verified' column in DB
            isVerified: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                field: 'verified',
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
            // Maps to existing 'profile_photo' column in DB
            avatar_url: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'profile_photo',
            },
            // Maps to existing 'phone_number' column in DB
            phone: {
                type: DataTypes.STRING,
                allowNull: true,
                field: 'phone_number',
            },
            address: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            // New fields — alter:true will ADD these columns
            city: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            bio: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            rating: {
                type: DataTypes.FLOAT,
                allowNull: true,
                defaultValue: 0,
            },
            resetToken: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            resetTokenExpiry: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            tableName: "vets",
            timestamps: true,
        }
    );

    (Vet as any).associate = (models: any) => {
        if (models.vet_reviews) Vet.hasMany(models.vet_reviews, { foreignKey: 'vetId', as: 'reviews' });
        if (models.appointments) Vet.hasMany(models.appointments, { foreignKey: 'vetId', as: 'appointments' });
    };

    return Vet;
};
