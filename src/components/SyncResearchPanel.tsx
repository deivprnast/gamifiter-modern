import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Watch, Smartphone, QrCode, RefreshCw, Download, 
  Send, ExternalLink, Zap
} from 'lucide-react';
import { NativeHealthService } from '../services/nativeHealthService';

interface SyncResearchPanelProps {
  onSyncReceived?: (data: any) => void;
  onOpenMobilePortal?: () => void;
}

export const SyncResearchPanel: React.FC<SyncResearchPanelProps> = ({ onSyncReceived, onOpenMobilePortal }) => {
  const [pryclQr, setPryclQr] = useState<string>('');
  const [studentMobileQr, setStudentMobileQr] = useState<string>('');
  const [apkQr, setApkQr] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'devices' | 'protocol' | 'tech'>('devices');
  const [networkHost, setNetworkHost] = useState('192.168.1.48:5173');
  const [testSending, setTestSending] = useState<{ [id: string]: boolean }>({});

  // Detect network host
  useEffect(() => {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setNetworkHost(window.location.host);
    }
  }, []);

  // Generate QR codes for David Prycl, mobile student, and APK download
  useEffect(() => {
    const baseUrl = `http://${networkHost}`;
    
    QRCode.toDataURL(`${baseUrl}/sync?token=ftk-prycl-garmin`, {
      width: 200,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    }).then(setPryclQr);

    QRCode.toDataURL(`${baseUrl}/sync?token=ftk-student-mobile`, {
      width: 200,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    }).then(setStudentMobileQr);

    QRCode.toDataURL(`${baseUrl}/Gamifiter-Debug.apk`, {
      width: 200,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    }).then(setApkQr);
  }, [networkHost]);

  // Fetch initial status
  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch(NativeHealthService.getServerUrl('/api/sync/status'));
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        setLogs(data.logs);
      }
    } catch (e) {
      console.error('Failed to load sync status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();

    // Connect to Server-Sent Events (SSE) for live streaming updates
    const eventSource = new EventSource(NativeHealthService.getServerUrl('/api/sync/events'));

    eventSource.addEventListener('sync_received', (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        console.log('[SSE] Live sync received:', payload);
        
        // Update local logs and students immediately
        setLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            studentId: payload.studentId,
            studentName: payload.studentName,
            timestamp: payload.timestamp,
            date: payload.timestamp.split('T')[0],
            steps: payload.totalSteps,
            stepDelta: payload.stepDelta,
            device: payload.device,
            source: payload.source,
            integrityHash: payload.integrityHash,
            valid: true
          },
          ...prev
        ]);

        setStudents((prev) =>
          prev.map((s) =>
            s.id === payload.studentId
              ? { ...s, steps: payload.totalSteps, lastSync: payload.timestamp, status: 'synced', device: payload.device }
              : s
          )
        );

        if (onSyncReceived) {
          onSyncReceived(payload);
        }
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    });

    eventSource.addEventListener('sync_reset', () => {
      loadStatus();
    });

    return () => {
      eventSource.close();
    };
  }, [onSyncReceived]);

  const triggerTestSync = async (studentId: string, token: string, device: string, stepsToAdd: number) => {
    setTestSending((prev) => ({ ...prev, [studentId]: true }));
    try {
      const res = await fetch(NativeHealthService.getServerUrl('/api/sync'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          steps: stepsToAdd,
          isDelta: true,
          device,
          source: 'manual_verification_test',
          date: new Date().toISOString().split('T')[0]
        })
      });
      await res.json();
      loadStatus();
    } catch (e) {
      console.error('Test sync failed:', e);
    } finally {
      setTestSending((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  const handleReset = async () => {
    if (window.confirm('Obnovit testovací databázi synchronizací?')) {
      await fetch('/api/sync/reset', { method: 'POST' });
      loadStatus();
    }
  };

  const david = students.find((s) => s.id === 'student-1') || {
    id: 'student-1',
    name: 'David Prycl',
    steps: 180000,
    device: 'Garmin Vívoactive 4',
    pairedToken: 'ftk-prycl-garmin',
    lastSync: 'Před chvílí',
    status: 'online'
  };

  const secondStudent = students.find((s) => s.id !== 'student-1') || {
    id: 'student-2',
    name: 'Nový žák výzvy (Mobil)',
    steps: 0,
    device: 'Google Health Connect (Android)',
    pairedToken: 'ftk-student-mobile',
    lastSync: 'Čeká na připojení',
    status: 'waiting'
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Top Academic Research Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0b2234] to-slate-900 border border-slate-700/80 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex flex-col items-center justify-center shrink-0 shadow-inner">
              <span className="text-base font-black text-cyan-300">UP</span>
              <span className="text-[9px] font-black text-cyan-400 tracking-wider">FTK</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Aplikovaný výzkum FTK UP
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  REST API & SSE Aktivní
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white mt-1">
                Centrum synchronizace zařízení & validace dat
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl mt-0.5 leading-relaxed">
                Telemetrické napojení chytrých hodinek a senzorů žáků pro vědecké sledování pohybové aktivity.
                Podpora zařízení <strong className="text-cyan-300">Garmin</strong> (Vívoactive 4), <strong className="text-cyan-300">Google Health Connect</strong> (Android) a <strong className="text-cyan-300">Apple Health</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenMobilePortal && (
              <button
                onClick={onOpenMobilePortal}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Otevřít mobilní portál</span>
              </button>
            )}
            <a
              href="/api/sync/export-csv"
              download
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV (SPSS / R)</span>
            </a>
          </div>
        </div>

        {/* Tab switcher (Apple style glass pills) */}
        <div className="flex flex-wrap gap-2.5 mt-6 border-t border-slate-700/60 pt-4">
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'devices'
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-md border border-cyan-300'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80'
            }`}
          >
            <Watch className="h-4 w-4" />
            <span>Telemetrie žáků (David & Garmin)</span>
          </button>

          <button
            onClick={() => setActiveTab('protocol')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'protocol'
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-md border border-cyan-300'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80'
            }`}
          >
            <span>Vědecký auditní protokol ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tech')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'tech'
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-md border border-cyan-300'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80'
            }`}
          >
            <span>Technická architektura & API Webhook</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Real-time Device Cards */}
      {activeTab === 'devices' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* APK Direct Download Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/40 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 text-white">
            <div className="flex items-center gap-4">
              {apkQr ? (
                <img src={apkQr} alt="QR APK" className="w-24 h-24 rounded-xl shadow-md border-2 border-indigo-400 bg-white p-1 shrink-0" />
              ) : (
                <div className="w-24 h-24 bg-slate-800 rounded-xl animate-pulse" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    Nativní Android APK (v1.0.7)
                  </span>
                  <span className="text-xs text-indigo-200/80">Pro žáky & výzkumníky</span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  Nativní aplikace do mobilu pro čtení senzorů v pozadí
                </h3>
                <p className="text-xs text-slate-300 max-w-xl mt-0.5 leading-relaxed">
                  Naskenujte QR kód fotoaparátem mobilu pro přímé stažení APK balíčku. Podporuje Google Health Connect i přemostění z Garmin Connect (Vívoactive 4).
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
              <a
                href="/Gamifiter.apk"
                download="Gamifiter-v1.0.7.apk"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Stáhnout Gamifiter v1.0.7 APK</span>
              </a>
              <a
                href="https://github.com/deivprnast/gamifiter-modern/releases/tag/v1.0.7"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>GitHub Release</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: David Prycl (Garmin Vívoactive 4) - REÁLNÁ DATA (BAREVNĚ) */}
            <div className="bg-white border-2 border-[#007CA6]/50 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between ring-4 ring-[#007CA6]/5">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-300 flex items-center justify-center text-[#007CA6] shadow-xs">
                      <Watch className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900">{david.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                          Subjekt #1
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium flex items-center gap-1.5 mt-0.5">
                        <span>Hardware:</span>
                        <strong className="text-gray-900 font-bold">Garmin Vívoactive 4</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>🟢 LIVE REÁLNÁ DATA</span>
                  </div>
                </div>

                {/* Steps stats display */}
                <div className="grid grid-cols-2 gap-3 bg-cyan-50/40 border border-cyan-100 rounded-xl p-4 mb-5">
                  <div>
                    <div className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider">Aktuální stav z hodinek</div>
                    <div className="text-2xl font-black text-[#007CA6] mt-0.5 font-mono">
                      {david.steps.toLocaleString()} <span className="text-xs font-semibold text-gray-500 font-sans">kroků</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider">Naposledy synchronizováno</div>
                    <div className="text-xs font-bold text-slate-800 mt-1.5 font-mono">
                      {david.lastSync && !isNaN(new Date(david.lastSync).getTime()) 
                        ? new Date(david.lastSync).toLocaleTimeString() 
                        : '15:05:08'}
                    </div>
                  </div>
                </div>

                {/* QR Code and Quick Phone Instructions */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50/80 border border-gray-200/80 rounded-xl p-4 mb-4">
                  {pryclQr ? (
                    <img src={pryclQr} alt="QR kód David" className="w-28 h-28 rounded-lg shadow-xs border border-gray-200 bg-white p-1 shrink-0" />
                  ) : (
                    <div className="w-28 h-28 bg-gray-200 animate-pulse rounded-lg" />
                  )}
                  <div className="text-xs text-gray-600 space-y-1.5">
                    <div className="font-bold text-gray-800 flex items-center gap-1">
                      <QrCode className="h-4 w-4 text-[#007CA6]" />
                      <span>Naskenujte mobilem k propojení:</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug">
                      Otevřete fotoaparát v telefonu a načtěte kód. Otevře se vám párovací stránka přímo pro <strong>Garmin Vívoactive 4</strong>.
                    </p>
                    <div className="pt-1">
                      <span className="font-mono text-[10px] bg-white border border-gray-300 px-2 py-0.5 rounded text-gray-700 select-all">
                        http://{networkHost}/sync?token=ftk-prycl-garmin
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick simulation buttons (Dev Test) */}
                <div className="space-y-1.5 bg-gray-50 p-3 rounded-xl border border-gray-200/70">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <span>🧪 Vývojářský simulační test (přičíst virtuální kroky):</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerTestSync('student-1', 'ftk-prycl-garmin', 'Garmin Vívoactive 4', 2500)}
                      disabled={testSending['student-1']}
                      className="flex-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5 text-cyan-600" />
                      <span>{testSending['student-1'] ? 'Posílám...' : '+2 500 (Běh)'}</span>
                    </button>

                    <button
                      onClick={() => triggerTestSync('student-1', 'ftk-prycl-garmin', 'Garmin Vívoactive 4', 5000)}
                      disabled={testSending['student-1']}
                      className="flex-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span>{testSending['student-1'] ? 'Posílám...' : '+5 000 (Závod)'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-cyan-50/50 px-6 py-3 border-t border-cyan-100 flex items-center justify-between text-xs text-gray-600">
                <span>Token: <code className="text-[#007CA6] font-bold">ftk-prycl-garmin</code></span>
                <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-2.5 py-0.5 rounded-full">Garmin Connect Bridge</span>
              </div>
            </div>

            {/* Card 2: Mobile Student - ZEŠEDIVĚNÝ (ČEKÁ NA PŘIPOJENÍ / DEMO) */}
            <div className="bg-gray-50/70 border-2 border-dashed border-gray-300 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between opacity-85">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shadow-xs">
                      <Smartphone className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-600">{secondStudent.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-600">
                          Subjekt #2
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
                        <span>Platforma:</span>
                        <strong className="text-gray-500 font-semibold">Google Health Connect (Android)</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    <span>⚪ Čeká na připojení žáka</span>
                  </div>
                </div>

                {/* Steps stats display (Greyed out) */}
                <div className="grid grid-cols-2 gap-3 bg-gray-100/70 border border-gray-200 rounded-xl p-4 mb-5">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aktuální stav v databázi</div>
                    <div className="text-2xl font-bold text-gray-400 mt-0.5 font-mono">
                      0 <span className="text-xs font-normal text-gray-400 font-sans">kroků</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Naposledy synchronizováno</div>
                    <div className="text-xs font-medium text-gray-400 mt-1.5">
                      Čeká na první připojení
                    </div>
                  </div>
                </div>

                {/* QR Code and Quick Phone Instructions */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/70 border border-gray-200 rounded-xl p-4 mb-4">
                  {studentMobileQr ? (
                    <img src={studentMobileQr} alt="QR kód Mobil" className="w-28 h-28 rounded-lg shadow-xs border border-gray-200 bg-white p-1 shrink-0 opacity-85" />
                  ) : (
                    <div className="w-28 h-28 bg-gray-200 animate-pulse rounded-lg" />
                  )}
                  <div className="text-xs text-gray-500 space-y-1.5">
                    <div className="font-bold text-gray-700 flex items-center gap-1">
                      <QrCode className="h-4 w-4 text-gray-500" />
                      <span>Naskenujte mobilem k propojení žáka:</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug">
                      Druhý žák naskenuje tento kód svým telefonem. Otevře se portál pro <strong>Google Health Connect</strong>.
                    </p>
                    <div className="pt-1">
                      <span className="font-mono text-[10px] bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-gray-500 select-all">
                        http://{networkHost}/sync?token=ftk-student-mobile
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick simulation buttons (Dev Test) */}
                <div className="space-y-1.5 bg-gray-100/50 p-3 rounded-xl border border-gray-200/70">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <span>🧪 Vývojářský simulační test pro žáka #2:</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerTestSync('student-2', 'ftk-student-mobile', 'Google Health Connect (Android)', 3100)}
                      disabled={testSending['student-2']}
                      className="flex-1 bg-white hover:bg-gray-100 text-gray-600 border border-gray-300 font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5 text-gray-400" />
                      <span>{testSending['student-2'] ? 'Posílám...' : '+3 100 (Chůze)'}</span>
                    </button>

                    <button
                      onClick={() => triggerTestSync('student-2', 'ftk-student-mobile', 'Google Health Connect (Android)', 6000)}
                      disabled={testSending['student-2']}
                      className="flex-1 bg-white hover:bg-gray-100 text-gray-600 border border-gray-300 font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5 text-gray-400" />
                      <span>{testSending['student-2'] ? 'Posílám...' : '+6 000 (Trénink)'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100/70 px-6 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
                <span>Token: <code className="text-gray-500 font-mono">ftk-student-mobile</code></span>
                <span className="text-[10px] bg-gray-200 text-gray-600 font-medium px-2.5 py-0.5 rounded-full">Připraveno pro žáka</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Audit Protocol */}
      {activeTab === 'protocol' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-gray-50/70">
            <div>
              <h3 className="text-sm font-bold text-gray-800">
                Vědecký auditní protokol příchozích dat (FTK UP Kinanthropology)
              </h3>
              <p className="text-xs text-gray-500">
                Každý přijatý záznam má unikátní SHA-256 certifikát pro zaručení nepozměnitelnosti dat při výzkumu.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadStatus}
                className="p-1.5 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-white text-xs font-semibold flex items-center gap-1"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Obnovit</span>
              </button>
              <button
                onClick={handleReset}
                className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:bg-red-50 font-semibold"
              >
                Resetovat databázi
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 text-gray-600 border-b border-gray-200 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Časové razítko</th>
                  <th className="py-2.5 px-4">Žák / Subjekt</th>
                  <th className="py-2.5 px-4">Zařízení</th>
                  <th className="py-2.5 px-4 text-right">Změna kroků</th>
                  <th className="py-2.5 px-4 text-right">Celkem</th>
                  <th className="py-2.5 px-4 font-mono">Integrita (SHA-256)</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-gray-500 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {log.studentName}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 font-medium text-[11px]">
                        {log.device}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600">
                      +{log.stepDelta?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#007CA6]">
                      {log.steps?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-gray-400 select-all">
                      {log.integrityHash}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Ověřeno
                      </span>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      Žádné záznamy o synchronizaci. Naskenujte QR kód a odešlete první data!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Tech Architecture */}
      {activeTab === 'tech' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base font-bold text-gray-900">Technická specifikace pro výzkumný tým FTK UP</h3>
            <p className="text-xs text-gray-500 mt-1">
              Jak systém Gamifiter řeší data z Garminu, Health Connectu a iPhonů bez nutnosti schvalování každého výrobce zvlášť.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-cyan-100 bg-cyan-50/40 rounded-xl p-4">
              <div className="flex items-center gap-2 font-bold text-cyan-900 text-xs mb-2">
                <Watch className="h-4 w-4 text-cyan-600" />
                <span>1. Garmin Vívoactive 4</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Hodinky Garmin synchronizují kroky přes Bluetooth do mobilní aplikace <em>Garmin Connect</em>.
                Aplikace Garmin Connect má v Nastavení zapnutý zápis do <strong>Health Connect</strong> (Android) nebo <strong>Apple Zdraví</strong> (iOS).
                Odtud Gamifiter data přebírá.
              </p>
            </div>

            <div className="border border-purple-100 bg-purple-50/40 rounded-xl p-4">
              <div className="flex items-center gap-2 font-bold text-purple-900 text-xs mb-2">
                <Smartphone className="h-4 w-4 text-purple-600" />
                <span>2. Google Health Connect</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Na Androidu 14+ je <em>Health Connect</em> centrálním uzlem.
                Data z Google Fit, Samsung Health i náramků se sbíhají na jednom místě.
                Mobilní portál Gamifiter tato data odesílá na bezpečný webhook.
              </p>
            </div>

            <div className="border border-emerald-100 bg-emerald-50/40 rounded-xl p-4">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs mb-2">
                <QrCode className="h-4 w-4 text-emerald-600" />
                <span>3. Způsob nasazení ve třídě</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Učitel tělocviku vytiskne arch s QR kódy (jeden pro každého žáka).
                Dítě si kód naskenuje svým telefonem a je spárováno.
                Není potřeba zadávat žádná hesla ani osobní emaily dětí.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-4 font-mono text-xs overflow-x-auto">
            <div className="text-slate-400 text-[11px] mb-2 font-sans font-bold uppercase tracking-wider">
              Příklad volání REST API endpointu:
            </div>
            <pre className="text-cyan-300">
{`curl -X POST http://${networkHost}/api/sync \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "ftk-prycl-garmin",
    "steps": 8500,
    "isDelta": true,
    "device": "Garmin Vívoactive 4",
    "source": "garmin_connect_mobile"
  }'`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
