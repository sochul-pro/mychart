'use client';

import { use, useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, Plus, Loader2, Star, Settings2, ChevronDown, Check } from 'lucide-react';
import { StockChartWithIndicators, IndicatorPanel } from '@/components/chart/indicators';
import type { IndicatorConfig } from '@/components/chart/indicators/types';
import type { TimeFrame } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NewsFeed } from '@/components/news';
import { useStock } from '@/hooks/useStock';
import { useWatchlist } from '@/hooks/useWatchlist';
import { cn } from '@/lib/utils';

// 숫자 포맷팅 유틸리티
function formatMarketCap(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}조`;
  return `${value.toLocaleString()}억`;
}

function formatTradingValue(value: number): string {
  if (value >= 100000000) return `${(value / 100000000).toFixed(0)}억`;
  if (value >= 10000) return `${(value / 10000).toFixed(0)}만`;
  return value.toLocaleString();
}

interface StockDetailPageProps {
  params: Promise<{ symbol: string }>;
}

export default function StockDetailPage({ params }: StockDetailPageProps) {
  const { symbol } = use(params);
  const { info, quote, ohlcv, isLoading, error } = useStock(symbol);
  const { groups, addItem, isAddingItem } = useWatchlist();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('D');
  const [isIndicatorPanelOpen, setIsIndicatorPanelOpen] = useState(false);

  // 관심종목 등록 여부 확인
  const watchlistInfo = useMemo(() => {
    for (const group of groups) {
      const item = group.items.find((item) => item.symbol === symbol);
      if (item) {
        return { isRegistered: true, groupName: group.name, groupId: group.id };
      }
    }
    return { isRegistered: false, groupName: null, groupId: null };
  }, [groups, symbol]);

  // 지표 설정 상태
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([
    { type: 'sma', period: 20, color: '#2196F3', enabled: true },
    { type: 'sma', period: 60, color: '#FF9800', enabled: true },
    { type: 'bollinger', period: 20, stdDev: 2, color: '#9C27B0', enabled: false },
    { type: 'rsi', period: 14, overbought: 70, oversold: 30, color: '#E91E63', enabled: false },
    { type: 'macd', fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, color: '#00BCD4', enabled: false },
  ]);

  const handleAddToWatchlist = async () => {
    if (!selectedGroupId || !info) return;
    try {
      await addItem({
        groupId: selectedGroupId,
        data: { symbol: info.symbol, name: info.name },
      });
      setIsAddDialogOpen(false);
      setSelectedGroupId('');
    } catch (err) {
      console.error('Failed to add to watchlist:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !info || !quote) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">종목 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-bold">{info.name}</h1>
            <Badge variant="outline">{info.market}</Badge>
            {info.sector && (
              <Badge variant="secondary">{info.sector}</Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">{info.symbol}</p>
        </div>
        {watchlistInfo.isRegistered ? (
          <Button variant="secondary" className="w-full sm:w-auto" disabled>
            <Check className="h-4 w-4 mr-2" />
            <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
            {watchlistInfo.groupName}
          </Button>
        ) : (
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            관심 추가
          </Button>
        )}
      </div>

      {/* 시세 정보 - 2컬럼 레이아웃 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            {/* 왼쪽: 현재가 + 기본 시세 정보 */}
            <div>
              {/* 현재가 */}
              <div className="flex flex-wrap items-baseline gap-2 sm:gap-4">
                <span className="text-3xl sm:text-4xl font-bold">
                  {quote.price.toLocaleString()}
                </span>
                <span className="text-base sm:text-lg text-muted-foreground">원</span>
                <div
                  className={cn(
                    'flex items-center gap-1 text-base sm:text-lg font-medium',
                    quote.changePercent > 0
                      ? 'text-red-500'
                      : quote.changePercent < 0
                      ? 'text-blue-500'
                      : ''
                  )}
                >
                  {quote.changePercent > 0 ? (
                    <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : quote.changePercent < 0 ? (
                    <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : null}
                  {quote.change > 0 ? '+' : ''}
                  {quote.change.toLocaleString()} ({quote.changePercent > 0 ? '+' : ''}
                  {quote.changePercent.toFixed(2)}%)
                </div>
              </div>

              {/* OHLC + 거래량 + 거래대금 */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-6">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">시가</p>
                  <p className="font-medium text-sm sm:text-base">{quote.open.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">고가</p>
                  <p className="font-medium text-sm sm:text-base text-red-500">{quote.high.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">저가</p>
                  <p className="font-medium text-sm sm:text-base text-blue-500">{quote.low.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">거래량</p>
                  <p className="font-medium text-sm sm:text-base">
                    {quote.volume >= 1000000
                      ? `${(quote.volume / 1000000).toFixed(1)}M`
                      : `${(quote.volume / 1000).toFixed(0)}K`}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">거래대금</p>
                  <p className="font-medium text-sm sm:text-base">
                    {quote.tradingValue !== undefined
                      ? formatTradingValue(quote.tradingValue)
                      : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* 오른쪽: 투자 정보 (확장 정보) */}
            {(quote.marketCap || quote.per || quote.high52w) && (
              <div className="border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6">
                <p className="text-sm font-semibold text-muted-foreground mb-3">투자 정보</p>
                <div className="space-y-2">
                  {quote.marketCap !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">시가총액</span>
                      <span className="text-sm font-medium">{formatMarketCap(quote.marketCap)}</span>
                    </div>
                  )}
                  {quote.per !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">PER</span>
                      <span className="text-sm font-medium">{quote.per.toFixed(2)}</span>
                    </div>
                  )}
                  {quote.pbr !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">PBR</span>
                      <span className="text-sm font-medium">{quote.pbr.toFixed(2)}</span>
                    </div>
                  )}
                  {quote.foreignHoldingRate !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">외국인보유</span>
                      <span className="text-sm font-medium">{quote.foreignHoldingRate.toFixed(2)}%</span>
                    </div>
                  )}
                  {(quote.high52w !== undefined || quote.low52w !== undefined) && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">52주 고/저</span>
                      <span className="text-sm font-medium">
                        <span className="text-red-500">{quote.high52w?.toLocaleString() ?? '-'}</span>
                        {' / '}
                        <span className="text-blue-500">{quote.low52w?.toLocaleString() ?? '-'}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 차트 + 뉴스 */}
      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* 차트 영역 */}
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>차트</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsIndicatorPanelOpen(!isIndicatorPanelOpen)}
                className="gap-2"
              >
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">지표 설정</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isIndicatorPanelOpen && 'rotate-180'
                  )}
                />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            {/* 지표 설정 패널 */}
            {isIndicatorPanelOpen && (
              <div className="mb-4">
                <IndicatorPanel
                  indicators={indicators}
                  onIndicatorsChange={setIndicators}
                />
              </div>
            )}

            {/* 차트 */}
            {ohlcv && ohlcv.length > 0 ? (
              <StockChartWithIndicators
                data={ohlcv}
                indicators={indicators}
                height={400}
                showVolume={true}
                timeFrame={timeFrame}
                onTimeFrameChange={setTimeFrame}
              />
            ) : (
              <div className="h-[300px] sm:h-[400px] flex items-center justify-center bg-muted/30 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 뉴스 사이드패널 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              관련 뉴스
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NewsFeed symbol={symbol} limit={10} title="" height="350px" />
          </CardContent>
        </Card>
      </div>

      {/* 관심종목 추가 다이얼로그 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>관심종목에 추가</DialogTitle>
            <DialogDescription>해당 종목을 관심종목 그룹에 추가합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>종목</Label>
              <p className="text-sm">
                {info.name} ({info.symbol})
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="group">그룹 선택</Label>
              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  관심종목 그룹이 없습니다. 먼저 그룹을 만들어주세요.
                </p>
              ) : (
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="그룹을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleAddToWatchlist}
              disabled={!selectedGroupId || isAddingItem}
            >
              {isAddingItem && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
