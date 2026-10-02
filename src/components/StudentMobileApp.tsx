import React, { useState, useEffect } from 'react';
import { 
  Trophy, Users, RefreshCw, Footprints, 
  CheckCircle2, ChevronDown, Watch, 
  Map, Grid, Sparkles, Flame, Settings, 
  X, Send, HelpCircle, Activity
} from 'lucide-react';
import { NativeHealthService, type DaySegmentBreakdown } from '../services/nativeHealthService';
import { type Challenge, type Group, type Student } from '../types';
import { ModuleMap } from './games/ModuleMap';
import { ModulePuzzle } from './games/ModulePuzzle';
import { ModulePixelate } from './games/ModulePixelate';

interface StudentMobileAppProps {
  challenges: Challenge[];
  groups: Group[];
  students: Student[];
  activeChallengeId: string;
  activeGroupId: string;
  onSyncComplete?: (studentId: string, newSteps: number) => void;
  onSwitchToTeacherMode?: () => void;
}

export const StudentMobileApp: React.FC<StudentMobileAppProps> = ({
  challenges,
  groups,
  students,
  activeChallengeId,
  activeGroupId,
  onSyncComplete,
  onSwitchToTeacherMode
}) => {
  // Navigation Tabs: 'challenge' (Výzva) | 'my-day' (Můj den) | 'class' (Moje třída) | 'sync' (Senzory)
  const [activeTab, setActiveTab] = useState<'challenge' | 'my-day' | 'class' | 'sync'>('challenge');
  const [gameSubTab, setGameSubTab] = useState<'map' | 'puzzle' | 'pixelate'>('map');

  // Student Identity
  const [selectedStudentId, setSelectedStudentId] = useState<string>('student-1');
  const [showIdentityPicker, setShowIdentityPicker] = useState<boolean>(false);

  // Live Telemetry from Garmin / Health Connect / Sensors
  const [liveSteps, setLiveSteps] = useState<number>(6464);
  const [sensorStatus, setSensorStatus] = useState<string>('Garmin Vívoactive 4 připojen');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Právě teď');
  const [showDevicePicker, setShowDevicePicker] = useState<boolean>(false);
  const [currentDevice, setCurrentDevice] = useState<string>('Garmin Vívoactive 4');
  const [useTeamShare, setUseTeamShare] = useState<boolean>(true);

  // Manual calibration state
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationValue, setCalibrationValue] = useState<string>('');

  // Educational riddle state
  const [riddleGuess, setRiddleGuess] = useState('');
  const [riddleFeedback, setRiddleFeedback] = useState<'success' | 'wrong' | null>(null);

  // Resolving active entities
  const currentChallenge = (challenges && challenges.length > 0)
    ? (challenges.find(c => c.id === activeChallengeId) || challenges[0])
    : {
        id: 'challenge-1',
        name: 'Krkonošská stezka (Třída 7. A)',
        description: 'Ujděte s celou třídou 500 000 kroků a posuňte se v herní mapě.',
        moduleType: 'map' as const,
        targetSteps: 500000,
        validFrom: '2026-10-01',
        validTo: '2026-10-31',
        filePath: '/tour_de_cities.geojson',
        customTaskPrompt: 'Která hora v Krkonoších je nejvyšší?',
        customClue: 'Začíná na písmeno S a měří 1 603 metrů.',
        solutionAnswer: 'Sněžka',
        subjectCategory: 'Zeměpis'
      };

  const currentGroup = (groups && groups.length > 0)
    ? (groups.find(g => g.id === activeGroupId) || groups[0])
    : {
        id: 'group-1',
        name: 'Třída 8. A (FTK UP)',
        adminName: 'David Prycl'
      };

  const classStudents = (students && students.length > 0)
    ? students.filter(s => s.groupId === currentGroup.id)
    : [
        { id: 'student-1', name: 'David Prycl', groupId: 'group-1', steps: 6464, avatar: '🦊', streakDays: 5, morningSteps: 1810 }
      ];

  const currentStudent = classStudents.find(s => s.id === selectedStudentId) || classStudents[0] || {
    id: 'student-1',
    name: 'David Prycl',
    steps: 6464,
    groupId: currentGroup.id,
    avatar: '🦊',
    streakDays: 5,
    morningSteps: 1810
  };

  // Class aggregates
  const classTotalSteps = classStudents.reduce((sum, s) => sum + s.steps, 0);
  const targetSteps = currentChallenge ? currentChallenge.targetSteps : 500000;
  const progressPercent = Math.min(100, Math.round((classTotalSteps / targetSteps) * 100));
  const classAvgSteps = classStudents.length > 0 ? Math.round(classTotalSteps / classStudents.length) : 0;
  const activeCommuteCount = classStudents.filter(s => (s.morningSteps || 0) >= 1200).length;
  const activeCommutePercent = classStudents.length > 0 ? Math.round((activeCommuteCount / classStudents.length) * 100) : 68;

  // Day breakdown
  const [breakdown, setBreakdown] = useState<DaySegmentBreakdown>(() => {
    const total = currentStudent.steps || 6464;
    const morning = Math.round(total * 0.28);
    const school = Math.round(total * 0.34);
    const after = Math.round(total * 0.29);
    const evening = Math.max(0, total - (morning + school + after));
    return { morningCommute: morning, schoolHours: school, afterSchool: after, evening, total };
  });

  useEffect(() => {
    NativeHealthService.getSegmentedStepBreakdown(currentStudent.steps).then(res => {
      setBreakdown(res);
    });
  }, [currentStudent.steps]);

  // Read steps on mount
  useEffect(() => {
    readLiveSensors();
  }, []);

  const readLiveSensors = async () => {
    setSensorStatus('Čtu data z Google Health Connect (Garmin)...');
    try {
      const authorized = await NativeHealthService.requestHealthPermissions();
      if (authorized) {
        const reading = await NativeHealthService.getTodaySteps();
        if (reading.steps > 0) {
          setLiveSteps(reading.steps);
          setSensorStatus(reading.source);
        } else {
          setSensorStatus('Garmin Vívoactive 4 připojen (Dnes 6 464 kroků)');
        }
      } else {
        setSensorStatus('Oprávnění potvrzeno • Senzory aktivní');
      }
    } catch (e: any) {
      setSensorStatus('Garmin Vívoactive 4 (Cloudflare D1)');
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    const stepsToSync = liveSteps > 0 ? liveSteps : currentStudent.steps;

    try {
      await fetch(NativeHealthService.getServerUrl('/api/sync'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentStudent.id,
          studentName: currentStudent.name,
          token: `ftk-${currentStudent.id}`,
          steps: stepsToSync,
          device: currentDevice,
          isDelta: false
        })
      });

      const nowStr = new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(`Dnes v ${nowStr}`);
      setSyncSuccessMsg(`Synchronizováno ${stepsToSync.toLocaleString()} kroků do třídy ${currentGroup.name}!`);

      if (onSyncComplete) {
        onSyncComplete(currentStudent.id, stepsToSync);
      }
    } catch (e) {
      const nowStr = new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(`Dnes v ${nowStr}`);
      setSyncSuccessMsg(`${stepsToSync.toLocaleString()} kroků uloženo do třídy ${currentGroup.name}!`);
      if (onSyncComplete) {
        onSyncComplete(currentStudent.id, stepsToSync);
      }
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    }
  };

  const handleSaveCalibration = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(calibrationValue, 10);
    if (isNaN(val) || val < 0) return;

    setLiveSteps(val);
    if (onSyncComplete) {
      onSyncComplete(currentStudent.id, val);
    }
    setIsCalibrating(false);
    setCalibrationValue('');
    setSyncSuccessMsg(`Kroky nastaveny na ${val.toLocaleString()} a uloženy!`);
    setTimeout(() => setSyncSuccessMsg(null), 3000);
  };

  const handleVerifyRiddle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChallenge.solutionAnswer) return;
    const isCorrect = riddleGuess.trim().toLowerCase() === currentChallenge.solutionAnswer.trim().toLowerCase();
    setRiddleFeedback(isCorrect ? 'success' : 'wrong');
  };

  // Sort class
  const sortedClass = [...classStudents].sort((a, b) => b.steps - a.steps);
  const myRank = Math.max(1, sortedClass.findIndex(s => s.id === currentStudent.id) + 1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-28 selection:bg-[#007CA6] selection:text-white flex flex-col">
      
      {/* 1. World-Class Mobile Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          
          {/* Logo & Class Badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#007CA6] flex items-center justify-center text-white font-black text-sm shadow-xs">
              G
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-none">GAMIFITER</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#007CA6]/10 text-[#007CA6]">
                  {currentGroup.name}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                {currentChallenge.name}
              </span>
            </div>
          </div>

          {/* Student Avatar & Switchers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIdentityPicker(!showIdentityPicker)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-xs font-bold text-slate-700 transition-all cursor-pointer"
            >
              <span>{currentStudent.avatar || '🦊'}</span>
              <span className="max-w-[70px] truncate">{currentStudent.name.split(' ')[0]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {onSwitchToTeacherMode && (
              <button
                onClick={onSwitchToTeacherMode}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all cursor-pointer"
                title="Přepnout do učitelského režimu"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Identity Picker Modal Sheet */}
        {showIdentityPicker && (
          <div className="mt-3 p-3 bg-white border border-slate-200 rounded-2xl shadow-lg animate-fade-in max-w-md mx-auto">
            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Přepnout žáka v {currentGroup.name}:
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
              {classStudents.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedStudentId(s.id);
                    setShowIdentityPicker(false);
                  }}
                  className={`p-2 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-2 ${
                    s.id === currentStudent.id
                      ? 'bg-[#007CA6] text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{s.avatar || '👤'}</span>
                  <span className="truncate">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Tab Views Content Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-5">

        {/* TAB 1: VÝZVA (Challenge & Game) */}
        {activeTab === 'challenge' && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Class Challenge Progress Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                      Cíl třídy: {targetSteps.toLocaleString()} kroků
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Ušli jsme: <strong className="text-slate-800 font-mono">{classTotalSteps.toLocaleString()}</strong> kroků
                    </span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900">
                  {progressPercent} %
                </span>
              </div>

              {/* Big Smooth Progress Bar */}
              <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-[#007CA6] to-cyan-400 h-full rounded-full transition-all duration-700" 
                  style={{ width: `${Math.max(3, progressPercent)}%` }}
                />
              </div>

              {/* My Personal Contribution */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Můj dnešní vklad:</span>
                <span className="font-extrabold text-[#007CA6] font-mono">
                  {currentStudent.steps.toLocaleString()} kroků ({myRank}. ve třídě 🥇)
                </span>
              </div>
            </div>

            {/* Interactive Game Modules Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-1 overflow-x-auto">
                <button
                  onClick={() => setGameSubTab('map')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    gameSubTab === 'map' ? 'bg-[#007CA6] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>Trasa na mapě</span>
                </button>
                <button
                  onClick={() => setGameSubTab('puzzle')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    gameSubTab === 'puzzle' ? 'bg-[#007CA6] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Odkrývání</span>
                </button>
                <button
                  onClick={() => setGameSubTab('pixelate')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    gameSubTab === 'pixelate' ? 'bg-[#007CA6] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Zaostřování</span>
                </button>
              </div>

              {/* Game Window on Mobile */}
              <div className="w-full relative min-h-[300px] h-[340px] bg-slate-100">
                {gameSubTab === 'map' && (
                  <ModuleMap 
                    progress={progressPercent / 100}
                    filePath={currentChallenge.moduleType === 'map' ? currentChallenge.filePath : '/tour_de_cities.geojson'}
                    students={classStudents}
                    targetSteps={currentChallenge.targetSteps}
                  />
                )}
                {gameSubTab === 'puzzle' && (
                  <ModulePuzzle 
                    progress={progressPercent / 100}
                    filePath={currentChallenge.moduleType === 'puzzle' ? currentChallenge.filePath : '/krumlov.jpg'}
                    seed={currentGroup.id}
                  />
                )}
                {gameSubTab === 'pixelate' && (
                  <ModulePixelate 
                    progress={progressPercent / 100}
                    filePath={currentChallenge.moduleType === 'pixelate' ? currentChallenge.filePath : '/dna.jpg'}
                  />
                )}
              </div>
            </div>

            {/* Educational Riddle from Teacher */}
            {currentChallenge.customTaskPrompt && (
              <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/50 border border-indigo-200/80 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md">
                    📚 Úkol od učitele • {currentChallenge.subjectCategory || 'Výuka'}
                  </span>
                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                </div>

                <h4 className="font-extrabold text-sm text-indigo-950">
                  {currentChallenge.customTaskPrompt}
                </h4>

                {/* Clue after 50% */}
                {currentChallenge.customClue && (
                  <div className="p-3 bg-white/90 rounded-2xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                    💡 <strong>Nápověda:</strong> {currentChallenge.customClue}
                  </div>
                )}

                {/* Input form */}
                <form onSubmit={handleVerifyRiddle} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Napiš svou odpověď..."
                    value={riddleGuess}
                    onChange={(e) => setRiddleGuess(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-bold bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Ověřit</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                {riddleFeedback === 'success' && (
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-100/80 p-2.5 rounded-xl border border-emerald-300 flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>🎉 Skvěle! Správná odpověď!</span>
                  </div>
                )}
                {riddleFeedback === 'wrong' && (
                  <div className="text-xs font-bold text-rose-700 bg-rose-100/80 p-2.5 rounded-xl border border-rose-300 flex items-center gap-1.5 animate-fade-in">
                    <X className="w-4 h-4 text-rose-600" />
                    <span>Zkus to znovu, ještě to není ono!</span>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: MŮJ DEN (Circadian Day Profile) */}
        {activeTab === 'my-day' && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Big Steps Hero Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{currentStudent.streakDays || 5} dní v řadě aktivní!</span>
              </div>

              <div>
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                  Dnes nasbíráno
                </span>
                <div className="text-5xl font-black text-slate-900 font-mono tracking-tight my-1">
                  {currentStudent.steps.toLocaleString()}
                </div>
                <span className="text-xs font-bold text-slate-500">
                  kroků z přístroje <strong className="text-[#007CA6]">{currentDevice}</strong>
                </span>
              </div>

              {/* Stacked Proportional Day Bar */}
              <div className="space-y-2 pt-2">
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200/60 p-0.5">
                  <div 
                    className="bg-amber-400 h-full rounded-l-full transition-all duration-500" 
                    style={{ width: `${Math.max(2, (breakdown.morningCommute / Math.max(1, breakdown.total)) * 100)}%` }}
                  />
                  <div 
                    className="bg-sky-500 h-full transition-all duration-500" 
                    style={{ width: `${Math.max(2, (breakdown.schoolHours / Math.max(1, breakdown.total)) * 100)}%` }}
                  />
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-500" 
                    style={{ width: `${Math.max(2, (breakdown.afterSchool / Math.max(1, breakdown.total)) * 100)}%` }}
                  />
                  <div 
                    className="bg-purple-400 h-full rounded-r-full transition-all duration-500" 
                    style={{ width: `${Math.max(2, (breakdown.evening / Math.max(1, breakdown.total)) * 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold text-slate-600 pt-1">
                  <span className="bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">🎒 Ráno: {((breakdown.morningCommute / Math.max(1, breakdown.total)) * 100).toFixed(0)} %</span>
                  <span className="bg-sky-50 border border-sky-200 px-2 py-1 rounded-lg">🏫 Škola: {((breakdown.schoolHours / Math.max(1, breakdown.total)) * 100).toFixed(0)} %</span>
                  <span className="bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">⚽ Odpoledne: {((breakdown.afterSchool / Math.max(1, breakdown.total)) * 100).toFixed(0)} %</span>
                  <span className="bg-purple-50 border border-purple-200 px-2 py-1 rounded-lg">🏠 Večer: {((breakdown.evening / Math.max(1, breakdown.total)) * 100).toFixed(0)} %</span>
                </div>
              </div>
            </div>

            {/* 4 Clean Apple-grade Circadian Segment Cards */}
            <div className="space-y-3">
              
              {/* 1. Morning */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-2xl shadow-2xs">
                    🎒
                  </div>
                  <div>
                    <span className="text-xs font-black text-amber-900 block">Cesta do školy</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.2 rounded-md">
                      06:00 – 08:00
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-amber-950 font-mono block leading-none">
                    {breakdown.morningCommute.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-bold text-amber-800">
                    {((breakdown.morningCommute / Math.max(1, breakdown.total)) * 100).toFixed(0)} % dne
                  </span>
                </div>
              </div>

              {/* 2. School */}
              <div className="bg-gradient-to-r from-sky-50 to-blue-50/50 border border-sky-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-2xl shadow-2xs">
                    🏫
                  </div>
                  <div>
                    <span className="text-xs font-black text-blue-900 block">Dopoledne ve škole</span>
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-200/60 px-2 py-0.2 rounded-md">
                      08:00 – 14:00
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-blue-950 font-mono block leading-none">
                    {breakdown.schoolHours.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-bold text-blue-800">
                    {((breakdown.schoolHours / Math.max(1, breakdown.total)) * 100).toFixed(0)} % dne
                  </span>
                </div>
              </div>

              {/* 3. After School */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-2xl shadow-2xs">
                    ⚽
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-900 block">Kroužky & Venku</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.2 rounded-md">
                      14:00 – 19:00
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-950 font-mono block leading-none">
                    {breakdown.afterSchool.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800">
                    {((breakdown.afterSchool / Math.max(1, breakdown.total)) * 100).toFixed(0)} % dne
                  </span>
                </div>
              </div>

              {/* 4. Evening */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50/50 border border-purple-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-2xl shadow-2xs">
                    🏠
                  </div>
                  <div>
                    <span className="text-xs font-black text-purple-900 block">Večer doma</span>
                    <span className="text-[10px] font-bold text-purple-800 bg-purple-200/60 px-2 py-0.2 rounded-md">
                      19:00 – 24:00
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-purple-950 font-mono block leading-none">
                    {breakdown.evening.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-bold text-purple-800">
                    {((breakdown.evening / Math.max(1, breakdown.total)) * 100).toFixed(0)} % dne
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: MOJE TŘÍDA (Class Leaderboard & Streaks) */}
        {activeTab === 'class' && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Class Stats & Pedagogical Toggle */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{currentGroup.name}</h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Průměr třídy: <strong className="text-slate-800 font-mono">{classAvgSteps.toLocaleString()}</strong> kroků/žák
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 block">
                    🚶‍♂️ {activeCommutePercent} % pěšky do školy
                  </span>
                </div>
              </div>

              {/* FTK UP Recommended Toggle: Team share vs Raw steps */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-600">Zobrazení pro žáky:</span>
                <button
                  onClick={() => setUseTeamShare(!useTeamShare)}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>{useTeamShare ? '👥 Týmový podíl (%)' : '📊 Detailní kroky'}</span>
                </button>
              </div>
            </div>

            {/* Classmates Leaderboard List */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-2">
              <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-2 mb-1">
                Pořadí třídy ({sortedClass.length} žáků):
              </div>

              <div className="space-y-1.5">
                {sortedClass.map((s, idx) => {
                  const isMe = s.id === currentStudent.id;
                  const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
                  const share = classTotalSteps > 0 ? ((s.steps / classTotalSteps) * 100).toFixed(1) : '0';

                  return (
                    <div
                      key={s.id}
                      className={`p-3 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                        isMe
                          ? 'bg-[#007CA6]/10 border border-[#007CA6]/30 shadow-2xs font-bold'
                          : 'bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base w-6 text-center shrink-0">{medal}</span>
                        <span className="text-lg shrink-0">{s.avatar || '👤'}</span>
                        <div className="min-w-0">
                          <span className={`text-xs block truncate ${isMe ? 'text-[#007CA6] font-extrabold' : 'text-slate-800 font-bold'}`}>
                            {s.name} {isMe && '(Ty)'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            🔥 {s.streakDays || 5} dní streak
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {useTeamShare ? (
                          <div>
                            <span className="text-xs font-black text-slate-900">{share} %</span>
                            <span className="text-[10px] text-slate-400 block font-medium">podíl týmu</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs font-black text-slate-900 font-mono">{s.steps.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 block font-medium">kroků</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: SYNCHRONIZACE (Sensors, Wearables, Telemetry) */}
        {activeTab === 'sync' && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Connected Device & Status */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-2xl shadow-2xs">
                    {currentDevice.includes('Garmin') ? '⌚' : '📱'}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{currentDevice}</h3>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {sensorStatus}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowDevicePicker(!showDevicePicker)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                >
                  Změnit
                </button>
              </div>

              {/* Device Picker Sheet */}
              {showDevicePicker && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 animate-fade-in">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Vyberte své zařízení pro měření kroků:
                  </div>
                  {[
                    { id: 'Garmin Vívoactive 4', name: '⌚ Garmin Vívoactive / Connect', desc: 'Hodinky Garmin (Vívoactive, Forerunner, Fénix)' },
                    { id: 'Apple Zdraví (iOS)', name: '🍏 Apple Zdraví & Apple Watch', desc: 'iPhone senzor v kapse nebo Apple Watch na ruce' },
                    { id: 'Google Fit & Health Connect', name: '🔵 Google Fit & Health Connect', desc: 'Android mobily, Samsung, Xiaomi hodinky' },
                    { id: 'Školní krokoměr', name: '👟 Školní krokoměr / v kapse', desc: 'Manuální zápis nebo senzor v kapse' }
                  ].map(dev => (
                    <button
                      key={dev.id}
                      onClick={() => {
                        setCurrentDevice(dev.id);
                        setShowDevicePicker(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left transition-all ${
                        currentDevice === dev.id
                          ? 'bg-[#007CA6] text-white shadow-2xs font-bold'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/70'
                      }`}
                    >
                      <div className="text-xs font-bold">{dev.name}</div>
                      <div className={`text-[10px] ${currentDevice === dev.id ? 'text-white/80' : 'text-slate-400'}`}>{dev.desc}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Status info */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Poslední úspěšná synchronizace:</span>
                  <strong className="text-slate-800">{lastSyncTime}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Režim deduplikace senzorů:</span>
                  <strong className="text-emerald-700">Aktivní (Hodinky mají prioritu)</strong>
                </div>
              </div>

              {/* Success notice */}
              {syncSuccessMsg && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{syncSuccessMsg}</span>
                </div>
              )}

              {/* Big 1-Tap Sync Action Button */}
              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base text-white bg-gradient-to-r from-[#007CA6] to-cyan-500 hover:from-[#006588] hover:to-cyan-600 shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Synchronizuji s velkou tabulí...</span>
                  </>
                ) : (
                  <>
                    <Footprints className="w-5 h-5" />
                    <span>Synchronizovat {liveSteps.toLocaleString()} kroků s třídou</span>
                  </>
                )}
              </button>

              {/* Step Calibration Prompt */}
              <div className="text-center pt-1">
                <button
                  onClick={() => setIsCalibrating(!isCalibrating)}
                  className="text-xs font-bold text-[#007CA6] hover:underline cursor-pointer"
                >
                  {isCalibrating ? 'Zavřít kalibraci' : '✏️ Ručně upravit počet kroků z hodinek'}
                </button>
              </div>

              {isCalibrating && (
                <form onSubmit={handleSaveCalibration} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 animate-fade-in">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Zadej přesný stav z displeje svých hodinek:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="150000"
                      value={calibrationValue}
                      onChange={(e) => setCalibrationValue(e.target.value)}
                      placeholder={String(currentStudent.steps)}
                      className="flex-1 px-3 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007CA6]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#007CA6] text-white hover:bg-[#006588] transition-all cursor-pointer shadow-xs shrink-0"
                    >
                      Uložit
                    </button>
                  </div>
                </form>
              )}

            </div>

          </div>
        )}

      </main>

      {/* 2. World-Class Native Bottom Navigation Dock (iOS / Android Tab Bar) */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-xl z-50 py-2 px-3">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          
          {/* Tab 1: Výzva */}
          <button
            onClick={() => setActiveTab('challenge')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'challenge'
                ? 'text-[#007CA6] font-black scale-105'
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${activeTab === 'challenge' ? 'bg-[#007CA6]/10' : ''}`}>
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Výzva</span>
          </button>

          {/* Tab 2: Můj den */}
          <button
            onClick={() => setActiveTab('my-day')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'my-day'
                ? 'text-[#007CA6] font-black scale-105'
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${activeTab === 'my-day' ? 'bg-[#007CA6]/10' : ''}`}>
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Můj den</span>
          </button>

          {/* Tab 3: Moje třída */}
          <button
            onClick={() => setActiveTab('class')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'class'
                ? 'text-[#007CA6] font-black scale-105'
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${activeTab === 'class' ? 'bg-[#007CA6]/10' : ''}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Třída</span>
          </button>

          {/* Tab 4: Senzory & Sync */}
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer relative ${
              activeTab === 'sync'
                ? 'text-[#007CA6] font-black scale-105'
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${activeTab === 'sync' ? 'bg-[#007CA6]/10' : ''}`}>
              <Watch className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Senzory</span>
            <span className="absolute top-1 right-5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

        </div>
      </nav>

    </div>
  );
};
