import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getFiles, uploadFile, uploadMiddleware } from '../controllers/files.controller';

const router = Router();

router.use(authenticate);
router.get('/', getFiles);
router.post('/', uploadMiddleware.single('file'), uploadFile);

export default router;
