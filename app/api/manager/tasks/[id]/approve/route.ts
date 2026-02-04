import { withManagerAuth } from '@/lib/manager-auth-middleware';
import { approveTask } from '@/lib/manager-verification-service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/manager/tasks/:id/approve
 * 
 * Approve task completion and grant bonus spins
 * Requirements: 4.2, 4.3, 4.4, 4.6, 4.7, 4.8
 */
export const POST = withManagerAuth(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const taskId = pathParts[pathParts.length - 2]; // Second to last is the ID

    const body = await request.json();
    const { comment } = body;

    // Validate comment
    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      );
    }

    const result = await approveTask(context.managerId, taskId, comment);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      bonusSpinsGranted: result.bonusSpinsGranted
    });

  } catch (error) {
    console.error('Approve task error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
});
