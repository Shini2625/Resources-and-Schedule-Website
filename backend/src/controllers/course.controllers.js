import { Course, Resource } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getAllCourses = async (req, res, next) => {
  try {
    const where = { userId: req.user.id };

    if (req.query.year) {
      where.year = Number(req.query.year);
    }
    if (req.query.semester) {
      where.semester = req.query.semester;
    }
    if (req.query.status) {
      where.status = req.query.status;
    }

    const courses = await Course.findAll({
      where,
      include: [{ model: Resource, as: 'resources' }],
      order: [['createdAt', 'DESC']],
    });

    return ApiResponse.success(res, 200, courses, 'Courses fetched successfully.');
  } catch (error) {
    return next(error);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const {
      title,
      code,
      year,
      semester,
      description,
      status,
      credits,
      gradingPolicy,
      professorName,
      professorReview,
      customNotes,
    } = req.body;

    if (!title || !code) {
      throw new ApiError(400, 'Course title and code are required.');
    }

    const normalizedCode = code.trim().toUpperCase();

    const existingCourse = await Course.findOne({
      where: { userId: req.user.id, code: normalizedCode },
    });

    if (existingCourse) {
      throw new ApiError(409, `You already have a course with code ${normalizedCode}.`);
    }

    const course = await Course.create({
      title: title.trim(),
      code: normalizedCode,
      year: year ? Number(year) : 1,
      semester: semester || 'Semester 1',
      description,
      status: status || 'active',
      credits: credits !== undefined ? Number(credits) : null,
      gradingPolicy,
      professorName,
      professorReview,
      customNotes,
      userId: req.user.id,
    });

    return ApiResponse.success(res, 201, course, 'Course created successfully.');
  } catch (error) {
    return next(error);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Resource, as: 'resources' }],
    });

    if (!course) {
      throw new ApiError(404, 'Course not found.');
    }

    return ApiResponse.success(res, 200, course, 'Course fetched successfully.');
  } catch (error) {
    return next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!course) {
      throw new ApiError(404, 'Course not found.');
    }

    const {
      title,
      code,
      year,
      semester,
      description,
      status,
      credits,
      gradingPolicy,
      professorName,
      professorReview,
      customNotes,
    } = req.body;

    if (code) {
      const normalizedCode = code.trim().toUpperCase();
      if (normalizedCode !== course.code) {
        const existing = await Course.findOne({
          where: { userId: req.user.id, code: normalizedCode },
        });
        if (existing) {
          throw new ApiError(409, `A course with code ${normalizedCode} already exists.`);
        }
        course.code = normalizedCode;
      }
    }

    if (title !== undefined) course.title = title.trim();
    if (year !== undefined) course.year = Number(year);
    if (semester !== undefined) course.semester = semester;
    if (description !== undefined) course.description = description;
    if (status !== undefined) course.status = status;
    if (credits !== undefined) course.credits = credits ? Number(credits) : null;
    if (gradingPolicy !== undefined) course.gradingPolicy = gradingPolicy;
    if (professorName !== undefined) course.professorName = professorName;
    if (professorReview !== undefined) course.professorReview = professorReview;
    if (customNotes !== undefined) course.customNotes = customNotes;

    await course.save();

    return ApiResponse.success(res, 200, course, 'Course updated successfully.');
  } catch (error) {
    return next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!course) {
      throw new ApiError(404, 'Course not found.');
    }

    await course.destroy();

    return ApiResponse.success(res, 200, { id: Number(req.params.id) }, 'Course deleted successfully.');
  } catch (error) {
    return next(error);
  }
};
