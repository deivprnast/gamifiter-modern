import React, { useState, useEffect } from 'react';
import { X, Settings, User, Activity, ShieldCheck, RotateCcw, Save, Check } from 'lucide-react';
import { resetStorage } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved
}) => {
  const [adminName, setAdminName] = useState(() => localStorage.getItem('gamifiter_admin_name') || 'David Prycl');
  const [schoolName, setSchoolName] = useState(() => localStorage.getItem('gamifiter_school_name') || 'Fakulta tělesné kultury UPOL');
  const [stepLength, setStepLength] = useState(() => localStorage.getItem('gamifiter_step_length') || '0.70');
  const [dailyTarget, setDailyTarget] = useState(() => localStorage.getItem('gamifiter_daily_target') || '10000');
  const [filterPocketSteps, setFilterPocketSteps] = useState(() => localStorage.getItem('gamifiter_filter_pocket') !== 'false');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAdminName(localStorage.getItem('gamifiter_admin_name') || 'David Prycl');
      setSchoolName(localStorage.getItem('gamifiter_school_name') || 'Fakulta tělesné kultury UPOL');
      setStepLength(localStorage.getItem('gamifiter_step_length') || '0.70');
      setDailyTarget(localStorage.getItem('gamifiter_daily_target') || '10000');
      setFilterPocketSteps(localStorage.getItem('gamifiter_filter_pocket') !== 'false');
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gamifiter_admin_name', adminName.trim() || 'David Prycl');
    localStorage.setItem('gamifiter_school_name', schoolName.trim() || 'Fakulta tělesné kultury UPOL');
    localStorage.setItem('gamifiter_step_length', stepLength);
    localStorage.setItem('gamifiter_daily_target', dailyTarget);
    localStorage.setItem('gamifiter_filter_pocket', filterPocketSteps ? 'true' : 'false');

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onSettingsSaved) onSettingsSaved();
      onClose();
      window.location.reload();
    }, 600);
  };

  const handleResetCache = () => {
    if (window.confirm('Opravdu chcete vyčistit lokální paměť a obnovit výchozí stav Gamifiteru?')) {
      resetStorage();
      localStorage.removeItem('gamifiter_admin_name');
      localStorage.removeItem('gamifiter_school_name');
      localStorage.removeItem('gamifiter_step_length');
      localStorage.removeItem('gamifiter_daily_target');
      window.location.reload();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-slate-50/80"
          style={{ borderBottom: '1px solid #F2F2F7', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl bg-[#007CA6]/10 text-[#007CA6] flex items-center justify-center"
              style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(0, 124, 166, 0.1)', color: '#007CA6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1D1D1F', margin: 0 }}>Nastavení systému Gamifiter</h3>
              <p style={{ fontSize: '12px', color: '#86868B', margin: '2px 0 0 0' }}>Konfigurace superadmina, výzkumu a telemetrie</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F2F2F7', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#636366' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6" style={{ padding: '24px', overflowY: 'auto' }}>
          {/* Section 1: Profil správce */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#86868B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User className="w-3.5 h-3.5 text-[#007CA6]" />
              <span>Profil Superadmina & Organizace</span>
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1D1D1F', marginBottom: '6px' }}>Jméno správce</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  style={{ width: '100%', fontSize: '13px', fontWeight: 600, padding: '10px 14px', border: '1px solid #E5E5EA', borderRadius: '12px', background: '#F9FAFB', outline: 'none' }}
                  placeholder="David Prycl"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1D1D1F', marginBottom: '6px' }}>Škola / Fakulta</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={e => setSchoolName(e.target.value)}
                  style={{ width: '100%', fontSize: '13px', fontWeight: 600, padding: '10px 14px', border: '1px solid #E5E5EA', borderRadius: '12px', background: '#F9FAFB', outline: 'none' }}
                  placeholder="Fakulta tělesné kultury UPOL"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Kinantropologie & výpočet */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#86868B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kinantropologické parametry výpočtu</span>
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1D1D1F', marginBottom: '6px' }}>
                  Průměrná délka kroku (metry)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.4"
                  max="1.2"
                  value={stepLength}
                  onChange={e => setStepLength(e.target.value)}
                  style={{ width: '100%', fontSize: '13px', fontWeight: 600, padding: '10px 14px', border: '1px solid #E5E5EA', borderRadius: '12px', background: '#F9FAFB', outline: 'none' }}
                />
                <span style={{ fontSize: '10px', color: '#86868B', marginTop: '4px', display: 'block' }}>Standard pro žáky 2. stupně ZŠ je 0.70 m</span>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1D1D1F', marginBottom: '6px' }}>
                  Denní doporučený cíl (kroků)
                </label>
                <input
                  type="number"
                  step="500"
                  min="3000"
                  max="30000"
                  value={dailyTarget}
                  onChange={e => setDailyTarget(e.target.value)}
                  style={{ width: '100%', fontSize: '13px', fontWeight: 600, padding: '10px 14px', border: '1px solid #E5E5EA', borderRadius: '12px', background: '#F9FAFB', outline: 'none' }}
                />
                <span style={{ fontSize: '10px', color: '#86868B', marginTop: '4px', display: 'block' }}>Světový standard WHO je 10 000 kroků/den</span>
              </div>
            </div>
          </div>

          {/* Section 3: Telemetrie & senzory */}
          <div style={{ padding: '16px', background: '#F5F5F7', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#1D1D1F', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Garmin & Google Health Connect Telemetrie</span>
            </h4>
            
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filterPocketSteps}
                onChange={e => setFilterPocketSteps(e.target.checked)}
                style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#007CA6' }}
              />
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1D1D1F', display: 'block' }}>
                  Izolovat pouze data přímo z chytrých hodinek (Garmin)
                </span>
                <span style={{ fontSize: '11px', color: '#636366', display: 'block', marginTop: '2px', lineHeight: '1.4' }}>
                  Zabrání duplicitnímu sčítání kroků, pokud má žák hodinky na ruce a zároveň telefon v kapse.
                </span>
              </div>
            </label>

            <div style={{ paddingTop: '10px', marginTop: '10px', borderTop: '1px solid #E5E5EA', fontSize: '11px', color: '#86868B', display: 'flex', justifyContent: 'space-between' }}>
              <span>Cloudflare Edge API:</span>
              <strong style={{ color: '#1D1D1F', fontFamily: 'monospace' }}>gamifiter-modern.dprycl.workers.dev</strong>
            </div>
          </div>

          {/* Section 4: Tovární nastavení */}
          <div style={{ paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <button
              type="button"
              onClick={handleResetCache}
              style={{ background: 'transparent', border: 'none', color: '#FF3B30', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Obnovit tovární stav databáze</span>
            </button>

            <span style={{ fontSize: '11px', color: '#86868B', fontWeight: 600 }}>Verze 1.0.7 (Apple UX)</span>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #F2F2F7' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: '#F2F2F7', color: '#1D1D1F', borderRadius: '9999px', border: 'none', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Zrušit
            </button>
            <button
              type="submit"
              style={{
                backgroundColor: savedSuccess ? '#34C759' : '#0071E3',
                color: '#FFFFFF',
                borderRadius: '9999px',
                border: 'none',
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0, 113, 227, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Uloženo!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Uložit nastavení</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
