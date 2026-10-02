import { useState, useEffect } from 'react';
import './App.css';
import { 
  getChallenges, getGroups, getStudents, getSchools,
  getActiveChallengeId, setActiveChallengeId, 
  getActiveGroupId, setActiveGroupId, 
  getActiveSchoolId, setActiveSchoolId,
  getGroupProgress, updateStudentSteps, updateChallenge,
  initializeStorage, syncWithCloudD1
} from './services/storage';
import { type Challenge, type Group, type Student, type ModuleType, type School } from './types';

// Layout & Replicated Navigation Components
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';

// Dashboard Views
import { MyResults } from './components/dashboards/MyResults';
import { MyClass } from './components/dashboards/MyClass';
import { MySchool } from './components/dashboards/MySchool';
import { AdminPanel } from './components/AdminPanel';

// Poster & Research Modals (FTK UP)
import { ChallengePosterModal } from './components/ChallengePosterModal';
import { ResearchModal } from './components/ResearchModal';

// Game Module Views
import { ModuleMap } from './components/games/ModuleMap';
import { ModuleDistricts } from './components/games/ModuleDistricts';
import { ModulePuzzle } from './components/games/ModulePuzzle';
import { ModulePixelate } from './components/games/ModulePixelate';
import { ModuleNetwork } from './components/games/ModuleNetwork';

// Telemetry & Device Sync Views (FTK UP Research)
import { SyncResearchPanel } from './components/SyncResearchPanel';
import { StudentMobileApp } from './components/StudentMobileApp';
import { NativeHealthService } from './services/nativeHealthService';

// Icons
import { Map, MapPin, Grid, Sparkles, Network, Activity, Watch, RefreshCw, Award } from 'lucide-react';

const VALID_ROUTES = [
  'active-challenge',
  'my-results',
  'my-class',
  'my-school',
  'finished-challenges',
  'sync-research',
  'research-info',
  'admin-schools',
  'admin-challenges',
  'admin-school',
  'admin-new-challenge',
  'admin-invitations',
  'admin-reset'
];

const getRouteFromHash = (): string => {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (VALID_ROUTES.includes(hash)) {
    return hash;
  }
  return 'active-challenge';
};

