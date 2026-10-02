import React, { useRef } from 'react';
import { type Challenge, type Group, type Student, type School } from '../types';
import { Award, Printer, X, Share2, CheckCircle2, ShieldCheck, Flame, MapPin, Footprints } from 'lucide-react';

interface ChallengePosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge;
  group: Group;
  school?: School;
  students: Student[];
}

export const ChallengePosterModal: React.FC<ChallengePosterModalProps> = ({
  isOpen,
  onClose,
  challenge,
  group,
  school,
  students
}) => {
  const posterRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const groupStudents = students.filter(s => s.groupId === group.id);
  const totalSteps = groupStudents.reduce((sum, s) => sum + s.steps, 0);
  const activeStudents = groupStudents.filter(s => s.steps > 0).length;
  const distanceKm = Math.round((totalSteps * 0.0007) * 10) / 10;
  const estimatedCaloriesKcal = Math.round(totalSteps * 0.042);
  const progressPercent = Math.min(100, Math.round((totalSteps / challenge.targetSteps) * 100));
  
  const avgStepsPerActiveStudent = activeStudents > 0 
    ? Math.round(totalSteps / activeStudents) 
    : 0;

  // National guideline evaluation (Active Healthy Kids & Národní zpráva FTK UP)
  const isNationalGoalMet = avgStepsPerActiveStudent >= 10000 || totalSteps >= challenge.targetSteps;
  const certificateCode = `FTK-UP-${group.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}-${challenge.id.toUpperCase()}-${new Date().getFullYear()}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Odkaz na výzvu a certifikát byl zkopírován do schránky!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static print:backdrop-blur-none">
      {/* Top Action Bar - Hidden in print */}
      <div className="relative w-full max-w-4xl my-8 bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col print:border-none print:shadow-none print:my-0 print:max-w-none">
        
        {/* Modal Controls Header */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#007CA6] flex items-center justify-center text-white">
              <Award className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm tracking-tight">Oficiální certifikát & výstupní report z výzvy</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Připraveno k tisku A4
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#007CA6] hover:bg-[#006b8f] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Vytisknout diplom nebo uložit jako PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Vytisknout diplom (PDF)</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Zkopírovat odkaz"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Sdílet</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-2"
              title="Zavřít"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Certificate / Poster Surface */}
        <div 
          ref={posterRef}
          className="p-8 sm:p-12 bg-radial from-slate-50 via-white to-amber-50/20 border-8 border-double border-amber-800/30 m-3 sm:m-6 rounded-2xl relative print:m-0 print:border-8 print:border-amber-900/40 print:p-8"
        >
          {/* Subtle Watermark Emblem */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
            <Award className="w-[500px] h-[500px] text-amber-950" />
          </div>

          {/* Academic & Platform Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b-2 border-amber-900/20 gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#007CA6] text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white">
                UP
              </div>
              <div className="text-left">
                <div className="text-xs font-black tracking-wider uppercase text-slate-800">
                  Univerzita Palackého v Olomouci
                </div>
                <div className="text-[11px] font-semibold text-[#007CA6]">
                  Fakulta tělesné kultury • Katedra kinantropologie
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <img 
                src="/media__1782552769935.png" 
                alt="Gamifiter Logo" 
                className="h-9 w-auto object-contain"
              />
              <div className="text-right hidden sm:block">
                <div className="text-[11px] font-black uppercase text-amber-900 tracking-wider">
                  Gamifiter.cz
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  Vzdělávací pohybový portál
                </div>
              </div>
            </div>
          </div>

          {/* Main Title Section */}
          <div className="text-center my-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-widest border border-amber-300 mb-3 shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
              <span>Certifikát o splnění pohybové výzvy</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-serif uppercase">
              Diplom za mimořádný výkon
            </h1>
            <p className="text-sm text-slate-600 font-medium mt-1">
              v celotřídní pohybově-edukační výzvě školního roku 2025/2026
            </p>
          </div>

          {/* Recipient Details */}
          <div className="bg-white/90 border border-amber-200/80 rounded-2xl p-6 mb-8 shadow-xs text-center">
            <div className="text-xs uppercase font-bold text-amber-800 tracking-widest">
              Tento certifikát se s uznáním uděluje
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#007CA6] my-1 font-serif">
              {group.name}
            </div>
            <div className="text-sm font-semibold text-slate-700">
              {school ? school.name : 'Základní škola'} {school?.city ? `(${school.city})` : ''}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Pod vedením pedagoga: <strong className="text-slate-800 font-semibold">{group.adminName}</strong>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-700">
              <span>Zdolána výzva:</span>
              <strong className="px-2.5 py-0.5 rounded-lg bg-sky-100 text-[#007CA6] font-bold text-sm">
                🏆 {challenge.name}
              </strong>
              <span className="text-gray-400">•</span>
              <span className="text-slate-500">
                Cíl: {challenge.targetSteps.toLocaleString()} kroků
              </span>
            </div>
          </div>

          {/* Key Metrics 4-Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#007CA6] flex items-center justify-center mx-auto mb-2">
                <Footprints className="h-4 w-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {totalSteps.toLocaleString()}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                Kroků celkem
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                {distanceKm} km
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                Ušlá trasa
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
                <Flame className="h-4 w-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono">
                {estimatedCaloriesKcal.toLocaleString()}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                Spáleno kcal
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-indigo-700 font-mono">
                {progressPercent} %
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                Splnění cíle
              </div>
            </div>
          </div>

          {/* Academic & National Guideline Assessment Box */}
          <div className="bg-gradient-to-r from-amber-50/80 via-white to-sky-50/80 border border-amber-300/80 rounded-2xl p-5 mb-8 text-left shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Hodnocení dle Národní zprávy o pohybové aktivitě dětí a mládeže (Active Healthy Kids Czech Republic)
                </div>
                <div className="text-xs text-slate-700 mt-1 leading-relaxed">
                  {isNationalGoalMet ? (
                    <span>
                      🏅 <strong>ZLATÁ ÚROVEŇ SPLNĚNÍ:</strong> Třídní kolektiv splnil doporučení Fakulty tělesné kultury UP a Světové zdravotnické organizace (WHO) pro minimálně <strong>60 minut střední až intenzivní pohybové aktivity denně (10 000+ kroků)</strong>.
                    </span>
                  ) : (
                    <span>
                      🥈 <strong>STŘÍBRNÁ ÚROVEŇ:</strong> Žáci vyvinuli soustavné pohybové úsilí a významně přispěli k redukci sedavého způsobu života ve školním prostředí.
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-2 italic">
                  Vědecky podloženo výzkumem FTK UP Olomouc: Vorlíček, Prycl, Heidler, Vašíčková, Frömel (2024), Smart Learning Environments (Springer).
                </div>
              </div>
            </div>
          </div>

          {/* Signatures & Seal Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t-2 border-amber-900/20 text-center sm:text-left">
            <div className="flex flex-col items-center sm:items-start">
              <div className="font-serif italic text-slate-800 text-base font-semibold border-b border-slate-400 pb-1 px-4 min-w-[200px] text-center">
                Mgr. David Prycl
              </div>
              <div className="text-[11px] font-bold text-slate-700 mt-1">
                Třídní učitel & Koordinátor Gamifiter
              </div>
              <div className="text-[10px] text-slate-400">
                Školní garant výzvy
              </div>
            </div>

            {/* Official Circular Seal */}
            <div className="w-20 h-20 rounded-full border-4 border-dashed border-amber-700/60 bg-amber-50 text-amber-900 flex flex-col items-center justify-center p-1 text-center select-none shadow-xs">
              <div className="text-[8px] font-black uppercase tracking-wider">FTK UP</div>
              <div className="text-[9px] font-black leading-tight text-amber-800">OFICIÁLNÍ PEČEŤ</div>
              <div className="text-[8px] font-bold text-amber-700">OLOMOUC</div>
            </div>

            <div className="flex flex-col items-center sm:items-end">
              <div className="font-serif italic text-slate-800 text-base font-semibold border-b border-slate-400 pb-1 px-4 min-w-[200px] text-center">
                doc. Mgr. Michal Vorlíček, Ph.D.
              </div>
              <div className="text-[11px] font-bold text-slate-700 mt-1">
                Garant výzkumu pohybové aktivity
              </div>
              <div className="text-[10px] text-slate-400">
                Fakulta tělesné kultury Univerzity Palackého
              </div>
            </div>
          </div>

          {/* Footer Code & Timestamp */}
          <div className="mt-8 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between text-[10px] text-slate-400">
            <span>Datum vystavení: {new Date().toLocaleDateString('cs-CZ')}</span>
            <span className="font-mono font-semibold text-slate-600">Kód certifikátu: {certificateCode}</span>
            <span>www.gamifiter.cz • FTK UP</span>
          </div>

        </div>

      </div>
    </div>
  );
};
