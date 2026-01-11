import type { OHLCV } from '@/types';
import type {
  TradingStrategy,
  Trade,
  BacktestConfig,
  BacktestResult,
  Signal,
} from './types';
import { generateSignals } from './engine';

/**
 * 백테스트 엔진
 * 주어진 전략과 설정으로 과거 데이터에 대한 시뮬레이션 수행
 */
export class BacktestEngine {
  private config: BacktestConfig;
  private strategy: TradingStrategy;

  constructor(config: BacktestConfig, strategy: TradingStrategy) {
    this.config = config;
    this.strategy = strategy;
  }

  /**
   * 백테스트 실행
   */
  run(data: OHLCV[]): BacktestResult {
    // 날짜 범위 필터링
    const filteredData = this.filterDataByDateRange(data);

    if (filteredData.length < 30) {
      throw new Error('백테스트에 필요한 데이터가 부족합니다. 최소 30개 이상의 데이터가 필요합니다.');
    }

    // 신호 생성
    const { signals } = generateSignals(this.strategy, filteredData);

    // 거래 시뮬레이션
    const trades = this.simulateTrades(filteredData, signals);

    // 통계 계산
    return this.calculateStatistics(trades, filteredData);
  }

  /**
   * 날짜 범위로 데이터 필터링
   */
  private filterDataByDateRange(data: OHLCV[]): OHLCV[] {
    const startTime = this.config.startDate.getTime();
    const endTime = this.config.endDate.getTime();

    return data.filter((d) => {
      const time = d.time * 1000; // Unix timestamp to milliseconds
      return time >= startTime && time <= endTime;
    });
  }

  /**
   * 거래 시뮬레이션
   */
  private simulateTrades(data: OHLCV[], signals: Signal[]): Trade[] {
    const trades: Trade[] = [];
    let currentTrade: Trade | null = null;
    const { commission, slippage, initialCapital, positionSizing, positionSize } = this.config;

    for (const signal of signals) {
      if (signal.type === 'buy' && !currentTrade) {
        // 매수 진입
        const entryPrice = signal.price * (1 + slippage / 100);
        const amount =
          positionSizing === 'fixed' ? positionSize : initialCapital * (positionSize / 100);
        const quantity = Math.floor(amount / entryPrice);

        if (quantity <= 0) continue;

        currentTrade = {
          id: `trade-${trades.length + 1}`,
          entryTime: signal.time,
          entryPrice,
          type: 'long',
          quantity,
          status: 'open',
          entryReason: signal.reason,
        };
      } else if (signal.type === 'sell' && currentTrade) {
        // 매도 청산
        const exitPrice = signal.price * (1 - slippage / 100);
        const grossReturn =
          ((exitPrice - currentTrade.entryPrice) / currentTrade.entryPrice) * 100;
        const netReturn = grossReturn - commission * 2; // 매수+매도 수수료

        currentTrade = {
          ...currentTrade,
          exitTime: signal.time,
          exitPrice,
          returnPct: netReturn,
          pnl:
            currentTrade.quantity *
            (exitPrice - currentTrade.entryPrice) *
            (1 - (commission / 100) * 2),
          status: 'closed',
          exitReason: signal.reason,
        };

        trades.push(currentTrade);
        currentTrade = null;
      }
    }

    // 마지막 열린 포지션 처리 (마지막 가격으로 청산)
    if (currentTrade && data.length > 0) {
      const lastData = data[data.length - 1];
      const exitPrice = lastData.close * (1 - slippage / 100);
      const grossReturn =
        ((exitPrice - currentTrade.entryPrice) / currentTrade.entryPrice) * 100;
      const netReturn = grossReturn - commission * 2;

      currentTrade = {
        ...currentTrade,
        exitTime: lastData.time,
        exitPrice,
        returnPct: netReturn,
        pnl:
          currentTrade.quantity *
          (exitPrice - currentTrade.entryPrice) *
          (1 - (commission / 100) * 2),
        status: 'closed',
        exitReason: '기간 종료',
      };

      trades.push(currentTrade);
    }

    return trades;
  }

