'use client';

import { use, useState } from 'react';
import { ArrowUp, ArrowDown, Plus, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
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

interface StockDetailPageProps {
  params: Promise<{ symbol: string }>;
}

export default function StockDetailPage({ params }: StockDetailPageProps) {
  const { symbol } = use(params);
  const { info, quote, isLoading, error } = useStock(symbol);
  const { groups, addItem, isAddingItem } = useWatchlist();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

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
        <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          관심종목 추가
        </Button>
      </div>

      {/* 시세 정보 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div>
              <p className="text-sm text-muted-foreground">시가</p>
              <p className="font-medium">{quote.open.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">고가</p>
              <p className="font-medium text-red-500">{quote.high.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">저가</p>
              <p className="font-medium text-blue-500">{quote.low.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">거래량</p>
              <p className="font-medium">{(quote.volume / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 차트 + 뉴스 */}
      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* 차트 영역 */}
        <Card>
          <CardHeader className="pb-2 sm:pb-6">
            <CardTitle>차트</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <div className="h-[300px] sm:h-[400px] flex items-center justify-center bg-muted/30 rounded-lg touch-pan-x touch-pan-y">
              <p className="text-muted-foreground text-center text-sm sm:text-base">
                차트 컴포넌트 영역
                <br />
                <span className="text-xs sm:text-sm">(StockChartWithIndicators 연동 필요)</span>
              </p>
            </div>
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
