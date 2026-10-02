import { type Challenge, type Group, type Student, type GroupProgress, type School } from '../types';

const STORAGE_KEYS = {
  CHALLENGES: 'gamifiter_challenges',
  GROUPS: 'gamifiter_groups',
  STUDENTS: 'gamifiter_students',
  SCHOOLS: 'gamifiter_schools',
  ACTIVE_CHALLENGE_ID: 'gamifiter_active_challenge_id',
  ACTIVE_GROUP_ID: 'gamifiter_active_group_id',
  ACTIVE_SCHOOL_ID: 'gamifiter_active_school_id',
};

const DEFAULT_SCHOOLS: School[] = [
  {
    id: 'school-1',
    name: 'FZŠ Heyrovského Olomouc',
    city: 'Olomouc',
    code: 'FZSH-OLO',
    address: 'Heyrovského 33, 779 00 Olomouc',
    adminEmail: 'vedeni@fzs-heyrovskeho.cz',
    createdAt: '2026-01-15'
  },
  {
    id: 'school-2',
    name: 'FTK Univerzita Palackého (Laboratoř)',
    city: 'Olomouc',
    code: 'FTK-UPOL',
    address: 'Tř. Míru 117, 771 11 Olomouc',
    adminEmail: 'kinantropologie@upol.cz',
    createdAt: '2026-02-01'
  },
  {
    id: 'school-3',
    name: 'Gymnázium Čajkovského Olomouc',
    city: 'Olomouc',
    code: 'GYM-CAJK',
    address: 'Čajkovského 9, 779 00 Olomouc',
    adminEmail: 'info@gcajko.cz',
    createdAt: '2026-02-20'
  }
];

const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: 'challenge-1',
    name: 'Tour de Europe',
    description: 'Virtuální trasa napříč Evropou. Ujděte s celou třídou 500 000 kroků a odhalte zajímavá evropská města.',
    moduleType: 'map',
    targetSteps: 500000,
    validFrom: '2026-06-01',
    validTo: '2026-07-31',
    filePath: '/tour_de_cities.geojson',
    subjectCategory: 'zemepis',
    customTaskPrompt: 'Které je nejzelenější hlavní město Evropy podle rozlohy městských parků na jednoho obyvatele?',
    customClue: 'Leží na řece Dunaj, pyšní se Hofburgem a Prátrem.',
    solutionAnswer: 'Vídeň'
  },
  {
    id: 'challenge-2',
    name: 'Okresy České republiky',
    description: 'Postupně odemykejte okresy ČR. Každých 5 000 kroků celé třídy odemkne jeden okres s jeho detailními statistikami.',
    moduleType: 'districts',
    targetSteps: 70000, // 14 districts in districts.geojson, 14 * 5000 = 70k steps
    validFrom: '2026-06-15',
    validTo: '2026-08-15',
    filePath: '/districts.geojson',
    subjectCategory: 'zemepis',
    customTaskPrompt: 'Který moravský kraj je známý výrobou tvarůžků a barokním sloupem Nejsvětější Trojice?',
    customClue: 'Krajské město je sídlem Univerzity Palackého.',
    solutionAnswer: 'Olomoucký kraj'
  },
  {
    id: 'challenge-3',
    name: 'Odkrývání: Zámek Český Krumlov',
    description: 'Zlepšete svou kondici a odhalte skrytý historický klenot z ptačí perspektivy. Každý krok pomáhá odkrýt obrázek.',
    moduleType: 'puzzle',
    targetSteps: 120000,
    validFrom: '2026-06-20',
    validTo: '2026-07-20',
    filePath: '/krumlov.jpg',
    subjectCategory: 'dejepis',
    customTaskPrompt: 'Který slavný jihočeský šlechtický rod s pětilistou růží ve znaku tento zámek po staletí spravoval?',
    customClue: 'Páni z R... měli své centrum v Českém Krumlově a Třeboni.',
    solutionAnswer: 'Rožmberkové'
  },
  {
    id: 'challenge-4',
    name: 'Zaostřování: Tajemství DNA',
    description: 'Každý krok zpřesňuje vaše vidění světa. Vyostřete detailní makro snímek DNA řetězce a získejte edukační bonus.',
    moduleType: 'pixelate',
    targetSteps: 100000,
    validFrom: '2026-06-10',
    validTo: '2026-07-10',
    filePath: '/dna.jpg',
    subjectCategory: 'prirodopis',
    customTaskPrompt: 'Jak se nazývá základní stavební jednotka nukleových kyselin DNA a RNA?',
    customClue: 'Skládá se z dusíkaté báze, pětiuhlíkatého cukru a fosfátové skupiny (N...tid).',
    solutionAnswer: 'Nukleotid'
  },
  {
    id: 'challenge-5',
    name: 'Síťování: Lidské tělo',
    description: 'Propojte uzly nervové soustavy. Aktivita celé třídy buduje komplexní neuronovou síť.',
    moduleType: 'network',
    targetSteps: 80000,
    validFrom: '2026-06-05',
    validTo: '2026-07-05',
    filePath: '/dataset.json',
    subjectCategory: 'zdravi',
    customTaskPrompt: 'Kolik minut střední až intenzivní pohybové aktivity denně doporučuje WHO pro optimální vývoj dětí a mládeže?',
    customClue: 'Přesně jedna celá vyučovací hodina plus přestávka (60 minut).',
    solutionAnswer: '60 minut'
  }
];

