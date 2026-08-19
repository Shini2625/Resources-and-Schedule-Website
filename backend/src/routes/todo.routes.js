import { Router } from 'express';

import {
  createTodo,
  deleteTodo,
  getTodoById,
  getTodos,
  toggleTodoCompletion,
  updateTodo,
} from '../controllers/todo.controllers.js';
import { verifyToken } from '../middlewares/auth.middlewares.js';

const router = Router();

router.use(verifyToken);
router.route('/').get(getTodos).post(createTodo);
router.route('/:id').get(getTodoById).patch(updateTodo).delete(deleteTodo);
router.route('/:id/toggle').patch(toggleTodoCompletion);

export default router;
