import React from 'react';
import ReactECharts from 'echarts-for-react';
import { type Student } from '../../types';

interface MyClassProps {
  students: Student[];
}

export const MyClass: React.FC<MyClassProps> = ({ students }) => {
  // Sort students descending by steps
  const sortedStudents = [...students].sort((a, b) => b.steps - a.steps);

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
      <div className="view-title-container">
        <h2 className="view-title">Moje třída</h2>
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
                  <th className="py-2 px-4">Pozice</th>
                  <th className="py-2 px-4">Student</th>
                  <th className="py-2 px-4 text-right">Celkem kroků</th>
                  <th className="py-2 px-4 text-right">Vzdálenost</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student, index) => {
                  const distanceKm = Math.round((student.steps * 0.0007) * 100) / 100;
                  return (
                    <tr key={student.id}>
                      <td className="py-3 px-4 font-bold text-gray-500 w-16 text-center">
                        #{index + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {student.name}
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
    </div>
  );
};
