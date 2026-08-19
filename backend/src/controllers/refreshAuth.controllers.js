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

    const newAccessToken = user.generateAccessToken();

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