const DEFAULT_GROUPS: Group[] = [
  { id: 'group-1', name: 'Třída 8.A (FTK UP)', adminName: 'David Prycl', schoolId: 'school-1', streakDays: 7 },
  { id: 'group-2', name: 'Třída 9.B (Výzkumná kohorta)', adminName: 'David Prycl', schoolId: 'school-1', streakDays: 4 },
  { id: 'group-3', name: 'Kinantropologický seminář UP', adminName: 'doc. Michal Vorlíček', schoolId: 'school-2', streakDays: 14 },
  { id: 'group-4', name: 'Prima A (Gymnázium)', adminName: 'Mgr. Jan Novák', schoolId: 'school-3', streakDays: 6 }
];

const DEFAULT_STUDENTS: Student[] = [
  { id: 'student-1', name: 'David Prycl', groupId: 'group-1', steps: 6464, morningSteps: 2150, streakDays: 8, avatar: '🦊', device: 'Garmin Vívoactive 4', isReal: true },
  { id: 'student-2', name: 'Tomáš Kučera', groupId: 'group-1', steps: 7820, morningSteps: 1840, streakDays: 5, avatar: '🦅', device: 'Apple Zdraví', isReal: false },
  { id: 'student-3', name: 'Eliška Dvořáková', groupId: 'group-1', steps: 9410, morningSteps: 2420, streakDays: 12, avatar: '🐆', device: 'Google Fit', isReal: false },
  { id: 'student-4', name: 'Jakub Svoboda', groupId: 'group-2', steps: 6150, morningSteps: 1350, streakDays: 3, avatar: '🐺', device: 'Garmin Forerunner', isReal: false },
  { id: 'student-5', name: 'Tereza Králová', groupId: 'group-3', steps: 11200, morningSteps: 2600, streakDays: 14, avatar: '🐬', device: 'Garmin Vívoactive', isReal: false }
];

