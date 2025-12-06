import { NextRequest, NextResponse } from 'next/server';

// 这个 API 只用于测试 AI 配置是否有效
// 实际的配置存储在环境变量中

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model } = body;

    // 验证环境变量配置
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: '未配置 OPENAI_API_KEY 环境变量' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'AI 配置验证通过',
      config: {
        model: model || getDefaultModel(),
        baseURL: getDefaultBaseURL(),
      },
    });
  } catch (error) {
    console.error('配置验证失败:', error);
    return NextResponse.json(
      { error: '配置验证失败' },
      { status: 500 }
    );
  }
}

function getDefaultModel(): string {
  return 'claude-sonnet-latest';
}

function getDefaultBaseURL(): string {
  return process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
}
