'use client';

import { useEffect, useState } from 'react';
import api, { setAuthToken } from '../lib/api';

const AUTH_TOKEN_KEY = 'nexus_ai_token';

export const useAuth = () => {
  const [user, setUser] = useState<{ id: string; email: string; name: string; avatarUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      setAuthToken(token);
      api.get('/auth/profile')
        .then((response) => setUser(response.data.user))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setAuthToken(token);
    setUser(user);
    return response;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
  };

  return { user, loading, login, logout };
};