export const initializeStorage = (): void => {
  if (!localStorage.getItem(STORAGE_KEYS.SCHOOLS)) {
    localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(DEFAULT_SCHOOLS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.CHALLENGES)) {
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(DEFAULT_CHALLENGES));
  }

  // Ensure clean groups with proper schoolId
  const existingGroupsRaw = localStorage.getItem(STORAGE_KEYS.GROUPS);
  if (!existingGroupsRaw) {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(DEFAULT_GROUPS));
  } else {
    try {
      const groups: Group[] = JSON.parse(existingGroupsRaw);
      const cleaned: Group[] = groups
        .filter(g => !g.adminName?.includes('Heidler'))
        .map(g => ({
          ...g,
          schoolId: g.schoolId || 'school-1',
          adminName: g.adminName?.includes('Vorlíček') ? 'doc. Michal Vorlíček' : (g.adminName || 'David Prycl')
        }));
      if (cleaned.length === 0) {
        cleaned.push(...DEFAULT_GROUPS);
      }
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(cleaned));
    } catch {
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(DEFAULT_GROUPS));
    }
  }

  // Ensure students have valid references
  const existingStudentsRaw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  if (!existingStudentsRaw) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
  } else {
    try {
      const students: Student[] = JSON.parse(existingStudentsRaw);
      const mockNames = ['Heidler', 'Nováková', 'Horák', 'Malá', 'Velký', 'Černá', 'Bílý'];
      let cleaned = students.filter(s => !mockNames.some(m => s.name.includes(m)));
      
      const david = cleaned.find(s => s.name.includes('David Prycl') || s.id === 'student-1');
      if (!david) {
        cleaned.unshift({ id: 'student-1', name: 'David Prycl', groupId: 'group-1', steps: 6464, device: 'Garmin Vívoactive 4', isReal: true });
      } else if (david.steps >= 50000 || david.steps === 104620) {
        david.steps = 6464;
      }
      const avatarList = ['🦊', '🦅', '🐆', '🐺', '🐬', '🦁', '🐻', '🦉'];
      cleaned = cleaned.map((s, idx) => ({
        ...s,
        avatar: s.avatar || avatarList[idx % avatarList.length],
        morningSteps: s.morningSteps !== undefined ? s.morningSteps : Math.round(s.steps * 0.28),
        streakDays: s.streakDays !== undefined ? s.streakDays : (idx === 0 ? 8 : (idx + 3) * 2)
      }));
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(cleaned));
    } catch {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
    }
  }

  // Ensure challenges have educational tasks backfilled
  const existingChallengesRaw = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
  if (existingChallengesRaw) {
    try {
      const challenges: Challenge[] = JSON.parse(existingChallengesRaw);
      const updated = challenges.map(c => {
        const def = DEFAULT_CHALLENGES.find(dc => dc.id === c.id);
        if (def && !c.customTaskPrompt) {
          return {
            ...c,
            customTaskPrompt: def.customTaskPrompt,
            customClue: def.customClue,
            subjectCategory: def.subjectCategory,
            solutionAnswer: def.solutionAnswer
          };
        }
        return c;
      });
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(updated));
    } catch {
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(DEFAULT_CHALLENGES));
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_CHALLENGE_ID)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHALLENGE_ID, DEFAULT_CHALLENGES[0].id);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_GROUP_ID)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP_ID, DEFAULT_GROUPS[0].id);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID, DEFAULT_SCHOOLS[0].id);
  }
};

export const syncWithCloudD1 = (cloudStudents: Array<{ id: string; name: string; steps: number }>): Student[] => {
  const current = getStudents();
  let updated = false;

  const merged = current.map(localStudent => {
    const cloudMatch = cloudStudents.find(cs => cs.id === localStudent.id || (localStudent.id === 'student-1' && cs.name.includes('David Prycl')));
    if (cloudMatch && cloudMatch.steps !== localStudent.steps) {
      updated = true;
      return {
        ...localStudent,
        steps: cloudMatch.steps
      };
    }
    return localStudent;
  });

  if (updated) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(merged));
  }
  return merged;
};

export const getChallenges = (): Challenge[] => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHALLENGES) || '[]');
};

export const getSchools = (): School[] => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHOOLS) || '[]');
};

export const getActiveSchoolId = (): string => {
  initializeStorage();
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID) || DEFAULT_SCHOOLS[0].id;
};

export const setActiveSchoolId = (id: string): void => {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID, id);
};

export const getGroups = (): Group[] => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS) || '[]');
};

export const getStudents = (): Student[] => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
};

export const getActiveChallengeId = (): string => {
  initializeStorage();
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_CHALLENGE_ID) || DEFAULT_CHALLENGES[0].id;
};

