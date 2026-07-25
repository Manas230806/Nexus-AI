'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, FileText, MoreVertical, X, Save, Trash2, Edit, CheckCircle2, Circle, Clock, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Shell from '../../../components/Shell';
import { useUser, useNotes, useTodos } from '../../../hooks/useSupabase';

export default function NotesPage() {
  const { user } = useUser();
  const { notes, loading: notesLoading, addNote, updateNote, deleteNote } = useNotes(user?.id || null);
  const { todos, loading: todosLoading, addTodo, toggleTodo, deleteTodo } = useTodos(user?.id || null);
  
  const [activeTab, setActiveTab] = useState<'notes' | 'todos'>('notes');
  const [search, setSearch] = useState('');
  
  // Note states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Todo states
  const [newTask, setNewTask] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  // Reminders Effect
  useEffect(() => {
    if (activeTab === 'todos' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [activeTab]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeString = `${currentHours}:${currentMinutes}`;

      todos.forEach(todo => {
        if (!todo.completed && todo.reminderTime === currentTimeString) {
          const notifiedKey = `notified_${todo.id}_${now.toDateString()}`;
          if (!localStorage.getItem(notifiedKey)) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Task Reminder', {
                body: todo.task,
                icon: '/favicon.ico'
              });
            } else {
              alert(`Reminder: ${todo.task}`);
            }
            localStorage.setItem(notifiedKey, 'true');
          }
        }
      });
    }, 30000); // check every 30 seconds

    return () => clearInterval(interval);
  }, [todos]);

  const filteredNotes = notes
    .filter(n => n.title !== '__SYSTEM_DAILY_TODO__')
    .filter(n => 
      n.title.toLowerCase().includes(search.toLowerCase()) || 
      (n.preview && n.preview.toLowerCase().includes(search.toLowerCase())) ||
      (n.tags && n.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase())))
    );

  const openNewNoteModal = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setTags('');
    setIsModalOpen(true);
    setOpenDropdown(null);
  };

  const openEditModal = (note: any) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content || '');
    setTags(note.tags ? note.tags.join(', ') : '');
    setIsModalOpen(true);
    setOpenDropdown(null);
  };

  const handleSaveNote = async () => {
    if (!title.trim()) return;
    const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
    
    if (editingNote) {
      await updateNote(editingNote.id, title, content, tagsArray);
    } else {
      await addNote(title, content, tagsArray);
    }
    
    setIsModalOpen(false);
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(id);
    }
    setOpenDropdown(null);
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    await addTodo(newTask, reminderTime || null);
    setNewTask('');
    setReminderTime('');
  };

  return (
    <Shell>
      <div className="flex h-full w-full flex-col p-6 lg:p-8" onClick={() => setOpenDropdown(null)}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-strong)] tracking-tight">Personal Workspace</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Manage your notes and daily tasks.</p>
          </div>
          
          {activeTab === 'notes' && (
            <div className="flex items-center gap-3">
              <div className="relative flex items-center rounded-xl bg-[var(--bg-panel)] border border-[var(--border-color)] px-3 py-2 transition-colors focus-within:border-[rgb(var(--accent-main))]/50">
                <Search className="h-4 w-4 text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  placeholder="Search notes..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ml-2 w-48 bg-transparent text-sm text-[var(--text-main)] placeholder-slate-500 outline-none"
                />
              </div>
              <button 
                onClick={openNewNoteModal}
                className="flex h-10 items-center gap-2 rounded-xl bg-[rgb(var(--accent-main))] px-4 text-sm font-semibold text-[var(--text-strong)] shadow-lg shadow-[rgb(var(--accent-main))]/20 transition hover:bg-[rgb(var(--accent-main))]/90"
              >
                <Plus className="h-4 w-4" />
                New Note
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-color)] mb-6">
          <button 
            onClick={() => setActiveTab('notes')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'notes' ? 'border-[rgb(var(--accent-main))] text-[rgb(var(--accent-main))]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
          >
            Notes
          </button>
          <button 
            onClick={() => setActiveTab('todos')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'todos' ? 'border-[rgb(var(--accent-main))] text-[rgb(var(--accent-main))]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
          >
            Daily To-Do List
          </button>
        </div>

        {/* Notes View */}
        {activeTab === 'notes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-10 scrollbar-hide">
            {notesLoading && <div className="col-span-full text-center py-10 text-[var(--text-muted)]">Loading notes...</div>}
            
            {!notesLoading && filteredNotes.map((note) => (
              <motion.div 
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                className="group relative flex flex-col rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)]/80 p-6 backdrop-blur-xl transition-all hover:border-[rgb(var(--accent-main))]/30 hover:shadow-[0_10px_40px_rgba(79,70,229,0.1)] cursor-pointer"
                onClick={() => openEditModal(note)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 text-[rgb(var(--accent-main))]">
                    <FileText className="h-5 w-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === note.id ? null : note.id); }}
                      className="text-[var(--text-muted)] hover:text-[var(--text-strong)] opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {openDropdown === note.id && (
                      <div className="absolute right-0 top-6 z-10 w-36 rounded-xl border border-[var(--border-color-strong)] bg-[var(--bg-panel)] p-1 shadow-xl">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditModal(note); }}
                          className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                          className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-[var(--text-strong)] leading-tight mb-2">{note.title}</h3>
                <p className="text-sm text-[var(--text-muted)] line-clamp-3 mb-6 flex-1">
                  {note.preview || 'No content...'}
                </p>
                
                <div className="flex items-center gap-2 mt-auto flex-wrap">
                  {note.tags && note.tags.map((tag: string) => (
                    <span key={tag} className="rounded-md bg-[var(--bg-hover)] px-2 py-1 text-xs font-medium text-[var(--text-main)] border border-[var(--border-color)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
            
            {!notesLoading && filteredNotes.length === 0 && (
              <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--border-color-strong)] bg-[var(--bg-panel)]/50">
                <FileText className="h-10 w-10 text-slate-600 mb-3" />
                <p className="text-[var(--text-muted)]">No notes found. Create your first note!</p>
              </div>
            )}
          </div>
        )}

        {/* To-Do View */}
        {activeTab === 'todos' && (
          <div className="flex flex-col flex-1 max-w-3xl mx-auto w-full">
            <form onSubmit={handleAddTodo} className="flex gap-3 mb-8">
              <input 
                type="text" 
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                placeholder="What needs to be done today?" 
                className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-4 py-3 text-[var(--text-main)] outline-none focus:border-[rgb(var(--accent-main))] shadow-sm"
              />
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--text-muted)]">
                  <Clock className="w-4 h-4" />
                </div>
                <input 
                  type="time" 
                  value={reminderTime}
                  onChange={e => setReminderTime(e.target.value)}
                  className="h-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] pl-10 pr-4 py-3 text-[var(--text-main)] outline-none focus:border-[rgb(var(--accent-main))] shadow-sm"
                />
              </div>
              <button 
                type="submit"
                disabled={!newTask.trim()}
                className="rounded-xl bg-[rgb(var(--accent-main))] px-6 py-3 font-bold text-[var(--text-strong)] shadow-lg hover:opacity-90 disabled:opacity-50 transition"
              >
                Add
              </button>
            </form>

            {todosLoading ? (
              <div className="text-center py-10 text-[var(--text-muted)]">Loading tasks...</div>
            ) : (
              <div className="space-y-6">
                {/* Active Tasks */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Active Tasks</h3>
                  <div className="space-y-2">
                    {todos.filter(t => !t.completed).length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)] italic">No active tasks. You're all caught up!</p>
                    ) : (
                      todos.filter(t => !t.completed).map(todo => (
                        <div key={todo.id} className="group flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 transition hover:border-[rgb(var(--accent-main))]/50">
                          <div className="flex items-center gap-4">
                            <button onClick={() => toggleTodo(todo.id)} className="text-[var(--text-muted)] hover:text-[rgb(var(--accent-main))] transition">
                              <Circle className="w-6 h-6" />
                            </button>
                            <span className="text-[var(--text-strong)]">{todo.task}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            {todo.reminderTime && (
                              <div className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                                <Bell className="w-3.5 h-3.5" />
                                {todo.reminderTime}
                              </div>
                            )}
                            <button onClick={() => deleteTodo(todo.id)} className="text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Completed Tasks */}
                {todos.filter(t => t.completed).length > 0 && (
                  <div className="pt-4 border-t border-[var(--border-color)]">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Completed</h3>
                    <div className="space-y-2 opacity-60">
                      {todos.filter(t => t.completed).map(todo => (
                        <div key={todo.id} className="group flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4">
                          <div className="flex items-center gap-4">
                            <button onClick={() => toggleTodo(todo.id)} className="text-[rgb(var(--accent-main))]">
                              <CheckCircle2 className="w-6 h-6" />
                            </button>
                            <span className="text-[var(--text-main)] line-through">{todo.task}</span>
                          </div>
                          <button onClick={() => deleteTodo(todo.id)} className="text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Note Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl rounded-[32px] border border-[var(--border-color-strong)] bg-[var(--bg-main)] p-6 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-4">
                <h2 className="text-xl font-bold text-[var(--text-strong)]">{editingNote ? 'Edit Note' : 'New Note'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note Title"
                    className="w-full bg-transparent text-2xl font-bold text-[var(--text-strong)] placeholder-slate-500 outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Tags (comma separated, e.g. Design, Client, Strategy)"
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-4 py-2 text-sm text-[var(--text-main)] placeholder-slate-500 outline-none focus:border-[rgb(var(--accent-main))]/50"
                  />
                </div>
                <div className="flex-1 min-h-[300px]">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your note here..."
                    className="w-full h-full min-h-[300px] resize-none rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 text-[15px] leading-relaxed text-[var(--text-main)] placeholder-slate-500 outline-none focus:border-[rgb(var(--accent-main))]/50"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveNote}
                  disabled={!title.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[rgb(var(--accent-main))] px-6 py-2.5 text-sm font-semibold text-[var(--text-strong)] shadow-lg shadow-[rgb(var(--accent-main))]/20 transition hover:bg-[rgb(var(--accent-main))]/90 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Save Note
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Shell>
  );
}
