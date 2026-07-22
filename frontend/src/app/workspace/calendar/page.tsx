'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import Shell from '../../../components/Shell';
import { motion, AnimatePresence } from 'framer-motion';

type Event = {
  id: string;
  title: string;
  time: string;
  date: number;
  color: string;
};

const initialEvents: Event[] = [
  { id: '1', title: 'Product Sync', time: '10:00 AM', date: 15, color: 'bg-sky-500' },
  { id: '2', title: 'Design Review', time: '2:30 PM', date: 17, color: 'bg-violet-500' },
  { id: '3', title: 'Weekly Standup', time: '9:00 AM', date: 18, color: 'bg-emerald-500' },
  { id: '4', title: 'Client Pitch', time: '1:00 PM', date: 22, color: 'bg-amber-500' },
];

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [isAdding, setIsAdding] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  const currentDate = today.getDate();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startingDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const monthName = today.toLocaleString('default', { month: 'long' });

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !selectedDate) return;
    
    const colors = ['bg-sky-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    setEvents([...events, {
      id: Math.random().toString(),
      title: newEventTitle,
      time: '12:00 PM',
      date: selectedDate,
      color: randomColor
    }]);
    
    // Generate Google Calendar Link
    const year = currentYear;
    const monthStr = (currentMonth + 1).toString().padStart(2, '0');
    const dayStr = selectedDate.toString().padStart(2, '0');
    // Format: YYYYMMDDTHHmmssZ
    const startTime = `${year}${monthStr}${dayStr}T120000Z`;
    const endTime = `${year}${monthStr}${dayStr}T130000Z`;
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(newEventTitle)}&dates=${startTime}/${endTime}`;
    window.open(googleCalendarUrl, '_blank');

    setNewEventTitle('');
    setIsAdding(false);
    setSelectedDate(null);
  };

  return (
    <Shell>
      <div className="flex h-full w-full flex-col space-y-6 p-6 lg:p-8">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-[28px] border border-[var(--border-color-strong)] bg-[var(--bg-hover)] p-6 backdrop-blur-md">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-strong)] tracking-tight">{monthName} {currentYear}</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Manage your team's schedule and upcoming milestones.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-[var(--border-color-strong)] bg-[var(--bg-panel)]/50 p-1">
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)] transition">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-sm font-medium text-[var(--text-main)]">Today</span>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)] transition">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-5 text-sm font-semibold text-[var(--text-strong)] shadow-lg shadow-sky-500/20 transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add Event
            </button>
          </div>
        </div>

        {/* Add Event Modal overlay */}
        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--bg-panel)]/60 backdrop-blur-sm p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-md rounded-[32px] border border-[var(--border-color-strong)] bg-[var(--bg-panel)] p-6 shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--text-strong)]">Create New Event</h3>
                </div>
                
                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Event Title</label>
                    <input 
                      autoFocus
                      type="text" 
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="e.g. Brainstorming Session"
                      className="mt-2 w-full rounded-2xl border border-[var(--border-color-strong)] bg-[var(--bg-hover)] px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Date (1-30)</label>
                    <input 
                      type="number" 
                      min="1" max="30"
                      value={selectedDate || ''}
                      onChange={(e) => setSelectedDate(parseInt(e.target.value))}
                      placeholder="Select a day..."
                      className="mt-2 w-full rounded-2xl border border-[var(--border-color-strong)] bg-[var(--bg-hover)] px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500/50"
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                    <button 
                      type="button" 
                      onClick={() => setIsAdding(false)}
                      className="rounded-full px-5 py-2.5 text-sm font-medium text-[var(--text-main)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-strong)] transition"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={!newEventTitle || !selectedDate}
                      className="rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-[var(--text-strong)] shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Event
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Calendar Grid */}
        <div className="flex-1 rounded-[28px] border border-[var(--border-color-strong)] bg-[var(--bg-panel)]/40 p-6 shadow-xl backdrop-blur-xl flex flex-col min-h-[500px]">
          
          <div className="grid grid-cols-7 gap-4 mb-4 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{day}</div>
            ))}
          </div>

          <div className="grid flex-1 grid-cols-7 gap-px rounded-2xl overflow-hidden bg-[var(--bg-hover)] border border-[var(--border-color-strong)]">
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-[var(--bg-panel)]/50 min-h-[100px]" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = events.filter(e => e.date === day);
              const isToday = day === currentDate;

              return (
                <div 
                  key={day} 
                  className={`bg-[var(--bg-panel)]/60 p-2 min-h-[100px] transition-colors hover:bg-[var(--bg-panel)] group ${isToday ? 'relative' : ''}`}
                  onClick={() => {
                    setSelectedDate(day);
                    setIsAdding(true);
                  }}
                >
                  {isToday && <div className="absolute inset-0 border-2 border-sky-500/50 rounded-lg pointer-events-none" />}
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${isToday ? 'bg-sky-500 text-[var(--text-strong)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>
                    {day}
                  </div>
                  
                  <div className="mt-2 flex flex-col gap-1">
                    {dayEvents.map(event => (
                      <motion.div 
                        key={event.id}
                        layoutId={event.id}
                        className={`truncate rounded px-1.5 py-1 text-[10px] font-medium text-[var(--text-strong)] shadow-sm ${event.color}`}
                        title={`${event.title} at ${event.time}`}
                      >
                        {event.title}
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </Shell>
  );
}
