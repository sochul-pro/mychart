import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WatchlistItemRow } from './WatchlistItemRow';
import type { WatchlistItem } from '@/types';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
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

    expect(screen.getByText('삼성전자')).toBeInTheDocument();
    expect(screen.getByText('005930')).toBeInTheDocument();
    expect(screen.getByText('메모 내용')).toBeInTheDocument();
    expect(screen.getByText(/목표 80,000/)).toBeInTheDocument();
    expect(screen.getByText(/매수 70,000/)).toBeInTheDocument();
  });

  it('should render item without memo', () => {
    const itemWithoutMemo: WatchlistItem = {
      ...mockItem,
      memo: null,
    };

    render(
      <WatchlistItemRow
        item={itemWithoutMemo}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('삼성전자')).toBeInTheDocument();
    expect(screen.queryByText('메모 내용')).not.toBeInTheDocument();
  });

  it('should render item without prices', () => {
    const itemWithoutPrices: WatchlistItem = {
      ...mockItem,
      targetPrice: null,
      buyPrice: null,
    };

    render(
      <WatchlistItemRow
        item={itemWithoutPrices}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText(/목표/)).not.toBeInTheDocument();
    expect(screen.queryByText(/매수/)).not.toBeInTheDocument();
  });

  it('should render item with only targetPrice', () => {
    const itemWithTargetOnly: WatchlistItem = {
      ...mockItem,
      buyPrice: null,
    };

    render(
      <WatchlistItemRow
        item={itemWithTargetOnly}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/목표 80,000/)).toBeInTheDocument();
    expect(screen.queryByText(/매수/)).not.toBeInTheDocument();
  });

  it('should render item with only buyPrice', () => {
    const itemWithBuyOnly: WatchlistItem = {
      ...mockItem,
      targetPrice: null,
    };

    render(
      <WatchlistItemRow
        item={itemWithBuyOnly}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText(/목표/)).not.toBeInTheDocument();
    expect(screen.getByText(/매수 70,000/)).toBeInTheDocument();
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
});
