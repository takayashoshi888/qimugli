import { WorkRecord, User, Site, Team } from '../types';
import { DataService } from './mockData';

interface SyncMetadata {
  lastSync: number;
  syncId: string;
  version: number;
}

class DataSync {
    private dbName = 'qimugli_sync_db';
    private dbVersion = 1;
    private storeName = 'work_records';
    private db: IDBDatabase | null = null;

    constructor() {
    }

    async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('IndexedDB initialization error');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
            };
        });
    }

    saveToLocal(key: string, value: any): void {
        localStorage.setItem(key, JSON.stringify(value));
    }

    loadFromLocal(key: string): any {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    async saveToIndexedDB(key: string, value: any): Promise<void> {
        if (!this.db) await this.initialize();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put({ id: key, data: value, timestamp: Date.now() });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async loadFromIndexedDB(key: string): Promise<any> {
        if (!this.db) await this.initialize();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result.data);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    async getAllFromIndexedDB(): Promise<any[]> {
        if (!this.db) await this.initialize();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async saveRecords(records: WorkRecord[], userId: string): Promise<{success: boolean, message: string}> {
        try {
            // First save to IndexedDB
            const existingRecords = await this.getRecords(userId);
            const mergedRecords = this.mergeRecords(existingRecords, records);
            
            await this.saveToIndexedDB(`records_${userId}`, mergedRecords);
            
            // Backup to local storage
            this.saveToLocal(`records_${userId}`, mergedRecords);
            
            return { success: true, message: '数据已安全存储' };
        } catch (error) {
            console.error('Save records failed:', error);
            return { success: false, message: '保存失败' };
        }
    }

    private mergeRecords(existing: WorkRecord[], newRecords: WorkRecord[]): WorkRecord[] {
        const recordMap = new Map(existing.map(r => [r.id, r]));
        newRecords.forEach(r => recordMap.set(r.id, r));
        return Array.from(recordMap.values());
    }

    async getRecords(userId: string): Promise<WorkRecord[]> {
        try {
            // Try IndexedDB first
            let records = await this.loadFromIndexedDB(`records_${userId}`);
            
            // Fallback to local storage
            if (!records) {
                records = this.loadFromLocal(`records_${userId}`);
            }
            
            // Fallback to mock API if no local data
            if (!records || records.length === 0) {
                const apiRecords = await DataService.getRecords();
                records = apiRecords.filter(r => r.userId === userId);
                if (records.length > 0) {
                     await this.saveToIndexedDB(`records_${userId}`, records);
                     this.saveToLocal(`records_${userId}`, records);
                }
            }
            
            return records || [];
        } catch (error) {
            console.error('Failed to get records:', error);
            // Emergency fallback
            return this.loadFromLocal(`records_${userId}`) || [];
        }
    }

    async syncPendingRecords(): Promise<{success: boolean, message: string}> {
        if (!navigator.onLine) {
            return { success: false, message: '当前离线，稍后将自动同步' };
        }
        
        try {
            // This would normally check for unsynced items and POST to API
            // For now, we simulate syncing pending items
            return { success: true, message: '后台同步完成' };
        } catch (error) {
            console.error('Sync failed:', error);
            return { success: false, message: '同步过程出错' };
        }
    }

    async getStorageStats(): Promise<any> {
        try {
            let totalBytes = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    const value = localStorage.getItem(key) || '';
                    totalBytes += key.length + value.length;
                }
            }
            return {
                localStorageSize: `${(totalBytes / 1024).toFixed(2)} KB`,
                status: navigator.onLine ? '在线' : '离线 (自动缓存)'
            };
        } catch (e) {
            return { status: '未知' };
        }
    }

    async exportData(): Promise<string> {
        if (!this.db) await this.initialize();
        const allData = await this.getAllFromIndexedDB();
        return JSON.stringify({
            version: 1,
            timestamp: Date.now(),
            data: allData
        });
    }

    async importData(jsonData: string): Promise<void> {
        if (!this.db) await this.initialize();
        try {
            const parsed = JSON.parse(jsonData);
            if (!parsed.data || !Array.isArray(parsed.data)) throw new Error('Invalid format');
            
            for (const item of parsed.data) {
                if (item.id && item.data) {
                    await this.saveToIndexedDB(item.id, item.data);
                }
            }
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }
}

export const dataSyncManager = new DataSync();
export default DataSync;