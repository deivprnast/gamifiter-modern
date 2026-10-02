import React from 'react';
import { Award, Users, Home, PlayCircle, Settings } from 'lucide-react';

interface TopHeaderProps {
  activeItem: string;
  onSelect?: (item: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ activeItem, onSelect }) => {
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
            <span className="text-xs font-bold text-gray-500">/ Výzvy / Aktuálně běží</span>
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
    <div className="top-header-container flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
      {/* Left side: Navigation Breadcrumbs & Quick Switches */}
      <div className="top-header-left flex items-center gap-4">
        {getBreadcrumbs()}

        {onSelect && (
          <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
            <button
              onClick={() => onSelect('active-challenge')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                activeItem === 'active-challenge'
                  ? 'bg-[#007CA6] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🎮 Velká tabule
            </button>
            <button
              onClick={() => onSelect('admin-challenges')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                activeItem.startsWith('admin')
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⚙️ Správa výzev
            </button>
            <button
              onClick={() => onSelect('sync-research')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                activeItem === 'sync-research'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📱 QR kód třídy
            </button>
          </div>
        )}
      </div>

      {/* Right side: Language, settings, profile */}
      <div className="top-header-right">
        {/* Language Flag Widget */}
        <div className="top-header-lang">
          <img 
            src="https://flagcdn.com/w20/cz.png" 
            alt="Czechia Flag" 
            className="top-header-lang-flag"
          />
          <span>Czech (Czechia)</span>
        </div>

        {/* User Settings Gear */}
        <Settings className="top-header-nav-icon h-4 w-4 cursor-pointer" />

        {/* User Profile info */}
        <div className="top-header-user">
          <div className="text-right">
            <div className="top-header-user-name">David Prycl</div>
            <div className="top-header-user-role">Superadmin</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#007CA6] text-white flex items-center justify-center font-bold text-xs">
            DP
          </div>
        </div>
      </div>
    </div>
  );
};
