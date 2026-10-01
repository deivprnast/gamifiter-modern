import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { 
  getChallenges, getGroups, getStudents, 
  getActiveChallengeId, setActiveChallengeId, 
  getActiveGroupId, setActiveGroupId, 
  getGroupProgress, updateStudentSteps, 
  initializeStorage
} from './services/storage';
import { type Challenge, type Group, type Student, type ModuleType } from './types';

// Layout & Replicated Navigation Components
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';

// Dashboard Views
import { MyResults } from './components/dashboards/MyResults';
import { MyClass } from './components/dashboards/MyClass';
import { MySchool } from './components/dashboards/MySchool';
import { AdminPanel } from './components/AdminPanel';

// Game Module Views
import { ModuleMap } from './components/games/ModuleMap';
import { ModuleDistricts } from './components/games/ModuleDistricts';
import { ModulePuzzle } from './components/games/ModulePuzzle';
import { ModulePixelate } from './components/games/ModulePixelate';
import { ModuleNetwork } from './components/games/ModuleNetwork';

// Telemetry & Device Sync Views (FTK UP Research)
import { SyncResearchPanel } from './components/SyncResearchPanel';
import { MobileSyncPortal } from './components/MobileSyncPortal';

// Icons
import { Map, MapPin, Grid, Sparkles, Network, Activity, Play, Pause, ChevronUp, ChevronDown } from 'lucide-react';

