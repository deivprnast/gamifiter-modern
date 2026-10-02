import React, { useState } from 'react';
import { BookOpen, Brain, CheckCircle2, Compass, Heart, Sparkles, TrendingUp, X } from 'lucide-react';

interface PhysicalLiteracyModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle?: string;
  classAvgSteps?: number;
}

export const PhysicalLiteracyModal: React.FC<PhysicalLiteracyModalProps> = ({
  isOpen,
  onClose,
  classNameTitle = 'Třída 8.A (FTK UP)',
  classAvgSteps = 9850
}) => {
  const [activeTab, setActiveTab] = useState<'quiz' | 'commute' | 'sdt'>('quiz');

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  if (!isOpen) return null;

  const quizQuestions = [
    {
      id: 1,
      question: 'Kolik minut střední až intenzivní pohybové aktivity denně doporučuje WHO a FTK UP pro školáky?',
      options: [
        { text: 'Alespoň 20 minut 3× týdně', correct: false, explanation: 'To je nedostatečné pro zdravý kardiovaskulární vývoj dětí.' },
        { text: 'Minimálně 60 minut denně (nebo 10 000–12 000 kroků)', correct: true, explanation: 'Přesně tak! 60 minut denně je zlatý mezinárodní standard WHO i Národní zprávy FTK UP.' },
        { text: 'Stačí 90 minut jednou za víkend', correct: false, explanation: 'Nárazový víkendový sport nenahradí každodenní pravidelný pohyb.' }
      ]
    },
    {
      id: 2,
      question: 'O kolik procent vzrostl ranní pohyb dětí před 8:00 ráno během Gamifiter výzvy (podle studie Springer 2024)?',
      options: [
        { text: 'O +10 %', correct: false, explanation: 'Výsledek byl mnohem výraznější!' },
        { text: 'O +38 % (žáci začali chodit do školy pěšky)', correct: true, explanation: 'Skvěle! Ve výzkumu (Vorlíček, Prycl et al.) stoupl ranní pohyb z 1 377 na 1 899 kroků díky aktivní cestě do školy.' },
        { text: 'K žádné změně nedošlo', correct: false, explanation: 'Naopak, motivace třídní výzvy vedla k okamžité změně ranních návyků.' }
      ]
    },
    {
      id: 3,
      question: 'Jak působí svižná ranní chůze do školy na školní výsledky a mozek žáka?',
      options: [
        { text: 'Způsobuje únavu při prvních hodinách výuky', correct: false, explanation: 'Vědecké studie dokazují pravý opak – chůze okysličuje mozek a zbavuje ospalosti.' },
        { text: 'Zvyšuje hladinu dopaminu, zlepšuje soustředění a paměť', correct: true, explanation: 'Výborně! Neurofyziologické studie potvrzují, že ranní pohyb aktivuje prefrontální kortex zodpovědný za učení a logiku.' },
        { text: 'Nemá na mozek žádný vliv', correct: false, explanation: 'Pohyb má přímý a okamžitý biochemický vliv na plasticitu mozku a náladu.' }
      ]
    }
  ];

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    quizQuestions.forEach(q => {
      const selected = selectedAnswers[q.id];
      if (selected !== undefined && q.options[selected]?.correct) {
        score++;
      }
    });
    return score;
  };

  const isAllAnswered = quizQuestions.every(q => selectedAnswers[q.id] !== undefined);
  const score = calculateScore();

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 p-5 sm:p-6 text-white relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:rotate-90 duration-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white">
              <Brain className="w-3.5 h-3.5" />
              Pohybová gramotnost (Physical Literacy)
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/30 text-white">
              <BookOpen className="w-3.5 h-3.5" />
              FTK Univerzita Palackého Olomouc
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Vědecká pohybová gramotnost pro školáky
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl">
            Poznatky ze studie <span className="font-semibold text-white">Smart Learning Environments (Springer, 2024)</span> přizpůsobené pro třídu <span className="font-semibold text-white">{classNameTitle}</span>.
          </p>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mt-4 pt-1">
            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'quiz'
                  ? 'bg-white text-emerald-800 shadow-md scale-102'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              🧠 Minikvíz ({Object.keys(selectedAnswers).length}/3)
            </button>
            <button
              onClick={() => setActiveTab('commute')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'commute'
                  ? 'bg-white text-emerald-800 shadow-md scale-102'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <Compass className="w-4 h-4" />
              🚶‍♂️ Aktivní cesta do školy (+38 %)
            </button>
            <button
              onClick={() => setActiveTab('sdt')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'sdt'
                  ? 'bg-white text-emerald-800 shadow-md scale-102'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <Heart className="w-4 h-4" />
              🏛️ Motivace pro TV (SDT)
            </button>
          </div>
        </div>

        {/* Tab Content with generous breathing room */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">

          {/* TAB 1: QUIZ */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-4">
                <div className="w-11 h-11 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0 text-xl font-bold">
                  🧠
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Proč kvíz pohybové gramotnosti?</h3>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed">
                    Ve studii Gamifiteru potvrdilo <strong>88 % žáků</strong>, že se díky aplikaci poprvé dozvěděli, jaká jsou zdravá doporučení a jak snadno lze kroků dosáhnout ranní chůzí do školy. Otestuj své znalosti!
                  </p>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-6">
                {quizQuestions.map((q, qIdx) => (
                  <div key={q.id} className="bg-slate-50/80 border border-slate-200/90 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
                    <div className="flex items-center gap-3 font-extrabold text-slate-800 text-sm sm:text-base">
                      <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
                        {qIdx + 1}
                      </span>
                      <h4>{q.question}</h4>
                    </div>

                    <div className="flex flex-col gap-3">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[q.id] === optIdx;
                        const optionLetters = ['A', 'B', 'C'];
                        const letter = optionLetters[optIdx] || '•';

                        let optionStyle = 'bg-white border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/20 text-slate-800 shadow-2xs';
                        let badgeStyle = 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800';

                        if (quizSubmitted) {
                          if (opt.correct) {
                            optionStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-2 ring-emerald-400/40';
                            badgeStyle = 'bg-emerald-600 text-white';
                          } else if (isSelected && !opt.correct) {
                            optionStyle = 'bg-rose-50 border-rose-300 text-rose-950 font-medium';
                            badgeStyle = 'bg-rose-500 text-white';
                          } else {
                            optionStyle = 'bg-white/60 border-slate-200 text-slate-400 opacity-70';
                          }
                        } else if (isSelected) {
                          optionStyle = 'bg-emerald-50/90 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/30 font-bold shadow-sm';
                          badgeStyle = 'bg-emerald-600 text-white';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            disabled={quizSubmitted}
                            className={`group w-full text-left p-4 sm:p-4.5 rounded-2xl border-2 text-sm sm:text-base transition-all flex items-center justify-between gap-4 cursor-pointer ${optionStyle}`}
                          >
                            <div className="flex items-center gap-3.5">
                              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${badgeStyle}`}>
                                {letter}
                              </span>
                              <span className="leading-snug">{opt.text}</span>
                            </div>
                            
                            {quizSubmitted && opt.correct && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className="mt-3 p-3.5 bg-white rounded-2xl border border-emerald-200 text-xs sm:text-sm text-slate-700 leading-relaxed shadow-2xs">
                        💡 <strong>Vysvětlení z výzkumu:</strong> {q.options[selectedAnswers[q.id] || 0]?.explanation || q.options.find(o => o.correct)?.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit & Result */}
              {!quizSubmitted ? (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    disabled={!isAllAnswered}
                    className={`px-7 py-3.5 rounded-2xl font-black text-sm shadow-md transition-all flex items-center gap-2 ${
                      isAllAnswered
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer hover:shadow-emerald-200 active:scale-98'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Vyhodnotit kvíz
                  </button>
                </div>
              ) : (
                <div className="p-6 sm:p-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-400/60 rounded-3xl text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md text-3xl">
                    🏆
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Výsledek: {score} ze 3 správně!
                  </h3>
                  <p className="text-slate-600 text-sm max-w-lg mx-auto leading-relaxed">
                    {score === 3
                      ? '🌟 Fantastické! Získáváš odznak Mistra pohybové gramotnosti pro třídu!'
                      : 'Dobrá práce! Pohybová gramotnost je klíčem ke zdravému a plnohodnotnému životu.'}
                  </p>
                  <button
                    onClick={() => {
                      setQuizSubmitted(false);
                      setSelectedAnswers({});
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                  >
                    Vyzkoušet kvíz znovu
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE COMMUTE */}
          {activeTab === 'commute' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm">
                    <Compass className="w-6 h-6" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Zjištění výzkumu: +38 % ranního pohybu do 8:00
                    </h3>
                    <p className="text-xs text-amber-800 font-medium">
                      Pramen: Smart Learning Environments (Springer, 2024; Vorlíček, Prycl et al.)
                    </p>
                  </div>
                </div>

                <p className="text-slate-700 text-sm leading-relaxed">
                  Výzkum s 107 žáky (ve věku 12–13 let) s fitness náramky Garmin VívoFit 4 prokázal, že díky třídní soutěži Gamifiter stoupl průměrný počet kroků uskutečněných <strong>před osmou hodinou ranní z 1 377 na 1 899 kroků denně</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm text-center">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Před výzvou</span>
                    <p className="text-2xl font-black text-slate-700 mt-1">1 377</p>
                    <span className="text-xs text-slate-500">kroků před 8:00</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-sm text-center ring-2 ring-amber-400/40">
                    <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">Při Gamifiter výzvě</span>
                    <p className="text-3xl font-black text-amber-600 mt-1">1 899</p>
                    <span className="text-xs font-semibold text-emerald-600">+38 % ranního pohybu!</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm text-center">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Statistická významnost</span>
                    <p className="text-2xl font-black text-slate-700 mt-1">p = 0.001</p>
                    <span className="text-xs text-slate-500">vysoce signifikantní</span>
                  </div>
                </div>
              </div>

              {/* Practical tips for schools & parents */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4">
                <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Jak využít „Aktivní cestu do školy“ v praxi:
                </h4>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <span><strong>Odznak „Pěšky do školy“:</strong> Odměňujte žáky, kteří nasbírají alespoň 1 500 kroků do 8:00 ráno. Motivuje to vystoupit z tramvaje/autobusu o 2 zastávky dříve.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <span><strong>Organizace Pěškobusu (Walking Bus):</strong> Společné ranní skupiny spolužáků, kteří se scházejí na smluveném místě a jdou do školy pěšky společně.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <span><strong>Granty a udržitelná mobilita:</strong> Vedení školy může data o nárůstu ranní mobility vykázat v grantových programech měst na bezpečné a čisté školní zóny bez aut.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: SELF-DETERMINATION THEORY (SDT) */}
          {activeTab === 'sdt' && (
            <div className="space-y-6">
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-blue-600" />
                  Teorie sebedeterminace (SDT) v pedagogice TV
                </h3>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                  Podle výzkumného týmu (Deci & Ryan, 2000; Vorlíček, Prycl et al., 2024) je úspěch Gamifiteru postaven na naplnění <strong>3 základních psychologických potřeb</strong> žáků, které přetvářejí vnější soutěživost na trvalou vnitřní motivaci:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Autonomy */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h4 className="font-bold text-slate-800">Autonomie (Autonomy)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Žák si sám volí způsob, čas i intenzitu pohybu (chůze se psem, fotbal, kolo, cesta do školy). Není nucen do unifikovaných tabulek, což eliminuje odpor ke sportu.
                  </p>
                </div>

                {/* Competence */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h4 className="font-bold text-slate-800">Kompetence (Competence)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Zpětná vazba v reálném čase. Vizuální zaostřování a odkrývání obrázku dává okamžitý smysl vynaloženému úsilí a posiluje pocit osobního mistrovství.
                  </p>
                </div>

                {/* Relatedness */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h4 className="font-bold text-slate-800">Sounáležitost (Relatedness)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Společný třídní cíl. Z výzkumu vyplynulo, že <strong>20 % žáků se necítí dobře při veřejném srovnávání přesných čísel</strong>. Proto Gamifiter zavádí <em>„Týmový podíl (%)“</em> – každý krok pomáhá třídě!
                  </p>
                </div>
              </div>

              {/* Formative assessment recommendation */}
              <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-2">
                <h4 className="font-bold text-sm text-emerald-400">Doporučení pro formativní hodnocení v tělesné výchově:</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Nehodnoťte žáky známkou podle absolutního počtu kroků, ale oceňujte <strong>vytrvalost, aktivní šňůry (Streaks) a podíl na třídním cíli</strong>. Tím udržíte v pohybu i děti, které by jinak při tradičním výkonnostním testování rezignovaly.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer with generous breathing space */}
        <div className="p-4 sm:p-6 bg-white border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs sm:text-sm text-slate-500 flex items-center gap-2">
            <span>Aktuální průměr třídy:</span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-extrabold font-mono text-xs sm:text-sm">
              {classAvgSteps.toLocaleString('cs-CZ')} kroků / den
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">(Národní cíl: 10 000)</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-98"
          >
            Zavřít
          </button>
        </div>

      </div>
    </div>
  );
};
