import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWatchlist } from './useWatchlist';
import type { ReactNode } from 'react';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryWrapper';
  return Wrapper;
};

describe('useWatchlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch watchlist groups', async () => {
    const mockGroups = [
      {
        id: 'group-1',
        name: '관심종목 1',
        order: 0,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGroups),
    });

    const { result } = renderHook(() => useWatchlist(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.groups).toHaveLength(1);
    expect(result.current.groups[0].name).toBe('관심종목 1');
  });

  it('should handle fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useWatchlist(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('should create group', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'new-group',
            name: 'New Group',
            order: 0,
            items: [],
          }),
      });

    const { result } = renderHook(() => useWatchlist(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.createGroup({ name: 'New Group' });

    expect(mockFetch).toHaveBeenCalledWith('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Group' }),
    });
  });

  it('should delete group', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    const { result } = renderHook(() => useWatchlist(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.deleteGroup('group-1');

    expect(mockFetch).toHaveBeenCalledWith('/api/watchlist/group-1', {
      method: 'DELETE',
    });
  });

  it('should add item to group', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'new-item',
            symbol: '005930',
            name: '삼성전자',
          }),
      });

    const { result } = renderHook(() => useWatchlist(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.addItem({
      groupId: 'group-1',
      data: { symbol: '005930', name: '삼성전자' },
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/watchlist/group-1/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: '005930', name: '삼성전자' }),
    });
  });
});
