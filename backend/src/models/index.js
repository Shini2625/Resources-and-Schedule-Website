import { sequelize } from '../db/database.js';

import UserModel from './user.models.js';
import CourseModel from './course.models.js';
import ResourceModel from './resource.models.js';
import TimetableModel from './timetable.models.js';
import TodoModel from './todo.models.js';
import MotivationModel from './motivation.models.js';

const User = UserModel(sequelize);
const Course = CourseModel(sequelize);
const Resource = ResourceModel(sequelize);
const TimetableEntry = TimetableModel(sequelize);
const TodoItem = TodoModel(sequelize);
const Motivation = MotivationModel(sequelize);

User.hasMany(Course, {
  foreignKey: 'userId',
  as: 'courses',
  onDelete: 'CASCADE',
});

Course.belongsTo(User, {
  foreignKey: 'userId',
  as: 'owner',
});

Course.hasMany(Resource, {
  foreignKey: 'courseId',
  as: 'resources',
  onDelete: 'CASCADE',
});

Resource.belongsTo(Course, {
  foreignKey: 'courseId',
  as: 'course',
});

User.hasMany(TimetableEntry, {
  foreignKey: 'userId',
  as: 'timetableEntries',
  onDelete: 'CASCADE',
});

TimetableEntry.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(TodoItem, {
  foreignKey: 'userId',
  as: 'todoItems',
  onDelete: 'CASCADE',
});

TodoItem.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(Motivation, {
  foreignKey: 'userId',
  as: 'motivations',
  onDelete: 'CASCADE',
});

Motivation.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export { sequelize, User, Course, Resource, TimetableEntry, TodoItem, Motivation };
