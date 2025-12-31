
import React from 'react';
import Layout from './components/Layout';
import BhajanGrid from './components/BhajanGrid';
import CommunityTab from './components/CommunityTab';
import AIGuru from './components/AIGuru';
import { MediaItem, CommunityEvent, UserRole, Notification, Language } from './types';
import { translations } from './utils/translations';

const STORAGE_KEYS = {
  MEDIA: 'satsang_amrutam_media',
  EVENTS: 'satsang_amrutam_events',
  ROLE: 'satsang_amrutam_role',
  LANG: 'satsang_amrutam_lang',
  NOTIFS: 'satsang_amrutam_notifications'
};

const App: React.FC = () => {
  const [role, setRole] = React.useState<UserRole>(() => (localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole) || UserRole.DEVOTEE);
  const [language, setLanguage] = React.useState<Language>(() => (localStorage.getItem(STORAGE_KEYS.LANG) as Language) || Language.EN);
  
  const [media, setMedia] = React.useState<MediaItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEDIA);
    return saved ? JSON.parse(saved) : [];
  });
  const [events, setEvents] = React.useState<CommunityEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return saved ? JSON.parse(saved) : [];
  });
  const [notifications, setNotifications] = React.useState<Notification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFS);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = React.useState('home');
  const [showUpload, setShowUpload] = React.useState(false);
  const [editingBhajan, setEditingBhajan] = React.useState<MediaItem | null>(null);
  const [showToast, setShowToast] = React.useState<string | null>(null);

  const t = translations[language];

  // --- LOCAL PERSISTENCE ---
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(media));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
    localStorage.setItem(STORAGE_KEYS.LANG, language);
    localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(notifications));
  }, [media, events, role, language, notifications]);

  const addNotification = (message: string, type: Notification['type']) => {
    const newNotif: Notification = { id: Math.random().toString(36).substr(2, 9), message, timestamp: Date.now(), isRead: false, type };
    setNotifications(prev => [newNotif, ...prev]);
    setShowToast(message);
    setTimeout(() => setShowToast(null), 5000);
  };

  const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newItem: MediaItem = {
      id: editingBhajan ? editingBhajan.id : `bhajan-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: formData.get('title') as string,
      artist: formData.get('artist') as string,
      type: 'bhajan',
      uploader: role === UserRole.ADMIN ? 'Admin' : 'Devotee',
      timestamp: Date.now(),
      lyrics: formData.get('lyrics') as string,
    };

    if (editingBhajan) {
      setMedia(prev => prev.map(m => m.id === editingBhajan.id ? newItem : m));
      addNotification(t.updateNow, 'media');
    } else {
      setMedia(prev => [newItem, ...prev]);
      addNotification(t.uploadNow, 'media');
    }
    
    setShowUpload(false);
    setEditingBhajan(null);
  };

  const onMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const onClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleAddEvent = (event: Omit<CommunityEvent, 'id'>) => {
    const newEvent: CommunityEvent = {
      ...event,
      id: `event-${Date.now()}`,
      timestamp: Date.now()
    };
    setEvents(prev => [newEvent, ...prev]);
    addNotification(t.addEvent, 'event');
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleDeleteBhajan = (id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  return (
    <Layout
      role={role}
      setRole={setRole}
      language={language}
      setLanguage={setLanguage}
      notifications={notifications}
      onMarkRead={onMarkRead}
      onClearAllNotifications={onClearAllNotifications}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {activeTab === 'home' && (
        <div className="space-y-12 animate-fadeIn">
          {/* Hero Section */}
          <section className="relative h-[400px] rounded-[3rem] overflow-hidden shadow-2xl group border border-orange-100">
             <div className="absolute inset-0 bg-gradient-to-br from-orange-900/90 via-orange-800/80 to-orange-600/60 z-10"></div>
             <img src="https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Sacred" />
             <div className="relative z-20 h-full flex flex-col items-center justify-center text-center p-8">
               <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center text-5xl mb-8 shadow-inner border border-white/30">🪔</div>
               <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 drop-shadow-lg">{t.heroTitle}</h2>
               <p className="text-orange-100 max-w-2xl font-serif italic text-lg md:text-xl leading-relaxed opacity-90">{t.heroSubtitle}</p>
             </div>
          </section>

          {/* Featured Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-2xl font-serif font-bold text-orange-950">{t.featuredBhajans}</h3>
                <button onClick={() => setActiveTab('bhajans')} className="text-xs font-black text-orange-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">{t.viewAll}</button>
              </div>
              <BhajanGrid items={media.slice(0, 2)} language={language} role={role} onDelete={handleDeleteBhajan} onEdit={(item) => { setEditingBhajan(item); setShowUpload(true); }} />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-2xl font-serif font-bold text-orange-950">{t.upcomingNearYou}</h3>
                <button onClick={() => setActiveTab('community')} className="text-xs font-black text-orange-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">{t.viewAll}</button>
              </div>
              <div className="space-y-4">
                {events.slice(0, 2).map(event => (
                  <div key={event.id} className="bg-white p-6 rounded-[2rem] border border-orange-50 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex flex-col items-center justify-center text-orange-600 font-bold">
                       <span className="text-xs uppercase leading-none">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                       <span className="text-2xl">{new Date(event.date).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-orange-900">{event.title}</h4>
                      <p className="text-xs text-gray-400 font-medium mt-1">{event.location}</p>
                    </div>
                  </div>
                ))}
                {events.length === 0 && <p className="text-center py-12 text-gray-400 font-medium">{t.noEvents}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bhajans' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-orange-100 shadow-sm">
            <div>
              <h2 className="text-3xl font-serif font-bold text-orange-950">{t.bhajans}</h2>
              <p className="text-gray-400 text-sm mt-1 font-medium italic">"Gãyatã bhaktibhãvena, Swãminãrayanam bhaje..."</p>
            </div>
            {role === UserRole.ADMIN && (
              <button 
                onClick={() => { setEditingBhajan(null); setShowUpload(true); }}
                className="bg-orange-600 text-white px-8 py-4 rounded-2xl text-sm font-black hover:bg-orange-700 transition-all shadow-xl shadow-orange-200 flex items-center gap-3 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                {t.adminUpload}
              </button>
            )}
          </div>
          <BhajanGrid items={media} language={language} role={role} onDelete={handleDeleteBhajan} onEdit={(item) => { setEditingBhajan(item); setShowUpload(true); }} />
        </div>
      )}

      {activeTab === 'community' && (
        <CommunityTab 
          events={events} 
          role={role} 
          language={language} 
          onAddEvent={handleAddEvent} 
          onDeleteEvent={handleDeleteEvent}
        />
      )}

      {activeTab === 'guru' && <AIGuru role={role} language={language} />}

      {/* Upload/Edit Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-orange-950/20 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-scaleIn border border-orange-100 relative">
            <button onClick={() => setShowUpload(false)} className="absolute top-8 right-8 text-gray-300 hover:text-gray-500 text-3xl">&times;</button>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h2 className="text-3xl font-serif font-bold text-orange-900">{editingBhajan ? t.editMedia : t.uploadMedia}</h2>
            </div>
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2.5">{t.title}</label>
                <input 
                  name="title" type="text" required
                  defaultValue={editingBhajan?.title}
                  className="w-full px-6 py-4 bg-orange-50/30 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold transition-all text-orange-900"
                  placeholder="e.g. Swaminarayan Swaminarayan..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2.5">{t.artist}</label>
                <input 
                  name="artist" type="text"
                  defaultValue={editingBhajan?.artist}
                  className="w-full px-6 py-4 bg-orange-50/30 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold transition-all text-orange-900"
                  placeholder="e.g. Traditional / Brahmanand Swami"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2.5">{t.mediaFile}</label>
                <textarea 
                  name="lyrics" required
                  defaultValue={editingBhajan?.lyrics}
                  className="w-full px-6 py-4 bg-orange-50/30 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-medium transition-all"
                  rows={5}
                  placeholder="Paste the sacred lyrics here..."
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="flex-1 px-4 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-colors"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-700 transition-all shadow-xl shadow-orange-200 active:scale-95"
                >
                  {editingBhajan ? t.updateNow : t.uploadNow}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Local Action Toast */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-orange-900 text-white px-6 py-3 rounded-2xl shadow-2xl z-[200] flex items-center gap-3 animate-slideUp">
           <span className="text-xs font-bold uppercase tracking-widest">{showToast}</span>
        </div>
      )}
    </Layout>
  );
};

export default App;
