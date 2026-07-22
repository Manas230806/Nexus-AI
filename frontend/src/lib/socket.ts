'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentToken: string | null = null;

export const getSocket = (): Socket => {
  if (typeof window === 'undefined') {
    throw new Error('Socket can only be initialized in the browser.');
  }

  const token = localStorage.getItem('nexus_ai_token');
  if (!token) {
    throw new Error('Missing auth token for socket connection.');
  }

  if (!socket || currentToken !== token) {
    if (socket) {
      socket.disconnect();
    }

    currentToken = token;
    socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000', {
      transports: ['websocket'],
      auth: { token }
    });
  }

  return socket;
};

export const closeSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
};
