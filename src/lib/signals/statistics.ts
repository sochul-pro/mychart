import type { Trade } from './types';

/**
 * 성과 지표 인터페이스
 */
export interface PerformanceMetrics {
  // 수익률 지표
  totalReturn: number;
  annualizedReturn: number;
  cagr: number; // 연평균 복합 성장률

  // 위험 지표
  volatility: number; // 변동성 (표준편차)
  downside: number; // 하방 변동성
  maxDrawdown: number;
  maxDrawdownDuration: number;

  // 위험 조정 수익률
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  omega: number; // 오메가 비율

  // 거래 통계
  winRate: number;
  profitFactor: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
  avgRR: number; // 평균 위험/보상 비율

  // 연속성
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  avgWinStreak: number;
  avgLossStreak: number;
}

/**
 * 샤프 비율 계산
 * @param returns 수익률 배열 (%)
 * @param riskFreeRate 무위험 수익률 (연율, 기본 3%)
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = 0.03
): number {
  if (returns.length < 2) return 0;

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  // 일일 수익률 기준으로 연환산
  const annualizedReturn = avgReturn * 252;
  const annualizedStd = stdDev * Math.sqrt(252);

  return (annualizedReturn - riskFreeRate * 100) / annualizedStd;
}

/**
 * 소르티노 비율 계산 (하방 위험만 고려)
 */
export function calculateSortinoRatio(
  returns: number[],
  riskFreeRate: number = 0.03,
  targetReturn: number = 0
): number {
  if (returns.length < 2) return 0;

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const negativeReturns = returns.filter((r) => r < targetReturn);

  if (negativeReturns.length === 0) return avgReturn > 0 ? Infinity : 0;

  const downsideDeviation = Math.sqrt(
    negativeReturns.reduce((sum, r) => sum + Math.pow(r - targetReturn, 2), 0) /
      negativeReturns.length
  );

  if (downsideDeviation === 0) return 0;

  const annualizedReturn = avgReturn * 252;
  const annualizedDownside = downsideDeviation * Math.sqrt(252);

  return (annualizedReturn - riskFreeRate * 100) / annualizedDownside;
}

/**
 * 칼마 비율 계산 (연환산 수익률 / 최대 낙폭)
 */
export function calculateCalmarRatio(
  annualizedReturn: number,
  maxDrawdown: number
): number {
  if (maxDrawdown === 0) return 0;
  return annualizedReturn / Math.abs(maxDrawdown);
}

/**
 * 오메가 비율 계산
 * @param returns 수익률 배열
 * @param threshold 기준 수익률 (기본 0)
 */
export function calculateOmegaRatio(
  returns: number[],
  threshold: number = 0
): number {
  const gains = returns.filter((r) => r > threshold).reduce((sum, r) => sum + (r - threshold), 0);
  const losses = returns
    .filter((r) => r <= threshold)
    .reduce((sum, r) => sum + Math.abs(r - threshold), 0);

  if (losses === 0) return gains > 0 ? Infinity : 1;
  return gains / losses;
}

/**
 * 변동성 (표준편차) 계산
 */
export function calculateVolatility(returns: number[]): number {
  if (returns.length < 2) return 0;

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1);

  return Math.sqrt(variance);
}

/**
 * 하방 변동성 계산
 */
export function calculateDownsideVolatility(
  returns: number[],
  targetReturn: number = 0
): number {
  const negativeReturns = returns.filter((r) => r < targetReturn);

  if (negativeReturns.length < 2) return 0;

  return Math.sqrt(
    negativeReturns.reduce((sum, r) => sum + Math.pow(r - targetReturn, 2), 0) /
      negativeReturns.length
  );
}

/**
 * 최대 낙폭 (MDD) 계산
 */
