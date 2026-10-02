import React, { useState } from 'react';
import { Award, Users, Home, PlayCircle, Settings } from 'lucide-react';
import { SettingsModal } from './SettingsModal';

interface TopHeaderProps {
  activeItem: string;
  onSelect?: (item: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ activeItem, onSelect }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [adminName, setAdminName] = useState(() => localStorage.getItem('gamifiter_admin_name') || 'David Prycl');

  const initials = adminName
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'DP';

  const getBreadcrumbs = () => {
    switch (activeItem) {
      case 'my-results':
        return (
          <>
            <Award className="h-4 w-4 text-[#007CA6]" />
            <span className="text-xs font-bold text-gray-500">/ Dashboardy / Moje výsledky</span>
          </>
        );
      case 'my-class':
        return (
          <>
            <Users className="h-4 w-4 text-[#007CA6]" />
            <span className="text-xs font-bold text-gray-500">/ Dashboardy / Moje třída</span>
          </>
        );
      case 'my-school':
        return (
          <>
            <Home className="h-4 w-4 text-[#007CA6]" />
            <span className="text-xs font-bold text-gray-500">/ Dashboardy / Moje škola</span>
          </>
        );
      case 'active-challenge':
        return (
          <>
            <PlayCircle className="h-4 w-4 text-[#007CA6]" />
            <span className="text-xs font-bold text-gray-500">/ Výzvy / Aktuálně běží (Velká tabule)</span>
          </>
        );
      case 'finished-challenges':
        return (
          <>
            <PlayCircle className="h-4 w-4 text-[#007CA6]" />
            <span className="text-xs font-bold text-gray-500">/ Výzvy / Ukončené</span>
          </>
        );
      case 'admin-school':
        return (
          <>
            <Settings className="h-4 w-4 text-[#007CA6]" />
            <span className="text-xs font-bold text-gray-500">/ Správa / Správa školy a tříd</span>
          </>
        );
      case 'admin-challenges':
        return (
          <>
            <Settings className="h-4 w-4 text-[#007CA6]" />
            <span className="text-xs font-bold text-gray-500">/ Správa / Správa výzev</span>
          </>
        );
      case 'sync-research':
        return (
          <>
            <span className="text-xs font-bold text-cyan-600">⚡ FTK UP Telemetrie</span>
            <span className="text-xs font-bold text-gray-500">/ Synchronizace zařízení</span>
          </>
        );
      case 'admin-new-challenge':
        return (
          <>
            <Settings className="h-4 w-4 text-[#007CA6]" />
            <span className="text-xs font-bold text-gray-500">/ Správa / Nová výzva</span>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="top-header-container flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-xs">
        {/* Left side: Navigation Breadcrumbs & Quick League Switches */}
        <div className="top-header-left flex items-center gap-4">
          {getBreadcrumbs()}

          {onSelect && (
            <div className="hidden lg:flex items-center gap-1 ml-4 pl-4 border-l border-gray-200/80 bg-gray-100/80 p-1 rounded-full border border-gray-200/50">
              <button
                onClick={() => onSelect('active-challenge')}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeItem === 'active-challenge'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>🎮 Velká tabule třídy</span>
              </button>
              <button
                onClick={() => onSelect('admin-challenges')}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeItem.startsWith('admin')
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>⚙️ Správa výzev a žáků</span>
              </button>
              <button
                onClick={() => onSelect('sync-research')}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeItem === 'sync-research'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>📱 QR kód třídy</span>
              </button>
            </div>
          )}
        </div>

        {/* Right side: Language, settings, profile */}
        <div className="top-header-right flex items-center gap-3">
          {/* Language Flag Widget */}
          <div className="top-header-lang hidden sm:flex items-center gap-1.5 text-xs text-gray-500 font-semibold px-2 py-1 rounded bg-gray-50 border border-gray-200">
            <img 
              src="https://flagcdn.com/w20/cz.png" 
              alt="Czechia Flag" 
              className="w-4 h-auto rounded-xs"
            />
            <span>Čeština</span>
          </div>

          {/* User Settings Gear */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:text-[#007CA6] hover:bg-gray-100 transition-all cursor-pointer"
            title="Otevřít nastavení systému"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* User Profile info */}
          <div 
            onClick={() => setIsSettingsOpen(true)}
            className="top-header-user flex items-center gap-2.5 pl-3 border-l border-gray-200 cursor-pointer hover:opacity-85 transition-opacity"
            title="Kliknutím upravíte profil správce"
          >
            <div className="text-right">
              <div className="top-header-user-name text-xs font-bold text-gray-800 leading-tight">
                {adminName}
              </div>
              <div className="top-header-user-role text-[10px] font-semibold text-gray-400">
                Superadmin
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#007CA6] text-white flex items-center justify-center font-black text-xs shadow-sm">
              {initials}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={() => {
          setAdminName(localStorage.getItem('gamifiter_admin_name') || 'David Prycl');
        }}
      />
    </>
  );
};
