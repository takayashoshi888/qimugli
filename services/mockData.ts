import { User, Site, Team, WorkRecord } from "../types";

type DataEntity = 'records' | 'users' | 'sites' | 'teams';

const DATA_CHANGE_EVENT = 'qimugli:data-changed';
const DATA_CHANGE_STORAGE_KEY = 'qimugli:data-changed';

const getResponseMessage = async (res: Response): Promise<string> => {
  try {
    const data = await res.json();
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }
  } catch {
    // Ignore JSON parsing errors and use fallback message below.
  }

  return `请求失败 (${res.status})`;
};

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);

  if (!res.ok) {
    throw new Error(await getResponseMessage(res));
  }

  return res.json();
};

const requestVoid = async (url: string, init?: RequestInit): Promise<void> => {
  const res = await fetch(url, init);

  if (!res.ok) {
    throw new Error(await getResponseMessage(res));
  }
};

const notifyDataChange = (entity: DataEntity) => {
  const payload = { entity, timestamp: Date.now() };

  window.dispatchEvent(new CustomEvent(DATA_CHANGE_EVENT, { detail: payload }));
  localStorage.setItem(DATA_CHANGE_STORAGE_KEY, JSON.stringify(payload));
};

export const subscribeToDataChanges = (handler: (entity?: DataEntity) => void) => {
  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<{ entity?: DataEntity }>;
    handler(customEvent.detail?.entity);
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key !== DATA_CHANGE_STORAGE_KEY || !event.newValue) {
      return;
    }

    try {
      const payload = JSON.parse(event.newValue) as { entity?: DataEntity };
      handler(payload.entity);
    } catch {
      handler();
    }
  };

  window.addEventListener(DATA_CHANGE_EVENT, handleCustomEvent as EventListener);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(DATA_CHANGE_EVENT, handleCustomEvent as EventListener);
    window.removeEventListener('storage', handleStorageEvent);
  };
};

// Data Access Objects
export const DataService = {

  getUsers: async (): Promise<User[]> => requestJson<User[]>('/api/users'),
  
  getSites: async (): Promise<Site[]> => requestJson<Site[]>('/api/sites'),
  
  getTeams: async (): Promise<Team[]> => requestJson<Team[]>('/api/teams'),
  
  getRecords: async (): Promise<WorkRecord[]> => requestJson<WorkRecord[]>('/api/records'),
  
  // Auth Operations
  login: async (username: string, password: string): Promise<User | null> => {
    try {
      const data = await requestJson<{ success: boolean; user?: User }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (data.success) {
        return data.user || null;
      }

      return null;
    } catch (e) {
      console.error('Login error:', e);
      return null;
    }
  },

  register: async (name: string, username: string, password: string): Promise<{ success: boolean, message?: string }> => {
    try {
      const result = await requestJson<{ success: boolean; message?: string }>('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password })
      });

      if (result.success) {
        notifyDataChange('users');
      }

      return result;
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // User Operations
  saveUser: async (user: User): Promise<void> => {
    const method = user.id && user.id !== '' ? 'PUT' : 'POST';
    const url = user.id && user.id !== '' ? `/api/users/${user.id}` : '/api/users';

    await requestVoid(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });

    notifyDataChange('users');
  },

  deleteUser: async (id: string): Promise<void> => {
    await requestVoid(`/api/users/${id}`, {
      method: 'DELETE'
    });

    notifyDataChange('users');
  },

  // Record Operations
  addRecord: async (record: WorkRecord): Promise<void> => {
    await requestVoid('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });

    notifyDataChange('records');
  },

  updateRecord: async (record: WorkRecord): Promise<void> => {
    await requestVoid(`/api/records/${record.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });

    notifyDataChange('records');
  },

  deleteRecord: async (id: string): Promise<void> => {
    await requestVoid(`/api/records/${id}`, {
      method: 'DELETE'
    });

    notifyDataChange('records');
  },

  updateRecordStatus: async (id: string, status: WorkRecord['status']): Promise<void> => {
    await requestVoid(`/api/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    notifyDataChange('records');
  },

  // Site Operations
  saveSite: async (site: Site): Promise<void> => {
    const method = site.id && site.id !== '' ? 'PUT' : 'POST';
    const url = site.id && site.id !== '' ? `/api/sites/${site.id}` : '/api/sites';

    await requestVoid(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(site)
    });

    notifyDataChange('sites');
  },

  deleteSite: async (id: string): Promise<void> => {
    await requestVoid(`/api/sites/${id}`, {
      method: 'DELETE'
    });

    notifyDataChange('sites');
  },

  // Team Operations
  saveTeam: async (team: Team): Promise<void> => {
    const method = team.id && team.id !== '' ? 'PUT' : 'POST';
    const url = team.id && team.id !== '' ? `/api/teams/${team.id}` : '/api/teams';

    await requestVoid(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team)
    });

    notifyDataChange('teams');
  },

  deleteTeam: async (id: string): Promise<void> => {
    await requestVoid(`/api/teams/${id}`, {
      method: 'DELETE'
    });

    notifyDataChange('teams');
  }
};

