import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const User = sequelize.define(
        "users",
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
            // New fields — alter:true will ADD these columns to the existing table
            role: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'owner', // owner | shelter | admin
            },
            // Maps to existing 'verified' column in DB
            isVerified: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                field: 'verified',
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
            // New fields
            bio: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            city: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            hasCompletedOnboarding: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
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
            tableName: "users",
            timestamps: true,
        }
    );

    (User as any).associate = (models: any) => {
        if (models.pets) User.hasMany(models.pets, { foreignKey: 'ownerId', as: 'pets' });
        if (models.vet_reviews) User.hasMany(models.vet_reviews, { foreignKey: 'userId', as: 'vetReviews' });
        if (models.appointments) User.hasMany(models.appointments, { foreignKey: 'ownerId', as: 'ownerAppointments' });
    };

    return User;
};
