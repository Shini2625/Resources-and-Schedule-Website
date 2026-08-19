import { TimetableEntry } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getTimetable = async (req, res, next) => {
  try {
    const entries = await TimetableEntry.findAll({
      where: { userId: req.user.id },
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']],
    });

    return ApiResponse.success(res, 200, entries, 'Timetable fetched successfully.');
  } catch (error) {
    return next(error);
  }
};

export const createTimetableEntry = async (req, res, next) => {
  try {
    const { title, dayOfWeek, startTime, endTime, location, notes } = req.body;

    if (!title || !dayOfWeek || !startTime || !endTime) {
      throw new ApiError(400, 'Title, day, start time, and end time are required.');
    }

    const entry = await TimetableEntry.create({
      title,
      dayOfWeek,
      startTime,
      endTime,
      location,
      notes,
      userId: req.user.id,
    });

    return ApiResponse.success(res, 201, entry, 'Timetable entry created successfully.');
  } catch (error) {
    return next(error);
  }
};

export const getTimetableEntryById = async (req, res, next) => {
  try {
    const entry = await TimetableEntry.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!entry) {
      throw new ApiError(404, 'Timetable entry not found.');
    }

    return ApiResponse.success(res, 200, entry, 'Timetable entry fetched successfully.');
  } catch (error) {
    return next(error);
  }
};

export const updateTimetableEntry = async (req, res, next) => {
  try {
    const entry = await TimetableEntry.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!entry) {
      throw new ApiError(404, 'Timetable entry not found.');
    }

    const updatedEntry = await entry.update(req.body);

    return ApiResponse.success(res, 200, updatedEntry, 'Timetable entry updated successfully.');
  } catch (error) {
    return next(error);
  }
};

export const deleteTimetableEntry = async (req, res, next) => {
  try {
    const entry = await TimetableEntry.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!entry) {
      throw new ApiError(404, 'Timetable entry not found.');
    }

    await entry.destroy();

    return ApiResponse.success(res, 200, { id: Number(req.params.id) }, 'Timetable entry deleted successfully.');
  } catch (error) {
    return next(error);
  }
};
