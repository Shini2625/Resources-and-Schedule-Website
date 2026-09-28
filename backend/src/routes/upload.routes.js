import { Router } from 'express';

import { getPresignedUploadUrl, getStorageConfig } from '../controllers/upload.controllers.js';
import { verifyToken } from '../middlewares/auth.middlewares.js';

const router = Router();

router.use(verifyToken);
router.get('/config', getStorageConfig);
router.post('/presigned-url', getPresignedUploadUrl);

export default router;
