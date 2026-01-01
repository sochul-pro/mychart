import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CandleChart } from './CandleChart';
import type { OHLCV } from '@/types';

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
    timeScale: vi.fn(() => ({
      fitContent: mockFitContent,
    })),
    applyOptions: mockApplyOptions,
    remove: mockRemove,
  })),
  ColorType: { Solid: 'solid' },
  CrosshairMode: { Normal: 0 },
}));

describe('CandleChart', () => {
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

  it('should render chart container', () => {
    render(<CandleChart data={mockData} />);
    expect(screen.getByTestId('candle-chart')).toBeInTheDocument();
  });

  it('should render with custom height', () => {
    render(<CandleChart data={mockData} height={500} />);
    const container = screen.getByTestId('candle-chart');
    expect(container).toHaveStyle({ height: '500px' });
  });

  it('should render timeframe buttons when onTimeFrameChange is provided', () => {
    const mockOnChange = vi.fn();
    render(<CandleChart data={mockData} onTimeFrameChange={mockOnChange} />);

    expect(screen.getByText('일')).toBeInTheDocument();
    expect(screen.getByText('주')).toBeInTheDocument();
    expect(screen.getByText('월')).toBeInTheDocument();
  });

  it('should not render timeframe buttons when onTimeFrameChange is not provided', () => {
    render(<CandleChart data={mockData} />);

    expect(screen.queryByText('일')).not.toBeInTheDocument();
    expect(screen.queryByText('주')).not.toBeInTheDocument();
    expect(screen.queryByText('월')).not.toBeInTheDocument();
  });

  it('should call onTimeFrameChange when timeframe button is clicked', () => {
    const mockOnChange = vi.fn();
    render(<CandleChart data={mockData} onTimeFrameChange={mockOnChange} timeFrame="D" />);

    fireEvent.click(screen.getByText('주'));
    expect(mockOnChange).toHaveBeenCalledWith('W');

    fireEvent.click(screen.getByText('월'));
    expect(mockOnChange).toHaveBeenCalledWith('M');
  });

  it('should highlight active timeframe button', () => {
    const mockOnChange = vi.fn();
    render(<CandleChart data={mockData} onTimeFrameChange={mockOnChange} timeFrame="W" />);

    const weekButton = screen.getByText('주');
    const dayButton = screen.getByText('일');

    expect(weekButton).toHaveClass('bg-blue-600');
    expect(dayButton).not.toHaveClass('bg-blue-600');
  });

  it('should apply custom className', () => {
    render(<CandleChart data={mockData} className="custom-class" />);
    const container = screen.getByTestId('candle-chart').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('should cleanup chart on unmount', () => {
    const { unmount } = render(<CandleChart data={mockData} />);
    unmount();
    expect(mockRemove).toHaveBeenCalled();
  });

  it('should handle empty data', () => {
    render(<CandleChart data={[]} />);
    expect(screen.getByTestId('candle-chart')).toBeInTheDocument();
  });
});
