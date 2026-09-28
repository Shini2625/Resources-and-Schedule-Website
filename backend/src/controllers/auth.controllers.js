import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';

import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { buildPasswordResetUrl, isPasswordResetEmailConfigured, sendPasswordResetEmail } from '../services/email.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const RESET_REQUEST_MESSAGE = 'If an account matches that email address, a password reset link will be sent.';
const hashResetToken = (token) => createHash('sha256').update(token).digest('hex');

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const requestPasswordReset = async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, 'Enter a valid email address.');
    }

    if (!isPasswordResetEmailConfigured()) {
      throw new ApiError(503, 'Password reset email is not configured yet. Please contact the administrator.');
    }

    const user = await User.findOne({ where: { email } });
    if (user) {
      const token = randomBytes(32).toString('base64url');
      user.passwordResetTokenHash = hashResetToken(token);
      user.passwordResetExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();

      try {
        await sendPasswordResetEmail({ to: user.email, resetUrl: buildPasswordResetUrl(token) });
      } catch (error) {
        user.passwordResetTokenHash = null;
        user.passwordResetExpiresAt = null;
        await user.save();
        console.error('[auth] Password reset email delivery failed.', error?.code || error?.name || 'Unknown error');
      }
    }

    return ApiResponse.success(res, 202, { accepted: true }, RESET_REQUEST_MESSAGE);
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body || {};
    if (typeof token !== 'string' || !token || typeof newPassword !== 'string') {
      throw new ApiError(400, 'A reset token and new password are required.');
    }
    if (newPassword.length < 6 || newPassword.length > 72) {
      throw new ApiError(400, 'Password must be between 6 and 72 characters.');
    }

    const user = await User.findOne({
      where: {
        passwordResetTokenHash: hashResetToken(token),
        passwordResetExpiresAt: { [Op.gt]: new Date() },
      },
    });
    if (!user) {
      throw new ApiError(400, 'This password reset link is invalid or expired. Request a new one.');
    }

    user.password = newPassword;
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.tokenVersion = Number(user.tokenVersion || 0) + 1;
    await user.save();

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return ApiResponse.success(res, 200, {}, 'Password updated. Sign in with your new password.');
  } catch (error) {
    return next(error);
  }
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
      fullName: fullName.trim(),
      username: username ? username.trim() : null,
      email: email.toLowerCase(),
      password,
    });

    const accessToken = user.generateAccessToken();
    const refreshToken = jwt.sign({ id: user.id, tokenVersion: Number(user.tokenVersion || 0) }, JWT_SECRET, {
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
          bio: user.bio,
          profileImage: user.profileImage,
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
    const refreshToken = jwt.sign({ id: user.id, tokenVersion: Number(user.tokenVersion || 0) }, JWT_SECRET, {
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
          bio: user.bio,
          profileImage: user.profileImage,
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
        bio: user.bio,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
      'Current user fetched successfully.'
    );
  } catch (error) {
    return next(error);
  }
};

export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    const { fullName, username, bio, profileImage, currentPassword, newPassword } = req.body;

    if (username && username.trim() !== user.username) {
      const existing = await User.findOne({ where: { username: username.trim() } });
      if (existing) {
        throw new ApiError(409, 'This username is already taken.');
      }
      user.username = username.trim();
    }

    if (fullName !== undefined) user.fullName = fullName.trim();
    if (bio !== undefined) user.bio = bio;
    if (profileImage !== undefined) user.profileImage = profileImage;

    if (newPassword) {
      if (!currentPassword) {
        throw new ApiError(400, 'Current password is required to change password.');
      }
      const isMatch = await user.isPasswordCorrect(currentPassword);
      if (!isMatch) {
        throw new ApiError(401, 'Current password is incorrect.');
      }
      if (newPassword.length < 6) {
        throw new ApiError(400, 'New password must be at least 6 characters.');
      }
      user.password = newPassword; // beforeSave hook will hash it
    }

    await user.save();

    return ApiResponse.success(
      res,
      200,
      {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        bio: user.bio,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
      'Profile updated successfully.'
    );
  } catch (error) {
    return next(error);
  }
};

export const deleteUserAccount = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    await user.destroy();

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return ApiResponse.success(
      res,
      200,
      { id: req.user.id },
      'User account and all associated data deleted successfully.'
    );
  } catch (error) {
    return next(error);
  }
};
