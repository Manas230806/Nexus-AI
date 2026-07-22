import { Request, Response } from 'express';
import AIConversation from '../models/aiConversation.model';

export const createAIConversation = async (req: Request, res: Response): Promise<Response> => {
  const { title, messages, model } = req.body;
  const conversation = await AIConversation.create({
    user: req.user?.id,
    title,
    messages,
    model: model || 'gpt-4o-mini'
  });
  return res.status(201).json({ conversation });
};

export const getAIConversations = async (req: Request, res: Response): Promise<Response> => {
  const conversations = await AIConversation.find({ user: req.user?.id });
  return res.json({ conversations });
};
