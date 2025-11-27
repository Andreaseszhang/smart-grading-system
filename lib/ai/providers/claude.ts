import Anthropic from '@anthropic-ai/sdk';
import { generateGradingPrompt } from '../prompts/grading';
import type { GradingRequest, GradingResult } from '@/types';

export class ClaudeProvider {
  private client: Anthropic;

  constructor(
    private apiKey: string,
    private model: string = 'claude-3-5-sonnet-20241022'
  ) {
    this.client = new Anthropic({
      apiKey: this.apiKey,
    });
  }

  async grade(request: GradingRequest): Promise<GradingResult> {
    // 生成提示词
    const prompt = generateGradingPrompt(request);

    // 调用 Claude API
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      temperature: 0.3,
      system:
        '你是一个专业的教育评估专家，擅长对主观题进行5分制评分。你的评价要积极鼓励、具体实用。请始终返回有效的 JSON 格式。',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // 解析响应
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Claude 返回了非文本响应');
    }

    // 尝试提取 JSON（Claude 可能会在 markdown 代码块中返回）
    let jsonStr = content.text;
    const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const result = JSON.parse(jsonStr);

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