function App() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [activeChallengeId, setActiveChallengeIdState] = useState('');
  const [activeGroupId, setActiveGroupIdState] = useState('');
  const [activeItem, setActiveItem] = useState('my-results'); // Sidebar active link
  const [gameTab, setGameTab] = useState<ModuleType>('map');
  
  // Collapsible Simulator Drawer state
  const [isSimOpen, setIsSimOpen] = useState(true);

  // Mobile sync portal route check
  const [showMobilePortal, setShowMobilePortal] = useState(
    window.location.pathname === '/sync' || window.location.search.includes('token=')
  );

  // Sync toast notifications
  const [syncToast, setSyncToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false
  });

  // Autoplay simulation timer
  const [isAutoplay, setIsAutoplay] = useState(false);
  const autoplayTimer = useRef<number | null>(null);

  // Initialize storage & state
  useEffect(() => {
    initializeStorage();
    loadAllData();
  }, []);

  // Global SSE listener for real-time mobile sync from Garmin/Health Connect
  useEffect(() => {
    const eventSource = new EventSource('/api/sync/events');

    eventSource.addEventListener('sync_received', (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        setSyncToast({
          message: `⚡ TELEMETRIE FTK: ${payload.studentName} (${payload.device}) +${payload.stepDelta?.toLocaleString()} kroků!`,
          visible: true
        });
        updateStudentSteps(payload.studentId, payload.totalSteps);
        setStudents(getStudents());
      } catch (err) {
        console.error('SSE sync error:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const loadAllData = () => {
    const loadedChallenges = getChallenges();
    const loadedGroups = getGroups();
    const loadedStudents = getStudents();
    
    setChallenges(loadedChallenges);
    setGroups(loadedGroups);
    setStudents(loadedStudents);

    const activeC = getActiveChallengeId();
    const activeG = getActiveGroupId();

    setActiveChallengeIdState(activeC);
    setActiveGroupIdState(activeG);

    const currentChallenge = loadedChallenges.find(c => c.id === activeC);
    if (currentChallenge) {
      setGameTab(currentChallenge.moduleType);
    }
  };

  const handleChallengeChange = (id: string) => {
    setActiveChallengeId(id);
    setActiveChallengeIdState(id);
    const selected = challenges.find(c => c.id === id);
    if (selected) {
      setGameTab(selected.moduleType);
    }
  };

  const handleGroupChange = (id: string) => {
    setActiveGroupId(id);
    setActiveGroupIdState(id);
  };

  const handleSyncSimulate = () => {
    const activeGroupStudents = students.filter(s => s.groupId === activeGroupId);
    if (activeGroupStudents.length === 0) {
      setSyncToast({
        message: 'Chyba: V této třídě nejsou žádní žáci pro synchronizaci.',
        visible: true
      });
      return;
    }

    const randomStudent = activeGroupStudents[Math.floor(Math.random() * activeGroupStudents.length)];
    const stepIncrement = Math.floor(Math.random() * 5000) + 1500;
    const newSteps = randomStudent.steps + stepIncrement;
    
    updateStudentSteps(randomStudent.id, newSteps);
    setStudents(getStudents());

    setSyncToast({
      message: `Načteno z náramku: ${randomStudent.name} +${stepIncrement.toLocaleString()} kroků!`,
      visible: true
    });
  };

  // Autohide Toast
  useEffect(() => {
    if (syncToast.visible) {
      const t = setTimeout(() => {
        setSyncToast(prev => ({ ...prev, visible: false }));
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [syncToast.visible]);

  // Calculations
  const currentChallenge = challenges.find(c => c.id === activeChallengeId);
  const activeGroupStudents = students.filter(s => s.groupId === activeGroupId);
  const progressInfo = currentChallenge ? getGroupProgress(activeChallengeId, activeGroupId) : null;
  const currentProgressPercent = progressInfo ? progressInfo.progressPercent : 0;

  // Adjust total steps based on simulation slider
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderPercent = parseInt(e.target.value) / 100;
    adjustProgressToPercent(sliderPercent);
  };

  const adjustProgressToPercent = React.useCallback((percent: number) => {
    if (!currentChallenge) return;

    const targetSteps = currentChallenge.targetSteps;
    const neededTotalSteps = Math.floor(targetSteps * percent);
    
    if (activeGroupStudents.length === 0) return;

    // Distribute steps equally
    const baseSteps = Math.floor(neededTotalSteps / activeGroupStudents.length);
    const remainder = neededTotalSteps % activeGroupStudents.length;

    activeGroupStudents.forEach((student, index) => {
      const extra = index === 0 ? remainder : 0;
      updateStudentSteps(student.id, baseSteps + extra);
    });

    setStudents(getStudents());
  }, [currentChallenge, activeGroupStudents]);

  // Autoplay simulation
  useEffect(() => {
    if (isAutoplay) {
      autoplayTimer.current = window.setInterval(() => {
        const currentProgress = progressInfo ? progressInfo.progressPercent / 100 : 0;
        if (currentProgress >= 1) {
          setIsAutoplay(false);
          if (autoplayTimer.current) clearInterval(autoplayTimer.current);
          return;
        }
        
        const nextProgress = Math.min(1, currentProgress + 0.02); // Add 2%
        adjustProgressToPercent(nextProgress);
      }, 800);
    } else {
      if (autoplayTimer.current) {
        clearInterval(autoplayTimer.current);
      }
    }

    return () => {
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    };
  }, [isAutoplay, progressInfo, adjustProgressToPercent]);

  const handleSidebarSelect = (item: string) => {
    setActiveItem(item);
  };

  // Render the selected view
  const renderActiveView = () => {
    switch (activeItem) {
      case 'my-results':
        return <MyResults />;
        
      case 'my-class':
        return <MyClass students={activeGroupStudents} />;
        
      case 'my-school':
        return <MySchool groups={groups} students={students} challenge={currentChallenge} />;

      case 'active-challenge':
        return renderActiveChallenge();
        
      case 'finished-challenges':
        return (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="view-title-container">
              <h2 className="view-title">Ukončené výzvy</h2>
            </div>
            <div className="replicated-card">
              <div className="replicated-card-header">
                <span>Přehled historie</span>
              </div>
              <div className="replicated-card-body py-10 text-center text-gray-500">
                Žádné ukončené výzvy. Všechny založené výzvy aktuálně běží!
              </div>
            </div>
          </div>
        );

      case 'sync-research':
        return (
          <SyncResearchPanel 
            onSyncReceived={(data) => {
              updateStudentSteps(data.studentId, data.totalSteps);
              setStudents(getStudents());
            }}
            onOpenMobilePortal={() => setShowMobilePortal(true)}
          />
        );

      case 'admin-school':
        return (
          <AdminPanel 
            challenges={challenges}
            groups={groups}
            students={students}
            activeGroupId={activeGroupId}
            initialTab="groups"
            onChallengesUpdate={(c) => setChallenges(c)}
            onGroupsUpdate={(g) => setGroups(g)}
            onStudentsUpdate={(s) => setStudents(s)}
            onGroupChange={handleGroupChange}
            onReset={loadAllData}
          />
        );

      case 'admin-challenges':
        return (
          <AdminPanel 
            challenges={challenges}
            groups={groups}
            students={students}
            activeGroupId={activeGroupId}
            initialTab="challenges"
            onChallengesUpdate={(c) => setChallenges(c)}
            onGroupsUpdate={(g) => setGroups(g)}
            onStudentsUpdate={(s) => setStudents(s)}
            onGroupChange={handleGroupChange}
            onReset={loadAllData}
          />
        );

      case 'admin-new-challenge':
        return (
          <AdminPanel 
            challenges={challenges}
            groups={groups}
            students={students}
            activeGroupId={activeGroupId}
            initialTab="challenges"
            onChallengesUpdate={(c) => setChallenges(c)}
            onGroupsUpdate={(g) => setGroups(g)}
            onStudentsUpdate={(s) => setStudents(s)}
            onGroupChange={handleGroupChange}
            onReset={loadAllData}
          />
        );

      default:
        return <MyResults />;
    }
  };

  const getChallengeGameTitle = () => {
    switch (gameTab) {
      case 'map': return 'Mapa - trasa';
      case 'districts': return 'Mapa - území';
      case 'puzzle': return 'Odkrývání';
      case 'pixelate': return 'Zaostřování';
      case 'network': return 'Síťování';
      default: return 'Herní modul';
    }
  };

  const renderActiveChallenge = () => {
    if (!currentChallenge || !progressInfo) {
      return <div className="text-gray-500">Žádná aktivní výzva. Vytvořte ji v Administraci.</div>;
    }

    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="view-title-container">
          <h2 className="view-title">Aktuálně běží</h2>
        </div>

        {/* Dropdown selectors for Challenge and Class matching screenshot 3 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap gap-4 items-center shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Vybrat výzvu:</span>
            <select
              value={activeChallengeId}
              onChange={(e) => handleChallengeChange(e.target.value)}
              className="replicated-input text-xs font-semibold max-w-[200px] cursor-pointer"
            >
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Vybrat třídu:</span>
            <select
              value={activeGroupId}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="replicated-input text-xs font-semibold max-w-[150px] cursor-pointer"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs and selected game inside replicated-card */}
        <div className="replicated-card">
          <div className="replicated-card-header">
            <span>{getChallengeGameTitle()} | Splněno {Math.round(currentProgressPercent)} %</span>
            <span className="text-xs font-normal font-mono">
              Celkem: {progressInfo.totalSteps.toLocaleString()} / {currentChallenge.targetSteps.toLocaleString()} kroků
            </span>
          </div>
          
          <div className="replicated-card-body flex flex-col gap-4">
            {/* Game Tab Navigators */}
            <div className="game-tabs-container">
              <button 
                onClick={() => setGameTab('map')} 
                className={`game-tab ${gameTab === 'map' ? 'active' : ''}`}
              >
                <Map className="h-4 w-4" />
                <span>Trasa</span>
              </button>
              <button 
                onClick={() => setGameTab('districts')} 
                className={`game-tab ${gameTab === 'districts' ? 'active' : ''}`}
              >
                <MapPin className="h-4 w-4" />
                <span>Území ČR</span>
              </button>
              <button 
                onClick={() => setGameTab('puzzle')} 
                className={`game-tab ${gameTab === 'puzzle' ? 'active' : ''}`}
              >
                <Grid className="h-4 w-4" />
                <span>Odkrývání</span>
              </button>
              <button 
                onClick={() => setGameTab('pixelate')} 
                className={`game-tab ${gameTab === 'pixelate' ? 'active' : ''}`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Zaostřování</span>
              </button>
              <button 
                onClick={() => setGameTab('network')} 
                className={`game-tab ${gameTab === 'network' ? 'active' : ''}`}
              >
                <Network className="h-4 w-4" />
                <span>Síťování</span>
              </button>
            </div>

            {/* Game Windows */}
            <div className="w-full relative min-h-[400px]">
              {gameTab === 'map' && (
                <ModuleMap 
                  progress={currentProgressPercent / 100}
                  filePath={currentChallenge.moduleType === 'map' ? currentChallenge.filePath : '/tour_de_cities.geojson'}
                  students={activeGroupStudents}
                  targetSteps={currentChallenge.targetSteps}
                />
              )}
              {gameTab === 'districts' && (
                <ModuleDistricts 
                  progress={currentProgressPercent / 100}
                  filePath={currentChallenge.moduleType === 'districts' ? currentChallenge.filePath : '/districts.geojson'}
                />
              )}
              {gameTab === 'puzzle' && (
                <ModulePuzzle 
                  progress={currentProgressPercent / 100}
                  filePath={currentChallenge.moduleType === 'puzzle' ? currentChallenge.filePath : '/krumlov.jpg'}
                  seed={activeGroupId}
                />
              )}
              {gameTab === 'pixelate' && (
                <ModulePixelate 
                  progress={currentProgressPercent / 100}
                  filePath={currentChallenge.moduleType === 'pixelate' ? currentChallenge.filePath : '/dna.jpg'}
                />
              )}
              {gameTab === 'network' && (
                <ModuleNetwork 
                  progress={currentProgressPercent / 100}
                  filePath={currentChallenge.moduleType === 'network' ? currentChallenge.filePath : '/dataset.json'}
                />
              )}
            </div>
          </div>
        </div>

        {/* Stats Panel Details Cards inside replicated flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="replicated-card">
            <div className="replicated-card-header bg-slate-700">
              <span>Popis výzvy</span>
            </div>
            <div className="replicated-card-body flex flex-col justify-between min-h-[140px]">
              <p className="text-xs text-gray-500 leading-relaxed">{currentChallenge.description}</p>
              <div className="text-[10px] text-gray-400 font-bold border-t border-gray-100 pt-2 mt-4 flex justify-between">
                <span>Od: {new Date(currentChallenge.validFrom).toLocaleDateString()}</span>
                <span>Do: {new Date(currentChallenge.validTo).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="replicated-card border-l-4 border-l-[#007CA6]">
            <div className="replicated-card-header">
              <span>Kroky a Kilometry</span>
            </div>
            <div className="replicated-card-body flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="text-sm font-bold text-gray-700">
                  {progressInfo.totalSteps.toLocaleString()} / {currentChallenge.targetSteps.toLocaleString()} kroků
                </div>
                <div className="text-xs text-gray-400 font-semibold mt-1">
                  Ušli jsme: {progressInfo.totalDistanceKm} km celkem
                </div>
              </div>
              <div className="text-[10px] text-gray-400 font-semibold border-t border-gray-100 pt-2 mt-4">
                Průměrný krok nastaven na 0.7m.
              </div>
            </div>
          </div>

          <div className="replicated-card border-l-4 border-l-emerald-600">
            <div className="replicated-card-header bg-emerald-600">
              <span>Aktivní zapojení žáků</span>
            </div>
            <div className="replicated-card-body flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="text-sm font-bold text-emerald-700">
                  {progressInfo.activeUsers} / {activeGroupStudents.length} aktivních
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Už {Math.round((progressInfo.activeUsers / activeGroupStudents.length) * 100) || 0} % třídy má zapsaný pohyb!
                </p>
              </div>
              <div className="text-[10px] text-emerald-600 font-bold border-t border-gray-100 pt-2 mt-4">
                Třídní učitel: {progressInfo.adminName}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (showMobilePortal) {
    return (
      <MobileSyncPortal 
        onBackToApp={() => {
          window.history.pushState({}, '', '/');
          setShowMobilePortal(false);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-gray-800">
      <div className="main-layout">
        {/* Left Sidebar */}
        <Sidebar activeItem={activeItem} onSelect={handleSidebarSelect} />

        {/* Right Content Area Container */}
        <div className="content-area-container">
          {/* Sticky Top Header bar */}
          <TopHeader activeItem={activeItem} />

          {/* Active View Wrapper */}
          <main className="view-content-wrapper pb-32">
            {renderActiveView()}
          </main>
        </div>
      </div>

      {/* Sync Toast Notification */}
      {syncToast.visible && (
        <div className="sync-toast bg-white border border-emerald-500 text-emerald-800 shadow-lg">
          <Activity className="h-4 w-4 text-emerald-600 animate-pulse" />
          <span className="text-xs font-bold">{syncToast.message}</span>
        </div>
      )}

      {/* Floating Developer Simulation Panel Drawer (Bottom Right) */}
      <div className={`sim-drawer ${!isSimOpen ? 'collapsed' : ''}`}>
        <div className="sim-drawer-header" onClick={() => setIsSimOpen(!isSimOpen)}>
          <div className="flex items-center gap-1.5 text-[#007CA6]">
            <Activity className="h-4 w-4 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider">Vývojářský simulátor PoC</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-bold">
              {isSimOpen ? 'Skrýt' : 'Rozbalit'}
            </span>
            {isSimOpen ? <ChevronDown className="h-3 w-3 text-gray-400" /> : <ChevronUp className="h-3 w-3 text-gray-400" />}
          </div>
        </div>

        {isSimOpen && (
          <div className="mt-3 flex flex-col gap-3 animate-fade-in">
            <p className="text-[10px] text-gray-500 leading-tight">
              Měňte celkové procento plnění výzvy a pozorujte interaktivní odemykání.
            </p>

            <div className="flex items-center gap-3">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={currentProgressPercent} 
                onChange={handleSliderChange}
                className="sim-slider-white flex-1"
              />
              <span className="text-xs font-black text-[#007CA6] w-10 text-right">
                {Math.round(currentProgressPercent)} %
              </span>
            </div>

            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setIsAutoplay(!isAutoplay)}
                className="replicated-button text-[10px] py-1.5 px-3 flex-1 justify-center"
              >
                {isAutoplay ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isAutoplay ? 'Pozastavit' : 'Přehrát animaci'}</span>
              </button>
              <button
                onClick={handleSyncSimulate}
                className="replicated-button-outline text-[10px] py-1.5 px-3 flex-1 justify-center"
              >
                <span>Synchronizace</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
