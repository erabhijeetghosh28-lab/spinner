import { withManagerAuth } from '@/lib/manager-auth-middleware';
import { getPendingTasks } from '@/lib/manager-verification-service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/manager/tasks/pending
 * 
 * Get pending task completions for manager's tenant
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
export const GET = withManagerAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      status: searchParams.get('status') as any || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    };

    const tasks = await getPendingTasks(context.managerId, filters);

    return NextResponse.json({
      tasks,
      total: tasks.length
    });

  } catch (error) {
    console.error('Get pending tasks error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
});
