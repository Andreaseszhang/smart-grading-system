import { generateGradingPrompt } from '../prompts/grading';
import type { GradingRequest, GradingResult } from '@/types';

export class ZhipuProvider {
  constructor(
    private apiKey: string,
    private model: string = 'glm-4-flash'
  ) {}

  async grade(request: GradingRequest): Promise<GradingResult> {
    // 生成提示词
    const prompt = generateGradingPrompt(request);

    // 调用智谱 AI API
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的教育评估专家，擅长对主观题进行5分制评分。你的评价要积极鼓励、具体实用。请严格按照 JSON 格式返回结果。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `智谱 AI 请求失败: ${response.status}`);
    }

    const data = await response.json();

    // 解析响应
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('智谱 AI 返回内容为空');
    }

    // 尝试解析 JSON（智谱可能返回 markdown 包裹的 JSON）
    let result;
    try {
      // 尝试直接解析
      result = JSON.parse(content);
    } catch {
      // 尝试提取 markdown 代码块中的 JSON
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1].trim());
      } else {
        throw new Error('无法解析智谱 AI 返回的 JSON');
      }
    }

    return this.normalizeResult(result);
  }

  // 标准化结果
  private normalizeResult(raw: any): GradingResult {
    const score = Math.max(1, Math.min(5, raw.score || 3)) as 1 | 2 | 3 | 4 | 5;

    return {
      score,
      scoreLabel: this.getScoreLabel(score),
      upgradeAnswer: raw.upgradeAnswer || {
        targetScore: Math.min(5, score + 1),
        templateAnswer: '暂无升级答案模板',
        keyPoints: [],
      },
      feedback: raw.feedback || {
        strengths: ['暂无评价'],
        weaknesses: ['暂无评价'],
        suggestions: ['暂无建议'],
      },
      encouragement: raw.encouragement || {
        message: '继续努力！',
        tip: '💡 多练习，熟能生巧！',
        progress: '你正在进步中！',
      },
    };
  }

  private getScoreLabel(score: number): string {
    const labels: { [key: number]: string } = {
      1: '需要加强',
      2: '及格',
      3: '中等',
      4: '良好',
      5: '优秀',
    };
    return labels[score] || '中等';
  }
}
