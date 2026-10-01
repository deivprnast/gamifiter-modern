import React from 'react';
import { Award, Users, Home, PlayCircle, Settings } from 'lucide-react';

interface TopHeaderProps {
  activeItem: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ activeItem }) => {
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
            <span className="text-xs font-bold text-gray-500">/ Správa / Správa školy</span>
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
    <div className="top-header-container">
      {/* Left side: Navigation Breadcrumbs */}
      <div className="top-header-left">
        {getBreadcrumbs()}
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
            <div className="top-header-user-name">Michal Vorlíček</div>
            <div className="top-header-user-role">Superadmin</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#007CA6] text-white flex items-center justify-center font-bold text-xs">
            MV
          </div>
        </div>
      </div>
    </div>
  );
};
