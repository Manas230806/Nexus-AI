import { Server, Socket } from 'socket.io';
import Message from '../models/message.model';
import { verifyToken } from '../utils/jwt.util';

interface IMessagePayload {
  roomId: string;
  content: string;
  attachments?: string[];
}

export const socketHandler = (io: Server): void => {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const payload = verifyToken(token) as { sub: string };
      socket.data.user = { id: payload.sub };
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    socket.on('joinRoom', (roomId: string) => {
      if (!roomId) return;
      socket.join(roomId);
    });

    socket.on('leaveRoom', (roomId: string) => {
      if (!roomId) return;
      socket.leave(roomId);
    });

    socket.on('sendMessage', async (payload: IMessagePayload, callback: (response: { success: boolean; error?: string }) => void) => {
      if (!socket.data.user?.id) {
        callback({ success: false, error: 'Unauthorized' });
        return;
      }

      if (!payload.roomId || !payload.content) {
        callback({ success: false, error: 'Invalid message payload' });
        return;
      }

      try {
        const message = await Message.create({
          sender: socket.data.user.id,
          roomId: payload.roomId,
          content: payload.content,
          attachments: payload.attachments || []
        });

        const populatedMessage = await message.populate('sender', 'name avatarUrl');
        io.to(payload.roomId).emit('newMessage', populatedMessage);
        callback({ success: true });
      } catch (error) {
        callback({ success: false, error: 'Unable to send message' });
      }
    });
  });
};
