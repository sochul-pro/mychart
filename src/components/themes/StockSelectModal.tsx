'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Check, X, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useThemeStocks } from '@/hooks/useThemes';
import type { ThemeStock } from '@/types';

interface StockSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  themeId: string;
  themeName: string;
  currentSelection: string[] | null;
  onSave: (selectedStocks: string[] | null) => void;
  isSaving?: boolean;
}

const MAX_SELECTION = 5;

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR');
}

function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function StockSelectModal({
  open,
  onOpenChange,
  themeId,
  themeName,
  currentSelection,
  onSave,
  isSaving = false,
}: StockSelectModalProps) {
  const { stocks, isLoading } = useThemeStocks(themeId, { enabled: open });
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set());
  const [useCustom, setUseCustom] = useState(false);

  // 모달 열릴 때 현재 선택 상태로 초기화
  useEffect(() => {
    if (open) {
      if (currentSelection && currentSelection.length > 0) {
        setSelectedStocks(new Set(currentSelection));
        setUseCustom(true);
      } else {
        setSelectedStocks(new Set());
        setUseCustom(false);
      }
    }
  }, [open, currentSelection]);

  // 상위 5개 종목 (모멘텀 점수 기준)
  const topStocks = useMemo(() => {
    return stocks.slice(0, MAX_SELECTION);
  }, [stocks]);

  // 종목 선택 토글
  const toggleStock = (symbol: string) => {
    setSelectedStocks((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        if (next.size >= MAX_SELECTION) {
          // 최대 선택 개수 초과시 가장 먼저 선택한 것 제거
          const first = next.values().next().value;
          if (first) next.delete(first);
        }
        next.add(symbol);
      }
      return next;
    });
    setUseCustom(true);
  };

  // 기본 추천으로 초기화
  const resetToDefault = () => {
    setSelectedStocks(new Set());
    setUseCustom(false);
  };

  // 저장
  const handleSave = () => {
    if (useCustom && selectedStocks.size > 0) {
      onSave(Array.from(selectedStocks));
    } else {
      onSave(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>종목 선택 - {themeName}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* 선택 모드 */}
          <div className="flex items-center justify-between px-1">
            <div className="text-sm text-muted-foreground">
              {useCustom ? (
                <>
                  <span className="text-primary font-medium">{selectedStocks.size}</span>
                  /{MAX_SELECTION}개 선택됨
                </>
              ) : (
                '모멘텀 점수 기반 자동 추천'
              )}
            </div>
            {useCustom && (
              <Button variant="ghost" size="sm" onClick={resetToDefault}>
                <RotateCcw className="h-4 w-4 mr-1" />
                기본 추천
              </Button>
            )}
          </div>

          {/* 종목 목록 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-1">
              {stocks.map((stock, index) => {
                const isSelected = selectedStocks.has(stock.symbol);
                const isTopStock = index < MAX_SELECTION;

                return (
                  <div
                    key={stock.symbol}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-muted/50',
                      !useCustom && isTopStock && 'bg-muted/30'
                    )}
                    onClick={() => toggleStock(stock.symbol)}
                  >
                    {/* 체크 아이콘 */}
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>

                    {/* 순위 */}
                    <div className="w-6 text-center text-sm text-muted-foreground">
                      {index + 1}
                    </div>

                    {/* 종목 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{stock.name}</span>
                        {!useCustom && isTopStock && (
                          <Badge variant="secondary" className="text-xs">
                            추천
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{stock.symbol}</span>
                        <span>{formatPrice(stock.price)}원</span>
                      </div>
                    </div>

                    {/* 등락률 */}
                    <div
                      className={cn(
                        'text-sm font-medium',
                        stock.changePercent > 0 && 'text-red-600',
                        stock.changePercent < 0 && 'text-blue-600'
                      )}
                    >
                      {formatPercent(stock.changePercent)}
                    </div>

                    {/* 모멘텀 점수 */}
                    {stock.momentumScore !== undefined && (
                      <div className="text-xs text-muted-foreground w-12 text-right">
                        {stock.momentumScore.toFixed(0)}점
                      </div>
                    )}
                  </div>
                );
              })}

              {stocks.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  종목 정보가 없습니다
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                저장 중...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                저장
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
