'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { submissionService } from '@/lib/db';
import type { Submission } from '@/types';

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmission();
  }, [id]);

  async function loadSubmission() {
    try {
      const result = await submissionService.getById(id);
      if (result) {
        setSubmission(result);
      }
    } catch (err) {
      console.error('加载提交记录失败:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!submission) {
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
          <span>未找到提交记录</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-5xl mx-auto">
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
          <h1 className="text-4xl font-bold mb-2">批改结果</h1>
          <p className="text-base-content/70">认真看看 AI 的反馈，这会帮助你提升！</p>
        </div>

        {/* 分数展示 */}
        <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-xl mb-6">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-2xl mb-4">你的得分</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-8xl font-bold">{submission.score}</span>
              <span className="text-3xl">/5</span>
            </div>
            <div className="badge badge-lg mt-4 bg-white/20 text-white border-none">
              {submission.scoreLabel}
            </div>
          </div>
        </div>

        {/* 升级答案模板 */}
        {submission.score < 5 && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
                升级到 {submission.upgradeAnswer.targetScore} 分的答案模板
              </h2>
              <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">题目：</h3>
                <p className="text-base leading-relaxed whitespace-pre-wrap">{submission.questionText}</p>
              </div>
              <div className="bg-base-200 p-6 rounded-lg mb-4">
                <h3 className="font-semibold mb-3 text-lg">优化后答案：</h3>
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {submission.upgradeAnswer.templateAnswer}
                </p>
              </div>
              {submission.upgradeAnswer.keyPoints.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-3">关键要点：</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {submission.upgradeAnswer.keyPoints.map((point, index) => (
                      <li key={index} className="text-base">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 详细反馈 */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">详细反馈</h2>

            {/* 优点 */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="badge badge-success">优点</span>
              </h3>
              <ul className="list-disc list-inside space-y-1 text-success">
                {submission.feedback.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>

            {/* 不足 */}
            {submission.feedback.weaknesses.length > 0 &&
              submission.feedback.weaknesses[0] !== '暂无评价' && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="badge badge-warning">待改进</span>
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-warning">
                    {submission.feedback.weaknesses.map((weakness, index) => (
                      <li key={index}>{weakness}</li>
                    ))}
                  </ul>
                </div>
              )}

            {/* 建议 */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="badge badge-info">学习建议</span>
              </h3>
              <ul className="list-disc list-inside space-y-1 text-info">
                {submission.feedback.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 你的答案 */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">你的答案</h2>
            <div className="bg-base-200 p-4 rounded-lg">
              <p className="text-base leading-relaxed whitespace-pre-wrap">{submission.studentAnswer}</p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-4 justify-center">
          <button className="btn btn-neutral" onClick={() => router.push('/student/answer')}>
            继续答题
          </button>
          {submission.isWrong && (
            <button
              className="btn btn-warning"
              onClick={() => router.push('/student/wrong-report')}
            >
              查看错题本
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
