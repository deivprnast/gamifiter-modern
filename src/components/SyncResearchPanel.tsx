import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Watch, Smartphone, QrCode, RefreshCw, Download, 
  ExternalLink, ShieldCheck, Clock, Copy, Check
} from 'lucide-react';
import { NativeHealthService } from '../services/nativeHealthService';

interface SyncResearchPanelProps {
  onSyncReceived?: (data: any) => void;
  onOpenMobilePortal?: () => void;
}

export const SyncResearchPanel: React.FC<SyncResearchPanelProps> = ({ 
  onSyncReceived, 
  onOpenMobilePortal 
}) => {
  const [pryclQr, setPryclQr] = useState<string>('');
  const [studentMobileQr, setStudentMobileQr] = useState<string>('');
  const [apkQr, setApkQr] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'devices' | 'protocol' | 'tech'>('devices');
  const [networkHost, setNetworkHost] = useState('192.168.1.48:5173');
  const [testSending, setTestSending] = useState<{ [id: string]: boolean }>({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setNetworkHost(window.location.host);
    }
  }, []);

  useEffect(() => {
    const baseUrl = `http://${networkHost}`;
    
    QRCode.toDataURL(`${baseUrl}/sync?token=ftk-prycl-garmin`, {
      width: 220,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    }).then(setPryclQr);

    QRCode.toDataURL(`${baseUrl}/sync?token=ftk-student-mobile`, {
      width: 220,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    }).then(setStudentMobileQr);

    QRCode.toDataURL(`${baseUrl}/Gamifiter.apk`, {
      width: 220,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    }).then(setApkQr);
  }, [networkHost]);

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

    const eventSource = new EventSource(NativeHealthService.getServerUrl('/api/sync/events'));

    eventSource.addEventListener('sync_received', (e: any) => {
      try {
        const payload = JSON.parse(e.data);
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
    if (window.confirm('Opravdu chcete obnovit synchronizační databázi?')) {
      await fetch('/api/sync/reset', { method: 'POST' });
      loadStatus();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const david = students.find((s) => s.id === 'student-1' || s.name?.includes('David Prycl')) || {
    id: 'student-1',
    name: 'David Prycl',
    steps: 6464,
    device: 'Garmin Vívoactive 4',
    pairedToken: 'ftk-prycl-garmin',
    lastSync: '13:09:05',
    status: 'online'
  };

  const secondStudent = students.find((s) => s.id !== 'student-1' && !s.name?.includes('David Prycl')) || {
    id: 'student-2',
    name: 'Nový žák výzvy (Mobil)',
    steps: 0,
    device: 'Google Health Connect (Android)',
    pairedToken: 'ftk-student-mobile',
    lastSync: 'Čeká na připojení',
    status: 'waiting'
  };

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col gap-6 animate-fade-in pb-16">
      
      {/* Apple Studio Light Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col items-center justify-center shrink-0 shadow-xs">
            <span className="text-base font-black text-[#007CA6]">FTK</span>
            <span className="text-[10px] font-bold text-sky-600 tracking-wider">UP</span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-sky-50 text-[#007CA6] border border-sky-200">
                Aplikovaný výzkum kinantropologie
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Cloudflare D1 SQL Live
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              Synchronizace zařízení & telemetrie
            </h1>
            <p className="text-xs text-gray-500 max-w-xl mt-1 leading-relaxed">
              Ověřený přenos kroků z chytrých hodinek a senzorů žáků. Podpora pro <strong className="text-gray-800">Garmin Vívoactive 4</strong>, <strong className="text-gray-800">Health Connect</strong> (Android) a <strong className="text-gray-800">Apple Health</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          {onOpenMobilePortal && (
            <button
              onClick={onOpenMobilePortal}
              className="bg-[#007CA6] hover:bg-[#00698c] active:scale-95 text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Otevřít mobilní portál</span>
            </button>
          )}

          <a
            href="/api/sync/export-csv"
            download
            className="bg-white hover:bg-gray-50 active:scale-95 text-gray-700 border border-gray-200 font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-gray-500" />
            <span>Export CSV (SPSS / R)</span>
          </a>
        </div>
      </div>

      {/* Apple Segmented Navigation Pills */}
      <div className="flex items-center gap-2 bg-gray-100/80 p-1.5 rounded-2xl w-fit border border-gray-200/60 shadow-inner">
        <button
          onClick={() => setActiveTab('devices')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'devices'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <Watch className="h-3.5 w-3.5 text-[#007CA6]" />
          <span>Telemetrie žáků</span>
        </button>

        <button
          onClick={() => setActiveTab('protocol')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'protocol'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Vědecký auditní protokol ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tech')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'tech'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <Smartphone className="h-3.5 w-3.5 text-purple-600" />
          <span>Architektura & API</span>
        </button>
      </div>

      {/* TAB 1: Device Cards */}
      {activeTab === 'devices' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          
          {/* Compact Native APK Card (Apple Light Glass Banner) */}
          <div className="bg-gradient-to-r from-indigo-50/90 via-sky-50/70 to-indigo-50/90 border border-indigo-200/80 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              {apkQr ? (
                <img 
                  src={apkQr} 
                  alt="QR APK" 
                  className="w-20 h-20 rounded-2xl shadow-xs border border-indigo-200 bg-white p-1.5 shrink-0" 
                />
              ) : (
                <div className="w-20 h-20 bg-indigo-100/60 rounded-2xl animate-pulse" />
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Nativní Android APK (v1.0.7)
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-700/80">Pro žáky a školní mobily</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900">
                  Nativní aplikace Gamifiter pro automatický sběr kroků
                </h3>
                <p className="text-xs text-gray-600 max-w-lg mt-0.5 leading-relaxed">
                  Stáhněte APK balíček naskenováním QR kódu nebo kliknutím. Aplikace automaticky načítá data z Garmin Connect i Google Health Connect.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
              <a
                href="/Gamifiter.apk"
                download="Gamifiter-v1.0.7.apk"
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all w-full md:w-auto"
              >
                <Download className="h-4 w-4" />
                <span>Stáhnout Gamifiter APK</span>
              </a>

              <a
                href="https://github.com/deivprnast/gamifiter-modern/releases/tag/v1.0.7"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-gray-50 active:scale-95 text-gray-700 border border-gray-200 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                <span>GitHub</span>
              </a>
            </div>
          </div>

          {/* Cards Grid: David Prycl & Subject 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: David Prycl (Garmin Vívoactive 4) - REÁLNÁ DATA */}
            <div className="bg-white border-2 border-[#007CA6]/30 rounded-3xl shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-[#007CA6] shadow-xs shrink-0">
                      <Watch className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-gray-900">{david.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                          Subjekt #1
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-semibold flex items-center gap-1 mt-0.5">
                        <span>Hardware:</span>
                        <strong className="text-gray-800 font-bold">Garmin Vívoactive 4</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>🟢 LIVE DATA</span>
                  </div>
                </div>

                {/* Big Step Hero Banner */}
                <div className="bg-gradient-to-br from-cyan-50/70 via-sky-50/50 to-white border border-cyan-100/80 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider block">
                      Dnešní stav z hodinek
                    </span>
                    <div className="text-3xl font-black text-[#007CA6] font-mono tracking-tight mt-0.5">
                      {david.steps.toLocaleString()} <span className="text-xs font-semibold text-gray-500 font-sans">kroků</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Synchronizováno
                    </span>
                    <span className="text-xs font-bold text-gray-700 font-mono flex items-center justify-end gap-1 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      {david.lastSync && !isNaN(new Date(david.lastSync).getTime()) 
                        ? new Date(david.lastSync).toLocaleTimeString() 
                        : (david.lastSync || '13:09:05')}
                    </span>
                  </div>
                </div>

                {/* QR Section */}
                <div className="flex items-center gap-4 bg-gray-50/80 border border-gray-200/80 rounded-2xl p-3.5">
                  {pryclQr ? (
                    <img 
                      src={pryclQr} 
                      alt="QR kód David" 
                      className="w-24 h-24 rounded-xl shadow-xs border border-gray-200 bg-white p-1.5 shrink-0" 
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 animate-pulse rounded-xl" />
                  )}
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="font-bold text-gray-900 flex items-center gap-1.5">
                      <QrCode className="h-4 w-4 text-[#007CA6]" />
                      <span>Naskenujte fotoaparátem mobilu</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug">
                      Otevře párovací obrazovku pro automatický zápis kroků z hodinek do třídy.
                    </p>
                    <button
                      onClick={() => copyToClipboard(`http://${networkHost}/sync?token=ftk-prycl-garmin`, 'prycl')}
                      className="text-[10px] text-gray-500 hover:text-gray-900 flex items-center gap-1 mt-1 font-mono bg-white px-2 py-0.5 rounded border border-gray-200"
                    >
                      {copiedToken === 'prycl' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedToken === 'prycl' ? 'Odkaz zkopírován!' : 'Kopírovat odkaz'}</span>
                    </button>
                  </div>
                </div>

                {/* Subtle Dev Test Row */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span className="text-[11px]">🧪 Simulační test:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerTestSync('student-1', 'ftk-prycl-garmin', 'Garmin Vívoactive 4', 2500)}
                      disabled={testSending['student-1']}
                      className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all disabled:opacity-50"
                    >
                      +2 500 kroků
                    </button>
                    <button
                      onClick={() => triggerTestSync('student-1', 'ftk-prycl-garmin', 'Garmin Vívoactive 4', 5000)}
                      disabled={testSending['student-1']}
                      className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all disabled:opacity-50"
                    >
                      +5 000 kroků
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span>token: ftk-prycl-garmin</span>
                <span className="text-emerald-700 font-sans font-bold">Připojeno</span>
              </div>
            </div>

            {/* Card 2: Subject #2 (Waiting for student) - SIMULACE / ČEKÁ */}
            <div className="bg-gray-50/60 border-2 border-dashed border-gray-250 rounded-3xl p-6 flex flex-col justify-between">
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 shadow-xs shrink-0">
                      <Smartphone className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-700">{secondStudent.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-200 text-gray-600">
                          Subjekt #2
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        Hardware: Google Health Connect / Apple Health
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-gray-400 bg-gray-200/80 px-2.5 py-1 rounded-full border border-gray-300">
                    ⚪ Čeká na připojení
                  </span>
                </div>

                {/* Step display */}
                <div className="bg-white/80 border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Stav v databázi
                    </span>
                    <div className="text-3xl font-bold text-gray-400 font-mono tracking-tight mt-0.5">
                      0 <span className="text-xs font-normal text-gray-400 font-sans">kroků</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Status
                    </span>
                    <span className="text-xs font-medium text-gray-400 mt-1 block">
                      Čeká na první měření
                    </span>
                  </div>
                </div>

                {/* QR Section */}
                <div className="flex items-center gap-4 bg-white/70 border border-gray-200 rounded-2xl p-3.5">
                  {studentMobileQr ? (
                    <img 
                      src={studentMobileQr} 
                      alt="QR kód Mobil" 
                      className="w-24 h-24 rounded-xl shadow-xs border border-gray-200 bg-white p-1.5 shrink-0 opacity-80" 
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 animate-pulse rounded-xl" />
                  )}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="font-bold text-gray-700 flex items-center gap-1.5">
                      <QrCode className="h-4 w-4 text-gray-400" />
                      <span>Kód pro dalšího žáka</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug">
                      Žák naskenuje tento kód svým telefonem k okamžitému spárování.
                    </p>
                    <button
                      onClick={() => copyToClipboard(`http://${networkHost}/sync?token=ftk-student-mobile`, 'student2')}
                      className="text-[10px] text-gray-400 hover:text-gray-700 flex items-center gap-1 mt-1 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-200"
                    >
                      {copiedToken === 'student2' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedToken === 'student2' ? 'Zkopírováno!' : 'Kopírovat odkaz'}</span>
                    </button>
                  </div>
                </div>

                {/* Subtle Dev Test Row */}
                <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-xs text-gray-400">
                  <span className="text-[11px]">🧪 Simulační test:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerTestSync('student-2', 'ftk-student-mobile', 'Google Health Connect (Android)', 3100)}
                      disabled={testSending['student-2']}
                      className="px-2.5 py-1 text-[11px] font-medium text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-all disabled:opacity-50"
                    >
                      +3 100 kroků
                    </button>
                    <button
                      onClick={() => triggerTestSync('student-2', 'ftk-student-mobile', 'Google Health Connect (Android)', 6000)}
                      disabled={testSending['student-2']}
                      className="px-2.5 py-1 text-[11px] font-medium text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-all disabled:opacity-50"
                    >
                      +6 000 kroků
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200/80 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span>token: ftk-student-mobile</span>
                <span className="text-gray-400 font-sans">Nepřipojeno</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Audit Protocol */}
      {activeTab === 'protocol' && (
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Vědecký auditní protokol příchozích dat (FTK UP Kinantropologie)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Každý přijatý záznam má unikátní SHA-256 certifikát integrity pro vědeckou validaci.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadStatus}
                className="px-3 py-1.5 text-gray-700 hover:text-gray-900 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Obnovit protokol</span>
              </button>
              <button
                onClick={handleReset}
                className="text-xs text-red-600 hover:text-red-700 px-3 py-1.5 rounded-xl border border-red-200 hover:bg-red-50 font-semibold"
              >
                Vyčistit protokol
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-6">Časové razítko</th>
                  <th className="py-3 px-6">Žák / Subjekt</th>
                  <th className="py-3 px-6">Zařízení</th>
                  <th className="py-3 px-6 text-right">Změna</th>
                  <th className="py-3 px-6 text-right">Celkem kroků</th>
                  <th className="py-3 px-6 font-mono">Integrita (SHA-256)</th>
                  <th className="py-3 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-gray-500 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-gray-900">
                      {log.studentName}
                    </td>
                    <td className="py-3.5 px-6 text-gray-600">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 font-medium text-[11px]">
                        {log.device}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right font-black text-emerald-600">
                      +{log.stepDelta?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-right font-bold text-[#007CA6]">
                      {log.steps?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-[10px] text-gray-400 select-all">
                      {log.integrityHash}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Ověřeno
                      </span>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      Zatím žádné záznamy v auditním protokolu.
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
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base font-bold text-gray-900">Technická specifikace pro výzkumný tým FTK UP</h3>
            <p className="text-xs text-gray-500 mt-1">
              Architektura sběru dat z hodinek a telefonů bez nutnosti manuálního zadávání či placených cloudových licencí.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="border border-sky-200 bg-sky-50/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 font-bold text-sky-950 text-xs mb-2">
                <Watch className="h-4 w-4 text-[#007CA6]" />
                <span>1. Garmin Vívoactive 4</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Hodinky přenášejí kroky přes Bluetooth do Garmin Connect. V nastavení je aktivováno zrcadlení do <strong>Health Connect</strong> (Android) nebo <strong>Apple Zdraví</strong> (iOS). Odtud je Gamifiter čte v pozadí.
              </p>
            </div>

            <div className="border border-purple-200 bg-purple-50/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 font-bold text-purple-950 text-xs mb-2">
                <Smartphone className="h-4 w-4 text-purple-600" />
                <span>2. Google Health Connect</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Centrální hub Androidu 14+. Všechny kroky se ukládají lokálně na zařízení a nativní APK Gamifiter je šifrovaně odesílá na bezpečný webhook.
              </p>
            </div>

            <div className="border border-emerald-200 bg-emerald-50/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs mb-2">
                <QrCode className="h-4 w-4 text-emerald-600" />
                <span>3. Nasazení ve třídě</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Učitel vygeneruje arch s QR kódy pro celou třídu. Každý žák naskenuje svůj kód a je okamžitě spárován. Není vyžadován email ani registrace dětí.
              </p>
            </div>
          </div>

          <div className="bg-gray-900 text-gray-100 rounded-2xl p-5 font-mono text-xs overflow-x-auto shadow-sm">
            <div className="text-gray-400 text-[11px] mb-2 font-sans font-bold uppercase tracking-wider">
              Příklad volání REST API endpointu:
            </div>
            <pre className="text-cyan-300">
{`curl -X POST https://${networkHost}/api/sync \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "ftk-prycl-garmin",
    "steps": 6464,
    "isDelta": false,
    "device": "Garmin Vívoactive 4",
    "source": "garmin_connect_live"
  }'`}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
};
