import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJsonFile, writeJsonFile, FILES } from '@/lib/db/file-storage';
import type { Submission } from '@/types';

// Validation schema for updating a submission
const SubmissionUpdateSchema = z.object({
  score: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  scoreLabel: z.enum(['需要加强', '及格', '中等', '良好', '优秀']).optional(),
  upgradeAnswer: z
    .object({
      targetScore: z.number(),
      templateAnswer: z.string(),
      keyPoints: z.array(z.string()),
    })
    .optional(),
  feedback: z
    .object({
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      suggestions: z.array(z.string()),
    })
    .optional(),
  isWrong: z.boolean().optional(),
  reviewCount: z.number().optional(),
  lastReviewAt: z.string().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/submissions/[id]
 * Returns a specific submission by ID
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const fileData = await readJsonFile<Submission>(FILES.submissions);
    const submission = fileData.data.find((s) => s.id === id);

    if (!submission) {
      return NextResponse.json(
        {
          success: false,
          error: '答题记录不存在',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    console.error('Failed to read submission:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取答题记录失败',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/submissions/[id]
 * Updates a submission
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request data
    const validation = SubmissionUpdateSchema.safeParse(body);
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

    // Read existing submissions
    const fileData = await readJsonFile<Submission>(FILES.submissions);
    const index = fileData.data.findIndex((s) => s.id === id);

    if (index === -1) {
      return NextResponse.json(
        {
          success: false,
          error: '答题记录不存在',
        },
        { status: 404 }
      );
    }

    // Update submission
    fileData.data[index] = {
      ...fileData.data[index],
      ...validation.data,
    };

    await writeJsonFile<Submission>(FILES.submissions, fileData.data);

    return NextResponse.json({
      success: true,
      data: fileData.data[index],
    });
  } catch (error) {
    console.error('Failed to update submission:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '更新答题记录失败',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/submissions/[id]
 * Deletes a submission
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Read existing submissions
    const fileData = await readJsonFile<Submission>(FILES.submissions);
    const filtered = fileData.data.filter((s) => s.id !== id);

    if (filtered.length === fileData.data.length) {
      return NextResponse.json(
        {
          success: false,
          error: '答题记录不存在',
        },
        { status: 404 }
      );
    }

    await writeJsonFile<Submission>(FILES.submissions, filtered);

    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('Failed to delete submission:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '删除答题记录失败',
      },
      { status: 500 }
    );
  }
}
