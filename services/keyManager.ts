
import { APIKey } from "../types";

export class KeyManager {
  private static STORAGE_KEY = 'oloro_api_keys';

  static getKeys(): APIKey[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static addKey(key: string, label: string): APIKey {
    const keys = this.getKeys();
    const newKey: APIKey = {
      id: Date.now().toString(),
      key,
      label,
      isActive: true,
      errorCount: 0,
      usage: {
        totalRequests: 0,
        totalTokens: 0,
        cost: 0,
        lastUsed: null
      }
    };
    keys.push(newKey);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
    return newKey;
  }

  static removeKey(id: string) {
    const keys = this.getKeys().filter(k => k.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
  }

  static getActiveKey(): APIKey | null {
    const keys = this.getKeys();
    // Rotation Strategy: Round robin or first healthy
    // For simplicity, find the first active healthy key.
    // In production, we might want to load balance based on rate limits.
    const activeKey = keys.find(k => k.isActive && k.errorCount < 3);
    
    if (!activeKey && keys.length > 0) {
        // If all are errored, try to reset one? Or just return null.
        console.warn("No healthy keys available.");
    }
    return activeKey || null;
  }

  static logUsage(keyId: string, tokens: number) {
    const keys = this.getKeys();
    const keyIndex = keys.findIndex(k => k.id === keyId);
    
    if (keyIndex !== -1) {
      const key = keys[keyIndex];
      key.usage.totalRequests += 1;
      key.usage.totalTokens += tokens;
      // Estimated cost: ~$0.10 per 1M tokens (Flash blended rate approx)
      key.usage.cost += (tokens / 1000000) * 0.10; 
      key.usage.lastUsed = new Date().toISOString();
      key.errorCount = 0; // Reset errors on success
      
      keys[keyIndex] = key;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
    }
  }

  static reportError(keyId: string, errorMsg: string) {
    const keys = this.getKeys();
    const keyIndex = keys.findIndex(k => k.id === keyId);
    
    if (keyIndex !== -1) {
      const key = keys[keyIndex];
      key.errorCount += 1;
      key.lastError = errorMsg;
      
      if (key.errorCount >= 3) {
          // Temporarily disable if too many errors
          // key.isActive = false; 
      }
      
      keys[keyIndex] = key;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
    }
  }
}
