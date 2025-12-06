'use client';

import { useState } from 'react';
import { questionService } from '@/lib/db';

export default function TeacherCreatePage() {
  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [referenceAnswer, setReferenceAnswer] = useState('');
  const [scoringCriteria, setScoringCriteria] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [messageFading, setMessageFading] = useState(false);
  const [createdQuestionId, setCreatedQuestionId] = useState<string | null>(null);
  const [testingAPI, setTestingAPI] = useState(false);

  // 测试 LLM API 连接
  async function handleTestLLMAPI() {
    setTestingAPI(true);
    setMessage(null);

    try {
      const response = await fetch('/api/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionText: '什么是人工智能？',
          referenceAnswer: '人工智能（AI）是计算机科学的一个分支，旨在创建能够执行通常需要人类智能的任务的系统。',
          studentAnswer: '人工智能是让机器像人一样思考和学习的技术。',
          scoringCriteria: '回答准确性和完整性',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: 'success',
          text: `LLM API 连接成功！模型响应正常，测试评分：${data.data.score}分`
        });
      } else {
        setMessage({
          type: 'error',
          text: `LLM API 测试失败：${data.error || data.message || '未知错误'}`
        });
      }
    } catch (error) {
      console.error('LLM API 测试错误:', error);
      setMessage({
        type: 'error',
        text: `无法连接到 LLM API，请检查网络和配置：${error instanceof Error ? error.message : '未知错误'}`
      });
    } finally {
      setTestingAPI(false);
      setMessageFading(false);
      // 3秒后开始淡出
      setTimeout(() => {
        setMessageFading(true);
      }, 3000);
      // 3.5秒后完全移除消息
      setTimeout(() => {
        setMessage(null);
        setMessageFading(false);
      }, 3500);
    }
  }

  // 生成测试题目
  function handleGenerateTestQuestion() {
    setTitle('关于"新质生产力与高质量发展"的马克思主义政治经济学分析题');
    setQuestionText(`材料：
2023年以来，"新质生产力"成为我国经济发展的重要关键词。它以科技创新为核心要素，强调数字经济、人工智能、绿色低碳技术对传统生产方式的深刻改造。当前，我国正处在经济转型升级的关键阶段，一方面要推动产业结构优化升级，另一方面也面临科技"卡脖子"、发展不平衡不充分等现实问题。

结合材料，运用马克思主义政治经济学的基本原理，分析：

什么是"新质生产力"的本质内涵？

发展新质生产力对推动我国高质量发展的重要意义。

当前我国在培育新质生产力过程中面临的主要矛盾及其解决思路。`);
    setReferenceAnswer(`新质生产力的本质内涵：
新质生产力是以科技创新为主导、以高技术含量和高附加值为特征的先进生产力形态，体现了生产力中劳动者、劳动资料和劳动对象的整体跃升，符合马克思主义关于"生产力决定生产关系、经济基础决定上层建筑"的基本原理。

发展新质生产力对高质量发展的意义：
（1）有利于推动经济增长由要素驱动向创新驱动转变；
（2）有利于提升全要素生产率，增强产业核心竞争力；
（3）有利于推进绿色低碳发展，实现人与自然和谐共生；
（4）有利于夯实现代化经济体系的物质基础。

当前的主要矛盾及解决思路：
主要矛盾表现为：关键核心技术受制于人、创新体系协同性不足、区域与产业发展不平衡等。
解决思路包括：
（1）强化企业科技创新主体地位；
（2）加大基础研究与关键核心技术攻关；
（3）完善科技成果转化机制；
（4）优化创新资源配置，推动区域协同发展。`);
    setScoringCriteria(`对"新质生产力"内涵理解准确，理论表述规范（3分）

能从多角度分析其对高质量发展的意义，观点完整（4分）

能结合现实问题提出合理对策，逻辑清晰（3分）

若出现以下情况酌情扣分：

理论表述错误或混淆概念

仅泛泛而谈，未结合材料

对策空洞、缺乏针对性`);
    setMessage({ type: 'success', text: '测试题目已生成' });
    setMessageFading(false);
    // 1.5秒后开始淡出
    setTimeout(() => {
      setMessageFading(true);
    }, 1500);
    // 2秒后完全移除消息
    setTimeout(() => {
      setMessage(null);
      setMessageFading(false);
    }, 2000);
  }

  // 清除题目
  function handleClearQuestion() {
    setTitle('');
    setQuestionText('');
    setReferenceAnswer('');
    setScoringCriteria('');
    setMessage({ type: 'success', text: '题目已清除' });
    setMessageFading(false);
    // 1.5秒后开始淡出
    setTimeout(() => {
      setMessageFading(true);
    }, 1500);
    // 2秒后完全移除消息
    setTimeout(() => {
      setMessage(null);
      setMessageFading(false);
    }, 2000);
  }

  async function handleSaveQuestion() {
    if (!title.trim() || !questionText.trim() || !referenceAnswer.trim()) {
      setMessage({ type: 'error', text: '请填写必填字段' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const newQuestion = await questionService.create({
        title: title.trim(),
        questionText: questionText.trim(),
        referenceAnswer: referenceAnswer.trim(),
        scoringCriteria: scoringCriteria.trim() || undefined,
        totalScore: 5, // 固定5分制
      });

      setMessage({ type: 'success', text: '题目创建成功！' });
      setCreatedQuestionId(newQuestion.id);
      setMessageFading(false);

      // 1.5秒后开始淡出
      setTimeout(() => {
        setMessageFading(true);
      }, 1500);
      // 2秒后完全移除消息
      setTimeout(() => {
        setMessage(null);
        setMessageFading(false);
      }, 2000);

      // 清空表单
      setTitle('');
      setQuestionText('');
      setReferenceAnswer('');
      setScoringCriteria('');
    } catch (err) {
      console.error('创建题目失败:', err);
      setMessage({ type: 'error', text: '创建题目失败，请重试' });
    } finally {
      setSaving(false);
    }
  }

  function copyQuestionURL() {
    if (!createdQuestionId) return;
    const url = `${window.location.origin}/student/question/${createdQuestionId}`;
    navigator.clipboard.writeText(url).then(() => {
      setMessage({ type: 'success', text: '题目链接已复制到剪贴板' });
      setMessageFading(false);
      setTimeout(() => {
        setMessageFading(true);
      }, 1500);
      setTimeout(() => {
        setMessage(null);
        setMessageFading(false);
      }, 2000);
    }).catch(() => {
      setMessage({ type: 'error', text: '复制失败，请手动复制' });
    });
  }

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-16 py-8">
          <div className="flex justify-between items-center mb-4">
            <a href="/" className="btn btn-ghost btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              返回主页
            </a>
            <div className="flex gap-2">
              <button
                className="btn btn-outline btn-info btn-sm"
                onClick={handleTestLLMAPI}
                disabled={testingAPI}
              >
                {testingAPI ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    测试中...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    测试 LLM API
                  </>
                )}
              </button>
              <a href="/teacher/banks" className="btn btn-ghost btn-sm">
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
                    d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
                  />
                </svg>
                题库管理
              </a>
              <a href="/teacher/manage" className="btn btn-ghost btn-sm">
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
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                  />
                </svg>
                管理题目
              </a>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">教师管理端</h1>
          <p className="text-base-content/70">创建题目和配置 AI 批改服务</p>
        </div>


        {/* 创建题目表单 */}
        <div className="card bg-base-100 shadow-xl p-8">
          <div className="card-body space-y-6">
            {/* 题目标题 */}
            <div className="form-control">
              <div className="mb-2 flex justify-between items-center">
                <div className="flex-1"></div>
                <span className="text-base font-semibold flex-1 text-center">新题目标题 *</span>
                <div className="flex-1 flex justify-end gap-2">
                  <button
                    className="btn btn-sm btn-outline btn-secondary"
                    onClick={handleGenerateTestQuestion}
                  >
                    生成测试题目
                  </button>
                  {(title || questionText || referenceAnswer || scoringCriteria) && (
                    <button
                      className="btn btn-sm btn-outline btn-error"
                      onClick={handleClearQuestion}
                    >
                      清除
                    </button>
                  )}
                </div>
              </div>
              <input
                type="text"
                placeholder="例如：请解释什么是机器学习"
                className="input input-bordered w-full h-16"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* 题目内容 */}
            <div className="form-control">
              <div className="mb-2 text-center">
                <span className="text-base font-semibold">题目内容 *</span>
              </div>
              <textarea
                className="textarea textarea-bordered h-80 w-full"
                placeholder="请输入完整的题目内容..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              ></textarea>
            </div>

            {/* 参考答案 */}
            <div className="form-control">
              <div className="mb-2 text-center">
                <span className="text-base font-semibold">参考答案 *</span>
              </div>
              <textarea
                className="textarea textarea-bordered h-80 w-full"
                placeholder="请输入参考答案..."
                value={referenceAnswer}
                onChange={(e) => setReferenceAnswer(e.target.value)}
              ></textarea>
            </div>

            {/* 评分标准 */}
            <div className="form-control">
              <div className="mb-2 text-center">
                <span className="text-base font-semibold">评分标准（可选）</span>
              </div>
              <textarea
                className="textarea textarea-bordered h-64 w-full"
                placeholder="请输入评分标准，帮助 AI 更准确地评分..."
                value={scoringCriteria}
                onChange={(e) => setScoringCriteria(e.target.value)}
              ></textarea>
            </div>

            {/* 分数说明 */}
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
              <span>本系统采用5分制评分：1-需要加强，2-及格，3-中等，4-良好，5-优秀</span>
            </div>

            {/* 消息提示 */}
            {message && (
              <div
                className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} transition-opacity duration-500 ${messageFading ? 'opacity-0' : 'opacity-100'}`}
              >
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

            {/* 提交按钮 */}
            <button
              className="btn btn-primary"
              onClick={handleSaveQuestion}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner"></span>
                  创建中...
                </>
              ) : (
                '创建题目'
              )}
            </button>

            {/* 创建成功后显示题目链接 */}
            {createdQuestionId && (
              <div className="alert mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                <div className="flex-1">
                  <div className="font-semibold mb-1">题目已创建！答题链接：</div>
                  <code className="text-xs break-all block bg-primary/10 p-2 rounded mt-1">
                    {window.location.origin}/student/question/{createdQuestionId}
                  </code>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={copyQuestionURL}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                    复制链接
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setCreatedQuestionId(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部说明 */}
        <div className="text-center mt-8">
          <div className="text-sm text-base-content/50">
            <p>创建题目后，学生可以在答题页面看到并作答</p>
            <p className="mt-1">AI 会根据参考答案和评分标准自动批改</p>
          </div>
        </div>
      </div>
    </div>
  );
}
