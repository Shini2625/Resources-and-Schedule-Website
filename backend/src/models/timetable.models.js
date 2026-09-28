import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const TimetableEntry = sequelize.define(
    'TimetableEntry',
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
      dayOfWeek: {
        type: DataTypes.ENUM(
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday'
        ),
        allowNull: false,
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'courses',
          key: 'id',
        },
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
      tableName: 'timetable_entries',
      timestamps: true,
    }
  );

  return TimetableEntry;
};
