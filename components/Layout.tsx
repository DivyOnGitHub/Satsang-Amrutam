import React from 'react';
import { UserRole, Notification, Language } from '../types';
import { translations } from '../utils/translations';

const SECRET_ADMIN_PIN = "1954"; 

interface LayoutProps {
  // Fix: Changed React.Node to React.ReactNode
  children: React.ReactNode;
  role: UserRole;
  setRole: (role: UserRole) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onClearAllNotifications: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  role, 
  setRole, 
  language,
  setLanguage,
  notifications, 
  onMarkRead,
  onClearAllNotifications,
  activeTab,
  setActiveTab
}) => {
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState(false);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const t = translations[language];

  const handleSwitchRequest = () => {
    if (role === UserRole.ADMIN) {
      setRole(UserRole.DEVOTEE);
    } else {
      setShowAuthModal(true);
      setError(false);
      setPin("");
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === SECRET_ADMIN_PIN) {
      setRole(UserRole.ADMIN);
      setShowAuthModal(false);
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fffaf0]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b border-orange-100">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="bg-orange-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-orange-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 21l-8.228-3.352a.5.5 0 01-.272-.447V5.51a.5.5 0 01.728-.447L12 8.352l7.772-3.289a.5.5 0 01.728.447v11.691a.5.5 0 01-.272.447L12 21z" />
            </svg>
          </div>
          <h1 className="text-xl md:text-2xl font-serif font-bold text-orange-900 tracking-tight">{t.appName}</h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full border border-orange-100">
            <div className={`w-2 h-2 rounded-full ${role === UserRole.ADMIN ? 'bg-green-500 animate-pulse' : 'bg-orange-300'}`}></div>
            <span className="text-[10px] font-bold text-orange-900 uppercase tracking-tighter">
              {role === UserRole.ADMIN ? t.adminMode : t.devoteeMode}
            </span>
            <button onClick={handleSwitchRequest} className="text-orange-600 hover:text-orange-700 font-black text-[10px] ml-1 underline decoration-dotted">
              {t.switch}
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 text-orange-900 hover:bg-orange-50 rounded-2xl relative transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white shadow-2xl rounded-3xl border border-orange-100 overflow-hidden z-[60] animate-scaleIn">
                <div className="p-4 border-b border-orange-50 flex justify-between items-center bg-orange-50/50">
                  <span className="font-bold text-orange-900">{t.notifications}</span>
                  <div className="flex gap-2">
                    {notifications.length > 0 && (
                      <button onClick={onClearAllNotifications} className="text-[10px] font-black text-orange-600 uppercase hover:underline">Clear All</button>
                    )}
                    <button onClick={() => setShowNotifications(false)} className="text-gray-400">&times;</button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 text-sm">
                      <div className="text-3xl mb-2 opacity-20">🕊️</div>
                      {t.noNotifications}
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-4 border-b border-orange-50 cursor-pointer transition-colors ${!n.isRead ? 'bg-orange-50/20 hover:bg-orange-50' : 'hover:bg-gray-50'}`}
                        onClick={() => onMarkRead(n.id)}
                      >
                        <div className="flex gap-3">
                          <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.type === 'event' ? 'bg-blue-500' : n.type === 'media' ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
                          <div>
                            <p className="text-sm text-gray-800 leading-tight">{n.message}</p>
                            <span className="text-[10px] text-gray-400 mt-1 block font-medium">{new Date(n.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center bg-orange-100/50 p-1 rounded-2xl border border-orange-200">
            <button 
              onClick={() => setLanguage(Language.EN)}
              className={`px-3 py-1 text-[10px] font-black rounded-xl transition-all ${language === Language.EN ? 'bg-orange-600 text-white shadow-md' : 'text-orange-800 hover:bg-orange-200'}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLanguage(Language.GU)}
              className={`px-3 py-1 text-[10px] font-black rounded-xl transition-all ${language === Language.GU ? 'bg-orange-600 text-white shadow-md' : 'text-orange-800 hover:bg-orange-200'}`}
            >
              GU
            </button>
          </div>
        </div>
      </header>

      {/* Admin Verification Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-orange-950/20 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-orange-100 animate-scaleIn">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-orange-100 rounded-3xl rotate-3 flex items-center justify-center mx-auto mb-6 text-orange-600 shadow-inner">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif font-bold text-orange-900">{t.adminAuthTitle}</h2>
              <p className="text-gray-400 text-xs mt-2 font-medium">{t.enterAdminPin}</p>
            </div>
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <input 
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(false);
                  }}
                  autoFocus
                  className={`w-full px-4 py-5 text-center text-3xl tracking-[1em] font-black bg-orange-50 border-2 ${error ? 'border-red-500 animate-shake' : 'border-orange-100'} rounded-3xl focus:outline-none focus:border-orange-500 transition-all`}
                  placeholder="••••"
                />
                {error && <p className="text-red-500 text-[10px] font-black text-center mt-3 uppercase tracking-widest">{t.invalidPin}</p>}
              </div>
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                  }}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 shadow-xl active:scale-95 transition-all"
                >
                  {t.verify}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 pb-24 lg:px-8">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-orange-100 py-4 px-6 flex justify-around items-center z-40 md:relative md:bg-white md:rounded-full md:max-w-xl md:mx-auto md:mb-6 md:shadow-xl md:px-8">
        <NavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} label={t.home} icon={<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />} />
        <NavItem active={activeTab === 'bhajans'} onClick={() => setActiveTab('bhajans')} label={t.bhajans} icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c1.097 0 2.16.187 3.152.552m1.848-12.504A8.967 8.967 0 0118 3.75c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-1.097 0-2.16.187-3.152.552m1.848-12.504V18.75m-1.848-12.504c-1.052 0-2.062.18-3 .512v14.25c.938-.332 1.948-.512 3-.512m-1.848-12.504V18.75" />} />
        <NavItem active={activeTab === 'community'} onClick={() => setActiveTab('community')} label={t.community} icon={<path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />} />
        <NavItem active={activeTab === 'guru'} onClick={() => setActiveTab('guru')} label={t.guru} icon={<path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />} />
      </nav>
    </div>
  );
};

// Fix: Changed icon: React.Node to icon: React.ReactNode
const NavItem = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${active ? 'text-orange-600 scale-110' : 'text-gray-400 hover:text-orange-400 hover:scale-105'}`}
  >
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
      {icon}
    </svg>
    <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
    {active && <div className="absolute -top-1 w-1 h-1 bg-orange-600 rounded-full animate-pulse shadow-sm shadow-orange-500"></div>}
  </button>
);

export default Layout;