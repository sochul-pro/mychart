'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, TrendingUp, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ScreenerResult } from '@/types';

interface ScreenerTableProps {
  results: ScreenerResult[];
  isLoading?: boolean;
}

export const ScreenerTable = memo(function ScreenerTable({ results, isLoading }: ScreenerTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-16 bg-muted animate-pulse rounded-lg"
          />
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
            <th className="text-right py-3 px-2">거래량</th>
            <th className="text-right py-3 px-2">점수</th>
            <th className="text-left py-3 px-2">신호</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr
              key={result.stock.symbol}
              className="border-b hover:bg-muted/50 transition-colors"
            >
              <td className="py-3 px-2">
                <span className="text-muted-foreground font-medium">
                  {index + 1}
                </span>
              </td>
              <td className="py-3 px-2">
                <Link
                  href={`/stocks/${result.stock.symbol}`}
                  className="block hover:underline"
                >
                  <div className="font-medium">{result.stock.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {result.stock.symbol} · {result.stock.market}
                  </div>
                </Link>
              </td>
              <td className="py-3 px-2 text-right font-mono">
                {result.quote.price.toLocaleString()}
              </td>
              <td
                className={cn(
                  'py-3 px-2 text-right font-mono',
                  result.quote.changePercent > 0
                    ? 'text-red-500'
                    : result.quote.changePercent < 0
                    ? 'text-blue-500'
                    : ''
                )}
              >
                <span className="flex items-center justify-end gap-1">
                  {result.quote.changePercent > 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : result.quote.changePercent < 0 ? (
                    <ArrowDown className="h-3 w-3" />
                  ) : null}
                  {result.quote.changePercent > 0 ? '+' : ''}
                  {result.quote.changePercent.toFixed(2)}%
                </span>
              </td>
              <td className="py-3 px-2 text-right text-sm">
                <div>{(result.quote.volume / 1000000).toFixed(1)}M</div>
                {result.volumeRatio >= 2 && (
                  <div className="text-xs text-orange-500">
                    x{result.volumeRatio.toFixed(1)}
                  </div>
                )}
              </td>
              <td className="py-3 px-2 text-right">
                <ScoreBar score={result.score} />
              </td>
              <td className="py-3 px-2">
                <div className="flex flex-wrap gap-1">
                  {result.isNewHigh && (
                    <Badge variant="default" className="text-xs bg-yellow-500">
                      <Star className="h-3 w-3 mr-1" />
                      신고가
                    </Badge>
                  )}
                  {result.signals
                    .filter((s) => s.strength === 'strong')
                    .slice(0, 2)
                    .map((signal, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-xs"
                      >
                        {signal.type === 'volume' && (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        )}
                        {signal.message}
                      </Badge>
                    ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const ScoreBar = memo(function ScoreBar({ score }: { score: number }) {
  const color = useMemo(() => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-gray-400';
  }, [score]);

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-mono">{score}</span>
    </div>
  );
});
