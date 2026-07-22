import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createTask, getTasks } from '../controllers/tasks.controller';

const router = Router();

router.use(authenticate);
router.get('/', getTasks);
router.post('/', createTask);

export default router;
