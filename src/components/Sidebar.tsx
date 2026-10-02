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
      {/* Brand Header with Instant Reset / Refresh */}
      <div 
        className="sidebar-header cursor-pointer select-none transition-all hover:bg-white/5 active:scale-[0.99] rounded-lg m-2 p-3"
        onClick={() => {
          window.location.href = '/';
        }}
        title="Kliknutím obnovíte Gamifiter na výchozí herní plochu"
      >
        <img 
          src="/media__1782552769935.png" 
          alt="GAMIFITER Logo" 
          className="sidebar-logo" 
        />
        <div className="flex items-center justify-between w-full mt-1">
          <span className="sidebar-subbrand">Pohybový Portál</span>
          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.5 rounded">v1.0.7</span>
        </div>
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
          className={`sidebar-link w-full text-left flex items-center justify-between ${activeItem === 'sync-research' ? 'active' : ''}`}
        >
          <div className="flex items-center gap-3">
            <Watch className="h-4 w-4" />
            <span>Synchronizace zařízení</span>
          </div>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${activeItem === 'sync-research' ? 'bg-[#007CA6]/15 text-[#007CA6]' : 'bg-white/20 text-white'}`}>
            LIVE
          </span>
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

      {/* Footer UPOL FTK Academic Shield */}
      <div className="sidebar-footer flex items-center justify-center gap-2.5 py-3 px-4 text-white/80 border-t border-white/10">
        <div className="w-6 h-6 rounded-md bg-white/10 border border-white/20 flex items-center justify-center text-xs font-black text-cyan-300">
          UP
        </div>
        <div className="text-[11px] leading-tight">
          <div className="font-bold text-white">FTK Univerzita Palackého</div>
          <div className="text-[9px] text-white/60">Olomouc • Kinantropologie</div>
        </div>
      </div>
    </aside>
  );
};
