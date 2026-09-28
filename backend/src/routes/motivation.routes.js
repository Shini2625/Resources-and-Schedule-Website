import { Router } from 'express';

import {
  createMotivation,
  deleteMotivation,
  getActiveMotivation,
  getMotivationById,
  getMotivations,
  togglePinMotivation,
  updateMotivation,
} from '../controllers/motivation.controllers.js';
import { verifyToken } from '../middlewares/auth.middlewares.js';

const router = Router();

router.use(verifyToken);

router.route('/').get(getMotivations).post(createMotivation);
router.route('/active').get(getActiveMotivation);
router.route('/:id').get(getMotivationById).patch(updateMotivation).delete(deleteMotivation);
router.route('/:id/pin').patch(togglePinMotivation);

export default router;
