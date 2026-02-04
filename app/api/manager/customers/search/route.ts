import { searchCustomers } from '@/lib/direct-spin-service';
import { validateManagerAuth } from '@/lib/manager-auth-middleware';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/manager/customers/search
 * 
 * Search customers by phone or name for direct spin granting
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await validateManagerAuth(req);
    if (!auth.valid || !auth.context) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    console.log('[API] Search request - Manager:', auth.context.managerId, 'Tenant:', auth.context.tenantId, 'Query:', query);

    const customers = await searchCustomers(auth.context.managerId, query.trim());

    console.log('[API] Search response - Found:', customers.length, 'customers');

    return NextResponse.json({ customers });
  } catch (error: any) {
    console.error('[API] Search customers error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
