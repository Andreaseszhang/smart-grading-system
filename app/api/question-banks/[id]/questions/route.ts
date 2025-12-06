import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJsonFile, writeJsonFile, FILES } from '@/lib/db/file-storage';
import type { QuestionBank } from '@/types';

// Validation schema for adding/removing questions
const QuestionIdSchema = z.object({
  questionId: z.string().min(1, '题目ID不能为空'),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/question-banks/[id]/questions
 * Adds a question to a question bank
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request data
    const validation = QuestionIdSchema.safeParse(body);
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

    const { questionId } = validation.data;

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

    const bank = fileData.data[index];

    // Check if question already exists in bank
    if (bank.questionIds.includes(questionId)) {
      return NextResponse.json({
        success: true,
        data: bank,
      });
    }

    // Add question to bank
    bank.questionIds.push(questionId);
    bank.updatedAt = new Date().toISOString();

    await writeJsonFile<QuestionBank>(FILES.banks, fileData.data);

    return NextResponse.json({
      success: true,
      data: bank,
    });
  } catch (error) {
    console.error('Failed to add question to bank:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '添加题目失败',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/question-banks/[id]/questions
 * Removes a question from a question bank
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request data
    const validation = QuestionIdSchema.safeParse(body);
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

    const { questionId } = validation.data;

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

    const bank = fileData.data[index];

    // Remove question from bank
    bank.questionIds = bank.questionIds.filter((qId) => qId !== questionId);
    bank.updatedAt = new Date().toISOString();

    await writeJsonFile<QuestionBank>(FILES.banks, fileData.data);

    return NextResponse.json({
      success: true,
      data: bank,
    });
  } catch (error) {
    console.error('Failed to remove question from bank:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '移除题目失败',
      },
      { status: 500 }
    );
  }
}
