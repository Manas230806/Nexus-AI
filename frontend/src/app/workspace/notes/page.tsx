'use client';

import { useState } from 'react';
import { Plus, Search, FileText, MoreVertical, X, Save, Trash2, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Shell from '../../../components/Shell';
import { useUser, useNotes } from '../../../hooks/useSupabase';

export default function NotesPage() {
  const { user } = useUser();
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes(user?.id || null);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const filteredNotes = notes.filter(n => 
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

  const handleSave = async () => {
    if (!title.trim()) return;
    const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
    
    if (editingNote) {
      await updateNote(editingNote.id, title, content, tagsArray);
    } else {
      await addNote(title, content, tagsArray);
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(id);
    }
    setOpenDropdown(null);
  };

  return (
    <Shell>
      <div className="flex h-full w-full flex-col p-6 lg:p-8" onClick={() => setOpenDropdown(null)}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-strong)] tracking-tight">Personal Notes</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Capture ideas, meeting minutes, and personal tasks.</p>
          </div>
          
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
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-10 scrollbar-hide">
          {loading && <div className="col-span-full text-center py-10 text-[var(--text-muted)]">Loading notes...</div>}
          
          {!loading && filteredNotes.map((note) => (
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
                        onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
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
          
          {!loading && filteredNotes.length === 0 && (
            <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--border-color-strong)] bg-[var(--bg-panel)]/50">
              <FileText className="h-10 w-10 text-slate-600 mb-3" />
              <p className="text-[var(--text-muted)]">No notes found. Create your first note!</p>
            </div>
          )}
        </div>
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
                  onClick={handleSave}
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
