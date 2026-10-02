import React from 'react';
import ReactECharts from 'echarts-for-react';
import { getStudents } from '../../services/storage';
import { CheckCircle2 } from 'lucide-react';

export const MyResults: React.FC = () => {
  const students = getStudents();
  const david = students.find(s => s.id === 'student-1' || s.name.includes('David Prycl'));
  const realStepsToday = david ? david.steps : 6464;

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
      <div className="view-title-container flex flex-col gap-1">
        <h2 className="view-title">Moje výsledky</h2>
        <p className="text-xs text-gray-500">
          Osobní telemetrický profil a plnění pohybového doporučení (FTK UP)
        </p>
      </div>

      {/* Distinction Banner: Real vs Fictitious */}
      <div className="bg-sky-50/80 border border-sky-200/80 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-white border border-sky-300 flex items-center justify-center shrink-0 shadow-xs">
          <CheckCircle2 className="h-5 w-5 text-[#007CA6]" />
        </div>
        <div className="text-xs text-sky-950 leading-relaxed">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-sm text-[#007CA6]">Reálná telemetrie aktivní</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              ● Garmin Vívoactive 4
            </span>
          </div>
          <p className="text-sky-900/90 text-xs">
            Váš dnešní reálný stav z hodinek je <strong className="text-[#007CA6] font-bold">{realStepsToday.toLocaleString()} kroků</strong> (zvýrazněn sytě modře). 
            Zbylé sloupce a tabulka jsou zobrazeny <strong className="text-gray-500">šedě jako simulační demo vzor</strong> pro vizualizaci před začátkem dlouhodobého měření třídy.
          </p>
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

