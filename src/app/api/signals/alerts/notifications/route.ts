import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
  unreadOnly: z.coerce.boolean().default(false),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// GET /api/signals/alerts/notifications - 알림 목록 조회
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());
  const parsed = querySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { unreadOnly, limit, offset } = parsed.data;

  const where: Record<string, unknown> = {
    userId: session.user.id,
  };

  if (unreadOnly) {
    where.readAt = null;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    db.alertNotification.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    db.alertNotification.count({ where }),
    db.alertNotification.count({
      where: {
        userId: session.user.id,
        readAt: null,
      },
    }),
  ]);

  return NextResponse.json({
    notifications,
    total,
    unreadCount,
    limit,
    offset,
    hasMore: offset + notifications.length < total,
  });
}

// POST /api/signals/alerts/notifications/read-all - 전체 읽음 처리
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = (body as Record<string, unknown>).action;

  if (action === 'read-all') {
    await db.alertNotification.updateMany({
      where: {
        userId: session.user.id,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
