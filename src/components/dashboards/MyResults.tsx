import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { getStudents, updateStudentSteps, syncWithCloudD1 } from '../../services/storage';
import { CheckCircle2, RefreshCw, Edit3, Save, X, ShieldCheck, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { type Student } from '../../types';
import { NativeHealthService, type DaySegmentBreakdown } from '../../services/nativeHealthService';

interface MyResultsProps {
  students?: Student[];
  onUpdateStudentSteps?: (steps: number) => void;
  onRefreshCloud?: () => Promise<void>;
}

export const MyResults: React.FC<MyResultsProps> = ({
  students: propStudents,
  onUpdateStudentSteps,
  onRefreshCloud
}) => {
  const [localStudents, setLocalStudents] = useState<Student[]>(() => propStudents || getStudents());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Kid-friendly day profile tester state
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [simulatedStepCount, setSimulatedStepCount] = useState<number | null>(null);

  useEffect(() => {
    if (propStudents && propStudents.length > 0) {
      setLocalStudents(propStudents);
    }
  }, [propStudents]);

  const currentList = (propStudents && propStudents.length > 0) ? propStudents : localStudents;
  const david = currentList.find(s => s.id === 'student-1' || s.name.includes('David Prycl'));
  const realStepsToday = david ? david.steps : 6464;
  const activeStepsForBreakdown = simulatedStepCount !== null ? simulatedStepCount : realStepsToday;

  const [breakdown, setBreakdown] = useState<DaySegmentBreakdown>(() => {
    const morning = Math.round(activeStepsForBreakdown * 0.28);
    const school = Math.round(activeStepsForBreakdown * 0.34);
    const after = Math.round(activeStepsForBreakdown * 0.29);
    const evening = Math.max(0, activeStepsForBreakdown - (morning + school + after));
    return {
      morningCommute: morning,
      schoolHours: school,
      afterSchool: after,
      evening,
      total: activeStepsForBreakdown
    };
  });

  useEffect(() => {
    NativeHealthService.getSegmentedStepBreakdown(activeStepsForBreakdown).then(res => {
      setBreakdown(res);
    });
  }, [activeStepsForBreakdown]);

  const handleRefreshFromCloud = async () => {
    setIsRefreshing(true);
    setStatusNotice(null);
    try {
      if (onRefreshCloud) {
        await onRefreshCloud();
      } else {
        const res = await fetch(NativeHealthService.getServerUrl('/api/sync/status'));
        const data = await res.json();
        if (data.success && data.students && data.students.length > 0) {
          const merged = syncWithCloudD1(data.students);
          setLocalStudents([...merged]);
        }
      }
      setStatusNotice('Kroky úspěšně aktualizovány z Cloudflare D1 databáze!');
    } catch (e) {
      setStatusNotice('Chyba při komunikaci s Cloudflare D1.');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

  const handleSaveManualSteps = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val < 0) return;

    setIsRefreshing(true);
    try {
      // 1. Update Cloudflare D1
      await fetch(NativeHealthService.getServerUrl('/api/sync'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: 'student-1',
          studentName: 'David Prycl',
          token: 'ftk-prycl-garmin',
          steps: val,
          isDelta: false,
          device: 'Garmin Vívoactive 4',
          source: 'manual_calibration'
        })
      });

      // 2. Update local storage & state
      const updated = updateStudentSteps('student-1', val);
      setLocalStudents([...updated]);
      if (onUpdateStudentSteps) {
        onUpdateStudentSteps(val);
      }

      setIsEditing(false);
      setEditValue('');
      setStatusNotice(`Dnešní kroky nastaveny na ${val.toLocaleString()} a uloženy do cloudu D1.`);
    } catch (err) {
      // Local fallback
      const updated = updateStudentSteps('student-1', val);
      setLocalStudents([...updated]);
      if (onUpdateStudentSteps) {
        onUpdateStudentSteps(val);
      }
      setIsEditing(false);
      setStatusNotice(`Dnešní kroky nastaveny na ${val.toLocaleString()} (lokálně).`);
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

  // Last 14 days: 13 simulated days (grey) + 1 real day today (cyan)
  const daysHistory = [
    { date: '19. 9.', steps: 11200, isReal: false },
    { date: '20. 9.', steps: 12400, isReal: false },
    { date: '21. 9.', steps: 9800,  isReal: false },
    { date: '22. 9.', steps: 14100, isReal: false },
    { date: '23. 9.', steps: 13500, isReal: false },
    { date: '24. 9.', steps: 10200, isReal: false },
    { date: '25. 9.', steps: 8900,  isReal: false },
    { date: '26. 9.', steps: 15300, isReal: false },
    { date: '27. 9.', steps: 16200, isReal: false },
    { date: '28. 9.', steps: 11800, isReal: false },
    { date: '29. 9.', steps: 13900, isReal: false },
    { date: '30. 9.', steps: 12100, isReal: false },
    { date: '1. 10.', steps: 9400,  isReal: false },
    { date: 'Dnes',   steps: realStepsToday, isReal: true },
  ];

  // ECharts Bar Chart config with greyed out fake data and colored real data
  const barOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#0f172a', fontFamily: 'var(--font-sans)', fontSize: 11 },
      formatter: (params: any) => {
        const item = params[0];
        const day = daysHistory[item.dataIndex];
        return `
          <div style="font-weight: 700; font-size: 12px; margin-bottom: 4px;">${day.date}</div>
          <div style="color: ${day.isReal ? '#007CA6' : '#64748B'}; font-weight: bold;">
            ${day.isReal ? '🟢 REÁLNÁ DATA (GARMIN)' : '⚪ Simulační demo vzor'}: ${item.value.toLocaleString()} kroků
          </div>
        `;
      }
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '10%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: daysHistory.map(d => d.date),
      axisLabel: { 
        color: (val: string) => val === 'Dnes' ? '#007CA6' : '#94A3B8',
        fontSize: 11,
        fontWeight: (val: string) => val === 'Dnes' ? 'bold' : 'normal'
      },
      axisLine: { lineStyle: { color: '#e2e8f0' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94A3B8', fontSize: 10, formatter: '{value} kroků' },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLine: { show: false }
    },
    series: [
      {
        name: 'Kroky',
        type: 'bar',
        barWidth: '55%',
        data: daysHistory.map(d => ({
          value: d.steps,
          itemStyle: {
            color: d.isReal ? '#007CA6' : '#E2E8F0', // Colored for real, grey for fake
            borderRadius: [6, 6, 0, 0]
          }
        }))
      },
      {
        name: 'Doporučený cíl',
        type: 'line',
        data: Array(daysHistory.length).fill(10000),
        symbol: 'none',
        lineStyle: { color: '#CBD5E1', width: 2, type: 'dashed' },
        itemStyle: { color: '#CBD5E1' }
      }
    ]
  };

  // ECharts Gauge config
  const gaugeOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 5,
        radius: '100%',
        center: ['50%', '70%'],
        progress: {
          show: true,
          width: 18,
          itemStyle: { color: '#007CA6' }
        },
        axisLine: {
          lineStyle: { width: 18, color: [[1, '#F1F5F9']] }
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: { show: false },
        detail: {
          valueAnimation: true,
          fontSize: 32,
          fontWeight: 'bold',
          offsetCenter: [0, '-10%'],
          formatter: `${Math.round((realStepsToday / 10000) * 100)}%`,
          color: '#0F172A'
        },
        data: [{ value: Math.min(100, Math.round((realStepsToday / 10000) * 100)) }]
      }
    ]
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="view-title-container flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="view-title">Moje výsledky</h2>
          <p className="text-xs text-gray-500">
            Osobní telemetrický profil a plnění pohybového doporučení (FTK UP)
          </p>
        </div>

        {/* Apple Style Cloud & Watch Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshFromCloud}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-xs disabled:opacity-50"
            title="Stáhnout nejnovější stav z Cloudflare D1 databáze"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#007CA6] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Načítám...' : 'Obnovit z D1 cloudu'}</span>
          </button>

          <button
            onClick={() => {
              setEditValue(String(realStepsToday));
              setIsEditing(!isEditing);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-cyan-50 border border-cyan-200 text-[#007CA6] hover:bg-cyan-100 active:scale-95 transition-all shadow-xs"
            title="Zadat nebo upravit aktuální stav kroků z hodinek"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Upravit stav z hodinek</span>
          </button>
        </div>
      </div>

      {/* Manual Step Calibration Prompt */}
      {isEditing && (
        <form onSubmit={handleSaveManualSteps} className="bg-white border-2 border-[#007CA6]/30 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-[#007CA6] shrink-0 font-bold">
              ⌚
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Kalibrace kroků z hodinek Garmin</div>
              <div className="text-[11px] text-gray-500">Zadejte přesný počet kroků, který právě teď ukazuje ciferník vašich Garmin hodinek:</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="150000"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-32 px-3 py-1.5 text-sm font-bold text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007CA6] text-right"
              autoFocus
            />
            <span className="text-xs text-gray-500 font-semibold">kroků</span>
            
            <button
              type="submit"
              disabled={isRefreshing}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#007CA6] text-white hover:bg-[#006588] transition-all shadow-xs disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Uložit</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      {/* Notification Toast */}
      {statusNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Distinction Banner: Real vs Fictitious */}
      <div className="bg-sky-50/80 border border-sky-200/80 rounded-2xl p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-white border border-sky-300 flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="h-5 w-5 text-[#007CA6]" />
          </div>
          <div className="text-xs text-sky-950 leading-relaxed">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold text-sm text-[#007CA6]">Reálná telemetrie aktivní</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                ● Garmin Vívoactive 4
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                ☁️ Cloudflare D1 Live
              </span>
            </div>
            <p className="text-sky-900/90 text-xs">
              Váš dnešní reálný stav z hodinek je <strong className="text-[#007CA6] font-bold">{realStepsToday.toLocaleString()} kroků</strong> (zvýrazněn sytě modře). 
              Zbylé sloupce a tabulka jsou zobrazeny <strong className="text-gray-500">šedě jako simulační demo vzor</strong> pro vizualizaci před začátkem dlouhodobého měření třídy.
            </p>
          </div>
        </div>
      </div>

      {/* Main Bar Chart */}
      <div className="replicated-card">
        <div className="replicated-card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Počet kroků za posledních 14 dní</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#007CA6] bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
              Dnes: Reálná data
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#007CA6]" />
              <strong className="text-gray-700">Reálné (Dnes)</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#E2E8F0]" />
              <span>Simulace (Demo)</span>
            </span>
          </div>
        </div>
        <div className="replicated-card-body">
          <div style={{ height: '320px', width: '100%' }}>
            <ReactECharts option={barOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Time-Segmented Day Profile (Ve škole vs. Po škole vs. Ranní cesta) - Kid-friendly Apple UX */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-300">
        
        {/* Card Header with Playful Emoji & Real Data Badge */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-2xl shadow-sm shrink-0">
              🎒
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Můj den v krocích: Kde a kdy se hýbu?
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Živé rozložení dne
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Zde přesně vidíš, kolik kroků jsi dnes nasbíral/a cestou do školy, při vyučování v lavici a odpoledne venku.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xl">⌚</span>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Dnešní součet kroků</span>
              <span className="text-lg sm:text-xl font-black text-[#007CA6] font-mono leading-none">
                {activeStepsForBreakdown.toLocaleString()} <span className="text-xs font-semibold text-slate-500">kroků</span>
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">

          {/* Interactive Tester & Quick Step Presets for User */}
          <div className="p-4 sm:p-5 bg-slate-50/90 border border-slate-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Vyzkoušej rozpad dne pro různé dny:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSimulatedStepCount(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  simulatedStepCount === null
                    ? 'bg-[#007CA6] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                ⌚ Moje reálná data ({realStepsToday.toLocaleString()} kr.)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedStepCount(8200)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  simulatedStepCount === 8200
                    ? 'bg-[#007CA6] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                🏫 Běžný školní den (8 200 kr.)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedStepCount(10000)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  simulatedStepCount === 10000
                    ? 'bg-[#007CA6] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                🎯 Splněný cíl FTK (10 000 kr.)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedStepCount(13500)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  simulatedStepCount === 13500
                    ? 'bg-[#007CA6] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                🏅 Sportovní rekord (13 500 kr.)
              </button>
            </div>
          </div>

          {/* 4 Large, Spacious, Kid-Friendly Segment Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
            
            {/* 1. Morning Commute */}
            <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-100/30 border-2 border-amber-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md hover:border-amber-300 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-amber-100/90 border border-amber-200 text-amber-800 flex items-center justify-center text-3xl shadow-xs">
                  🎒
                </div>
                <span className="text-xs font-extrabold text-amber-800 bg-amber-200/70 px-3 py-1 rounded-full">
                  06:00 – 08:00
                </span>
              </div>
              
              <div className="space-y-1">
                <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider block">
                  Cesta do školy
                </span>
                <p className="text-3xl sm:text-4xl font-black text-amber-950 font-mono tracking-tight">
                  {breakdown.morningCommute.toLocaleString()} <span className="text-xs font-bold text-amber-800">kroků</span>
                </p>
                <div className="inline-block mt-1 px-2 py-0.5 rounded-lg bg-amber-200/60 text-[11px] font-bold text-amber-900">
                  {((breakdown.morningCommute / Math.max(1, breakdown.total)) * 100).toFixed(0)} % dnešního pohybu
                </div>
              </div>

              <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
                Pěšky nebo na koloběžce do školy. Ranní probuzení těla i mozku před zvoněním!
              </p>

              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] font-bold text-amber-800">
                <span>🚀 +38 % ranní chůze</span>
                <span>Mise splněna</span>
              </div>
            </div>

            {/* 2. School Hours */}
            <div className="bg-gradient-to-br from-sky-50/90 via-blue-50/40 to-sky-100/30 border-2 border-sky-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md hover:border-sky-300 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-sky-100/90 border border-sky-200 text-sky-800 flex items-center justify-center text-3xl shadow-xs">
                  🏫
                </div>
                <span className="text-xs font-extrabold text-blue-800 bg-blue-200/70 px-3 py-1 rounded-full">
                  08:00 – 14:00
                </span>
              </div>
              
              <div className="space-y-1">
                <span className="text-[11px] font-black text-blue-900 uppercase tracking-wider block">
                  Dopoledne ve škole
                </span>
                <p className="text-3xl sm:text-4xl font-black text-blue-950 font-mono tracking-tight">
                  {breakdown.schoolHours.toLocaleString()} <span className="text-xs font-bold text-blue-800">kroků</span>
                </p>
                <div className="inline-block mt-1 px-2 py-0.5 rounded-lg bg-blue-200/60 text-[11px] font-bold text-blue-900">
                  {((breakdown.schoolHours / Math.max(1, breakdown.total)) * 100).toFixed(0)} % dnešního pohybu
                </div>
              </div>

              <p className="text-xs text-blue-900/90 leading-relaxed font-medium">
                Schody, aktivní přestávky na chodbě a parádní hodina tělesné výchovy v tělocvičně!
              </p>

              <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-[11px] font-bold text-blue-800">
                <span>⚡ Přestávky & Tělocvik</span>
                <span>Aktivní lavice</span>
              </div>
            </div>

            {/* 3. After School */}
            <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-emerald-100/30 border-2 border-emerald-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md hover:border-emerald-300 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100/90 border border-emerald-200 text-emerald-800 flex items-center justify-center text-3xl shadow-xs">
                  ⚽
                </div>
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-200/70 px-3 py-1 rounded-full">
                  14:00 – 19:00
                </span>
              </div>
              
              <div className="space-y-1">
                <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider block">
                  Kroužky & Venku
                </span>
                <p className="text-3xl sm:text-4xl font-black text-emerald-950 font-mono tracking-tight">
                  {breakdown.afterSchool.toLocaleString()} <span className="text-xs font-bold text-emerald-800">kroků</span>
                </p>
                <div className="inline-block mt-1 px-2 py-0.5 rounded-lg bg-emerald-200/60 text-[11px] font-bold text-emerald-900">
                  {((breakdown.afterSchool / Math.max(1, breakdown.total)) * 100).toFixed(0)} % dnešního pohybu
                </div>
              </div>

              <p className="text-xs text-emerald-900/90 leading-relaxed font-medium">
                Fotbal, hřiště, procházka se psem a dovádění s kamarády venku na čerstvém vzduchu!
              </p>

              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] font-bold text-emerald-800">
                <span>🏆 Hlavní sportovní zóna</span>
                <span>Super výkon</span>
              </div>
            </div>

            {/* 4. Evening */}
            <div className="bg-gradient-to-br from-purple-50/90 via-indigo-50/40 to-purple-100/30 border-2 border-purple-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md hover:border-purple-300 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-purple-100/90 border border-purple-200 text-purple-800 flex items-center justify-center text-3xl shadow-xs">
                  🏠
                </div>
                <span className="text-xs font-extrabold text-purple-800 bg-purple-200/70 px-3 py-1 rounded-full">
                  19:00 – 24:00
                </span>
              </div>
              
              <div className="space-y-1">
                <span className="text-[11px] font-black text-purple-900 uppercase tracking-wider block">
                  Večer doma
                </span>
                <p className="text-3xl sm:text-4xl font-black text-purple-950 font-mono tracking-tight">
                  {breakdown.evening.toLocaleString()} <span className="text-xs font-bold text-purple-800">kroků</span>
                </p>
                <div className="inline-block mt-1 px-2 py-0.5 rounded-lg bg-purple-200/60 text-[11px] font-bold text-purple-900">
                  {((breakdown.evening / Math.max(1, breakdown.total)) * 100).toFixed(0)} % dnešního pohybu
                </div>
              </div>

              <p className="text-xs text-purple-900/90 leading-relaxed font-medium">
                Úkoly, večeře s rodinou, klídek v pokoji a zdravý spánek pro regeneraci na zítřek.
              </p>

              <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between text-[11px] font-bold text-purple-800">
                <span>🌙 Klidový režim</span>
                <span>Spánek & síla</span>
              </div>
            </div>

          </div>

          {/* Stacked Proportional Day Bar with Generous Breathing Space */}
          <div className="space-y-3 p-5 sm:p-6 bg-slate-50/70 rounded-2xl border border-slate-200/70">
            <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm font-extrabold text-slate-800">
              <span className="flex items-center gap-2">
                <span>Rozložení dne (100 % = {breakdown.total.toLocaleString()} kroků)</span>
              </span>
              <span className="text-[#007CA6] font-mono text-sm font-black">
                {breakdown.total.toLocaleString()} kroků celkem
              </span>
            </div>
            
            <div className="h-5 w-full bg-white rounded-full overflow-hidden flex shadow-inner border border-slate-200/80 p-0.5">
              <div 
                className="bg-amber-400 h-full rounded-l-full transition-all duration-500" 
                style={{ width: `${Math.max(2, (breakdown.morningCommute / Math.max(1, breakdown.total)) * 100)}%` }}
                title={`Cesta do školy: ${breakdown.morningCommute.toLocaleString()} kroků`}
              />
              <div 
                className="bg-sky-500 h-full transition-all duration-500" 
                style={{ width: `${Math.max(2, (breakdown.schoolHours / Math.max(1, breakdown.total)) * 100)}%` }}
                title={`Ve škole: ${breakdown.schoolHours.toLocaleString()} kroků`}
              />
              <div 
                className="bg-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${Math.max(2, (breakdown.afterSchool / Math.max(1, breakdown.total)) * 100)}%` }}
                title={`Po škole: ${breakdown.afterSchool.toLocaleString()} kroků`}
              />
              <div 
                className="bg-purple-400 h-full rounded-r-full transition-all duration-500" 
                style={{ width: `${Math.max(2, (breakdown.evening / Math.max(1, breakdown.total)) * 100)}%` }}
                title={`Večer: ${breakdown.evening.toLocaleString()} kroků`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-1 font-semibold">
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-amber-200">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                🎒 Ráno: {((breakdown.morningCommute / Math.max(1, breakdown.total)) * 100).toFixed(0)} %
              </span>
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-sky-200">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                🏫 Ve škole: {((breakdown.schoolHours / Math.max(1, breakdown.total)) * 100).toFixed(0)} %
              </span>
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-emerald-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                ⚽ Po škole: {((breakdown.afterSchool / Math.max(1, breakdown.total)) * 100).toFixed(0)} %
              </span>
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                🏠 Večer doma: {((breakdown.evening / Math.max(1, breakdown.total)) * 100).toFixed(0)} %
              </span>
            </div>
          </div>

          {/* Gamified Kids Badges (Dnešní mise) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-amber-50/60 border border-amber-200/70 rounded-2xl flex items-center gap-3">
              <span className="text-2xl">🎒</span>
              <div>
                <h5 className="font-extrabold text-xs text-amber-950">Ranní probuzení mozku</h5>
                <p className="text-[11px] text-amber-800/90 leading-tight mt-0.5">
                  Chůze před 8:00 nastartuje soustředění a paměť na celé dopoledne.
                </p>
              </div>
            </div>

            <div className="p-4 bg-sky-50/60 border border-sky-200/70 rounded-2xl flex items-center gap-3">
              <span className="text-2xl">🏃‍♂️</span>
              <div>
                <h5 className="font-extrabold text-xs text-blue-950">Královská přestávka</h5>
                <p className="text-[11px] text-blue-800/90 leading-tight mt-0.5">
                  Žádné sezení 45 minut v kuse, každé protáhnutí nohou se počítá!
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl flex items-center gap-3">
              <span className="text-2xl">🌟</span>
              <div>
                <h5 className="font-extrabold text-xs text-emerald-950">Týmový hrdina třídy</h5>
                <p className="text-[11px] text-emerald-800/90 leading-tight mt-0.5">
                  Všechny tvé kroky společně odemykají tajenku a mapu pro celou třídu.
                </p>
              </div>
            </div>
          </div>

          {/* Collapsible Accordion for Teachers & Parents */}
          <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowTechDetails(!showTechDetails)}
              className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100/70 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Jak Gamifiter měří minutová časová razítka a hodinky? (Podrobnosti pro učitele a rodiče)
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                {showTechDetails ? 'Skrýt detaily' : 'Zobrazit technické detaily'}
                {showTechDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            {showTechDetails && (
              <div className="p-5 border-t border-slate-200/80 bg-white grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 animate-fade-in">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="font-bold text-slate-800 block">⏱️ Časová razítka (Minutové vzorky)</span>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Aplikace ukládá časová razítka s přesností na minuty. Učitel tak vidí, zda se třída hýbala o velké přestávce nebo seděla u telefonů.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="font-bold text-slate-800 block">🏃‍♂️ Intenzita pohybu (Kadence & MVPA)</span>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Rozlišení pomalého loudání (&lt;70 kroků/min) od svižné chůze (100–120 kroků/min) a běhu při tělesné výchově.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="font-bold text-slate-800 block">🪑 Detekce sedavého chování (Sedentary time)</span>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Identifikace nepřerušených bloků sezení nad 45 minut během vyučování pro doporučení aktivních chvilek.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                  <span className="font-bold text-slate-800 block">⌚ Izolace hodinek od telefonu</span>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Pokud má žák hodinky Garmin a v kapse telefon, systém přednostně čte hodinky a eliminuje zdvojené kroky.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Semicircular progress gauge */}
        <div className="replicated-card">
          <div className="replicated-card-header flex items-center justify-between">
            <span>Dnešní cíl (10 000 kroků)</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Reálný stav
            </span>
          </div>
          <div className="replicated-card-body flex flex-col items-center justify-center min-h-[220px]">
            <div style={{ height: '180px', width: '100%' }}>
              <ReactECharts option={gaugeOption} style={{ height: '100%', width: '100%' }} />
            </div>
            <p className="text-xs font-semibold text-gray-500 -mt-4">
              Dnes splněno: <strong className="text-gray-800 font-bold">{realStepsToday.toLocaleString()}</strong> z 10 000 kroků
            </p>
          </div>
        </div>

        {/* Weekly Stats Table */}
        <div className="replicated-card">
          <div className="replicated-card-header flex items-center justify-between">
            <span>Týdenní přehled</span>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
              Demo vzor
            </span>
          </div>
          <div className="replicated-card-body p-0">
            <div className="px-5 py-3 border-b border-gray-100 flex justify-between bg-slate-50/50 text-xs">
              <div className="text-gray-400">
                Ukázkový průměr: <strong className="text-gray-500">12 400 kroků</strong>
              </div>
              <div className="text-gray-400">
                Status: <span className="font-semibold text-gray-500">Ukázková data</span>
              </div>
            </div>
            
            <table className="replicated-table">
              <thead>
                <tr>
                  <th className="py-2.5 px-4">Den</th>
                  <th className="py-2.5 px-4 text-center">Zdroj</th>
                  <th className="py-2.5 px-4 text-right">Počet kroků</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-cyan-50/40">
                  <td className="py-3 px-4 font-bold text-gray-900">
                    Dnes (Pátek)
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      🟢 LIVE Garmin
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-black text-[#007CA6]">
                    {realStepsToday.toLocaleString()} kroků
                  </td>
                </tr>
                <tr className="opacity-60 text-gray-400">
                  <td className="py-2.5 px-4 font-medium">Čtvrtek</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                      ⚪ Simulace
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-gray-500">9 400 kroků</td>
                </tr>
                <tr className="opacity-60 text-gray-400">
                  <td className="py-2.5 px-4 font-medium">Středa</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                      ⚪ Simulace
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-gray-500">12 100 kroků</td>
                </tr>
                <tr className="opacity-60 text-gray-400">
                  <td className="py-2.5 px-4 font-medium">Úterý</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                      ⚪ Simulace
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-gray-500">13 900 kroků</td>
                </tr>
                <tr className="opacity-60 text-gray-400">
                  <td className="py-2.5 px-4 font-medium">Pondělí</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                      ⚪ Simulace
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-gray-500">11 800 kroků</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
