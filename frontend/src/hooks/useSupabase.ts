import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase.from('users').select('*').eq('id', userId).single();
      if (data) {
        setUserProfile(data);
      }
      setLoading(false);
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, userProfile, loading };
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch initial messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          users (
            name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
        
      if (data) setMessages(data);
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`room:${conversationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the user data for the new message
            supabase
              .from('users')
              .select('name, avatar_url')
              .eq('id', payload.new.sender_id)
              .single()
              .then(({ data: userData }: { data: any }) => {
                const newMessage = {
                  ...payload.new,
                  users: userData
                };
                setMessages((prev) => [...prev, newMessage]);
              });
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) => prev.map(msg => msg.id === payload.new.id ? { ...msg, content: payload.new.content } : msg));
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = async (content: string, senderId: string) => {
    if (!conversationId || !content.trim()) return;
    
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    });
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return;
    await supabase.from('messages').update({ content: newContent }).eq('id', messageId);
  };

  const forwardMessage = async (content: string, targetConversationId: string, senderId: string) => {
    if (!content.trim()) return;
    await supabase.from('messages').insert({
      conversation_id: targetConversationId,
      sender_id: senderId,
      content,
    });
  };

  return { messages, loading, sendMessage, editMessage, forwardMessage };
}

export function useNotes(userId: string | null) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    if (!userId) {
      setNotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) setNotes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [userId]);

  const addNote = async (title: string, content: string, tags: string[] = []) => {
    if (!userId) return null;
    const preview = content.slice(0, 100) + (content.length > 100 ? '...' : '');
    const { data, error } = await supabase.from('notes').insert({
      user_id: userId,
      title,
      content,
      preview,
      tags
    }).select().single();
    
    if (error) {
      console.error('Error adding note:', error);
      alert('Error adding note: ' + error.message);
    }
    
    if (data) setNotes(prev => [data, ...prev]);
    return data;
  };

  const updateNote = async (id: string, title: string, content: string, tags: string[] = []) => {
    const preview = content.slice(0, 100) + (content.length > 100 ? '...' : '');
    const { data, error } = await supabase.from('notes').update({
      title,
      content,
      preview,
      tags
    }).eq('id', id).select().single();

    if (error) {
      console.error('Error updating note:', error);
      alert('Error updating note: ' + error.message);
    }

    if (data) {
      setNotes(prev => prev.map(n => n.id === id ? data : n));
    }
    return data;
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) {
      console.error('Error deleting note:', error);
      alert('Error deleting note: ' + error.message);
    } else {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  return { notes, loading, addNote, updateNote, deleteNote, refreshNotes: fetchNotes };
}
