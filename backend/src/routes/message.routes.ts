import { Router } from 'express';
import { body } from 'express-validator';
import { getMessages, postMessage } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/:roomId', authenticate, getMessages);
router.post(
  '/',
  authenticate,
  [body('roomId').notEmpty(), body('content').optional().isString()],
  postMessage
);

export default router;
