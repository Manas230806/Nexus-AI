import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

let cachedUser: User | null = null;
let cachedUserProfile: any = null;

export function useUser() {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [userProfile, setUserProfile] = useState<any>(cachedUserProfile);
  const [loading, setLoading] = useState(!cachedUserProfile);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data } = await supabase.from('users').select('*').eq('id', userId).single();
      if (data) {
        cachedUserProfile = data;
        setUserProfile(data);
      }
      setLoading(false);
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      cachedUser = session?.user ?? null;
      setUser(cachedUser);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      cachedUser = session?.user ?? null;
      setUser(cachedUser);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        cachedUserProfile = null;
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateProfile = async (updates: { name?: string, username?: string, avatar_url?: string }) => {
    if (!user) return { error: 'Not logged in' };
    const { data, error } = await supabase.from('users').update(updates).eq('id', user.id).select().single();
    if (data) {
      cachedUserProfile = data;
      setUserProfile(data);
    }
    return { data, error };
  };

  return { user, userProfile, loading, updateProfile };
}

export function usePresence(userId: string | null) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) {
      setOnlineUsers(new Set());
      return;
    }

    const channel = supabase.channel('global_presence', {
      config: { presence: { key: userId } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeUsers = new Set<string>();
        for (const key in state) {
          activeUsers.add(key);
        }
        setOnlineUsers(activeUsers);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return onlineUsers;
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
            setMessages((prev) => prev.map(msg => String(msg.id) === String(payload.new.id) ? { ...msg, content: payload.new.content ?? msg.content } : msg));
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter(msg => String(msg.id) !== String(payload.old.id)));
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
    
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    });
    if (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error.message);
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return;

    // Optimistically update local state for instant feedback
    setMessages((prev) => prev.map(msg => String(msg.id) === String(messageId) ? { ...msg, content: newContent } : msg));

    const { data, error } = await supabase.from('messages').update({ content: newContent }).eq('id', messageId).select();
    
    if (error) {
      console.error('Error editing message:', error);
      alert('Error editing message: ' + error.message);
    } else if (data && data.length === 0) {
      console.error('Message not updated. RLS policy might be blocking this.');
      alert('Failed to edit message. You may not have permission to edit this message.');
    }
  };

  const forwardMessage = async (content: string, targetConversationId: string, senderId: string) => {
    if (!content.trim()) return;
    await supabase.from('messages').insert({
      conversation_id: targetConversationId,
      sender_id: senderId,
      content,
    });
  };

  const deleteMessageForEveryone = async (messageId: string) => {
    // Optimistically update local state for instant feedback
    setMessages((prev) => prev.map(msg => String(msg.id) === String(messageId) ? { ...msg, content: '[This message was deleted]' } : msg));

    const { error } = await supabase.from('messages').update({ content: '[This message was deleted]' }).eq('id', messageId);
    
    if (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message: ' + error.message);
    }
  };

  return { messages, loading, sendMessage, editMessage, forwardMessage, deleteMessageForEveryone };
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

