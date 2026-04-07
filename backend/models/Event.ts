import { Model } from "sequelize";

export default (sequelize: any, DataTypes: any) => {
  class Event extends Model {
    static associate(models: any) {
      if (models.User) Event.belongsTo(models.User, { foreignKey: 'organizerId', as: 'organizer' });
    }
  }

  Event.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      organizerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      time: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Event",
    }
  );
  return Event;
};
