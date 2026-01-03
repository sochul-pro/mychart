import { NextResponse } from 'next/server';
import { stockProvider } from '@/lib/api/provider-factory';
import type { SectorSummary } from '@/types';

export interface SectorSummaryResponse {
  summaries: SectorSummary[];
  updatedAt: number;
}

// GET /api/sectors/summary - 전체 섹터 시세 요약
export async function GET() {
  try {
    const summaries = await stockProvider.getAllSectorSummaries();

    const response: SectorSummaryResponse = {
      summaries,
      updatedAt: Date.now(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Sector summary error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sector summaries' },
      { status: 500 }
    );
  }
}
