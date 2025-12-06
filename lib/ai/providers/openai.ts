import OpenAI from 'openai';
import { generateGradingPrompt } from '../prompts/grading';
import type { GradingRequest, GradingResult } from '@/types';

export class OpenAIProvider {
  private client: OpenAI;

  constructor(
    private apiKey: string,
    private model: string = 'claude-sonnet-latest',
    private baseURL?: string
  ) {
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseURL, // 支持自定义 baseURL
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
      temperature: 0.5,
      response_format: { type: 'json_object' }, // 强制返回 JSON
    });

    // 解析响应
    const content = completion.choices[0].message.content;
    const result = this.parseJSON(content || '{}');

    return this.normalizeResult(result);
  }

  // 解析 JSON，支持处理 markdown 代码块和各种边缘情况
  private parseJSON(content: string): Record<string, unknown> {
    let cleanContent = content.trim();

    try {
      // 策略1：移除 markdown 代码块标记
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```(?:json)?\s*\n?/, '');
        cleanContent = cleanContent.replace(/\n?```\s*$/, '');
        cleanContent = cleanContent.trim();
      }

      // 策略1.5：替换中文引号为英文引号（避免 JSON 解析错误）
      cleanContent = cleanContent
        .replace(/"/g, '"')  // 中文左引号
        .replace(/"/g, '"')  // 中文右引号
        .replace(/'/g, "'")  // 中文左单引号
        .replace(/'/g, "'"); // 中文右单引号

      // 策略2：尝试直接解析
      try {
        return JSON.parse(cleanContent);
      } catch (firstError) {
        console.warn('第一次 JSON 解析失败，尝试修复...', firstError);

        // 策略3：移除 BOM 和零宽字符
        const fixedContent = cleanContent
          .replace(/^\uFEFF/, '') // BOM
          .replace(/[\u200B-\u200D\uFEFF]/g, ''); // 零宽字符

        // 策略4：尝试解析修复后的内容
        try {
          return JSON.parse(fixedContent);
        } catch (secondError) {
          console.warn('第二次 JSON 解析失败，尝试移除 emoji...', secondError);

          // 策略5：移除 emoji 和其他特殊 Unicode 字符
          const noEmojiContent = fixedContent.replace(
            /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
            ''
          );

          try {
            return JSON.parse(noEmojiContent);
          } catch (thirdError) {
            console.warn('第三次 JSON 解析失败，尝试提取...', thirdError);

            // 策略6：尝试提取 JSON 对象（处理可能的额外文本）
            const jsonMatch = noEmojiContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                return JSON.parse(jsonMatch[0]);
              } catch (fourthError) {
                console.error('第四次 JSON 解析失败', fourthError);
              }
            }
          }
        }
      }

      // 所有策略都失败，记录详细错误信息
      console.error('===== JSON 解析完全失败 =====');
      console.error('原始内容长度:', content.length);
      console.error('原始内容:', content);
      console.error('清理后内容长度:', cleanContent.length);
      console.error('清理后内容:', cleanContent);
      console.error('================================');

      return {};
    } catch (error) {
      console.error('parseJSON 异常:', error);
      return {};
    }
  }

  // 标准化结果
  private normalizeResult(raw: Record<string, unknown>): GradingResult {
    // 安全地提取并验证 score
    const rawScore = typeof raw.score === 'number' ? raw.score : 3;
    const score = Math.max(1, Math.min(5, rawScore)) as 1 | 2 | 3 | 4 | 5;

    // 安全地提取各个字段，提供默认值
    const upgradeAnswer =
      raw.upgradeAnswer && typeof raw.upgradeAnswer === 'object'
        ? (raw.upgradeAnswer as {
            targetScore?: number;
            templateAnswer?: string;
            keyPoints?: string[];
          })
        : {};

    const feedback =
      raw.feedback && typeof raw.feedback === 'object'
        ? (raw.feedback as {
            strengths?: string[];
            weaknesses?: string[];
            suggestions?: string[];
          })
        : {};

    return {
      score,
      scoreLabel: this.getScoreLabel(score),
      upgradeAnswer: {
        targetScore: upgradeAnswer.targetScore || Math.min(5, score + 1),
        templateAnswer: upgradeAnswer.templateAnswer || '暂无升级答案模板',
        keyPoints: upgradeAnswer.keyPoints || [],
      },
      feedback: {
        strengths: feedback.strengths || ['暂无评价'],
        weaknesses: feedback.weaknesses || ['暂无评价'],
        suggestions: feedback.suggestions || ['暂无建议'],
      },
    };
  }

  private getScoreLabel(
    score: number
  ): '需要加强' | '及格' | '中等' | '良好' | '优秀' {
    const labels: {
      [key: number]: '需要加强' | '及格' | '中等' | '良好' | '优秀';
    } = {
      1: '需要加强',
      2: '及格',
      3: '中等',
      4: '良好',
      5: '优秀',
    };
    return labels[score] || '中等';
  }
}
