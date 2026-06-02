import { DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
  const PlacesVetCache = sequelize.define(
    "places_vet_caches",
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cityNormalized: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      items: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      fetchedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "places_vet_caches",
      timestamps: true,
      indexes: [{ unique: true, fields: ["cityNormalized"] }],
    }
  );

  return PlacesVetCache;
};

