'use client';

import type { QuestionBank, Question } from '@/types';

const STORAGE_KEY = 'question_banks';

// 题库服务 - 使用 localStorage
export const localBankService = {
  // 获取所有题库
  async getAll(): Promise<QuestionBank[]> {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  // 根据 ID 获取题库
  async getById(id: string): Promise<QuestionBank | null> {
    const banks = await this.getAll();
    return banks.find(b => b.id === id) || null;
  },

  // 创建题库
  async create(bank: Omit<QuestionBank, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuestionBank> {
    const banks = await this.getAll();
    const now = new Date().toISOString();

    const newBank: QuestionBank = {
      id: crypto.randomUUID(),
      name: bank.name,
      description: bank.description,
      questionIds: bank.questionIds || [],
      createdAt: now,
      updatedAt: now,
    };

    banks.push(newBank);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(banks));

    return newBank;
  },

  // 更新题库
  async update(id: string, updates: Partial<Omit<QuestionBank, 'id' | 'createdAt' | 'updatedAt'>>): Promise<QuestionBank> {
    const banks = await this.getAll();
    const index = banks.findIndex(b => b.id === id);

    if (index === -1) {
      throw new Error('题库不存在');
    }

    const updatedBank = {
      ...banks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    banks[index] = updatedBank;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(banks));

    return updatedBank;
  },

  // 删除题库
  async delete(id: string): Promise<void> {
    const banks = await this.getAll();
    const filtered = banks.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  // 添加题目到题库
  async addQuestion(bankId: string, questionId: string): Promise<QuestionBank> {
    const bank = await this.getById(bankId);
    if (!bank) throw new Error('题库不存在');

    const newQuestionIds = [...bank.questionIds, questionId];
    return this.update(bankId, { questionIds: newQuestionIds });
  },

  // 从题库移除题目
  async removeQuestion(bankId: string, questionId: string): Promise<QuestionBank> {
    const bank = await this.getById(bankId);
    if (!bank) throw new Error('题库不存在');

    const newQuestionIds = bank.questionIds.filter(id => id !== questionId);
    return this.update(bankId, { questionIds: newQuestionIds });
  },

  // 获取题库中的所有题目
  async getQuestions(bankId: string, questionService: any): Promise<Question[]> {
    const bank = await this.getById(bankId);
    if (!bank) return [];

    if (bank.questionIds.length === 0) return [];

    // 从 questionService 获取所有题目
    const allQuestions = await questionService.getAll();

    // 过滤出题库中的题目，并保持顺序
    return bank.questionIds
      .map(id => allQuestions.find((q: Question) => q.id === id))
      .filter((q): q is Question => q !== undefined);
  },
};
