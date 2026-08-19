import { sequelize } from '../db/database.js';
import UserModel from './user.models.js';
import CourseModel from './course.models.js';

const User = UserModel(sequelize);
const Course = CourseModel(sequelize);

User.hasMany(Course, {
  foreignKey: 'userId',
  as: 'courses',
  onDelete: 'CASCADE',
});

Course.belongsTo(User, {
  foreignKey: 'userId',
  as: 'owner',
});

export { sequelize, User, Course };
