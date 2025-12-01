import { supabase } from '@/lib/supabase';
import type { Question, Submission, QuestionBank } from '@/types';

// 题目服务 - 使用 Supabase
export const questionService = {
  async create(question: Omit<Question, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('questions')
      .insert({
        title: question.title,
        question_text: question.questionText,
        reference_answer: question.referenceAnswer,
        scoring_criteria: question.scoringCriteria,
        total_score: question.totalScore || 5,
      })
      .select()
      .single();

    if (error) throw error;

    // 转换数据库字段到前端格式
    return {
      id: data.id,
      title: data.title,
      questionText: data.question_text,
      referenceAnswer: data.reference_answer,
      scoringCriteria: data.scoring_criteria,
      totalScore: data.total_score,
      createdAt: data.created_at,
    } as Question;
  },

  async getAll(): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 转换数据库字段到前端格式
    return (data || []).map((q) => ({
      id: q.id,
      title: q.title,
      questionText: q.question_text,
      referenceAnswer: q.reference_answer,
      scoringCriteria: q.scoring_criteria,
      totalScore: q.total_score,
      createdAt: q.created_at,
    }));
  },

  async getById(id: string): Promise<Question | null> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // 未找到
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      questionText: data.question_text,
      referenceAnswer: data.reference_answer,
      scoringCriteria: data.scoring_criteria,
      totalScore: data.total_score,
      createdAt: data.created_at,
    };
  },

  async update(id: string, updates: Partial<Omit<Question, 'id' | 'createdAt'>>) {
    const updateData: any = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.questionText !== undefined) updateData.question_text = updates.questionText;
    if (updates.referenceAnswer !== undefined) updateData.reference_answer = updates.referenceAnswer;
    if (updates.scoringCriteria !== undefined) updateData.scoring_criteria = updates.scoringCriteria;
    if (updates.totalScore !== undefined) updateData.total_score = updates.totalScore;

    const { data, error } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      questionText: data.question_text,
      referenceAnswer: data.reference_answer,
      scoringCriteria: data.scoring_criteria,
      totalScore: data.total_score,
      createdAt: data.created_at,
    } as Question;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// 答题记录服务 - 使用 Supabase
