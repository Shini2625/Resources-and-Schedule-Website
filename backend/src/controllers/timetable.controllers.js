import { Course, TimetableEntry, sequelize } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const VALID_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const getTimetable = async (req, res, next) => {
  try {
    const where = { userId: req.user.id };

    if (req.query.dayOfWeek) {
      where.dayOfWeek = req.query.dayOfWeek;
    }

    const entries = await TimetableEntry.findAll({
      where,
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'code'],
        },
      ],
      order: [
        sequelize.literal(
          "FIELD(TimetableEntry.dayOfWeek, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') ASC"
        ),
        ['startTime', 'ASC'],
      ],
    });

    return ApiResponse.success(res, 200, entries, 'Timetable fetched successfully.');
  } catch (error) {
    return next(error);
  }
};

export const createTimetableEntry = async (req, res, next) => {
  try {
    const { title, dayOfWeek, startTime, endTime, location, notes, courseId } = req.body;

    if (!title || !dayOfWeek || !startTime || !endTime) {
      throw new ApiError(400, 'Title, day, start time, and end time are required.');
    }

    if (!VALID_DAYS.includes(dayOfWeek)) {
      throw new ApiError(400, `Invalid day of week. Must be one of: ${VALID_DAYS.join(', ')}.`);
    }

    if (startTime >= endTime) {
      throw new ApiError(400, 'Start time must be earlier than end time.');
    }

    let verifiedCourseId = null;
    if (courseId) {
      const course = await Course.findOne({
        where: { id: courseId, userId: req.user.id },
      });
      if (!course) {
        throw new ApiError(404, 'Associated course not found.');
      }
      verifiedCourseId = course.id;
    }

    const entry = await TimetableEntry.create({
      title: title.trim(),
      dayOfWeek,
      startTime,
      endTime,
      location,
      notes,
      courseId: verifiedCourseId,
      userId: req.user.id,
    });

    const responseEntry = await TimetableEntry.findByPk(entry.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'code'],
        },
      ],
    });

    return ApiResponse.success(res, 201, responseEntry, 'Timetable entry created successfully.');
  } catch (error) {
    return next(error);
  }
};

export const getTimetableEntryById = async (req, res, next) => {
  try {
    const entry = await TimetableEntry.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'code'],
        },
      ],
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

    const { title, dayOfWeek, startTime, endTime, location, notes, courseId } = req.body;

    if (dayOfWeek && !VALID_DAYS.includes(dayOfWeek)) {
      throw new ApiError(400, `Invalid day of week. Must be one of: ${VALID_DAYS.join(', ')}.`);
    }

    const effectiveStart = startTime || entry.startTime;
    const effectiveEnd = endTime || entry.endTime;

    if (effectiveStart >= effectiveEnd) {
      throw new ApiError(400, 'Start time must be earlier than end time.');
    }

    if (courseId !== undefined) {
      if (courseId === null) {
        entry.courseId = null;
      } else {
        const course = await Course.findOne({
          where: { id: courseId, userId: req.user.id },
        });
        if (!course) {
          throw new ApiError(404, 'Associated course not found.');
        }
        entry.courseId = course.id;
      }
    }

    if (title !== undefined) entry.title = title.trim();
    if (dayOfWeek !== undefined) entry.dayOfWeek = dayOfWeek;
    if (startTime !== undefined) entry.startTime = startTime;
    if (endTime !== undefined) entry.endTime = endTime;
    if (location !== undefined) entry.location = location;
    if (notes !== undefined) entry.notes = notes;

    await entry.save();

    const updatedEntry = await TimetableEntry.findByPk(entry.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'code'],
        },
      ],
    });

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

    return ApiResponse.success(
      res,
      200,
      { id: Number(req.params.id) },
      'Timetable entry deleted successfully.'
    );
  } catch (error) {
    return next(error);
  }
};
