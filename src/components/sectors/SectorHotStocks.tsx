'use client';

import { memo } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SectorSummary, StockInfo, Quote } from '@/types';

interface SectorHotStocksProps {
  summaries: SectorSummary[];
  stockQuotes?: Record<string, { stock: StockInfo; quote: Quote }>;
  isLoading?: boolean;
  maxSectors?: number;
}

export const SectorHotStocks = memo(function SectorHotStocks({
  summaries,
  stockQuotes = {},
  isLoading,
  maxSectors = 6,
}: SectorHotStocksProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: maxSectors }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-8 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        섹터 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  // 상위 N개 섹터만 표시
  const topSectors = summaries.slice(0, maxSectors);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-orange-500" />
        <h2 className="text-lg font-semibold">섹터별 핫 종목</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topSectors.map((summary) => (
          <SectorCard
            key={summary.sector.code}
            summary={summary}
            stockQuotes={stockQuotes}
          />
        ))}
      </div>
    </div>
  );
});

interface SectorCardProps {
  summary: SectorSummary;
  stockQuotes: Record<string, { stock: StockInfo; quote: Quote }>;
}

const SectorCard = memo(function SectorCard({ summary, stockQuotes }: SectorCardProps) {
  const { sector, avgChangePercent, advanceCount, declineCount, hotStocks } = summary;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {sector.name}
            <Badge variant="outline" className="text-xs font-normal">
              {summary.stockCount}종목
            </Badge>
          </CardTitle>
          <div
            className={cn(
              'flex items-center text-sm font-medium',
              avgChangePercent > 0 ? 'text-red-500' : avgChangePercent < 0 ? 'text-blue-500' : ''
            )}
          >
            {avgChangePercent > 0 ? (
              <ArrowUp className="h-3 w-3" />
            ) : avgChangePercent < 0 ? (
              <ArrowDown className="h-3 w-3" />
            ) : null}
            {avgChangePercent > 0 ? '+' : ''}
            {avgChangePercent.toFixed(2)}%
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-red-500">{advanceCount}</span>
          <span>/</span>
          <span className="text-blue-500">{declineCount}</span>
          <span className="text-muted-foreground ml-1">
            (상승/하락)
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {hotStocks.slice(0, 5).map((symbol, index) => {
            const data = stockQuotes[symbol];
            if (!data) {
              return (
                <HotStockRow
                  key={symbol}
                  rank={index + 1}
                  symbol={symbol}
                  name={symbol}
                  changePercent={0}
                />
              );
            }
            return (
              <HotStockRow
                key={symbol}
                rank={index + 1}
                symbol={symbol}
                name={data.stock.name}
                price={data.quote.price}
                changePercent={data.quote.changePercent}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

interface HotStockRowProps {
  rank: number;
  symbol: string;
  name: string;
  price?: number;
  changePercent: number;
}

const HotStockRow = memo(function HotStockRow({
  rank,
  symbol,
  name,
  price,
  changePercent,
}: HotStockRowProps) {
  return (
    <Link
      href={`/stocks/${symbol}`}
      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-muted-foreground w-4">{rank}</span>
        <span className="font-medium text-sm truncate group-hover:underline">
          {name}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {price && (
          <span className="text-sm font-mono text-muted-foreground">
            {price.toLocaleString()}
          </span>
        )}
        <span
          className={cn(
            'text-sm font-mono min-w-[60px] text-right',
            changePercent > 0 ? 'text-red-500' : changePercent < 0 ? 'text-blue-500' : ''
          )}
        >
          {changePercent > 0 ? '+' : ''}
          {changePercent.toFixed(2)}%
        </span>
      </div>
    </Link>
  );
});

export default SectorHotStocks;
