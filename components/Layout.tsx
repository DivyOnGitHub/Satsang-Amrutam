
import React from 'react';
import { UserRole, Notification, Language } from '../types';
import { translations } from '../utils/translations';

const SECRET_ADMIN_PIN = "1954"; // This is the access key you can share with selected people

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  setRole: (role: UserRole) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
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
      // Switching back to devotee is always allowed
      setRole(UserRole.DEVOTEE);
    } else {
      // Switching to admin needs verification
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
      <header className="bg-white shadow-sm sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-2 rounded-full">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21l-8.228-3.352a.5.5 0 01-.272-.447V5.51a.5.5 0 01.728-.447L12 8.352l7.772-3.289a.5.5 0 01.728.447v11.691a.5.5 0 01-.272.447L12 21z" />
            </svg>
          </div>
          <h1 className="text-xl md:text-2xl font-serif font-bold text-orange-900">{t.appName}</h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Locked Admin Switch */}
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full border border-gray-200">
            <div className={`w-2 h-2 rounded-full ${role === UserRole.ADMIN ? 'bg-orange-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-[10px] md:text-xs font-bold text-gray-600 truncate max-w-[60px] md:max-w-none uppercase tracking-tight">
              {role === UserRole.ADMIN ? t.adminMode : t.devoteeMode}
            </span>
            <button 
              onClick={handleSwitchRequest}
              className="text-orange-600 hover:text-orange-700 font-black text-[10px] md:text-xs ml-1 flex items-center gap-1"
            >
              {role === UserRole.DEVOTEE && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              {t.switch}
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-lg border border-gray-100 overflow-hidden z-50">
                <div className="p-3 border-b border-gray-100 font-semibold text-gray-700 flex justify-between">
                  <span>{t.notifications}</span>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400">&times;</button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">{t.noNotifications}</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-orange-50 ${!n.isRead ? 'bg-orange-50/30' : ''}`}
                        onClick={() => onMarkRead(n.id)}
                      >
                        <p className="text-sm text-gray-800">{n.message}</p>
                        <span className="text-[10px] text-gray-400">{new Date(n.timestamp).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center bg-orange-50 p-1 rounded-full border border-orange-100">
            <button 
              onClick={() => setLanguage(Language.EN)}
              className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${language === Language.EN ? 'bg-orange-600 text-white shadow-sm' : 'text-orange-800 hover:bg-orange-100'}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLanguage(Language.GU)}
              className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${language === Language.GU ? 'bg-orange-600 text-white shadow-sm' : 'text-orange-800 hover:bg-orange-100'}`}
            >
              GU
            </button>
          </div>
        </div>
      </header>

      {/* Admin Verification Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl border border-orange-100 animate-scaleIn">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-serif font-bold text-orange-900">{t.adminAuthTitle}</h2>
              <p className="text-gray-500 text-xs mt-2">{t.enterAdminPin}</p>
            </div>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <input 
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(false);
                  }}
                  autoFocus
                  className={`w-full px-4 py-4 text-center text-2xl tracking-[1em] font-black bg-orange-50 border ${error ? 'border-red-500' : 'border-orange-100'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all`}
                  placeholder="••••"
                />
                {error && <p className="text-red-500 text-[10px] font-bold text-center mt-2 animate-bounce">{t.invalidPin}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 shadow-lg active:scale-95 transition-all"
                >
                  {t.verify}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 pb-24">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 flex justify-around items-center z-40 md:relative md:bg-transparent md:border-none">
        <NavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} label={t.home} icon={<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />} />
        <NavItem active={activeTab === 'bhajans'} onClick={() => setActiveTab('bhajans')} label={t.bhajans} icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c1.097 0 2.16.187 3.152.552m1.848-12.504A8.967 8.967 0 0118 3.75c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-1.097 0-2.16.187-3.152.552m1.848-12.504V18.75m-1.848-12.504c-1.052 0-2.062.18-3 .512v14.25c.938-.332 1.948-.512 3-.512m-1.848-12.504V18.75" />} />
        <NavItem active={activeTab === 'community'} onClick={() => setActiveTab('community')} label={t.community} icon={<path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />} />
        <NavItem active={activeTab === 'guru'} onClick={() => setActiveTab('guru')} label={t.guru} icon={<path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />} />
      </nav>
    </div>
  );
};

const NavItem = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
  >
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
      {icon}
    </svg>
    <span className="text-[10px] font-medium whitespace-nowrap">{label}</span>
  </button>
);

export default Layout;
