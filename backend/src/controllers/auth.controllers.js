import jwt from 'jsonwebtoken';

import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const registerUser = async (req, res, next) => {
  try {
    const { fullName, username, email, password } = req.body;

    if (!fullName || !email || !password) {
      throw new ApiError(400, 'Full name, email, and password are required.');
    }

    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ApiError(409, 'User already exists with that email address.');
    }

    if (username) {
      const existingUsername = await User.findOne({ where: { username: username.trim() } });
      if (existingUsername) {
        throw new ApiError(409, 'This username is already taken.');
      }
    }

    const user = await User.create({
      fullName,
      username: username ? username.trim() : null,
      email: email.toLowerCase(),
      password,
    });

    const accessToken = user.generateAccessToken();
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: '7d',
    });

    setRefreshTokenCookie(res, refreshToken);

    return ApiResponse.success(
      res,
      201,
      {
        user: {
          id: user.id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token: accessToken,
      },
      'User registered successfully.'
    );
  } catch (error) {
    return next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const identifier = email || username;

    if (!identifier || !password) {
      throw new ApiError(400, 'Email or username and password are required.');
    }

    const user = await User.findOne({
      where: identifier.includes('@')
        ? { email: identifier.toLowerCase() }
        : { username: identifier.trim() },
    });

    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials.');
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: '7d',
    });

    setRefreshTokenCookie(res, refreshToken);

    return ApiResponse.success(
      res,
      200,
      {
        user: {
          id: user.id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token: accessToken,
      },
      'Login successful.'
    );
  } catch (error) {
    return next(error);
  }
};

export const logoutUser = async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

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

    return ApiResponse.success(
      res,
      200,
      {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      'Current user fetched successfully.'
    );
  } catch (error) {
    return next(error);
  }
};
