import { TodoItem } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getTodos = async (req, res, next) => {
  try {
    const todos = await TodoItem.findAll({
      where: { userId: req.user.id },
      order: [['dueDate', 'ASC'], ['priority', 'DESC'], ['createdAt', 'DESC']],
    });

    return ApiResponse.success(res, 200, todos, 'To-do list fetched successfully.');
  } catch (error) {
    return next(error);
  }
};

export const createTodo = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, category, colorCode } = req.body;

    if (!title) {
      throw new ApiError(400, 'Todo title is required.');
    }

    const todo = await TodoItem.create({
      title,
      description,
      dueDate,
      priority,
      category,
      colorCode,
      userId: req.user.id,
    });

    return ApiResponse.success(res, 201, todo, 'To-do created successfully.');
  } catch (error) {
    return next(error);
  }
};

export const getTodoById = async (req, res, next) => {
  try {
    const todo = await TodoItem.findOne({
      where: { id: req.params.id, userId: req.user.id },
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

    const updatedTodo = await todo.update(req.body);

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

    const updatedTodo = await todo.update({ completed: !todo.completed });

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
