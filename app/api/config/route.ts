import { NextRequest, NextResponse } from 'next/server';

// 这个 API 只用于测试 AI 配置是否有效
// 实际的配置存储在客户端 IndexedDB 中

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, model, baseURL } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'provider 和 apiKey 是必填项' },
        { status: 400 }
      );
    }

    // 简单的 API Key 格式验证
    let isValid = false;
    let errorMessage = '';

    switch (provider) {
      case 'openai':
        if (apiKey.startsWith('sk-')) {
          isValid = true;
        } else {
          errorMessage = 'OpenAI API Key 应该以 sk- 开头';
        }
        break;

      case 'claude':
        if (apiKey.startsWith('sk-ant-')) {
          isValid = true;
        } else {
          errorMessage = 'Claude API Key 应该以 sk-ant- 开头';
        }
        break;

      case 'zhipu':
        // 智谱 AI 的 API Key 格式验证
        if (apiKey.length > 20) {
          isValid = true;
        } else {
          errorMessage = '智谱 AI API Key 格式不正确';
        }
        break;

      default:
        return NextResponse.json(
          { error: '不支持的 provider' },
          { status: 400 }
        );
    }

    if (!isValid) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API Key 格式验证通过',
      config: {
        provider,
        model: model || getDefaultModel(provider),
        baseURL: baseURL || getDefaultBaseURL(provider),
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

function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4o-mini';
    case 'claude':
      return 'claude-3-5-sonnet-20241022';
    case 'zhipu':
      return 'glm-4-flash';
    default:
      return '';
  }
}

function getDefaultBaseURL(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com/v1';
    case 'claude':
      return 'https://api.anthropic.com';
    case 'zhipu':
      return 'https://open.bigmodel.cn/api/paas/v4';
    default:
      return '';
  }
}
