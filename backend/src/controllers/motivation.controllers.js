import { Motivation } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getMotivations = async (req, res, next) => {
  try {
    const items = await Motivation.findAll({
      where: { userId: req.user.id },
      order: [
        ['isPinned', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });

    return ApiResponse.success(res, 200, items, 'Motivation entries fetched successfully.');
  } catch (error) {
    return next(error);
  }
};

export const getActiveMotivation = async (req, res, next) => {
  try {
    let item = await Motivation.findOne({
      where: { userId: req.user.id, isPinned: true },
    });

    if (!item) {
      item = await Motivation.findOne({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']],
      });
    }

    if (!item) {
      return ApiResponse.success(
        res,
        200,
        {
          quote: 'Success is the sum of small efforts, repeated day in and day out.',
          imageUrl: null,
          isPinned: false,
          isDefault: true,
        },
        'Default motivation returned.'
      );
    }

    return ApiResponse.success(res, 200, item, 'Active motivation fetched successfully.');
  } catch (error) {
    return next(error);
  }
};

export const createMotivation = async (req, res, next) => {
  try {
    const { quote, imageUrl, isPinned = false } = req.body;

    if (!quote) {
      throw new ApiError(400, 'A motivation quote is required.');
    }

    if (isPinned) {
      await Motivation.update(
        { isPinned: false },
        { where: { userId: req.user.id } }
      );
    }

    const item = await Motivation.create({
      quote: quote.trim(),
      imageUrl: imageUrl || null,
      isPinned: Boolean(isPinned),
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

    const { quote, imageUrl, isPinned } = req.body;

    if (isPinned === true) {
      await Motivation.update(
        { isPinned: false },
        { where: { userId: req.user.id } }
      );
      item.isPinned = true;
    } else if (isPinned === false) {
      item.isPinned = false;
    }

    if (quote !== undefined) item.quote = quote.trim();
    if (imageUrl !== undefined) item.imageUrl = imageUrl;

    await item.save();

    return ApiResponse.success(res, 200, item, 'Motivation entry updated successfully.');
  } catch (error) {
    return next(error);
  }
};

export const togglePinMotivation = async (req, res, next) => {
  try {
    const item = await Motivation.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!item) {
      throw new ApiError(404, 'Motivation entry not found.');
    }

    const willBePinned = !item.isPinned;

    if (willBePinned) {
      await Motivation.update(
        { isPinned: false },
        { where: { userId: req.user.id } }
      );
    }

    item.isPinned = willBePinned;
    await item.save();

    return ApiResponse.success(
      res,
      200,
      item,
      willBePinned ? 'Motivation pinned successfully.' : 'Motivation unpinned.'
    );
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

    return ApiResponse.success(
      res,
      200,
      { id: Number(req.params.id) },
      'Motivation entry deleted successfully.'
    );
  } catch (error) {
    return next(error);
  }
};
