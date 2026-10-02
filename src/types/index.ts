export type ModuleType = 'map' | 'districts' | 'puzzle' | 'pixelate' | 'network';

export interface Challenge {
  id: string;
  name: string;
  description: string;
  moduleType: ModuleType;
  targetSteps: number;
  validFrom: string;
  validTo: string;
  filePath: string;
}

export interface Group {
  id: string;
  name: string;
  adminName: string;
}

export interface Student {
  id: string;
  name: string;
  groupId: string;
  steps: number; // accumulated steps for current challenge
  device?: string; // 'Garmin Vívoactive 4' | 'Google Fit (Android)' | 'Apple Zdraví' | 'Telefon v kapse'
  lastSync?: string;
  isReal?: boolean;
}

export interface GroupProgress {
  groupId: string;
  groupName: string;
  adminName: string;
  totalSteps: number;
  totalDistanceKm: number;
  activeUsers: number;
  progressPercent: number;
}
