import { NextResponse } from 'next/server';
import { SUPPORTED_INDICES } from '@/types/comparison';

/**
 * 지원하는 지수 목록 조회
 * GET /api/indices
 */
export async function GET() {
  return NextResponse.json({
    indices: SUPPORTED_INDICES,
    total: SUPPORTED_INDICES.length,
  });
}
