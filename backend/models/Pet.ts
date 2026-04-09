import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Pet = sequelize.define(
        "pets",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4
            },
            owner_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            profile_photo: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            species: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            breed: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            gender: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            birth_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            weight: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            history: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            height: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            is_adoption_open: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_foster_open: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },
        {
            tableName: "pets",
            timestamps: true,
        }
    );

    (Pet as any).associate = (models: any) => {
        if (models.User) Pet.belongsTo(models.User, { foreignKey: 'owner_id', as: 'owner' });
        if (models.Appointment) Pet.hasMany(models.Appointment, { foreignKey: 'pet_id', as: 'appointments' });
    };

    return Pet;
};
