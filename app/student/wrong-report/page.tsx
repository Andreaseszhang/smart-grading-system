'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submissionService } from '@/lib/db';
import type { Submission } from '@/types';

export default function WrongReportPage() {
  const router = useRouter();
  const [wrongSubmissions, setWrongSubmissions] = useState<Submission[]>([]);
  const [needReview, setNeedReview] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'need-review'>('all');

  useEffect(() => {
    loadWrongQuestions();
  }, []);

  async function loadWrongQuestions() {
    try {
      const [wrong, review] = await Promise.all([
        submissionService.getWrong(),
        submissionService.getNeedReview(),
      ]);
      setWrongSubmissions(wrong);
      setNeedReview(review);
    } catch (err) {
      console.error('加载错题失败:', err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsReviewed(id: string) {
    try {
      await submissionService.markReviewed(id);
      await loadWrongQuestions();
    } catch (err) {
      console.error('标记复习失败:', err);
    }
  }

  const displaySubmissions = filter === 'all' ? wrongSubmissions : needReview;

  const stats = {
    total: wrongSubmissions.length,
    score1: wrongSubmissions.filter((s) => s.score === 1).length,
    score2: wrongSubmissions.filter((s) => s.score === 2).length,
    score3: wrongSubmissions.filter((s) => s.score === 3).length,
    needReview: needReview.length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-6xl mx-auto">
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
          <h1 className="text-4xl font-bold mb-2">错题本</h1>
          <p className="text-base-content/70">回顾错题，查漏补缺，不断进步</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">总错题数</div>
              <div className="stat-value text-error">{stats.total}</div>
              <div className="stat-desc">需要加强的题目</div>
            </div>
          </div>

          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">1分题目</div>
              <div className="stat-value text-sm">{stats.score1}</div>
              <div className="stat-desc">需要加强</div>
            </div>
          </div>

          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">2分题目</div>
              <div className="stat-value text-sm">{stats.score2}</div>
              <div className="stat-desc">及格</div>
            </div>
          </div>

          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">3分题目</div>
              <div className="stat-value text-sm">{stats.score3}</div>
              <div className="stat-desc">中等</div>
            </div>
          </div>
        </div>

        {/* 待复习提醒 */}
        {stats.needReview > 0 && (
          <div className="alert alert-warning mb-6">
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
            <span>有 {stats.needReview} 道错题超过3天未复习，建议尽快复习！</span>
          </div>
        )}

        {/* 筛选器 */}
        <div className="tabs tabs-boxed mb-6 bg-base-100 shadow">
          <a
            className={`tab ${filter === 'all' ? 'tab-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部错题 ({stats.total})
          </a>
          <a
            className={`tab ${filter === 'need-review' ? 'tab-active' : ''}`}
            onClick={() => setFilter('need-review')}
          >
            待复习 ({stats.needReview})
          </a>
        </div>

        {/* 错题列表 */}
        {displaySubmissions.length === 0 ? (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-16 h-16 text-success mb-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="card-title">太棒了！</h2>
              <p className="text-base-content/70">
                {filter === 'all' ? '暂无错题，继续保持！' : '没有待复习的错题'}
              </p>
              <button className="btn btn-primary mt-4" onClick={() => router.push('/student/answer')}>
                继续答题
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {displaySubmissions.map((submission) => {
              const needReviewFlag =
                !submission.lastReviewAt ||
                Date.now() - new Date(submission.lastReviewAt).getTime() > 3 * 24 * 60 * 60 * 1000;

              return (
                <div key={submission.id} className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h2 className="card-title mb-2">
                          {submission.questionText.substring(0, 50)}
                          {submission.questionText.length > 50 ? '...' : ''}
                        </h2>
                        <div className="flex gap-2 flex-wrap mb-3">
                          <div className={`badge ${getScoreBadgeClass(submission.score)}`}>
                            {submission.score} 分 - {submission.scoreLabel}
                          </div>
                          {needReviewFlag && <div className="badge badge-warning">待复习</div>}
                          <div className="badge badge-ghost">
                            已复习 {submission.reviewCount} 次
                          </div>
                          <div className="badge badge-ghost">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 你的答案摘要 */}
                    <div className="bg-base-200 p-3 rounded-lg mb-3">
                      <div className="text-sm font-semibold mb-1">你的答案：</div>
                      <div className="text-sm text-base-content/70">
                        {submission.studentAnswer.substring(0, 100)}
                        {submission.studentAnswer.length > 100 ? '...' : ''}
                      </div>
                    </div>

                    {/* 升级提示 */}
                    <div className="alert alert-info">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="stroke-current shrink-0 w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      <div className="text-sm">
                        <div className="font-semibold mb-1">升级建议：</div>
                        <div>
                          {submission.upgradeAnswer.templateAnswer.substring(0, 80)}...
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="card-actions justify-end mt-3">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => router.push(`/student/result/${submission.id}`)}
                      >
                        查看详情
                      </button>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => markAsReviewed(submission.id)}
                      >
                        标记已复习
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 返回按钮 */}
        <div className="flex justify-center mt-8">
          <button className="btn btn-neutral" onClick={() => router.push('/student/answer')}>
            返回答题
          </button>
        </div>
      </div>
    </div>
  );
}

function getScoreBadgeClass(score: number): string {
  if (score === 1) return 'badge-error';
  if (score === 2) return 'badge-warning';
  if (score === 3) return 'badge-info';
  if (score === 4) return 'badge-success';
  return 'badge-primary';
}
