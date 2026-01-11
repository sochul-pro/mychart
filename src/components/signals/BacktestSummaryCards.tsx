'use client';

import { TrendingUp, TrendingDown, Activity, BarChart3, Repeat } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { BacktestResult } from '@/lib/signals/types';

interface BacktestSummaryCardsProps {
  result: BacktestResult;
}

export function BacktestSummaryCards({ result }: BacktestSummaryCardsProps) {
  const metrics = [
    {
      label: '총 수익률',
      value: `${result.totalReturn >= 0 ? '+' : ''}${result.totalReturn.toFixed(2)}%`,
      icon: result.totalReturn >= 0 ? TrendingUp : TrendingDown,
      color: result.totalReturn >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: result.totalReturn >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
    },
    {
      label: '승률',
      value: `${result.winRate.toFixed(1)}%`,
      icon: Activity,
      color: result.winRate >= 50 ? 'text-green-500' : 'text-orange-500',
      bgColor: result.winRate >= 50 ? 'bg-green-500/10' : 'bg-orange-500/10',
    },
    {
      label: 'MDD',
      value: `-${result.maxDrawdown.toFixed(2)}%`,
      icon: TrendingDown,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: '샤프 비율',
      value: result.sharpeRatio.toFixed(2),
      icon: BarChart3,
      color: result.sharpeRatio >= 1 ? 'text-green-500' : 'text-yellow-500',
      bgColor: result.sharpeRatio >= 1 ? 'bg-green-500/10' : 'bg-yellow-500/10',
    },
    {
      label: '거래 수',
      value: `${result.totalTrades}회`,
      icon: Repeat,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {metrics.map((metric) => (
        <Card key={metric.label} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className={`text-lg font-bold ${metric.color}`}>{metric.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface BacktestDetailStatsProps {
  result: BacktestResult;
}

export function BacktestDetailStats({ result }: BacktestDetailStatsProps) {
  const stats = [
    { label: '연환산 수익률', value: `${result.annualizedReturn.toFixed(2)}%` },
    { label: '평균 수익 거래', value: `+${result.avgWinPct.toFixed(2)}%` },
    { label: '평균 손실 거래', value: `${result.avgLossPct.toFixed(2)}%` },
    { label: '이익 팩터', value: result.profitFactor.toFixed(2) },
    { label: '소르티노 비율', value: result.sortinoRatio.toFixed(2) },
    { label: '칼마 비율', value: result.calmarRatio.toFixed(2) },
    { label: '평균 보유 기간', value: `${result.avgHoldingDays.toFixed(1)}일` },
    { label: '최대 연속 승', value: `${result.maxConsecutiveWins}회` },
    { label: '최대 연속 패', value: `${result.maxConsecutiveLosses}회` },
    { label: '기대값', value: `${result.expectancy.toFixed(2)}%` },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
          <p className="font-semibold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
