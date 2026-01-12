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
    const startTime = this.config.startDate.getTime();
    const endTime = this.config.endDate.getTime();

    // endDate까지의 데이터만 사용 (지표 계산을 위해 startDate 이전 데이터는 유지)
    const dataUntilEnd = data.filter((d) => d.time <= endTime);

    if (dataUntilEnd.length < 30) {
      throw new Error('백테스트에 필요한 데이터가 부족합니다. 최소 30개 이상의 데이터가 필요합니다.');
    }

    // 신호 생성 (전체 데이터로 지표 계산)
    const { signals: allSignals } = generateSignals(this.strategy, dataUntilEnd);

    // 신호를 날짜 범위 내로 필터링
    const signals = allSignals.filter((s) => s.time >= startTime && s.time <= endTime);

    // 거래 범위 내 데이터만 추출 (통계 계산용)
    const tradingData = dataUntilEnd.filter((d) => d.time >= startTime);

    // 거래 시뮬레이션
    const trades = this.simulateTrades(tradingData, signals);

    // 통계 계산
    return this.calculateStatistics(trades, tradingData);
  }

  /**
   * 거래 시뮬레이션
   * Note: 신호 생성(generateSignals)에서 이미 포지션 상태와 같은 날 충돌을 처리함
   */
  private simulateTrades(data: OHLCV[], signals: Signal[]): Trade[] {
    const trades: Trade[] = [];
    let currentTrade: Trade | null = null;
    const { commission, slippage, initialCapital, positionSizing, positionSize } = this.config;

    // 마지막 거래일 (이 날에는 새 포지션을 열지 않음 - 바로 강제 청산되므로)
    const lastTradingDay = data.length > 0 ? data[data.length - 1].time : 0;

    for (const signal of signals) {
      if (signal.type === 'buy' && !currentTrade) {
        // 마지막 거래일에는 새 포지션을 열지 않음
        if (signal.time >= lastTradingDay) continue;

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

    // 위험 조정 수익률 (일별 수익률 기반)
    const dailyReturns = this.calculateDailyReturnsFromEquity(equityCurve);
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

    // 시간은 이미 밀리초 단위
    const startTime = data[0].time;
    const endTime = data[data.length - 1].time;
    const days = (endTime - startTime) / (1000 * 60 * 60 * 24);

    if (days < 1) return totalReturn;

    const years = days / 365;
    return (Math.pow(1 + totalReturn / 100, 1 / years) - 1) * 100;
  }

  /**
   * 자산 곡선 생성 (일별 데이터)
   */
  private buildEquityCurve(
    trades: Trade[],
    data: OHLCV[]
  ): { time: number; value: number }[] {
    const curve: { time: number; value: number }[] = [];

    // 거래를 시간순으로 정렬하고 진입/청산 이벤트 생성
    const events: { time: number; type: 'entry' | 'exit'; trade: Trade }[] = [];
    for (const trade of trades) {
      events.push({ time: trade.entryTime, type: 'entry', trade });
      if (trade.exitTime) {
        events.push({ time: trade.exitTime, type: 'exit', trade });
      }
    }
    events.sort((a, b) => a.time - b.time);

    // 이벤트를 시간별로 그룹화
    const eventsByTime = new Map<number, { entries: Trade[]; exits: Trade[] }>();
    for (const event of events) {
      const existing = eventsByTime.get(event.time) || { entries: [], exits: [] };
      if (event.type === 'entry') {
        existing.entries.push(event.trade);
      } else {
        existing.exits.push(event.trade);
      }
      eventsByTime.set(event.time, existing);
    }

    // 일별 자산 추적
    let realizedPnl = 0;
    let openTrade: { quantity: number; entryPrice: number } | null = null;

    for (const d of data) {
      const dayEvents = eventsByTime.get(d.time);

      if (dayEvents) {
        // 청산 먼저 처리 (같은 날 청산 후 진입 가능)
        for (const trade of dayEvents.exits) {
          if (trade.pnl !== undefined) {
            realizedPnl += trade.pnl;
          }
          openTrade = null;
        }

        // 진입 처리
        for (const trade of dayEvents.entries) {
          openTrade = { quantity: trade.quantity, entryPrice: trade.entryPrice };
        }
      }

      // 현재 자산 계산 (실현 + 미실현)
      let currentEquity = this.config.initialCapital + realizedPnl;
      if (openTrade) {
        // 미실현 손익 계산
        const unrealizedPnl = openTrade.quantity * (d.close - openTrade.entryPrice);
        currentEquity += unrealizedPnl;
      }

      curve.push({ time: d.time, value: currentEquity });
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

    // 일 단위로 변환 (밀리초 → 일)
    const durationDays = Math.ceil(maxDrawdownDuration / (24 * 60 * 60 * 1000));

    return { maxDrawdown, maxDrawdownDuration: durationDays, drawdownCurve };
  }

  /**
   * 자산곡선에서 일별 수익률 계산
   */
  private calculateDailyReturnsFromEquity(
    equityCurve: { time: number; value: number }[]
  ): number[] {
    if (equityCurve.length < 2) return [];

    const returns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const prevValue = equityCurve[i - 1].value;
      const currValue = equityCurve[i].value;
      if (prevValue > 0) {
        returns.push(((currValue - prevValue) / prevValue) * 100);
      }
    }
    return returns;
  }

  /**
   * 샤프 비율 계산 (일별 수익률 기반)
   * @param returns 일별 수익률 배열 (%)
   * @param riskFreeRate 연간 무위험 수익률 (기본 3%)
   */
  private calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.03): number {
    if (returns.length < 2) return 0;

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // 일별 수익률을 연환산 (한국 주식시장 연간 거래일 기준)
    const tradingDaysPerYear = 248;
    const annualizedReturn = avgReturn * tradingDaysPerYear;
    const annualizedStd = stdDev * Math.sqrt(tradingDaysPerYear);

    return (annualizedReturn - riskFreeRate * 100) / annualizedStd;
  }

  /**
   * 소르티노 비율 계산 (일별 수익률 기반)
   * @param returns 일별 수익률 배열 (%)
   * @param riskFreeRate 연간 무위험 수익률 (기본 3%)
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

    // 일별 수익률을 연환산 (한국 주식시장 연간 거래일 기준)
    const tradingDaysPerYear = 248;
    const annualizedReturn = avgReturn * tradingDaysPerYear;
    const annualizedDownside = downsideDeviation * Math.sqrt(tradingDaysPerYear);

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
        // 시간은 이미 밀리초 단위
        const entry = t.entryTime;
        const exit = t.exitTime || 0;
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

      // exitTime은 이미 밀리초 단위
      const date = new Date(trade.exitTime);
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
    // OHLCV time은 이미 밀리초 단위
    startDate: new Date(data[0]?.time || Date.now()),
    endDate: new Date(data[data.length - 1]?.time || Date.now()),
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
