import { Request, Response } from 'express';
import Meeting from '../models/meeting.model';

export const createMeeting = async (req: Request, res: Response): Promise<Response> => {
  const { title, participants, startTime, endTime, description } = req.body;
  const meeting = await Meeting.create({
    title,
    organizer: req.user?.id,
    participants,
    startTime,
    endTime,
    description
  });
  return res.status(201).json({ meeting });
};

export const getMeetings = async (_req: Request, res: Response): Promise<Response> => {
  const meetings = await Meeting.find().populate('organizer', 'name avatarUrl');
  return res.json({ meetings });
};
