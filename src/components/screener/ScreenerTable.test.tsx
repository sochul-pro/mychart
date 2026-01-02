import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScreenerTable } from './ScreenerTable';
import type { ScreenerResult } from '@/types';

const mockResult: ScreenerResult = {
  stock: {
    symbol: '005930',
    name: '삼성전자',
    market: 'KOSPI',
    sector: '반도체',
  },
  quote: {
    symbol: '005930',
    price: 75000,
    change: 2000,
    changePercent: 2.74,
    volume: 10000000,
    high: 76000,
    low: 73000,
    open: 73500,
    prevClose: 73000,
    timestamp: Date.now(),
  },
  score: 75,
  volumeRatio: 2.5,
  isNewHigh: true,
  priceChange52w: 25.5,
  signals: [
    { type: 'volume', message: '거래량 2.5배 증가', strength: 'medium' },
    { type: 'high', message: '52주 신고가', strength: 'strong' },
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

    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('should render new high badge', () => {
    render(<ScreenerTable results={[mockResult]} isLoading={false} />);

    expect(screen.getByText('신고가')).toBeInTheDocument();
  });

  it('should render volume ratio', () => {
    render(<ScreenerTable results={[mockResult]} isLoading={false} />);

    expect(screen.getByText('x2.5')).toBeInTheDocument();
  });

  it('should link to stock detail page', () => {
    render(<ScreenerTable results={[mockResult]} isLoading={false} />);

    const link = screen.getByRole('link', { name: /삼성전자/ });
    expect(link).toHaveAttribute('href', '/stocks/005930');
  });
});
