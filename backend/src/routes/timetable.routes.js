import { Router } from 'express';

import {
  createTimetableEntry,
  deleteTimetableEntry,
  getTimetable,
  getTimetableEntryById,
  updateTimetableEntry,
} from '../controllers/timetable.controllers.js';
import { verifyToken } from '../middlewares/auth.middlewares.js';

const router = Router();

router.use(verifyToken);
router.route('/').get(getTimetable).post(createTimetableEntry);
router.route('/:id').get(getTimetableEntryById).patch(updateTimetableEntry).delete(deleteTimetableEntry);

export default router;
