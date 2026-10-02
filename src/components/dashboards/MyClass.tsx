import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { type Student, type Group, type Challenge, type School } from '../../types';
import { Award, Footprints, Flame, Users } from 'lucide-react';
import { ChallengePosterModal } from '../ChallengePosterModal';

interface MyClassProps {
  students: Student[];
  group?: Group;
  challenge?: Challenge;
  school?: School;
}

export const MyClass: React.FC<MyClassProps> = ({ students, group, challenge, school }) => {
  const [isPosterOpen, setIsPosterOpen] = useState(false);

  // Sort students descending by steps
  const sortedStudents = [...students].sort((a, b) => b.steps - a.steps);

  // Prepare data for the ECharts chart
  const topStudentsForChart = [...sortedStudents].slice(0, 7).reverse();

  const totalSteps = students.reduce((sum, s) => sum + s.steps, 0);
  const totalKm = (totalSteps * 0.0007).toFixed(1);
  const activeStudentsCount = students.filter(s => s.steps > 0).length;
  
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
      data: topStudentsForChart.map((s) => s.name),
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
          borderRadius: [0, 4, 4, 0],
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

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="view-title-container">
          <h2 className="view-title">Moje třída {group ? `– ${group.name}` : ''}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Žebříček jednotlivců, analytika kroků a certifikace třídního týmu
          </p>
        </div>

        {/* Generate Diploma / Poster Button */}
        {group && challenge && (
          <button
            onClick={() => setIsPosterOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Otevřít a vytisknout oficiální diplom třídy z výzvy"
          >
            <Award className="h-4 w-4 text-amber-700" />
            <span>🏆 Diplom & výsledný report třídy</span>
          </button>
        )}
      </div>

      {/* Class Quick KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#007CA6] flex items-center justify-center shrink-0">
            <Footprints className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kroků třídy</div>
            <div className="text-xl font-black text-gray-900 font-mono mt-0.5">
              {totalSteps.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#007CA6] font-semibold">{totalKm} km ušlapáno</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aktivní žáci</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">
              {activeStudentsCount} / {students.length}
            </div>
            <div className="text-[11px] text-gray-500 font-medium">
              {students.length > 0 ? Math.round((activeStudentsCount / students.length) * 100) : 0} % zapojení
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Spálená energie</div>
            <div className="text-xl font-black text-amber-700 font-mono mt-0.5">
              {Math.round(totalSteps * 0.042).toLocaleString()} kcal
            </div>
            <div className="text-[11px] text-gray-500 font-medium">metabolický výdej třídy</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard Chart */}
        <div className="replicated-card">
          <div className="replicated-card-header">
            <span>Srovnání výkonu žáků</span>
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

        {/* Leaderboard List Table */}
        <div className="replicated-card">
          <div className="replicated-card-header">
            <span>Žebříček studentů</span>
          </div>
          <div className="replicated-card-body p-0">
            <table className="replicated-table">
              <thead>
                <tr>
                  <th className="py-2.5 px-4 w-16 text-center">Pozice</th>
                  <th className="py-2.5 px-4">Student</th>
                  <th className="py-2.5 px-4 text-right">Celkem kroků</th>
                  <th className="py-2.5 px-4 text-right">Vzdálenost</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student, index) => {
                  const distanceKm = Math.round((student.steps * 0.0007) * 100) / 100;
                  return (
                    <tr key={student.id}>
                      <td className="py-3 px-4 font-bold text-gray-500 text-center">
                        #{index + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {student.name}
                        {student.isReal && (
                          <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            LIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#0082b2]">
                        {student.steps.toLocaleString()} kroků
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-gray-500">
                        {distanceKm} km
                      </td>
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
    </div>
  );
};
