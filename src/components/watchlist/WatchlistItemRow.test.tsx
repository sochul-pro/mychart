import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WatchlistItemRow } from './WatchlistItemRow';
import type { WatchlistItem } from '@/types';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// useStockQuote mock
vi.mock('@/hooks/useStock', () => ({
  useStockQuote: vi.fn(() => ({
    data: {
      price: 75000,
      changePercent: 1.5,
    },
    isLoading: false,
  })),
}));

describe('WatchlistItemRow', () => {
  const mockItem: WatchlistItem = {
    id: '1',
    symbol: '005930',
    name: '삼성전자',
    memo: '메모 내용',
    targetPrice: 80000,
    buyPrice: 70000,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    groupId: 'group-1',
  };

  const mockOnUpdate = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render item info correctly', () => {
    render(
      <WatchlistItemRow
        item={mockItem}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // 종목명 표시
    expect(screen.getByText('삼성전자')).toBeInTheDocument();
    // 종목코드 (하위 6자리)
    expect(screen.getByText('005930')).toBeInTheDocument();
    // 현재가 (mock 데이터)
    expect(screen.getByText('75,000')).toBeInTheDocument();
    // 등락률 (mock 데이터)
    expect(screen.getByText('+1.50%')).toBeInTheDocument();
  });

  it('should render item without targetPrice', () => {
    const itemWithoutTarget: WatchlistItem = {
      ...mockItem,
      targetPrice: null,
    };

    render(
      <WatchlistItemRow
        item={itemWithoutTarget}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('삼성전자')).toBeInTheDocument();
    // 목표가 없으면 '-' 표시
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(1);
  });

  it('should render targetPrice when provided', () => {
    render(
      <WatchlistItemRow
        item={mockItem}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // 목표가 80,000 표시
    expect(screen.getByText('80,000')).toBeInTheDocument();
  });

  it('should link to stock detail page', () => {
    render(
      <WatchlistItemRow
        item={mockItem}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/stocks/005930');
  });

  it('should have menu button', () => {
    render(
      <WatchlistItemRow
        item={mockItem}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const menuButton = screen.getByRole('button');
    expect(menuButton).toBeInTheDocument();
  });

  it('should display normalized stock name (remove 보통주)', () => {
    const itemWithCommon: WatchlistItem = {
      ...mockItem,
      name: '삼성전자보통주',
    };

    render(
      <WatchlistItemRow
        item={itemWithCommon}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('삼성전자')).toBeInTheDocument();
  });

  it('should display preferred stock as (우)', () => {
    const preferredItem: WatchlistItem = {
      ...mockItem,
      name: '삼성전자우선주',
    };

    render(
      <WatchlistItemRow
        item={preferredItem}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('삼성전자(우)')).toBeInTheDocument();
  });
});
