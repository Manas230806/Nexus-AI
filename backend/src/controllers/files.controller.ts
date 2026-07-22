import { Request, Response } from 'express';
import multer from 'multer';
import FileModel from '../models/file.model';

const storage = multer.memoryStorage();
export const uploadMiddleware = multer({ storage });

export const uploadFile = async (req: Request, res: Response): Promise<Response> => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'File is required' });
  }

  const created = await FileModel.create({
    filename: file.originalname,
    url: `/uploads/${file.originalname}`,
    mimeType: file.mimetype,
    size: file.size,
    owner: req.user?.id
  });

  return res.status(201).json({ file: created });
};

export const getFiles = async (_req: Request, res: Response): Promise<Response> => {
  const files = await FileModel.find().populate('owner', 'name avatarUrl');
  return res.json({ files });
};
