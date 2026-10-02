import React from 'react';
import { 
  Award, Users, Home, PlayCircle, Archive, 
  Settings, Layers, PlusCircle, Watch, Building2, BookOpen, Smartphone, X 
} from 'lucide-react';

interface SidebarProps {
  activeItem: string;
  onSelect: (item: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem, onSelect, isOpen = false, onClose }) => {
  const handleItemSelect = (item: string) => {
    onSelect(item);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Dark Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity animate-fade-in"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside 
        className={`sidebar-container fixed md:sticky top-0 left-0 h-screen z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header with Instant Reset / Refresh and Mobile Close Button */}
        <div className="flex items-center justify-between p-2 m-2">
          <div 
            className="sidebar-header cursor-pointer select-none transition-all hover:bg-white/5 active:scale-[0.99] rounded-lg p-1 flex-1"
            onClick={() => handleItemSelect('active-challenge')}
            title="Kliknutím se vrátíte na výchozí herní plochu"
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

          {/* Close button for Mobile Drawer */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer ml-1"
              title="Zavřít menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav flex-1 overflow-y-auto">
          {/* Section: Dashboards */}
          <div className="sidebar-section-title">Dashboardy</div>
          <button 
            onClick={() => handleItemSelect('my-results')}
            className={`sidebar-link w-full text-left ${activeItem === 'my-results' ? 'active' : ''}`}
          >
            <Award className="h-4 w-4" />
            <span>Moje výsledky</span>
          </button>
          <button 
            onClick={() => handleItemSelect('my-class')}
            className={`sidebar-link w-full text-left ${activeItem === 'my-class' ? 'active' : ''}`}
          >
            <Users className="h-4 w-4" />
            <span>Moje třída</span>
          </button>
          <button 
            onClick={() => handleItemSelect('my-school')}
            className={`sidebar-link w-full text-left ${activeItem === 'my-school' ? 'active' : ''}`}
          >
            <Home className="h-4 w-4" />
            <span>Moje škola</span>
          </button>

          {/* Section: Challenges */}
          <div className="sidebar-section-title">Výzvy</div>
          <button 
            onClick={() => handleItemSelect('active-challenge')}
            className={`sidebar-link w-full text-left ${activeItem === 'active-challenge' ? 'active' : ''}`}
          >
            <PlayCircle className="h-4 w-4" />
            <span>Aktuálně běží</span>
          </button>
          <button 
            onClick={() => handleItemSelect('finished-challenges')}
            className={`sidebar-link w-full text-left ${activeItem === 'finished-challenges' ? 'active' : ''}`}
          >
            <Archive className="h-4 w-4" />
            <span>Ukončené</span>
          </button>

          {/* Section: Telemetry / Research */}
          <div className="sidebar-section-title">FTK UP Telemetrie</div>
          <button 
            onClick={() => handleItemSelect('student-mobile')}
            className={`sidebar-link w-full text-left flex items-center justify-between ${activeItem === 'student-mobile' ? 'active' : ''}`}
          >
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-emerald-300" />
              <span>Mobilní appka žáka</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-400/20 text-emerald-300">
              PRO ŽÁKY
            </span>
          </button>
          <button 
            onClick={() => handleItemSelect('sync-research')}
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
          <button 
            onClick={() => handleItemSelect('research-info')}
            className={`sidebar-link w-full text-left ${activeItem === 'research-info' ? 'active' : ''}`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Národní zpráva & Výzkum</span>
          </button>

          {/* Section: Administration */}
          <div className="sidebar-section-title">Správa</div>
          <button 
            onClick={() => handleItemSelect('admin-schools')}
            className={`sidebar-link w-full text-left flex items-center justify-between ${activeItem === 'admin-schools' ? 'active' : ''}`}
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-indigo-400" />
              <span>Správa škol</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-indigo-500/25 text-indigo-200">
              SUPERADMIN
            </span>
          </button>
          <button 
            onClick={() => handleItemSelect('admin-school')}
            className={`sidebar-link w-full text-left ${activeItem === 'admin-school' || activeItem === 'admin-reset' ? 'active' : ''}`}
          >
            <Settings className="h-4 w-4" />
            <span>Správa tříd</span>
          </button>
          <button 
            onClick={() => handleItemSelect('admin-challenges')}
            className={`sidebar-link w-full text-left ${activeItem === 'admin-challenges' || activeItem === 'admin-invitations' ? 'active' : ''}`}
          >
            <Layers className="h-4 w-4" />
            <span>Správa výzev</span>
          </button>
          <button 
            onClick={() => handleItemSelect('admin-new-challenge')}
            className={`sidebar-link w-full text-left ${activeItem === 'admin-new-challenge' ? 'active' : ''}`}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Nová výzva</span>
          </button>
        </nav>

        {/* Footer UPOL FTK Academic Shield */}
        <div className="sidebar-footer flex items-center justify-center gap-2.5 py-3 px-4 text-white/80 border-t border-white/10 shrink-0">
          <div className="w-6 h-6 rounded-md bg-white/10 border border-white/20 flex items-center justify-center text-xs font-black text-cyan-300">
            UP
          </div>
          <div className="text-[11px] leading-tight">
            <div className="font-bold text-white">FTK Univerzita Palackého</div>
            <div className="text-[9px] text-white/60">Olomouc • Kinantropologie</div>
          </div>
        </div>
      </aside>
    </>
  );
};
