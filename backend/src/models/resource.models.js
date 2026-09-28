import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Resource = sequelize.define(
    'Resource',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM(
          'notes',
          'references',
          'tutorials',
          'solutions',
          'pyqs',
          'grading',
          'custom',
          'slides'
        ),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('file', 'link', 'text'),
        allowNull: false,
        defaultValue: 'file',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fileUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      externalLink: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'courses',
          key: 'id',
        },
      },
    },
    {
      tableName: 'resources',
      timestamps: true,
    }
  );

  return Resource;
};
