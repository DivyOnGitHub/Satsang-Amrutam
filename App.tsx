
import React from 'react';
import Layout from './components/Layout';
import BhajanGrid from './components/BhajanGrid';
import CommunityTab from './components/CommunityTab';
import AIGuru from './components/AIGuru';
import { MediaItem, CommunityEvent, UserRole, Notification, Language, SanghaData } from './types';
import { translations } from './utils/translations';
import { geminiService } from './services/geminiService';
import { cloudService } from './services/cloudService';

// The Universal ID ensures all devices sync to the same global bucket automatically
const GLOBAL_SANGHA_ID = "f8b667e671761e018695"; 

const STORAGE_KEYS = {
  MEDIA: 'satsang_amrutam_media',
  EVENTS: 'satsang_amrutam_events',
  ROLE: 'satsang_amrutam_role',
  LANG: 'satsang_amrutam_lang',
  NOTIFS: 'satsang_amrutam_notifications',
  SANGHA_ID: 'satsang_sangha_id'
};

const App: React.FC = () => {
  const [role, setRole] = React.useState<UserRole>(() => (localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole) || UserRole.DEVOTEE);
  const [language, setLanguage] = React.useState<Language>(() => (localStorage.getItem(STORAGE_KEYS.LANG) as Language) || Language.EN);
  
  // Default to the Global ID if no private Sangha ID is set
  const [sanghaId, setSanghaId] = React.useState<string>(() => 
    localStorage.getItem(STORAGE_KEYS.SANGHA_ID) || GLOBAL_SANGHA_ID
  );
  
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

  // --- GLOBAL CLOUD SYNC ---
  const syncWithCloud = async (isPush: boolean = false) => {
    if (!sanghaId || isSyncing) return;
    setIsSyncing(true);
    
    if (isPush) {
      await cloudService.pushToSangha(sanghaId, {
        media,
        events,
        lastUpdated: Date.now()
      });
    } else {
      const remoteData = await cloudService.fetchFromSangha(sanghaId);
      if (remoteData) {
        // Sync Media: Deduplicate and merge by ID
        setMedia(prev => {
          const merged = [...prev];
          remoteData.media.forEach(rm => {
            const index = merged.findIndex(lm => lm.id === rm.id);
            if (index === -1) {
              merged.push({ ...rm, fromCloud: true });
            } else if (rm.timestamp > merged[index].timestamp) {
              merged[index] = rm;
            }
          });
          return merged.sort((a, b) => b.timestamp - a.timestamp);
        });

        // Sync Events: Deduplicate and merge by ID
        setEvents(prev => {
          const merged = [...prev];
          remoteData.events.forEach(re => {
            const index = merged.findIndex(le => le.id === re.id);
            if (index === -1) merged.push(re);
            else if (re.timestamp > merged[index].timestamp) merged[index] = re;
          });
          return merged;
        });
      }
    }
    setIsSyncing(false);
  };

  // Auto-sync heartbeat every 30 seconds for live community feel
  React.useEffect(() => {
    syncWithCloud(false);
    const interval = setInterval(() => syncWithCloud(false), 30000);
    return () => clearInterval(interval);
  }, [sanghaId]);

  // Ensure Sangha ID is persisted
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SANGHA_ID, sanghaId);
  }, [sanghaId]);

  // Local Persistence
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
      id: editingBhajan ? editingBhajan.id : Date.now().toString(),
      title: formData.get('title') as string,
      artist: formData.get('artist') as string,
      type: 'bhajan',
      uploader: role === UserRole.ADMIN ? 'Admin' : 'Devotee',
      timestamp: Date.now(),
      lyrics: formData.get('lyrics') as string
    };
    
    const updatedMedia = editingBhajan ? media.map(m => m.id === editingBhajan.id ? newItem : m) : [newItem, ...media];
    setMedia(updatedMedia);
    setShowUpload(false);
    setEditingBhajan(null);
    
    // Immediate Global Push
    setIsSyncing(true);
    await cloudService.pushToSangha(sanghaId, {
      media: updatedMedia,
      events,
      lastUpdated: Date.now()
    });
    setIsSyncing(false);
    
    addNotification(`Broadcasted to Global Sangha: ${newItem.title}`, 'media');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-12 animate-fadeIn">
            {role === UserRole.ADMIN && (
              <div className="bg-orange-900 text-white p-6 rounded-[2.5rem] border border-orange-700 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                       <div className={`w-5 h-5 rounded-full ${isSyncing ? 'bg-orange-400 animate-ping' : 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]'}`}></div>
                       {!isSyncing && <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse opacity-50"></div>}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400">Global Community Connection</p>
                      <h4 className="text-xl font-serif font-bold mt-1">Status: <span className="text-green-400">Synchronized</span></h4>
                      <p className="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-widest">Automatic sync enabled for all visitors</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 px-4 py-3 rounded-2xl border border-white/10 text-center">
                       <span className="block text-[8px] font-black uppercase tracking-widest text-orange-200 mb-1">Active Sangha ID</span>
                       <span className="text-xs font-mono font-bold select-all">{sanghaId}</span>
                    </div>
                    <button onClick={() => syncWithCloud(false)} className="bg-orange-600 hover:bg-orange-500 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95">Force Refresh</button>
                  </div>
                </div>
              </div>
            )}

            <section className="bg-gradient-to-br from-orange-600 to-orange-950 rounded-[3rem] p-10 md:p-24 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-2xl">
                <h2 className="text-6xl md:text-8xl font-serif font-bold mb-8 leading-tight tracking-tight">{t.heroTitle}</h2>
                <p className="text-orange-100 text-xl md:text-2xl mb-12 italic opacity-80 leading-relaxed font-medium">"{t.heroSubtitle}"</p>
                <div className="flex flex-wrap gap-5">
                  <button onClick={() => setActiveTab('guru')} className="bg-white text-orange-900 px-12 py-5 rounded-2xl font-black uppercase text-xs active:scale-95 transition-all shadow-xl hover:shadow-orange-900/40">{t.guru}</button>
                  <button onClick={() => setActiveTab('bhajans')} className="bg-orange-800/40 backdrop-blur-md text-white border border-white/20 px-12 py-5 rounded-2xl font-black uppercase text-xs hover:bg-orange-800/60 transition-all">Global Feed</button>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-10 border-b border-orange-100 pb-6">
                <div>
                  <h3 className="text-3xl font-serif font-bold text-gray-900">{t.featuredBhajans}</h3>
                  <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest mt-1">Live from global kirtan cloud</p>
                </div>
                <button onClick={() => setActiveTab('bhajans')} className="text-orange-900 text-[10px] font-black uppercase tracking-widest px-6 py-3 bg-orange-100 rounded-xl hover:bg-orange-200 transition-all">{t.viewAll}</button>
              </div>
              <BhajanGrid items={media.slice(0, 4)} language={language} role={role} onDelete={id => setMedia(prev => prev.filter(m => m.id !== id))} onEdit={setEditingBhajan} />
            </section>
          </div>
        );
      case 'bhajans':
        return (
          <div className="space-y-10">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-orange-50 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-serif font-bold text-orange-950">{t.bhajans}</h2>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">All devotees see your contributions instantly</p>
              </div>
              <button onClick={() => { setEditingBhajan(null); setShowUpload(true); }} className="bg-orange-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] hover:bg-orange-700 shadow-xl shadow-orange-100 active:scale-95 transition-all">Add New Kirtan</button>
            </div>
            <BhajanGrid items={media} language={language} role={role} onDelete={id => setMedia(prev => prev.filter(m => m.id !== id))} onEdit={setEditingBhajan} />
          </div>
        );
      case 'community':
        return <CommunityTab events={events} role={role} language={language} onAddEvent={async (data) => { 
          const ev = { ...data, id: Date.now().toString(), timestamp: Date.now() };
          const updatedEvents = [ev, ...events];
          setEvents(updatedEvents);
          // Sync to cloud immediately
          setIsSyncing(true);
          await cloudService.pushToSangha(sanghaId, { media, events: updatedEvents, lastUpdated: Date.now() });
          setIsSyncing(false);
          addNotification(`Gathering Broadcasted: ${ev.title}`, 'event');
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
          <div className="bg-orange-950 text-white p-6 rounded-[2rem] shadow-2xl flex items-center gap-5 border border-orange-800 ring-4 ring-orange-900/10">
             <div className="bg-orange-600 p-3 rounded-2xl text-xl shadow-lg rotate-6">🔔</div>
             <p className="text-sm font-bold leading-tight">{showToast}</p>
          </div>
        </div>
      )}
      {showUpload && (
        <div className="fixed inset-0 bg-orange-950/20 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-12 shadow-2xl animate-scaleIn relative border border-orange-100">
            <button onClick={() => setShowUpload(false)} className="absolute top-10 right-10 text-gray-300 hover:text-gray-600 text-4xl transition-colors">&times;</button>
            <div className="mb-10">
              <h2 className="text-3xl font-serif font-bold text-orange-950">{editingBhajan ? 'Edit Sacred Text' : 'Publish to Sangha'}</h2>
              <p className="text-xs text-orange-500 font-bold mt-1 uppercase tracking-widest">Broadcasted to all devices instantly</p>
            </div>
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-orange-400 tracking-[0.2em] ml-1">Kirtan Title</label>
                <input name="title" required defaultValue={editingBhajan?.title || ''} className="w-full p-5 bg-orange-50/50 rounded-2xl border border-orange-100 font-bold focus:outline-none focus:border-orange-500 transition-all text-orange-950 placeholder-orange-200" placeholder="e.g. He Swaminarayan..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-orange-400 tracking-[0.2em] ml-1">Artist / Traditional Poet</label>
                <input name="artist" defaultValue={editingBhajan?.artist || ''} className="w-full p-5 bg-orange-50/50 rounded-2xl border border-orange-100 font-bold focus:outline-none focus:border-orange-500 transition-all text-orange-950 placeholder-orange-200" placeholder="e.g. Brahmanand Swami" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-orange-400 tracking-[0.2em] ml-1">Sacred Lyrics</label>
                <textarea name="lyrics" required rows={6} defaultValue={editingBhajan?.lyrics || ''} className="w-full p-5 bg-orange-50/50 rounded-2xl border border-orange-100 font-serif text-lg leading-relaxed focus:outline-none focus:border-orange-500 transition-all text-gray-800" placeholder="Type or paste the sacred kirtan here..."></textarea>
              </div>
              <button type="submit" disabled={isSyncing} className="w-full py-6 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-orange-700 active:scale-95 transition-all disabled:bg-orange-300 disabled:shadow-none">
                {isSyncing ? 'Synchronizing Cloud...' : (editingBhajan ? 'Update Global Entry' : 'Publish to Global Sangha')}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
