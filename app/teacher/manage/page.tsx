'use client';

import { useState, useEffect } from 'react';
import { questionService } from '@/lib/db';
import type { Question } from '@/types';

export default function TeacherManagePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    questionText: '',
    referenceAnswer: '',
    scoringCriteria: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    try {
      setLoading(true);
      const data = await questionService.getAll();
      setQuestions(data);
    } catch (err) {
      console.error('加载题目失败:', err);
      setMessage({ type: 'error', text: '加载题目失败' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`确定要删除题目"${title}"吗？\n\n删除后学生将无法看到此题目，且无法恢复。`)) {
      return;
    }

    try {
      await questionService.delete(id);
      setMessage({ type: 'success', text: '题目已删除' });
      setSelectedQuestion(null); // 关闭模态框
      // 重新加载题目列表
      await loadQuestions();
    } catch (err) {
      console.error('删除题目失败:', err);
      setMessage({ type: 'error', text: '删除题目失败，请重试' });
    }
  }

  function closeModal() {
    setSelectedQuestion(null);
    setIsEditing(false);
  }

  function handleEdit(question: Question) {
    setEditForm({
      title: question.title,
      questionText: question.questionText,
      referenceAnswer: question.referenceAnswer,
      scoringCriteria: question.scoringCriteria || '',
    });
    setIsEditing(true);
  }

  async function handleSaveEdit() {
    if (!selectedQuestion) return;

    if (!editForm.title.trim() || !editForm.questionText.trim() || !editForm.referenceAnswer.trim()) {
      setMessage({ type: 'error', text: '请填写必填字段' });
      return;
    }

    setSaving(true);
    try {
      await questionService.update(selectedQuestion.id, {
        title: editForm.title.trim(),
        questionText: editForm.questionText.trim(),
        referenceAnswer: editForm.referenceAnswer.trim(),
        scoringCriteria: editForm.scoringCriteria.trim() || undefined,
      });

      setMessage({ type: 'success', text: '题目更新成功' });
      setIsEditing(false);
      setSelectedQuestion(null);
      await loadQuestions();
    } catch (err) {
      console.error('更新题目失败:', err);
      setMessage({ type: 'error', text: '更新题目失败，请重试' });
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setIsEditing(false);
  }

  function copyQuestionURL(questionId: string) {
    const url = `${window.location.origin}/student/question/${questionId}`;
    navigator.clipboard.writeText(url).then(() => {
      setMessage({ type: 'success', text: '题目链接已复制到剪贴板' });
      setTimeout(() => setMessage(null), 2000);
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
          <h1 className="text-4xl font-bold mb-2">题目管理</h1>
          <p className="text-base-content/70">查看和管理所有题目</p>
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

        {/* 题目列表 */}
        {questions.length === 0 ? (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
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
              <h2 className="text-2xl font-bold mb-2">还没有题目</h2>
              <p className="text-base-content/70 mb-4">去创建第一个题目吧！</p>
              <a href="/teacher/create" className="btn btn-primary">
                创建题目
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questions.map((question) => (
              <div
                key={question.id}
                className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
              >
                <div className="card-body">
                  <h2 className="card-title text-lg line-clamp-2">{question.title}</h2>
                  <p className="text-sm text-base-content/60">
                    创建时间：{new Date(question.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                  <div className="text-sm text-base-content/70 line-clamp-3 mt-2">
                    {question.questionText}
                  </div>
                  <div className="card-actions justify-end mt-4 gap-2">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setSelectedQuestion(question)}
                    >
                      查看详情
                    </button>
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQuestion(question);
                        handleEdit(question);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                        />
                      </svg>
                      编辑
                    </button>
                    <button
                      className="btn btn-error btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(question.id, question.title);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 详情/编辑模态框 */}
        {selectedQuestion && (
          <div className="modal modal-open">
            <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
              {isEditing ? (
                // 编辑模式
                <>
                  <h3 className="font-bold text-2xl mb-4">编辑题目</h3>
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">题目标题 *</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">题目内容 *</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-40"
                        value={editForm.questionText}
                        onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">参考答案 *</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-40"
                        value={editForm.referenceAnswer}
                        onChange={(e) => setEditForm({ ...editForm, referenceAnswer: e.target.value })}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">评分标准（可选）</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-32"
                        value={editForm.scoringCriteria}
                        onChange={(e) => setEditForm({ ...editForm, scoringCriteria: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="modal-action">
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveEdit}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="loading loading-spinner"></span>
                          保存中...
                        </>
                      ) : (
                        '保存修改'
                      )}
                    </button>
                    <button className="btn btn-ghost" onClick={cancelEdit} disabled={saving}>
                      取消
                    </button>
                  </div>
                </>
              ) : (
                // 查看模式
                <>
                  <h3 className="font-bold text-2xl mb-4">{selectedQuestion.title}</h3>
                  <p className="text-sm text-base-content/60 mb-2">
                    创建时间：{new Date(selectedQuestion.createdAt).toLocaleString('zh-CN')}
                  </p>

                  {/* 题目链接 */}
                  <div className="alert alert-info mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                    <div className="flex-1">
                      <div className="font-semibold mb-1">答题链接</div>
                      <code className="text-xs break-all">{window.location.origin}/student/question/{selectedQuestion.id}</code>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => copyQuestionURL(selectedQuestion.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                      </svg>
                      复制链接
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="font-semibold text-lg mb-2">题目内容：</div>
                      <div className="bg-base-200 p-4 rounded text-base leading-relaxed whitespace-pre-wrap">
                        {selectedQuestion.questionText}
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold text-lg mb-2">参考答案：</div>
                      <div className="bg-base-200 p-4 rounded text-base leading-relaxed whitespace-pre-wrap">
                        {selectedQuestion.referenceAnswer}
                      </div>
                    </div>

                    {selectedQuestion.scoringCriteria && (
                      <div>
                        <div className="font-semibold text-lg mb-2">评分标准：</div>
                        <div className="bg-base-200 p-4 rounded text-base leading-relaxed whitespace-pre-wrap">
                          {selectedQuestion.scoringCriteria}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="modal-action">
                    <button
                      className="btn btn-warning"
                      onClick={() => handleEdit(selectedQuestion)}
                    >
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
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                        />
                      </svg>
                      编辑
                    </button>
                    <button
                      className="btn btn-error"
                      onClick={() => handleDelete(selectedQuestion.id, selectedQuestion.title)}
                    >
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
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                      删除题目
                    </button>
                    <button className="btn" onClick={closeModal}>
                      关闭
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="modal-backdrop" onClick={closeModal}></div>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="flex gap-4 justify-center mt-8">
          <a href="/teacher/create" className="btn btn-primary">
            创建新题目
          </a>
        </div>
      </div>
    </div>
  );
}
