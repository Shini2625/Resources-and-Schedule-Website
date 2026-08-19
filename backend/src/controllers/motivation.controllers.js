import { Motivation } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getMotivations = async (req, res, next) => {
  try {
    const items = await Motivation.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    return ApiResponse.success(res, 200, items, 'Motivation entries fetched successfully.');
  } catch (error) {
    return next(error);
  }
};

export const createMotivation = async (req, res, next) => {
  try {
    const { quote, imageUrl } = req.body;

    if (!quote) {
      throw new ApiError(400, 'A motivation quote is required.');
    }

    const item = await Motivation.create({
      quote,
      imageUrl,
      userId: req.user.id,
    });

    return ApiResponse.success(res, 201, item, 'Motivation entry created successfully.');
  } catch (error) {
    return next(error);
  }
};

export const getMotivationById = async (req, res, next) => {
  try {
    const item = await Motivation.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!item) {
      throw new ApiError(404, 'Motivation entry not found.');
    }

    return ApiResponse.success(res, 200, item, 'Motivation entry fetched successfully.');
  } catch (error) {
    return next(error);
  }
};

export const updateMotivation = async (req, res, next) => {
  try {
    const item = await Motivation.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!item) {
      throw new ApiError(404, 'Motivation entry not found.');
    }

    const updatedItem = await item.update(req.body);

    return ApiResponse.success(res, 200, updatedItem, 'Motivation entry updated successfully.');
  } catch (error) {
    return next(error);
  }
};

export const deleteMotivation = async (req, res, next) => {
  try {
    const item = await Motivation.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!item) {
      throw new ApiError(404, 'Motivation entry not found.');
    }

    await item.destroy();

    return ApiResponse.success(res, 200, { id: Number(req.params.id) }, 'Motivation entry deleted successfully.');
  } catch (error) {
    return next(error);
  }
};
