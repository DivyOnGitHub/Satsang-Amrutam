
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

  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const days = Array.from({ length: daysInMonth(currentMonth, currentYear) }, (_, i) => i + 1);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-gray-900">{t.spiritualGatherings}</h2>
          <p className="text-gray-500 text-sm mt-1">{t.upcomingEventsDesc}</p>
        </div>
        {role === UserRole.ADMIN && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-orange-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-orange-700 transition-all shadow-lg flex items-center gap-2 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {t.addEvent}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-orange-100 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-gray-800">
              {new Date().toLocaleString(language === Language.GU ? 'gu-IN' : 'default', { month: 'long', year: 'numeric' })}
            </h3>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest">
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map(day => {
              const hasEvent = sortedEvents.some(e => {
                const d = new Date(e.date);
                return d.getDate() === day && d.getMonth() === currentMonth;
              });
              return (
                <div 
                  key={day} 
                  className={`aspect-square flex items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-default
                    ${hasEvent ? 'bg-orange-600 text-white shadow-md scale-110' : 'text-gray-600 hover:bg-orange-50'}
                    ${day === new Date().getDate() ? 'border-2 border-orange-200' : ''}
                  `}
                >
                  {day}
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-orange-50 text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
            Upcoming Admin Verified
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {sortedEvents.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
              <div className="text-4xl mb-4 opacity-20">🌿</div>
              <p className="text-gray-400 font-medium">{t.noEvents}</p>
              <p className="text-gray-400 text-xs mt-2 px-10">Only upcoming events verified by administrators are displayed here.</p>
            </div>
          ) : (
            sortedEvents.map(event => (
              <div key={event.id} className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-orange-200 transition-all flex flex-col sm:flex-row gap-6 items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 opacity-40 group-hover:scale-110 transition-transform"></div>
                
                <div className="bg-orange-50 rounded-2xl p-4 text-center min-w-[100px] border border-orange-100 shadow-inner group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                  <span className="block text-xs font-black uppercase tracking-widest opacity-60">
                    {new Date(event.date).toLocaleString(language === Language.GU ? 'gu-IN' : 'default', { month: 'short' })}
                  </span>
                  <span className="block text-3xl font-black">
                    {new Date(event.date).getDate()}
                  </span>
                  <span className="block text-[10px] font-bold opacity-60">
                    {event.time}
                  </span>
                </div>

                <div className="flex-1 space-y-3 relative z-10">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-serif font-bold text-gray-900 group-hover:text-orange-900 transition-colors">{event.title}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-orange-200">Verified Admin</span>
                      {role === UserRole.ADMIN && (
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (window.confirm(language === Language.GU ? 'શું તમે આ કાર્યક્રમ રદ કરવા માંગો છો?' : 'Are you sure you want to delete this event?')) {
                              onDeleteEvent(event.id);
                            }
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-all border border-transparent hover:border-red-100 shadow-sm active:scale-90"
                          title="Delete Event"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
                  
                  <div className="pt-4 border-t border-gray-50 flex flex-wrap gap-4 text-xs font-bold text-orange-800">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full">
                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-scaleIn border border-orange-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-serif font-bold text-orange-900">{t.addEvent}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">{t.title}</label>
                <input 
                  type="text" required
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full px-4 py-3 bg-orange-50/50 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-medium"
                  placeholder="e.g. Bhajan Sandhya"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">{language === Language.GU ? 'વર્ણન' : 'Description'}</label>
                <textarea 
                  required
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full px-4 py-3 bg-orange-50/50 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-medium"
                  rows={3}
                  placeholder="Details about the sacred gathering..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">{language === Language.GU ? 'તારીખ' : 'Date'}</label>
                  <input 
                    type="date" required
                    value={newEvent.date}
                    onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full px-4 py-3 bg-orange-50/50 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">{language === Language.GU ? 'સમય' : 'Time'}</label>
                  <input 
                    type="time" required
                    value={newEvent.time}
                    onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                    className="w-full px-4 py-3 bg-orange-50/50 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">{t.location}</label>
                <input 
                  type="text" required
                  value={newEvent.location}
                  onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                  className="w-full px-4 py-3 bg-orange-50/50 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-medium"
                  placeholder="e.g. Temple Hall"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg active:scale-95"
                >
                  {language === Language.GU ? 'પ્રકાશિત કરો' : 'Broadcast to All'}
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
