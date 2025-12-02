'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, questionService, submissionService, configService } from '@/lib/db';
import type { Question, AIConfig } from '@/types';

export default function AnswerPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuestions();
    loadAIConfig();
  }, []);

  async function loadQuestions() {
    try {
      const allQuestions = await questionService.getAll();
      setQuestions(allQuestions);
      if (allQuestions.length > 0 && !selectedQuestion) {
        setSelectedQuestion(allQuestions[0]);
      }
    } catch (err) {
      console.error('加载题目失败:', err);
      setError('加载题目失败，请刷新页面重试');
    }
  }

  async function loadAIConfig() {
    try {
      const configs = await configService.getAll();
      if (configs.length > 0) {
        setAiConfig(configs[0]);
      }
    } catch (err) {
      console.error('加载 AI 配置失败:', err);
    }
  }

  async function handleSubmit() {
    if (!selectedQuestion) {
      setError('请选择一个题目');
      return;
    }

    if (!studentAnswer.trim()) {
      setError('请输入你的答案');
      return;
    }

    if (!aiConfig) {
      setError('请先配置 AI 服务（在教师端配置）');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 调用批改 API
      const response = await fetch('/api/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionText: selectedQuestion.questionText,
          referenceAnswer: selectedQuestion.referenceAnswer,
          studentAnswer: studentAnswer,
          scoringCriteria: selectedQuestion.scoringCriteria,
          model: aiConfig?.model,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '批改失败');
      }

      const { data: result } = await response.json();

      // 保存提交记录到 Supabase
      const submission = await submissionService.create({
        questionId: selectedQuestion.id,
        questionText: selectedQuestion.questionText,
        studentAnswer,
        score: result.score,
        scoreLabel: result.scoreLabel,
        upgradeAnswer: result.upgradeAnswer,
        feedback: result.feedback,
        isWrong: result.score <= 3, // 3分及以下标记为错题
        gradedAt: new Date().toISOString(),
      });

      // 跳转到结果页面
      router.push(`/student/result/${submission.id}`);
    } catch (err) {
      console.error('提交失败:', err);
      setError(err instanceof Error ? err.message : '提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <a href="/" className="btn btn-ghost btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              返回主页
            </a>
            <div className="flex-1"></div>
          </div>
          <h1 className="text-4xl font-bold mb-2">主观题答题</h1>
          <p className="text-base-content/70">请认真作答，AI 会给你详细的反馈和学习建议</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="alert alert-error mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* 题目选择 */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">选择题目</h2>
            {questions.length === 0 ? (
              <div className="alert alert-warning">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>暂无题目，请联系教师添加题目</span>
              </div>
            ) : (
              <select
                className="select select-bordered w-full"
                value={selectedQuestion?.id || ''}
                onChange={(e) => {
                  const question = questions.find((q) => q.id === e.target.value);
                  setSelectedQuestion(question || null);
                  setStudentAnswer('');
                }}
              >
                {questions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* 题目详情 */}
        {selectedQuestion && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title">题目内容</h2>
              <div className="prose max-w-none">
                <p className="text-lg whitespace-pre-wrap">{selectedQuestion.questionText}</p>
              </div>
              <div className="badge badge-primary mt-4">满分 {selectedQuestion.totalScore} 分</div>
            </div>
          </div>
        )}

        {/* 答题区域 */}
        {selectedQuestion && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title">你的答案</h2>
              <textarea
                className="textarea textarea-bordered h-[300px] w-full max-w-full text-base"
                placeholder="请在这里输入你的答案..."
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                disabled={isSubmitting}
              ></textarea>
              <div className="text-sm text-base-content/50 mt-2">
                已输入 {studentAnswer.length} 字
              </div>
            </div>
          </div>
        )}

        {/* 提交按钮 */}
        <div className="flex gap-4 justify-center">
          <button
            className="btn btn-neutral"
            onClick={() => router.push('/student/wrong-report')}
            disabled={isSubmitting}
          >
            查看错题本
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={!selectedQuestion || !studentAnswer.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner"></span>
                AI 批改中...
              </>
            ) : (
              '提交答案'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
