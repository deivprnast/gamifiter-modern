import React from 'react';
import { type Group, type Student, type Challenge } from '../../types';

interface MySchoolProps {
  groups: Group[];
  students: Student[];
  challenge: Challenge | undefined;
}

export const MySchool: React.FC<MySchoolProps> = ({ groups, students, challenge }) => {
  // Calculate standings for each group
  const standings = groups.map((g) => {
    const groupStudents = students.filter((s) => s.groupId === g.id);
    const totalSteps = groupStudents.reduce((sum, s) => sum + s.steps, 0);
    const distanceKm = Math.round((totalSteps * 0.0007) * 100) / 100;
    const progressPercent = challenge 
      ? Math.min(100, Math.round((totalSteps / challenge.targetSteps) * 100))
      : 0;

    return {
      id: g.id,
      name: g.name,
      adminName: g.adminName,
      activeUsers: groupStudents.filter((s) => s.steps > 0).length,
      totalStudents: groupStudents.length,
      totalSteps,
      distanceKm,
      progressPercent
    };
  }).sort((a, b) => b.totalSteps - a.totalSteps);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="view-title-container">
        <h2 className="view-title">Moje škola</h2>
      </div>

      <div className="replicated-card">
        <div className="replicated-card-header">
          <span>Celkový přehled a pořadí tříd</span>
          {challenge && (
            <span className="text-xs font-normal">Výzva: {challenge.name}</span>
          )}
        </div>
        <div className="replicated-card-body p-0">
          <table className="replicated-table">
            <thead>
              <tr>
                <th className="py-2 px-4 w-16 text-center">Pořadí</th>
                <th className="py-2 px-4">Třída</th>
                <th className="py-2 px-4">Učitel</th>
                <th className="py-2 px-4 text-center">Aktivní žáci</th>
                <th className="py-2 px-4 text-right">Celkem kroků</th>
                <th className="py-2 px-4 text-right">Ušlá vzdálenost</th>
                <th className="py-2 px-4 w-44">Pokrok ve výzvě</th>
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
                </tr>
              ))}
              {standings.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#64748B]">
                    Nejsou dostupné žádné třídy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
