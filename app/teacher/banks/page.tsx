'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { questionBankService } from '@/lib/db';
import type { QuestionBank } from '@/types';

export default function QuestionBanksPage() {
  const router = useRouter();
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankDescription, setNewBankDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadBanks();
  }, []);

  async function loadBanks() {
    try {
      setLoading(true);
      const data = await questionBankService.getAll();
      setBanks(data);
    } catch (err) {
      console.error('加载题库失败:', err);
      setMessage({ type: 'error', text: '加载题库失败' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBank() {
    if (!newBankName.trim()) {
      setMessage({ type: 'error', text: '请输入题库名称' });
      return;
    }

    setCreating(true);
    try {
      await questionBankService.create({
        name: newBankName.trim(),
        description: newBankDescription.trim() || undefined,
        questionIds: [],
      });

      setMessage({ type: 'success', text: '题库创建成功！' });
      setShowCreateModal(false);
      setNewBankName('');
      setNewBankDescription('');
      loadBanks();
    } catch (err) {
      console.error('创建题库失败:', err);
      setMessage({ type: 'error', text: '创建题库失败，请重试' });
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteBank(id: string, name: string) {
    if (!confirm(`确定要删除题库"${name}"吗？题库中的题目不会被删除。`)) {
      return;
    }

    try {
      await questionBankService.delete(id);
      setMessage({ type: 'success', text: '题库已删除' });
      loadBanks();
    } catch (err) {
      console.error('删除题库失败:', err);
      setMessage({ type: 'error', text: '删除题库失败，请重试' });
    }
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
      <div className="max-w-7xl mx-auto">
        {/* 标题栏 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">题库管理</h1>
            <p className="text-base-content/70">创建和管理您的题库</p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-ghost" onClick={() => router.push('/teacher/create')}>
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
              返回
            </button>
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
              创建新题库
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

        {/* 题库列表 */}
        {banks.length === 0 ? (
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
              <h3 className="text-xl font-semibold mb-2">还没有题库</h3>
              <p className="text-base-content/60 mb-6">点击上方按钮创建您的第一个题库</p>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                创建新题库
              </button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banks.map((bank) => (
              <div key={bank.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  <h2 className="card-title">{bank.name}</h2>
                  {bank.description && (
                    <p className="text-base-content/70 text-sm line-clamp-2">{bank.description}</p>
                  )}
                  <div className="badge badge-outline mt-2">{bank.questionIds.length} 道题目</div>
                  <div className="text-xs text-base-content/50 mt-2">
                    创建于 {new Date(bank.createdAt).toLocaleDateString()}
                  </div>
                  <div className="card-actions justify-end mt-4">
                    <button
                      className="btn btn-sm btn-ghost text-error"
                      onClick={() => handleDeleteBank(bank.id, bank.name)}
                    >
                      删除
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={() => router.push(`/teacher/banks/${bank.id}`)}>
                      管理题目
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 创建题库模态框 */}
        {showCreateModal && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">创建新题库</h3>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">题库名称 *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="例如：马克思主义政治经济学期末复习"
                    className="input input-bordered"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">题库描述（可选）</span>
                  </label>
                  <textarea
                    placeholder="简要描述这个题库的用途和内容"
                    className="textarea textarea-bordered h-24"
                    value={newBankDescription}
                    onChange={(e) => setNewBankDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-action">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewBankName('');
                    setNewBankDescription('');
                  }}
                  disabled={creating}
                >
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleCreateBank} disabled={creating}>
                  {creating ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      创建中...
                    </>
                  ) : (
                    '创建'
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
