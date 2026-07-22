import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface IJwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

export const authenticate = (req: Request, res: Response, next: NextFunction): Response | void => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }

  const token = authorization.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as IJwtPayload;
    req.user = { id: payload.sub } as any;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
