'use client';

import { useState, useEffect } from 'react';
import { questionService, configService } from '@/lib/db';
import type { AIConfig } from '@/types';

export default function TeacherCreatePage() {
  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [referenceAnswer, setReferenceAnswer] = useState('');
  const [scoringCriteria, setScoringCriteria] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // AI 配置相关
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [provider, setProvider] = useState<'openai' | 'claude' | 'zhipu'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [configSaving, setConfigSaving] = useState(false);
  const [messageFading, setMessageFading] = useState(false);
  const [createdQuestionId, setCreatedQuestionId] = useState<string | null>(null);

  useEffect(() => {
    loadAIConfig();
  }, []);

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

  async function loadAIConfig() {
    try {
      const configs = await configService.getAll();
      if (configs.length > 0) {
        setAiConfig(configs[0]);
        setProvider(configs[0].provider);
        setApiKey(configs[0].apiKey);
        setModel(configs[0].model || '');
        setBaseURL(configs[0].baseURL || '');
      }
    } catch (err) {
      console.error('加载 AI 配置失败:', err);
    }
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

  async function handleSaveAIConfig() {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'API Key 不能为空' });
      return;
    }

    setConfigSaving(true);
    setMessage(null);

    try {
      // 验证 API 配置
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          apiKey,
          model: model || undefined,
          baseURL: baseURL || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '配置验证失败');
      }

      const { config: validatedConfig } = await response.json();

      // 保存到 IndexedDB
      const newConfig: AIConfig = {
        id: aiConfig?.id || crypto.randomUUID(),
        provider,
        apiKey,
        model: validatedConfig.model,
        baseURL: validatedConfig.baseURL,
        updatedAt: new Date().toISOString(),
      };

      if (aiConfig) {
        await configService.update(newConfig.id, newConfig);
      } else {
        await configService.add(newConfig);
      }

      setAiConfig(newConfig);
      setMessage({ type: 'success', text: 'AI 配置保存成功！' });
      setShowAIConfig(false);
    } catch (err) {
      console.error('保存 AI 配置失败:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : '保存配置失败，请重试',
      });
    } finally {
      setConfigSaving(false);
    }
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
          <h1 className="text-4xl font-bold mb-2">教师管理端</h1>
          <p className="text-base-content/70">创建题目和配置 AI 批改服务</p>
        </div>

        {/* AI 配置状态 */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="card-title">AI 批改服务</h2>
                {aiConfig ? (
                  <div className="mt-2">
                    <div className="badge badge-success gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="inline-block w-4 h-4 stroke-current"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      已配置
                    </div>
                    <p className="text-sm text-base-content/70 mt-2">
                      当前使用：{aiConfig.provider} - {aiConfig.model}
                    </p>
                  </div>
                ) : (
                  <div className="badge badge-warning mt-2">未配置</div>
                )}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setShowAIConfig(!showAIConfig)}
              >
                {showAIConfig ? '收起配置' : aiConfig ? '修改配置' : '配置 AI'}
              </button>
            </div>

            {/* AI 配置表单 */}
            {showAIConfig && (
              <div className="mt-6 pt-6 border-t border-base-300">
                <div className="space-y-4">
                  {/* Provider 选择 */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">AI 服务商</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value as any)}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="claude">Claude (Anthropic)</option>
                      <option value="zhipu">智谱 AI</option>
                    </select>
                  </div>

                  {/* API Key */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">API Key *</span>
                    </label>
                    <input
                      type="password"
                      placeholder="请输入 API Key"
                      className="input input-bordered"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <label className="label">
                      <span className="label-text-alt">
                        {provider === 'openai' && '以 sk- 开头'}
                        {provider === 'claude' && '以 sk-ant- 开头'}
                        {provider === 'zhipu' && '智谱 AI 的 API Key'}
                      </span>
                    </label>
                  </div>

                  {/* Model */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">模型（可选）</span>
                    </label>
                    <input
                      type="text"
                      placeholder={
                        provider === 'openai'
                          ? 'gpt-4o-mini'
                          : provider === 'claude'
                            ? 'claude-3-5-sonnet-20241022'
                            : 'glm-4-flash'
                      }
                      className="input input-bordered"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                    />
                    <label className="label">
                      <span className="label-text-alt">留空使用默认模型</span>
                    </label>
                  </div>

                  {/* Base URL */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">API 地址（可选）</span>
                    </label>
                    <input
                      type="text"
                      placeholder="留空使用官方地址"
                      className="input input-bordered"
                      value={baseURL}
                      onChange={(e) => setBaseURL(e.target.value)}
                    />
                    <label className="label">
                      <span className="label-text-alt">使用代理或自建服务时填写</span>
                    </label>
                  </div>

                  <button
                    className="btn btn-primary w-full"
                    onClick={handleSaveAIConfig}
                    disabled={configSaving}
                  >
                    {configSaving ? (
                      <>
                        <span className="loading loading-spinner"></span>
                        验证并保存中...
                      </>
                    ) : (
                      '保存 AI 配置'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
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
