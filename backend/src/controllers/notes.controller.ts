import { Request, Response } from 'express';
import Note from '../models/note.model';

export const createNote = async (req: Request, res: Response): Promise<Response> => {
  const { title, content, projectId } = req.body;
  const note = await Note.create({ title, content, author: req.user?.id, project: projectId });
  return res.status(201).json({ note });
};

export const getNotes = async (_req: Request, res: Response): Promise<Response> => {
  const notes = await Note.find().populate('author', 'name avatarUrl');
  return res.json({ notes });
};
