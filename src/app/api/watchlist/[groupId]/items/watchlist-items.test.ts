import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock db
vi.mock('@/lib/db', () => ({
  db: {
    watchlistGroup: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    watchlistItem: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { POST } from './route';

const mockAuth = auth as unknown as Mock;
const mockDb = db as unknown as {
  watchlistGroup: { [key: string]: Mock };
  watchlistItem: { [key: string]: Mock };
  $transaction: Mock;
};

describe('Watchlist API - /api/watchlist/[groupId]/items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockParams = Promise.resolve({ groupId: 'group-1' });

  describe('POST /api/watchlist/[groupId]/items', () => {
    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/watchlist/group-1/items', {
        method: 'POST',
        body: JSON.stringify({ symbol: '005930', name: '삼성전자' }),
      });

      const response = await POST(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if group not found', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
        expires: new Date().toISOString(),
      });

      mockDb.watchlistGroup.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/watchlist/group-1/items', {
        method: 'POST',
        body: JSON.stringify({ symbol: '005930', name: '삼성전자' }),
      });

      const response = await POST(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Group not found');
    });

    it('should return 409 if item already exists', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
        expires: new Date().toISOString(),
      });

      mockDb.watchlistGroup.findFirst.mockResolvedValue({
        id: 'group-1',
        name: '관심종목 1',
        order: 0,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockDb.watchlistItem.findFirst.mockResolvedValue({
        id: 'item-1',
        symbol: '005930',
        name: '삼성전자',
        order: 0,
        groupId: 'group-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost/api/watchlist/group-1/items', {
        method: 'POST',
        body: JSON.stringify({ symbol: '005930', name: '삼성전자' }),
      });

      const response = await POST(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Item already exists in this group');
    });

    it('should add item to watchlist', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
        expires: new Date().toISOString(),
      });

      mockDb.watchlistGroup.findFirst.mockResolvedValue({
        id: 'group-1',
        name: '관심종목 1',
        order: 0,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockDb.watchlistItem.findFirst.mockResolvedValue(null);
      mockDb.watchlistItem.count.mockResolvedValue(0);

      const newItem = {
        id: 'item-1',
        symbol: '005930',
        name: '삼성전자',
        order: 0,
        memo: '장기 투자',
        targetPrice: 80000,
        buyPrice: null,
        groupId: 'group-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.watchlistItem.create.mockResolvedValue(newItem);

      const request = new NextRequest('http://localhost/api/watchlist/group-1/items', {
        method: 'POST',
        body: JSON.stringify({
          symbol: '005930',
          name: '삼성전자',
          memo: '장기 투자',
          targetPrice: 80000,
        }),
      });

      const response = await POST(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.symbol).toBe('005930');
      expect(data.name).toBe('삼성전자');
      expect(data.memo).toBe('장기 투자');
      expect(mockDb.watchlistItem.create).toHaveBeenCalledWith({
        data: {
          symbol: '005930',
          name: '삼성전자',
          memo: '장기 투자',
          targetPrice: 80000,
          buyPrice: undefined,
          order: 0,
          groupId: 'group-1',
        },
      });
    });
  });
});
