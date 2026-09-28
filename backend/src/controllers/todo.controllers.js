import { Course, TodoItem, sequelize } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export const getTodos = async (req, res, next) => {
  try {
    const where = { userId: req.user.id };

    if (req.query.completed !== undefined) {
      where.completed = req.query.completed === 'true';
    }

    if (req.query.priority) {
      where.priority = req.query.priority;
    }

    if (req.query.category) {
      where.category = req.query.category;
    }

    if (req.query.courseId) {
      where.courseId = req.query.courseId;
    }

    const todos = await TodoItem.findAll({
      where,
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'code'],
        },
      ],
      order: [
        ['completed', 'ASC'],
        sequelize.literal('CASE WHEN dueDate IS NULL THEN 1 ELSE 0 END ASC'),
        ['dueDate', 'ASC'],
        sequelize.literal("FIELD(TodoItem.priority, 'urgent', 'high', 'medium', 'low') ASC"),
        ['createdAt', 'DESC'],
      ],
    });

    return ApiResponse.success(res, 200, todos, 'To-do list fetched successfully.');
  } catch (error) {
    return next(error);
  }
};

export const createTodo = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority = 'medium', category = 'general', colorCode, courseId } = req.body;

    if (!title) {
      throw new ApiError(400, 'Todo title is required.');
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      throw new ApiError(400, `Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
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

    const todo = await TodoItem.create({
      title: title.trim(),
      description,
      dueDate: dueDate || null,
      priority,
      category,
      colorCode,
      courseId: verifiedCourseId,
      userId: req.user.id,
    });

    const responseTodo = await TodoItem.findByPk(todo.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'code'],
        },
      ],
    });

    return ApiResponse.success(res, 201, responseTodo, 'To-do created successfully.');
  } catch (error) {
    return next(error);
  }
};

export const getTodoById = async (req, res, next) => {
  try {
    const todo = await TodoItem.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'code'],
        },
      ],
    });

    if (!todo) {
      throw new ApiError(404, 'To-do not found.');
    }

    return ApiResponse.success(res, 200, todo, 'To-do fetched successfully.');
  } catch (error) {
    return next(error);
  }
};

export const updateTodo = async (req, res, next) => {
  try {
    const todo = await TodoItem.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!todo) {
      throw new ApiError(404, 'To-do not found.');
    }

    const { title, description, dueDate, priority, category, colorCode, completed, courseId } = req.body;

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      throw new ApiError(400, `Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
    }

    if (courseId !== undefined) {
      if (courseId === null) {
        todo.courseId = null;
      } else {
        const course = await Course.findOne({
          where: { id: courseId, userId: req.user.id },
        });
        if (!course) {
          throw new ApiError(404, 'Associated course not found.');
        }
        todo.courseId = course.id;
      }
    }

    if (title !== undefined) todo.title = title.trim();
    if (description !== undefined) todo.description = description;
    if (dueDate !== undefined) todo.dueDate = dueDate || null;
    if (priority !== undefined) todo.priority = priority;
    if (category !== undefined) todo.category = category;
    if (colorCode !== undefined) todo.colorCode = colorCode;
    if (completed !== undefined) todo.completed = completed;

    await todo.save();

    const updatedTodo = await TodoItem.findByPk(todo.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'code'],
        },
      ],
    });

    return ApiResponse.success(res, 200, updatedTodo, 'To-do updated successfully.');
  } catch (error) {
    return next(error);
  }
};

export const toggleTodoCompletion = async (req, res, next) => {
  try {
    const todo = await TodoItem.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!todo) {
      throw new ApiError(404, 'To-do not found.');
    }

    todo.completed = !todo.completed;
    await todo.save();

    const updatedTodo = await TodoItem.findByPk(todo.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'code'],
        },
      ],
    });

    return ApiResponse.success(res, 200, updatedTodo, 'To-do status updated successfully.');
  } catch (error) {
    return next(error);
  }
};

export const deleteTodo = async (req, res, next) => {
  try {
    const todo = await TodoItem.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!todo) {
      throw new ApiError(404, 'To-do not found.');
    }

    await todo.destroy();

    return ApiResponse.success(res, 200, { id: Number(req.params.id) }, 'To-do deleted successfully.');
  } catch (error) {
    return next(error);
  }
};
