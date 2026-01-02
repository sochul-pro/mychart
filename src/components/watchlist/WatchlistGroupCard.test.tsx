import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WatchlistGroupCard } from './WatchlistGroupCard';
import type { WatchlistGroup } from '@/types';

const mockGroup: WatchlistGroup = {
  id: 'group-1',
  name: '테스트 그룹',
  order: 0,
  items: [
    {
      id: 'item-1',
      symbol: '005930',
      name: '삼성전자',
      order: 0,
      memo: '장기 투자',
      targetPrice: 80000,
      buyPrice: 70000,
      groupId: 'group-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const emptyGroup: WatchlistGroup = {
  ...mockGroup,
  id: 'group-2',
  name: '빈 그룹',
  items: [],
};

describe('WatchlistGroupCard', () => {
  const mockHandlers = {
    onRenameGroup: vi.fn().mockResolvedValue(undefined),
    onDeleteGroup: vi.fn().mockResolvedValue(undefined),
    onAddItem: vi.fn().mockResolvedValue(undefined),
    onUpdateItem: vi.fn().mockResolvedValue(undefined),
    onDeleteItem: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render group name and item count', () => {
    render(<WatchlistGroupCard group={mockGroup} {...mockHandlers} />);

    expect(screen.getByText('테스트 그룹')).toBeInTheDocument();
    expect(screen.getByText('(1)')).toBeInTheDocument();
  });

  it('should render empty state when no items', () => {
    render(<WatchlistGroupCard group={emptyGroup} {...mockHandlers} />);

    expect(screen.getByText('종목을 추가하세요')).toBeInTheDocument();
  });

  it('should render item with details', () => {
    render(<WatchlistGroupCard group={mockGroup} {...mockHandlers} />);

    expect(screen.getByText('삼성전자')).toBeInTheDocument();
    expect(screen.getByText('005930')).toBeInTheDocument();
    expect(screen.getByText('장기 투자')).toBeInTheDocument();
    expect(screen.getByText(/목표 80,000/)).toBeInTheDocument();
    expect(screen.getByText(/매수 70,000/)).toBeInTheDocument();
  });

  it('should open add stock dialog when clicking plus button', async () => {
    render(<WatchlistGroupCard group={mockGroup} {...mockHandlers} />);

    const addButton = screen.getAllByRole('button')[0];
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('종목 추가')).toBeInTheDocument();
    });
  });

  it('should call onAddItem when adding stock', async () => {
    render(<WatchlistGroupCard group={mockGroup} {...mockHandlers} />);

    // Open add dialog
    const addButton = screen.getAllByRole('button')[0];
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('종목 추가')).toBeInTheDocument();
    });

    // Fill form
    const symbolInput = screen.getByLabelText('종목코드');
    const nameInput = screen.getByLabelText('종목명');

    fireEvent.change(symbolInput, { target: { value: '000660' } });
    fireEvent.change(nameInput, { target: { value: 'SK하이닉스' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: '추가' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHandlers.onAddItem).toHaveBeenCalledWith(
        'group-1',
        '000660',
        'SK하이닉스'
      );
    });
  });
});
