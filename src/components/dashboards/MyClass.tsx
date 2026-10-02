import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { type Student, type Group, type Challenge, type School } from '../../types';
import { Award, Footprints, Flame, Users, Shield, Compass, Brain, FileText, CheckCircle2 } from 'lucide-react';
import { ChallengePosterModal } from '../ChallengePosterModal';
import { SchoolReportModal } from '../SchoolReportModal';
import { PhysicalLiteracyModal } from '../PhysicalLiteracyModal';

interface MyClassProps {
  students: Student[];
  group?: Group;
  challenge?: Challenge;
  school?: School;
}

export const MyClass: React.FC<MyClassProps> = ({ students, group, challenge, school }) => {
  const [isPosterOpen, setIsPosterOpen] = useState(false);
  const [isSchoolReportOpen, setIsSchoolReportOpen] = useState(false);
  const [isLiteracyOpen, setIsLiteracyOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'team' | 'individual'>('team');

  // Sort students descending by steps
  const sortedStudents = [...students].sort((a, b) => b.steps - a.steps);

  const totalSteps = students.reduce((sum, s) => sum + s.steps, 0);
  const totalKm = (totalSteps * 0.0007).toFixed(1);
  const activeStudentsCount = students.filter(s => s.steps > 0).length;

  // Active commute: pupils with morning steps >= 1200
  const commuters = students.filter(s => (s.morningSteps || Math.round(s.steps * 0.28)) >= 1200);
  const activeCommutePercent = students.length > 0 ? Math.round((commuters.length / students.length) * 100) : 0;
  const maxStreak = Math.max(0, ...students.map(s => s.streakDays || 5));

  // Prepare data for the ECharts chart
  const topStudentsForChart = [...sortedStudents].slice(0, 7).reverse();
  
  const chartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#0f172a', fontFamily: 'var(--font-sans)', fontSize: 11 }
    },
    grid: {
      left: '3%',
      right: '10%',
      bottom: '3%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#64748B', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    yAxis: {
      type: 'category',
      data: topStudentsForChart.map((s) => s.avatar ? `${s.avatar} ${s.name}` : s.name),
      axisLabel: { color: '#1e293b', fontSize: 11, fontWeight: 'bold' },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    series: [
      {
        name: 'Kroky',
        type: 'bar',
        data: topStudentsForChart.map((s) => s.steps),
        itemStyle: {
          color: '#0082b2',
          borderRadius: [0, 6, 6, 0],
        },
        label: {
          show: true,
          position: 'right',
          color: '#007CA6',
          fontWeight: 'bold',
          formatter: (params: any) => params.value.toLocaleString()
        }
      }
    ]
  };

  const groupProgress = group ? {
    groupId: group.id,
    groupName: group.name,
    adminName: group.adminName,
    totalSteps,
    totalDistanceKm: Number(totalKm),
    activeUsers: activeStudentsCount,
    progressPercent: challenge ? Math.min(100, Math.round((totalSteps / challenge.targetSteps) * 100)) : 0,
    activeCommutePercent,
    streakDays: maxStreak
  } : null;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* View Header with 3 Pedagogical Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="view-title-container">
          <div className="flex items-center gap-2">
            <h2 className="view-title">Moje třída {group ? `– ${group.name}` : ''}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              FTK UP Validováno
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Analytika kroků, ochrana zranitelných žáků, aktivní doprava do školy a oficiální certifikace
          </p>
        </div>

        {/* Buttons Group */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsLiteracyOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Otevřít minikvíz a poznatky o pohybové gramotnosti"
          >
            <Brain className="h-3.5 w-3.5 text-teal-600" />
            <span>🧠 Pohybová gramotnost</span>
          </button>

          <button
            onClick={() => setIsSchoolReportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Oficiální manažerský výstup pro ředitele a ČŠI"
          >
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            <span>📄 Report pro ředitele</span>
          </button>

          {group && challenge && (
            <button
              onClick={() => setIsPosterOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Otevřít a vytisknout oficiální diplom třídy z výzvy"
            >
              <Award className="h-3.5 w-3.5 text-amber-700" />
              <span>🏆 Diplom & Plakát</span>
            </button>
          )}
        </div>
      </div>

      {/* Class Quick KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Steps */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#007CA6] flex items-center justify-center shrink-0">
            <Footprints className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Kroků třídy</div>
            <div className="text-xl font-black text-gray-900 font-mono mt-0.5">
              {totalSteps.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#007CA6] font-semibold">{totalKm} km společně</div>
          </div>
        </div>

        {/* Active Commuting to School (+38% from study) */}
        <div className="bg-white border border-amber-200/90 rounded-2xl p-5 shadow-xs flex items-center gap-4 bg-gradient-to-br from-white to-amber-50/40">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <span>Pěšky do školy</span>
              <span className="text-[9px] bg-amber-200/70 text-amber-900 px-1 py-0.2 rounded font-bold">+38 %</span>
            </div>
            <div className="text-xl font-black text-amber-900 font-mono mt-0.5">
              {activeCommutePercent} % žáků
            </div>
            <div className="text-[11px] text-amber-700 font-medium">ranní chůze do 8:00 hod.</div>
          </div>
        </div>

        {/* Habit Streak */}
        <div className="bg-white border border-rose-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4 bg-gradient-to-br from-white to-rose-50/30">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Aktivní šňůra (Streak)</div>
            <div className="text-xl font-black text-rose-700 font-mono mt-0.5">
              🔥 {maxStreak} dní v řadě
            </div>
            <div className="text-[11px] text-rose-600 font-medium">udržení návyku i o víkendu</div>
          </div>
        </div>

        {/* Active Participation */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Aktivní zapojení</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">
              {activeStudentsCount} / {students.length}
            </div>
            <div className="text-[11px] text-gray-500 font-medium">
              {students.length > 0 ? Math.round((activeStudentsCount / students.length) * 100) : 0} % třídy v pohybu
            </div>
          </div>
        </div>

      </div>

      {/* Chart and Table Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Leaderboard Chart */}
        <div className="replicated-card">
          <div className="replicated-card-header flex items-center justify-between">
            <span>Srovnání výkonu žáků</span>
            <span className="text-[11px] text-slate-500">Top 7 tahounů třídy</span>
          </div>
          <div className="replicated-card-body min-h-[340px]">
            {topStudentsForChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#64748B] py-20">
                Žádná data pro zobrazení
              </div>
            ) : (
              <ReactECharts option={chartOption} style={{ height: '320px', width: '100%' }} />
            )}
          </div>
        </div>

        {/* Right: Modern Mode Toggle & List */}
        <div className="replicated-card flex flex-col">
          
          {/* Header with Research-backed Toggle (20% negative sentiment protection) */}
          <div className="replicated-card-header flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-800 text-sm">Žebříček třídy</span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setViewMode('team')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'team'
                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Doporučeno FTK UP: Zobrazuje % podíl na třídním cíli a chrání 20 % žáků před demotivací"
              >
                <span>👥 Týmový podíl</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold">FTK</span>
              </button>
              <button
                onClick={() => setViewMode('individual')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'individual'
                    ? 'bg-white text-slate-800 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 Detailní kroky
              </button>
            </div>
          </div>

          <div className="replicated-card-body p-0 overflow-x-auto">

            {/* Notice for Team Mode */}
            {viewMode === 'team' && (
              <div className="px-4 py-2 bg-emerald-50/60 border-b border-emerald-100 text-[11px] text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Pedagogický mód:</strong> Žáci vidí svůj <em>příspěvek k vítězství třídy</em> namísto veřejného zostuzení slabších (Deci & Ryan SDT).
                </span>
              </div>
            )}

            <table className="replicated-table">
              <thead>
                <tr>
                  <th className="py-2.5 px-4 w-14 text-center">#</th>
                  <th className="py-2.5 px-4">Žák & Avatar</th>
                  {viewMode === 'team' ? (
                    <>
                      <th className="py-2.5 px-4 text-center">Podíl na cíli</th>
                      <th className="py-2.5 px-4 text-right">Ranní cesta</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2.5 px-4 text-right">Celkem kroků</th>
                      <th className="py-2.5 px-4 text-right">Vzdálenost</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student, index) => {
                  const distanceKm = Math.round((student.steps * 0.0007) * 100) / 100;
                  const contributionPct = totalSteps > 0 ? ((student.steps / totalSteps) * 100).toFixed(1) : '0';
                  const morningSteps = student.morningSteps || Math.round(student.steps * 0.28);
                  const isCommuter = morningSteps >= 1200;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-500 text-center">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </td>
                      
                      {/* Name & Avatar */}
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm shadow-2xs">
                            {student.avatar || '🦊'}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{student.name}</span>
                              {student.isReal && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                  LIVE
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              🔥 {student.streakDays || 5} dní streak
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Content based on View Mode */}
                      {viewMode === 'team' ? (
                        <>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-2">
                              <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-2 rounded-full" 
                                  style={{ width: `${Math.min(100, Number(contributionPct) * 4)}%` }}
                                ></div>
                              </div>
                              <span className="font-bold text-xs text-emerald-800 font-mono">
                                {contributionPct} %
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            {isCommuter ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                🚶‍♂️ Pěšky ({morningSteps.toLocaleString()} kr.)
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                {morningSteps.toLocaleString()} kr.
                              </span>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 text-right font-bold text-[#0082b2]">
                            {student.steps.toLocaleString()} kroků
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-gray-500">
                            {distanceKm} km
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}

                {sortedStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-[#64748B]">
                      V této třídě nejsou žádní žáci. Přidejte je v sekci Administrace.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Challenge Poster Modal */}
      {isPosterOpen && group && challenge && (
        <ChallengePosterModal
          isOpen={isPosterOpen}
          onClose={() => setIsPosterOpen(false)}
          challenge={challenge}
          group={group}
          school={school}
          students={students}
        />
      )}

      {/* School Manager Evaluation Report Modal */}
      {isSchoolReportOpen && group && challenge && (
        <SchoolReportModal
          isOpen={isSchoolReportOpen}
          onClose={() => setIsSchoolReportOpen(false)}
          progress={groupProgress}
          challengeName={challenge.name}
          school={school}
          targetSteps={challenge.targetSteps}
        />
      )}

      {/* Physical Literacy & Scientific Study Modal */}
      {isLiteracyOpen && (
        <PhysicalLiteracyModal
          isOpen={isLiteracyOpen}
          onClose={() => setIsLiteracyOpen(false)}
          classNameTitle={group?.name}
          classAvgSteps={activeStudentsCount > 0 ? Math.round(totalSteps / activeStudentsCount) : 9850}
        />
      )}

    </div>
  );
};