function App() {
  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    initializeStorage();
    return getChallenges();
  });
  const [groups, setGroups] = useState<Group[]>(() => getGroups());
  const [students, setStudents] = useState<Student[]>(() => getStudents());
  const [schools, setSchools] = useState<School[]>(() => getSchools());
  
  const [activeChallengeId, setActiveChallengeIdState] = useState(() => getActiveChallengeId());
  const [activeGroupId, setActiveGroupIdState] = useState(() => getActiveGroupId());
  const [activeSchoolId, setActiveSchoolIdState] = useState(() => getActiveSchoolId());
  const [activeItem, setActiveItem] = useState<string>(getRouteFromHash);
  const [gameTab, setGameTab] = useState<ModuleType>('map');
  const [isPosterOpen, setIsPosterOpen] = useState(false);

  // Mobile sync portal route check (auto-open on native mobile or small screens)
  const [showMobilePortal, setShowMobilePortal] = useState(
    window.location.pathname === '/sync' || 
    window.location.search.includes('token=') ||
    NativeHealthService.isNative() ||
    window.innerWidth <= 768
  );

  // Sync toast notifications
  const [syncToast, setSyncToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false
  });

  const syncFromCloud = async () => {
    try {
      const res = await fetch(NativeHealthService.getServerUrl('/api/sync/status'));
      const data = await res.json();
      if (data.success && data.students && data.students.length > 0) {
        const merged = syncWithCloudD1(data.students);
        setStudents([...merged]);
      }
    } catch (e) {
      console.warn('Initial cloud sync notice:', e);
    }

    try {
      const cRes = await fetch(NativeHealthService.getServerUrl('/api/challenges'));
      const cData = await cRes.json();
      if (cData.success && cData.challenges && cData.challenges.length > 0) {
        localStorage.setItem('gamifiter_challenges', JSON.stringify(cData.challenges));
        setChallenges(cData.challenges);
      }
    } catch (e) {
      console.warn('Cloud challenges sync notice:', e);
    }

    try {
      const gRes = await fetch(NativeHealthService.getServerUrl('/api/groups'));
      const gData = await gRes.json();
      if (gData.success && gData.groups && gData.groups.length > 0) {
        localStorage.setItem('gamifiter_groups', JSON.stringify(gData.groups));
        setGroups(gData.groups);
      }
    } catch (e) {
      console.warn('Cloud groups sync notice:', e);
    }
  };

  // Initialize storage & state, and listen to URL hash changes
  useEffect(() => {
    initializeStorage();
    loadAllData();
    syncFromCloud();

    const handleHashChange = () => {
      const route = getRouteFromHash();
      setActiveItem(route);
    };

    window.addEventListener('hashchange', handleHashChange);

    // If initial load doesn't have a hash, initialize it
    if (!window.location.hash) {
      window.history.replaceState(null, '', `/#/${getRouteFromHash()}`);
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Global SSE listener for real-time mobile sync from Garmin/Health Connect
  useEffect(() => {
    const eventSource = new EventSource(NativeHealthService.getServerUrl('/api/sync/events'));

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
    const loadedSchools = getSchools();
    
    setChallenges(loadedChallenges);
    setGroups(loadedGroups);
    setStudents(loadedStudents);
    setSchools(loadedSchools);

    const activeC = getActiveChallengeId();
    const activeG = getActiveGroupId();
    const activeS = getActiveSchoolId();

    setActiveChallengeIdState(activeC);
    setActiveGroupIdState(activeG);
    setActiveSchoolIdState(activeS);

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

  const handleSchoolChange = (id: string) => {
    setActiveSchoolId(id);
    setActiveSchoolIdState(id);
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
  const currentGroup = groups.find(g => g.id === activeGroupId) || groups[0];
  const currentSchool = schools.find(s => s.id === currentGroup?.schoolId) || schools.find(s => s.id === activeSchoolId) || schools[0];
  const activeGroupStudents = students.filter(s => s.groupId === activeGroupId);
  const progressInfo = currentChallenge ? getGroupProgress(activeChallengeId, activeGroupId) : null;
  const currentProgressPercent = progressInfo ? progressInfo.progressPercent : 0;

  const handleSidebarSelect = (item: string) => {
    if (item === 'sync-research' && (NativeHealthService.isNative() || window.innerWidth <= 768)) {
      setShowMobilePortal(true);
      return;
    }
    setActiveItem(item);
    window.location.hash = `#/${item}`;
  };

  const handleSetChallengeTarget = (newTarget: number) => {
    if (!currentChallenge) return;
    const updated = updateChallenge(currentChallenge.id, { targetSteps: newTarget });
    setChallenges(updated);
    setSyncToast({
      message: `🎯 Cíl výzvy upraven na ${newTarget.toLocaleString()} kroků! Postup zreálněn.`,
      visible: true
    });
  };

  // Render the selected view
  const renderActiveView = () => {
    switch (activeItem) {
      case 'my-results':
        return (
          <MyResults 
            students={students} 
            onUpdateStudentSteps={(steps) => {
              updateStudentSteps('student-1', steps);
              setStudents(getStudents());
            }}
            onRefreshCloud={syncFromCloud}
          />
        );
        
      case 'my-class':
        return (
          <MyClass 
            students={activeGroupStudents} 
            group={currentGroup} 
            challenge={currentChallenge} 
            school={currentSchool} 
          />
        );
        
      case 'my-school':
        return (
          <MySchool 
            groups={groups} 
            students={students} 
            schools={schools} 
            activeSchoolId={activeSchoolId} 
            challenge={currentChallenge} 
            onSchoolChange={handleSchoolChange} 
          />
        );

      case 'research-info':
        return (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="view-title-container">
              <h2 className="view-title">Vědecký výzkum & Národní zpráva</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Vědecká garance Fakulty tělesné kultury Univerzity Palackého v Olomouci
              </p>
            </div>
            <ResearchModal 
              isOpen={true} 
              onClose={() => handleSidebarSelect('active-challenge')} 
              students={students} 
              challenge={currentChallenge} 
            />
          </div>
        );

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
        if (NativeHealthService.isNative() || window.innerWidth <= 768) {
          return (
            <StudentMobileApp 
              challenges={challenges}
              groups={groups}
              students={students}
              activeChallengeId={activeChallengeId}
              activeGroupId={activeGroupId}
              onSyncComplete={(studentId, newSteps) => {
                updateStudentSteps(studentId, newSteps);
                setStudents(getStudents());
              }}
              onSwitchToTeacherMode={() => setActiveItem('active-challenge')}
            />
          );
        }
        return (
          <SyncResearchPanel 
            onSyncReceived={(data) => {
              updateStudentSteps(data.studentId, data.totalSteps);
              setStudents(getStudents());
            }}
            onOpenMobilePortal={() => setShowMobilePortal(true)}
          />
        );

      case 'admin-schools':
        return (
          <AdminPanel 
            challenges={challenges}
            groups={groups}
            students={students}
            schools={schools}
            activeGroupId={activeGroupId}
            activeSchoolId={activeSchoolId}
            initialTab="schools"
            onChallengesUpdate={(c) => setChallenges(c)}
            onGroupsUpdate={(g) => setGroups(g)}
            onStudentsUpdate={(s) => setStudents(s)}
            onSchoolsUpdate={(sc) => setSchools(sc)}
            onGroupChange={handleGroupChange}
            onSchoolChange={handleSchoolChange}
            onReset={loadAllData}
          />
        );

      case 'admin-school':
        return (
          <AdminPanel 
            challenges={challenges}
            groups={groups}
            students={students}
            schools={schools}
            activeGroupId={activeGroupId}
            activeSchoolId={activeSchoolId}
            initialTab="groups"
            onChallengesUpdate={(c) => setChallenges(c)}
            onGroupsUpdate={(g) => setGroups(g)}
            onStudentsUpdate={(s) => setStudents(s)}
            onSchoolsUpdate={(sc) => setSchools(sc)}
            onGroupChange={handleGroupChange}
            onSchoolChange={handleSchoolChange}
            onReset={loadAllData}
          />
        );

      case 'admin-challenges':
        return (
          <AdminPanel 
            challenges={challenges}
            groups={groups}
            students={students}
            schools={schools}
            activeGroupId={activeGroupId}
            activeSchoolId={activeSchoolId}
            initialTab="challenges"
            onChallengesUpdate={(c) => setChallenges(c)}
            onGroupsUpdate={(g) => setGroups(g)}
            onStudentsUpdate={(s) => setStudents(s)}
            onSchoolsUpdate={(sc) => setSchools(sc)}
            onGroupChange={handleGroupChange}
            onSchoolChange={handleSchoolChange}
            onReset={loadAllData}
          />
        );

      case 'admin-new-challenge':
        return (
          <AdminPanel 
            challenges={challenges}
            groups={groups}
            students={students}
            schools={schools}
            activeGroupId={activeGroupId}
            activeSchoolId={activeSchoolId}
            initialTab="challenges"
            onChallengesUpdate={(c) => setChallenges(c)}
            onGroupsUpdate={(g) => setGroups(g)}
            onStudentsUpdate={(s) => setStudents(s)}
            onSchoolsUpdate={(sc) => setSchools(sc)}
            onGroupChange={handleGroupChange}
            onSchoolChange={handleSchoolChange}
            onReset={loadAllData}
          />
        );

      case 'admin-invitations':
        return (
          <AdminPanel 
            challenges={challenges}
            groups={groups}
            students={students}
            schools={schools}
            activeGroupId={activeGroupId}
            activeSchoolId={activeSchoolId}
            initialTab="invitations"
            onChallengesUpdate={(c) => setChallenges(c)}
            onGroupsUpdate={(g) => setGroups(g)}
            onStudentsUpdate={(s) => setStudents(s)}
            onSchoolsUpdate={(sc) => setSchools(sc)}
            onGroupChange={handleGroupChange}
            onSchoolChange={handleSchoolChange}
            onReset={loadAllData}
          />
        );

      case 'admin-reset':
        return (
          <AdminPanel 
            challenges={challenges}
            groups={groups}
            students={students}
            schools={schools}
            activeGroupId={activeGroupId}
            activeSchoolId={activeSchoolId}
            initialTab="reset"
            onChallengesUpdate={(c) => setChallenges(c)}
            onGroupsUpdate={(g) => setGroups(g)}
            onStudentsUpdate={(s) => setStudents(s)}
            onSchoolsUpdate={(sc) => setSchools(sc)}
            onGroupChange={handleGroupChange}
            onSchoolChange={handleSchoolChange}
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

        {/* Challenge and Class Control Bar */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>🏆 Výzva:</span>
              </span>
              <select
                value={activeChallengeId}
                onChange={(e) => handleChallengeChange(e.target.value)}
                className="bg-gray-50/80 border border-gray-200 text-gray-900 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-[#007CA6] focus:ring-2 focus:ring-[#007CA6]/15 transition-all cursor-pointer"
              >
                {challenges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>👥 Třída:</span>
              </span>
              <select
                value={activeGroupId}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="bg-gray-50/80 border border-gray-200 text-gray-900 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:bg-white focus:border-[#007CA6] focus:ring-2 focus:ring-[#007CA6]/15 transition-all cursor-pointer"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsPosterOpen(true)}
              className="text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
              title="Zobrazit a vytisknout oficiální diplom z výzvy pro celou třídu"
            >
              <Award className="h-4 w-4 text-amber-700" />
              <span>🏆 Diplom & Report výzvy</span>
            </button>
            <button
              onClick={() => handleSidebarSelect('admin-challenges')}
              className="text-xs font-semibold text-[#007CA6] bg-[#007CA6]/10 hover:bg-[#007CA6]/20 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>⚙️ Nastavit výzvu</span>
            </button>
            <button
              onClick={() => handleSidebarSelect('sync-research')}
              className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>📱 Pozvánka pro žáky</span>
            </button>
          </div>
        </div>

        {/* Real Fitness Bracelet Live Telemetry Banner (Garmin / Health Connect) */}
        <div className="bg-gradient-to-r from-sky-50/90 via-cyan-50/70 to-emerald-50/80 border border-sky-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#007CA6] text-white flex items-center justify-center shadow-md shrink-0">
              <Watch className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-[#007CA6]">Reálná telemetrie z náramku</span>
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  LIVE Z HODINEK
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  {students.find(s => s.id === 'student-1')?.device || 'Garmin Vívoactive 4'}
                </span>
              </div>
              <div className="text-sm font-black text-gray-900 mt-0.5">
                David Prycl:{' '}
                <span className="text-[#007CA6]">
                  {(students.find(s => s.id === 'student-1')?.steps || 6464).toLocaleString()} kroků
                </span>{' '}
                <span className="text-gray-400 font-normal">|</span>{' '}
                <span className="text-emerald-700">
                  {(((students.find(s => s.id === 'student-1')?.steps || 6464) * 0.00075)).toFixed(2)} km ušlápnuto
                </span>{' '}
                <span className="text-gray-400 font-normal">|</span>{' '}
                <span className="text-gray-600 font-semibold">
                  Splněno {Math.min(100, Math.round(((students.find(s => s.id === 'student-1')?.steps || 6464) / currentChallenge.targetSteps) * 1000) / 10)} % výzvy
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-xs text-gray-500 font-bold mr-1">Měřítko cíle výzvy:</div>
            <button
              onClick={() => handleSetChallengeTarget(10000)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                currentChallenge.targetSteps <= 20000
                  ? 'bg-[#007CA6] text-white border-[#007CA6] shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              title="Přepnout cíl na denní etapu 10 000 kroků (pro zreálnění postupu jednotlivce)"
            >
              🏃 Denní etapa (10 000 kroků)
            </button>
            <button
              onClick={() => handleSetChallengeTarget(500000)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                currentChallenge.targetSteps > 20000
                  ? 'bg-[#007CA6] text-white border-[#007CA6] shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              title="Přepnout na celotřídní cíl 500 000 kroků (pro 30 žáků)"
            >
              👥 Celá třída (500 000 kroků)
            </button>
            <button
              onClick={syncFromCloud}
              className="p-2 rounded-xl text-gray-600 hover:text-[#007CA6] hover:bg-white border border-transparent hover:border-gray-200 transition-all cursor-pointer"
              title="Aktualizovat data z cloudu"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs and selected game inside replicated-card */}
        <div className="replicated-card">
          <div className="replicated-card-header flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-900">{getChallengeGameTitle()}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#007CA6]/10 text-[#007CA6]">
                Splněno {Math.round(currentProgressPercent)} %
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-500">
              Celkem: <strong className="text-gray-900 font-mono">{progressInfo.totalSteps.toLocaleString()}</strong> / {currentChallenge.targetSteps.toLocaleString()} kroků
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

        {/* Stats Panel Details Cards inside Apple grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Popis výzvy</span>
                <span className="w-2 h-2 rounded-full bg-slate-400" />
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-normal">{currentChallenge.description}</p>
            </div>
            <div className="text-[11px] text-gray-400 font-medium border-t border-gray-100 pt-3 mt-4 flex justify-between">
              <span>Od: <strong className="text-gray-600">{new Date(currentChallenge.validFrom).toLocaleDateString()}</strong></span>
              <span>Do: <strong className="text-gray-600">{new Date(currentChallenge.validTo).toLocaleDateString()}</strong></span>
            </div>
          </div>

          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#007CA6] uppercase tracking-wider">Kroky & Kilometry</span>
                <span className="w-2 h-2 rounded-full bg-[#007CA6]" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-gray-900 font-mono">
                {progressInfo.totalSteps.toLocaleString()} <span className="text-xs font-semibold text-gray-500 font-sans">kroků</span>
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1">
                Ušli jsme celkem: <strong className="text-gray-800">{progressInfo.totalDistanceKm} km</strong>
              </div>
            </div>
            <div className="text-[11px] text-gray-400 font-medium border-t border-gray-100 pt-3 mt-4">
              Průměrný krok nastaven na 0.7 m.
            </div>
          </div>

          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Aktivní zapojení</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-emerald-700">
                {progressInfo.activeUsers} <span className="text-sm font-semibold text-gray-500">/ {activeGroupStudents.length} žáků</span>
              </div>
              <p className="text-xs text-gray-600 font-medium mt-1">
                Už <strong className="text-emerald-700 font-bold">{Math.round((progressInfo.activeUsers / activeGroupStudents.length) * 100) || 0} %</strong> třídy má zaznamenaný pohyb.
              </p>
            </div>
            <div className="text-[11px] text-gray-500 font-medium border-t border-gray-100 pt-3 mt-4">
              Třídní učitel: <strong className="text-gray-800">{progressInfo.adminName}</strong>
            </div>
          </div>
        </div>

        {/* Challenge Poster & Diploma Modal */}
        {isPosterOpen && currentChallenge && currentGroup && (
          <ChallengePosterModal
            isOpen={isPosterOpen}
            onClose={() => setIsPosterOpen(false)}
            challenge={currentChallenge}
            group={currentGroup}
            school={currentSchool}
            students={students}
          />
        )}
      </div>
    );
  };

  if (showMobilePortal) {
    return (
      <StudentMobileApp 
        challenges={challenges}
        groups={groups}
        students={students}
        activeChallengeId={activeChallengeId}
        activeGroupId={activeGroupId}
        onSyncComplete={(studentId, newSteps) => {
          updateStudentSteps(studentId, newSteps);
          setStudents(getStudents());
          setSyncToast({
            message: `⚡ TELEMETRIE FTK: Kroky úspěšně propsány do výzvy!`,
            visible: true
          });
        }}
        onSwitchToTeacherMode={() => {
          setShowMobilePortal(false);
          handleSidebarSelect('active-challenge');
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
          <TopHeader activeItem={activeItem} onSelect={handleSidebarSelect} />

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
    </div>
  );
}

export default App;
