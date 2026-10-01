import React from 'react';
import ReactECharts from 'echarts-for-react';
import { type Student } from '../types';
import { Award, Zap } from 'lucide-react';

interface LeaderboardProps {
  students: Student[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ students }) => {
  // Sort students descending by steps
  const sortedStudents = [...students].sort((a, b) => b.steps - a.steps);

  // Prepare data for the ECharts chart
  // We want to show top students (up to 7) for a neat layout
  const topStudentsForChart = [...sortedStudents].slice(0, 7).reverse();
  
  const chartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      borderColor: '#334155',
      textStyle: { color: '#F8FAFC', fontFamily: 'var(--font-sans)' },
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#64748B', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1E293B' } },
    },
    yAxis: {
      type: 'category',
      data: topStudentsForChart.map((s) => s.name),
      axisLabel: { color: '#E2E8F0', fontSize: 11, fontWeight: 'bold' },
      axisLine: { lineStyle: { color: '#1E293B' } },
    },
    series: [
      {
        name: 'Kroky',
        type: 'bar',
        data: topStudentsForChart.map((s) => s.steps),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#8B5CF6' }, // Purple
              { offset: 1, color: '#06B6D4' }  // Cyan glow
            ]
          },
          borderRadius: [0, 6, 6, 0],
        },
        label: {
          show: true,
          position: 'right',
          color: '#06B6D4',
          fontWeight: 'bold',
          formatter: (params: any) => params.value.toLocaleString()
        }
      }
    ]
  };

  const getMedalEmoji = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 w-full">
      {/* Horizontal Chart Card */}
      <div className="glass-card flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-[#8B5CF6]" />
          <div>
            <h3 className="text-base font-bold text-white">Grafické srovnání aktivity</h3>
            <p className="text-xs text-[#94A3B8]">Přehled výkonů nejaktivnějších žáků třídy.</p>
          </div>
        </div>
        <div className="flex-1 min-h-[300px] bg-[#070A13]/50 p-2 rounded-xl border border-[#1E293B]">
          {topStudentsForChart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#64748B]">
              Žádná data pro zobrazení
            </div>
          ) : (
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
          )}
        </div>
      </div>

      {/* Grid Leaderboard List */}
      <div className="glass-card flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-[#10B981]" />
          <div>
            <h3 className="text-base font-bold text-white">Žebříček třídy</h3>
            <p className="text-xs text-[#94A3B8]">Pořadí studentů seřazené podle celkového počtu kroků.</p>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B] text-[10px] uppercase tracking-wider text-[#64748B]">
                <th className="py-3 px-2">Pozice</th>
                <th className="py-3 px-3">Student</th>
                <th className="py-3 px-3 text-right">Celkem kroků</th>
                <th className="py-3 px-3 text-right">Ušlá vzdálenost</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student, index) => {
                const medal = getMedalEmoji(index);
                const distanceKm = Math.round((student.steps * 0.0007) * 100) / 100;
                
                return (
                  <tr 
                    key={student.id} 
                    className={`border-b border-[#1E293B]/50 text-sm transition-colors hover:bg-white/5 ${
                      index < 3 ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="py-3 px-2 font-bold text-center w-12">
                      {medal ? (
                        <span className="text-lg">{medal}</span>
                      ) : (
                        <span className="text-[#64748B] text-xs">#{index + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      {student.name}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-[#06B6D4]">
                      {student.steps.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-xs text-[#94A3B8]">
                      {distanceKm} km
                    </td>
                  </tr>
                );
              })}
              {sortedStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-[#64748B]">
                    Tato třída zatím nemá přidané žádné žáky. Vytvořte je v Administraci!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
