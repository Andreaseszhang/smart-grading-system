import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJsonFile, writeJsonFile, FILES } from '@/lib/db/file-storage';
import type { Submission } from '@/types';

// Validation schema for creating a submission
const SubmissionCreateSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  studentAnswer: z.string(),
  score: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  scoreLabel: z.enum(['需要加强', '及格', '中等', '良好', '优秀']),
  upgradeAnswer: z.object({
    targetScore: z.number(),
    templateAnswer: z.string(),
    keyPoints: z.array(z.string()),
  }),
  feedback: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
  isStandalone: z.boolean().optional(),
  gradedAt: z.string(),
});

/**
 * GET /api/submissions
 * Returns submissions with optional filters
 * Query params:
 *   - questionId: filter by question ID
 *   - wrong: filter wrong answers (score <= 3)
 *   - needReview: filter submissions needing review
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const wrong = searchParams.get('wrong') === 'true';
    const needReview = searchParams.get('needReview') === 'true';

    const fileData = await readJsonFile<Submission>(FILES.submissions);
    let submissions = fileData.data;

    // Apply filters
    if (questionId) {
      submissions = submissions.filter((s) => s.questionId === questionId);
    }

    if (wrong) {
      submissions = submissions.filter((s) => s.isWrong);
    }

    if (needReview) {
      submissions = submissions.filter((s) => s.isWrong && s.reviewCount === 0);
    }

    return NextResponse.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error('Failed to read submissions:', error);
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
 * POST /api/submissions
 * Creates a new submission
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request data
    const validation = SubmissionCreateSchema.safeParse(body);
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

    // Create new submission
    const now = new Date().toISOString();
    const newSubmission: Submission = {
      id: crypto.randomUUID(),
      ...validation.data,
      isWrong: validation.data.score <= 3,
      reviewCount: 0,
      submittedAt: now,
    };

    // Add to array and save
    fileData.data.push(newSubmission);
    await writeJsonFile<Submission>(FILES.submissions, fileData.data);

    return NextResponse.json({
      success: true,
      data: newSubmission,
    });
  } catch (error) {
    console.error('Failed to create submission:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建答题记录失败',
      },
      { status: 500 }
    );
  }
}
