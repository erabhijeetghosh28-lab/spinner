import { grantDirectSpin } from '@/lib/direct-spin-service';
import { validateManagerAuth } from '@/lib/manager-auth-middleware';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/manager/customers/:userId/grant-spin
 * 
 * Grant direct spin to customer (for standee use case)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await validateManagerAuth(req);
    if (!auth.valid || !auth.context) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js App Router
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const { comment } = body;

    const result = await grantDirectSpin(
      auth.context.managerId,
      userId,
      comment
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Grant spin error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
