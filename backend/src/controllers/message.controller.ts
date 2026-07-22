import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Message from '../models/message.model';

export const getMessages = async (req: Request, res: Response): Promise<Response> => {
  const { roomId } = req.params;
  const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).populate('sender', 'name avatarUrl');
  return res.json({ messages });
};

export const postMessage = async (req: Request, res: Response): Promise<Response> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { roomId, content, attachments = [] } = req.body;
  const senderId = req.user?.id;

  if (!senderId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const message = await Message.create({ sender: senderId, roomId, content, attachments });
  return res.status(201).json({ message });
};
