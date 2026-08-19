import { Router } from 'express';

import {
  createResource,
  deleteResource,
  getCourseResources,
  getResourceById,
  updateResource,
} from '../controllers/resource.controllers.js';
import { verifyToken } from '../middlewares/auth.middlewares.js';

const router = Router();

router.use(verifyToken);
router.route('/course/:courseId').get(getCourseResources).post(createResource);
router.route('/:id').get(getResourceById).patch(updateResource).delete(deleteResource);

export default router;
