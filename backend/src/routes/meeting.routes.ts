import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createMeeting, getMeetings } from '../controllers/meeting.controller';

const router = Router();

router.use(authenticate);
router.get('/', getMeetings);
router.post('/', createMeeting);

export default router;