export function calculateMaxDrawdown(equityCurve: { time: number; value: number }[]): {
  maxDrawdown: number;
  maxDrawdownDuration: number;
  peakTime: number;
  troughTime: number;
  recoveryTime: number | null;
} {
  if (equityCurve.length === 0) {
    return {
      maxDrawdown: 0,
      maxDrawdownDuration: 0,
      peakTime: 0,
      troughTime: 0,
      recoveryTime: null,
    };
  }

  let peak = equityCurve[0].value;
  let peakTime = equityCurve[0].time;
  let maxDrawdown = 0;
  let maxDrawdownDuration = 0;
  let currentDrawdownStart = 0;
  let resultPeakTime = 0;
  let resultTroughTime = 0;
  let resultRecoveryTime: number | null = null;

  for (const point of equityCurve) {
    if (point.value > peak) {
      // 새로운 고점
      if (currentDrawdownStart > 0) {
        const duration = point.time - currentDrawdownStart;
        if (duration > maxDrawdownDuration) {
          maxDrawdownDuration = duration;
          resultRecoveryTime = point.time;
        }
      }
      peak = point.value;
      peakTime = point.time;
      currentDrawdownStart = 0;
    } else {
      // 낙폭 계산
      const drawdown = ((peak - point.value) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        resultPeakTime = peakTime;
        resultTroughTime = point.time;
      }
      if (currentDrawdownStart === 0) {
        currentDrawdownStart = peakTime;
      }
    }
  }

  return {
    maxDrawdown,
    maxDrawdownDuration: Math.ceil(maxDrawdownDuration / (24 * 60 * 60 * 1000)), // 일 단위
    peakTime: resultPeakTime,
    troughTime: resultTroughTime,
    recoveryTime: resultRecoveryTime,
  };
}

/**
 * 월별 수익률 계산
 */
export function calculateMonthlyReturns(
  trades: Trade[],
  initialCapital: number
): { month: string; return: number; pnl: number }[] {
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
      pnl,
      return: (pnl / initialCapital) * 100,
    }));
}

/**
 * 연간 수익률 계산
 */
export function calculateYearlyReturns(
  trades: Trade[],
  initialCapital: number
): { year: number; return: number; pnl: number }[] {
  const yearlyPnl = new Map<number, number>();

  for (const trade of trades) {
    if (!trade.exitTime || trade.pnl === undefined) continue;

    const date = new Date(trade.exitTime * 1000);
    const year = date.getFullYear();

    yearlyPnl.set(year, (yearlyPnl.get(year) || 0) + trade.pnl);
  }

  return Array.from(yearlyPnl.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, pnl]) => ({
      year,
      pnl,
      return: (pnl / initialCapital) * 100,
    }));
}

/**
 * 연속 승/패 통계 계산
 */
export function calculateStreakStats(trades: Trade[]): {
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  avgWinStreak: number;
  avgLossStreak: number;
} {
  let maxWins = 0;
  let maxLosses = 0;
  let currentWins = 0;
  let currentLosses = 0;

  const winStreaks: number[] = [];
  const lossStreaks: number[] = [];

  for (const trade of trades) {
    if ((trade.returnPct || 0) > 0) {
      if (currentLosses > 0) {
        lossStreaks.push(currentLosses);
        currentLosses = 0;
      }
      currentWins++;
      maxWins = Math.max(maxWins, currentWins);
    } else {
      if (currentWins > 0) {
        winStreaks.push(currentWins);
        currentWins = 0;
      }
      currentLosses++;
      maxLosses = Math.max(maxLosses, currentLosses);
    }
  }

  // 마지막 연속 기록
  if (currentWins > 0) winStreaks.push(currentWins);
  if (currentLosses > 0) lossStreaks.push(currentLosses);

  const avgWinStreak =
    winStreaks.length > 0
      ? winStreaks.reduce((a, b) => a + b, 0) / winStreaks.length
      : 0;
  const avgLossStreak =
    lossStreaks.length > 0
      ? lossStreaks.reduce((a, b) => a + b, 0) / lossStreaks.length
      : 0;

  return {
    maxConsecutiveWins: maxWins,
    maxConsecutiveLosses: maxLosses,
    avgWinStreak,
    avgLossStreak,
  };
}

/**
 * 위험/보상 비율 계산
 */
export function calculateRiskRewardRatio(trades: Trade[]): number {
  const winningTrades = trades.filter((t) => (t.returnPct || 0) > 0);
  const losingTrades = trades.filter((t) => (t.returnPct || 0) < 0);

  if (losingTrades.length === 0 || winningTrades.length === 0) return 0;

  const avgWin =
    winningTrades.reduce((sum, t) => sum + (t.returnPct || 0), 0) / winningTrades.length;
  const avgLoss = Math.abs(
    losingTrades.reduce((sum, t) => sum + (t.returnPct || 0), 0) / losingTrades.length
  );

  if (avgLoss === 0) return avgWin > 0 ? Infinity : 0;
  return avgWin / avgLoss;
}

