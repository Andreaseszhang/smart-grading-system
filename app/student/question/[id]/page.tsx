'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { questionService, submissionService, configService } from '@/lib/db';
import type { Question, AIConfig } from '@/types';

export default function SingleQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.id as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestion();
    loadAIConfig();
  }, [questionId]);

  async function loadQuestion() {
    try {
      setLoading(true);
      const q = await questionService.getById(questionId);
      if (q) {
        setQuestion(q);
      } else {
        setError('题目不存在');
      }
    } catch (err) {
      console.error('加载题目失败:', err);
      setError('加载题目失败');
    } finally {
      setLoading(false);
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
    if (!question) return;

    if (!studentAnswer.trim()) {
      setError('请输入你的答案');
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
          questionText: question.questionText,
          referenceAnswer: question.referenceAnswer,
          studentAnswer,
          scoringCriteria: question.scoringCriteria,
          model: aiConfig?.model,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '批改失败');
      }

      const { data: result } = await response.json();

      // 不保存记录，直接将结果存到 sessionStorage 并跳转
      const resultData = {
        questionText: question.questionText,
        studentAnswer,
        score: result.score,
        scoreLabel: result.scoreLabel,
        upgradeAnswer: result.upgradeAnswer,
        feedback: result.feedback,
      };

      sessionStorage.setItem('standalone_result', JSON.stringify(resultData));

      // 跳转到独立结果页面
      router.push(`/student/question/${question.id}/result`);
    } catch (err) {
      console.error('提交失败:', err);
      setError(err instanceof Error ? err.message : '提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error && !question) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="alert alert-error max-w-md">
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
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
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

        {/* 题目卡片 */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">{question.title}</h2>
            <div className="bg-base-200 p-6 rounded-lg">
              <p className="text-base leading-relaxed whitespace-pre-wrap">{question.questionText}</p>
            </div>
          </div>
        </div>

        {/* 答题区 */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="text-xl font-semibold mb-4">你的答案</h3>
            <textarea
              className="textarea textarea-bordered w-full h-80 text-base leading-relaxed"
              placeholder="请在这里输入你的答案..."
              value={studentAnswer}
              onChange={(e) => setStudentAnswer(e.target.value)}
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-base-content/60">
                已输入 {studentAnswer.length} 字
              </p>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={isSubmitting || !studentAnswer.trim()}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    批改中...
                  </>
                ) : (
                  '提交答案'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 提示 */}
        <div className="text-center text-sm text-base-content/50">
          <p>提交后，AI 会立即为你批改并给出详细的反馈和学习建议</p>
        </div>
      </div>
    </div>
  );
}
