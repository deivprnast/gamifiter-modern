import React, { useState, useEffect } from 'react';
import { Watch, Smartphone, CheckCircle, RefreshCw, Send, ShieldCheck, ArrowLeft, Cpu, Download } from 'lucide-react';
import { NativeHealthService } from '../services/nativeHealthService';
import '../MobileSyncPortal.css';

interface MobileSyncPortalProps {
  onBackToApp?: () => void;
}

export const MobileSyncPortal: React.FC<MobileSyncPortalProps> = ({ onBackToApp }) => {
  const [token, setToken] = useState('ftk-prycl-garmin');
  const [studentName, setStudentName] = useState('David Prycl');
  const [device, setDevice] = useState('Garmin Vívoactive 4');
  const [steps, setSteps] = useState(7850);
  const [activityNote, setActivityNote] = useState('Tělesná výchova + odpolední chůze');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const isNative = NativeHealthService.isNative();
  const platform = NativeHealthService.getPlatform();

  // Read URL params if opened via QR code: ?token=ftk-vorlicek-google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setToken(urlToken);
      if (urlToken.includes('vorlicek')) {
        setStudentName('Michal Vorlíček');
        setDevice('Google Health Connect (Android)');
        setSteps(8420);
      } else if (urlToken.includes('prycl')) {
        setStudentName('David Prycl');
        setDevice('Garmin Vívoactive 4');
        setSteps(0);
      }
    }

    // Auto-read on launch if inside native app
    if (NativeHealthService.isNative()) {
      handleAutoReadSteps();
    }
  }, []);

  const handleAutoReadSteps = async () => {
    try {
      await NativeHealthService.requestHealthPermissions();
      const reading = await NativeHealthService.getTodaySteps();
      if (reading.steps > 0) {
        setSteps(reading.steps);
        setActivityNote(`Živý odečet z hodinek Garmin (${reading.source})`);
      } else {
        setActivityNote(reading.source);
      }
    } catch (e: any) {
      console.error(e);
      setActivityNote(`Ověřte povolení Health Connect: ${e?.message || 'Chyba'}`);
    }
  };

  const handleSendSync = async () => {
    setSending(true);
    setError(null);
    setResult(null);

    try {
      const data = await NativeHealthService.syncStepsToServer({
        token,
        steps,
        device,
        isDelta: true,
        metadata: {
          note: activityNote,
          clientUserAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });

      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Nepodařilo se připojit k serveru Gamifiter.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mobile-portal-container">
      {/* Top Mobile Bar */}
      <div className="mobile-portal-header">
        <div className="mobile-portal-brand">
          {onBackToApp && (
            <button 
              onClick={onBackToApp} 
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="mobile-portal-badge">
            FTK
          </div>
          <div>
            <h1 className="mobile-portal-title">GAMIFITER SYNC</h1>
            <p className="mobile-portal-subtitle">Fakulta tělesné kultury UP Olomouc</p>
          </div>
        </div>
        <div className="mobile-portal-status-pill">
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
          {isNative ? `Nativní ${platform.toUpperCase()}` : 'Mobilní portál'}
        </div>
      </div>

      {/* Nativní Android APK banner pokud je otevřeno v prohlížeči */}
      {!isNative && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(99, 102, 241, 0.2))',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '22px' }}>📱</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#fff' }}>Nativní Android aplikace (v1.0.0)</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Pro automatické čtení Garmin & Google Health</div>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4', margin: '0 0 12px 0' }}>
            V prohlížeči můžete zadávat kroky ručně. Pro <strong>automatické propojení na pozadí</strong> si stáhněte fakultní APK aplikaci:
          </p>
          <a
            href="/Gamifiter-Debug.apk"
            download="Gamifiter-v1.0.0.apk"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              boxSizing: 'border-box',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '12px',
              padding: '11px 14px',
              borderRadius: '10px',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            <Download size={16} />
            <span>Stáhnout Gamifiter APK do mobilu (6.1 MB)</span>
          </a>
        </div>
      )}

      {/* Profile Card */}
      <div className="mobile-portal-card">
        <div className="mobile-portal-label-row">
          <span className="mobile-portal-label">Identita výzkumníka / žáka</span>
          <span className="mobile-portal-token-badge">
            {token}
          </span>
        </div>
        <div className="mobile-portal-profile-name">
          Aktivní profil: <span>{studentName}</span>
        </div>

        <div className="mobile-portal-grid">
          <button
            type="button"
            onClick={() => {
              setToken('ftk-prycl-garmin');
              setStudentName('David Prycl');
              setDevice('Garmin Vívoactive 4');
              setSteps(9150);
              setResult(null);
            }}
            className={`mobile-portal-user-btn ${token === 'ftk-prycl-garmin' ? 'active' : ''}`}
          >
            <Watch size={20} color={token === 'ftk-prycl-garmin' ? '#22d3ee' : '#64748b'} />
            <div>
              <div className="mobile-portal-user-btn-name">David Prycl</div>
              <div className="mobile-portal-user-btn-device">Garmin Vívoactive 4</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setToken('ftk-vorlicek-google');
              setStudentName('Michal Vorlíček');
              setDevice('Google Health Connect (Android)');
              setSteps(8420);
              setResult(null);
            }}
            className={`mobile-portal-user-btn ${token === 'ftk-vorlicek-google' ? 'active' : ''}`}
          >
            <Smartphone size={20} color={token === 'ftk-vorlicek-google' ? '#22d3ee' : '#64748b'} />
            <div>
              <div className="mobile-portal-user-btn-name">Michal Vorlíček</div>
              <div className="mobile-portal-user-btn-device">Google Health Connect</div>
            </div>
          </button>
        </div>

        <div className="mobile-portal-trust-badge">
          <ShieldCheck size={16} color="#34d399" />
          <span>Validovaný kinantropologický záznam pro FTK UP</span>
        </div>
      </div>

      {/* Sync Action Form */}
      <div className="mobile-portal-card">
        <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: '0 0 14px 0' }}>
          Odeslat naměřené kroky na tabuli
        </h2>

        <div className="mobile-portal-form-group">
          <div className="mobile-portal-label-row">
            <label className="mobile-portal-label">
              Kroky z hodinek / Google Health
            </label>
            <button
              type="button"
              onClick={handleAutoReadSteps}
              className="mobile-portal-auto-btn"
            >
              <Cpu size={12} />
              <span>Automaticky načíst</span>
            </button>
          </div>
          <div className="mobile-portal-input-wrapper">
            <input
              type="number"
              value={steps}
              onChange={(e) => setSteps(parseInt(e.target.value, 10) || 0)}
              className="mobile-portal-steps-input"
            />
            <span className="mobile-portal-steps-suffix">
              KROKŮ
            </span>
          </div>
        </div>

        <div className="mobile-portal-form-group">
          <label className="mobile-portal-label" style={{ display: 'block', marginBottom: '6px' }}>
            Zařízení
          </label>
          <input
            type="text"
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            className="mobile-portal-text-input"
          />
        </div>

        <div className="mobile-portal-form-group">
          <label className="mobile-portal-label" style={{ display: 'block', marginBottom: '6px' }}>
            Poznámka k aktivitě
          </label>
          <input
            type="text"
            value={activityNote}
            onChange={(e) => setActivityNote(e.target.value)}
            className="mobile-portal-text-input"
          />
        </div>

        <button
          type="button"
          onClick={handleSendSync}
          disabled={sending || steps <= 0}
          className="mobile-portal-submit-btn"
        >
          {sending ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              <span>Odesílám data na cloud...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>Synchronizovat s velkou tabulí</span>
            </>
          )}
        </button>
      </div>

      {/* Success Result View */}
      {result && (
        <div className="mobile-portal-success">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '13px', color: '#34d399', marginBottom: '6px' }}>
            <CheckCircle size={18} />
            <span>Úspěšně doručeno na školní tabuli!</span>
          </div>
          <p style={{ margin: '0 0 8px 0', color: '#e2e8f0', lineHeight: 1.4 }}>
            Pro <strong>{result.student?.name}</strong> bylo přičteno <strong>+{result.stepDelta?.toLocaleString()} kroků</strong>.
            Celkový stav: <strong>{result.student?.steps?.toLocaleString()} kroků</strong>.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '10px' }}>
            <div><span style={{ color: '#94a3b8' }}>Ověřovací kód:</span> <strong style={{ color: '#38bdf8' }}>{result.verificationCode}</strong></div>
            <div><span style={{ color: '#94a3b8' }}>Integrita SHA:</span> <span style={{ color: '#34d399' }}>{result.integrityHash}</span></div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(159, 18, 57, 0.4)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fca5a5', padding: '12px', borderRadius: '12px', fontSize: '12px', marginBottom: '14px' }}>
          Chyba: {error}
        </div>
      )}

      {/* Device connection instructions */}
      <div className="mobile-portal-info-box">
        <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', color: '#cbd5e1', marginBottom: '6px' }}>
          Jak funguje automatické napojení:
        </div>
        <div>
          • <strong>Garmin Vívoactive 4:</strong> V aplikaci Garmin Connect na svém mobilu zapněte sdílení s <em>Google Health Connect</em> (Android) nebo <em>Apple Zdraví</em> (iOS).
        </div>
        <div style={{ marginTop: '4px' }}>
          • <strong>Google Health Connect:</strong> Na Androidu jsou data z Garminu uložena v systému – stačí kliknout na <em>„Synchronizovat s velkou tabulí“</em> a kroky se promítnou do hry!
        </div>
      </div>
    </div>
  );
};