/**
 * 기대값 (Expectancy) 계산
 * E = (Win% × Avg Win) + (Loss% × Avg Loss)
 */
export function calculateExpectancy(trades: Trade[]): number {
  if (trades.length === 0) return 0;

  const winningTrades = trades.filter((t) => (t.returnPct || 0) > 0);
  const losingTrades = trades.filter((t) => (t.returnPct || 0) <= 0);

  const winRate = winningTrades.length / trades.length;
  const lossRate = losingTrades.length / trades.length;

  const avgWin =
    winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + (t.returnPct || 0), 0) / winningTrades.length
      : 0;
  const avgLoss =
    losingTrades.length > 0
      ? losingTrades.reduce((sum, t) => sum + (t.returnPct || 0), 0) / losingTrades.length
      : 0;

  return winRate * avgWin + lossRate * avgLoss;
}

/**
 * 이익 팩터 계산 (총 이익 / 총 손실)
 */
export function calculateProfitFactor(trades: Trade[]): number {
  const totalWins = trades
    .filter((t) => (t.pnl || 0) > 0)
    .reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalLosses = Math.abs(
    trades.filter((t) => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0)
  );

  if (totalLosses === 0) return totalWins > 0 ? Infinity : 0;
  return totalWins / totalLosses;
}

/**
 * 평균 보유 기간 계산
 */
export function calculateAvgHoldingPeriod(trades: Trade[]): number {
  const completedTrades = trades.filter((t) => t.entryTime && t.exitTime);

  if (completedTrades.length === 0) return 0;

  const holdingDays = completedTrades.map((t) => {
    const entry = t.entryTime * 1000;
    const exit = (t.exitTime || 0) * 1000;
    return (exit - entry) / (1000 * 60 * 60 * 24);
  });

  return holdingDays.reduce((a, b) => a + b, 0) / holdingDays.length;
}

/**
 * 종합 성과 지표 계산
 */
export function calculatePerformanceMetrics(
  trades: Trade[],
  equityCurve: { time: number; value: number }[],
  initialCapital: number,
  totalDays: number
): PerformanceMetrics {
  const returns = trades.map((t) => t.returnPct || 0);
  const winningTrades = trades.filter((t) => (t.returnPct || 0) > 0);
  const losingTrades = trades.filter((t) => (t.returnPct || 0) <= 0);

  // 수익률 계산
  let equity = initialCapital;
  for (const trade of trades) {
    equity += trade.pnl || 0;
  }
  const totalReturn = ((equity - initialCapital) / initialCapital) * 100;

  // 연환산 수익률
  const years = totalDays / 365;
  const annualizedReturn =
    years > 0 ? (Math.pow(1 + totalReturn / 100, 1 / years) - 1) * 100 : totalReturn;

  // 낙폭 계산
  const { maxDrawdown, maxDrawdownDuration } = calculateMaxDrawdown(equityCurve);

  // 평균 승/패
  const avgWin =
    winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + (t.returnPct || 0), 0) / winningTrades.length
      : 0;
  const avgLoss =
    losingTrades.length > 0
      ? losingTrades.reduce((sum, t) => sum + (t.returnPct || 0), 0) / losingTrades.length
      : 0;

  // 연속 통계
  const streakStats = calculateStreakStats(trades);

  return {
    totalReturn,
    annualizedReturn,
    cagr: annualizedReturn,
    volatility: calculateVolatility(returns),
    downside: calculateDownsideVolatility(returns),
    maxDrawdown,
    maxDrawdownDuration,
    sharpeRatio: calculateSharpeRatio(returns),
    sortinoRatio: calculateSortinoRatio(returns),
    calmarRatio: calculateCalmarRatio(annualizedReturn, maxDrawdown),
    omega: calculateOmegaRatio(returns),
    winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
    profitFactor: calculateProfitFactor(trades),
    expectancy: calculateExpectancy(trades),
    avgWin,
    avgLoss,
    avgRR: calculateRiskRewardRatio(trades),
    ...streakStats,
  };
}
