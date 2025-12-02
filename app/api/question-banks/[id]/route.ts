import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJsonFile, writeJsonFile, FILES } from '@/lib/db/file-storage';
import type { QuestionBank } from '@/types';

// Validation schema for updating a question bank
const QuestionBankUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  questionIds: z.array(z.string()).optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/question-banks/[id]
 * Returns a specific question bank by ID
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const fileData = await readJsonFile<QuestionBank>(FILES.banks);
    const bank = fileData.data.find((b) => b.id === id);

    if (!bank) {
      return NextResponse.json(
        {
          success: false,
          error: '题库不存在',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bank,
    });
  } catch (error) {
    console.error('Failed to read question bank:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取题库失败',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/question-banks/[id]
 * Updates a question bank
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request data
    const validation = QuestionBankUpdateSchema.safeParse(body);
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
    const index = fileData.data.findIndex((b) => b.id === id);

    if (index === -1) {
      return NextResponse.json(
        {
          success: false,
          error: '题库不存在',
        },
        { status: 404 }
      );
    }

    // Update bank
    fileData.data[index] = {
      ...fileData.data[index],
      ...validation.data,
      updatedAt: new Date().toISOString(),
    };

    await writeJsonFile<QuestionBank>(FILES.banks, fileData.data);

    return NextResponse.json({
      success: true,
      data: fileData.data[index],
    });
  } catch (error) {
    console.error('Failed to update question bank:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '更新题库失败',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/question-banks/[id]
 * Deletes a question bank
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Read existing banks
    const fileData = await readJsonFile<QuestionBank>(FILES.banks);
    const filtered = fileData.data.filter((b) => b.id !== id);

    if (filtered.length === fileData.data.length) {
      return NextResponse.json(
        {
          success: false,
          error: '题库不存在',
        },
        { status: 404 }
      );
    }

    await writeJsonFile<QuestionBank>(FILES.banks, filtered);

    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('Failed to delete question bank:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '删除题库失败',
      },
      { status: 500 }
    );
  }
}
