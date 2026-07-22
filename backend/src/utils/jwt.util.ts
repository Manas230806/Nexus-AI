import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

export const createToken = (userId: string): string => {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '15m' });
};

export const createRefreshToken = (userId: string): string => {
  return jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};

export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};