export const setActiveChallengeId = (id: string): void => {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_CHALLENGE_ID, id);
};

export const getActiveGroupId = (): string => {
  initializeStorage();
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_GROUP_ID) || DEFAULT_GROUPS[0].id;
};

export const setActiveGroupId = (id: string): void => {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP_ID, id);
};

export const updateStudentSteps = (studentId: string, steps: number): Student[] => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index !== -1) {
    students[index].steps = Math.max(0, steps);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }
  return students;
};

export const updateStudentDevice = (studentId: string, device: string): Student[] => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index !== -1) {
    students[index].device = device;
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }
  return students;
};

export const addStudent = (name: string, groupId: string, initialSteps: number = 0, device: string = 'Google Fit (Android)'): Student => {
  const students = getStudents();
  const newStudent: Student = {
    id: `student-${Date.now()}`,
    name,
    groupId,
    steps: Math.max(0, initialSteps),
    device,
    lastSync: 'Čeká na připojení',
    isReal: false
  };
  students.push(newStudent);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  return newStudent;
};

export const removeStudent = (studentId: string): Student[] => {
  const students = getStudents();
  const filtered = students.filter(s => s.id !== studentId);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(filtered));
  return filtered;
};

export const addSchool = (name: string, city: string, code: string, address?: string, adminEmail?: string): School => {
  const schools = getSchools();
  const newSchool: School = {
    id: `school-${Date.now()}`,
    name,
    city,
    code: code.toUpperCase(),
    address: address || '',
    adminEmail: adminEmail || '',
    createdAt: new Date().toISOString().split('T')[0]
  };
  schools.push(newSchool);
  localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
  return newSchool;
};

export const updateSchool = (id: string, name: string, city: string, code: string, address?: string, adminEmail?: string): School[] => {
  const schools = getSchools();
  const index = schools.findIndex(s => s.id === id);
  if (index !== -1) {
    schools[index] = {
      ...schools[index],
      name,
      city,
      code: code.toUpperCase(),
      address: address !== undefined ? address : schools[index].address,
      adminEmail: adminEmail !== undefined ? adminEmail : schools[index].adminEmail
    };
    localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
  }
  return schools;
};

export const removeSchool = (schoolId: string): School[] => {
  const schools = getSchools();
  const filtered = schools.filter(s => s.id !== schoolId);
  localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(filtered));

  if (getActiveSchoolId() === schoolId && filtered.length > 0) {
    setActiveSchoolId(filtered[0].id);
  }
  return filtered;
};

export const addGroup = (name: string, adminName: string, schoolId: string = 'school-1'): Group => {
  const groups = getGroups();
  const newGroup: Group = {
    id: `group-${Date.now()}`,
    name,
    adminName,
    schoolId
  };
  groups.push(newGroup);
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  return newGroup;
};

export const updateGroup = (id: string, name: string, adminName: string, schoolId?: string): Group[] => {
  const groups = getGroups();
  const index = groups.findIndex(g => g.id === id);
  if (index !== -1) {
    groups[index] = { 
      ...groups[index], 
      name, 
      adminName,
      ...(schoolId ? { schoolId } : {})
    };
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));

    // Background sync to Cloudflare D1
    try {
      fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groups[index])
      }).catch(err => console.warn('Cloud group update notice:', err));
    } catch (e) {
      console.warn('Sync group background error:', e);
    }
  }
  return groups;
};

export const removeGroup = (groupId: string): Group[] => {
  const groups = getGroups();
  const filtered = groups.filter(g => g.id !== groupId);
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(filtered));
  
  // Clean up students
  const students = getStudents();
  const studentsFiltered = students.filter(s => s.groupId !== groupId);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(studentsFiltered));

  // Background sync to Cloudflare D1
  try {
    fetch(`/api/groups/${groupId}`, {
      method: 'DELETE'
    }).catch(err => console.warn('Cloud group delete notice:', err));
  } catch (e) {
    console.warn('Sync group background error:', e);
  }

  return filtered;
};

