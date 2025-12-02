import { NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile, FILES } from '@/lib/db/file-storage';
import type { Submission } from '@/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/submissions/[id]/review
 * Marks a submission as reviewed
 * Increments review count and updates lastReviewAt
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // Update review count and timestamp
    fileData.data[index] = {
      ...fileData.data[index],
      reviewCount: fileData.data[index].reviewCount + 1,
      lastReviewAt: new Date().toISOString(),
    };

    await writeJsonFile<Submission>(FILES.submissions, fileData.data);

    return NextResponse.json({
      success: true,
      data: fileData.data[index],
    });
  } catch (error) {
    console.error('Failed to mark submission as reviewed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '标记复习失败',
      },
      { status: 500 }
    );
  }
}
