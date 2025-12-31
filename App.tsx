
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
  ROLE: 'satsang_amrutam_role',
  LANG: 'satsang_amrutam_lang',
  NOTIFS: 'satsang_amrutam_notifications'
};

const SYNC_CHANNEL = 'satsang_cloud_sync';

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
  const [isSyncing, setIsSyncing] = React.useState(false);

  const t = translations[language];
  const broadcast = React.useMemo(() => new BroadcastChannel(SYNC_CHANNEL), []);

  // --- PERSISTENCE ---
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(media));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
    localStorage.setItem(STORAGE_KEYS.LANG, language);
    localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(notifications));
  }, [media, events, role, language, notifications]);

  // --- MULTI-TAB SYNC ---
  React.useEffect(() => {
    broadcast.onmessage = (event) => {
      const { type, data } = event.data;
      if (type === 'SYNC_MEDIA') setMedia(prev => [data, ...prev.filter(m => m.id !== data.id)]);
      if (type === 'SYNC_EVENT') setEvents(prev => [data, ...prev.filter(e => e.id !== data.id)]);
    };
    return () => broadcast.close();
  }, [broadcast]);

  // --- AUTOMATIC INGESTION FROM URL ---
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('divine_link');
    if (shared) {
      try {
        const decoded = JSON.parse(atob(shared));
        const newItem = { ...decoded, id: 'shared-' + Date.now(), isShared: true, timestamp: Date.now() };
        setMedia(prev => prev.some(m => m.title === newItem.title) ? prev : [newItem, ...prev]);
        addNotification(`New Bhajan Shared: ${newItem.title}`, 'media');
        window.history.replaceState({}, '', window.location.pathname);
      } catch (e) { console.error("Link invalid"); }
    }
  }, []);

  // --- GLOBAL PULSE (Simulated Cloud Feed) ---
  React.useEffect(() => {
    const fetchCloud = async () => {
      setIsSyncing(true);
      const content = await geminiService.generateCommunityContent(language);
      if (content) {
        const newItem: MediaItem = {
          ...content,
          id: 'global-' + Date.now(),
          type: 'bhajan',
          uploader: 'Global Community',
          timestamp: Date.now(),
          isGlobal: true
        };
        setMedia(prev => prev.some(m => m.title === newItem.title) ? prev : [newItem, ...prev]);
      }
      setIsSyncing(false);
    };

    const interval = setInterval(fetchCloud, 120000); // Pulse every 2 mins
    return () => clearInterval(interval);
  }, [language]);

  const addNotification = (message: string, type: Notification['type']) => {
    const newNotif: Notification = { id: Math.random().toString(36).substr(2, 9), message, timestamp: Date.now(), isRead: false, type };
    setNotifications(prev => [newNotif, ...prev]);
    setShowToast(message);
    setTimeout(() => setShowToast(null), 5000);
  };

  const handleUploadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newItem: MediaItem = {
      id: editingBhajan ? editingBhajan.id : Date.now().toString(),
      title: formData.get('title') as string,
      artist: formData.get('artist') as string,
      type: 'bhajan',
      uploader: role === UserRole.ADMIN ? 'Admin' : 'Devotee',
      timestamp: Date.now(),
      lyrics: formData.get('lyrics') as string
    };
    setMedia(prev => editingBhajan ? prev.map(m => m.id === editingBhajan.id ? newItem : m) : [newItem, ...prev]);
    broadcast.postMessage({ type: 'SYNC_MEDIA', data: newItem });
    setShowUpload(false);
    setEditingBhajan(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-12 animate-fadeIn">
            {/* ADMIN ONLY SYNC BAR */}
            {role === UserRole.ADMIN && (
              <div className="bg-orange-900 text-white p-4 rounded-3xl flex items-center justify-between border border-orange-700 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isSyncing ? 'bg-orange-400 animate-ping' : 'bg-green-500 shadow-lg'}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Global Sangha Connected</span>
                </div>
                <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-[9px] font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">Clear Cloud Cache</button>
              </div>
            )}

            <section className="bg-gradient-to-br from-orange-600 to-orange-950 rounded-[3rem] p-10 md:p-24 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-2xl">
                <h2 className="text-6xl md:text-8xl font-serif font-bold mb-8 leading-tight">{t.heroTitle}</h2>
                <p className="text-orange-100 text-xl md:text-2xl mb-12 italic opacity-80">"{t.heroSubtitle}"</p>
                <div className="flex flex-wrap gap-5">
                  <button onClick={() => setActiveTab('guru')} className="bg-white text-orange-900 px-12 py-5 rounded-2xl font-black uppercase text-xs active:scale-95 transition-all shadow-xl">{t.guru}</button>
                  <button onClick={() => setActiveTab('bhajans')} className="bg-orange-800/40 backdrop-blur-md text-white border border-white/20 px-12 py-5 rounded-2xl font-black uppercase text-xs">Community Feed</button>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-3xl font-serif font-bold text-gray-900 mb-8">{t.featuredBhajans}</h3>
              <BhajanGrid items={media.slice(0, 4)} language={language} role={role} onDelete={id => setMedia(prev => prev.filter(m => m.id !== id))} onEdit={setEditingBhajan} />
            </section>
          </div>
        );
      case 'bhajans':
        return (
          <div className="space-y-10">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-orange-100 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-serif font-bold text-gray-900">{t.bhajans}</h2>
                <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mt-1">Global Community Pulse</p>
              </div>
              <button onClick={() => { setEditingBhajan(null); setShowUpload(true); }} className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs hover:bg-orange-700 shadow-lg active:scale-95">Upload Kirtan</button>
            </div>
            <BhajanGrid items={media} language={language} role={role} onDelete={id => setMedia(prev => prev.filter(m => m.id !== id))} onEdit={setEditingBhajan} />
          </div>
        );
      case 'community':
        return <CommunityTab events={events} role={role} language={language} onAddEvent={data => { 
          const ev = { ...data, id: Date.now().toString() };
          setEvents(p => [ev, ...p]);
          broadcast.postMessage({ type: 'SYNC_EVENT', data: ev });
        }} onDeleteEvent={id => setEvents(p => p.filter(e => e.id !== id))} />;
      case 'guru':
        return <AIGuru role={role} language={language} />;
      default: return null;
    }
  };

  return (
    <Layout role={role} setRole={setRole} language={language} setLanguage={setLanguage} notifications={notifications} onMarkRead={id => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))} onClearAllNotifications={() => setNotifications([])} activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 animate-slideDown">
          <div className="bg-orange-950 text-white p-5 rounded-3xl shadow-2xl flex items-center gap-4 border border-orange-800">
             <div className="bg-orange-600 p-2 rounded-xl text-lg">🔔</div>
             <p className="text-sm font-bold">{showToast}</p>
          </div>
        </div>
      )}
      {showUpload && (
        <div className="fixed inset-0 bg-orange-950/20 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-12 shadow-2xl animate-scaleIn relative">
            <button onClick={() => setShowUpload(false)} className="absolute top-10 right-10 text-gray-300 hover:text-gray-600 text-3xl">&times;</button>
            <h2 className="text-3xl font-serif font-bold text-orange-900 mb-8">{editingBhajan ? 'Edit Bhajan' : 'Upload Bhajan'}</h2>
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              <input name="title" required defaultValue={editingBhajan?.title || ''} className="w-full p-4 bg-orange-50 rounded-2xl border border-orange-100 font-bold" placeholder="Bhajan Title" />
              <input name="artist" defaultValue={editingBhajan?.artist || ''} className="w-full p-4 bg-orange-50 rounded-2xl border border-orange-100 font-bold" placeholder="Artist (Optional)" />
              <textarea name="lyrics" required rows={6} defaultValue={editingBhajan?.lyrics || ''} className="w-full p-4 bg-orange-50 rounded-2xl border border-orange-100 font-serif" placeholder="Bhajan Text..."></textarea>
              <button type="submit" className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl">{editingBhajan ? 'Update' : 'Publish to Cloud'}</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
