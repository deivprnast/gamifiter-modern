import React, { useState } from 'react';
import { type Group, type Student, type Challenge, type School } from '../../types';
import { Award, Building2, Footprints, Users, Compass, FileText } from 'lucide-react';
import { ChallengePosterModal } from '../ChallengePosterModal';
import { SchoolReportModal } from '../SchoolReportModal';

interface MySchoolProps {
  groups: Group[];
  students: Student[];
  schools?: School[];
  activeSchoolId?: string;
  challenge: Challenge | undefined;
  onSchoolChange?: (id: string) => void;
}

export const MySchool: React.FC<MySchoolProps> = ({ 
  groups, 
  students, 
  schools = [], 
  activeSchoolId, 
  challenge,
  onSchoolChange 
}) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    activeSchoolId || schools[0]?.id || 'school-1'
  );

  // Selected school
  const currentSchool = schools.find(s => s.id === selectedSchoolId) || schools[0];

  // Modals state
  const [posterGroup, setPosterGroup] = useState<Group | null>(null);
  const [isSchoolReportOpen, setIsSchoolReportOpen] = useState(false);

  // Filter groups for selected school (or all if no match)
  const schoolGroups = groups.filter(g => !g.schoolId || g.schoolId === selectedSchoolId);
  const displayGroups = schoolGroups.length > 0 ? schoolGroups : groups;

  // Calculate standings for each group
  const standings = displayGroups.map((g) => {
    const groupStudents = students.filter((s) => s.groupId === g.id);
    const totalSteps = groupStudents.reduce((sum, s) => sum + s.steps, 0);
    const distanceKm = Math.round((totalSteps * 0.0007) * 100) / 100;
    const progressPercent = challenge 
      ? Math.min(100, Math.round((totalSteps / challenge.targetSteps) * 100))
      : 0;

    const commuters = groupStudents.filter(s => (s.morningSteps || Math.round(s.steps * 0.28)) >= 1200);
    const commutePct = groupStudents.length > 0 ? Math.round((commuters.length / groupStudents.length) * 100) : 80;

    return {
      group: g,
      id: g.id,
      name: g.name,
      adminName: g.adminName,
      activeUsers: groupStudents.filter((s) => s.steps > 0).length,
      totalStudents: groupStudents.length,
      totalSteps,
      distanceKm,
      progressPercent,
      commutePct
    };
  }).sort((a, b) => b.totalSteps - a.totalSteps);

  const schoolTotalSteps = standings.reduce((sum, s) => sum + s.totalSteps, 0);
  const schoolTotalKm = (schoolTotalSteps * 0.0007).toFixed(1);
  const schoolTotalStudents = standings.reduce((sum, s) => sum + s.totalStudents, 0);
  const schoolAvgCommute = standings.length > 0 
    ? Math.round(standings.reduce((sum, s) => sum + s.commutePct, 0) / standings.length)
    : 82;

  const handleSchoolSelect = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    if (onSchoolChange) onSchoolChange(schoolId);
  };

  const schoolProgressSummary = {
    groupId: currentSchool?.id || 'school-summary',
    groupName: currentSchool?.name || 'Celá škola',
    adminName: currentSchool?.adminEmail || 'Ředitelství školy',
    totalSteps: schoolTotalSteps,
    totalDistanceKm: Number(schoolTotalKm),
    activeUsers: schoolTotalStudents,
    progressPercent: challenge ? Math.min(100, Math.round((schoolTotalSteps / (challenge.targetSteps * Math.max(1, standings.length))) * 100)) : 0,
    activeCommutePercent: schoolAvgCommute,
    streakDays: 8
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="view-title-container">
          <h2 className="view-title">Moje škola</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Porovnání třídních kolektivů v rámci školy, vyhodnocení aktivní cesty do školy a manažerský report
          </p>
        </div>

        {/* Right Actions: School Switcher & School Report Button */}
        <div className="flex flex-wrap items-center gap-2">
          {schools.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-gray-200/80 rounded-2xl px-3.5 py-2 shadow-xs">
              <Building2 className="h-4 w-4 text-[#007CA6]" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Škola:</span>
              <select
                value={selectedSchoolId}
                onChange={(e) => handleSchoolSelect(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer pr-2"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.city})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setIsSchoolReportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold text-xs shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Generovat oficiální souhrnný manažerský report pro ředitele a ČŠI"
          >
            <FileText className="h-4 w-4 text-blue-600" />
            <span>📄 Manažerský report školy</span>
          </button>
        </div>
      </div>

      {/* School Headline KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#007CA6] flex items-center justify-center shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Vybraná škola</div>
            <div className="text-sm font-black text-gray-900 mt-0.5 truncate max-w-[150px]">{currentSchool?.name || 'ZŠ'}</div>
            <div className="text-[11px] text-[#007CA6] font-semibold">{currentSchool?.code} • {currentSchool?.city}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Footprints className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Celkem za školu</div>
            <div className="text-xl font-black text-gray-900 font-mono mt-0.5">
              {schoolTotalSteps.toLocaleString()} <span className="text-xs font-medium text-gray-400">kroků</span>
            </div>
            <div className="text-[11px] text-indigo-700 font-bold">{schoolTotalKm} km zdoláno</div>
          </div>
        </div>

        {/* Active Morning Commute */}
        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs flex items-center gap-4 bg-gradient-to-br from-white to-amber-50/40">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <span>Pěšky do školy</span>
              <span className="text-[9px] bg-amber-200/70 text-amber-900 px-1 py-0.2 rounded font-bold">+38 %</span>
            </div>
            <div className="text-xl font-black text-amber-900 font-mono mt-0.5">
              {schoolAvgCommute} % žáků
            </div>
            <div className="text-[11px] text-amber-700 font-medium">chůze před 8:00 ráno</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Zapojení žáci</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">
              {schoolTotalStudents} žáků
            </div>
            <div className="text-[11px] text-gray-500 font-medium">v {standings.length} třídních kolektivech</div>
          </div>
        </div>
      </div>

      <div className="replicated-card">
        <div className="replicated-card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Pořadí tříd školy: {currentSchool?.name}</span>
          </div>
          {challenge && (
            <span className="text-xs font-semibold text-[#007CA6] bg-[#007CA6]/10 px-2.5 py-0.5 rounded-full">
              Výzva: {challenge.name}
            </span>
          )}
        </div>
        <div className="replicated-card-body p-0">
          <table className="replicated-table">
            <thead>
              <tr>
                <th className="py-2.5 px-4 w-16 text-center">Pořadí</th>
                <th className="py-2.5 px-4">Třída</th>
                <th className="py-2.5 px-4">Učitel</th>
                <th className="py-2.5 px-4 text-center">Aktivní žáci</th>
                <th className="py-2.5 px-4 text-center">Pěšky do školy</th>
                <th className="py-2.5 px-4 text-right">Celkem kroků</th>
                <th className="py-2.5 px-4 text-right">Vzdálenost</th>
                <th className="py-2.5 px-4 w-36">Pokrok</th>
                <th className="py-2.5 px-4 w-28 text-center">Diplom</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => (
                <tr key={team.id}>
                  <td className="py-3 px-4 font-bold text-gray-500 text-center">
                    #{index + 1}
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-800">
                    {team.name}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {team.adminName}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600">
                    {team.activeUsers} / {team.totalStudents}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      🚶‍♂️ {team.commutePct} %
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#0082b2]">
                    {team.totalSteps.toLocaleString()} kroků
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {team.distanceKm} km
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden border border-gray-100">
                        <div 
                          className="bg-[#0082b2] h-2 rounded-full transition-all" 
                          style={{ width: `${team.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-600 w-8">{team.progressPercent}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setPosterGroup(team.group)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                      title="Zobrazit a vytisknout diplom z výzvy"
                    >
                      <Award className="h-3.5 w-3.5 text-amber-700" />
                      <span>Diplom</span>
                    </button>
                  </td>
                </tr>
              ))}
              {standings.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-[#64748B]">
                    Nejsou dostupné žádné třídy pro vybranou školu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Challenge Poster Modal */}
      {posterGroup && challenge && (
        <ChallengePosterModal
          isOpen={true}
          onClose={() => setPosterGroup(null)}
          challenge={challenge}
          group={posterGroup}
          school={currentSchool}
          students={students}
        />
      )}

      {/* School Manager Evaluation Report Modal */}
      {isSchoolReportOpen && challenge && (
        <SchoolReportModal
          isOpen={isSchoolReportOpen}
          onClose={() => setIsSchoolReportOpen(false)}
          progress={schoolProgressSummary}
          challengeName={challenge.name}
          school={currentSchool}
          targetSteps={challenge.targetSteps * Math.max(1, standings.length)}
        />
      )}
    </div>
  );
};
