// 题目类型
export interface Question {
  id: string;
  title: string;
  questionText: string;
  referenceAnswer: string;
  scoringCriteria?: string;
  totalScore: number; // 固定为5分
  bankId?: string; // 所属题库ID（可选）
  createdAt: string;
}

// 题库类型
export interface QuestionBank {
  id: string;
  name: string;
  description?: string;
  questionIds: string[]; // 题目ID列表
  createdAt: string;
  updatedAt: string;
}

// 答题记录类型
export interface Submission {
  id: string;
  questionId: string;
  questionText: string;
  studentAnswer: string;

  // 🆕 5分制评分
  score: 1 | 2 | 3 | 4 | 5;
  scoreLabel: '需要加强' | '及格' | '中等' | '良好' | '优秀';

  // 🆕 升级答案
  upgradeAnswer: {
    targetScore: number;
    templateAnswer: string;
    keyPoints: string[];
  };

  // 详细反馈
  feedback: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };

  // 🆕 激励话语
  encouragement: {
    message: string;
    tip: string;
    progress: string;
  };

  // 🆕 错题标记
  isWrong: boolean; // score <= 3 自动标记
  reviewCount: number;
  lastReviewAt?: string;

  // 🆕 提交来源（用于区分是否记录到错题本等）
  isStandalone?: boolean; // true 表示从单题链接提交，不记录到答题记录

  submittedAt: string;
  gradedAt: string;
}

// AI 配置类型
export interface AIConfig {
  id: string;
  provider: 'openai' | 'claude' | 'zhipu';
  apiKey: string;
  model?: string;
  baseURL?: string;
  updatedAt: string;
}

// 批改请求类型
export interface GradingRequest {
  questionText: string;
  referenceAnswer: string;
  studentAnswer: string;
  scoringCriteria?: string;
  currentScore?: number;
}

// 批改结果类型
export interface GradingResult {
  score: 1 | 2 | 3 | 4 | 5;
  scoreLabel: string;
  upgradeAnswer: {
    targetScore: number;
    templateAnswer: string;
    keyPoints: string[];
  };
  feedback: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  encouragement: {
    message: string;
    tip: string;
    progress: string;
  };
}

// 错题报告类型
export interface WrongReport {
  totalWrong: number;
  byScore: { [key: number]: number };
  recentWrong: Submission[];
  needReview: Submission[];
  improved: Submission[];
}