export const addChallenge = (challenge: Omit<Challenge, 'id'>): Challenge => {
  const challenges = getChallenges();
  const newChallenge: Challenge = {
    ...challenge,
    id: `challenge-${Date.now()}`
  };
  challenges.push(newChallenge);
  localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));

  // Background sync to Cloudflare D1
  try {
    fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newChallenge)
    }).catch(err => console.warn('Cloud challenge add notice:', err));
  } catch (e) {
    console.warn('Sync challenge background error:', e);
  }

  return newChallenge;
};

export const updateChallenge = (id: string, updated: Partial<Challenge>): Challenge[] => {
  const challenges = getChallenges();
  const index = challenges.findIndex(c => c.id === id);
  if (index !== -1) {
    challenges[index] = { ...challenges[index], ...updated };
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));

    // Background sync to Cloudflare D1
    try {
      fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challenges[index])
      }).catch(err => console.warn('Cloud challenge update notice:', err));
    } catch (e) {
      console.warn('Sync challenge background error:', e);
    }
  }
  return challenges;
};

export const removeChallenge = (challengeId: string): Challenge[] => {
  const challenges = getChallenges();
  const filtered = challenges.filter(c => c.id !== challengeId);
  localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(filtered));
  
  // Fallback active challenge if deleted
  if (getActiveChallengeId() === challengeId && filtered.length > 0) {
    setActiveChallengeId(filtered[0].id);
  }

  // Background sync to Cloudflare D1
  try {
    fetch(`/api/challenges/${challengeId}`, {
      method: 'DELETE'
    }).catch(err => console.warn('Cloud challenge delete notice:', err));
  } catch (e) {
    console.warn('Sync challenge background error:', e);
  }

  return filtered;
};

export const getGroupProgress = (challengeId: string, groupId: string): GroupProgress | null => {
  const group = getGroups().find(g => g.id === groupId);
  const challenge = getChallenges().find(c => c.id === challengeId);
  if (!group || !challenge) return null;

  const students = getStudents().filter(s => s.groupId === groupId);
  const totalSteps = students.reduce((sum, s) => sum + s.steps, 0);
  const activeUsers = students.filter(s => s.steps > 0).length;
  const progressPercent = Math.min(100, Math.round((totalSteps / challenge.targetSteps) * 100 * 10) / 10);
  const totalDistanceKm = Math.round((totalSteps * 0.0007) * 100) / 100;

  // Active commute: pupils with morning steps >= 1200
  const commuters = students.filter(s => (s.morningSteps || 0) >= 1200);
  const activeCommutePercent = students.length > 0 ? Math.round((commuters.length / students.length) * 100) : 0;
  const maxStreak = Math.max(0, ...students.map(s => s.streakDays || 0));

  return {
    groupId,
    groupName: group.name,
    adminName: group.adminName,
    totalSteps,
    totalDistanceKm,
    activeUsers,
    progressPercent,
    activeCommutePercent,
    streakDays: maxStreak || 5
  };
};

export const updateStudentAvatar = (studentId: string, avatar: string): Student[] => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index !== -1) {
    students[index].avatar = avatar;
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }
  return students;
};

export const toggleStudentAnonymous = (studentId: string): Student[] => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index !== -1) {
    students[index].isAnonymous = !students[index].isAnonymous;
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }
  return students;
};

export const updateStudentMorningSteps = (studentId: string, morningSteps: number): Student[] => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index !== -1) {
    students[index].morningSteps = Math.max(0, morningSteps);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }
  return students;
};

export const resetStorage = (): void => {
  localStorage.removeItem(STORAGE_KEYS.CHALLENGES);
  localStorage.removeItem(STORAGE_KEYS.GROUPS);
  localStorage.removeItem(STORAGE_KEYS.STUDENTS);
  localStorage.removeItem(STORAGE_KEYS.SCHOOLS);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHALLENGE_ID);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_GROUP_ID);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_SCHOOL_ID);
  initializeStorage();
};
