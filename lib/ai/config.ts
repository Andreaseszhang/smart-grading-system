// AI 配置工具函数

export interface AIConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

/**
 * 获取默认模型
 */
export function getDefaultModel(): string {
  return 'claude-sonnet-latest';
}

/**
 * 从环境变量获取 AI 配置
 */
export function getAIConfig(model?: string): AIConfig {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;

  if (!apiKey) {
    throw new Error('未配置 OPENAI_API_KEY 环境变量');
  }

  return {
    apiKey,
    baseURL,
    model: model || getDefaultModel(),
  };
}
