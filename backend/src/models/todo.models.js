import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const TodoItem = sequelize.define(
    'TodoItem',
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
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'general',
      },
      colorCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      completed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      tableName: 'todo_items',
      timestamps: true,
    }
  );

  return TodoItem;
};