export function useWorkspaceFiles(userId: string | null) {
  const [folders, setFolders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkspace = async () => {
    if (!userId) {
      setFolders([]);
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const [foldersRes, itemsRes] = await Promise.all([
      supabase.from('workspace_folders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('workspace_items').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    ]);

    if (foldersRes.data) setFolders(foldersRes.data);
    if (itemsRes.data) setItems(itemsRes.data);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkspace();
  }, [userId]);

  const createFolder = async (name: string) => {
    if (!userId) return;
    const { data, error } = await supabase.from('workspace_folders').insert({
      user_id: userId,
      name
    }).select().single();

    if (error) {
      console.error('Error creating folder:', error);
      alert('Error creating folder: ' + error.message);
    } else if (data) {
      setFolders(prev => [data, ...prev]);
    }
    return data;
  };

  const deleteFolder = async (id: string) => {
    const { error } = await supabase.from('workspace_folders').delete().eq('id', id);
    if (error) {
      console.error('Error deleting folder:', error);
      alert('Error deleting folder: ' + error.message);
    } else {
      setFolders(prev => prev.filter(f => f.id !== id));
      setItems(prev => prev.filter(i => i.folder_id !== id));
    }
  };

  const createItem = async (folderId: string, name: string, type: string, size: string, file?: File | null, content?: string) => {
    if (!userId) return;
    
    let fileUrl = null;

    if (file && (type === 'document' || type === 'image')) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${folderId}/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('workspace_files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        alert('Error uploading file: ' + uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('workspace_files')
        .getPublicUrl(fileName);
        
      fileUrl = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase.from('workspace_items').insert({
      folder_id: folderId,
      user_id: userId,
      name,
      type,
      size,
      file_url: fileUrl,
      content: content || null
    }).select().single();

    if (error) {
      console.error('Error creating item:', error);
      alert('Error creating item: ' + error.message);
    } else if (data) {
      setItems(prev => [data, ...prev]);
    }
    return data;
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('workspace_items').delete().eq('id', id);
    if (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item: ' + error.message);
    } else {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  return { folders, items, loading, createFolder, deleteFolder, createItem, deleteItem, refreshWorkspace: fetchWorkspace };
}

export interface Todo {
  id: string;
  task: string;
  reminderTime: string | null;
  completed: boolean;
  createdAt: string;
}

export function useTodos(userId: string | null) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [todoNoteId, setTodoNoteId] = useState<string | null>(null);

  const fetchTodos = async () => {
    if (!userId) {
      setTodos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    
    // Look for the special note that stores todos
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('title', '__SYSTEM_DAILY_TODO__')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching todos note:', error);
    }

    if (data) {
      setTodoNoteId(data.id);
      try {
        const parsedTodos = JSON.parse(data.content);
        setTodos(Array.isArray(parsedTodos) ? parsedTodos : []);
      } catch (e) {
        setTodos([]);
      }
    } else {
      // Create the special note if it doesn't exist
      const { data: newData, error: createError } = await supabase.from('notes').insert({
        user_id: userId,
        title: '__SYSTEM_DAILY_TODO__',
        content: '[]',
        preview: 'System note for storing daily to-dos. Do not delete.',
        tags: ['system', 'hidden']
      }).select().single();
      
      if (!createError && newData) {
        setTodoNoteId(newData.id);
      }
      setTodos([]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchTodos();
  }, [userId]);

  const saveTodos = async (newTodos: Todo[], noteId: string) => {
    const { error } = await supabase.from('notes').update({
      content: JSON.stringify(newTodos)
    }).eq('id', noteId);
    
    if (error) {
      console.error('Error saving todos:', error);
    }
  };

  const addTodo = async (task: string, reminderTime: string | null) => {
    if (!todoNoteId) return;
    const newTodo: Todo = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      task,
      reminderTime,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    const updatedTodos = [newTodo, ...todos];
    setTodos(updatedTodos);
    await saveTodos(updatedTodos, todoNoteId);
  };

  const toggleTodo = async (id: string) => {
    if (!todoNoteId) return;
    const updatedTodos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTodos(updatedTodos);
    await saveTodos(updatedTodos, todoNoteId);
  };

  const deleteTodo = async (id: string) => {
    if (!todoNoteId) return;
    const updatedTodos = todos.filter(t => t.id !== id);
    setTodos(updatedTodos);
    await saveTodos(updatedTodos, todoNoteId);
  };

  return { todos, loading, addTodo, toggleTodo, deleteTodo, refreshTodos: fetchTodos };
}

export interface MemoryItem {
  id: string;
  type: 'bank' | 'document' | 'note';
  title: string;
  data: any; 
  createdAt: string;
}

export function useMemoryVault(userId: string | null) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [vaultNoteId, setVaultNoteId] = useState<string | null>(null);

  const fetchVault = async () => {
    if (!userId) {
      setMemories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('title', '__SYSTEM_MEMORY_VAULT__')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching vault note:', error);
    }

    if (data) {
      setVaultNoteId(data.id);
      try {
        const parsed = JSON.parse(data.content);
        setMemories(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setMemories([]);
      }
    } else {
      const { data: newData, error: createError } = await supabase.from('notes').insert({
        user_id: userId,
        title: '__SYSTEM_MEMORY_VAULT__',
        content: '[]',
        preview: 'System note for secure memory vault.',
        tags: ['system', 'hidden']
      }).select().single();
      
      if (!createError && newData) {
        setVaultNoteId(newData.id);
      }
      setMemories([]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchVault();
  }, [userId]);

  const saveMemories = async (newMemories: MemoryItem[], noteId: string) => {
    const { error } = await supabase.from('notes').update({
      content: JSON.stringify(newMemories)
    }).eq('id', noteId);
    
    if (error) {
      console.error('Error saving vault:', error);
    }
  };

  const addMemory = async (type: 'bank' | 'document' | 'note', title: string, dataObj: any, file?: File | null) => {
    if (!vaultNoteId || !userId) return;
    
    if (file && type === 'document') {
      const fileExt = file.name.split('.').pop();
      const fileName = `vault_${userId}/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('workspace_files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading secure file:', uploadError);
        alert('Error uploading file: ' + uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('workspace_files')
        .getPublicUrl(fileName);
        
      dataObj.fileUrl = publicUrlData.publicUrl;
      dataObj.fileExt = fileExt;
      dataObj.fileName = file.name;
    }

    const newMemory: MemoryItem = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      type,
      title,
      data: dataObj,
      createdAt: new Date().toISOString()
    };
    
    const updated = [newMemory, ...memories];
    setMemories(updated);
    await saveMemories(updated, vaultNoteId);
  };

  const deleteMemory = async (id: string) => {
    if (!vaultNoteId) return;
    const updated = memories.filter(t => t.id !== id);
    setMemories(updated);
    await saveMemories(updated, vaultNoteId);
  };

  return { memories, loading, addMemory, deleteMemory, refreshVault: fetchVault };
}
