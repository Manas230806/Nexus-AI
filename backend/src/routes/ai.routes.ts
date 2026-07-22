import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createAIConversation, getAIConversations } from '../controllers/ai.controller';

const router = Router();

router.use(authenticate);
router.get('/', getAIConversations);
router.post('/', createAIConversation);

export default router;
