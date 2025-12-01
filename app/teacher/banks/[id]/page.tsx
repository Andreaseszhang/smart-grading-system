'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { questionBankService, questionService } from '@/lib/db';
import type { QuestionBank, Question } from '@/types';

export default function QuestionBankDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bankId = params.id as string;

  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 创建题目表单
  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [referenceAnswer, setReferenceAnswer] = useState('');
  const [scoringCriteria, setScoringCriteria] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBankData();
  }, [bankId]);

  async function loadBankData() {
    try {
      setLoading(true);
      const bankData = await questionBankService.getById(bankId);
      if (!bankData) {
        setMessage({ type: 'error', text: '题库不存在' });
        return;
      }
      setBank(bankData);

      const bankQuestions = await questionBankService.getQuestions(bankId, questionService);
      setQuestions(bankQuestions);

      const all = await questionService.getAll();
      setAllQuestions(all.filter((q) => !bankData.questionIds.includes(q.id)));
    } catch (err) {
      console.error('加载题库数据失败:', err);
      setMessage({ type: 'error', text: '加载数据失败' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExistingQuestion(questionId: string) {
    try {
      await questionBankService.addQuestion(bankId, questionId);
      setMessage({ type: 'success', text: '题目已添加' });
      setShowAddModal(false);
      loadBankData();
    } catch (err) {
      console.error('添加题目失败:', err);
      setMessage({ type: 'error', text: '添加题目失败' });
    }
  }

  async function handleRemoveQuestion(questionId: string) {
    if (!confirm('确定要从题库中移除这道题吗？题目本身不会被删除。')) {
      return;
    }

    try {
      await questionBankService.removeQuestion(bankId, questionId);
      setMessage({ type: 'success', text: '题目已移除' });
      loadBankData();
    } catch (err) {
      console.error('移除题目失败:', err);
      setMessage({ type: 'error', text: '移除题目失败' });
    }
  }

  async function handleCreateQuestion() {
    if (!title.trim() || !questionText.trim() || !referenceAnswer.trim()) {
      setMessage({ type: 'error', text: '请填写必填字段' });
      return;
    }

    setCreating(true);
    try {
      const newQuestion = await questionService.create({
        title: title.trim(),
        questionText: questionText.trim(),
        referenceAnswer: referenceAnswer.trim(),
        scoringCriteria: scoringCriteria.trim() || undefined,
        totalScore: 5,
        bankId,
      });

      await questionBankService.addQuestion(bankId, newQuestion.id);

      setMessage({ type: 'success', text: '题目创建成功！' });
      setShowCreateModal(false);
      setTitle('');
      setQuestionText('');
      setReferenceAnswer('');
      setScoringCriteria('');
      loadBankData();
    } catch (err) {
      console.error('创建题目失败:', err);
      setMessage({ type: 'error', text: '创建题目失败，请重试' });
    } finally {
      setCreating(false);
    }
  }

  function copyBankURL() {
    const url = `${window.location.origin}/student/bank/${bankId}`;
    navigator.clipboard.writeText(url).then(() => {
      setMessage({ type: 'success', text: '题库链接已复制到剪贴板' });
    }).catch(() => {
      setMessage({ type: 'error', text: '复制失败，请手动复制' });
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="alert alert-error max-w-md">
          <span>题库不存在</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 标题栏 */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <button className="btn btn-ghost btn-sm mb-2" onClick={() => router.push('/teacher/banks')}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                返回题库列表
              </button>
              <h1 className="text-4xl font-bold mb-2">{bank.name}</h1>
              {bank.description && <p className="text-base-content/70">{bank.description}</p>}
              <div className="badge badge-outline mt-2">{questions.length} 道题目</div>
            </div>
            <button className="btn btn-primary" onClick={copyBankURL}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
              复制答题链接
            </button>
          </div>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-6`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              {message.type === 'success' ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              )}
            </svg>
            <span>{message.text}</span>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 mb-6">
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            创建新题目
          </button>
          <button className="btn btn-outline" onClick={() => setShowAddModal(true)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            从现有题目中添加
          </button>
        </div>

        {/* 题目列表 */}
        {questions.length === 0 ? (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center py-16">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-16 h-16 text-base-content/30 mb-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                />
              </svg>
              <h3 className="text-xl font-semibold mb-2">题库中还没有题目</h3>
              <p className="text-base-content/60 mb-6">创建新题目或从现有题目中添加</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="badge badge-primary">第 {index + 1} 题</div>
                        <h3 className="font-semibold">{question.title}</h3>
                      </div>
                      <p className="text-sm text-base-content/70 line-clamp-2">{question.questionText}</p>
                    </div>
                    <button
                      className="btn btn-sm btn-ghost text-error"
                      onClick={() => handleRemoveQuestion(question.id)}
                    >
                      移除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 添加现有题目模态框 */}
        {showAddModal && (
          <div className="modal modal-open">
            <div className="modal-box max-w-3xl">
              <h3 className="font-bold text-lg mb-4">从现有题目中添加</h3>
              {allQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-base-content/60">没有可添加的题目</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allQuestions.map((question) => (
                    <div key={question.id} className="card bg-base-200">
                      <div className="card-body p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{question.title}</h4>
                            <p className="text-sm text-base-content/70 line-clamp-2">{question.questionText}</p>
                          </div>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleAddExistingQuestion(question.id)}
                          >
                            添加
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="modal-action">
                <button className="btn" onClick={() => setShowAddModal(false)}>
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 创建题目模态框 */}
        {showCreateModal && (
          <div className="modal modal-open">
            <div className="modal-box max-w-4xl">
              <h3 className="font-bold text-lg mb-4">创建新题目</h3>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">题目标题 *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="例如：请解释什么是机器学习"
                    className="input input-bordered"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">题目内容 *</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-40"
                    placeholder="请输入完整的题目内容..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">参考答案 *</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-40"
                    placeholder="请输入参考答案..."
                    value={referenceAnswer}
                    onChange={(e) => setReferenceAnswer(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">评分标准（可选）</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-32"
                    placeholder="请输入评分标准，帮助 AI 更准确地评分..."
                    value={scoringCriteria}
                    onChange={(e) => setScoringCriteria(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-action">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowCreateModal(false);
                    setTitle('');
                    setQuestionText('');
                    setReferenceAnswer('');
                    setScoringCriteria('');
                  }}
                  disabled={creating}
                >
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleCreateQuestion} disabled={creating}>
                  {creating ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      创建中...
                    </>
                  ) : (
                    '创建并添加到题库'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
