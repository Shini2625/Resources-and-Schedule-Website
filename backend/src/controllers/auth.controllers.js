import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export const registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      throw new ApiError(400, 'Full name, email, and password are required.');
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ApiError(409, 'User already exists with that email address.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return ApiResponse.success(res, 201, {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
      token,
    }, 'User registered successfully.');
  } catch (error) {
    return next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required.');
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials.');
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return ApiResponse.success(res, 200, {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
      token,
    }, 'Login successful.');
  } catch (error) {
    return next(error);
  }
};

export const logoutUser = async (req, res) => {
  return ApiResponse.success(res, 200, {}, 'Logout successful.');
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    return ApiResponse.success(res, 200, {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    }, 'Current user fetched successfully.');
  } catch (error) {
    return next(error);
  }
};
