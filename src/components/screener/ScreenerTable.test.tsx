import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScreenerTable } from './ScreenerTable';
import type { LeaderStock } from '@/types';

const mockResult: LeaderStock = {
  symbol: '005930',
  name: '삼성전자',
  market: 'KOSPI',
  changeRank: 5,
  turnoverRank: 10,
  amountRank: 3,
  foreignRank: 15,
  rankingCount: 4,
  price: 75000,
  changePercent: 2.74,
  volume: 10000000,
  amount: 750000000000,
  // 새 점수 계산: (50-5)*25 + (50-10)*25 + (50-3)*25 + (50-15)*25 = 1125+1000+1175+875 = 4175
  score: 4175,
  signals: [
    { type: 'multi_rank', message: '4개 순위 교집합', strength: 'strong' },
    { type: 'volume', message: '거래대금 상위', strength: 'medium' },
  ],
};

describe('ScreenerTable', () => {
  it('should render loading state', () => {
    render(<ScreenerTable results={[]} isLoading={true} />);
    // Check for loading skeleton
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render empty state when no results', () => {
    render(<ScreenerTable results={[]} isLoading={false} />);
    expect(screen.getByText('조건에 맞는 종목이 없습니다.')).toBeInTheDocument();
  });

  it('should render stock info', () => {
    render(<ScreenerTable results={[mockResult]} isLoading={false} />);

    expect(screen.getByText('삼성전자')).toBeInTheDocument();
    expect(screen.getByText(/005930/)).toBeInTheDocument();
    expect(screen.getByText(/KOSPI/)).toBeInTheDocument();
  });

  it('should render price info', () => {
    render(<ScreenerTable results={[mockResult]} isLoading={false} />);

    expect(screen.getByText('75,000')).toBeInTheDocument();
    expect(screen.getByText('+2.74%')).toBeInTheDocument();
  });

  it('should render score', () => {
    render(<ScreenerTable results={[mockResult]} isLoading={false} />);

    expect(screen.getByText('4,175')).toBeInTheDocument();
  });

  it('should render ranking count badge', () => {
    render(<ScreenerTable results={[mockResult]} isLoading={false} />);

    expect(screen.getByText('4개 순위')).toBeInTheDocument();
  });

  it('should render ranking badges', () => {
    render(<ScreenerTable results={[mockResult]} isLoading={false} />);

    // 순위 배지가 렌더링되는지 확인 (changeRank: 5)
    expect(screen.getByText('5')).toBeInTheDocument();
    // amountRank: 3
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should link to stock detail page', () => {
    render(<ScreenerTable results={[mockResult]} isLoading={false} />);

    const link = screen.getByRole('link', { name: /삼성전자/ });
    expect(link).toHaveAttribute('href', '/stocks/005930');
  });
});
