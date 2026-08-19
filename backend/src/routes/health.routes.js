import { Router } from 'express';

import { healthCheck } from '../controllers/health.controllers.js';

const router = Router();

router.get('/health', healthCheck);

export default router;
