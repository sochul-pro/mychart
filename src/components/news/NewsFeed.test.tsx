import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NewsFeed } from './NewsFeed';
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

describe('NewsFeed', () => {
  it('should render title', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ news: [], total: 0 }),
    });

    render(<NewsFeed title="삼성전자 뉴스" />, { wrapper: createWrapper() });
    expect(screen.getByText('삼성전자 뉴스')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<NewsFeed />, { wrapper: createWrapper() });
    // Check for loading skeleton
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render news items', async () => {
    const mockNews = [
      {
        id: 'news-1',
        title: '테스트 뉴스 1',
        url: 'https://example.com/1',
        source: '한국경제',
        publishedAt: Date.now(),
      },
      {
        id: 'news-2',
        title: '테스트 뉴스 2',
        url: 'https://example.com/2',
        source: '매일경제',
        publishedAt: Date.now(),
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ news: mockNews, total: 2 }),
    });

    render(<NewsFeed />, { wrapper: createWrapper() });

    // Wait for news to load
    await screen.findByText('테스트 뉴스 1');
    expect(screen.getByText('테스트 뉴스 2')).toBeInTheDocument();
  });

  it('should show empty state when no news', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ news: [], total: 0 }),
    });

    render(<NewsFeed />, { wrapper: createWrapper() });

    await screen.findByText('뉴스가 없습니다.');
  });
});
