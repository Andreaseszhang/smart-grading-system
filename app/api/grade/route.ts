import { NextRequest, NextResponse } from 'next/server';
import { OpenAIProvider } from '@/lib/ai/providers/openai';
import { ClaudeProvider } from '@/lib/ai/providers/claude';
import { ZhipuProvider } from '@/lib/ai/providers/zhipu';
import type { GradingRequest } from '@/types';
import { z } from 'zod';

// 请求体验证 schema
const GradeRequestSchema = z.object({
  questionText: z.string().min(1, '题目不能为空'),
  referenceAnswer: z.string().min(1, '参考答案不能为空'),
  studentAnswer: z.string().min(1, '学生答案不能为空'),
  scoringCriteria: z.string().optional(),
  currentScore: z.number().min(1).max(5).optional(),
  aiConfig: z.object({
    provider: z.enum(['openai', 'claude', 'zhipu']),
    apiKey: z.string().min(1, 'API Key 不能为空'),
    model: z.string().optional(),
    baseURL: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();

    // 验证请求体
    const validation = GradeRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: '请求参数验证失败',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { aiConfig, ...gradingRequest } = validation.data;

    // 根据 provider 选择对应的 AI 服务
    let provider;
    switch (aiConfig.provider) {
      case 'openai':
        provider = new OpenAIProvider(
          aiConfig.apiKey,
          aiConfig.model || 'gpt-4o-mini',
          aiConfig.baseURL // 传递 baseURL
        );
        break;

      case 'claude':
        provider = new ClaudeProvider(
          aiConfig.apiKey,
          aiConfig.model || 'claude-3-5-sonnet-20241022'
        );
        break;

      case 'zhipu':
        provider = new ZhipuProvider(
          aiConfig.apiKey,
          aiConfig.model || 'glm-4-flash'
        );
        break;

      default:
        return NextResponse.json(
          { error: '不支持的 AI provider' },
          { status: 400 }
        );
    }

    // 调用 AI 进行批改
    const result = await provider.grade(gradingRequest as GradingRequest);

    // 返回批改结果
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('批改失败:', error);

    // 处理 API 错误
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: '批改失败',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '批改过程中发生未知错误' },
      { status: 500 }
    );
  }
}
