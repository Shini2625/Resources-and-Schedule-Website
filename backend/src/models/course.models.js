import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Course = sequelize.define(
    'Course',
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
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      semester: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Semester 1',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'completed'),
        allowNull: false,
        defaultValue: 'active',
      },
      credits: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      gradingPolicy: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      professorName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      professorReview: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      customNotes: {
        type: DataTypes.TEXT,
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
      tableName: 'courses',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'code'],
          name: 'unique_user_course_code',
        },
      ],
    }
  );

  return Course;
};
