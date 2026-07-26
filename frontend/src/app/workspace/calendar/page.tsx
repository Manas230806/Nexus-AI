'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Users, Bell } from 'lucide-react';
import Shell from '../../../components/Shell';
import { motion, AnimatePresence } from 'framer-motion';

type Event = {
  id: string;
  title: string;
  time: string;
  date: number;
  color: string;
  isMeeting?: boolean;
  reminderSet?: boolean;
};

const initialEvents: Event[] = [
  { id: '1', title: 'Product Sync', time: '10:00', date: 15, color: 'bg-sky-500', isMeeting: true, reminderSet: false },
  { id: '2', title: 'Design Review', time: '14:30', date: 17, color: 'bg-violet-500', isMeeting: false, reminderSet: false },
  { id: '3', title: 'Weekly Standup', time: '09:00', date: 18, color: 'bg-emerald-500', isMeeting: true, reminderSet: true },
  { id: '4', title: 'Client Pitch', time: '13:00', date: 22, color: 'bg-amber-500', isMeeting: true, reminderSet: false },
];

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [isAdding, setIsAdding] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('12:00');
  const [isMeetingToggle, setIsMeetingToggle] = useState<boolean>(false);
  
  const [activeTab, setActiveTab] = useState<'calendar' | 'meetings'>('calendar');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'meetings') {
        setActiveTab('meetings');
        setIsMeetingToggle(true);
      }
    }
  }, []);

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
      time: selectedTime,
      date: selectedDate,
      color: randomColor,
      isMeeting: isMeetingToggle,
      reminderSet: false
    }]);
    
    setNewEventTitle('');
    setIsAdding(false);
    setSelectedDate(null);
    setSelectedTime('12:00');
    // If they were on the meetings tab, keep it checked for convenience
    if (activeTab !== 'meetings') {
      setIsMeetingToggle(false);
    }
  };

  const handleSetReminder = (eventId: string) => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setEvents(events.map(ev => ev.id === eventId ? { ...ev, reminderSet: true } : ev));
          new Notification("Reminder Set!", {
            body: "Nexus AI will notify you when this meeting starts.",
            icon: "/favicon.ico"
          });
        } else {
          alert("Please enable browser notifications to set meeting reminders.");
        }
      });
    } else {
      alert("Your browser does not support notifications.");
    }
  };

  const handleDeleteEvent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this?')) {
      setEvents(events.filter(ev => ev.id !== id));
    }
  };

  return (
    <Shell>
      <div className="flex flex-col space-y-6 p-4 sm:p-6 lg:p-8">
        
        {/* Header Tabs */}
        <div className="flex gap-6 border-b border-[var(--border-color-strong)]">
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`pb-4 text-lg font-semibold transition ${activeTab === 'calendar' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'}`}
          >
            Calendar View
          </button>
          <button 
            onClick={() => { setActiveTab('meetings'); setIsMeetingToggle(true); }}
            className={`pb-4 text-lg font-semibold transition ${activeTab === 'meetings' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'}`}
          >
            Upcoming Meetings
          </button>
        </div>

        {/* Action Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-[28px] border border-[var(--border-color-strong)] bg-[var(--bg-hover)] p-6 backdrop-blur-md">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-strong)] tracking-tight">{monthName} {currentYear}</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {activeTab === 'calendar' ? "Manage your team's schedule and upcoming milestones." : "Keep track of your scheduled meetings and set reminders."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'calendar' && (
              <div className="flex items-center gap-1 rounded-full border border-[var(--border-color-strong)] bg-[var(--bg-panel)]/50 p-1">
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)] transition">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 text-sm font-medium text-[var(--text-main)]">Today</span>
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)] transition">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
            <button 
              onClick={() => setIsAdding(true)}
              className={`flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold text-[var(--text-strong)] shadow-lg transition hover:opacity-90 ${activeTab === 'meetings' ? 'bg-gradient-to-r from-violet-500 to-purple-600 shadow-violet-500/20' : 'bg-gradient-to-r from-sky-500 to-violet-500 shadow-sky-500/20'}`}
            >
              <Plus className="h-4 w-4" />
              {activeTab === 'meetings' ? 'Schedule Meeting' : 'Add Event'}
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
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isMeetingToggle ? 'bg-violet-500/20 text-violet-400' : 'bg-sky-500/20 text-sky-400'}`}>
                    {isMeetingToggle ? <Users className="h-5 w-5" /> : <CalendarIcon className="h-5 w-5" />}
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--text-strong)]">{isMeetingToggle ? 'Schedule Meeting' : 'Create New Event'}</h3>
                </div>
                
                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{isMeetingToggle ? 'Meeting Topic' : 'Event Title'}</label>
                    <input 
                      autoFocus
                      type="text" 
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder={isMeetingToggle ? "e.g. Sync with John" : "e.g. Brainstorming Session"}
                      className="mt-2 w-full rounded-2xl border border-[var(--border-color-strong)] bg-[var(--bg-hover)] px-4 py-3 text-sm text-[var(--text-strong)] placeholder-[var(--text-muted)] outline-none focus:border-sky-500/50"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Date (1-30)</label>
                      <input 
                        type="number" 
                        min="1" max="30"
                        value={selectedDate || ''}
                        onChange={(e) => setSelectedDate(parseInt(e.target.value))}
                        placeholder="Day..."
                        className="mt-2 w-full rounded-2xl border border-[var(--border-color-strong)] bg-[var(--bg-hover)] px-4 py-3 text-sm text-[var(--text-strong)] placeholder-[var(--text-muted)] outline-none focus:border-sky-500/50"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Time</label>
                      <input 
                        type="time" 
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-[var(--border-color-strong)] bg-[var(--bg-hover)] px-4 py-3 text-sm text-[var(--text-strong)] outline-none focus:border-sky-500/50 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-color)] cursor-pointer" onClick={() => setIsMeetingToggle(!isMeetingToggle)}>
                     <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isMeetingToggle ? 'bg-violet-500 border-violet-500' : 'border-[var(--border-color-strong)] bg-[var(--bg-hover)]'}`}>
                       {isMeetingToggle && <span className="text-white text-xs">✓</span>}
                     </div>
                     <span className="text-sm font-medium text-[var(--text-main)]">This is a Meeting (Send Reminders)</span>
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
                      disabled={!newEventTitle || !selectedDate || !selectedTime}
                      className="rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-[var(--text-strong)] shadow-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Views */}
        {activeTab === 'calendar' ? (
          <div className="flex flex-col rounded-[28px] border border-[var(--border-color-strong)] bg-[var(--bg-panel)]/40 p-6 shadow-xl backdrop-blur-xl">
            
            <div className="grid grid-cols-7 gap-4 mb-4 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px rounded-2xl overflow-hidden bg-[var(--bg-hover)] border border-[var(--border-color-strong)]">
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
                          layoutId={`event-${event.id}`}
                          className={`truncate rounded px-1.5 py-1 text-[10px] font-medium text-white shadow-sm flex items-center justify-between gap-1 ${event.color} relative group/event`}
                          title={`${event.title} at ${event.time}`}
                        >
                          <div className="flex items-center gap-1 truncate">
                            {event.isMeeting && <Users className="w-2.5 h-2.5 inline shrink-0" />}
                            <span className="truncate">{event.time} - {event.title}</span>
                          </div>
                          <button 
                            onClick={(e) => handleDeleteEvent(e, event.id)}
                            className="hidden group-hover/event:flex items-center justify-center shrink-0 w-4 h-4 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                          >
                            ×
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col rounded-[28px] border border-[var(--border-color-strong)] bg-[var(--bg-panel)]/40 p-6 shadow-xl backdrop-blur-xl">
             <div className="max-w-4xl mx-auto space-y-4">
               {events.filter(e => e.isMeeting).length === 0 && (
                 <div className="text-center py-20">
                   <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
                   <p className="text-[var(--text-main)]">No upcoming meetings scheduled.</p>
                   <button onClick={() => { setIsAdding(true); setIsMeetingToggle(true); }} className="mt-4 text-violet-400 hover:underline">Schedule one now</button>
                 </div>
               )}
               
               {events.filter(e => e.isMeeting).sort((a, b) => a.date - b.date).map(meeting => (
                 <motion.div 
                   key={meeting.id}
                   layoutId={`event-${meeting.id}`}
                   className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[var(--bg-panel)] rounded-[24px] border border-[var(--border-color-strong)] shadow-sm hover:border-violet-500/30 transition-all gap-4"
                 >
                   <div className="flex items-center gap-5">
                      <div className={`w-16 h-16 rounded-[20px] flex flex-col items-center justify-center ${meeting.color} bg-opacity-10 text-[var(--text-strong)] border border-[var(--border-color)]`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{monthName.slice(0, 3)}</span>
                        <span className="text-2xl font-bold leading-none mt-1">{meeting.date}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-[var(--text-strong)] flex items-center gap-2">
                          {meeting.title}
                        </h4>
                        <div className="text-sm text-[var(--text-muted)] flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {meeting.time}</span>
                          {meeting.reminderSet && <span className="flex items-center gap-1 text-green-400"><Bell className="w-3.5 h-3.5" /> Reminder Active</span>}
                        </div>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2">
                     <button 
                       onClick={() => handleSetReminder(meeting.id)}
                       disabled={meeting.reminderSet}
                       className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 justify-center shrink-0 ${meeting.reminderSet ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-[var(--bg-hover-strong)] text-[var(--text-strong)] hover:bg-[var(--bg-hover)]'}`}
                     >
                       {meeting.reminderSet ? 'Reminder Set ✓' : 'Set Reminder'}
                     </button>
                     <button 
                       onClick={(e) => handleDeleteEvent(e, meeting.id)}
                       className="p-2.5 rounded-xl text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-400/10 transition flex items-center justify-center shrink-0"
                       title="Delete Meeting"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                     </button>
                   </div>
                 </motion.div>
               ))}
             </div>
          </div>
        )}

      </div>
    </Shell>
  );
}
