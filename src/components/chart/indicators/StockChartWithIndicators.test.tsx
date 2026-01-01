import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { StockChartWithIndicators } from './StockChartWithIndicators';
import type { OHLCV } from '@/types';
import type { IndicatorConfig } from './types';

// Mock lightweight-charts
const mockSetData = vi.fn();
const mockFitContent = vi.fn();
const mockApplyOptions = vi.fn();
const mockRemove = vi.fn();
const mockPriceScale = vi.fn(() => ({
  applyOptions: vi.fn(),
}));

vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => ({
    addCandlestickSeries: vi.fn(() => ({
      setData: mockSetData,
    })),
    addHistogramSeries: vi.fn(() => ({
      setData: mockSetData,
      priceScale: mockPriceScale,
    })),
    addLineSeries: vi.fn(() => ({
      setData: mockSetData,
    })),
    timeScale: vi.fn(() => ({
      fitContent: mockFitContent,
    })),
    applyOptions: mockApplyOptions,
    remove: mockRemove,
  })),
  ColorType: { Solid: 'solid' },
  CrosshairMode: { Normal: 0 },
}));

describe('StockChartWithIndicators', () => {
  const mockData: OHLCV[] = [
    { time: 1704067200000, open: 70000, high: 72000, low: 69000, close: 71500, volume: 1000000 },
    { time: 1704153600000, open: 71500, high: 73000, low: 71000, close: 72500, volume: 1200000 },
    { time: 1704240000000, open: 72500, high: 74000, low: 72000, close: 73000, volume: 900000 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render main chart', () => {
    render(<StockChartWithIndicators data={mockData} indicators={[]} />);
    expect(screen.getByTestId('main-chart')).toBeInTheDocument();
  });

  it('should render chart container', () => {
    render(<StockChartWithIndicators data={mockData} indicators={[]} />);
    expect(screen.getByTestId('stock-chart-with-indicators')).toBeInTheDocument();
  });

  it('should not render RSI chart when not enabled', () => {
    render(<StockChartWithIndicators data={mockData} indicators={[]} />);
    expect(screen.queryByTestId('rsi-chart')).not.toBeInTheDocument();
  });

  it('should render RSI chart when enabled', () => {
    const indicators: IndicatorConfig[] = [
      { type: 'rsi', enabled: true, period: 14, overbought: 70, oversold: 30, color: '#E91E63' },
    ];

    render(<StockChartWithIndicators data={mockData} indicators={indicators} />);
    expect(screen.getByTestId('rsi-chart')).toBeInTheDocument();
  });

  it('should not render MACD chart when not enabled', () => {
    render(<StockChartWithIndicators data={mockData} indicators={[]} />);
    expect(screen.queryByTestId('macd-chart')).not.toBeInTheDocument();
  });

  it('should render MACD chart when enabled', () => {
    const indicators: IndicatorConfig[] = [
      {
        type: 'macd',
        enabled: true,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        color: '#00BCD4',
      },
    ];

    render(<StockChartWithIndicators data={mockData} indicators={indicators} />);
    expect(screen.getByTestId('macd-chart')).toBeInTheDocument();
  });

  it('should render timeframe buttons when callback provided', () => {
    const mockOnChange = vi.fn();
    render(
      <StockChartWithIndicators
        data={mockData}
        indicators={[]}
        onTimeFrameChange={mockOnChange}
      />
    );

    expect(screen.getByText('일')).toBeInTheDocument();
    expect(screen.getByText('주')).toBeInTheDocument();
    expect(screen.getByText('월')).toBeInTheDocument();
  });

  it('should call onTimeFrameChange when timeframe button clicked', () => {
    const mockOnChange = vi.fn();
    render(
      <StockChartWithIndicators
        data={mockData}
        indicators={[]}
        onTimeFrameChange={mockOnChange}
        timeFrame="D"
      />
    );

    fireEvent.click(screen.getByText('주'));
    expect(mockOnChange).toHaveBeenCalledWith('W');
  });

  it('should handle empty data', () => {
    render(<StockChartWithIndicators data={[]} indicators={[]} />);
    expect(screen.getByTestId('main-chart')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <StockChartWithIndicators data={mockData} indicators={[]} className="custom-class" />
    );
    expect(screen.getByTestId('stock-chart-with-indicators')).toHaveClass('custom-class');
  });

  it('should render both RSI and MACD when both enabled', () => {
    const indicators: IndicatorConfig[] = [
      { type: 'rsi', enabled: true, period: 14, overbought: 70, oversold: 30, color: '#E91E63' },
      {
        type: 'macd',
        enabled: true,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        color: '#00BCD4',
      },
    ];

    render(<StockChartWithIndicators data={mockData} indicators={indicators} />);
    expect(screen.getByTestId('rsi-chart')).toBeInTheDocument();
    expect(screen.getByTestId('macd-chart')).toBeInTheDocument();
  });
});
