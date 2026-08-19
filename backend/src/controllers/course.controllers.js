import { Course, Resource } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.findAll({
      where: { userId: req.user.id },
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
    const { title, code, year, semester, description, status, credits } = req.body;

    if (!title || !code) {
      throw new ApiError(400, 'Course title and code are required.');
    }

    const course = await Course.create({
      title,
      code,
      year,
      semester,
      description,
      status,
      credits,
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

    const updatedCourse = await course.update(req.body);

    return ApiResponse.success(res, 200, updatedCourse, 'Course updated successfully.');
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
