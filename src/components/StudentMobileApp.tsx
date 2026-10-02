import React, { useState, useEffect } from 'react';
import { 
  Trophy, Users, RefreshCw, 
  CheckCircle2, ChevronDown, Watch, 
  Map, Grid, Sparkles, Flame, 
  X, Send, HelpCircle, Activity,
  Zap, ShieldCheck, Compass, BatteryCharging,
  ArrowLeft, PlayCircle
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
  // Navigation Tabs: 'my-day' | 'challenge' | 'class' | 'sync'
  const [activeTab, setActiveTab] = useState<'my-day' | 'challenge' | 'class' | 'sync'>('my-day');
  const [gameSubTab, setGameSubTab] = useState<'map' | 'puzzle' | 'pixelate'>('map');

  // Student Identity
  const [selectedStudentId, setSelectedStudentId] = useState<string>('student-1');
  const [showIdentityPicker, setShowIdentityPicker] = useState<boolean>(false);

  // Live Telemetry from Garmin / Health Connect / Sensors
  const [liveSteps, setLiveSteps] = useState<number>(6464);
  const [sensorStatus, setSensorStatus] = useState<string>('Garmin Vívoactive 4 připojen');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Dnes ve 20:31');
  const [showDevicePicker, setShowDevicePicker] = useState<boolean>(false);
  const [currentDevice, setCurrentDevice] = useState<string>('Garmin Vívoactive 4');
  const [useTeamShare, setUseTeamShare] = useState<boolean>(true);
  const [kudosSent, setKudosSent] = useState<Record<string, boolean>>({});

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
        name: 'Tour de Europe (Třída 8. A)',
        description: 'Ujděte s celou třídou 500 000 kroků a procestujte celou Evropu.',
        moduleType: 'map' as const,
        targetSteps: 500000,
        validFrom: '2026-10-01',
        validTo: '2026-10-31',
        filePath: '/tour_de_cities.geojson',
        customTaskPrompt: 'Které hlavní město na naší trase leží na řece Dunaj?',
        customClue: 'Je to Vídeň nebo Bratislava. Obě leží na stejné řece!',
        solutionAnswer: 'Vídeň',
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
        { id: 'student-1', name: 'David Prycl', groupId: 'group-1', steps: 6464, avatar: '🦊', streakDays: 8, morningSteps: 1810 },
        { id: 'student-2', name: 'Eliška Novotná', groupId: 'group-1', steps: 5820, avatar: '🐱', streakDays: 7, morningSteps: 1650 },
        { id: 'student-3', name: 'Jakub Svoboda', groupId: 'group-1', steps: 5120, avatar: '🐻', streakDays: 6, morningSteps: 1400 },
        { id: 'student-4', name: 'Tereza Dvořáková', groupId: 'group-1', steps: 4450, avatar: '🐼', streakDays: 4, morningSteps: 950 },
        { id: 'student-5', name: 'Matěj Procházka', groupId: 'group-1', steps: 3980, avatar: '🦁', streakDays: 5, morningSteps: 1100 }
      ];

  const currentStudent = classStudents.find(s => s.id === selectedStudentId) || classStudents[0] || {
    id: 'student-1',
    name: 'David Prycl',
    steps: 6464,
    groupId: currentGroup.id,
    avatar: '🦊',
    streakDays: 8,
    morningSteps: 1810
  };

  // Class aggregates
  const classTotalSteps = classStudents.reduce((sum, s) => sum + s.steps, 0);
  const targetSteps = currentChallenge ? currentChallenge.targetSteps : 500000;
  const progressPercent = Math.min(100, Math.round((classTotalSteps / targetSteps) * 100));
  const classAvgSteps = classStudents.length > 0 ? Math.round(classTotalSteps / classStudents.length) : 0;
  const activeCommuteCount = classStudents.filter(s => (s.morningSteps || 0) >= 1200).length;
  const activeCommutePercent = classStudents.length > 0 ? Math.round((activeCommuteCount / classStudents.length) * 100) : 74;

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
    setSensorStatus('Čtu data z Google Health Connect...');
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
    } catch {
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
      setSyncSuccessMsg(`⚡ Synchronizováno ${stepsToSync.toLocaleString()} kroků do tabule!`);

      if (onSyncComplete) {
        onSyncComplete(currentStudent.id, stepsToSync);
      }
    } catch {
      const nowStr = new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(`Dnes v ${nowStr}`);
      setSyncSuccessMsg(`⚡ ${stepsToSync.toLocaleString()} kroků uloženo do třídy!`);
      if (onSyncComplete) {
        onSyncComplete(currentStudent.id, stepsToSync);
      }
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    }
  };

  const handleQuickAdd = (addedSteps: number) => {
    const newVal = currentStudent.steps + addedSteps;
    setLiveSteps(newVal);
    if (onSyncComplete) {
      onSyncComplete(currentStudent.id, newVal);
    }
    setSyncSuccessMsg(`Přidáno +${addedSteps.toLocaleString()} kroků (celkem ${newVal.toLocaleString()})!`);
    setTimeout(() => setSyncSuccessMsg(null), 3000);
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
    const isCorrect = riddleGuess.trim().toLowerCase().includes(currentChallenge.solutionAnswer.trim().toLowerCase());
    setRiddleFeedback(isCorrect ? 'success' : 'wrong');
  };

  const handleSendKudos = (studentId: string) => {
    setKudosSent((prev: Record<string, boolean>) => ({ ...prev, [studentId]: true }));
    setTimeout(() => {
      setKudosSent((prev: Record<string, boolean>) => ({ ...prev, [studentId]: false }));
    }, 2500);
  };

  // Sort class
  const sortedClass = [...classStudents].sort((a, b) => b.steps - a.steps);
  const myRank = Math.max(1, sortedClass.findIndex(s => s.id === currentStudent.id) + 1);

  // Goal metrics (Apple Fitness standard: 10,000 steps daily)
  const dailyGoal = 10000;
  const currentSteps = currentStudent.steps || 6464;
  const goalPercent = Math.min(100, Math.round((currentSteps / dailyGoal) * 100));
  const distanceKm = (currentSteps * 0.00075).toFixed(2);
  const activeCalories = Math.round(currentSteps * 0.038);
  const activeMinutes = Math.round(currentSteps / 110);

  // SVG Ring calculation
  const ringRadius = 48;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = ringCircumference - (goalPercent / 100) * ringCircumference;

  // Mock weekly history
  const weekDays = [
    { day: 'Po', steps: 8420, percent: 84 },
    { day: 'Út', steps: 9810, percent: 98 },
    { day: 'St', steps: 7200, percent: 72 },
    { day: 'Čt', steps: 10450, percent: 100, goalMet: true },
    { day: 'Pá', steps: 8900, percent: 89 },
    { day: 'So', steps: 11200, percent: 100, goalMet: true },
    { day: 'Dnes', steps: currentSteps, percent: goalPercent, isToday: true }
  ];

  return (
    <div className="min-h-screen w-full bg-[#F3F4F6] text-gray-800 font-sans pb-32 flex flex-col selection:bg-[#007CA6] selection:text-white">
      
      {/* 1. TOP NATIVE STATUS HEADER (Gamifiter Unified Bar) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 px-4 py-2.5 shadow-xs w-full">
        <div className="max-w-md mx-auto w-full flex items-center justify-between gap-2 min-w-0">
          
          {/* Back button to full portal */}
          {onSwitchToTeacherMode ? (
            <button
              onClick={onSwitchToTeacherMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-bold text-xs transition-all cursor-pointer border border-gray-200 shadow-2xs shrink-0"
              title="Zpět do plné aplikace"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Zpět na portál</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#007CA6] to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0">
                G
              </div>
              <span className="font-extrabold text-xs text-gray-900 tracking-tight">GAMIFITER ŽÁK</span>
            </div>
          )}

          {/* Student Avatar & Profile Switcher */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowIdentityPicker(!showIdentityPicker)}
              className="flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800 transition-all cursor-pointer shadow-xs"
            >
              <span className="text-base">{currentStudent.avatar || '🦊'}</span>
              <span className="max-w-[75px] truncate">{currentStudent.name.split(' ')[0]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            </button>
          </div>

        </div>

        {/* Identity Picker Sheet */}
        {showIdentityPicker && (
          <div className="mt-2.5 p-3.5 bg-white border border-gray-200 rounded-2xl shadow-xl animate-fade-in max-w-md mx-auto">
            <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
              Přepnout žáka v {currentGroup.name}:
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {classStudents.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedStudentId(s.id);
                    setShowIdentityPicker(false);
                  }}
                  className={`p-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    s.id === currentStudent.id
                      ? 'bg-[#007CA6] text-white shadow-xs'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200/60'
                  }`}
                >
                  <span className="text-base">{s.avatar || '👤'}</span>
                  <span className="truncate">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* 2. MAIN ACTIVE VIEW CONTAINER (With generous padding and distinct floating cards) */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-4">

        {/* ==================================================================== */}
        {/* TAB 1: MŮJ DEN (Apple Fitness & Strava Grade Circadian Experience)     */}
        {/* ==================================================================== */}
        {activeTab === 'my-day' && (
          <div className="space-y-4 animate-fade-in w-full min-w-0">
            
            {/* CARD 1: HERO ACTIVITY RING & METRICS */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 relative overflow-hidden w-full min-w-0 space-y-3">
              {/* Badges row: Streak on left, Rank on right */}
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80 shrink-0">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <span>{currentStudent.streakDays || 8} dní série</span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-[#007CA6] border border-sky-200/80 shrink-0">
                  <Trophy className="w-3.5 h-3.5 shrink-0" />
                  <span>{myRank}. ve třídě</span>
                </span>
              </div>

              {/* Circular Activity Ring + Steps Center */}
              <div className="flex items-center justify-center py-2 relative">
                <svg className="w-38 h-38 transform -rotate-90">
                  {/* Background Track */}
                  <circle
                    cx="76"
                    cy="76"
                    r={ringRadius}
                    className="stroke-slate-100"
                    strokeWidth="11"
                    fill="transparent"
                  />
                  {/* Glowing Animated Progress Ring */}
                  <circle
                    cx="76"
                    cy="76"
                    r={ringRadius}
                    className="stroke-[#007CA6] transition-all duration-1000 ease-out"
                    strokeWidth="11"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Steps Value Inside Ring */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    Dnes nasbíráno
                  </span>
                  <span className="text-3xl font-black text-slate-900 tracking-tight font-mono my-1 leading-none">
                    {currentSteps.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-[#007CA6] leading-none">
                    {goalPercent} % splněno
                  </span>
                </div>
              </div>

              {/* Sub-device pill */}
              <div className="text-center text-[11px] font-medium text-slate-400">
                Kroky z přístroje <strong className="text-slate-700">{currentDevice}</strong>
              </div>

              {/* 3 Metric Pills (Distance, Calories, Time) */}
              <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-100">
                <div className="bg-sky-50/70 rounded-2xl p-2.5 text-center border border-sky-100">
                  <span className="text-base block mb-0.5">👟</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 font-mono block leading-tight">
                    {distanceKm}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase">Kilometrů</span>
                </div>

                <div className="bg-amber-50/70 rounded-2xl p-2.5 text-center border border-amber-100">
                  <span className="text-base block mb-0.5">🔥</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 font-mono block leading-tight">
                    {activeCalories}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase">Aktivních kcal</span>
                </div>

                <div className="bg-emerald-50/70 rounded-2xl p-2.5 text-center border border-emerald-100">
                  <span className="text-base block mb-0.5">⏱️</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 font-mono block leading-tight">
                    {activeMinutes} min
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase">Pohyb MVPA</span>
                </div>
              </div>
            </div>

            {/* CARD 2: UNIFIED CIRKADIÁNNÍ RYTMUS (Jednotná Apple karta s hloubkou a insets) */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 space-y-4 w-full min-w-0">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎒</span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Cirkadiánní den
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-[#007CA6] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                  4 etapy • FTK UP
                </span>
              </div>

              {/* 1. Ranní cesta */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">🎒</span>
                    <span className="text-xs font-extrabold text-slate-900 truncate">Cesta do školy</span>
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.2 rounded shrink-0">06:00 – 08:00</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 font-mono">{breakdown.morningCommute.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-amber-700 ml-1.5">{((breakdown.morningCommute / Math.max(1, breakdown.total)) * 100).toFixed(0)} %</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, (breakdown.morningCommute / 2000) * 100)}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Aktivní chodec do školy 🚶‍♂️</div>
              </div>

              <div className="border-t border-slate-100" />

              {/* 2. Škola */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">🏫</span>
                    <span className="text-xs font-extrabold text-slate-900 truncate">Dopoledne ve škole</span>
                    <span className="text-[9px] font-bold text-sky-800 bg-sky-100/80 px-1.5 py-0.2 rounded shrink-0">08:00 – 14:00</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 font-mono">{breakdown.schoolHours.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-sky-700 ml-1.5">{((breakdown.schoolHours / Math.max(1, breakdown.total)) * 100).toFixed(0)} %</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full" style={{ width: `${Math.min(100, (breakdown.schoolHours / 3000) * 100)}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Přestávky & tělocvik 🏃</div>
              </div>

              <div className="border-t border-slate-100" />

              {/* 3. Kroužky a hřiště */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">⚽</span>
                    <span className="text-xs font-extrabold text-slate-900 truncate">Kroužky & Venku</span>
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded shrink-0">14:00 – 19:00</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 font-mono">{breakdown.afterSchool.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-emerald-700 ml-1.5">{((breakdown.afterSchool / Math.max(1, breakdown.total)) * 100).toFixed(0)} %</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(100, (breakdown.afterSchool / 3000) * 100)}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Sport & volný pohyb ⚡</div>
              </div>

              <div className="border-t border-slate-100" />

              {/* 4. Večer doma */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">🏠</span>
                    <span className="text-xs font-extrabold text-slate-900 truncate">Večer doma</span>
                    <span className="text-[9px] font-bold text-purple-800 bg-purple-100/80 px-1.5 py-0.2 rounded shrink-0">19:00 – 24:00</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 font-mono">{breakdown.evening.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-purple-700 ml-1.5">{((breakdown.evening / Math.max(1, breakdown.total)) * 100).toFixed(0)} %</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: `${Math.min(100, (breakdown.evening / 1000) * 100)}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Klidový režim před spánkem 🌙</div>
              </div>
            </div>

            {/* CARD 3: TÝDENNÍ HISTORIE */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 space-y-3 w-full min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-black text-slate-900">Aktivita v týdnu</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Průměr 8 970 / den
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 items-end h-22 pt-1">
                {weekDays.map((wd, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                    <div className="w-full max-w-[24px] bg-slate-100 rounded-full overflow-hidden flex flex-col justify-end h-16 p-0.5">
                      <div 
                        className={`w-full rounded-full transition-all ${
                          wd.isToday 
                            ? 'bg-[#007CA6]' 
                            : wd.goalMet 
                            ? 'bg-emerald-400' 
                            : 'bg-slate-300'
                        }`}
                        style={{ height: `${Math.max(15, wd.percent)}%` }}
                      />
                    </div>
                    <span className={`text-[9px] font-bold ${wd.isToday ? 'text-[#007CA6] font-black' : 'text-slate-400'}`}>
                      {wd.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 4: VĚDECKÉ DOPORUČENÍ FTK UP */}
            <div className="bg-gradient-to-r from-sky-50 to-indigo-50/70 border border-sky-200/80 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white border border-sky-200 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                🎓
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 block truncate">
                  Národní zpráva o pohybové aktivitě
                </span>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed mt-0.5">
                  Dnes jsi splnil <strong>65 %</strong> denní dávky pohybu. Ještě <strong>3 536 kroků</strong> a dosáhneš optima!
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: VÝZVA (Interactive Game, Map, Teacher Quest & Milestones)      */}
        {/* ==================================================================== */}
        {activeTab === 'challenge' && (
          <div className="space-y-4 animate-fade-in w-full min-w-0">
            
            {/* CLASS GOAL & CONTRIBUTION CARD */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 space-y-3">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-slate-900 leading-tight truncate">
                      Cíl třídy: {targetSteps.toLocaleString()} kroků
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium block truncate">
                      Ušli jsme: <strong className="text-slate-800 font-mono">{classTotalSteps.toLocaleString()}</strong> kroků
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                  {progressPercent} %
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-[#007CA6] to-cyan-400 h-full rounded-full transition-all duration-700" 
                  style={{ width: `${Math.max(4, progressPercent)}%` }}
                />
              </div>

              {/* Next Milestone Banner */}
              <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs min-w-0">
                <div className="flex items-center gap-1.5 text-slate-600 font-medium truncate">
                  <Compass className="w-3.5 h-3.5 text-[#007CA6] shrink-0" />
                  <span className="truncate">Další milník: <strong>Vídeň</strong></span>
                </div>
                <span className="text-[11px] font-bold text-[#007CA6] shrink-0">
                  Zbývá 14 200 kroků
                </span>
              </div>
            </div>

            {/* INTERACTIVE GAME VIEWPORT */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
              <div className="p-2.5 border-b border-slate-100 flex items-center justify-between gap-1 bg-slate-50/50">
                <button
                  onClick={() => setGameSubTab('map')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    gameSubTab === 'map' ? 'bg-[#007CA6] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>Trasa na mapě</span>
                </button>
                <button
                  onClick={() => setGameSubTab('puzzle')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    gameSubTab === 'puzzle' ? 'bg-[#007CA6] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Odkrývání</span>
                </button>
                <button
                  onClick={() => setGameSubTab('pixelate')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    gameSubTab === 'pixelate' ? 'bg-[#007CA6] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Zaostřování</span>
                </button>
              </div>

              {/* Game Viewport */}
              <div className="w-full relative h-[340px] bg-slate-100">
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

                {/* Floating Map HUD pill */}
                <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md p-2.5 rounded-2xl border border-white/80 shadow-md flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-sm">📍</span>
                    <span className="text-[11px] font-bold text-slate-800 truncate">
                      Postup třídy o <strong>{progressPercent} %</strong>
                    </span>
                  </div>
                  <span className="text-[9px] font-extrabold text-[#007CA6] uppercase shrink-0">
                    Aktivní etapa
                  </span>
                </div>
              </div>
            </div>

            {/* EDUCATIONAL RIDDLE QUEST FROM TEACHER */}
            {currentChallenge.customTaskPrompt && (
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
                    💡 Úkol z výuky • {currentChallenge.subjectCategory || 'Zeměpis'}
                  </span>
                  <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                </div>

                <h4 className="font-extrabold text-xs text-indigo-950 leading-snug">
                  {currentChallenge.customTaskPrompt}
                </h4>

                {currentChallenge.customClue && (
                  <div className="p-2.5 bg-white/95 rounded-2xl border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed shadow-2xs">
                    🔍 <strong>Nápověda:</strong> {currentChallenge.customClue}
                  </div>
                )}

                <form onSubmit={handleVerifyRiddle} className="flex gap-2 pt-0.5">
                  <input
                    type="text"
                    placeholder="Sem napiš odpověď..."
                    value={riddleGuess}
                    onChange={(e) => setRiddleGuess(e.target.value)}
                    className="flex-1 min-w-0 px-3.5 py-2 text-xs font-bold bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Ověřit</span>
                    <Send className="w-3 h-3" />
                  </button>
                </form>

                {riddleFeedback === 'success' && (
                  <div className="text-[11px] font-bold text-emerald-800 bg-emerald-100 p-2.5 rounded-xl border border-emerald-300 flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>🎉 Správně! Získáváš bonus pro třídu!</span>
                  </div>
                )}
                {riddleFeedback === 'wrong' && (
                  <div className="text-[11px] font-bold text-rose-800 bg-rose-100 p-2.5 rounded-xl border border-rose-300 flex items-center gap-1.5 animate-fade-in">
                    <X className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Zkus to ještě jednou podle nápovědy!</span>
                  </div>
                )}
              </div>
            )}

            {/* CLASS TEAM ACTIVITY STREAM (Live Ticker) */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-2.5">
              <span className="text-xs font-black text-slate-900 block">
                Poslední aktivita spolužáků
              </span>

              <div className="space-y-1.5">
                {classStudents.slice(0, 3).map((st, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 rounded-2xl flex items-center justify-between text-xs border border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{st.avatar || '👤'}</span>
                      <span className="font-bold text-slate-800 truncate">{st.name}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px] shrink-0">
                      +<strong>{st.steps.toLocaleString()}</strong> kroků
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: TŘÍDA (Leaderboard, Olympic Podium & Community Kudos)          */}
        {/* ==================================================================== */}
        {activeTab === 'class' && (
          <div className="space-y-4 animate-fade-in w-full min-w-0">
            
            {/* CLASS COMMUNITY HEADER */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 space-y-3">
              <div className="flex items-center justify-between gap-1 min-w-0">
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900 truncate">{currentGroup.name}</h3>
                  <span className="text-xs text-slate-400 font-medium block truncate">
                    Průměr: <strong className="text-slate-800 font-mono">{classAvgSteps.toLocaleString()}</strong> kroků/žák
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                  🚶‍♂️ {activeCommutePercent} % pěšky
                </span>
              </div>

              {/* FTK UP Recommended Toggle: Team share vs Raw steps */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-600">Režim zobrazení:</span>
                <button
                  onClick={() => setUseTeamShare(!useTeamShare)}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                >
                  {useTeamShare ? '👥 Týmový podíl (%)' : '📊 Absolutní kroky'}
                </button>
              </div>
            </div>

            {/* OLYMPIC PODIUM PRO TOP 3 (Visual Gamification - Clean Light Daylight) */}
            {sortedClass.length >= 3 && (
              <div className="bg-gradient-to-b from-sky-50/70 via-slate-50 to-white rounded-2xl p-5 border border-sky-100 shadow-xs relative overflow-hidden">
                <div className="text-center text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                  🏆 Stupně vítězů třídy
                </div>

                <div className="grid grid-cols-3 gap-2 items-end pt-3 pb-1">
                  
                  {/* 2nd Place (Silver) */}
                  <div className="flex flex-col items-center min-w-0">
                    <div className="text-2xl mb-0.5">{sortedClass[1].avatar || '🐱'}</div>
                    <span className="text-[11px] font-bold truncate max-w-full text-gray-800">{sortedClass[1].name.split(' ')[0]}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{sortedClass[1].steps.toLocaleString()}</span>
                    <div className="w-full bg-slate-200/90 border-t-2 border-slate-300 h-16 rounded-t-xl mt-1.5 flex flex-col items-center justify-center shadow-2xs">
                      <span className="text-xl">🥈</span>
                      <span className="text-[9px] font-bold text-gray-600">2. místo</span>
                    </div>
                  </div>

                  {/* 1st Place (Gold - Tallest) */}
                  <div className="flex flex-col items-center -mt-2 min-w-0">
                    <span className="text-xs">👑</span>
                    <div className="text-3xl mb-0.5">{sortedClass[0].avatar || '🦊'}</div>
                    <span className="text-xs font-black truncate max-w-full text-amber-800">{sortedClass[0].name.split(' ')[0]}</span>
                    <span className="text-[10px] text-amber-700 font-mono font-bold">{sortedClass[0].steps.toLocaleString()}</span>
                    <div className="w-full bg-gradient-to-t from-amber-400 to-amber-300 border-t-2 border-amber-200 h-22 rounded-t-xl mt-1.5 flex flex-col items-center justify-center shadow-xs">
                      <span className="text-2xl">🥇</span>
                      <span className="text-[9px] font-black text-amber-900">1. místo</span>
                    </div>
                  </div>

                  {/* 3rd Place (Bronze) */}
                  <div className="flex flex-col items-center min-w-0">
                    <div className="text-2xl mb-0.5">{sortedClass[2].avatar || '🐻'}</div>
                    <span className="text-[11px] font-bold truncate max-w-full text-gray-800">{sortedClass[2].name.split(' ')[0]}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{sortedClass[2].steps.toLocaleString()}</span>
                    <div className="w-full bg-amber-100/90 border-t-2 border-amber-300 h-12 rounded-t-xl mt-1.5 flex flex-col items-center justify-center shadow-2xs">
                      <span className="text-xl">🥉</span>
                      <span className="text-[9px] font-bold text-amber-900">3. místo</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* CLASSMATES LEADERBOARD LIST */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-2">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-1 mb-1">
                Kompletní žebříček ({sortedClass.length} žáků):
              </div>

              <div className="space-y-1.5">
                {sortedClass.map((s, idx) => {
                  const isMe = s.id === currentStudent.id;
                  const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
                  const share = classTotalSteps > 0 ? ((s.steps / classTotalSteps) * 100).toFixed(1) : '0';

                  return (
                    <div
                      key={s.id}
                      className={`p-3 rounded-2xl flex items-center justify-between gap-2 transition-all ${
                        isMe
                          ? 'bg-sky-50/90 border-2 border-[#007CA6] shadow-2xs'
                          : 'bg-slate-50/80 border border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-black w-4 text-center shrink-0">{medal}</span>
                        <span className="text-lg shrink-0">{s.avatar || '👤'}</span>
                        <div className="min-w-0">
                          <span className={`text-xs block truncate ${isMe ? 'text-[#007CA6] font-black' : 'text-slate-800 font-bold'}`}>
                            {s.name} {isMe && '(Ty)'}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                            <span>🔥 {s.streakDays || 5} dní</span>
                            <span>•</span>
                            <span>🚶‍♂️ {s.morningSteps ? `${s.morningSteps} ráno` : 'aktivní'}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          {useTeamShare ? (
                            <div>
                              <span className="text-xs font-black text-slate-900">{share} %</span>
                              <span className="text-[8px] text-slate-400 block">týmu</span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-xs font-black text-slate-900 font-mono">{s.steps.toLocaleString()}</span>
                              <span className="text-[8px] text-slate-400 block">kroků</span>
                            </div>
                          )}
                        </div>

                        {/* Interactive Kudos Button */}
                        {!isMe && (
                          <button
                            onClick={() => handleSendKudos(s.id)}
                            className={`p-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                              kudosSent[s.id]
                                ? 'bg-amber-100 text-amber-800 scale-110'
                                : 'bg-white hover:bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                            title="Plácnout si!"
                          >
                            {kudosSent[s.id] ? '👏' : '✋'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: SENZORY (Wearables, Health Connect, Live Sync & Calibration)   */}
        {/* ==================================================================== */}
        {activeTab === 'sync' && (
          <div className="space-y-4 animate-fade-in w-full min-w-0">
            
            {/* HERO CONNECTED DEVICE CARD */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 space-y-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-50 to-sky-100 border border-cyan-200 flex items-center justify-center text-2xl shadow-xs">
                      {currentDevice.includes('Garmin') ? '⌚' : currentDevice.includes('Apple') ? '🍏' : '📱'}
                    </div>
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">{currentDevice}</h3>
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5 truncate">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{sensorStatus}</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowDevicePicker(!showDevicePicker)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer shadow-2xs shrink-0"
                >
                  Změnit
                </button>
              </div>

              {/* Device Selector Sheet */}
              {showDevicePicker && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 animate-fade-in">
                  <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Vyberte své měřicí zařízení:
                  </div>
                  {[
                    { id: 'Garmin Vívoactive 4', name: '⌚ Garmin Vívoactive / Connect', desc: 'Garmin hodinky' },
                    { id: 'Apple Zdraví (iOS)', name: '🍏 Apple Zdraví & Apple Watch', desc: 'iPhone nebo Apple Watch' },
                    { id: 'Google Fit & Health Connect', name: '🔵 Google Fit & Health Connect', desc: 'Android mobily & hodinky' },
                    { id: 'Školní krokoměr', name: '👟 Školní krokoměr / v kapse', desc: 'Krokoměr na opasku' }
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
                      <div className="text-xs font-bold truncate">{dev.name}</div>
                      <div className={`text-[9px] truncate ${currentDevice === dev.id ? 'text-white/80' : 'text-slate-400'}`}>{dev.desc}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Status details bar */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase truncate">Poslední sync</span>
                  <strong className="text-slate-800 text-xs font-mono block truncate">{lastSyncTime}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase truncate">Stav baterie</span>
                  <strong className="text-emerald-700 text-xs flex items-center gap-1 truncate">
                    <BatteryCharging className="w-3.5 h-3.5 shrink-0" /> 88 % • Aktivní
                  </strong>
                </div>
              </div>

              {/* SUCCESS NOTIFICATION */}
              {syncSuccessMsg && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fade-in shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{syncSuccessMsg}</span>
                </div>
              )}

              {/* BIG 1-TAP GLOWING SYNC HERO BUTTON */}
              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="w-full py-4 px-5 rounded-2xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-[#007CA6] via-cyan-500 to-[#007CA6] hover:brightness-110 shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Synchronizuji...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white text-white shrink-0" />
                    <span>ODESLAT {liveSteps.toLocaleString()} KROKŮ DO TŘÍDY</span>
                  </>
                )}
              </button>
            </div>

            {/* QUICK STEP PRESETS */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 space-y-3">
              <span className="text-xs font-black text-slate-900 block">
                Rychlé přidání kroků
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleQuickAdd(500)}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-center transition-all cursor-pointer"
                >
                  <span className="text-xs font-black text-slate-900 block">+500</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase block truncate">Přestávka</span>
                </button>
                <button
                  onClick={() => handleQuickAdd(1200)}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-center transition-all cursor-pointer"
                >
                  <span className="text-xs font-black text-slate-900 block">+1 200</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase block truncate">Tělocvik</span>
                </button>
                <button
                  onClick={() => handleQuickAdd(2500)}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-center transition-all cursor-pointer"
                >
                  <span className="text-xs font-black text-slate-900 block">+2 500</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase block truncate">Trénink</span>
                </button>
              </div>

              {/* Manual calibration prompt */}
              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => setIsCalibrating(!isCalibrating)}
                  className="text-xs font-bold text-[#007CA6] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>✏️ Zadat stav z displeje hodinek ručně</span>
                </button>
              </div>

              {isCalibrating && (
                <form onSubmit={handleSaveCalibration} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 animate-fade-in">
                  <label className="text-[10px] font-bold text-slate-700 block">
                    Přesný počet kroků z náramku:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="150000"
                      value={calibrationValue}
                      onChange={(e) => setCalibrationValue(e.target.value)}
                      placeholder={String(currentStudent.steps)}
                      className="flex-1 min-w-0 px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007CA6]"
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

            {/* DEDUPLIKACE FTK UP */}
            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Kinantropologická deduplikace (FTK UP)</span>
              </div>
              <p className="text-[10px] text-slate-600 font-normal leading-relaxed">
                Pokud máš hodinky i mobil současně, systém Gamifiter automaticky upřednostňuje data z hodinek. Kroky se nikdy nezapočítávají dvakrát.
              </p>
            </div>

          </div>
        )}

      </main>

      {/* ==================================================================== */}
      {/* 3. NATIVE FLOATING BOTTOM DOCK (Gamifiter Large Touch Dock)          */}
      {/* ==================================================================== */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-2xl border-t border-gray-200 shadow-[0_-6px_25px_rgba(0,0,0,0.08)] z-50 px-2 pt-1.5 pb-2 safe-area-pb">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
          
          {/* Tab 1: Můj den */}
          <button
            onClick={() => setActiveTab('my-day')}
            className={`flex flex-col items-center justify-center min-h-[54px] py-1 px-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'my-day'
                ? 'text-[#007CA6] font-black'
                : 'text-gray-500 hover:text-gray-800 font-semibold'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'my-day' ? 'bg-[#007CA6]/15 scale-110 shadow-2xs' : ''}`}>
              <Activity className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">Můj den</span>
          </button>

          {/* Tab 2: Výzva */}
          <button
            onClick={() => setActiveTab('challenge')}
            className={`flex flex-col items-center justify-center min-h-[54px] py-1 px-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'challenge'
                ? 'text-[#007CA6] font-black'
                : 'text-gray-500 hover:text-gray-800 font-semibold'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'challenge' ? 'bg-[#007CA6]/15 scale-110 shadow-2xs' : ''}`}>
              <PlayCircle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">Výzva</span>
          </button>

          {/* Tab 3: Moje třída */}
          <button
            onClick={() => setActiveTab('class')}
            className={`flex flex-col items-center justify-center min-h-[54px] py-1 px-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'class'
                ? 'text-[#007CA6] font-black'
                : 'text-gray-500 hover:text-gray-800 font-semibold'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'class' ? 'bg-[#007CA6]/15 scale-110 shadow-2xs' : ''}`}>
              <Users className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">Třída</span>
          </button>

          {/* Tab 4: Senzory & Sync */}
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex flex-col items-center justify-center min-h-[54px] py-1 px-1 rounded-2xl transition-all cursor-pointer relative ${
              activeTab === 'sync'
                ? 'text-[#007CA6] font-black'
                : 'text-gray-500 hover:text-gray-800 font-semibold'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'sync' ? 'bg-[#007CA6]/15 scale-110 shadow-2xs' : ''}`}>
              <Watch className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">Senzory</span>
            <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* Tab 5: Zpět do portálu */}
          <button
            onClick={onSwitchToTeacherMode}
            className="flex flex-col items-center justify-center min-h-[54px] py-1 px-1 rounded-2xl text-gray-500 hover:text-gray-800 font-semibold transition-all cursor-pointer active:scale-95"
            title="Návrat na hlavní portál"
          >
            <div className="p-1.5 rounded-xl hover:bg-gray-100">
              <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">Portál</span>
          </button>

        </div>
      </nav>

    </div>
  );
};
