import { type Challenge, type Group, type Student, type GroupProgress } from '../types';

const STORAGE_KEYS = {
  CHALLENGES: 'gamifiter_challenges',
  GROUPS: 'gamifiter_groups',
  STUDENTS: 'gamifiter_students',
  ACTIVE_CHALLENGE_ID: 'gamifiter_active_challenge_id',
  ACTIVE_GROUP_ID: 'gamifiter_active_group_id',
};

const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: 'challenge-1',
    name: 'Tour de Europe',
    description: 'Virtuální trasa napříč Evropou. Ujděte s celou třídou 500 000 kroků a odhalte zajímavá evropská města.',
    moduleType: 'map',
    targetSteps: 500000,
    validFrom: '2026-06-01',
    validTo: '2026-07-31',
    filePath: '/tour_de_cities.geojson'
  },
  {
    id: 'challenge-2',
    name: 'Okresy České republiky',
    description: 'Postupně odemykejte okresy ČR. Každých 5 000 kroků celé třídy odemkne jeden okres s jeho detailními statistikami.',
    moduleType: 'districts',
    targetSteps: 70000, // 14 districts in districts.geojson, 14 * 5000 = 70k steps
    validFrom: '2026-06-15',
    validTo: '2026-08-15',
    filePath: '/districts.geojson'
  },
  {
    id: 'challenge-3',
    name: 'Odkrývání: Zámek Český Krumlov',
    description: 'Zlepšete svou kondici a odhalte skrytý historický klenot z ptačí perspektivy. Každý krok pomáhá odkrýt obrázek.',
    moduleType: 'puzzle',
    targetSteps: 120000,
    validFrom: '2026-06-20',
    validTo: '2026-07-20',
    filePath: '/krumlov.jpg'
  },
  {
    id: 'challenge-4',
    name: 'Zaostřování: Tajemství DNA',
    description: 'Každý krok zpřesňuje vaše vidění světa. Vyostřete detailní makro snímek DNA řetězce a získejte edukační bonus.',
    moduleType: 'pixelate',
    targetSteps: 100000,
    validFrom: '2026-06-10',
    validTo: '2026-07-10',
    filePath: '/dna.jpg'
  },
  {
    id: 'challenge-5',
    name: 'Síťování: Lidské tělo',
    description: 'Propojte uzly nervové soustavy. Aktivita celé třídy buduje komplexní neuronovou síť.',
    moduleType: 'network',
    targetSteps: 80000,
    validFrom: '2026-06-05',
    validTo: '2026-07-05',
    filePath: '/dataset.json'
  }
];

const DEFAULT_GROUPS: Group[] = [
  { id: 'group-1', name: 'Třída 8.A (FTK UP)', adminName: 'David Prycl' }
];

const DEFAULT_STUDENTS: Student[] = [
  { id: 'student-1', name: 'David Prycl', groupId: 'group-1', steps: 6464 }
];

export const initializeStorage = (): void => {
  if (!localStorage.getItem(STORAGE_KEYS.CHALLENGES)) {
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(DEFAULT_CHALLENGES));
  }

  // Ensure clean groups without old demo teacher accounts
  const existingGroupsRaw = localStorage.getItem(STORAGE_KEYS.GROUPS);
  if (!existingGroupsRaw) {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(DEFAULT_GROUPS));
  } else {
    try {
      const groups: Group[] = JSON.parse(existingGroupsRaw);
      const cleaned = groups
        .filter(g => !g.adminName?.includes('Heidler') && g.id !== 'group-2')
        .map(g => ({
          ...g,
          adminName: g.adminName?.includes('Vorlíček') ? 'David Prycl' : (g.adminName || 'David Prycl')
        }));
      if (cleaned.length === 0) {
        cleaned.push(...DEFAULT_GROUPS);
      }
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(cleaned));
    } catch {
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(DEFAULT_GROUPS));
    }
  }

  // Purge old mock students (Heidler, Vorlíček, Nováková, Horák, Malá, Velký, Černá, Bílý)
  const existingStudentsRaw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  if (!existingStudentsRaw) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
  } else {
    try {
      const students: Student[] = JSON.parse(existingStudentsRaw);
      const mockNames = ['Heidler', 'Vorlíček', 'Nováková', 'Horák', 'Malá', 'Velký', 'Černá', 'Bílý'];
      let cleaned = students.filter(s => !mockNames.some(m => s.name.includes(m)));
      
      const david = cleaned.find(s => s.name.includes('David Prycl') || s.id === 'student-1');
      if (!david) {
        cleaned.unshift({ id: 'student-1', name: 'David Prycl', groupId: 'group-1', steps: 6464 });
      } else {
        // If David's steps are inflated from previous cumulative additions (104 620 or >= 50 000), reset to real baseline 6464
        if (david.steps >= 50000 || david.steps === 104620) {
          david.steps = 6464;
        }
      }
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(cleaned));
    } catch {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_CHALLENGE_ID)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHALLENGE_ID, DEFAULT_CHALLENGES[0].id);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_GROUP_ID)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP_ID, DEFAULT_GROUPS[0].id);
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

export const addGroup = (name: string, adminName: string): Group => {
  const groups = getGroups();
  const newGroup: Group = {
    id: `group-${Date.now()}`,
    name,
    adminName
  };
  groups.push(newGroup);
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  return newGroup;
};

export const removeGroup = (groupId: string): Group[] => {
  const groups = getGroups();
  const filtered = groups.filter(g => g.id !== groupId);
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(filtered));
  
  // Clean up students
  const students = getStudents();
  const studentsFiltered = students.filter(s => s.groupId !== groupId);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(studentsFiltered));

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
  return newChallenge;
};

export const removeChallenge = (challengeId: string): Challenge[] => {
  const challenges = getChallenges();
  const filtered = challenges.filter(c => c.id !== challengeId);
  localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(filtered));
  
  // Fallback active challenge if deleted
  if (getActiveChallengeId() === challengeId && filtered.length > 0) {
    setActiveChallengeId(filtered[0].id);
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
  
  // Calculate virtual distance: average step is 0.7 meters
  const totalDistanceKm = Math.round((totalSteps * 0.0007) * 100) / 100;

  return {
    groupId,
    groupName: group.name,
    adminName: group.adminName,
    totalSteps,
    totalDistanceKm,
    activeUsers,
    progressPercent
  };
};

export const resetStorage = (): void => {
  localStorage.removeItem(STORAGE_KEYS.CHALLENGES);
  localStorage.removeItem(STORAGE_KEYS.GROUPS);
  localStorage.removeItem(STORAGE_KEYS.STUDENTS);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHALLENGE_ID);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_GROUP_ID);
  initializeStorage();
};
