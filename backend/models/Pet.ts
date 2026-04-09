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
            // Maps to existing 'owner_id' column in DB
            ownerId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'owner_id',
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            // Maps to existing 'profile_photo' column in DB
            avatar_url: {
                type: DataTypes.STRING,
                allowNull: true,
                field: 'profile_photo',
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
            // Maps to existing 'is_adoption_open' column in DB
            isAdoptionOpen: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                field: 'is_adoption_open',
            },
            // Maps to existing 'is_foster_open' column in DB
            isFosterOpen: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                field: 'is_foster_open',
            },
            // New fields — alter:true will ADD these columns
            age: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            city: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            microchip_id: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            healthStatus: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: 'Healthy',
            },
        },
        {
            tableName: "pets",
            timestamps: true,
        }
    );

    (Pet as any).associate = (models: any) => {
        if (models.users) Pet.belongsTo(models.users, { foreignKey: 'ownerId', as: 'owner' });
        if (models.appointments) Pet.hasMany(models.appointments, { foreignKey: 'petId', as: 'Appointments' });
        if (models.vaccines) Pet.hasMany(models.vaccines, { foreignKey: 'petId', as: 'Vaccines' });
        if (models.medications) Pet.hasMany(models.medications, { foreignKey: 'petId', as: 'Medications' });
    };

    return Pet;
};
