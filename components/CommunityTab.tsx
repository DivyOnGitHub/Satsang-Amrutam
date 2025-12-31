import React from 'react';
import { CommunityEvent, UserRole, Language } from '../types';
import { translations } from '../utils/translations';

interface CommunityTabProps {
  events: CommunityEvent[];
  role: UserRole;
  language: Language;
  onAddEvent: (event: Omit<CommunityEvent, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
}

const CommunityTab: React.FC<CommunityTabProps> = ({ events, role, language, onAddEvent, onDeleteEvent }) => {
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [selectedDay, setSelectedDay] = React.useState<number | null>(null);
  const t = translations[language];
  const [newEvent, setNewEvent] = React.useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEvent({
      ...newEvent,
      organizer: 'Admin'
    });
    setShowAddModal(false);
    setNewEvent({ title: '', description: '', date: '', time: '', location: '' });
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const filteredEvents = React.useMemo(() => {
    let sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (selectedDay !== null) {
      sorted = sorted.filter(e => {
        const d = new Date(e.date);
        return d.getDate() === selectedDay && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    }
    return sorted;
  }, [events, selectedDay, currentMonth, currentYear]);

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth(currentMonth, currentYear) }, (_, i) => i + 1);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-orange-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-gray-900 leading-tight">{t.spiritualGatherings}</h2>
          <p className="text-gray-500 text-sm mt-2 max-w-md font-medium">{t.upcomingEventsDesc}</p>
        </div>
        {role === UserRole.ADMIN && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-orange-600 text-white px-8 py-4 rounded-2xl text-sm font-black hover:bg-orange-700 transition-all shadow-xl shadow-orange-200 flex items-center gap-3 active:scale-95 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            {t.addEvent}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Section */}
        <div className="lg:col-span-4 bg-white rounded-[2rem] p-8 border border-orange-100 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-serif font-black text-xl text-orange-900">
              {new Date().toLocaleString(language === Language.GU ? 'gu-IN' : 'default', { month: 'long', year: 'numeric' })}
            </h3>
            {selectedDay !== null && (
              <button 
                onClick={() => setSelectedDay(null)}
                className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 hover:bg-orange-100 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-orange-300 mb-6 uppercase tracking-[0.2em]">
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>
          <div className="grid grid-cols-7 gap-3">
            {days.map(day => {
              const dayEvents = events.filter(e => {
                const d = new Date(e.date);
                return d.getDate() === day && d.getMonth() === currentMonth;
              });
              const hasEvent = dayEvents.length > 0;
              const isSelected = selectedDay === day;
              const isToday = day === new Date().getDate();

              return (
                <button 
                  key={day} 
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`relative aspect-square flex items-center justify-center rounded-2xl text-sm font-bold transition-all
                    ${isSelected ? 'bg-orange-900 text-white shadow-xl scale-110 z-10' : 
                      hasEvent ? 'bg-orange-600 text-white hover:bg-orange-700' : 'text-gray-600 hover:bg-orange-50'}
                    ${isToday && !isSelected ? 'ring-2 ring-orange-200' : ''}
                  `}
                >
                  {day}
                  {hasEvent && !isSelected && (
                    <div className="absolute bottom-1.5 w-1 h-1 bg-white rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-8 pt-6 border-t border-orange-50 space-y-3">
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirmed Gathering</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-900 rounded-full"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Selection</span>
             </div>
          </div>
        </div>

        {/* Events List Section */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-sm font-black text-orange-900 uppercase tracking-widest">
              {selectedDay ? `Gatherings for ${selectedDay} ${new Date().toLocaleString('default', { month: 'long' })}` : `All Upcoming Events`}
            </h4>
            <span className="text-[10px] font-bold text-gray-400">{filteredEvents.length} Events Found</span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-orange-100 flex flex-col items-center">
              <div className="text-5xl mb-6 grayscale opacity-20">🕯️</div>
              <p className="text-gray-500 font-serif font-bold text-xl">{selectedDay ? `No events on this day` : t.noEvents}</p>
              <p className="text-gray-400 text-xs mt-3 px-12 leading-relaxed max-w-sm">"In the presence of devotees, every day is a festival." Check back soon for admin-verified satsang schedules.</p>
              {selectedDay && (
                <button onClick={() => setSelectedDay(null)} className="mt-6 text-orange-600 font-black text-[10px] uppercase tracking-widest underline underline-offset-4">View Full Calendar</button>
              )}
            </div>
          ) : (
            filteredEvents.map(event => (
              <div key={event.id} className="group bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all flex flex-col sm:flex-row gap-8 items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-full -mr-16 -mt-16 group-hover:bg-orange-100/50 transition-colors"></div>
                
                <div className="bg-orange-50 rounded-3xl p-5 text-center min-w-[110px] border border-orange-100 shadow-inner group-hover:bg-orange-600 group-hover:text-white transition-all duration-500">
                  <span className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">
                    {new Date(event.date).toLocaleString(language === Language.GU ? 'gu-IN' : 'default', { month: 'short' })}
                  </span>
                  <span className="block text-4xl font-black mb-1">
                    {new Date(event.date).getDate()}
                  </span>
                  <span className="block text-[10px] font-bold opacity-70">
                    {event.time}
                  </span>
                </div>

                <div className="flex-1 space-y-4 relative z-10">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-gray-900 group-hover:text-orange-900 transition-colors leading-tight">{event.title}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-black uppercase tracking-widest border border-orange-200">Official Gathering</span>
                      </div>
                    </div>
                    {role === UserRole.ADMIN && (
                      <button 
                        type="button"
                        onClick={() => {
                          if (window.confirm(language === Language.GU ? 'શું તમે આ કાર્યક્રમ રદ કરવા માંગો છો?' : 'Are you sure you want to delete this event?')) {
                            onDeleteEvent(event.id);
                          }
                        }}
                        className="p-3 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all border border-transparent hover:border-red-100 active:scale-90"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed font-medium">{event.description}</p>
                  
                  <div className="pt-5 border-t border-orange-50 flex flex-wrap gap-4 text-xs font-bold text-orange-900">
                    <div className="flex items-center gap-2 px-4 py-2 bg-orange-50/50 rounded-2xl border border-orange-100">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {event.location}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-orange-950/20 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-scaleIn border border-orange-100 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-gray-300 hover:text-gray-500 text-3xl">&times;</button>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h2 className="text-3xl font-serif font-bold text-orange-900">{t.addEvent}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2.5">{t.title}</label>
                <input 
                  type="text" required
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full px-6 py-4 bg-orange-50/30 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold transition-all text-orange-900"
                  placeholder="e.g. Bhajan Sandhya"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2.5">Description</label>
                <textarea 
                  required
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full px-6 py-4 bg-orange-50/30 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-medium transition-all"
                  rows={3}
                  placeholder="Details about the sacred gathering..."
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2.5">Date</label>
                  <input 
                    type="date" required
                    value={newEvent.date}
                    onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full px-5 py-4 bg-orange-50/30 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2.5">Time</label>
                  <input 
                    type="time" required
                    value={newEvent.time}
                    onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                    className="w-full px-5 py-4 bg-orange-50/30 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2.5">{t.location}</label>
                <input 
                  type="text" required
                  value={newEvent.location}
                  onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                  className="w-full px-6 py-4 bg-orange-50/30 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold transition-all"
                  placeholder="e.g. Temple Hall"
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-colors"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-700 transition-all shadow-xl shadow-orange-200 active:scale-95"
                >
                  Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityTab;