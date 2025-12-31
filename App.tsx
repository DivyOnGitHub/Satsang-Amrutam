import React from 'react';
import Layout from './components/Layout';
import BhajanGrid from './components/BhajanGrid';
import CommunityTab from './components/CommunityTab';
import AIGuru from './components/AIGuru';
import { MediaItem, CommunityEvent, UserRole, Notification, Language } from './types';
import { translations } from './utils/translations';
import { geminiService } from './services/geminiService';

const STORAGE_KEYS = {
  MEDIA: 'satsang_amrutam_media',
  EVENTS: 'satsang_amrutam_events',
  NOTIFS: 'satsang_amrutam_notifications',
  ROLE: 'satsang_amrutam_role',
  LANG: 'satsang_amrutam_lang'
};

const SYNC_CHANNEL = 'satsang_temple_sync';

const INITIAL_MEDIA: MediaItem[] = [
  {
    id: '1',
    title: 'Madhurashtakam',
    artist: 'Vallabhacharya',
    type: 'bhajan',
    uploader: 'Prakash Das',
    timestamp: Date.now(),
    lyrics: `Adharam Madhuram Vadanam Madhuram,\nNayanam Madhuram Hasitam Madhuram.\nHridayam Madhuram Gamanam Madhuram,\nMadhu-radhipater Akhilam Madhuram...`
  }
];

const INITIAL_EVENTS: CommunityEvent[] = [
  {
    id: 'e1',
    title: 'Purnima Mahotsav',
    description: 'A special moonlit gathering for kirtan and meditation.',
    date: new Date().toISOString().split('T')[0],
    time: '07:30 PM',
    location: 'Open Garden',
    organizer: 'Admin'
  }
];

