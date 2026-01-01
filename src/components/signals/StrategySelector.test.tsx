import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StrategySelector } from './StrategySelector';
import { getPresetStrategies } from '@/lib/signals/presets';
import type { TradingStrategy } from '@/lib/signals/types';

describe('StrategySelector', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all preset strategies', () => {
    render(<StrategySelector selectedStrategy={null} onStrategySelect={mockOnSelect} />);

    const presets = getPresetStrategies();
    presets.forEach((strategy) => {
      expect(screen.getByText(strategy.name)).toBeInTheDocument();
    });
  });

  it('should call onStrategySelect when strategy is clicked', () => {
    render(<StrategySelector selectedStrategy={null} onStrategySelect={mockOnSelect} />);

    fireEvent.click(screen.getByTestId('strategy-golden_cross'));
    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'golden_cross', name: '골든크로스' })
    );
  });

  it('should highlight selected strategy', () => {
    const selectedStrategy: TradingStrategy = {
      id: 'rsi_oversold',
      name: 'RSI 과매도',
      buyCondition: { type: 'single', indicator: 'rsi', operator: 'lte', value: 30 },
      sellCondition: { type: 'single', indicator: 'rsi', operator: 'gte', value: 70 },
    };

    render(
      <StrategySelector selectedStrategy={selectedStrategy} onStrategySelect={mockOnSelect} />
    );

    const button = screen.getByTestId('strategy-rsi_oversold');
    expect(button).toHaveClass('border-blue-500');
    expect(screen.getByText('적용됨')).toBeInTheDocument();
  });

  it('should deselect strategy when clicked again', () => {
    const selectedStrategy: TradingStrategy = {
      id: 'golden_cross',
      name: '골든크로스',
      buyCondition: { type: 'crossover', indicator1: 'sma', indicator2: 'sma', direction: 'up' },
      sellCondition: { type: 'crossover', indicator1: 'sma', indicator2: 'sma', direction: 'down' },
    };

    render(
      <StrategySelector selectedStrategy={selectedStrategy} onStrategySelect={mockOnSelect} />
    );

    fireEvent.click(screen.getByTestId('strategy-golden_cross'));
    expect(mockOnSelect).toHaveBeenCalledWith(null);
  });

  it('should toggle preset list visibility', () => {
    render(<StrategySelector selectedStrategy={null} onStrategySelect={mockOnSelect} />);

    expect(screen.getByTestId('preset-list')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('toggle-presets'));
    expect(screen.queryByTestId('preset-list')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('toggle-presets'));
    expect(screen.getByTestId('preset-list')).toBeInTheDocument();
  });

  it('should show clear button when strategy is selected', () => {
    const selectedStrategy: TradingStrategy = {
      id: 'golden_cross',
      name: '골든크로스',
      buyCondition: { type: 'crossover', indicator1: 'sma', indicator2: 'sma', direction: 'up' },
      sellCondition: { type: 'crossover', indicator1: 'sma', indicator2: 'sma', direction: 'down' },
    };

    render(
      <StrategySelector selectedStrategy={selectedStrategy} onStrategySelect={mockOnSelect} />
    );

    fireEvent.click(screen.getByTestId('clear-strategy'));
    expect(mockOnSelect).toHaveBeenCalledWith(null);
  });

  it('should not show clear button when no strategy is selected', () => {
    render(<StrategySelector selectedStrategy={null} onStrategySelect={mockOnSelect} />);

    expect(screen.queryByTestId('clear-strategy')).not.toBeInTheDocument();
  });
});
