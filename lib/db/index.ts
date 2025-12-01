'use client';

import Dexie, { Table } from 'dexie';
import type { Question, Submission, AIConfig } from '@/types';

// 导出 Supabase 版本的题目和答题服务
export { questionService, submissionService } from './supabase-service';

// 导出 localStorage 版本的题库服务
export { localBankService as questionBankService } from './local-bank-service';

// Dexie 数据库类（仅用于 AI 配置）
export class GradingDatabase extends Dexie {
  configs!: Table<AIConfig, string>;

  constructor() {
    super('GradingDB');

    // 定义 Schema（只保留 configs）
    this.version(2).stores({
      configs: 'id, provider',
    });
  }
}

// 导出单例
export const db = new GradingDatabase();

// AI 配置服务
export const aiConfigService = {
  async add(config: AIConfig) {
    await db.configs.put(config);
    return config;
  },

  async save(config: Omit<AIConfig, 'id' | 'updatedAt'>) {
    const newConfig: AIConfig = {
      id: config.provider,
      ...config,
      updatedAt: new Date().toISOString(),
    };
    await db.configs.put(newConfig);
    return newConfig;
  },

  async get(provider: string) {
    return await db.configs.get(provider);
  },

  async getAll() {
    return await db.configs.toArray();
  },

  async update(id: string, updates: Partial<AIConfig>) {
    await db.configs.update(id, updates);
  },

  async delete(provider: string) {
    await db.configs.delete(provider);
  },
};

// Export alias for backward compatibility
export const configService = aiConfigService;
