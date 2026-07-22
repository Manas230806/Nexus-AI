import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import connectDatabase from './config/database';
import authRoutes from './routes/auth.routes';
import messageRoutes from './routes/message.routes';
import workspaceRoutes from './routes/workspace.routes';
import notesRoutes from './routes/notes.routes';
import tasksRoutes from './routes/tasks.routes';
import filesRoutes from './routes/files.routes';
import aiRoutes from './routes/ai.routes';
import meetingRoutes from './routes/meeting.routes';
import { socketHandler } from './sockets/socket';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/meetings', meetingRoutes);

socketHandler(io);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});

connectDatabase()
  .then(() => {
    console.log('Database connection initialized');
  })
  .catch((error) => {
    console.error('Failed to connect to database in background:', error);
  });
