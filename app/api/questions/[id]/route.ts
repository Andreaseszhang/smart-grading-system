import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJsonFile, writeJsonFile, FILES } from '@/lib/db/file-storage';
import type { Question } from '@/types';

// Validation schema for updating a question
const QuestionUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  questionText: z.string().min(1).optional(),
  referenceAnswer: z.string().min(1).optional(),
  scoringCriteria: z.string().optional(),
  totalScore: z.number().optional(),
  bankId: z.string().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/questions/[id]
 * Returns a specific question by ID
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const fileData = await readJsonFile<Question>(FILES.questions);
    const question = fileData.data.find((q) => q.id === id);

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error: '题目不存在',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error('Failed to read question:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取题目失败',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/questions/[id]
 * Updates a question
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request data
    const validation = QuestionUpdateSchema.safeParse(body);
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
    const index = fileData.data.findIndex((q) => q.id === id);

    if (index === -1) {
      return NextResponse.json(
        {
          success: false,
          error: '题目不存在',
        },
        { status: 404 }
      );
    }

    // Update question
    fileData.data[index] = {
      ...fileData.data[index],
      ...validation.data,
    };

    await writeJsonFile<Question>(FILES.questions, fileData.data);

    return NextResponse.json({
      success: true,
      data: fileData.data[index],
    });
  } catch (error) {
    console.error('Failed to update question:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '更新题目失败',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/questions/[id]
 * Deletes a question
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Read existing questions
    const fileData = await readJsonFile<Question>(FILES.questions);
    const filtered = fileData.data.filter((q) => q.id !== id);

    if (filtered.length === fileData.data.length) {
      return NextResponse.json(
        {
          success: false,
          error: '题目不存在',
        },
        { status: 404 }
      );
    }

    await writeJsonFile<Question>(FILES.questions, filtered);

    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('Failed to delete question:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '删除题目失败',
      },
      { status: 500 }
    );
  }
}
