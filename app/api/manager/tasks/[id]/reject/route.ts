import { withManagerAuth } from '@/lib/manager-auth-middleware';
import { rejectTask } from '@/lib/manager-verification-service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/manager/tasks/:id/reject
 * 
 * Reject task completion
 * Requirements: 4.2, 4.3, 4.5
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

    const result = await rejectTask(context.managerId, taskId, comment);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Reject task error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
});
