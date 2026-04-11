import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
    const Appointment = sequelize.define(
        "appointments",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4
            },
            // Maps to existing 'vet_id' column in DB (references vets table)
            vetId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'vet_id',
            },
            // Maps to existing 'user_id' column in DB (the pet owner)
            ownerId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'user_id',
            },
            // Maps to existing 'pet_id' column in DB
            petId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'pet_id',
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            time: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            // Maps to existing 'description' column — used as appointment reason
            reason: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'description',
            },
            status: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: 'pending',
            },
            // New field — alter:true will ADD this column
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            tableName: "appointments",
            timestamps: true,
        }
    );

    (Appointment as any).associate = (models: any) => {
        if (models.vets) Appointment.belongsTo(models.vets, { foreignKey: 'vetId', as: 'veterinarian' });
        if (models.users) Appointment.belongsTo(models.users, { foreignKey: 'ownerId', as: 'owner' });
        if (models.pets) Appointment.belongsTo(models.pets, { foreignKey: 'petId', as: 'pet' });
    };

    return Appointment;
};
