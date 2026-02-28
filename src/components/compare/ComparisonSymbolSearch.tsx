'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Loader2, TrendingUp, TrendingDown, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { StockInfo } from '@/types';
import type { ComparisonItem, ComparisonItemType } from '@/types/comparison';
import { SUPPORTED_INDICES, MAX_COMPARISON_ITEMS, getComparisonColor } from '@/types/comparison';

interface StockSearchResult extends StockInfo {
  price?: number;
  changePercent?: number;
  fromApi?: boolean;
}

interface ComparisonSymbolSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (code: string, name: string, type: ComparisonItemType) => void;
  existingCodes: string[];
  currentCount: number;
}

export function ComparisonSymbolSearch({
  open,
  onOpenChange,
  onAdd,
  existingCodes,
  currentCount,
}: ComparisonSymbolSearchProps) {
  const [activeTab, setActiveTab] = useState<'stock' | 'index'>('stock');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const remainingSlots = MAX_COMPARISON_ITEMS - currentCount;
  const isAtLimit = currentCount >= MAX_COMPARISON_ITEMS;

  // 종목코드 형식 체크 (6자리 숫자)
  const isSymbolFormat = (q: string) => /^\d{6}$/.test(q.trim());

  // 마스터 검색 함수
  const searchStocks = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();

      // 시세 정보 추가 (선택적)
      const resultsWithQuotes = await Promise.all(
        data.results.map(async (stock: StockInfo) => {
          try {
            const quoteRes = await fetch(`/api/stocks/${stock.symbol}`);
            if (quoteRes.ok) {
              const quoteData = await quoteRes.json();
              return {
                ...stock,
                price: quoteData.quote?.price,
                changePercent: quoteData.quote?.changePercent,
              };
            }
          } catch {
            // 시세 로드 실패해도 기본 정보는 표시
          }
          return stock;
        })
      );

      setResults(resultsWithQuotes);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 디바운스 검색
  useEffect(() => {
    if (activeTab !== 'stock') return;

    const timer = setTimeout(() => {
      searchStocks(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeTab, searchStocks]);

  // 다이얼로그 닫힐 때 초기화
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setActiveTab('stock');
    }
  }, [open]);

  // 종목 추가 핸들러
  const handleAddStock = (stock: StockSearchResult) => {
    if (existingCodes.includes(stock.symbol)) return;
    if (isAtLimit) return;

    onAdd(stock.symbol, stock.name, 'stock');
  };

  // 지수 추가 핸들러
  const handleAddIndex = (code: string, name: string) => {
    if (existingCodes.includes(code)) return;
    if (isAtLimit) return;

    onAdd(code, name, 'index');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>종목/지수 추가</DialogTitle>
          <DialogDescription>
            비교할 종목이나 지수를 추가하세요. (남은 슬롯: {remainingSlots})
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'stock' | 'index')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stock">종목 검색</TabsTrigger>
            <TabsTrigger value="index">지수 선택</TabsTrigger>
          </TabsList>

          <TabsContent value="stock" className="mt-4">
            {/* 검색창 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="종목명 또는 코드 검색..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                disabled={isAtLimit}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* 검색 결과 */}
            <div className="mt-4 max-h-[300px] overflow-y-auto">
              {results.length === 0 && query && !isSearching && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  검색 결과가 없습니다
                </div>
              )}

              {results.map((stock) => {
                const isAdded = existingCodes.includes(stock.symbol);

                return (
                  <div
                    key={stock.symbol}
                    className={cn(
                      'flex items-center justify-between rounded-lg p-3 transition-colors',
                      isAdded ? 'opacity-50' : 'cursor-pointer hover:bg-muted/50'
                    )}
                    onClick={() => !isAdded && !isAtLimit && handleAddStock(stock)}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{stock.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {stock.market}
                        </Badge>
                        {stock.fromApi && (
                          <Badge variant="secondary" className="text-xs">
                            API
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{stock.symbol}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {stock.price && (
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {stock.price.toLocaleString()}원
                          </div>
                          {stock.changePercent !== undefined && (
                            <div
                              className={cn(
                                'flex items-center justify-end text-xs',
                                stock.changePercent >= 0 ? 'text-red-500' : 'text-blue-500'
                              )}
                            >
                              {stock.changePercent >= 0 ? (
                                <TrendingUp className="mr-1 h-3 w-3" />
                              ) : (
                                <TrendingDown className="mr-1 h-3 w-3" />
                              )}
                              {stock.changePercent >= 0 ? '+' : ''}
                              {stock.changePercent.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      )}

                      {isAdded ? (
                        <Badge variant="secondary">추가됨</Badge>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          disabled={isAtLimit}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="index" className="mt-4">
            {/* 지수 목록 */}
            <div className="space-y-2">
              {SUPPORTED_INDICES.map((index) => {
                const isAdded = existingCodes.includes(index.code);

                return (
                  <div
                    key={index.code}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-3 transition-colors',
                      isAdded ? 'opacity-50' : 'cursor-pointer hover:bg-muted/50'
                    )}
                    onClick={() => !isAdded && !isAtLimit && handleAddIndex(index.code, index.name)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{index.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {index.nameEn} ({index.code})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index.market}</Badge>
                      {isAdded ? (
                        <Badge variant="secondary">추가됨</Badge>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          disabled={isAtLimit}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {isAtLimit && (
          <div className="rounded-lg bg-yellow-500/10 p-3 text-center text-sm text-yellow-600">
            최대 {MAX_COMPARISON_ITEMS}개까지 비교할 수 있습니다.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ComparisonSymbolSearch;
