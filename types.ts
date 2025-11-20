
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export interface User {
  id: string;
  name: string;
  username: string; // Added for login
  password?: string; // Added for auth (stored locally for demo)
  role: UserRole;
  teamId?: string;
  avatar?: string;
}

export interface Site {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'completed' | 'pending';
}

export interface Team {
  id: string;
  name: string;
  leaderId: string;
}

export interface Cost {
  parking: number;
  transport: number;
  highway: number;
}

export interface WorkRecord {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  siteId: string;
  siteName: string;
  headCount: number;
  costs: Cost;
  notes?: string;
  status: 'submitted' | 'approved' | 'rejected';
  teamId?: string;
  teamName?: string;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string; // rgb value e.g., '37 99 235'
}

export interface AppState {
  currentUser: User | null;
  view: 'login' | 'client-dashboard' | 'client-history' | 'admin-dashboard' | 'admin-records' | 'admin-users' | 'admin-sites';
}
