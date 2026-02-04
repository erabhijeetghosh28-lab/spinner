import { withManagerAuth } from '@/lib/manager-auth-middleware';
import { getTaskDetail } from '@/lib/manager-verification-service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/manager/tasks/:id
 * 
 * Get detailed task information
 * Requirements: 4.1, 8.2
 */
export const GET = withManagerAuth(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const taskId = pathParts[pathParts.length - 1];

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const taskDetail = await getTaskDetail(context.managerId, taskId);

    return NextResponse.json(taskDetail);

  } catch (error) {
    console.error('Get task detail error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    // Return 403 for access denied errors
    if (errorMessage.includes('Access denied') || errorMessage.includes('different tenant')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
});
