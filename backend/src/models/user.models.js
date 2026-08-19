import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        trim: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      profileImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'student',
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      hooks: {
        beforeSave: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
      },
    }
  );

  User.prototype.isPasswordCorrect = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  User.prototype.generateAccessToken = function () {
    return jwt.sign(
      {
        id: this.id,
        email: this.email,
        fullName: this.fullName,
        role: this.role,
      },
      process.env.JWT_SECRET || 'change-me-in-production',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );
  };

  return User;
};
