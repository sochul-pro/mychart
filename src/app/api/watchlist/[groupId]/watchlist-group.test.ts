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
import { GET, PUT, DELETE } from './route';

const mockAuth = auth as unknown as Mock;
const mockDb = db as unknown as {
  watchlistGroup: { [key: string]: Mock };
  watchlistItem: { [key: string]: Mock };
  $transaction: Mock;
};

describe('Watchlist API - /api/watchlist/[groupId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockParams = Promise.resolve({ groupId: 'group-1' });

  describe('GET /api/watchlist/[groupId]', () => {
    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/watchlist/group-1');
      const response = await GET(request, { params: mockParams });
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

      const request = new NextRequest('http://localhost/api/watchlist/group-1');
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Group not found');
    });

    it('should return group with items', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
        expires: new Date().toISOString(),
      });

      const mockGroup = {
        id: 'group-1',
        name: '관심종목 1',
        order: 0,
        userId: 'user-1',
        items: [
          {
            id: 'item-1',
            symbol: '005930',
            name: '삼성전자',
            order: 0,
            memo: null,
            targetPrice: null,
            buyPrice: null,
            groupId: 'group-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.watchlistGroup.findFirst.mockResolvedValue(mockGroup);

      const request = new NextRequest('http://localhost/api/watchlist/group-1');
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('관심종목 1');
      expect(data.items).toHaveLength(1);
    });
  });

  describe('PUT /api/watchlist/[groupId]', () => {
    it('should update group name', async () => {
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

      mockDb.watchlistGroup.update.mockResolvedValue({
        id: 'group-1',
        name: '새 이름',
        order: 0,
        userId: 'user-1',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost/api/watchlist/group-1', {
        method: 'PUT',
        body: JSON.stringify({ name: '새 이름' }),
      });

      const response = await PUT(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('새 이름');
    });
  });

  describe('DELETE /api/watchlist/[groupId]', () => {
    it('should delete group', async () => {
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

      mockDb.watchlistGroup.delete.mockResolvedValue({
        id: 'group-1',
        name: '관심종목 1',
        order: 0,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost/api/watchlist/group-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockDb.watchlistGroup.delete).toHaveBeenCalledWith({
        where: { id: 'group-1' },
      });
    });
  });
});
