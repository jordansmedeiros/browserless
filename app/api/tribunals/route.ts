/**
 * Tribunals API Endpoint
 * Returns list of all tribunals
 */

import { NextResponse } from 'next/server';
import { listAllTRTs } from '@/lib/services/tribunal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tribunals = await listAllTRTs();

    return NextResponse.json(tribunals, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[GET /api/tribunals] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar tribunais' },
      { status: 500 }
    );
  }
}
