import jwt from 'jsonwebtoken';

import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token is required.');
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      throw new ApiError(401, 'User no longer exists.');
    }

    if (Number(decoded.tokenVersion ?? 0) !== Number(user.tokenVersion || 0)) {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      throw new ApiError(401, 'Your session is no longer valid. Please sign in again.');
    }

    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = jwt.sign({ id: user.id, tokenVersion: Number(user.tokenVersion || 0) }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(
      res,
      200,
      { token: newAccessToken },
      'Access token refreshed successfully.'
    );
  } catch (error) {
    return next(error);
  }
};