export const submissionService = {
  async create(submission: Omit<Submission, 'id' | 'submittedAt' | 'gradedAt'>): Promise<Submission> {
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        question_id: submission.questionId,
        question_text: submission.questionText,
        student_answer: submission.studentAnswer,
        score: submission.score,
        score_label: submission.scoreLabel,
        upgrade_answer: submission.upgradeAnswer,
        feedback: submission.feedback,
        encouragement: submission.encouragement,
        is_wrong: submission.isWrong,
        review_count: submission.reviewCount || 0,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      questionId: data.question_id,
      questionText: data.question_text,
      studentAnswer: data.student_answer,
      score: data.score,
      scoreLabel: data.score_label,
      upgradeAnswer: data.upgrade_answer,
      feedback: data.feedback,
      encouragement: data.encouragement,
      isWrong: data.is_wrong,
      reviewCount: data.review_count,
      lastReviewAt: data.last_review_at,
      submittedAt: data.submitted_at,
      gradedAt: data.graded_at,
    };
  },

  async getAll(): Promise<Submission[]> {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((s) => ({
      id: s.id,
      questionId: s.question_id,
      questionText: s.question_text,
      studentAnswer: s.student_answer,
      score: s.score,
      scoreLabel: s.score_label,
      upgradeAnswer: s.upgrade_answer,
      feedback: s.feedback,
      encouragement: s.encouragement,
      isWrong: s.is_wrong,
      reviewCount: s.review_count,
      lastReviewAt: s.last_review_at,
      submittedAt: s.submitted_at,
      gradedAt: s.graded_at,
    }));
  },

  async getById(id: string): Promise<Submission | null> {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: data.id,
      questionId: data.question_id,
      questionText: data.question_text,
      studentAnswer: data.student_answer,
      score: data.score,
      scoreLabel: data.score_label,
      upgradeAnswer: data.upgrade_answer,
      feedback: data.feedback,
      encouragement: data.encouragement,
      isWrong: data.is_wrong,
      reviewCount: data.review_count,
      lastReviewAt: data.last_review_at,
      submittedAt: data.submitted_at,
      gradedAt: data.graded_at,
    };
  },

  async getByQuestion(questionId: string): Promise<Submission[]> {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('question_id', questionId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((s) => ({
      id: s.id,
      questionId: s.question_id,
      questionText: s.question_text,
      studentAnswer: s.student_answer,
      score: s.score,
      scoreLabel: s.score_label,
      upgradeAnswer: s.upgrade_answer,
      feedback: s.feedback,
      encouragement: s.encouragement,
      isWrong: s.is_wrong,
      reviewCount: s.review_count,
      lastReviewAt: s.last_review_at,
      submittedAt: s.submitted_at,
      gradedAt: s.graded_at,
    }));
  },

  async getWrong(): Promise<Submission[]> {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('is_wrong', true)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((s) => ({
      id: s.id,
      questionId: s.question_id,
      questionText: s.question_text,
      studentAnswer: s.student_answer,
      score: s.score,
      scoreLabel: s.score_label,
      upgradeAnswer: s.upgrade_answer,
      feedback: s.feedback,
      encouragement: s.encouragement,
      isWrong: s.is_wrong,
      reviewCount: s.review_count,
      lastReviewAt: s.last_review_at,
      submittedAt: s.submitted_at,
      gradedAt: s.graded_at,
    }));
  },

  async getNeedReview(): Promise<Submission[]> {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('is_wrong', true)
      .or(`last_review_at.is.null,last_review_at.lt.${threeDaysAgo}`)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((s) => ({
      id: s.id,
      questionId: s.question_id,
      questionText: s.question_text,
      studentAnswer: s.student_answer,
      score: s.score,
      scoreLabel: s.score_label,
      upgradeAnswer: s.upgrade_answer,
      feedback: s.feedback,
      encouragement: s.encouragement,
      isWrong: s.is_wrong,
      reviewCount: s.review_count,
      lastReviewAt: s.last_review_at,
      submittedAt: s.submitted_at,
      gradedAt: s.graded_at,
    }));
  },

  async markReviewed(id: string) {
    const submission = await this.getById(id);
    if (!submission) return;

    const { error } = await supabase
      .from('submissions')
      .update({
        review_count: submission.reviewCount + 1,
        last_review_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },
};

// 题库服务 - 使用 Supabase
export const questionBankService = {
  async create(bank: Omit<QuestionBank, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuestionBank> {
    const { data, error } = await supabase
      .from('question_banks')
      .insert({
        name: bank.name,
        description: bank.description,
        question_ids: bank.questionIds || [],
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      questionIds: data.question_ids || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async getAll(): Promise<QuestionBank[]> {
    const { data, error } = await supabase
      .from('question_banks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      questionIds: b.question_ids || [],
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));
  },

  async getById(id: string): Promise<QuestionBank | null> {
    const { data, error } = await supabase
      .from('question_banks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      questionIds: data.question_ids || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async update(id: string, updates: Partial<Omit<QuestionBank, 'id' | 'createdAt' | 'updatedAt'>>): Promise<QuestionBank> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.questionIds !== undefined) updateData.question_ids = updates.questionIds;

    const { data, error } = await supabase
      .from('question_banks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      questionIds: data.question_ids || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('question_banks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 添加题目到题库
  async addQuestion(bankId: string, questionId: string) {
    const bank = await this.getById(bankId);
    if (!bank) throw new Error('题库不存在');

    const newQuestionIds = [...bank.questionIds, questionId];
    return this.update(bankId, { questionIds: newQuestionIds });
  },

  // 从题库移除题目
  async removeQuestion(bankId: string, questionId: string) {
    const bank = await this.getById(bankId);
    if (!bank) throw new Error('题库不存在');

    const newQuestionIds = bank.questionIds.filter(id => id !== questionId);
    return this.update(bankId, { questionIds: newQuestionIds });
  },

  // 获取题库中的所有题目
  async getQuestions(bankId: string): Promise<Question[]> {
    const bank = await this.getById(bankId);
    if (!bank) return [];

    if (bank.questionIds.length === 0) return [];

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .in('id', bank.questionIds);

    if (error) throw error;

    return (data || []).map((q) => ({
      id: q.id,
      title: q.title,
      questionText: q.question_text,
      referenceAnswer: q.reference_answer,
      scoringCriteria: q.scoring_criteria,
      totalScore: q.total_score,
      bankId: bankId,
      createdAt: q.created_at,
    }));
  },
};
