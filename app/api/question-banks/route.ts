import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJsonFile, writeJsonFile, FILES } from '@/lib/db/file-storage';
import type { QuestionBank } from '@/types';

// Validation schema for creating a question bank
const QuestionBankCreateSchema = z.object({
  name: z.string().min(1, '题库名称不能为空'),
  description: z.string().optional(),
  questionIds: z.array(z.string()).default([]),
});

/**
 * GET /api/question-banks
 * Returns all question banks
 */
export async function GET() {
  try {
    const fileData = await readJsonFile<QuestionBank>(FILES.banks);

    return NextResponse.json({
      success: true,
      data: fileData.data,
    });
  } catch (error) {
    console.error('Failed to read question banks:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取题库列表失败',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/question-banks
 * Creates a new question bank
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request data
    const validation = QuestionBankCreateSchema.safeParse(body);
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

    // Read existing banks
    const fileData = await readJsonFile<QuestionBank>(FILES.banks);

    // Create new bank
    const now = new Date().toISOString();
    const newBank: QuestionBank = {
      id: crypto.randomUUID(),
      name: validation.data.name,
      description: validation.data.description,
      questionIds: validation.data.questionIds,
      createdAt: now,
      updatedAt: now,
    };

    // Add to array and save
    fileData.data.push(newBank);
    await writeJsonFile<QuestionBank>(FILES.banks, fileData.data);

    return NextResponse.json({
      success: true,
      data: newBank,
    });
  } catch (error) {
    console.error('Failed to create question bank:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建题库失败',
      },
      { status: 500 }
    );
  }
}
