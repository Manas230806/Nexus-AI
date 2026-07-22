import { Request, Response } from 'express';
import Task from '../models/task.model';

export const createTask = async (req: Request, res: Response): Promise<Response> => {
  const { title, description, status, priority, assignees, dueDate, projectId } = req.body;
  const task = await Task.create({
    title,
    description,
    status,
    priority,
    assignees,
    dueDate,
    project: projectId
  });
  return res.status(201).json({ task });
};

export const getTasks = async (_req: Request, res: Response): Promise<Response> => {
  const tasks = await Task.find().populate('assignees', 'name avatarUrl');
  return res.json({ tasks });
};
