import React, { useState, useEffect } from 'react';
import { type Challenge, type Group, type Student, type ModuleType } from '../types';
import { 
  addChallenge, removeChallenge, 
  addGroup, removeGroup, 
  addStudent, removeStudent, updateStudentSteps, 
  resetStorage, getChallenges, getGroups, getStudents
} from '../services/storage';
import { Plus, Trash2, RotateCcw, AlertTriangle, QrCode, Smartphone, Download } from 'lucide-react';
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

  // Direct edit step states
  const [editingSteps, setEditingSteps] = useState<{ [id: string]: number }>({});

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

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gName || !gTeacher) return;

    addGroup(gName, gTeacher);
    onGroupsUpdate(getGroups());
    
    setGName('');
    setGTeacher('');
    alert('Třída byla úspěšně přidána!');
    window.location.reload();
  };

  const handleDeleteGroup = (id: string) => {
    if (window.confirm('Smazáním třídy smažete i všechny žáky v ní. Pokračovat?')) {
      removeGroup(id);
      window.location.reload();
    }
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName || !activeGroupId) return;

    addStudent(sName, activeGroupId, sSteps);
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

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="view-title-container flex justify-between items-center border-b border-gray-200 pb-3">
        <h2 className="view-title">
          {activeTab === 'challenges' ? 'Správa výzev' : activeTab === 'groups' ? 'Správa školy' : activeTab === 'invitations' ? 'Pozvánka pro žáky & QR kód třídy' : 'Nastavení systému'}
        </h2>
        
        {/* Internal Tabs for navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('challenges')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
              activeTab === 'challenges' 
                ? 'bg-[#007CA6] text-white' 
                : 'text-gray-500 bg-white border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Seznam a tvorba výzev
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'invitations' 
                ? 'bg-emerald-600 text-white' 
                : 'text-gray-500 bg-white border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Pozvánka pro žáky (QR)</span>
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
              activeTab === 'groups' 
                ? 'bg-[#007CA6] text-white' 
                : 'text-gray-500 bg-white border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Správa tříd a studentů
          </button>
          <button
            onClick={() => setActiveTab('reset')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
              activeTab === 'reset' 
                ? 'bg-red-600 text-white' 
                : 'text-gray-500 bg-white border border-gray-200 hover:bg-gray-50'
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
                    <th className="py-2 px-4 w-20 text-center">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        <div>{c.name}</div>
                        <div className="text-[10px] text-gray-400 font-normal line-clamp-1">{c.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {c.moduleType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#0082b2]">
                        {c.targetSteps.toLocaleString()} kroků
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteChallenge(c.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
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
              <button
                onClick={() => handleDeleteGroup(activeGroupId)}
                className="bg-red-600/10 text-red-500 hover:bg-red-600/20 px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/20 flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                <span>Smazat třídu</span>
              </button>
            </div>
            <div className="replicated-card-body p-0">
              <table className="replicated-table">
                <thead>
                  <tr>
                    <th className="py-2 px-4">Žák</th>
                    <th className="py-2 px-4 text-right">Zaznamenané kroky</th>
                    <th className="py-2 px-4 w-32 text-center">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {activeGroupStudents.map((student) => {
                    const isEditing = editingSteps[student.id] !== undefined;
                    const displaySteps = isEditing ? editingSteps[student.id] : student.steps;

                    return (
                      <tr key={student.id}>
                        <td className="py-3 px-4 font-semibold text-gray-800">
                          {student.name}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input 
                            type="number" 
                            value={displaySteps} 
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setEditingSteps({ ...editingSteps, [student.id]: val });
                            }}
                            className={`w-32 text-xs px-2 py-1 bg-white border rounded text-right font-bold ${
                              isEditing ? 'border-[#0082b2] text-[#0082b2]' : 'border-gray-200 text-gray-700'
                            }`}
                          />
                        </td>
                        <td className="py-3 px-4 text-center flex justify-center gap-2">
                          {isEditing && (
                            <button
                              onClick={() => handleSaveStudentSteps(student.id)}
                              className="px-2 py-1 bg-[#0082b2] hover:bg-[#007CA6] text-white text-[10px] font-bold rounded"
                            >
                              Uložit
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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
              {groups.find(g => g.id === activeGroupId)?.name || 'Třída 7. A'}
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Učitel: {groups.find(g => g.id === activeGroupId)?.adminName || 'Mgr. Michal Vorlíček'}
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
    </div>
  );
};
