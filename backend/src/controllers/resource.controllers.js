import { Course, Resource } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const VALID_CATEGORIES = [
  'notes',
  'references',
  'tutorials',
  'solutions',
  'pyqs',
  'grading',
  'custom',
  'slides',
];

const VALID_TYPES = ['file', 'link', 'text'];

export const getCourseResources = async (req, res, next) => {
  try {
    const course = await Course.findOne({
      where: { id: req.params.courseId, userId: req.user.id },
    });

    if (!course) {
      throw new ApiError(404, 'Course not found.');
    }

    const where = { courseId: course.id };

    if (req.query.category) {
      where.category = req.query.category;
    }
    if (req.query.type) {
      where.type = req.query.type;
    }

    const resources = await Resource.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    return ApiResponse.success(res, 200, resources, 'Resources fetched successfully.');
  } catch (error) {
    return next(error);
  }
};

export const createResource = async (req, res, next) => {
  try {
    const { title, category, type = 'file', description, fileUrl, externalLink } = req.body;

    if (!title || !category) {
      throw new ApiError(400, 'Resource title and category are required.');
    }

    if (!VALID_CATEGORIES.includes(category)) {
      throw new ApiError(
        400,
        `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}.`
      );
    }

    if (!VALID_TYPES.includes(type)) {
      throw new ApiError(400, `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}.`);
    }

    const course = await Course.findOne({
      where: { id: req.params.courseId, userId: req.user.id },
    });

    if (!course) {
      throw new ApiError(404, 'Course not found.');
    }

    const resource = await Resource.create({
      title: title.trim(),
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

    const { title, category, type, description, fileUrl, externalLink } = req.body;

    if (category && !VALID_CATEGORIES.includes(category)) {
      throw new ApiError(
        400,
        `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}.`
      );
    }

    if (type && !VALID_TYPES.includes(type)) {
      throw new ApiError(400, `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}.`);
    }

    if (title !== undefined) resource.title = title.trim();
    if (category !== undefined) resource.category = category;
    if (type !== undefined) resource.type = type;
    if (description !== undefined) resource.description = description;
    if (fileUrl !== undefined) resource.fileUrl = fileUrl;
    if (externalLink !== undefined) resource.externalLink = externalLink;

    await resource.save();

    return ApiResponse.success(res, 200, resource, 'Resource updated successfully.');
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

    return ApiResponse.success(
      res,
      200,
      { id: Number(req.params.id) },
      'Resource deleted successfully.'
    );
  } catch (error) {
    return next(error);
  }
};
