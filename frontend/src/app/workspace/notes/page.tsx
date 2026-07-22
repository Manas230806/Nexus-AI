'use client';

import { useState } from 'react';
import { Plus, Search, FileText, MoreVertical, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import Shell from '../../../components/Shell';
type Note = {
  id: string;
  title: string;
  preview: string;
  date: string;
  tags: string[];
};

const initialNotes: Note[] = [
  { id: '1', title: 'Q4 Product Strategy', preview: 'Key objectives for the upcoming quarter including AI integration and performance...', date: 'Today', tags: ['Strategy', 'Planning'] },
  { id: '2', title: 'Design System Update', preview: 'Notes from the sync with Sarah regarding the new glassmorphism components...', date: 'Yesterday', tags: ['Design', 'UI'] },
  { id: '3', title: 'Client Feedback: Alpha', preview: 'The client loved the new dashboard but requested a few changes to the data export...', date: 'Oct 12', tags: ['Client', 'Feedback'] },
  { id: '4', title: 'Weekly Engineering Sync', preview: 'Backend migration is 80% complete. Need to unblock the frontend team on the new API...', date: 'Oct 10', tags: ['Engineering'] },
];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [search, setSearch] = useState('');
  
  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.preview.toLowerCase().includes(search.toLowerCase()));

  return (
    <Shell>
      <div className="flex h-full w-full flex-col p-6 lg:p-8">
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
          <button className="flex h-10 items-center gap-2 rounded-xl bg-[rgb(var(--accent-main))] px-4 text-sm font-semibold text-[var(--text-strong)] shadow-lg shadow-[rgb(var(--accent-main))]/20 transition hover:bg-[rgb(var(--accent-main))]">
            <Plus className="h-4 w-4" />
            New Note
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-10 scrollbar-hide">
        {filteredNotes.map((note) => (
          <motion.div 
            key={note.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            className="group relative flex flex-col rounded-[24px] border border-[var(--border-color)] bg-[var(--bg-panel)]/80 p-6 backdrop-blur-xl transition-all hover:border-[rgb(var(--accent-main))]/30 hover:shadow-[0_10px_40px_rgba(79,70,229,0.1)] cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 text-[rgb(var(--accent-main))]">
                <FileText className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wider">{note.date}</span>
              </div>
              <button className="text-[var(--text-muted)] hover:text-[var(--text-strong)] opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
            
            <h3 className="text-lg font-semibold text-[var(--text-strong)] leading-tight mb-2">{note.title}</h3>
            <p className="text-sm text-[var(--text-muted)] line-clamp-3 mb-6 flex-1">
              {note.preview}
            </p>
            
            <div className="flex items-center gap-2 mt-auto">
              {note.tags.map(tag => (
                <span key={tag} className="rounded-md bg-[var(--bg-hover)] px-2 py-1 text-xs font-medium text-[var(--text-main)] border border-[var(--border-color)]">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
        
        {filteredNotes.length === 0 && (
          <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--border-color-strong)]">
            <FileText className="h-10 w-10 text-slate-600 mb-3" />
            <p className="text-[var(--text-muted)]">No notes found matching your search.</p>
          </div>
        )}
      </div>
    </div>
    </Shell>
  );
}
