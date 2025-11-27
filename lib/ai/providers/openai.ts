import OpenAI from 'openai';
import { generateGradingPrompt } from '../prompts/grading';
import type { GradingRequest, GradingResult } from '@/types';

export class OpenAIProvider {
  private client: OpenAI;

  constructor(
    private apiKey: string,
    private model: string = 'gpt-4o-mini'
  ) {
    this.client = new OpenAI({
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: false, // 仅在服务端使用
    });
  }

  async grade(request: GradingRequest): Promise<GradingResult> {
    // 生成提示词
    const prompt = generateGradingPrompt(request);

    // 调用 OpenAI API
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            '你是一个专业的教育评估专家，擅长对主观题进行5分制评分。你的评价要积极鼓励、具体实用。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }, // 强制返回 JSON
    });

    // 解析响应
    const content = completion.choices[0].message.content;
    const result = JSON.parse(content || '{}');

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
        memorizeTime: '建议10分钟背诵',
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
