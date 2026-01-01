import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BacktestResult } from './BacktestResult';
import type { SignalResult, Signal } from '@/lib/signals/types';

describe('BacktestResult', () => {
  it('should show placeholder when no result', () => {
    render(<BacktestResult result={null} />);

    expect(screen.getByText(/전략을 선택하면/)).toBeInTheDocument();
  });

  it('should show summary statistics', () => {
    const result: SignalResult = {
      signals: [
        { type: 'buy', time: Date.now(), price: 10000, reason: 'test' },
        { type: 'sell', time: Date.now(), price: 11000, reason: 'test' },
        { type: 'buy', time: Date.now(), price: 10500, reason: 'test' },
      ],
      buyCount: 2,
      sellCount: 1,
    };

    render(<BacktestResult result={result} />);

    expect(screen.getByText('3')).toBeInTheDocument(); // 총 신호
    expect(screen.getByText('2')).toBeInTheDocument(); // 매수
    expect(screen.getByText('1')).toBeInTheDocument(); // 매도
  });

  it('should show recent signals', () => {
    const signals: Signal[] = [
      { type: 'buy', time: Date.now() - 86400000, price: 10000, reason: 'RSI < 30' },
      { type: 'sell', time: Date.now(), price: 11000, reason: 'RSI > 70' },
    ];

    const result: SignalResult = {
      signals,
      buyCount: 1,
      sellCount: 1,
    };

    render(<BacktestResult result={result} />);

    expect(screen.getByTestId('signal-item-buy')).toBeInTheDocument();
    expect(screen.getByTestId('signal-item-sell')).toBeInTheDocument();
  });

  it('should show message when no signals', () => {
    const result: SignalResult = {
      signals: [],
      buyCount: 0,
      sellCount: 0,
    };

    render(<BacktestResult result={result} />);

    expect(screen.getByText(/해당 기간에 발생한 신호가 없습니다/)).toBeInTheDocument();
  });

  it('should only show last 10 signals', () => {
    const signals: Signal[] = Array.from({ length: 15 }, (_, i) => ({
      type: i % 2 === 0 ? 'buy' : 'sell',
      time: Date.now() - i * 86400000,
      price: 10000 + i * 100,
      reason: 'test',
    })) as Signal[];

    const result: SignalResult = {
      signals,
      buyCount: 8,
      sellCount: 7,
    };

    render(<BacktestResult result={result} />);

    const buyItems = screen.getAllByTestId('signal-item-buy');
    const sellItems = screen.getAllByTestId('signal-item-sell');

    expect(buyItems.length + sellItems.length).toBeLessThanOrEqual(10);
  });

  it('should apply custom className', () => {
    const result: SignalResult = {
      signals: [],
      buyCount: 0,
      sellCount: 0,
    };

    render(<BacktestResult result={result} className="custom-class" />);

    expect(screen.getByTestId('backtest-result')).toHaveClass('custom-class');
  });
});
