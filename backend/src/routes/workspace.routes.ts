import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createGroup, getGroups, createChannel, createProject, getProjects } from '../controllers/workspace.controller';

const router = Router();

router.use(authenticate);
router.get('/groups', getGroups);
router.post('/groups', createGroup);
router.post('/channels', createChannel);
router.get('/projects', getProjects);
router.post('/projects', createProject);

export default router;
