import { NextRequest, NextResponse } from 'next/server';
import { OpenAIProvider } from '@/lib/ai/providers/openai';
import { getAIConfig } from '@/lib/ai/config';
import type { GradingRequest } from '@/types';
import { z } from 'zod';

// 请求体验证 schema
const GradeRequestSchema = z.object({
  questionText: z.string().min(1, '题目不能为空'),
  referenceAnswer: z.string().min(1, '参考答案不能为空'),
  studentAnswer: z.string().min(1, '学生答案不能为空'),
  scoringCriteria: z.string().optional(),
  currentScore: z.number().min(1).max(5).optional(),
  model: z.string().optional(),
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

    const gradingRequest = validation.data;

    // 从环境变量获取 AI 配置
    const aiConfig = getAIConfig(gradingRequest.model);

    // 使用 OpenAI provider（从环境变量配置）
    const provider = new OpenAIProvider(
      aiConfig.apiKey,
      aiConfig.model!,
      aiConfig.baseURL
    );

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
