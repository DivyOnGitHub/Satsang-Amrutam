import React from 'react';
import Layout from './components/Layout';
import BhajanGrid from './components/BhajanGrid';
import CommunityTab from './components/CommunityTab';
import AIGuru from './components/AIGuru';
import { MediaItem, CommunityEvent, UserRole, Notification, Language } from './types';
import { translations } from './utils/translations';

const INITIAL_MEDIA: MediaItem[] = [
  {
    id: '1',
    title: 'Madhurashtakam',
    artist: 'Vallabhacharya',
    type: 'bhajan',
    uploader: 'Prakash Das',
    timestamp: Date.now(),
    lyrics: `Adharam Madhuram Vadanam Madhuram,\nNayanam Madhuram Hasitam Madhuram.\nHridayam Madhuram Gamanam Madhuram,\nMadhu-radhipater Akhilam Madhuram.\n\nVachanam Madhuram Charitam Madhuram,\nVasanam Madhuram Valitam Madhuram.\nChalitam Madhuram Bhramitam Madhuram,\nMadhu-radhipater Akhilam Madhuram.\n\nVenur Madhuru Renur Madhurah,\nPanir Madhurah Padau Madhurau.\nNrityam Madhuram Sakhyam Madhuram,\nMadhu-radhipater Akhilam Madhuram.\n\nGitum Madhuram Pitum Madhuram,\nBhuktam Madhuram Suptam Madhuram.\nRupam Madhuram Tilakam Madhuram,\nMadhu-radhipater Akhilam Madhuram.`
  },
  {
    id: '2',
    title: 'He Swaminarayan He Purushottam',
    type: 'bhajan',
    uploader: 'Gita Sansthan',
    timestamp: Date.now() - 3600000,
    lyrics: `He Swaminarayan He Purushottam\nSadaa Rahejo Amari Saathe\nTamara Charan Ma Sheesh Namavi\nKarun Prarthna Haatho Haathe...\n\nAntaryami Shanti Daata\nAnand Na Sagar Cho Swami\nBhakto Na Hit Kaari Sadaa\nHe Karuna Na Dhaam Ami...\n\nDharmakshetra Ma Avatari Ne\nSatsang Ni Jyot Jalaavi\nSharnagat Na Kashto Kaapi\nDivya Marg Dekhaavi...`
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
  const [role, setRole] = React.useState<UserRole>(UserRole.DEVOTEE);
  const [language, setLanguage] = React.useState<Language>(Language.EN);
  const [activeTab, setActiveTab] = React.useState('home');
  const [media, setMedia] = React.useState<MediaItem[]>(INITIAL_MEDIA);
  const [events, setEvents] = React.useState<CommunityEvent[]>(INITIAL_EVENTS);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [showUpload, setShowUpload] = React.useState(false);
  const [editingBhajan, setEditingBhajan] = React.useState<MediaItem | null>(null);
  const [showToast, setShowToast] = React.useState<string | null>(null);

  const t = translations[language];

  const getUpcomingAdminEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return event.organizer === 'Admin' && eventDate >= today;
    });
  };

  const addNotification = (message: string, type: Notification['type']) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      timestamp: Date.now(),
      isRead: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
    setShowToast(message);
    setTimeout(() => setShowToast(null), 6000);
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleAddEvent = (eventData: Omit<CommunityEvent, 'id'>) => {
    const newEvent = { ...eventData, id: Date.now().toString() };
    setEvents(prev => [...prev, newEvent]);
    addNotification(`${language === Language.GU ? 'નવો કાર્યક્રમ:' : 'New Community Event:'} ${newEvent.title}`, 'event');
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    addNotification(`${language === Language.GU ? 'કાર્યક્રમ સફળતાપૂર્વક રદ કરવામાં આવ્યો છે.' : 'Event successfully deleted.'}`, 'system');
  };

  const handleDeleteBhajan = (id: string) => {
    const itemToDelete = media.find(m => m.id === id);
    if (!itemToDelete) return;
    
    setMedia(prev => prev.filter(m => m.id !== id));
    addNotification(`${itemToDelete.title} ${language === Language.GU ? 'સફળતાપૂર્વક દૂર કરવામાં આવ્યું.' : 'removed successfully.'}`, 'system');
  };

  const handleStartEditBhajan = (item: MediaItem) => {
    setEditingBhajan(item);
    setShowUpload(true);
  };

  const handleUploadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const artist = (formData.get('artist') as string) || undefined;
    const lyrics = formData.get('lyrics') as string;

    if (editingBhajan) {
      setMedia(prev => prev.map(m => 
        m.id === editingBhajan.id 
          ? { ...m, title, artist, lyrics } 
          : m
      ));
      addNotification(`${title} ${language === Language.GU ? 'સફળતાપૂર્વક અપડેટ થયું.' : 'updated successfully.'}`, 'media');
    } else {
      const newItem: MediaItem = {
        id: Date.now().toString(),
        title,
        artist,
        type: 'bhajan',
        uploader: role === UserRole.ADMIN ? 'Admin' : 'Devotee',
        timestamp: Date.now(),
        lyrics
      };
      setMedia(prev => [newItem, ...prev]);
      addNotification(`${newItem.title} ${language === Language.GU ? 'સફળતાપૂર્વક અપલોડ થયું.' : 'uploaded successfully.'}`, 'media');
    }

    setShowUpload(false);
    setEditingBhajan(null);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const renderContent = () => {
    const upcomingAdminEvents = getUpcomingAdminEvents();

    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-12 animate-fadeIn">
            <section className="bg-gradient-to-br from-orange-600 via-orange-700 to-orange-900 rounded-[3rem] p-8 md:p-20 text-white relative overflow-hidden shadow-2xl shadow-orange-100">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-20 -mb-20 blur-2xl"></div>
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] mb-8 border border-white/20">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  {language === Language.GU ? 'જય પુરુષોત્તમ' : 'Jay Purushottam'}
                </div>
                <h2 className="text-5xl md:text-7xl font-serif font-bold mb-8 leading-[1.1] tracking-tight">{t.heroTitle}</h2>
                <p className="text-orange-50 text-xl md:text-2xl mb-12 italic opacity-90 leading-relaxed font-medium max-w-xl">
                  {t.heroSubtitle}
                </p>
                <div className="flex flex-wrap gap-5">
                  <button 
                    onClick={() => setActiveTab('guru')}
                    className="bg-white text-orange-900 px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-50 transition-all shadow-2xl shadow-black/20 active:scale-95"
                  >
                    {t.guru}
                  </button>
                  <button 
                    onClick={() => setActiveTab('community')}
                    className="bg-orange-800/40 backdrop-blur-md text-white border border-white/30 px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-800/60 transition-all active:scale-95"
                  >
                    {t.community}
                  </button>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-end justify-between mb-10 border-b border-orange-100 pb-6">
                <div>
                  <h3 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">{t.featuredBhajans}</h3>
                  <p className="text-gray-500 text-sm mt-1 font-medium">{language === Language.GU ? 'સૌથી લોકપ્રિય કીર્તન' : 'Top spiritual kirtans from the community'}</p>
                </div>
                <button onClick={() => setActiveTab('bhajans')} className="text-orange-600 text-xs font-black uppercase tracking-widest hover:text-orange-800 px-5 py-2.5 bg-orange-50 rounded-2xl transition-all border border-orange-100">{t.viewAll}</button>
              </div>
              <BhajanGrid 
                items={media.slice(0, 4)} 
                language={language} 
                role={role} 
                onDelete={handleDeleteBhajan} 
                onEdit={handleStartEditBhajan}
              />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-orange-100 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">{t.upcomingNearYou}</h3>
                  <button onClick={() => setActiveTab('community')} className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline">Calendar</button>
                </div>
                <div className="space-y-6 flex-1">
                  {upcomingAdminEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center flex-1">
                      <div className="text-4xl opacity-20 mb-4">🕯️</div>
                      <p className="text-gray-400 italic text-sm font-medium">{t.noEvents}</p>
                    </div>
                  ) : (
                    upcomingAdminEvents.slice(0, 3).map(e => (
                      <div key={e.id} className="flex gap-5 items-center group cursor-pointer relative" onClick={() => setActiveTab('community')}>
                        <div className="w-16 h-16 bg-orange-50 text-orange-900 rounded-2xl flex flex-col items-center justify-center font-black shadow-inner border border-orange-100 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                          <span className="text-[10px] uppercase leading-none mb-1 opacity-60 tracking-widest">{new Date(e.date).toLocaleString('default', { month: 'short' })}</span>
                          <span className="text-2xl leading-none">{new Date(e.date).getDate()}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors leading-tight">{e.title}</h4>
                          <p className="text-xs text-gray-400 mt-1 font-medium">{e.location} • {e.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="bg-orange-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden flex flex-col justify-center min-h-[300px] shadow-2xl">
                 <div className="absolute bottom-0 right-0 p-6 opacity-10 pointer-events-none">
                    <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21l-8.228-3.352a.5.5 0 01-.272-.447V5.51a.5.5 0 01.728-.447L12 8.352l7.772-3.289a.5.5 0 01.728.447v11.691a.5.5 0 01-.272.447L12 21z" /></svg>
                 </div>
                 <div className="inline-flex w-fit bg-orange-600/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-4 border border-orange-600/30">LOCKED SOURCE</div>
                 <h3 className="text-3xl font-serif font-bold mb-4 relative z-10 leading-tight">{t.guru}</h3>
                 <p className="text-orange-200/70 text-sm mb-10 relative z-10 leading-relaxed font-medium">
                   Seek precise guidance based on the 273 canonical discourses of the Vachanãmrut. Your spiritual journey, guided by words of wisdom.
                 </p>
                 <button onClick={() => setActiveTab('guru')} className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-500 transition-all shadow-2xl shadow-orange-950 active:scale-95 relative z-10">
                   {t.seekGuidance}
                 </button>
              </div>
            </section>
          </div>
        );
      case 'bhajans':
        return (
          <div className="space-y-10 animate-fadeIn">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-orange-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">{t.bhajans}</h2>
                <p className="text-gray-500 text-sm mt-1 font-medium">{language === Language.GU ? 'કીર્તન ભક્તિ - આત્મા માટે અમૃત' : 'Kirtan Bhakti - Divine nectar for the soul'}</p>
              </div>
              <button 
                onClick={() => {
                  setEditingBhajan(null);
                  setShowUpload(true);
                }}
                className="bg-orange-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 flex items-center gap-3 active:scale-95 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {language === Language.GU ? 'કીર્તન અપલોડ' : 'Upload Kirtan'}
              </button>
            </div>
            <BhajanGrid 
              items={media} 
              language={language} 
              role={role} 
              onDelete={handleDeleteBhajan} 
              onEdit={handleStartEditBhajan}
            />
          </div>
        );
      case 'community':
        return (
          <CommunityTab 
            events={events} 
            role={role} 
            language={language} 
            onAddEvent={handleAddEvent} 
            onDeleteEvent={handleDeleteEvent}
          />
        );
      case 'guru':
        return <AIGuru role={role} language={language} />;
      default:
        return null;
    }
  };

  return (
    <Layout 
      role={role} 
      setRole={setRole} 
      language={language}
      setLanguage={setLanguage}
      notifications={notifications}
      onMarkRead={markNotificationRead}
      onClearAllNotifications={handleClearAllNotifications}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {renderContent()}

      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 animate-slideDown">
          <div className="bg-orange-950 text-white p-5 rounded-3xl shadow-2xl flex items-center gap-4 border border-orange-800 shadow-orange-950/20">
             <div className="bg-orange-600 p-2.5 rounded-2xl shadow-lg text-lg rotate-12">🔔</div>
             <p className="text-sm font-bold leading-tight tracking-tight">{showToast}</p>
          </div>
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-orange-950/20 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-12 shadow-2xl animate-scaleIn border border-orange-100 relative">
            <button 
              onClick={() => {
                setShowUpload(false);
                setEditingBhajan(null);
              }} 
              className="absolute top-10 right-10 text-gray-300 hover:text-gray-600 text-3xl"
            >
              &times;
            </button>
            <h2 className="text-3xl font-serif font-bold text-orange-900 mb-10 tracking-tight">
              {editingBhajan ? t.editMedia : t.uploadMedia}
            </h2>
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-3">{t.title}</label>
                <input 
                  name="title" 
                  required 
                  defaultValue={editingBhajan?.title || ''}
                  className="w-full px-6 py-4 bg-orange-50/30 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold text-orange-900" 
                  placeholder="e.g. He Swaminarayan..." 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-3">{t.artist}</label>
                <input 
                  name="artist" 
                  defaultValue={editingBhajan?.artist || ''}
                  className="w-full px-6 py-4 bg-orange-50/30 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-bold text-orange-900" 
                  placeholder="e.g. Narsinh Mehta" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-3">{t.mediaFile}</label>
                <textarea 
                  name="lyrics" 
                  required 
                  rows={6}
                  defaultValue={editingBhajan?.lyrics || ''}
                  className="w-full px-6 py-4 bg-orange-50/30 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-serif text-lg leading-relaxed" 
                  placeholder="Paste the sacred bhajan text here..."
                ></textarea>
              </div>
              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowUpload(false);
                    setEditingBhajan(null);
                  }} 
                  className="flex-1 px-4 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-700 shadow-xl shadow-orange-100 active:scale-95 transition-all"
                >
                  {editingBhajan ? t.updateNow : t.uploadNow}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;