import React from 'react';
import { 
  Award, Users, Home, PlayCircle, Archive, 
  Settings, Layers, PlusCircle, Watch 
} from 'lucide-react';

interface SidebarProps {
  activeItem: string;
  onSelect: (item: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem, onSelect }) => {
  return (
    <aside className="sidebar-container">
      {/* Brand Header */}
      <div className="sidebar-header">
        <img 
          src="/media__1782552769935.png" 
          alt="GAMIFITER Logo" 
          className="sidebar-logo" 
        />
        <span className="sidebar-subbrand">Pohybový Portál</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Section: Dashboards */}
        <div className="sidebar-section-title">Dashboardy</div>
        <button 
          onClick={() => onSelect('my-results')}
          className={`sidebar-link w-full text-left ${activeItem === 'my-results' ? 'active' : ''}`}
        >
          <Award className="h-4 w-4" />
          <span>Moje výsledky</span>
        </button>
        <button 
          onClick={() => onSelect('my-class')}
          className={`sidebar-link w-full text-left ${activeItem === 'my-class' ? 'active' : ''}`}
        >
          <Users className="h-4 w-4" />
          <span>Moje třída</span>
        </button>
        <button 
          onClick={() => onSelect('my-school')}
          className={`sidebar-link w-full text-left ${activeItem === 'my-school' ? 'active' : ''}`}
        >
          <Home className="h-4 w-4" />
          <span>Moje škola</span>
        </button>

        {/* Section: Challenges */}
        <div className="sidebar-section-title">Výzvy</div>
        <button 
          onClick={() => onSelect('active-challenge')}
          className={`sidebar-link w-full text-left ${activeItem === 'active-challenge' ? 'active' : ''}`}
        >
          <PlayCircle className="h-4 w-4" />
          <span>Aktuálně běží</span>
        </button>
        <button 
          onClick={() => onSelect('finished-challenges')}
          className={`sidebar-link w-full text-left ${activeItem === 'finished-challenges' ? 'active' : ''}`}
        >
          <Archive className="h-4 w-4" />
          <span>Ukončené</span>
        </button>

        {/* Section: Telemetry / Research */}
        <div className="sidebar-section-title">FTK UP Telemetrie</div>
        <button 
          onClick={() => onSelect('sync-research')}
          className={`sidebar-link w-full text-left ${activeItem === 'sync-research' ? 'active' : ''}`}
        >
          <Watch className="h-4 w-4 text-cyan-600" />
          <span className="font-bold text-[#007CA6]">Synchronizace zařízení</span>
        </button>

        {/* Section: Administration */}
        <div className="sidebar-section-title">Správa</div>
        <button 
          onClick={() => onSelect('admin-school')}
          className={`sidebar-link w-full text-left ${activeItem === 'admin-school' ? 'active' : ''}`}
        >
          <Settings className="h-4 w-4" />
          <span>Správa školy</span>
        </button>
        <button 
          onClick={() => onSelect('admin-challenges')}
          className={`sidebar-link w-full text-left ${activeItem === 'admin-challenges' ? 'active' : ''}`}
        >
          <Layers className="h-4 w-4" />
          <span>Správa výzev</span>
        </button>
        <button 
          onClick={() => onSelect('admin-new-challenge')}
          className={`sidebar-link w-full text-left ${activeItem === 'admin-new-challenge' ? 'active' : ''}`}
        >
          <PlusCircle className="h-4 w-4" />
          <span>Nová výzva</span>
        </button>
      </nav>

      {/* Footer UPOL FTK Logo */}
      <div className="sidebar-footer">
        <img 
          src="/media__1782552619434.png" 
          alt="FTK UPOL Logo" 
          className="sidebar-footer-logo"
        />
      </div>
    </aside>
  );
};
