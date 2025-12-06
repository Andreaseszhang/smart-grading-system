'use client';

import type { Question, Submission, QuestionBank } from '@/types';

/**
 * Client-side API service for questions
 * Replaces localStorage with API calls while maintaining the same interface
 */
export const questionService = {
  async create(question: Omit<Question, 'id' | 'createdAt'>): Promise<Question> {
    const response = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '创建题目失败');
    }

    const result = await response.json();
    return result.data;
  },

  async getAll(): Promise<Question[]> {
    const response = await fetch('/api/questions');

    if (!response.ok) {
      throw new Error('获取题目列表失败');
    }

    const result = await response.json();
    return result.data;
  },

  async getById(id: string): Promise<Question | null> {
    const response = await fetch(`/api/questions/${id}`);

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data;
  },

  async update(
    id: string,
    updates: Partial<Omit<Question, 'id' | 'createdAt'>>
  ): Promise<Question> {
    const response = await fetch(`/api/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '更新题目失败');
    }

    const result = await response.json();
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/questions/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '删除题目失败');
    }
  },
};

/**
 * Client-side API service for submissions
 */
export const submissionService = {
  async create(
    submission: Omit<
      Submission,
      'id' | 'submittedAt' | 'reviewCount' | 'lastReviewAt'
    >
  ): Promise<Submission> {
    const response = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '创建答题记录失败');
    }

    const result = await response.json();
    return result.data;
  },

  async getAll(): Promise<Submission[]> {
    const response = await fetch('/api/submissions');

    if (!response.ok) {
      throw new Error('获取答题记录失败');
    }

    const result = await response.json();
    return result.data;
  },

  async getById(id: string): Promise<Submission | null> {
    const response = await fetch(`/api/submissions/${id}`);

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data;
  },

  async getByQuestionId(questionId: string): Promise<Submission[]> {
    const response = await fetch(`/api/submissions?questionId=${questionId}`);

    if (!response.ok) {
      throw new Error('获取题目答题记录失败');
    }

    const result = await response.json();
    return result.data;
  },

  async getWrongAnswers(): Promise<Submission[]> {
    return this.getWrong();
  },

  async getWrong(): Promise<Submission[]> {
    const response = await fetch('/api/submissions?wrong=true');

    if (!response.ok) {
      throw new Error('获取错题失败');
    }

    const result = await response.json();
    return result.data;
  },

  async getNeedReview(): Promise<Submission[]> {
    const response = await fetch('/api/submissions?needReview=true');

    if (!response.ok) {
      throw new Error('获取复习列表失败');
    }

    const result = await response.json();
    return result.data;
  },

  async update(
    id: string,
    updates: Partial<Omit<Submission, 'id' | 'submittedAt'>>
  ): Promise<Submission> {
    const response = await fetch(`/api/submissions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '更新答题记录失败');
    }

    const result = await response.json();
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/submissions/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '删除答题记录失败');
    }
  },

  async incrementReviewCount(id: string): Promise<void> {
    await this.markReviewed(id);
  },

  async markReviewed(id: string): Promise<void> {
    const response = await fetch(`/api/submissions/${id}/review`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '标记复习失败');
    }
  },
};

/**
 * Client-side API service for question banks
 */
export const questionBankService = {
  async create(
    bank: Omit<QuestionBank, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<QuestionBank> {
    const response = await fetch('/api/question-banks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bank),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '创建题库失败');
    }

    const result = await response.json();
    return result.data;
  },

  async getAll(): Promise<QuestionBank[]> {
    const response = await fetch('/api/question-banks');

    if (!response.ok) {
      throw new Error('获取题库列表失败');
    }

    const result = await response.json();
    return result.data;
  },

  async getById(id: string): Promise<QuestionBank | null> {
    const response = await fetch(`/api/question-banks/${id}`);

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data;
  },

  async update(
    id: string,
    updates: Partial<Omit<QuestionBank, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<QuestionBank> {
    const response = await fetch(`/api/question-banks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '更新题库失败');
    }

    const result = await response.json();
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/question-banks/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '删除题库失败');
    }
  },

  async addQuestion(bankId: string, questionId: string): Promise<QuestionBank> {
    const response = await fetch(`/api/question-banks/${bankId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '添加题目失败');
    }

    const result = await response.json();
    return result.data;
  },

  async removeQuestion(
    bankId: string,
    questionId: string
  ): Promise<QuestionBank> {
    const response = await fetch(`/api/question-banks/${bankId}/questions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '移除题目失败');
    }

    const result = await response.json();
    return result.data;
  },

  async getQuestions(
    bankId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    questionServiceInstance?: typeof questionService
  ): Promise<Question[]> {
    const bank = await this.getById(bankId);
    if (!bank || bank.questionIds.length === 0) {
      return [];
    }

    // Fetch all questions
    const allQuestions = await questionService.getAll();

    // Filter and maintain order based on questionIds
    return bank.questionIds
      .map((id) => allQuestions.find((q) => q.id === id))
      .filter((q): q is Question => q !== undefined);
  },
};
