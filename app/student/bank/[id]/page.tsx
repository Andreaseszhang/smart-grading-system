'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { questionBankService, questionService, configService } from '@/lib/db';
import type { QuestionBank, Question, AIConfig, GradingResult } from '@/types';

export default function StudentBankPage() {
  const router = useRouter();
  const params = useParams();
  const bankId = params.id as string;

  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [results, setResults] = useState<(GradingResult | null)[]>([]);
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadBankData();
  }, [bankId]);

  async function loadBankData() {
    try {
      setLoading(true);
      const bankData = await questionBankService.getById(bankId);
      if (!bankData) {
        setError('题库不存在');
        return;
      }
      setBank(bankData);

      const bankQuestions = await questionBankService.getQuestions(bankId, questionService);
      if (bankQuestions.length === 0) {
        setError('题库中还没有题目');
        return;
      }
      setQuestions(bankQuestions);
      setAnswers(new Array(bankQuestions.length).fill(''));
      setResults(new Array(bankQuestions.length).fill(null));

      const configs = await configService.getAll();
      if (configs.length > 0) {
        setAiConfig(configs[0]);
      }
    } catch (err) {
      console.error('加载题库失败:', err);
      setError('加载题库失败');
    } finally {
      setLoading(false);
    }
  }

  function handleAnswerChange(value: string) {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = value;
    setAnswers(newAnswers);
  }

  function goToQuestion(index: number) {
    setCurrentIndex(index);
    setError('');
  }

  function goNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setError('');
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setError('');
    }
  }

  async function handleSubmitAll() {
    // 检查是否有未作答的题目
    const unanswered = answers.findIndex((a) => !a.trim());
    if (unanswered !== -1) {
      setError(`第 ${unanswered + 1} 题还未作答`);
      setCurrentIndex(unanswered);
      return;
    }

    if (!aiConfig) {
      setError('请先在教师端配置 AI 批改服务');
      return;
    }

    if (!confirm(`确定要提交全部 ${questions.length} 道题吗？提交后将自动批改。`)) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const newResults: GradingResult[] = [];

      // 逐个批改题目
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const studentAnswer = answers[i];

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
          throw new Error(errorData.message || `第 ${i + 1} 题批改失败`);
        }

        const { data: result } = await response.json();
        newResults.push(result);
      }

      setResults(newResults);
      setShowResults(true);
    } catch (err) {
      console.error('批改失败:', err);
      setError(err instanceof Error ? err.message : '批改失败，请重试');
    } finally {
      setSubmitting(false);
    }
  }

  function calculateTotalScore() {
    if (results.every((r) => r === null)) return 0;
    return results.reduce((sum, r) => sum + (r?.score || 0), 0);
  }

  function calculateAverageScore() {
    const total = calculateTotalScore();
    return questions.length > 0 ? (total / questions.length).toFixed(1) : '0.0';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error && !bank) {
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

  if (!bank || questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];

  // 结果页面
  if (showResults) {
    return (
      <div className="min-h-screen bg-base-200 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">批改完成</h1>
            <p className="text-base-content/70">{bank.name}</p>
          </div>

          {/* 总分展示 */}
          <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-xl mb-6">
            <div className="card-body items-center text-center">
              <h2 className="card-title text-2xl mb-4">你的总分</h2>
              <div className="flex items-baseline gap-4">
                <div>
                  <div className="text-7xl font-bold">{calculateTotalScore()}</div>
                  <div className="text-xl mt-2">/ {questions.length * 5} 分</div>
                </div>
                <div className="divider divider-horizontal"></div>
                <div>
                  <div className="text-5xl font-bold">{calculateAverageScore()}</div>
                  <div className="text-xl mt-2">平均分 / 5</div>
                </div>
              </div>
            </div>
          </div>

          {/* 每题结果 */}
          <div className="space-y-4">
            {questions.map((question, index) => {
              const result = results[index];
              if (!result) return null;
              const isExpanded = expandedQuestions.has(index);

              return (
                <div key={question.id} className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-lg">第 {index + 1} 题: {question.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold">{result.score}</span>
                        <span className="text-lg">/ 5</span>
                        <div className={`badge ${result.score >= 4 ? 'badge-success' : result.score >= 3 ? 'badge-warning' : 'badge-error'}`}>
                          {result.scoreLabel}
                        </div>
                      </div>
                    </div>

                    {/* 题目内容 - 可折叠 */}
                    <div className="mb-3">
                      <button
                        className="flex items-center gap-2 text-sm font-medium text-base-content/70 hover:text-base-content transition-colors w-full text-left"
                        onClick={() => {
                          const newExpanded = new Set(expandedQuestions);
                          if (isExpanded) {
                            newExpanded.delete(index);
                          } else {
                            newExpanded.add(index);
                          }
                          setExpandedQuestions(newExpanded);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                        <span>题目内容</span>
                      </button>
                      {isExpanded && (
                        <div className="bg-base-200 p-4 rounded-lg mt-2">
                          <p className="whitespace-pre-wrap">{question.questionText}</p>
                        </div>
                      )}
                    </div>

                    {/* 参考答案 - 可折叠 */}
                    <div className="mb-3">
                      <button
                        className="flex items-center gap-2 text-sm font-medium text-info hover:text-info/80 transition-colors w-full text-left"
                        onClick={() => {
                          const newExpanded = new Set(expandedQuestions);
                          const refKey = index + 1000; // 使用不同的key避免冲突
                          if (expandedQuestions.has(refKey)) {
                            newExpanded.delete(refKey);
                          } else {
                            newExpanded.add(refKey);
                          }
                          setExpandedQuestions(newExpanded);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className={`w-4 h-4 transition-transform ${expandedQuestions.has(index + 1000) ? 'rotate-90' : ''}`}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                        <span>参考答案</span>
                      </button>
                      {expandedQuestions.has(index + 1000) && (
                        <div className="bg-info/10 p-4 rounded-lg mt-2 border border-info/20">
                          <p className="whitespace-pre-wrap text-sm">{question.referenceAnswer}</p>
                        </div>
                      )}
                    </div>

                    {/* 你的答案 */}
                    <div className="bg-base-200 p-4 rounded-lg mb-3">
                      <div className="text-sm font-medium text-base-content/70 mb-2">你的答案：</div>
                      <p className="whitespace-pre-wrap">{answers[index]}</p>
                    </div>

                    {/* 优点 */}
                    {result.feedback.strengths.length > 0 && (
                      <div className="mb-3">
                        <div className="badge badge-success mb-2">优点</div>
                        <ul className="list-disc list-inside space-y-1 text-success text-sm">
                          {result.feedback.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 待改进 */}
                    {result.feedback.weaknesses.length > 0 && result.feedback.weaknesses[0] !== '暂无评价' && (
                      <div className="mb-3">
                        <div className="badge badge-warning mb-2">待改进</div>
                        <ul className="list-disc list-inside space-y-1 text-warning text-sm">
                          {result.feedback.weaknesses.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 建议 */}
                    {result.feedback.suggestions.length > 0 && (
                      <div>
                        <div className="badge badge-info mb-2">建议</div>
                        <ul className="list-disc list-inside space-y-1 text-info text-sm">
                          {result.feedback.suggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-8">
            <button className="btn btn-primary" onClick={() => router.push('/')}>
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 答题页面
  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-5xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{bank.name}</h1>
          {bank.description && <p className="text-base-content/70">{bank.description}</p>}
          <div className="badge badge-outline mt-2">共 {questions.length} 道题</div>
        </div>

        {/* 进度条 */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">进度:</span>
              <progress
                className="progress progress-primary flex-1"
                value={answers.filter((a) => a.trim()).length}
                max={questions.length}
              ></progress>
              <span className="text-sm">
                {answers.filter((a) => a.trim()).length} / {questions.length}
              </span>
            </div>
          </div>
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

        {/* 当前题目 */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">
                第 {currentIndex + 1} 题 / {questions.length}
              </h2>
              <div className="badge badge-primary">5 分</div>
            </div>
            <h3 className="font-semibold text-lg mb-3">{currentQuestion.title}</h3>
            <div className="bg-base-200 p-6 rounded-lg mb-4">
              <p className="text-base leading-relaxed whitespace-pre-wrap">{currentQuestion.questionText}</p>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">你的答案</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full h-64 text-base leading-relaxed"
                placeholder="请在这里输入你的答案..."
                value={answers[currentIndex]}
                onChange={(e) => handleAnswerChange(e.target.value)}
                disabled={submitting}
              />
              <div className="label">
                <span className="label-text-alt">已输入 {answers[currentIndex].length} 字</span>
              </div>
            </div>
          </div>
        </div>

        {/* 题目导航 */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body p-4">
            <div className="flex flex-wrap gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  className={`btn btn-sm ${
                    index === currentIndex
                      ? 'btn-primary'
                      : answers[index].trim()
                        ? 'btn-success btn-outline'
                        : 'btn-outline'
                  }`}
                  onClick={() => goToQuestion(index)}
                  disabled={submitting}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between items-center">
          <button className="btn btn-outline" onClick={goPrev} disabled={currentIndex === 0 || submitting}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            上一题
          </button>

          <button className="btn btn-primary" onClick={handleSubmitAll} disabled={submitting}>
            {submitting ? (
              <>
                <span className="loading loading-spinner"></span>
                批改中... ({results.filter((r) => r !== null).length + 1}/{questions.length})
              </>
            ) : (
              `提交全部 ${questions.length} 题`
            )}
          </button>

          <button
            className="btn btn-outline"
            onClick={goNext}
            disabled={currentIndex === questions.length - 1 || submitting}
          >
            下一题
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
