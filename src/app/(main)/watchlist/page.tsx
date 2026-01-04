'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus, Loader2, Trash2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AutoRotateControl } from '@/components/watchlist';
import { StockQuoteCard, StockChartCard } from '@/components/stock';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useStock } from '@/hooks/useStock';
import type { WatchlistItem, TimeFrame } from '@/types';
import { cn } from '@/lib/utils';

export default function WatchlistPage() {
  const {
    groups,
    isLoading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
    addItem,
    updateItem,
    deleteItem,
    isCreatingGroup,
  } = useWatchlist();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('D');
  const [mobileTab, setMobileTab] = useState<'list' | 'chart'>('list');

  // 모든 종목을 flat list로 변환
  const allItems = useMemo(() => {
    const items: WatchlistItem[] = [];
    groups.forEach((group) => {
      group.items.forEach((item) => {
        items.push(item);
      });
    });
    return items;
  }, [groups]);

  // 현재 선택된 종목의 인덱스
  const currentIndex = useMemo(() => {
    if (!selectedSymbol) return 0;
    const index = allItems.findIndex((item) => item.symbol === selectedSymbol);
    return index >= 0 ? index : 0;
  }, [selectedSymbol, allItems]);

  // 선택된 종목 데이터 로드
  const { info, quote, ohlcv, isLoading: isStockLoading } = useStock({
    symbol: selectedSymbol || '',
    timeFrame,
  });

  // 첫 종목 자동 선택
  useMemo(() => {
    if (!selectedSymbol && allItems.length > 0) {
      setSelectedSymbol(allItems[0].symbol);
    }
  }, [allItems, selectedSymbol]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await createGroup({ name: newGroupName.trim() });
      setNewGroupName('');
      setIsCreateOpen(false);
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  const handleRenameGroup = async (groupId: string, name: string) => {
    await updateGroup({ groupId, data: { name } });
  };

  const handleDeleteGroup = async (groupId: string) => {
    await deleteGroup(groupId);
  };

  const handleAddItem = async (groupId: string, symbol: string, name: string) => {
    await addItem({ groupId, data: { symbol, name } });
  };

  const handleUpdateItem = async (
    groupId: string,
    itemId: string,
    data: { memo?: string | null; targetPrice?: number | null; buyPrice?: number | null }
  ) => {
    await updateItem({ groupId, itemId, data });
  };

  const handleDeleteItem = async (groupId: string, itemId: string) => {
    await deleteItem({ groupId, itemId });
  };

  const handleSelectStock = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    setMobileTab('chart');
  }, []);

  const handleIndexChange = useCallback((index: number) => {
    if (allItems[index]) {
      setSelectedSymbol(allItems[index].symbol);
    }
  }, [allItems]);

  const handlePrevious = useCallback(() => {
    if (allItems.length > 0) {
      const prevIndex = currentIndex === 0 ? allItems.length - 1 : currentIndex - 1;
      handleIndexChange(prevIndex);
    }
  }, [currentIndex, allItems.length, handleIndexChange]);

  const handleNext = useCallback(() => {
    if (allItems.length > 0) {
      const nextIndex = (currentIndex + 1) % allItems.length;
      handleIndexChange(nextIndex);
    }
  }, [currentIndex, allItems.length, handleIndexChange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">데이터를 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  // 종목 리스트 컴포넌트
  const WatchlistPanel = (
    <div className="space-y-4">
      {/* 자동 순환 컨트롤 */}
      {allItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">자동 순환</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <AutoRotateControl
              currentIndex={currentIndex}
              totalCount={allItems.length}
              currentStockName={allItems[currentIndex]?.name}
              nextStockName={allItems[(currentIndex + 1) % allItems.length]?.name}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onIndexChange={handleIndexChange}
            />
          </CardContent>
        </Card>
      )}

      {/* 그룹별 종목 목록 */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
          <p className="text-muted-foreground mb-4">
            아직 관심종목 그룹이 없습니다.
            <br />
            그룹을 추가하여 종목을 관리해보세요.
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            첫 그룹 만들기
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <WatchlistGroupCardWithSelection
              key={group.id}
              group={group}
              selectedSymbol={selectedSymbol}
              onSelectStock={handleSelectStock}
              onDeleteItem={handleDeleteItem}
            />
          ))}
        </div>
      )}
    </div>
  );

  // 차트 패널 컴포넌트
  const ChartPanel = (
    <div>
      {!selectedSymbol || !info || !quote ? (
        <div className="flex items-center justify-center min-h-[400px] bg-muted/30 rounded-lg">
          {isStockLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-muted-foreground">종목을 선택하세요</p>
          )}
        </div>
      ) : (
        <>
          <StockQuoteCard info={info} quote={quote} />
          <StockChartCard
            ohlcv={ohlcv}
            timeFrame={timeFrame}
            onTimeFrameChange={setTimeFrame}
            height={500}
          />
        </>
      )}
    </div>
  );

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">관심종목</h1>
        <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          그룹 추가
        </Button>
      </div>

      {/* PC: 2-panel 레이아웃 */}
      <div className="hidden lg:grid lg:grid-cols-[380px_1fr] gap-6">
        {/* 왼쪽: 관심종목 목록 */}
        <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
          {WatchlistPanel}
        </div>

        {/* 오른쪽: 차트 */}
        <div>{ChartPanel}</div>
      </div>

      {/* 모바일/태블릿: 탭 레이아웃 */}
      <div className="lg:hidden">
        <Tabs value={mobileTab} onValueChange={(v: string) => setMobileTab(v as 'list' | 'chart')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="list">목록</TabsTrigger>
            <TabsTrigger value="chart">차트</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="mt-0">
            {WatchlistPanel}
          </TabsContent>
          <TabsContent value="chart" className="mt-0">
            {ChartPanel}
          </TabsContent>
        </Tabs>
      </div>

      {/* 그룹 생성 다이얼로그 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 관심종목 그룹</DialogTitle>
            <DialogDescription>새로운 관심종목 그룹을 생성합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="groupName">그룹 이름</Label>
              <Input
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="예: 반도체, 2차전지"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateGroup();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreateGroup} disabled={isCreatingGroup}>
              {isCreatingGroup && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 선택 기능이 추가된 WatchlistGroupCard 래퍼
import type { WatchlistGroup } from '@/types';

interface WatchlistGroupCardWithSelectionProps {
  group: WatchlistGroup;
  selectedSymbol: string | null;
  onSelectStock: (symbol: string) => void;
  onDeleteItem: (groupId: string, itemId: string) => Promise<void>;
}

function WatchlistGroupCardWithSelection({
  group,
  selectedSymbol,
  onSelectStock,
  onDeleteItem,
}: WatchlistGroupCardWithSelectionProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold">{group.name}</CardTitle>
          <span className="text-sm text-muted-foreground">({group.items.length})</span>
        </div>
      </CardHeader>
      <CardContent className="px-2">
        {group.items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            종목을 추가하세요
          </p>
        ) : (
          <div>
            {/* 테이블 헤더 */}
            <div className="grid grid-cols-[1fr_70px_65px_28px] sm:grid-cols-[1fr_80px_80px_32px] items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs text-muted-foreground border-b mb-1">
              <span>종목명</span>
              <span className="text-right">현재가</span>
              <span className="text-right">등락률</span>
              <span></span>
            </div>
            {/* 종목 행 */}
            <div className="space-y-0">
              {group.items.map((item) => (
                <WatchlistItemRowSelectable
                  key={item.id}
                  item={item}
                  isSelected={item.symbol === selectedSymbol}
                  onSelect={() => onSelectStock(item.symbol)}
                  onDelete={() => onDeleteItem(group.id, item.id)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 선택 가능한 종목 행 컴포넌트
import { useStockQuote } from '@/hooks/useStock';

interface WatchlistItemRowSelectableProps {
  item: WatchlistItem;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => Promise<void>;
}

function WatchlistItemRowSelectable({
  item,
  isSelected,
  onSelect,
  onDelete,
}: WatchlistItemRowSelectableProps) {
  const { data: quote, isLoading: isQuoteLoading } = useStockQuote({ symbol: item.symbol });
  const [isDeleting, setIsDeleting] = useState(false);

  const displayName = item.name.includes('우선주')
    ? item.name.replace('우선주', '') + '(우)'
    : item.name.replace('보통주', '');

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        'group grid grid-cols-[1fr_70px_65px_28px] sm:grid-cols-[1fr_80px_80px_32px] items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-sm transition-colors cursor-pointer',
        isSelected
          ? 'bg-primary/10 border border-primary/30'
          : 'hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      {/* 종목명 + 코드 */}
      <div className="min-w-0">
        <div className="flex items-center gap-1">
          {isSelected && <span className="text-primary">●</span>}
          <span className="font-medium truncate">{displayName}</span>
        </div>
        <span className="text-xs text-muted-foreground">{item.symbol.slice(-6)}</span>
      </div>

      {/* 현재가 */}
      <div className="text-right font-medium tabular-nums text-xs sm:text-sm">
        {isQuoteLoading ? (
          <Loader2 className="h-3 w-3 animate-spin ml-auto" />
        ) : quote ? (
          quote.price.toLocaleString()
        ) : (
          '-'
        )}
      </div>

      {/* 등락률 */}
      <div
        className={cn(
          'text-right tabular-nums text-xs sm:text-sm',
          quote?.changePercent && quote.changePercent > 0 && 'text-red-500',
          quote?.changePercent && quote.changePercent < 0 && 'text-blue-500'
        )}
      >
        {isQuoteLoading ? (
          '-'
        ) : quote ? (
          `${quote.changePercent > 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%`
        ) : (
          '-'
        )}
      </div>

      {/* 삭제 버튼 */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
        title="삭제"
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Trash2 className="h-4 w-4 text-destructive" />
        )}
      </button>
    </div>
  );
}