  /**
   * 통계 계산
   */
  private calculateStatistics(trades: Trade[], data: OHLCV[]): BacktestResult {
    const closedTrades = trades.filter((t) => t.status === 'closed');
    const winningTrades = closedTrades.filter((t) => (t.returnPct || 0) > 0);
    const losingTrades = closedTrades.filter((t) => (t.returnPct || 0) <= 0);

    // 기본 통계
    const totalTrades = closedTrades.length;
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

    // 수익률 계산
    const totalReturn = this.calculateTotalReturn(closedTrades);
    const annualizedReturn = this.calculateAnnualizedReturn(totalReturn, data);

    // 자산 곡선 생성
    const equityCurve = this.buildEquityCurve(closedTrades, data);

    // 낙폭 계산
    const { maxDrawdown, maxDrawdownDuration, drawdownCurve } =
      this.calculateDrawdown(equityCurve);

    // 위험 조정 수익률
    const dailyReturns = this.calculateDailyReturns(closedTrades);
    const sharpeRatio = this.calculateSharpeRatio(dailyReturns);
    const sortinoRatio = this.calculateSortinoRatio(dailyReturns);
    const calmarRatio = maxDrawdown !== 0 ? annualizedReturn / Math.abs(maxDrawdown) : 0;

    // 상세 통계
    const avgWinPct =
      winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + (t.returnPct || 0), 0) / winningTrades.length
        : 0;
    const avgLossPct =
      losingTrades.length > 0
        ? losingTrades.reduce((sum, t) => sum + (t.returnPct || 0), 0) / losingTrades.length
        : 0;

    const totalWins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
    const profitFactor =
      totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

    const expectancy =
      totalTrades > 0
        ? (winRate / 100) * avgWinPct + (1 - winRate / 100) * avgLossPct
        : 0;

    const avgHoldingDays = this.calculateAvgHoldingDays(closedTrades);
    const { maxConsecutiveWins, maxConsecutiveLosses } =
      this.calculateConsecutive(closedTrades);

    // 월별 수익률
    const monthlyReturns = this.calculateMonthlyReturns(closedTrades);