const App: React.FC = () => {
  const [role, setRole] = React.useState<UserRole>(() => (localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole) || UserRole.DEVOTEE);
  const [language, setLanguage] = React.useState<Language>(() => (localStorage.getItem(STORAGE_KEYS.LANG) as Language) || Language.EN);
  const [media, setMedia] = React.useState<MediaItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEDIA);
    return saved ? JSON.parse(saved) : INITIAL_MEDIA;
  });
  const [events, setEvents] = React.useState<CommunityEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });
  const [notifications, setNotifications] = React.useState<Notification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFS);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = React.useState('home');
  const [showUpload, setShowUpload] = React.useState(false);
  const [editingBhajan, setEditingBhajan] = React.useState<MediaItem | null>(null);
  const [showToast, setShowToast] = React.useState<string | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const t = translations[language];

  // --- Multi-Tab / Session Synchronization ---
  const broadcast = React.useMemo(() => new BroadcastChannel(SYNC_CHANNEL), []);

  React.useEffect(() => {
    broadcast.onmessage = (event) => {
      const { type, data } = event.data;
      if (type === 'NEW_MEDIA') {
        setMedia(prev => [data, ...prev.filter(m => m.id !== data.id)]);
        addNotification(`${t.newSharedBhajan}: ${data.title}`, 'media');
      } else if (type === 'NEW_EVENT') {
        setEvents(prev => [data, ...prev.filter(e => e.id !== data.id)]);
        addNotification(`${t.communityLinkActive}: ${data.title}`, 'event');
      }
    };
    return () => broadcast.close();
  }, [broadcast, t]);

  // --- Automated "Global Temple" Pulse (Gemini Simulation) ---
  React.useEffect(() => {
    const fetchGlobalCommunityContent = async () => {
      setIsSyncing(true);
      try {
        const globalContent = await geminiService.generateCommunityBhajan(language);
        if (globalContent) {
          const newItem: MediaItem = {
            id: 'global-' + Date.now(),
            title: globalContent.title,
            artist: globalContent.artist,
            type: 'bhajan',
            uploader: 'Global Devotee',
            timestamp: Date.now(),
            lyrics: globalContent.lyrics,
            isShared: true
          };
          setMedia(prev => {
            if (prev.some(m => m.title === newItem.title)) return prev;
            return [newItem, ...prev];
          });
          addNotification(`${t.newSharedBhajan}: ${newItem.title}`, 'media');
        }
      } catch (e) {
        console.error("Pulse sync failed", e);
      }
      setIsSyncing(false);
    };

    const timeout = setTimeout(fetchGlobalCommunityContent, 5000);
    const interval = setInterval(fetchGlobalCommunityContent, 90000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [language, t]);

  // --- Persistence ---
  React.useEffect(() => { localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(media)); }, [media]);
  React.useEffect(() => { localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events)); }, [events]);
  React.useEffect(() => { localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(notifications)); }, [notifications]);
  React.useEffect(() => { localStorage.setItem(STORAGE_KEYS.ROLE, role); }, [role]);
  React.useEffect(() => { localStorage.setItem(STORAGE_KEYS.LANG, language); }, [language]);

  const addNotification = (message: string, type: Notification['type']) => {
    const newNotif: Notification = { id: Math.random().toString(36).substr(2, 9), message, timestamp: Date.now(), isRead: false, type };
    setNotifications(prev => [newNotif, ...prev]);
    setShowToast(message);
    setTimeout(() => setShowToast(null), 5000);
  };

  const handleAddEvent = (eventData: Omit<CommunityEvent, 'id'>) => {
    const newEvent = { ...eventData, id: Date.now().toString() };
    setEvents(prev => [...prev, newEvent]);
    broadcast.postMessage({ type: 'NEW_EVENT', data: newEvent });
    addNotification(`${t.addEvent}: ${newEvent.title}`, 'event');
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleDeleteBhajan = (id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  const handleUploadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const artist = (formData.get('artist') as string) || undefined;
    const lyrics = formData.get('lyrics') as string;

    const newItem: MediaItem = {
      id: editingBhajan ? editingBhajan.id : Date.now().toString(),
      title,
      artist,
      type: 'bhajan',
      uploader: role === UserRole.ADMIN ? 'Admin' : 'Devotee',
      timestamp: Date.now(),
      lyrics
    };

    if (editingBhajan) {
      setMedia(prev => prev.map(m => m.id === editingBhajan.id ? newItem : m));
    } else {
      setMedia(prev => [newItem, ...prev]);
      broadcast.postMessage({ type: 'NEW_MEDIA', data: newItem });
    }

    addNotification(`${title} ${t.uploadNow}`, 'media');
    setShowUpload(false);
    setEditingBhajan(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-12 animate-fadeIn">
            {role === UserRole.ADMIN && (
              <div className="bg-orange-900/90 text-white rounded-3xl p-6 flex items-center justify-between shadow-xl border border-orange-700">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${isSyncing ? 'bg-orange-500 animate-ping' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]'}`}></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">{isSyncing ? 'Syncing with Temple Cloud...' : 'Connected to Global Sangha'}</p>
                    <p className="text-[9px] opacity-60 font-bold uppercase tracking-widest">Automatic community updates enabled</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full font-black border border-white/10">LIVE FEED ACTIVE</span>
                </div>
              </div>
            )}

            <section className="bg-gradient-to-br from-orange-600 to-orange-950 rounded-[3rem] p-10 md:p-24 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20"></div>
              <div className="relative z-10 max-w-3xl">
                <h2 className="text-6xl md:text-8xl font-serif font-bold mb-10 leading-[1] tracking-tighter">{t.heroTitle}</h2>
                <p className="text-orange-100 text-xl md:text-2xl mb-12 italic opacity-80 leading-relaxed font-medium">"{t.heroSubtitle}"</p>
                <div className="flex flex-wrap gap-6">
                  <button onClick={() => setActiveTab('guru')} className="bg-white text-orange-900 px-12 py-5 rounded-2xl font-black uppercase text-xs hover:scale-105 transition-all shadow-2xl active:scale-95">{t.guru}</button>
                  <button onClick={() => setActiveTab('bhajans')} className="bg-orange-800/50 backdrop-blur-md border border-white/20 px-12 py-5 rounded-2xl font-black uppercase text-xs hover:bg-orange-800 transition-all">{t.bhajans}</button>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-end justify-between mb-10 border-b border-orange-100 pb-6">
                <div>
                  <h3 className="text-3xl font-serif font-bold text-gray-900">{t.featuredBhajans}</h3>
                  <p className="text-xs text-orange-600 font-bold uppercase tracking-widest mt-1">Refreshed from community cloud</p>
                </div>
                <button onClick={() => setActiveTab('bhajans')} className="text-orange-800 text-xs font-black uppercase tracking-widest px-6 py-3 bg-orange-100 rounded-2xl hover:bg-orange-200 transition-all">{t.viewAll}</button>
              </div>
              <BhajanGrid items={media.slice(0, 4)} language={language} role={role} onDelete={handleDeleteBhajan} onEdit={setEditingBhajan} />
            </section>
          </div>
        );
      case 'bhajans':
        return (
          <div className="space-y-10 animate-fadeIn">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-orange-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-serif font-bold text-gray-900">{t.bhajans}</h2>
                <p className="text-gray-500 text-sm font-medium">{t.bhajansSub}</p>
              </div>
              <button onClick={() => { setEditingBhajan(null); setShowUpload(true); }} className="bg-orange-600 text-white px-8 py-5 rounded-2xl text-xs font-black uppercase hover:bg-orange-700 shadow-xl shadow-orange-200 flex items-center gap-3 transition-all active:scale-95">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                {t.uploadMedia}
              </button>
            </div>
            <BhajanGrid items={media} language={language} role={role} onDelete={handleDeleteBhajan} onEdit={setEditingBhajan} />
          </div>
        );
      case 'community':
        return <CommunityTab events={events} role={role} language={language} onAddEvent={handleAddEvent} onDeleteEvent={handleDeleteEvent} />;
      case 'guru':
        return <AIGuru role={role} language={language} />;
      default:
        return null;
    }
  };

  return (
    <Layout role={role} setRole={setRole} language={language} setLanguage={setLanguage} notifications={notifications} onMarkRead={id => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))} onClearAllNotifications={() => setNotifications([])} activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 animate-slideDown">
          <div className="bg-orange-950 text-white p-5 rounded-3xl shadow-2xl flex items-center gap-4 border border-orange-800 shadow-orange-900/20">
             <div className="bg-orange-600 p-2.5 rounded-2xl shadow-lg text-lg rotate-12">🔔</div>
             <p className="text-sm font-bold leading-tight">{showToast}</p>
          </div>
        </div>
      )}
      {showUpload && (
        <div className="fixed inset-0 bg-orange-950/30 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-12 shadow-2xl animate-scaleIn border border-orange-100 relative">
            <button onClick={() => { setShowUpload(false); setEditingBhajan(null); }} className="absolute top-10 right-10 text-gray-300 hover:text-gray-600 text-3xl">&times;</button>
            <h2 className="text-4xl font-serif font-bold text-orange-900 mb-10 tracking-tight">{editingBhajan ? t.editMedia : t.uploadMedia}</h2>
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">{t.title}</label>
                <input name="title" required defaultValue={editingBhajan?.title || ''} className="w-full px-6 py-4 bg-orange-50/50 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold transition-all" placeholder="e.g. He Swaminarayan..." />
              </div>
              <div>
                <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">{t.artist}</label>
                <input name="artist" defaultValue={editingBhajan?.artist || ''} className="w-full px-6 py-4 bg-orange-50/50 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold transition-all" placeholder="e.g. Traditional Poet" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">{t.mediaFile}</label>
                <textarea name="lyrics" required rows={6} defaultValue={editingBhajan?.lyrics || ''} className="w-full px-6 py-4 bg-orange-50/50 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-serif text-lg leading-relaxed" placeholder="Write or paste the sacred text here..."></textarea>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowUpload(false)} className="flex-1 px-4 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-orange-700 active:scale-95 transition-all">{editingBhajan ? t.updateNow : t.uploadNow}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;