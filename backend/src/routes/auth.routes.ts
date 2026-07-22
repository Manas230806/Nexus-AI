import { Router } from 'express';
import { body } from 'express-validator';
import {
  registerController,
  loginController,
  refreshTokenController,
  profileController
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').isString().notEmpty().withMessage('Name is required')
  ],
  registerController
);

router.post('/login', [body('email').isEmail(), body('password').notEmpty()], loginController);
router.post('/refresh', refreshTokenController);
router.get('/profile', authenticate, profileController);

export default router;
