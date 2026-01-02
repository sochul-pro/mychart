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
import { GET, POST } from './route';

const mockAuth = auth as unknown as Mock;
const mockDb = db as unknown as {
  watchlistGroup: { [key: string]: Mock };
  watchlistItem: { [key: string]: Mock };
  $transaction: Mock;
};

describe('Watchlist API - /api/watchlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/watchlist', () => {
    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return user watchlist groups', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
        expires: new Date().toISOString(),
      });

      const mockGroups = [
        {
          id: 'group-1',
          name: '관심종목 1',
          order: 0,
          userId: 'user-1',
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDb.watchlistGroup.findMany.mockResolvedValue(mockGroups);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('관심종목 1');
    });
  });

  describe('POST /api/watchlist', () => {
    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Group' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 for invalid request', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
        expires: new Date().toISOString(),
      });

      const request = new NextRequest('http://localhost/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({ name: '' }), // Empty name
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should create a new watchlist group', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
        expires: new Date().toISOString(),
      });

      mockDb.watchlistGroup.count.mockResolvedValue(0);

      const newGroup = {
        id: 'group-1',
        name: 'New Group',
        order: 0,
        userId: 'user-1',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.watchlistGroup.create.mockResolvedValue(newGroup);

      const request = new NextRequest('http://localhost/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Group' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('New Group');
      expect(mockDb.watchlistGroup.create).toHaveBeenCalledWith({
        data: {
          name: 'New Group',
          order: 0,
          userId: 'user-1',
        },
        include: { items: true },
      });
    });
  });
});
