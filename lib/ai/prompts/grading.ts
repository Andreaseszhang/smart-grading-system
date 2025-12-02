import type { GradingRequest } from '@/types';

export function generateGradingPrompt(request: GradingRequest): string {
  const { questionText, referenceAnswer, studentAnswer, scoringCriteria='' } = request;

  return `
作为专业的教育评估专家，请对学生答案进行5分制评分并生成学习建议。

**题目：**
${questionText}

**参考答案：**
${referenceAnswer}

**评分细则：**
${scoringCriteria}

**学生答案：**
${studentAnswer}

---

**任务要求：**
1. 5分制评分（1-5分）
2. 生成升级答案模板（目标：当前分+1，含3-5个关键得分点）
3. 详细反馈：优点1个、待改进至少2个、学习建议至少3个

---

**输出格式：**
请用 \`\`\`json 代码块输出，严格遵守以下规则：
- 使用英文双引号，禁止中文引号
- 字符串内的换行用 \\n 表示
- 确保JSON完整闭合

\`\`\`json
{
  "score": 3,
  "scoreLabel": "中等",
  "upgradeAnswer": {
    "targetScore": 4,
    "templateAnswer": "基于当前用户的答案，如果要提升用户回答到下一个分数段，建议参考以下答案模板：......",
    "keyPoints": ["得分点1", "得分点2", "得分点3"]
  },
  "feedback": {
    "strengths": ["优点"],
    "weaknesses": ["待改进1", "待改进2"],
    "suggestions": ["建议1", "建议2", "建议3"]
  }
}
\`\`\``;
}
