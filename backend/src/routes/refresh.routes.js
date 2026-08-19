import { Router } from 'express';

import { refreshAccessToken } from '../controllers/refreshAuth.controllers.js';

const router = Router();

router.post('/refresh-token', refreshAccessToken);

export default router;
