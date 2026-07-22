'use client';

import { useEffect, useState } from 'react';
import api from '../lib/api';
import { getSocket } from '../lib/socket';

export type Message = {
  _id: string;
  sender: { _id: string; name: string; avatarUrl?: string };
  content: string;
  roomId: string;
  attachments: string[];
  createdAt: string;
};

export const useMessages = (roomId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready'>('idle');

  useEffect(() => {
    if (!roomId) return;
    setStatus('loading');

    const fetchMessages = async () => {
      const response = await api.get(`/messages/${roomId}`);
      setMessages(response.data.messages);
      setStatus('ready');
    };

    fetchMessages();

    let socket;
    try {
      socket = getSocket();
    } catch (error) {
      console.error('Socket.IO connection error:', error);
      return;
    }

    socket.emit('joinRoom', roomId);
    socket.on('newMessage', (message: Message) => {
      if (message.roomId === roomId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket?.emit('leaveRoom', roomId);
      socket?.off('newMessage');
    };
  }, [roomId]);

  const sendMessage = async (content: string) => {
    if (!roomId || !content.trim()) return;

    const socket = getSocket();
    return new Promise<void>((resolve, reject) => {
      socket.emit('sendMessage', { roomId, content }, (response: { success: boolean; error?: string }) => {
        if (response?.success) {
          resolve();
        } else {
          reject(new Error(response?.error || 'Failed to send message'));
        }
      });
    });
  };

  return { messages, status, sendMessage };
};
