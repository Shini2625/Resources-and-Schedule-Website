import { Router } from 'express';

import {
  createMotivation,
  deleteMotivation,
  getMotivationById,
  getMotivations,
  updateMotivation,
} from '../controllers/motivation.controllers.js';
import { verifyToken } from '../middlewares/auth.middlewares.js';

const router = Router();

router.use(verifyToken);
router.route('/').get(getMotivations).post(createMotivation);
router.route('/:id').get(getMotivationById).patch(updateMotivation).delete(deleteMotivation);

export default router;
