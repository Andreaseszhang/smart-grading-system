'use client';

import Dexie, { Table } from 'dexie';
import type { AIConfig } from '@/types';

// 导出 API 客户端版本的所有服务 (替换 localStorage)
export {
  questionService,
  submissionService,
  questionBankService,
} from './api-client-service';

// Dexie 数据库类（仅用于 AI 配置）
export class GradingDatabase extends Dexie {
  configs!: Table<AIConfig, string>;

  constructor() {
    super('GradingDB');

    // 定义 Schema（只保留 configs）
    this.version(2).stores({
      configs: 'id',
    });
  }
}

// 导出单例
export const db = new GradingDatabase();

// AI 配置服务（仅用于存储模型选择偏好）
export const aiConfigService = {
  async add(config: AIConfig) {
    await db.configs.put(config);
    return config;
  },

  async save(config: Omit<AIConfig, 'id' | 'updatedAt'>) {
    const newConfig: AIConfig = {
      id: 'default',
      ...config,
      updatedAt: new Date().toISOString(),
    };
    await db.configs.put(newConfig);
    return newConfig;
  },

  async get(id: string = 'default') {
    return await db.configs.get(id);
  },

  async getAll() {
    return await db.configs.toArray();
  },

  async update(id: string, updates: Partial<AIConfig>) {
    await db.configs.update(id, updates);
  },

  async delete(id: string) {
    await db.configs.delete(id);
  },
};

// Export alias for backward compatibility
export const configService = aiConfigService;
