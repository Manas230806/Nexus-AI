import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import User from '../models/user.model';
import { createToken, createRefreshToken, verifyRefreshToken } from '../utils/jwt.util';

export const registerController = async (req: Request, res: Response): Promise<Response> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({ email, password: hashedPassword, name, provider: 'local' });

  return res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
    token: createToken(user.id),
    refreshToken: createRefreshToken(user.id)
  });
};

export const loginController = async (req: Request, res: Response): Promise<Response> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  return res.json({
    user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
    token: createToken(user.id),
    refreshToken: createRefreshToken(user.id)
  });
};

export const refreshTokenController = async (req: Request, res: Response): Promise<Response> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ token: createToken(user.id) });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

export const profileController = async (req: Request, res: Response): Promise<Response> => {
  const user = await User.findById(req.user?.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, roles: user.roles } });
};
