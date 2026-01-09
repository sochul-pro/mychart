'use client';

import { use, useState, useMemo } from 'react';
import { Plus, Loader2, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { StockQuoteCard, StockChartCard } from '@/components/stock';
import { ChartErrorBoundary, NewsErrorBoundary } from '@/components/ErrorBoundary';
import { useStock } from '@/hooks/useStock';
import { useWatchlist } from '@/hooks/useWatchlist';
import type { TimeFrame } from '@/types';

interface StockDetailPageProps {
  params: Promise<{ symbol: string }>;
}

export default function StockDetailPage({ params }: StockDetailPageProps) {
  const { symbol } = use(params);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('D');
  const { info, quote, ohlcv, isLoading, error } = useStock({ symbol, timeFrame });
  const { groups, addItem, isAddingItem } = useWatchlist();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  const watchlistInfo = useMemo(() => {
    for (const group of groups) {
      const item = group.items.find((item) => item.symbol === symbol);
      if (item) {
        return { isRegistered: true, groupName: group.name, groupId: group.id };
      }
    }
    return { isRegistered: false, groupName: null, groupId: null };
  }, [groups, symbol]);

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
      {/* 시세 정보 카드 */}
      <StockQuoteCard
        info={info}
        quote={quote}
        rightContent={
          watchlistInfo.isRegistered ? (
            <Button variant="secondary" size="sm" disabled>
              <Check className="h-4 w-4 mr-1" />
              <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
              {watchlistInfo.groupName}
            </Button>
          ) : (
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              관심 추가
            </Button>
          )
        }
      />

      {/* 차트 카드 (에러 바운더리로 감쌈) */}
      <ChartErrorBoundary>
        <StockChartCard
          ohlcv={ohlcv}
          timeFrame={timeFrame}
          onTimeFrameChange={setTimeFrame}
          height={600}
        />
      </ChartErrorBoundary>

      {/* 관련 뉴스 (에러 바운더리로 감쌈) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            관련 뉴스
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NewsErrorBoundary>
            <NewsFeed symbol={symbol} limit={10} title="" height="300px" />
          </NewsErrorBoundary>
        </CardContent>
      </Card>

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
