import { User, UserRole, Site, Team, WorkRecord } from "../types";

// Initial Seed Data
const USERS: User[] = [
  { id: 'u1', name: '管理员', role: UserRole.ADMIN, avatar: 'https://picsum.photos/200/200?random=1' },
  { id: 'u2', name: '张伟', role: UserRole.STAFF, teamId: 't1', avatar: 'https://picsum.photos/200/200?random=2' },
  { id: 'u3', name: '李娜', role: UserRole.STAFF, teamId: 't1', avatar: 'https://picsum.photos/200/200?random=3' },
  { id: 'u4', name: '王强', role: UserRole.STAFF, teamId: 't2', avatar: 'https://picsum.photos/200/200?random=4' },
];

const SITES: Site[] = [
  { id: 's1', name: '滨江中心一期', address: '滨江路88号', status: 'active' },
  { id: 's2', name: '科技园北区改造', address: '科技大道102号', status: 'active' },
  { id: 's3', name: '老城维修项目', address: '解放路33号', status: 'pending' },
];

const TEAMS: Team[] = [
  { id: 't1', name: '安装一队', leaderId: 'u2' },
  { id: 't2', name: '土建二队', leaderId: 'u4' },
];

const RECORDS: WorkRecord[] = [
  {
    id: 'r1', userId: 'u2', userName: '张伟', date: '2023-10-23', dayOfWeek: '星期一',
    siteId: 's1', siteName: '滨江中心一期', headCount: 4,
    costs: { parking: 2000, transport: 5000, highway: 0 }, status: 'approved'
  },
  {
    id: 'r2', userId: 'u2', userName: '张伟', date: '2023-10-24', dayOfWeek: '星期二',
    siteId: 's1', siteName: '滨江中心一期', headCount: 4,
    costs: { parking: 2000, transport: 5000, highway: 0 }, status: 'approved'
  },
  {
    id: 'r3', userId: 'u3', userName: '李娜', date: '2023-10-23', dayOfWeek: '星期一',
    siteId: 's2', siteName: '科技园北区改造', headCount: 2,
    costs: { parking: 0, transport: 3000, highway: 1500 }, status: 'approved'
  },
  {
    id: 'r4', userId: 'u4', userName: '王强', date: '2023-10-25', dayOfWeek: '星期三',
    siteId: 's2', siteName: '科技园北区改造', headCount: 6,
    costs: { parking: 5000, transport: 10000, highway: 4000 }, status: 'submitted'
  },
];

// Helpers to simulate DB
export const getLocalData = <T extends any[]>(key: string, defaults: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }
  try {
      const parsed = JSON.parse(stored);
      // Safety filter to remove nulls which might cause crashes
      if (Array.isArray(parsed)) {
          return parsed.filter(item => item !== null) as T;
      }
      return defaults;
  } catch (e) {
      return defaults;
  }
};

export const setLocalData = <T,>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Data Access Objects
export const DataService = {
  getUsers: () => getLocalData<User[]>('app_users', USERS),
  getSites: () => getLocalData<Site[]>('app_sites', SITES),
  getTeams: () => getLocalData<Team[]>('app_teams', TEAMS),
  getRecords: () => getLocalData<WorkRecord[]>('app_records', RECORDS),
  
  // Record Operations
  addRecord: (record: WorkRecord) => {
    const records = DataService.getRecords();
    const newRecords = [record, ...records];
    setLocalData('app_records', newRecords);
    return newRecords;
  },

  updateRecord: (record: WorkRecord) => {
    const records = DataService.getRecords();
    const newRecords = records.map(r => r.id === record.id ? record : r);
    setLocalData('app_records', newRecords);
    return newRecords;
  },

  deleteRecord: (id: string) => {
    const records = DataService.getRecords();
    const newRecords = records.filter(r => r.id !== id);
    setLocalData('app_records', newRecords);
    return newRecords;
  },

  updateRecordStatus: (id: string, status: WorkRecord['status']) => {
    const records = DataService.getRecords();
    const newRecords = records.map(r => r.id === id ? { ...r, status } : r);
    setLocalData('app_records', newRecords);
    return newRecords;
  },

  // Site Operations
  saveSite: (site: Site) => {
    const sites = DataService.getSites();
    const exists = sites.find(s => s.id === site.id);
    let newSites;
    if (exists) {
      newSites = sites.map(s => s.id === site.id ? site : s);
    } else {
      newSites = [...sites, { ...site, id: Date.now().toString() }];
    }
    setLocalData('app_sites', newSites);
    return newSites;
  },

  deleteSite: (id: string) => {
    const sites = DataService.getSites();
    const newSites = sites.filter(s => s.id !== id);
    setLocalData('app_sites', newSites);
    return newSites;
  },

  // Team Operations
  saveTeam: (team: Team) => {
    const teams = DataService.getTeams();
    const exists = teams.find(t => t.id === team.id);
    let newTeams;
    if (exists) {
      newTeams = teams.map(t => t.id === team.id ? team : t);
    } else {
      newTeams = [...teams, { ...team, id: Date.now().toString() }];
    }
    setLocalData('app_teams', newTeams);
    return newTeams;
  },

  deleteTeam: (id: string) => {
    const teams = DataService.getTeams();
    const newTeams = teams.filter(t => t.id !== id);
    setLocalData('app_teams', newTeams);
    return newTeams;
  },

  // User Operations
  saveUser: (user: User) => {
    const users = DataService.getUsers();
    const exists = users.find(u => u.id === user.id);
    let newUsers;
    if (exists) {
      newUsers = users.map(u => u.id === user.id ? user : u);
    } else {
      newUsers = [...users, { ...user, id: Date.now().toString(), avatar: `https://picsum.photos/200/200?random=${Date.now()}` }];
    }
    setLocalData('app_users', newUsers);
    return newUsers;
  },

  deleteUser: (id: string) => {
    const users = DataService.getUsers();
    const newUsers = users.filter(u => u.id !== id);
    setLocalData('app_users', newUsers);
    return newUsers;
  }
};