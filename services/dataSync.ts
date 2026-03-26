import { WorkRecord } from '../types';
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

    private getRecordStorageKey(userId: string): string {
        return `records_${userId}`;
    }

    private async getLocalRecords(userId: string): Promise<WorkRecord[]> {
        let records = await this.loadFromIndexedDB(this.getRecordStorageKey(userId));

        if (!records) {
            records = this.loadFromLocal(this.getRecordStorageKey(userId));
        }

        return Array.isArray(records) ? records : [];
    }

    private async persistRecords(userId: string, records: WorkRecord[]): Promise<void> {
        const storageKey = this.getRecordStorageKey(userId);
        await this.saveToIndexedDB(storageKey, records);
        this.saveToLocal(storageKey, records);
    }

    async saveRecords(records: WorkRecord[], userId: string): Promise<{success: boolean, message: string}> {
        try {
            const existingRecords = await this.getLocalRecords(userId);
            const mergedRecords = this.mergeRecords(existingRecords, records);
            
            await this.persistRecords(userId, mergedRecords);
            
            return { success: true, message: '本地缓存已更新' };
        } catch (error) {
            console.error('Save records failed:', error);
            return { success: false, message: '保存失败' };
        }
    }

    async removeRecord(recordId: string, userId: string): Promise<void> {
        const existingRecords = await this.getLocalRecords(userId);
        const nextRecords = existingRecords.filter((record) => record.id !== recordId);
        await this.persistRecords(userId, nextRecords);
    }

    private mergeRecords(existing: WorkRecord[], newRecords: WorkRecord[]): WorkRecord[] {
        const recordMap = new Map(existing.map(r => [r.id, r]));
        newRecords.forEach(r => recordMap.set(r.id, r));
        return Array.from(recordMap.values()).sort((left, right) => right.date.localeCompare(left.date));
    }

    async getRecords(userId: string): Promise<WorkRecord[]> {
        try {
            if (navigator.onLine) {
                const apiRecords = await DataService.getRecords();
                const userRecords = apiRecords.filter((record) => record.userId === userId);
                await this.persistRecords(userId, userRecords);
                return userRecords;
            }

            return await this.getLocalRecords(userId);
        } catch (error) {
            console.error('Failed to get records:', error);
            return await this.getLocalRecords(userId);
        }
    }

    async syncPendingRecords(): Promise<{success: boolean, message: string}> {
        if (!navigator.onLine) {
            return { success: false, message: '当前离线，将继续使用本地缓存' };
        }
        
        try {
            return { success: true, message: '已连接后台数据源' };
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
