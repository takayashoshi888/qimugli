import { User, Site, Team, WorkRecord } from "../types";

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

// Data Access Objects
export const DataService = {

  getUsers: async (): Promise<User[]> => {
    const res = await fetch('/api/users');
    return res.json();
  },
  
  getSites: async (): Promise<Site[]> => {
    const res = await fetch('/api/sites');
    return res.json();
  },
  
  getTeams: async (): Promise<Team[]> => {
    const res = await fetch('/api/teams');
    return res.json();
  },
  
  getRecords: async (): Promise<WorkRecord[]> => {
    const res = await fetch('/api/records');
    return res.json();
  },
  
  // Auth Operations
  login: async (username: string, password: string): Promise<User | null> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        return data.user;
      }
      return null;
    } catch (e) {
      console.error('Login error:', e);
      return null;
    }
  },

  register: async (name: string, username: string, password: string): Promise<{ success: boolean, message?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  // User Operations
  saveUser: async (user: User): Promise<void> => {
    const method = user.id && user.id !== '' ? 'PUT' : 'POST';
    const url = user.id && user.id !== '' ? `/api/users/${user.id}` : '/api/users';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
  },

  deleteUser: async (id: string): Promise<void> => {
    await fetch(`/api/users/${id}`, {
      method: 'DELETE'
    });
  },

  // Record Operations
  addRecord: async (record: WorkRecord): Promise<void> => {
    await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  },

  updateRecord: async (record: WorkRecord): Promise<void> => {
    await fetch(`/api/records/${record.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  },

  deleteRecord: async (id: string): Promise<void> => {
    await fetch(`/api/records/${id}`, {
      method: 'DELETE'
    });
  },

  updateRecordStatus: async (id: string, status: WorkRecord['status']): Promise<void> => {
    await fetch(`/api/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },

  // Site Operations
  saveSite: async (site: Site): Promise<void> => {
    const method = site.id && site.id !== '' ? 'PUT' : 'POST';
    const url = site.id && site.id !== '' ? `/api/sites/${site.id}` : '/api/sites';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(site)
    });
  },

  deleteSite: async (id: string): Promise<void> => {
    await fetch(`/api/sites/${id}`, {
      method: 'DELETE'
    });
  },

  // Team Operations
  saveTeam: async (team: Team): Promise<void> => {
    const method = team.id && team.id !== '' ? 'PUT' : 'POST';
    const url = team.id && team.id !== '' ? `/api/teams/${team.id}` : '/api/teams';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team)
    });

    if (!res.ok) {
      throw new Error(await getResponseMessage(res));
    }
  },


  deleteTeam: async (id: string): Promise<void> => {
    await fetch(`/api/teams/${id}`, {
      method: 'DELETE'
    });
  }
};
