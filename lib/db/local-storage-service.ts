import type { Question, Submission, QuestionBank } from '@/types';

const QUESTIONS_KEY = 'grading_questions';
const SUBMISSIONS_KEY = 'grading_submissions';
const BANKS_KEY = 'grading_banks';

// 题目服务 - 使用 localStorage
export const questionService = {
  async create(question: Omit<Question, 'id' | 'createdAt'>): Promise<Question> {
    if (typeof window === 'undefined') throw new Error('localStorage only works in browser');

    const newQuestion: Question = {
      id: crypto.randomUUID(),
      ...question,
      createdAt: new Date().toISOString(),
    };

    const questions = await this.getAll();
    questions.push(newQuestion);
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));

    return newQuestion;
  },

  async getAll(): Promise<Question[]> {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(QUESTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  async getById(id: string): Promise<Question | null> {
    const questions = await this.getAll();
    return questions.find(q => q.id === id) || null;
  },

  async update(id: string, updates: Partial<Omit<Question, 'id' | 'createdAt'>>): Promise<Question> {
    const questions = await this.getAll();
    const index = questions.findIndex(q => q.id === id);

    if (index === -1) throw new Error('题目不存在');

    questions[index] = { ...questions[index], ...updates };
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));

    return questions[index];
  },

  async delete(id: string): Promise<void> {
    const questions = await this.getAll();
    const filtered = questions.filter(q => q.id !== id);
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(filtered));
  },
};

// 答题记录服务 - 使用 localStorage
export const submissionService = {
  async create(submission: Omit<Submission, 'id' | 'submittedAt' | 'reviewCount' | 'lastReviewAt'>): Promise<Submission> {
    if (typeof window === 'undefined') throw new Error('localStorage only works in browser');

    const now = new Date().toISOString();
    const newSubmission: Submission = {
      id: crypto.randomUUID(),
      ...submission,
      submittedAt: now,
      reviewCount: 0,
      lastReviewAt: undefined,
    };

    const submissions = await this.getAll();
    submissions.push(newSubmission);
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));

    return newSubmission;
  },

  async getAll(): Promise<Submission[]> {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(SUBMISSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  async getById(id: string): Promise<Submission | null> {
    const submissions = await this.getAll();
    return submissions.find(s => s.id === id) || null;
  },

  async getByQuestionId(questionId: string): Promise<Submission[]> {
    const submissions = await this.getAll();
    return submissions.filter(s => s.questionId === questionId);
  },

  async getWrongAnswers(): Promise<Submission[]> {
    const submissions = await this.getAll();
    return submissions.filter(s => s.isWrong);
  },

  async getWrong(): Promise<Submission[]> {
    const submissions = await this.getAll();
    return submissions.filter(s => s.isWrong);
  },

  async getNeedReview(): Promise<Submission[]> {
    const submissions = await this.getAll();
    return submissions.filter(s => s.isWrong && s.reviewCount === 0);
  },

  async update(id: string, updates: Partial<Omit<Submission, 'id' | 'submittedAt'>>): Promise<Submission> {
    const submissions = await this.getAll();
    const index = submissions.findIndex(s => s.id === id);

    if (index === -1) throw new Error('答题记录不存在');

    submissions[index] = { ...submissions[index], ...updates };
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));

    return submissions[index];
  },

  async delete(id: string): Promise<void> {
    const submissions = await this.getAll();
    const filtered = submissions.filter(s => s.id !== id);
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(filtered));
  },

  async incrementReviewCount(id: string): Promise<void> {
    const submission = await this.getById(id);
    if (!submission) throw new Error('答题记录不存在');

    await this.update(id, {
      reviewCount: submission.reviewCount + 1,
      lastReviewAt: new Date().toISOString(),
    });
  },

  async markReviewed(id: string): Promise<void> {
    await this.incrementReviewCount(id);
  },
};

// 题库服务 - 使用 localStorage
export const questionBankService = {
  async create(bank: Omit<QuestionBank, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuestionBank> {
    if (typeof window === 'undefined') throw new Error('localStorage only works in browser');

    const now = new Date().toISOString();
    const newBank: QuestionBank = {
      id: crypto.randomUUID(),
      name: bank.name,
      description: bank.description,
      questionIds: bank.questionIds || [],
      createdAt: now,
      updatedAt: now,
    };

    const banks = await this.getAll();
    banks.push(newBank);
    localStorage.setItem(BANKS_KEY, JSON.stringify(banks));

    return newBank;
  },

  async getAll(): Promise<QuestionBank[]> {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(BANKS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  async getById(id: string): Promise<QuestionBank | null> {
    const banks = await this.getAll();
    return banks.find(b => b.id === id) || null;
  },

  async update(id: string, updates: Partial<Omit<QuestionBank, 'id' | 'createdAt' | 'updatedAt'>>): Promise<QuestionBank> {
    const banks = await this.getAll();
    const index = banks.findIndex(b => b.id === id);

    if (index === -1) throw new Error('题库不存在');

    banks[index] = {
      ...banks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(BANKS_KEY, JSON.stringify(banks));

    return banks[index];
  },

  async delete(id: string): Promise<void> {
    const banks = await this.getAll();
    const filtered = banks.filter(b => b.id !== id);
    localStorage.setItem(BANKS_KEY, JSON.stringify(filtered));
  },

  async addQuestion(bankId: string, questionId: string): Promise<QuestionBank> {
    const bank = await this.getById(bankId);
    if (!bank) throw new Error('题库不存在');

    if (bank.questionIds.includes(questionId)) {
      return bank; // 已存在，直接返回
    }

    const newQuestionIds = [...bank.questionIds, questionId];
    return this.update(bankId, { questionIds: newQuestionIds });
  },

  async removeQuestion(bankId: string, questionId: string): Promise<QuestionBank> {
    const bank = await this.getById(bankId);
    if (!bank) throw new Error('题库不存在');

    const newQuestionIds = bank.questionIds.filter(id => id !== questionId);
    return this.update(bankId, { questionIds: newQuestionIds });
  },

  async getQuestions(bankId: string, questionServiceInstance: typeof questionService): Promise<Question[]> {
    const bank = await this.getById(bankId);
    if (!bank) return [];

    if (bank.questionIds.length === 0) return [];

    const allQuestions = await questionServiceInstance.getAll();
    return bank.questionIds
      .map(id => allQuestions.find(q => q.id === id))
      .filter((q): q is Question => q !== undefined);
  },
};
