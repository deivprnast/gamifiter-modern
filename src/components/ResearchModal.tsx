import React, { useState } from 'react';
import { BookOpen, ExternalLink, X, CheckCircle, TrendingUp, HeartPulse, Activity, Sparkles, FileText, UserCheck } from 'lucide-react';
import { type Student, type Challenge } from '../types';

interface ResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  students?: Student[];
  challenge?: Challenge;
}

export const ResearchModal: React.FC<ResearchModalProps> = ({
  isOpen,
  onClose,
  students = [],
  challenge
}) => {
  const [activeTab, setActiveTab] = useState<'study' | 'national_report' | 'methodology'>('study');

  if (!isOpen) return null;

  // Class statistics for national comparison
  const totalSteps = students.reduce((sum, s) => sum + s.steps, 0);
  const avgStepsPerStudent = students.length > 0 ? Math.round(totalSteps / students.length) : 0;
  const nationalBenchmark = 10000;
  const percentOfBenchmark = Math.min(150, Math.round((avgStepsPerStudent / nationalBenchmark) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl my-8 bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-[#003952] to-[#007CA6] text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-cyan-300 font-black text-xl shadow-lg shrink-0">
              UP
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                  Fakulta tělesné kultury Univerzity Palackého
                </span>
                <span className="inline-flex items-center gap-1 bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                  Peer-Reviewed Research
                </span>
                {challenge && (
                  <span className="text-[10px] bg-[#007CA6]/30 text-white px-2 py-0.5 rounded-full font-bold">
                    Výzva: {challenge.name}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                Vědecká validace & Národní zpráva o pohybové aktivitě
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                Garantováno doc. Michalem Vorlíčkem, Ph.D. a Davidem Pryclem (Smart Learning Environments, 2024)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Zavřít"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="bg-gray-100/90 p-2 border-b border-gray-200 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('study')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'study'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-gray-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-4 w-4 text-[#007CA6]" />
            <span>1. Vědecká publikace (Springer 2024)</span>
          </button>

          <button
            onClick={() => setActiveTab('national_report')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'national_report'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-gray-600 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="h-4 w-4 text-rose-500" />
            <span>2. Národní zpráva (Gába, Vorlíček a kol.)</span>
          </button>

          <button
            onClick={() => setActiveTab('methodology')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'methodology'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-gray-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-4 w-4 text-emerald-600" />
            <span>3. Školní metodika & RVP</span>
          </button>
        </div>

        {/* Tab 1: Scientific Study Content */}
        {activeTab === 'study' && (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#007CA6] mb-1">
                Oficiální citace recenzovaného výzkumu
              </div>
              <div className="text-sm font-semibold text-slate-900 leading-snug">
                Vorlíček, M., Prycl, D., Heidler, J., Vašíčková, J., & Frömel, K. (2024). 
                <em> Gameful education: a study of Gamifiter application’s role in promoting physical activity and active lifestyle.</em> 
                <strong> Smart Learning Environments</strong>, 11(1), 51.
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-sky-100">
                <a
                  href="https://link.springer.com/article/10.1186/s40561-024-00339-w"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-800 bg-sky-200/70 hover:bg-sky-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Springer Nature Článek (Open Access)</span>
                </a>
                <a
                  href="https://www.researchgate.net/publication/387381592_Gameful_education_a_study_of_Gamifiter_application's_role_in_promoting_physical_activity_and_active_lifestyle"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200/70 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>ResearchGate Publikace</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#007CA6] flex items-center justify-center mb-3">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">+1 850</div>
                <div className="text-xs font-bold text-slate-700 mt-0.5">Kroků navíc za den</div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Žáci zapojení do Gamifiter výzev dosahovali průměrně o 1 850 kroků denně více než kontrolní skupiny bez gamifikace.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-emerald-700 font-mono">107 žáků</div>
                <div className="text-xs font-bold text-slate-700 mt-0.5">Empirický vzorek</div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Reálné testování na žácích 2. stupně ZŠ (12–15 let) s nositelnou elektronikou Garmin a chytrými telefony.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-purple-700 font-mono">100 %</div>
                <div className="text-xs font-bold text-slate-700 mt-0.5">Inkluzivní zapojení</div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Kooperativní týmové cíle eliminují pocit méněcennosti méně zdatných dětí a stimulují spontánní pohyb o přestávkách.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                Abstrakt & Hlavní vědecké závěry
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Studie prokázala, že propojení nositelné telemetrie (Garmin, Google Fit, Apple Zdraví) s kolaborativním herním rozhraním Gamifiter účinně propojuje vnitřní a vnější motivaci. Místo neoblíbeného testování zdatnosti zažívají žáci pocit sounáležitosti, kdy každý krok každého žáka přispívá ke společnému cíli (např. odemčení mapy Evropy či historické památky).
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: National Report Content */}
        {activeTab === 'national_report' && (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
            <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-700">
                  Active Healthy Kids Czech Republic Report Card
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800">
                  FTK UP Garance
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Národní zpráva o pohybové aktivitě dětí a mládeže
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Vědecký tým pod vedením <strong>prof. Mgr. Aleše Gáby, Ph.D.</strong> a <strong>doc. Mgr. Michala Vorlíčka, Ph.D.</strong> z Katedry přírodních věd v kinantropologii FTK UP dlouhodobě monitoruje pohybovou aktivitu české populace.
              </p>
            </div>

            {/* National Guidelines Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-[#007CA6] mb-1">
                  1. Čas v pohybu (MVPA)
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">≥ 60 min</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Minimálně 60 minut střední až intenzivní aktivity denně.
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
                  2. Doporučené kroky
                </div>
                <div className="text-2xl font-black text-emerald-700 font-mono">10 000–12 000</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Kroků za den pro školní mládež (chlapci 11k, dívky 10k).
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
                  3. Screen-Time limit
                </div>
                <div className="text-2xl font-black text-amber-700 font-mono">&lt; 2 hodiny</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Maximální doporučený čas u obrazovek mimo školní výuku.
                </div>
              </div>
            </div>

            {/* Live Class vs National Goal Benchmark Calculator */}
            <div className="bg-white border-2 border-[#007CA6]/30 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-[#007CA6]">
                  📊 Srovnání vaší třídy s národním doporučením
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-[#007CA6]">
                  {avgStepsPerStudent.toLocaleString()} kroků / žák
                </span>
              </div>

              <div className="w-full bg-gray-200 h-3.5 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full rounded-full transition-all ${
                    percentOfBenchmark >= 100 ? 'bg-emerald-500' : 'bg-[#007CA6]'
                  }`}
                  style={{ width: `${Math.min(100, percentOfBenchmark)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>0 kroků</span>
                <span className="font-bold text-slate-900">
                  {percentOfBenchmark}% národního cíle (10 000 kroků)
                </span>
                <span>10 000 kroků (Cíl)</span>
              </div>

              <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                {percentOfBenchmark >= 100 ? (
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Výborně! Vaše třída překračuje národní standard Active Healthy Kids!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Activity className="h-4 w-4 text-[#007CA6] shrink-0" />
                    <span>K dosažení zlatého národního standardu chybí třídě průměrně {(10000 - avgStepsPerStudent).toLocaleString()} kroků denně.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Methodology Content */}
        {activeTab === 'methodology' && (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
                Metodické pokyny pro pedagogy tělesné výchovy
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Implementace Gamifiteru do Školního vzdělávacího programu (ŠVP ZV)
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Gamifiter rozvíjí klíčové kompetence podle Rámcového vzdělávacího programu (RVP ZV): kompetenci k učení, řešení problémů, komunikativní a sociální kompetenci.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-white border border-gray-200 rounded-xl flex items-start gap-3 shadow-xs">
                <div className="w-6 h-6 rounded-lg bg-sky-100 text-[#007CA6] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Společné překonávání etap (Kolaborace)</div>
                  <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Namísto soutěže mezi žáky pracují všichni na jedné virtuální trase (např. Tour de Europe). Výkon každého žáka je viditelný a přispívá k odemčení dalšího bodu na mapě.
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border border-gray-200 rounded-xl flex items-start gap-3 shadow-xs">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Mezipředmětové vazby (Zeměpis, Dějepis, Přírodopis)</div>
                  <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Každá dokončená etapa odhaluje edukační obsah – geografické zajímavosti evropských metropolí, historické reálie okresů ČR nebo biologické struktury buněk.
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border border-gray-200 rounded-xl flex items-start gap-3 shadow-xs">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Formativní hodnocení a sebereflexe žáka</div>
                  <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Učitel hodnotí nikoliv absolutní atletický výkon, nýbrž pravidelnost pohybu a osobní zlepšení žáka v průběhu výzvy.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-gray-200 rounded-xl text-center">
              <a
                href="https://www.gamifiter.cz"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#007CA6] hover:underline inline-flex items-center gap-1.5"
              >
                <span>Více informací o metodice na www.gamifiter.cz</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3.5 flex items-center justify-between text-xs text-gray-500">
          <span>Univerzita Palackého v Olomouci • Gamifiter.cz</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            Zavřít
          </button>
        </div>

      </div>
    </div>
  );
};
