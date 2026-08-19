import { Course, Resource } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getCourseResources = async (req, res, next) => {
  try {
    const course = await Course.findOne({
      where: { id: req.params.courseId, userId: req.user.id },
    });

    if (!course) {
      throw new ApiError(404, 'Course not found.');
    }

    const resources = await Resource.findAll({
      where: { courseId: course.id },
      order: [['createdAt', 'DESC']],
    });

    return ApiResponse.success(res, 200, resources, 'Resources fetched successfully.');
  } catch (error) {
    return next(error);
  }
};

export const createResource = async (req, res, next) => {
  try {
    const { title, category, type, description, fileUrl, externalLink } = req.body;

    if (!title || !category) {
      throw new ApiError(400, 'Resource title and category are required.');
    }

    const course = await Course.findOne({
      where: { id: req.params.courseId, userId: req.user.id },
    });

    if (!course) {
      throw new ApiError(404, 'Course not found.');
    }

    const resource = await Resource.create({
      title,
      category,
      type,
      description,
      fileUrl,
      externalLink,
      courseId: course.id,
    });

    return ApiResponse.success(res, 201, resource, 'Resource created successfully.');
  } catch (error) {
    return next(error);
  }
};

export const getResourceById = async (req, res, next) => {
  try {
    const resource = await Resource.findOne({
      where: { id: req.params.id },
      include: [{ model: Course, as: 'course' }],
    });

    if (!resource) {
      throw new ApiError(404, 'Resource not found.');
    }

    if (resource.course && resource.course.userId !== req.user.id) {
      throw new ApiError(403, 'You are not allowed to access this resource.');
    }

    return ApiResponse.success(res, 200, resource, 'Resource fetched successfully.');
  } catch (error) {
    return next(error);
  }
};

export const updateResource = async (req, res, next) => {
  try {
    const resource = await Resource.findOne({
      where: { id: req.params.id },
      include: [{ model: Course, as: 'course' }],
    });

    if (!resource) {
      throw new ApiError(404, 'Resource not found.');
    }

    if (resource.course && resource.course.userId !== req.user.id) {
      throw new ApiError(403, 'You are not allowed to update this resource.');
    }

    const updatedResource = await resource.update(req.body);

    return ApiResponse.success(res, 200, updatedResource, 'Resource updated successfully.');
  } catch (error) {
    return next(error);
  }
};

export const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findOne({
      where: { id: req.params.id },
      include: [{ model: Course, as: 'course' }],
    });

    if (!resource) {
      throw new ApiError(404, 'Resource not found.');
    }

    if (resource.course && resource.course.userId !== req.user.id) {
      throw new ApiError(403, 'You are not allowed to delete this resource.');
    }

    await resource.destroy();

    return ApiResponse.success(res, 200, { id: Number(req.params.id) }, 'Resource deleted successfully.');
  } catch (error) {
    return next(error);
  }
};
