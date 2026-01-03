'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, TrendingUp, Users, Banknote, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LeaderStock } from '@/types';

interface ScreenerTableProps {
  results: LeaderStock[];
  isLoading?: boolean;
}

export const ScreenerTable = memo(function ScreenerTable({
  results,
  isLoading,
}: ScreenerTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        조건에 맞는 종목이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-sm text-muted-foreground">
            <th className="text-left py-3 px-2">순위</th>
            <th className="text-left py-3 px-2">종목</th>
            <th className="text-right py-3 px-2">현재가</th>
            <th className="text-right py-3 px-2">등락률</th>
            <th className="text-center py-3 px-2">순위 정보</th>
            <th className="text-right py-3 px-2">점수</th>
            <th className="text-left py-3 px-2">신호</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr
              key={result.symbol}
              className="border-b hover:bg-muted/50 transition-colors"
            >
              <td className="py-3 px-2">
                <span className="text-muted-foreground font-medium">
                  {index + 1}
                </span>
              </td>
              <td className="py-3 px-2">
                <Link
                  href={`/stocks/${result.symbol}`}
                  className="block hover:underline"
                >
                  <div className="font-medium">{result.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {result.symbol} · {result.market}
                  </div>
                </Link>
              </td>
              <td className="py-3 px-2 text-right font-mono">
                {result.price.toLocaleString()}
              </td>
              <td
                className={cn(
                  'py-3 px-2 text-right font-mono',
                  result.changePercent > 0
                    ? 'text-red-500'
                    : result.changePercent < 0
                    ? 'text-blue-500'
                    : ''
                )}
              >
                <span className="flex items-center justify-end gap-1">
                  {result.changePercent > 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : result.changePercent < 0 ? (
                    <ArrowDown className="h-3 w-3" />
                  ) : null}
                  {result.changePercent > 0 ? '+' : ''}
                  {result.changePercent.toFixed(2)}%
                </span>
              </td>
              <td className="py-3 px-2">
                <RankingBadges result={result} />
              </td>
              <td className="py-3 px-2 text-right">
                <ScoreBar score={result.score} />
              </td>
              <td className="py-3 px-2">
                <SignalBadges signals={result.signals} rankingCount={result.rankingCount} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

/**
 * 순위 배지 컴포넌트
 */
const RankingBadges = memo(function RankingBadges({
  result,
}: {
  result: LeaderStock;
}) {
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {result.changeRank && (
        <Badge variant="outline" className="text-xs" title="등락률 순위">
          <TrendingUp className="h-3 w-3 mr-1" />
          {result.changeRank}
        </Badge>
      )}
      {result.turnoverRank && (
        <Badge variant="outline" className="text-xs" title="회전율 순위">
          <RefreshCw className="h-3 w-3 mr-1" />
          {result.turnoverRank}
        </Badge>
      )}
      {result.amountRank && (
        <Badge variant="outline" className="text-xs" title="거래대금 순위">
          <Banknote className="h-3 w-3 mr-1" />
          {result.amountRank}
        </Badge>
      )}
      {result.foreignRank && (
        <Badge variant="outline" className="text-xs" title="외인/기관 순위">
          <Users className="h-3 w-3 mr-1" />
          {result.foreignRank}
        </Badge>
      )}
    </div>
  );
});

/**
 * 신호 배지 컴포넌트
 */
const SignalBadges = memo(function SignalBadges({
  signals,
  rankingCount,
}: {
  signals: LeaderStock['signals'];
  rankingCount: number;
}) {
  // 순위 개수 배지
  const rankBadge = useMemo(() => {
    if (rankingCount >= 4) {
      return (
        <Badge className="text-xs bg-green-500">
          4개 순위
        </Badge>
      );
    }
    if (rankingCount >= 3) {
      return (
        <Badge className="text-xs bg-yellow-500">
          3개 순위
        </Badge>
      );
    }
    if (rankingCount >= 2) {
      return (
        <Badge variant="secondary" className="text-xs">
          2개 순위
        </Badge>
      );
    }
    return null;
  }, [rankingCount]);

  return (
    <div className="flex flex-wrap gap-1">
      {rankBadge}
      {signals
        .filter((s) => s.strength === 'strong' && s.type !== 'multi_rank')
        .slice(0, 1)
        .map((signal, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {signal.message}
          </Badge>
        ))}
    </div>
  );
});

/**
 * 점수 바 컴포넌트
 * 점수 = (50 - 순위) * 가중치의 합
 * 최대 점수 예시: 4개 순위 모두 1위, 기본 가중치 → 49 * 25 * 4 = 4900
 */
const ScoreBar = memo(function ScoreBar({ score }: { score: number }) {
  // 실질적 최대 점수 (2개 순위 기준, 가중치 합 100 기준)
  const MAX_SCORE = 49 * 100; // 4900
  const percentage = Math.min(100, (score / MAX_SCORE) * 100);

  const color = useMemo(() => {
    if (score >= 3000) return 'bg-green-500';
    if (score >= 2000) return 'bg-yellow-500';
    if (score >= 1000) return 'bg-orange-500';
    return 'bg-gray-400';
  }, [score]);

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-mono">{score.toLocaleString()}</span>
    </div>
  );
});
