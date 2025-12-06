/**
 * AI 评分接口测试脚本
 * 用于测试 OpenAI provider 的 JSON 解析和评分功能
 */

import { OpenAIProvider } from '../lib/ai/providers/openai';
import type { GradingRequest } from '../types';

async function testGradingAPI() {
  console.log('🧪 开始测试 AI 评分接口...\n');

  // 检查环境变量
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  const model = process.env.OPENAI_MODEL || 'claude-sonnet-latest';

  if (!apiKey) {
    console.error('❌ 错误: 缺少 OPENAI_API_KEY 环境变量');
    process.exit(1);
  }

  console.log('📋 配置信息:');
  console.log(`  - Model: ${model}`);
  console.log(`  - Base URL: ${baseURL || 'default'}\n`);

  // 创建 provider
  const provider = new OpenAIProvider(apiKey, model, baseURL);

  // 测试请求
  const testRequest: GradingRequest = {
    questionText: '什么是递归?请简述递归的概念和应用场景。',
    referenceAnswer:
      '递归是一种编程技巧,指函数调用自身来解决问题。递归包含两个要素:基准情况(停止条件)和递归情况(调用自身)。应用场景包括:树遍历、阶乘计算、斐波那契数列等。',
    studentAnswer: '递归就是函数自己调用自己,可以用来计算阶乘。',
    scoringCriteria: '包含基本概念(2分)、要素说明(2分)、应用场景(1分)',
  };

  try {
    console.log('📤 发送评分请求...');
    console.log('题目:', testRequest.questionText);
    console.log('学生答案:', testRequest.studentAnswer);
    console.log('');

    const startTime = Date.now();
    const result = await provider.grade(testRequest);
    const duration = Date.now() - startTime;

    console.log('✅ 评分成功!\n');
    console.log('📊 评分结果:');
    console.log('─────────────────────────────────────');
    console.log(`分数: ${result.score}/5 (${result.scoreLabel})`);
    console.log('');
    console.log('升级答案:');
    console.log(`  目标分数: ${result.upgradeAnswer.targetScore}`);
    console.log(`  模板答案: ${result.upgradeAnswer.templateAnswer}`);
    console.log('  关键得分点:');
    result.upgradeAnswer.keyPoints.forEach((point, i) => {
      console.log(`    ${i + 1}. ${point}`);
    });
    console.log('');
    console.log('反馈:');
    console.log('  优点:');
    result.feedback.strengths.forEach((s) => console.log(`    - ${s}`));
    console.log('  待改进:');
    result.feedback.weaknesses.forEach((w) => console.log(`    - ${w}`));
    console.log('  学习建议:');
    result.feedback.suggestions.forEach((s) => console.log(`    - ${s}`));
    console.log('─────────────────────────────────────');
    console.log(`⏱️  耗时: ${duration}ms\n`);

    // 验证数据结构
    console.log('🔍 验证数据结构...');
    const validations = [
      { name: 'score 类型', pass: typeof result.score === 'number' },
      { name: 'score 范围', pass: result.score >= 1 && result.score <= 5 },
      { name: 'scoreLabel 存在', pass: !!result.scoreLabel },
      { name: 'upgradeAnswer 存在', pass: !!result.upgradeAnswer },
      {
        name: 'upgradeAnswer.keyPoints 是数组',
        pass: Array.isArray(result.upgradeAnswer.keyPoints),
      },
      { name: 'feedback 存在', pass: !!result.feedback },
      {
        name: 'feedback.strengths 是数组',
        pass: Array.isArray(result.feedback.strengths),
      },
      {
        name: 'feedback.weaknesses 是数组',
        pass: Array.isArray(result.feedback.weaknesses),
      },
      {
        name: 'feedback.suggestions 是数组',
        pass: Array.isArray(result.feedback.suggestions),
      },
    ];

    let allPassed = true;
    validations.forEach((v) => {
      const icon = v.pass ? '✓' : '✗';
      console.log(`  ${icon} ${v.name}`);
      if (!v.pass) allPassed = false;
    });

    console.log('');
    if (allPassed) {
      console.log('🎉 所有验证通过!');
    } else {
      console.log('⚠️  部分验证失败,请检查数据结构');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 测试失败:');
    if (error instanceof Error) {
      console.error('错误信息:', error.message);
      console.error('堆栈:', error.stack);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// 运行测试
testGradingAPI();
