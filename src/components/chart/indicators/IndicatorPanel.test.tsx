import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IndicatorPanel } from './IndicatorPanel';
import type { IndicatorConfig } from './types';

describe('IndicatorPanel', () => {
  const mockOnChange = vi.fn();

  const defaultProps = {
    indicators: [] as IndicatorConfig[],
    onIndicatorsChange: mockOnChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all indicator toggles', () => {
    render(<IndicatorPanel {...defaultProps} />);

    // 이동평균선 섹션
    expect(screen.getByText('이동평균선')).toBeInTheDocument();
    // 기타 지표들
    expect(screen.getByText('볼린저밴드')).toBeInTheDocument();
    expect(screen.getByText('RSI')).toBeInTheDocument();
    expect(screen.getByText('MACD')).toBeInTheDocument();
    expect(screen.getByText('스토캐스틱')).toBeInTheDocument();
    expect(screen.getByText('OBV')).toBeInTheDocument();
    expect(screen.getByText('ATR')).toBeInTheDocument();
  });

  it('should toggle non-MA indicator when clicked', () => {
    render(<IndicatorPanel {...defaultProps} />);

    fireEvent.click(screen.getByTestId('toggle-rsi'));

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ type: 'rsi', enabled: true }),
      ])
    );
  });

  it('should show indicator as enabled when in list', () => {
    const indicators: IndicatorConfig[] = [
      { type: 'rsi', enabled: true, period: 14, overbought: 70, oversold: 30, color: '#E91E63' },
    ];

    render(<IndicatorPanel {...defaultProps} indicators={indicators} />);

    // 토글이 체크된 상태여야 함 (bg-blue-600 클래스가 있는 div)
    const toggle = screen.getByTestId('toggle-rsi');
    const checkbox = toggle.querySelector('.bg-blue-600');
    expect(checkbox).toBeInTheDocument();
  });

  it('should expand settings when arrow clicked', () => {
    render(<IndicatorPanel {...defaultProps} />);

    fireEvent.click(screen.getByTestId('expand-bollinger'));

    expect(screen.getByText('볼린저밴드 (상단/중간/하단)')).toBeInTheDocument();
    expect(screen.getByText('기간:')).toBeInTheDocument();
  });

  it('should update indicator settings', () => {
    const indicators: IndicatorConfig[] = [
      { type: 'rsi', enabled: true, period: 14, overbought: 70, oversold: 30, color: '#E91E63' },
    ];

    render(<IndicatorPanel {...defaultProps} indicators={indicators} />);

    // 설정 확장
    fireEvent.click(screen.getByTestId('expand-rsi'));

    // 기간 변경
    const periodInput = screen.getByDisplayValue('14');
    fireEvent.change(periodInput, { target: { value: '20' } });

    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({ type: 'rsi', period: 20 }),
    ]);
  });

  it('should toggle off enabled indicator', () => {
    const indicators: IndicatorConfig[] = [
      { type: 'rsi', enabled: true, period: 14, overbought: 70, oversold: 30, color: '#E91E63' },
    ];

    render(<IndicatorPanel {...defaultProps} indicators={indicators} />);

    fireEvent.click(screen.getByTestId('toggle-rsi'));

    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({ type: 'rsi', enabled: false }),
    ]);
  });

  it('should show MACD settings with three period inputs', () => {
    render(<IndicatorPanel {...defaultProps} />);

    fireEvent.click(screen.getByTestId('expand-macd'));

    expect(screen.getByText('Fast:')).toBeInTheDocument();
    expect(screen.getByText('Slow:')).toBeInTheDocument();
    expect(screen.getByText('Signal:')).toBeInTheDocument();
  });

  it('should show Bollinger settings with period and stdDev', () => {
    render(<IndicatorPanel {...defaultProps} />);

    fireEvent.click(screen.getByTestId('expand-bollinger'));

    expect(screen.getByText('기간:')).toBeInTheDocument();
    expect(screen.getByText('표준편차:')).toBeInTheDocument();
  });
});
