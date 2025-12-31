
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
    setTimeout(() => setShowToast(null), 5000);
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
          <div className="space-y-10 animate-fadeIn">
            <section className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-[2rem] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="relative z-10 max-w-2xl">
                <span className="inline-block bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                  {language === Language.GU ? 'જય પુરુષોત્તમ' : 'Jay Purushottam'}
                </span>
                <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight">{t.heroTitle}</h2>
                <p className="text-orange-100 text-lg md:text-xl mb-10 italic opacity-90 leading-relaxed font-medium">
                  {t.heroSubtitle}
                </p>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => setActiveTab('guru')}
                    className="bg-white text-orange-600 px-10 py-4 rounded-2xl font-bold hover:bg-orange-50 transition-all shadow-xl active:scale-95"
                  >
                    {t.guru}
                  </button>
                  <button 
                    onClick={() => setActiveTab('community')}
                    className="bg-orange-700/50 text-white border border-white/30 px-10 py-4 rounded-2xl font-bold hover:bg-orange-700 transition-all active:scale-95"
                  >
                    {t.community}
                  </button>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-end justify-between mb-8 border-b border-orange-100 pb-4">
                <div>
                  <h3 className="text-3xl font-serif font-bold text-gray-900">{t.featuredBhajans}</h3>
                  <p className="text-gray-500 text-sm">{language === Language.GU ? 'સૌથી લોકપ્રિય કીર્તન' : 'Top spiritual kirtans from the community'}</p>
                </div>
                <button onClick={() => setActiveTab('bhajans')} className="text-orange-600 text-sm font-bold hover:text-orange-700 px-4 py-2 bg-orange-50 rounded-xl transition-all">{t.viewAll}</button>
              </div>
              <BhajanGrid 
                items={media.slice(0, 4)} 
                language={language} 
                role={role} 
                onDelete={handleDeleteBhajan} 
                onEdit={handleStartEditBhajan}
              />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-orange-50">
                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6">{t.upcomingNearYou}</h3>
                <div className="space-y-6">
                  {upcomingAdminEvents.length === 0 ? (
                    <div className="flex flex-col items-center py-4 text-center">
                      <div className="text-3xl opacity-20 mb-2">🧘</div>
                      <p className="text-gray-400 italic text-sm">{t.noEvents}</p>
                    </div>
                  ) : (
                    upcomingAdminEvents.slice(0, 3).map(e => (
                      <div key={e.id} className="flex gap-4 items-center group cursor-pointer relative" onClick={() => setActiveTab('community')}>
                        <div className="w-14 h-14 bg-orange-100 text-orange-700 rounded-2xl flex flex-col items-center justify-center font-black shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-colors">
                          <span className="text-xs uppercase leading-none mb-1 opacity-70">{new Date(e.date).toLocaleString('default', { month: 'short' })}</span>
                          <span className="text-xl leading-none">{new Date(e.date).getDate()}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 group-hover:text-orange-900">{e.title}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">{e.location} • {e.time}</p>
                        </div>
                        {role === UserRole.ADMIN && (
                          <button 
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              if (window.confirm(language === Language.GU ? 'શું તમે આ કાર્યક્રમ રદ કરવા માંગો છો?' : 'Are you sure you want to delete this event?')) {
                                handleDeleteEvent(e.id);
                              }
                            }}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                            title="Delete Event"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="bg-orange-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-center">
                 <div className="absolute bottom-0 right-0 p-4 opacity-10">
                    <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21l-8.228-3.352a.5.5 0 01-.272-.447V5.51a.5.5 0 01.728-.447L12 8.352l7.772-3.289a.5.5 0 01.728.447v11.691a.5.5 0 01-.272.447L12 21z" /></svg>
                 </div>
                 <h3 className="text-2xl font-serif font-bold mb-4 relative z-10">{t.guru}</h3>
                 <p className="text-orange-200 text-sm mb-6 relative z-10 leading-relaxed">
                   {language === Language.GU 
                    ? 'તમારા આત્માની શંકાઓ દૂર કરો. વચનામૃતના ૨૭૩ પ્રમાણભૂત પ્રવચનો પરથી સચોટ માર્ગદર્શન મેળવો.'
                    : 'Clear the doubts of your soul. Seek precise guidance based on the 273 canonical discourses of the Vachanãmrut.'}
                 </p>
                 <button onClick={() => setActiveTab('guru')} className="w-full py-4 bg-orange-600 rounded-2xl font-bold hover:bg-orange-500 transition-all shadow-lg active:scale-95 relative z-10">
                   {t.seekGuidance}
                 </button>
              </div>
            </section>
          </div>
        );
      case 'bhajans':
        return (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-serif font-bold text-gray-900">{t.bhajans}</h2>
                <p className="text-gray-500 text-sm mt-1">{language === Language.GU ? 'કીર્તન ભક્તિ - આત્મા માટે અમૃત' : 'Kirtan Bhakti - Divine nectar for the soul'}</p>
              </div>
              <button 
                onClick={() => {
                  setEditingBhajan(null);
                  setShowUpload(true);
                }}
                className="bg-orange-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-orange-700 transition-all shadow-lg flex items-center gap-2 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {renderContent()}

      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 animate-bounce">
          <div className="bg-orange-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-orange-700">
             <div className="bg-orange-600 p-2 rounded-full animate-pulse text-lg">🔔</div>
             <p className="text-sm font-bold leading-tight">{showToast}</p>
          </div>
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-scaleIn border border-orange-100 relative">
            <button 
              onClick={() => {
                setShowUpload(false);
                setEditingBhajan(null);
              }} 
              className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 text-3xl"
            >
              &times;
            </button>
            <h2 className="text-3xl font-serif font-bold text-orange-900 mb-8">
              {editingBhajan ? t.editMedia : t.uploadMedia}
            </h2>
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">{t.title}</label>
                <input 
                  name="title" 
                  required 
                  defaultValue={editingBhajan?.title || ''}
                  className="w-full px-5 py-3 bg-orange-50/50 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-medium" 
                  placeholder="e.g. He Swaminarayan..." 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">{t.artist}</label>
                <input 
                  name="artist" 
                  defaultValue={editingBhajan?.artist || ''}
                  className="w-full px-5 py-3 bg-orange-50/50 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-medium" 
                  placeholder="e.g. Narsinh Mehta" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">{t.mediaFile}</label>
                <textarea 
                  name="lyrics" 
                  required 
                  rows={6}
                  defaultValue={editingBhajan?.lyrics || ''}
                  className="w-full px-5 py-3 bg-orange-50/50 border border-orange-100 rounded-2xl focus:outline-none focus:border-orange-500 font-serif text-lg" 
                  placeholder="Paste the sacred bhajan text here..."
                ></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowUpload(false);
                    setEditingBhajan(null);
                  }} 
                  className="flex-1 px-4 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 shadow-xl active:scale-95"
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