    return {
      config: this.config,
      strategy: this.strategy,
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      totalReturn,
      annualizedReturn,
      maxDrawdown,
      maxDrawdownDuration,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      avgWinPct,
      avgLossPct,
      profitFactor: profitFactor === Infinity ? 999 : profitFactor,
      expectancy,
      avgHoldingDays,
      maxConsecutiveWins,
      maxConsecutiveLosses,
      trades: closedTrades,
      equityCurve,
      drawdownCurve,
      monthlyReturns,
    };
  }

  /**
   * 총 수익률 계산
   */
  private calculateTotalReturn(trades: Trade[]): number {
    if (trades.length === 0) return 0;

    let equity = this.config.initialCapital;
    for (const trade of trades) {
      const pnl = trade.pnl || 0;
      equity += pnl;
    }

    return ((equity - this.config.initialCapital) / this.config.initialCapital) * 100;
  }

  /**
   * 연환산 수익률 계산
   */
  private calculateAnnualizedReturn(totalReturn: number, data: OHLCV[]): number {
    if (data.length < 2) return 0;

    const startTime = data[0].time * 1000;
    const endTime = data[data.length - 1].time * 1000;
    const days = (endTime - startTime) / (1000 * 60 * 60 * 24);

    if (days < 1) return totalReturn;

    const years = days / 365;
    return (Math.pow(1 + totalReturn / 100, 1 / years) - 1) * 100;
  }

  /**
   * 자산 곡선 생성
   */
  private buildEquityCurve(
    trades: Trade[],
    data: OHLCV[]
  ): { time: number; value: number }[] {
    const curve: { time: number; value: number }[] = [];
    let equity = this.config.initialCapital;

    // 초기값
    if (data.length > 0) {
      curve.push({ time: data[0].time, value: equity });
    }

    // 각 거래 후 자산 업데이트
    for (const trade of trades) {
      if (trade.exitTime && trade.pnl !== undefined) {
        equity += trade.pnl;
        curve.push({ time: trade.exitTime, value: equity });
      }
    }

    return curve;
  }

  /**
   * 낙폭 계산
   */
  private calculateDrawdown(
    equityCurve: { time: number; value: number }[]
  ): {
    maxDrawdown: number;
    maxDrawdownDuration: number;
    drawdownCurve: { time: number; value: number }[];
  } {
    if (equityCurve.length === 0) {
      return { maxDrawdown: 0, maxDrawdownDuration: 0, drawdownCurve: [] };
    }

    let peak = equityCurve[0].value;
    let maxDrawdown = 0;
    let maxDrawdownDuration = 0;
    let currentDrawdownStart = 0;
    const drawdownCurve: { time: number; value: number }[] = [];

    for (const point of equityCurve) {
      if (point.value > peak) {
        // 새로운 고점
        if (currentDrawdownStart > 0) {
          const duration = point.time - currentDrawdownStart;
          if (duration > maxDrawdownDuration) {
            maxDrawdownDuration = duration;
          }
        }
        peak = point.value;
        currentDrawdownStart = 0;
        drawdownCurve.push({ time: point.time, value: 0 });
      } else {
        // 낙폭 계산
        const drawdown = ((peak - point.value) / peak) * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
        if (currentDrawdownStart === 0) {
          currentDrawdownStart = point.time;
        }
        drawdownCurve.push({ time: point.time, value: -drawdown });
      }
    }

    // 일 단위로 변환
    const durationDays = Math.ceil(maxDrawdownDuration / (24 * 60 * 60));

    return { maxDrawdown, maxDrawdownDuration: durationDays, drawdownCurve };
  }

  /**
   * 일별 수익률 계산
   */
  private calculateDailyReturns(trades: Trade[]): number[] {
    return trades.map((t) => t.returnPct || 0);
  }

  /**
   * 샤프 비율 계산
   */
  private calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.03): number {
    if (returns.length < 2) return 0;

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // 거래 기반 수익률을 연환산 (가정: 평균 20거래/년)
    const tradesPerYear = Math.min(returns.length, 20);
    const annualizedReturn = avgReturn * tradesPerYear;
    const annualizedStd = stdDev * Math.sqrt(tradesPerYear);

    return (annualizedReturn - riskFreeRate * 100) / annualizedStd;
  }

  /**
   * 소르티노 비율 계산
   */
  private calculateSortinoRatio(
    returns: number[],
    riskFreeRate: number = 0.03
  ): number {
    if (returns.length < 2) return 0;

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const negativeReturns = returns.filter((r) => r < 0);

    if (negativeReturns.length === 0) return avgReturn > 0 ? 999 : 0;

    const downsideVariance =
      negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length;
    const downsideDeviation = Math.sqrt(downsideVariance);

    if (downsideDeviation === 0) return 0;

    const tradesPerYear = Math.min(returns.length, 20);
    const annualizedReturn = avgReturn * tradesPerYear;
    const annualizedDownside = downsideDeviation * Math.sqrt(tradesPerYear);

    return (annualizedReturn - riskFreeRate * 100) / annualizedDownside;
  }

  /**
   * 평균 보유 기간 계산
   */
  private calculateAvgHoldingDays(trades: Trade[]): number {
    if (trades.length === 0) return 0;

    const holdingDays = trades
      .filter((t) => t.entryTime && t.exitTime)
      .map((t) => {
        const entry = t.entryTime * 1000;
        const exit = (t.exitTime || 0) * 1000;
        return (exit - entry) / (1000 * 60 * 60 * 24);
      });

    if (holdingDays.length === 0) return 0;

    return holdingDays.reduce((a, b) => a + b, 0) / holdingDays.length;
  }

  /**
   * 연속 승/패 계산
   */
  private calculateConsecutive(trades: Trade[]): {
    maxConsecutiveWins: number;
    maxConsecutiveLosses: number;
  } {
    let maxWins = 0;
    let maxLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;

    for (const trade of trades) {
      if ((trade.returnPct || 0) > 0) {
        currentWins++;
        currentLosses = 0;
        maxWins = Math.max(maxWins, currentWins);
      } else {
        currentLosses++;
        currentWins = 0;
        maxLosses = Math.max(maxLosses, currentLosses);
      }
    }

    return { maxConsecutiveWins: maxWins, maxConsecutiveLosses: maxLosses };
  }

  /**
   * 월별 수익률 계산
   */
  private calculateMonthlyReturns(trades: Trade[]): { month: string; return: number }[] {
    const monthlyPnl = new Map<string, number>();

    for (const trade of trades) {
      if (!trade.exitTime || trade.pnl === undefined) continue;

      const date = new Date(trade.exitTime * 1000);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      monthlyPnl.set(month, (monthlyPnl.get(month) || 0) + trade.pnl);
    }

    return Array.from(monthlyPnl.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, pnl]) => ({
        month,
        return: (pnl / this.config.initialCapital) * 100,
      }));
  }
}

/**
 * 간단한 백테스트 실행 함수
 */
export function runBacktest(
  strategy: TradingStrategy,
  data: OHLCV[],
  config?: Partial<BacktestConfig>
): BacktestResult {
  const defaultConfig: BacktestConfig = {
    symbol: '',
    startDate: new Date(data[0]?.time * 1000 || Date.now()),
    endDate: new Date(data[data.length - 1]?.time * 1000 || Date.now()),
    initialCapital: 10000000,
    commission: 0.015,
    slippage: 0.1,
    positionSizing: 'percent',
    positionSize: 100,
    ...config,
  };

  const engine = new BacktestEngine(defaultConfig, strategy);
  return engine.run(data);
}
