import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createNote, getNotes } from '../controllers/notes.controller';

const router = Router();

router.use(authenticate);
router.get('/', getNotes);
router.post('/', createNote);

export default router;
