import React, { useState } from 'react';
import { Award, Users, Home, PlayCircle, Settings, Building2, BookOpen, Smartphone, Menu } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { ResearchModal } from './ResearchModal';

interface TopHeaderProps {
  activeItem: string;
  onSelect?: (item: string) => void;
  onOpenMobileMenu?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ activeItem, onSelect, onOpenMobileMenu }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResearchOpen, setIsResearchOpen] = useState(false);
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
      case 'admin-schools':
        return (
          <>
            <Building2 className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-bold text-gray-500">/ Správa / Správa škol (Superadmin)</span>
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
      case 'admin-invitations':
        return (
          <>
            <Settings className="h-4 w-4 text-[#007CA6]" />
            <span className="text-xs font-bold text-gray-500">/ Správa / Pozvánka pro žáky (QR)</span>
          </>
        );
      case 'admin-reset':
        return (
          <>
            <Settings className="h-4 w-4 text-red-600" />
            <span className="text-xs font-bold text-gray-500">/ Správa / Obnova databáze</span>
          </>
        );
      default:
        return null;
    }
  };

  const getMobileTitle = () => {
    switch (activeItem) {
      case 'my-results': return 'Moje výsledky';
      case 'my-class': return 'Moje třída';
      case 'my-school': return 'Moje škola';
      case 'active-challenge': return 'Aktivní výzva';
      case 'finished-challenges': return 'Ukončené výzvy';
      case 'sync-research': return 'Synchronizace';
      case 'research-info': return 'Výzkum & Zpráva';
      case 'admin-schools': return 'Správa škol';
      case 'admin-school': return 'Správa tříd';
      case 'admin-challenges': return 'Správa výzev';
      case 'admin-new-challenge': return 'Nová výzva';
      case 'admin-invitations': return 'Pozvánky';
      case 'admin-reset': return 'Obnova dat';
      case 'student-mobile': return 'Žákovská appka';
      default: return 'Gamifiter';
    }
  };

  return (
    <>
      <header className="top-header-container bg-white border-b border-gray-200/80 shadow-xs px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-20">
        {/* Left side: Mobile Hamburger + Mobile Title OR Desktop Breadcrumbs */}
        <div className="flex items-center gap-2.5 min-w-0">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden w-11 h-11 rounded-xl text-gray-700 hover:text-[#007CA6] active:bg-gray-200 transition-all cursor-pointer flex items-center justify-center border border-gray-200 shadow-xs bg-gray-50 shrink-0"
              title="Otevřít postranní menu"
              aria-label="Otevřít menu"
            >
              <Menu className="h-6 w-6 stroke-[2.2]" />
            </button>
          )}

          {/* Mobile Single-Row Title */}
          <div className="md:hidden flex items-center gap-2 min-w-0">
            <span className="font-extrabold text-base text-gray-900 tracking-tight truncate">
              {getMobileTitle()}
            </span>
          </div>

          {/* Desktop Breadcrumbs */}
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-500">
            {getBreadcrumbs()}
          </div>
        </div>

        {/* Center: Segmented Navigation Capsule (Desktop only) */}
        <div className="hidden lg:flex items-center gap-2">
          {onSelect && (
            <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-full border border-gray-200/60 shadow-xs">
              <button
                onClick={() => onSelect('active-challenge')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeItem === 'active-challenge'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>🎮 Velká tabule</span>
              </button>
              <button
                onClick={() => onSelect('admin-schools')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeItem === 'admin-schools'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>🏫 Školy</span>
              </button>
              <button
                onClick={() => onSelect('admin-challenges')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeItem.startsWith('admin') && activeItem !== 'admin-schools'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>⚙️ Správa</span>
              </button>
              <button
                onClick={() => onSelect('sync-research')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeItem === 'sync-research'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>📱 QR pro žáky</span>
              </button>
            </div>
          )}

          {/* Research & National Report Button */}
          <button
            onClick={() => setIsResearchOpen(true)}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
            title="Vědecký výzkum z FTK UP a Národní zpráva o pohybové aktivitě"
          >
            <BookOpen className="h-3.5 w-3.5 text-[#007CA6]" />
            <span>📚 Národní zpráva & Výzkum</span>
          </button>
        </div>

        {/* Right side: Language, settings, profile */}
        <div className="top-header-right flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Student Mobile App Quick Switch */}
          {onSelect && (
            <button
              onClick={() => onSelect('student-mobile')}
              className="px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Otevřít mobilní aplikaci pro žáky"
            >
              <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Mobilní appka žáka</span>
              <span className="sm:hidden text-[11px]">Žák</span>
            </button>
          )}

          {/* Language Flag Widget (Desktop only) */}
          <div className="top-header-lang hidden sm:flex items-center gap-1.5 text-xs text-gray-500 font-semibold px-2 py-1 rounded bg-gray-50 border border-gray-200">
            <img 
              src="https://flagcdn.com/w20/cz.png" 
              alt="Czechia Flag" 
              className="w-4 h-auto rounded-xs"
            />
            <span>Čeština</span>
          </div>

          {/* User Settings Gear (Desktop only) */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hidden sm:flex p-2 rounded-lg text-gray-500 hover:text-[#007CA6] hover:bg-gray-100 transition-all cursor-pointer"
            title="Otevřít nastavení systému"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* User Profile info */}
          <div 
            onClick={() => setIsSettingsOpen(true)}
            className="top-header-user flex items-center gap-2 sm:gap-2.5 sm:pl-3 sm:border-l sm:border-gray-200 cursor-pointer hover:opacity-85 transition-opacity"
            title="Kliknutím upravíte profil správce"
          >
            <div className="text-right hidden sm:block">
              <div className="top-header-user-name text-xs font-bold text-gray-800 leading-tight">
                {adminName}
              </div>
              <div className="top-header-user-role text-[10px] font-semibold text-gray-400">
                Superadmin
              </div>
            </div>
            <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-[#007CA6] text-white flex items-center justify-center font-black text-xs sm:text-xs shadow-xs border-2 border-white">
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={() => {
          setAdminName(localStorage.getItem('gamifiter_admin_name') || 'David Prycl');
        }}
      />

      {/* Research & National Physical Activity Guidelines Modal */}
      <ResearchModal
        isOpen={isResearchOpen}
        onClose={() => setIsResearchOpen(false)}
      />
    </>
  );
};
