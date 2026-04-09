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
            vet_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            pet_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            time: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            tableName: "appointments",
            timestamps: true,
        }
    );

    (Appointment as any).associate = (models: any) => {
        if (models.Vet) Appointment.belongsTo(models.Vet, { foreignKey: 'vet_id', as: 'vet' });
        if (models.User) Appointment.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        if (models.Pet) Appointment.belongsTo(models.Pet, { foreignKey: 'pet_id', as: 'pet' });
    };

    return Appointment;
};
