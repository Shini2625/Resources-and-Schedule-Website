import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Motivation = sequelize.define(
    'Motivation',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      quote: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      tableName: 'motivation_entries',
      timestamps: true,
    }
  );

  return Motivation;
};
