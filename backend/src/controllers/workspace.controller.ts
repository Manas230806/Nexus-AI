import { Request, Response } from 'express';
import Group from '../models/group.model';
import Channel from '../models/channel.model';
import Project from '../models/project.model';

export const createGroup = async (req: Request, res: Response): Promise<Response> => {
  const { name, description } = req.body;
  const group = await Group.create({ name, description, owner: req.user?.id, members: [req.user?.id] });
  return res.status(201).json({ group });
};

export const getGroups = async (_req: Request, res: Response): Promise<Response> => {
  const groups = await Group.find().populate('owner', 'name avatarUrl');
  return res.json({ groups });
};

export const createChannel = async (req: Request, res: Response): Promise<Response> => {
  const { name, description, groupId, isPrivate } = req.body;
  const channel = await Channel.create({ name, description, group: groupId, isPrivate, owner: req.user?.id });
  return res.status(201).json({ channel });
};

export const createProject = async (req: Request, res: Response): Promise<Response> => {
  const { name, description, workspace } = req.body;
  const project = await Project.create({ name, description, owner: req.user?.id, members: [req.user?.id], workspace });
  return res.status(201).json({ project });
};

export const getProjects = async (_req: Request, res: Response): Promise<Response> => {
  const projects = await Project.find().populate('owner', 'name avatarUrl');
  return res.json({ projects });
};
