import React from 'react';
import ReactECharts from 'echarts-for-react';

export const MyResults: React.FC = () => {
  // Mock data for last 30 days daily steps
  const dates = [
    '12/11', '12/12', '12/13', '12/14', '12/15', '12/16', '12/17', '12/18', '12/19', '12/20',
    '12/21', '12/22', '12/23', '12/24', '12/25', '12/26', '12/27', '12/28', '12/29', '12/30',
    '12/31', '1/1', '1/2', '1/3', '1/4', '1/5', '1/6', '1/7', '1/8', '1/9'
  ];

  const stepsData = [
    17000, 16200, 13800, 15000, 12000, 16500, 17800, 9500, 14500, 16800,
    19200, 15200, 11800, 17500, 15800, 15500, 7200, 18500, 24000, 23500,
    19200, 5800, 7300, 8800, 5200, 15600, 18000, 2000, 17000, 6200
  ];

  // ECharts Bar Chart config
  const barOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#0f172a', fontFamily: 'var(--font-sans)', fontSize: 11 }
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
      data: dates,
      axisLabel: { color: '#64748B', fontSize: 10 },
      axisLine: { lineStyle: { color: '#e2e8f0' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#64748B', fontSize: 10, formatter: '{value} kroků' },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLine: { show: false }
    },
    series: [
      {
        name: 'Kroky',
        type: 'bar',
        data: stepsData,
        itemStyle: { color: '#0082b2' } // Replicated blue
      },
      {
        name: 'Můj průměr',
        type: 'line',
        data: Array(30).fill(13562),
        symbol: 'none',
        lineStyle: { color: '#8b5cf6', width: 2, type: 'dashed' },
        itemStyle: { color: '#8b5cf6' }
      }
    ]
  };

  // ECharts Gauge config (semicircular progress)
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
          width: 20,
          itemStyle: { color: '#0082b2' }
        },
        axisLine: {
          lineStyle: { width: 20, color: [[1, '#e2e8f0']] }
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
          formatter: '{value}%',
          color: '#1e293b'
        },
        data: [{ value: 73 }]
      }
    ]
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="view-title-container">
        <h2 className="view-title">Moje výsledky</h2>
      </div>

      {/* Main Bar Chart */}
      <div className="replicated-card">
        <div className="replicated-card-header">
          <span>Počet kroků</span>
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
          <div className="replicated-card-header">
            <span>Překonal doporučení / počet zápisů</span>
          </div>
          <div className="replicated-card-body flex flex-col items-center justify-center min-h-[220px]">
            <div style={{ height: '180px', width: '100%' }}>
              <ReactECharts option={gaugeOption} style={{ height: '100%', width: '100%' }} />
            </div>
            <p className="text-xs font-bold text-gray-500 -mt-4">Plnění pohybového doporučení</p>
          </div>
        </div>

        {/* Weekly Stats Table */}
        <div className="replicated-card">
          <div className="replicated-card-header">
            <span>Statistika pro vybrané období</span>
          </div>
          <div className="replicated-card-body p-0">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between bg-slate-50/50">
              <div className="text-xs text-gray-500">
                Průměrně denně: <strong className="text-[#0082b2] text-sm">13 562 kroků</strong>
              </div>
              <div className="text-xs text-gray-500">
                Celkem: <strong className="text-slate-800 text-sm">406 873 kroků</strong>
              </div>
            </div>
            
            <table className="replicated-table">
              <thead>
                <tr>
                  <th className="py-2 px-4">Den v týdnu</th>
                  <th className="py-2 px-4 text-right">Počet kroků</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-4 font-semibold">Pondělí</td>
                  <td className="py-2 px-4 text-right font-bold text-[#0082b2]">11 500 kroků</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold">Úterý</td>
                  <td className="py-2 px-4 text-right font-bold text-[#0082b2]">11 050 kroků</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold">Středa</td>
                  <td className="py-2 px-4 text-right font-bold text-[#0082b2]">14 508 kroků</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold">Čtvrtek</td>
                  <td className="py-2 px-4 text-right font-bold text-[#0082b2]">16 592 kroků</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold">Pátek</td>
                  <td className="py-2 px-4 text-right font-bold text-[#0082b2]">17 251 kroků</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold">Sobota</td>
                  <td className="py-2 px-4 text-right font-bold text-[#0082b2]">12 222 kroků</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold">Neděle</td>
                  <td className="py-2 px-4 text-right font-bold text-[#0082b2]">15 500 kroků</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
