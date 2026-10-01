import React from 'react';
import { type Challenge, type GroupProgress } from '../types';
import { Calendar, Flame, Milestone, Award } from 'lucide-react';

interface StatsPanelProps {
  challenge: Challenge;
  progress: GroupProgress;
  totalStudents: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ challenge, progress, totalStudents }) => {
  // Format numbers nicely
  const formattedSteps = progress.totalSteps.toLocaleString();
  const formattedTarget = challenge.targetSteps.toLocaleString();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
      {/* Challenge Overview Card */}
      <div className="glass-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#8B5CF6]">Popis výzvy</span>
            <Calendar className="h-5 w-5 text-[#8B5CF6]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{challenge.name}</h3>
          <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">{challenge.description}</p>
        </div>
        <div className="border-t border-[#1E293B] pt-3 flex justify-between text-[11px] text-[#64748B]">
          <span>Od: {new Date(challenge.validFrom).toLocaleDateString()}</span>
          <span>Do: {new Date(challenge.validTo).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Target Progress Card */}
      <div className="glass-card flex flex-col justify-between border-l-2 border-l-[#06B6D4]">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#06B6D4]">Kroky & Vzdálenost</span>
            <Milestone className="h-5 w-5 text-[#06B6D4]" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-black text-white">{formattedSteps}</span>
            <span className="text-xs text-[#64748B]">/ {formattedTarget} kroků</span>
          </div>
          
          <div className="w-full bg-[#0B0F19] rounded-full h-2.5 my-3 overflow-hidden border border-[#1E293B]">
            <div 
              className="bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-[#06B6D4] font-semibold">{progress.progressPercent}% splněno</span>
            <span className="text-white font-medium">{progress.totalDistanceKm} km ušlo celkem</span>
          </div>
        </div>
        <div className="border-t border-[#1E293B] pt-3 text-[11px] text-[#64748B]">
          Průměrný krok počítán jako <strong>0.7 metru</strong>
        </div>
      </div>

      {/* Active Users Card */}
      <div className="glass-card flex flex-col justify-between border-l-2 border-l-[#10B981]">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#10B981]">Zapojení žáci</span>
            <Flame className="h-5 w-5 text-[#10B981]" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-white">
              {progress.activeUsers}
            </span>
            <span className="text-xs text-[#64748B]">/ {totalStudents} aktivních žáků</span>
          </div>

          <div className="text-xs text-[#94A3B8] leading-relaxed mb-4">
            {progress.activeUsers === 0 ? (
              'Zatím nikdo z této třídy neodeslal žádné kroky. Synchronizujte náramky!'
            ) : (
              `Skvělá práce! Ve třídě je aktivních ${Math.round((progress.activeUsers / totalStudents) * 100)} % žáků, kteří přispívají do společné výzvy.`
            )}
          </div>
        </div>
        <div className="border-t border-[#1E293B] pt-3 flex items-center gap-1.5 text-[11px] text-[#10B981] font-semibold">
          <Award className="h-4 w-4" />
          <span>Vedoucí třídy: {progress.adminName}</span>
        </div>
      </div>
    </div>
  );
};
