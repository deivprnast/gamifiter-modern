import React, { useState, useEffect } from 'react';
import { type Challenge, type Group, type Student, type ModuleType } from '../types';
import { 
  addChallenge, updateChallenge, removeChallenge, 
  addGroup, updateGroup, removeGroup, 
  addStudent, removeStudent, updateStudentSteps, updateStudentDevice,
  resetStorage, getChallenges, getGroups, getStudents
} from '../services/storage';
import { Plus, Trash2, RotateCcw, AlertTriangle, QrCode, Smartphone, Download, Pencil, X, Check } from 'lucide-react';
import QRCode from 'qrcode';

interface AdminPanelProps {
  challenges: Challenge[];
  groups: Group[];
  students: Student[];
  activeGroupId: string;
  initialTab?: 'challenges' | 'groups' | 'reset' | 'invitations';
  
  onChallengesUpdate: (challenges: Challenge[]) => void;
  onGroupsUpdate: (groups: Group[]) => void;
  onStudentsUpdate: (students: Student[]) => void;
  onGroupChange: (id: string) => void;
  onReset: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  challenges,
  groups,
  students,
  activeGroupId,
  initialTab,
  onChallengesUpdate,
  onGroupsUpdate,
  onStudentsUpdate,
  onGroupChange,
  onReset
}) => {
  const [activeTab, setActiveTab] = useState<'challenges' | 'groups' | 'reset' | 'invitations'>('challenges');
  const [classQrUrl, setClassQrUrl] = useState<string>('');

  // Modals for editing
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  // Sync tab with initialTab prop from sidebar clicks
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    QRCode.toDataURL(window.location.origin + '/Gamifiter.apk', { width: 220, margin: 1 })
      .then(url => setClassQrUrl(url))
      .catch(console.error);
  }, []);

  // Challenge Form States
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cType, setCType] = useState<ModuleType>('map');
  const [cTarget, setCTarget] = useState(100000);
  const [cFile, setCFile] = useState('/tour_de_cities.geojson');
  const [cFrom, setCFrom] = useState('2026-06-01');
  const [cTo, setCTo] = useState('2026-07-31');

  // Group Form States
  const [gName, setGName] = useState('');
  const [gTeacher, setGTeacher] = useState('');

  // Student Form States
  const [sName, setSName] = useState('');
  const [sSteps, setSSteps] = useState(0);
  const [sDevice, setSDevice] = useState('Google Fit (Android)');

  // Direct edit step states
  const [editingSteps, setEditingSteps] = useState<{ [id: string]: number }>({});

  const handleDeviceChange = (studentId: string, device: string) => {
    const updated = updateStudentDevice(studentId, device);
    onStudentsUpdate(updated);
  };

  const handleAddChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cFile) return;

    addChallenge({
      name: cName,
      description: cDesc,
      moduleType: cType,
      targetSteps: cTarget,
      filePath: cFile,
      validFrom: cFrom,
      validTo: cTo,
    });

    onChallengesUpdate(getChallenges()); // reload
    
    setCName('');
    setCDesc('');
    alert('Výzva byla úspěšně přidána!');
  };

  const handleDeleteChallenge = (id: string) => {
    if (window.confirm('Opravdu chcete tuto výzvu smazat?')) {
      const remaining = removeChallenge(id);
      onChallengesUpdate(remaining);
    }
  };

  const handleSaveEditChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChallenge) return;

    const updated = updateChallenge(editingChallenge.id, {
      name: editingChallenge.name,
      description: editingChallenge.description,
      moduleType: editingChallenge.moduleType,
      targetSteps: editingChallenge.targetSteps,
      filePath: editingChallenge.filePath,
      validFrom: editingChallenge.validFrom,
      validTo: editingChallenge.validTo
    });

    onChallengesUpdate(updated);
    setEditingChallenge(null);
  };

  const handleSaveEditGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    const updated = updateGroup(editingGroup.id, editingGroup.name, editingGroup.adminName);
    onGroupsUpdate(updated);
    setEditingGroup(null);
  };

  const getFileForModuleType = (type: ModuleType): string => {
    switch (type) {
      case 'map': return '/tour_de_cities.geojson';
      case 'districts': return '/districts.geojson';
      case 'puzzle': return '/krumlov.jpg';
      case 'pixelate': return '/dna.jpg';
      case 'network': return '/dataset.json';
      default: return '/tour_de_cities.geojson';
    }
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gName || !gTeacher) return;

    const newG = addGroup(gName, gTeacher);
    const updated = getGroups();
    onGroupsUpdate(updated);
    onGroupChange(newG.id);
    
    setGName('');
    setGTeacher('');
  };

  const handleDeleteGroup = (id: string) => {
    if (window.confirm('Smazáním třídy smažete i všechny žáky v ní. Pokračovat?')) {
      const remaining = removeGroup(id);
      onGroupsUpdate(remaining);
      if (remaining.length > 0) {
        onGroupChange(remaining[0].id);
      }
    }
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName || !activeGroupId) return;

    addStudent(sName, activeGroupId, sSteps, sDevice);
    onStudentsUpdate(getStudents());
    
    setSName('');
    setSSteps(0);
    alert('Žák byl úspěšně přidán do třídy!');
  };

  const handleDeleteStudent = (id: string) => {
    if (window.confirm('Smazat žáka z výzvy?')) {
      const updated = removeStudent(id);
      onStudentsUpdate(updated);
    }
  };

  const handleSaveStudentSteps = (id: string) => {
    const steps = editingSteps[id];
    if (steps === undefined) return;
    const updated = updateStudentSteps(id, steps);
    onStudentsUpdate(updated);
    
    const copy = { ...editingSteps };
    delete copy[id];
    setEditingSteps(copy);
    alert('Kroky byly úspěšně uloženy.');
  };

  const handleTypeChange = (type: ModuleType) => {
    setCType(type);
    switch (type) {
      case 'map':
        setCFile('/tour_de_cities.geojson');
        break;
      case 'districts':
        setCFile('/districts.geojson');
        break;
      case 'puzzle':
        setCFile('/krumlov.jpg');
        break;
      case 'pixelate':
        setCFile('/dna.jpg');
        break;
      case 'network':
        setCFile('/dataset.json');
        break;
    }
  };

  const activeGroupStudents = students.filter(s => s.groupId === activeGroupId);

  const handleSwitchTab = (tab: 'challenges' | 'groups' | 'reset' | 'invitations') => {
    setActiveTab(tab);
    const routeMap: Record<string, string> = {
      challenges: 'admin-challenges',
      groups: 'admin-school',
      invitations: 'admin-invitations',
      reset: 'admin-reset'
    };
    window.location.hash = `#/${routeMap[tab]}`;
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/80">
        <div>
          <h2 className="view-title">
            {activeTab === 'challenges' ? 'Správa výzev' : activeTab === 'groups' ? 'Správa školy a tříd' : activeTab === 'invitations' ? 'Pozvánka pro žáky & QR kód třídy' : 'Nastavení systému'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Administrace pohybových výzev, třídních kolektivů a registrace studentů
          </p>
        </div>
        
        {/* Apple Segmented Control */}
        <div className="bg-gray-100/90 p-1 rounded-xl border border-gray-200/60 inline-flex items-center gap-1 self-start sm:self-auto shrink-0">
          <button
            onClick={() => handleSwitchTab('challenges')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'challenges' 
                ? 'bg-white text-gray-900 shadow-xs' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Seznam a tvorba výzev
          </button>
          <button
            onClick={() => handleSwitchTab('invitations')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'invitations' 
                ? 'bg-white text-emerald-800 shadow-xs' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <QrCode className="h-3.5 w-3.5 text-emerald-600" />
            <span>Pozvánka pro žáky (QR)</span>
          </button>
          <button
            onClick={() => handleSwitchTab('groups')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'groups' 
                ? 'bg-white text-gray-900 shadow-xs' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Správa tříd a studentů
          </button>
          <button
            onClick={() => handleSwitchTab('reset')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'reset' 
                ? 'bg-white text-red-600 shadow-xs font-bold' 
                : 'text-gray-500 hover:text-red-600'
            }`}
          >
            Obnova databáze
          </button>
        </div>
      </div>

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Challenge Form */}
          <div className="replicated-card lg:col-span-1">
            <div className="replicated-card-header">
              <span>Nová výzva</span>
            </div>
            <div className="replicated-card-body">
              <form onSubmit={handleAddChallenge} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500">Název výzvy</label>
                  <input 
                    type="text" 
                    value={cName} 
                    onChange={e => setCName(e.target.value)} 
                    required 
                    placeholder="Např. Cesta na Olymp" 
                    className="replicated-input"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500">Popis</label>
                  <textarea 
                    value={cDesc} 
                    onChange={e => setCDesc(e.target.value)} 
                    rows={3}
                    placeholder="Zadejte stručné informace pro studenty..." 
                    className="replicated-input resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">Typ modulu</label>
                    <select 
                      value={cType} 
                      onChange={e => handleTypeChange(e.target.value as ModuleType)}
                      className="replicated-input"
                    >
                      <option value="map">Trasa (Map)</option>
                      <option value="districts">Území (Districts)</option>
                      <option value="puzzle">Odkrývání (Puzzle)</option>
                      <option value="pixelate">Zaostřování (Pixelate)</option>
                      <option value="network">Síťování (Network)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">Kroky celkem</label>
                    <input 
                      type="number" 
                      value={cTarget} 
                      onChange={e => setCTarget(parseInt(e.target.value) || 1000)} 
                      required 
                      min={1000}
                      className="replicated-input"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500">Datový soubor (GeoJSON/Foto)</label>
                  <input 
                    type="text" 
                    value={cFile} 
                    onChange={e => setCFile(e.target.value)} 
                    required 
                    className="replicated-input font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">Od</label>
                    <input 
                      type="date" 
                      value={cFrom} 
                      onChange={e => setCFrom(e.target.value)} 
                      required 
                      className="replicated-input"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">Do</label>
                    <input 
                      type="date" 
                      value={cTo} 
                      onChange={e => setCTo(e.target.value)} 
                      required 
                      className="replicated-input"
                    />
                  </div>
                </div>

                <button type="submit" className="replicated-button w-full justify-center">
                  <Plus className="h-4 w-4" />
                  <span>Přidat výzvu</span>
                </button>
              </form>
            </div>
          </div>

          {/* List of Challenges */}
          <div className="replicated-card lg:col-span-2">
            <div className="replicated-card-header">
              <span>Seznam zadaných výzev</span>
            </div>
            <div className="replicated-card-body p-0">
              <table className="replicated-table">
                <thead>
                  <tr>
                    <th className="py-2 px-4">Výzva</th>
                    <th className="py-2 px-4">Hra</th>
                    <th className="py-2 px-4 text-right">Cílové kroky</th>
                    <th className="py-2 px-4 w-24 text-center">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.map((c) => {
                    const badgeStyles: Record<string, string> = {
                      map: 'bg-sky-50 text-sky-700 border-sky-200/80',
                      districts: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
                      puzzle: 'bg-amber-50 text-amber-700 border-amber-200/80',
                      pixelate: 'bg-purple-50 text-purple-700 border-purple-200/80',
                      network: 'bg-rose-50 text-rose-700 border-rose-200/80'
                    };
                    const badgeClass = badgeStyles[c.moduleType] || 'bg-slate-50 text-slate-700 border-slate-200';

                    return (
                      <tr key={c.id}>
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          <div>{c.name}</div>
                          <div className="text-[11px] text-gray-400 font-normal line-clamp-1 mt-0.5">{c.description}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${badgeClass}`}>
                            {c.moduleType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#007CA6]">
                          {c.targetSteps.toLocaleString()} <span className="text-xs font-normal text-gray-400">kroků</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingChallenge({ ...c })}
                              className="text-gray-400 hover:text-[#007CA6] p-1.5 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer"
                              title="Upravit parametry výzvy"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteChallenge(c.id)}
                              className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Smazat výzvu"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Groups & Students Tab */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Create Group */}
            <div className="replicated-card">
              <div className="replicated-card-header">
                <span>Nová třída</span>
              </div>
              <div className="replicated-card-body">
                <form onSubmit={handleAddGroup} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">Název třídy</label>
                    <input 
                      type="text" 
                      value={gName} 
                      onChange={e => setGName(e.target.value)} 
                      required 
                      placeholder="Např. 8.A" 
                      className="replicated-input"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">Třídní učitel</label>
                    <input 
                      type="text" 
                      value={gTeacher} 
                      onChange={e => setGTeacher(e.target.value)} 
                      required 
                      placeholder="Jméno učitele" 
                      className="replicated-input"
                    />
                  </div>
                  <button type="submit" className="replicated-button w-full justify-center">
                    <Plus className="h-4 w-4" />
                    <span>Uložit třídu</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Add Student */}
            <div className="replicated-card">
              <div className="replicated-card-header">
                <span>Zapsat žáka</span>
              </div>
              <div className="replicated-card-body">
                <form onSubmit={handleAddStudent} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">Třída</label>
                    <select 
                      value={activeGroupId} 
                      onChange={e => onGroupChange(e.target.value)}
                      className="replicated-input"
                    >
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">Jméno a příjmení</label>
                    <input 
                      type="text" 
                      value={sName} 
                      onChange={e => setSName(e.target.value)} 
                      required 
                      placeholder="Jméno žáka" 
                      className="replicated-input"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">Výchozí kroky</label>
                    <input 
                      type="number" 
                      value={sSteps} 
                      onChange={e => setSSteps(parseInt(e.target.value) || 0)} 
                      min={0}
                      className="replicated-input"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">Měřicí zařízení žáka</label>
                    <select 
                      value={sDevice} 
                      onChange={e => setSDevice(e.target.value)}
                      className="replicated-input"
                    >
                      <option value="Google Fit (Android)">🔵 Google Fit / Health Connect (Android)</option>
                      <option value="Garmin Vívoactive 4">⌚ Garmin Vívoactive / Connect</option>
                      <option value="Apple Zdraví (iOS)">🍏 Apple Zdraví / Watch (iOS)</option>
                      <option value="Telefon v kapse">📱 Pouze telefon v kapse (Krokoměr)</option>
                    </select>
                  </div>
                  <button type="submit" className="replicated-button w-full justify-center">
                    <Plus className="h-4 w-4" />
                    <span>Uložit žáka</span>
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Students List */}
          <div className="replicated-card lg:col-span-2">
            <div className="replicated-card-header flex justify-between items-center">
              <span>Seznam studentů ve třídě</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const currentG = groups.find(g => g.id === activeGroupId);
                    if (currentG) setEditingGroup({ ...currentG });
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-gray-200/60"
                  title="Upravit název třídy nebo jméno učitele"
                >
                  <Pencil className="h-3 w-3 text-gray-500" />
                  <span>Upravit třídu</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteGroup(activeGroupId)}
                  className="bg-red-600/10 text-red-500 hover:bg-red-600/20 px-2.5 py-1 rounded-lg text-xs font-bold border border-red-500/20 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Smazat třídu a její studenty"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Smazat třídu</span>
                </button>
              </div>
            </div>
            <div className="replicated-card-body p-0">
              <table className="replicated-table">
                <thead>
                  <tr>
                    <th className="py-2 px-4">Žák</th>
                    <th className="py-2 px-4">Hardware / Propojení</th>
                    <th className="py-2 px-4 text-right">Zaznamenané kroky</th>
                    <th className="py-2 px-4 w-28 text-center">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {activeGroupStudents.map((student) => {
                    const isEditing = editingSteps[student.id] !== undefined;
                    const displaySteps = isEditing ? editingSteps[student.id] : student.steps;

                    return (
                      <tr key={student.id}>
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          {student.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={student.device || 'Google Fit (Android)'}
                            onChange={(e) => handleDeviceChange(student.id, e.target.value)}
                            className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-800 outline-none focus:border-[#007CA6] cursor-pointer"
                          >
                            <option value="Google Fit (Android)">🔵 Google Fit (Android)</option>
                            <option value="Garmin Vívoactive 4">⌚ Garmin Vívoactive</option>
                            <option value="Apple Zdraví (iOS)">🍏 Apple Zdraví</option>
                            <option value="Telefon v kapse">📱 Telefon v kapse</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <input 
                            type="number" 
                            value={displaySteps} 
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setEditingSteps({ ...editingSteps, [student.id]: val });
                            }}
                            className={`w-32 text-xs px-3 py-1.5 rounded-xl border text-right font-bold transition-all outline-none ${
                              isEditing 
                                ? 'bg-cyan-50/50 border-[#007CA6] text-[#007CA6] ring-2 ring-[#007CA6]/20' 
                                : 'bg-gray-50 border-gray-200 text-gray-800 focus:bg-white focus:border-[#007CA6]'
                            }`}
                          />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isEditing && (
                              <button
                                onClick={() => handleSaveStudentSteps(student.id)}
                                className="px-2.5 py-1 bg-[#007CA6] hover:bg-[#006588] text-white text-[11px] font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                              >
                                Uložit
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Smazat žáka"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {activeGroupStudents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-xs text-[#64748B]">
                        V této třídě nejsou žádní žáci. Zapište je v levém formuláři.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Invitations & QR Tab */}
      {activeTab === 'invitations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Card: Třídní QR kód a odkaz */}
          <div className="replicated-card lg:col-span-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col items-center p-6 text-center">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-3">
              Kód třídy pro žáky
            </span>
            <div className="text-2xl font-black text-gray-900 mb-1">
              {groups.find(g => g.id === activeGroupId)?.name || 'Třída 8. A (FTK UP)'}
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Učitel: {groups.find(g => g.id === activeGroupId)?.adminName || 'David Prycl'}
            </p>

            <div className="p-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl mb-4">
              {classQrUrl ? (
                <img src={classQrUrl} alt="QR kód třídy" className="w-48 h-48 rounded-xl shadow-sm" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-xs">
                  Generuji QR kód...
                </div>
              )}
            </div>

            <div className="bg-slate-900 text-cyan-400 font-mono text-sm px-4 py-2 rounded-xl font-bold mb-4 w-full">
              PIN TŘÍDY: 7A-FTK
            </div>

            <a
              href="/Gamifiter.apk"
              download="Gamifiter.apk"
              className="replicated-button bg-[#007CA6] hover:bg-[#006588] text-white w-full justify-center text-xs py-2.5 font-bold"
            >
              <Download className="h-4 w-4" />
              <span>Stáhnout instalační APK pro žáky</span>
            </a>
          </div>

          {/* Card: Jak to funguje pro učitele a žáky */}
          <div className="replicated-card lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-emerald-600" />
                <span>Jak zapojit žáky a spustit výzvu krok za krokem</span>
              </h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                Aplikace je navržena tak, aby učitel na velké obrazovce řídil výzvu a žáci na mobilech přispívali svými reálnými kroky.
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-blue-900">Učitel založí výzvu (záložka „Seznam a tvorba výzev“)</h4>
                    <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                      Zadáte název (např. <em>Krkonošská stezka 7.A</em>), cíl v krocích (např. 500 000 kroků), termín od–do a vyberete herní modul (Mapa, Puzzle, Okresy).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">Promítnete QR kód ve třídě na interaktivní tabuli</h4>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                      Žáci si namíří fotoaparát mobilu na QR kód, stáhnou aplikaci Gamifiter a povolí přístup k počtu kroků (Google Health Connect / Garmin).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-purple-50/70 border border-purple-100 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-purple-900">Žáci klepnou na „Synchronizovat s velkou tabulí“</h4>
                    <p className="text-[11px] text-purple-700 mt-0.5 leading-relaxed">
                      Žák vidí čistou mobilní aplikaci jen se svými kroky a pořadím v 7. A. Každé odeslání okamžitě posouvá celou třídu po mapě dopředu na velké tabuli ve třídě!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Aktuálně zapsáno v třídě: <strong>{activeGroupStudents.length} žáků</strong></span>
              <button
                onClick={() => setActiveTab('challenges')}
                className="text-emerald-700 font-bold hover:underline"
              >
                Přejít na tvorbu výzev →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset System Tab */}
      {activeTab === 'reset' && (
        <div className="replicated-card max-w-xl mx-auto my-10">
          <div className="replicated-card-header bg-red-600">
            <span>Obnovení databáze (Tovární stav)</span>
          </div>
          <div className="replicated-card-body flex flex-col items-center justify-center text-center p-8 gap-4">
            <AlertTriangle className="h-14 w-14 text-red-600" />
            <h3 className="text-base font-bold text-gray-800">Upozornění</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Tato akce vymaže veškeré přidané výzvy, zadané třídy, registrované žáky a zapsané kroky z vašeho lokálního úložiště a nahradí je výchozí sadou testovacích dat. Tato akce je nevratná.
            </p>
            <button
              onClick={() => {
                if (window.confirm('Skutečně chcete smazat všechna data a obnovit výchozí stav?')) {
                  resetStorage();
                  onReset();
                  setActiveTab('challenges');
                }
              }}
              className="replicated-button bg-red-600 hover:bg-red-700 font-bold"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Vymazat a obnovit výchozí stav</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Challenge Modal (Apple UX Dialog) */}
      {editingChallenge && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/80 max-w-lg w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#007CA6]/10 text-[#007CA6] flex items-center justify-center">
                  <Pencil className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Upravit výzvu</h3>
                  <p className="text-xs text-gray-500">Úprava cílů, termínů a herních parametrů výzvy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingChallenge(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditChallenge} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-600">Název výzvy</label>
                <input
                  type="text"
                  value={editingChallenge.name}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, name: e.target.value })}
                  required
                  className="replicated-input"
                  placeholder="Např. Tour de Europe"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-600">Popis</label>
                <textarea
                  value={editingChallenge.description}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, description: e.target.value })}
                  rows={2}
                  className="replicated-input resize-none"
                  placeholder="Popis výzvy pro žáky a učitele..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600">Typ modulu</label>
                  <select
                    value={editingChallenge.moduleType}
                    onChange={(e) => {
                      const mod = e.target.value as ModuleType;
                      setEditingChallenge({
                        ...editingChallenge,
                        moduleType: mod,
                        filePath: getFileForModuleType(mod)
                      });
                    }}
                    className="replicated-input"
                  >
                    <option value="map">Trasa (Map)</option>
                    <option value="districts">Území (Districts)</option>
                    <option value="puzzle">Odkrývání (Puzzle)</option>
                    <option value="pixelate">Zaostřování (Pixelate)</option>
                    <option value="network">Síťování (Network)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600">Cílové kroky</label>
                  <input
                    type="number"
                    min={1000}
                    value={editingChallenge.targetSteps}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, targetSteps: parseInt(e.target.value) || 1000 })}
                    required
                    className="replicated-input"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-600">Datový soubor (GeoJSON / Foto)</label>
                <input
                  type="text"
                  value={editingChallenge.filePath}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, filePath: e.target.value })}
                  required
                  className="replicated-input font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600">Platnost od</label>
                  <input
                    type="date"
                    value={editingChallenge.validFrom}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, validFrom: e.target.value })}
                    required
                    className="replicated-input"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600">Platnost do</label>
                  <input
                    type="date"
                    value={editingChallenge.validTo}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, validTo: e.target.value })}
                    required
                    className="replicated-input"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingChallenge(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="replicated-button flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Uložit změny</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Group Modal (Apple UX Dialog) */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/80 max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#007CA6]/10 text-[#007CA6] flex items-center justify-center">
                  <Pencil className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Upravit třídu</h3>
                  <p className="text-xs text-gray-500">Změna názvu třídy nebo jména učitele</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingGroup(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditGroup} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-600">Název třídy</label>
                <input
                  type="text"
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  required
                  className="replicated-input"
                  placeholder="Např. 8.A"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-600">Třídní učitel</label>
                <input
                  type="text"
                  value={editingGroup.adminName}
                  onChange={(e) => setEditingGroup({ ...editingGroup, adminName: e.target.value })}
                  required
                  className="replicated-input"
                  placeholder="Jméno a příjmení učitele"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="replicated-button flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Uložit změny</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
