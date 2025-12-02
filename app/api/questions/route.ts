import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJsonFile, writeJsonFile, FILES } from '@/lib/db/file-storage';
import type { Question } from '@/types';

// Validation schema for creating a question
const QuestionCreateSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  questionText: z.string().min(1, '题目内容不能为空'),
  referenceAnswer: z.string().min(1, '参考答案不能为空'),
  scoringCriteria: z.string().optional(),
  totalScore: z.number().default(5),
  bankId: z.string().optional(),
});

/**
 * GET /api/questions
 * Returns all questions
 */
export async function GET() {
  try {
    const fileData = await readJsonFile<Question>(FILES.questions);

    return NextResponse.json({
      success: true,
      data: fileData.data,
    });
  } catch (error) {
    console.error('Failed to read questions:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取题目列表失败',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/questions
 * Creates a new question
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request data
    const validation = QuestionCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: '数据验证失败',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // Read existing questions
    const fileData = await readJsonFile<Question>(FILES.questions);

    // Create new question
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      ...validation.data,
      createdAt: new Date().toISOString(),
    };

    // Add to array and save
    fileData.data.push(newQuestion);
    await writeJsonFile<Question>(FILES.questions, fileData.data);

    return NextResponse.json({
      success: true,
      data: newQuestion,
    });
  } catch (error) {
    console.error('Failed to create question:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建题目失败',
      },
      { status: 500 }
    );
  }
}
