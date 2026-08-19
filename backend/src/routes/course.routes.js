import { Router } from 'express';

import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
} from '../controllers/course.controllers.js';
import { verifyToken } from '../middlewares/auth.middlewares.js';

const router = Router();

router.use(verifyToken);
router.route('/').get(getAllCourses).post(createCourse);
router.route('/:id').get(getCourseById).patch(updateCourse).delete(deleteCourse);

export default router;
