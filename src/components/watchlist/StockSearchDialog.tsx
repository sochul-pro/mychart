'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Loader2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { StockInfo } from '@/types';

interface StockSearchResult extends StockInfo {
  price?: number;
  changePercent?: number;
  fromApi?: boolean; // API에서 조회된 종목 표시
}

interface StockSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddStock: (symbol: string, name: string) => Promise<void>;
  existingSymbols?: string[]; // 이미 추가된 종목 코드 목록
  groupName?: string; // 그룹 이름 표시용
}

export function StockSearchDialog({
  open,
  onOpenChange,
  onAddStock,
  existingSymbols = [],
  groupName,
}: StockSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);

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

  // KIS API로 종목코드 직접 검색
  const searchByCode = useCallback(async () => {
    const code = query.trim();
    if (!isSymbolFormat(code)) return;

    setIsSearchingApi(true);
    try {
      // POST로 KIS API 검색 요청
      const res = await fetch('/api/stocks/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: code }),
      });

      if (!res.ok) {
        const error = await res.json();
        if (res.status === 404) {
          alert('존재하지 않는 종목코드입니다.');
        } else {
          alert(error.error || '검색에 실패했습니다.');
        }
        return;
      }

      const data = await res.json();
      if (data.stock) {
        // 시세 정보 추가
        try {
          const quoteRes = await fetch(`/api/stocks/${data.stock.symbol}`);
          if (quoteRes.ok) {
            const quoteData = await quoteRes.json();
            data.stock.price = quoteData.quote?.price;
            data.stock.changePercent = quoteData.quote?.changePercent;
          }
        } catch {
          // 시세 로드 실패해도 계속
        }

        data.stock.fromApi = true;
        setResults([data.stock]);
      }
    } catch (error) {
      console.error('API search error:', error);
      alert('검색에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSearchingApi(false);
    }
  }, [query]);

  // 디바운스 검색
  useEffect(() => {
    const timer = setTimeout(() => {
      searchStocks(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchStocks]);

  // 다이얼로그 닫힐 때 초기화
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  const handleAddStock = async (stock: StockSearchResult) => {
    if (addingSymbol) return;

    setAddingSymbol(stock.symbol);
    try {
      await onAddStock(stock.symbol, stock.name);
      // 성공 시 결과에서 제거 (이미 추가됨 표시)
      setResults((prev) => prev.filter((s) => s.symbol !== stock.symbol));
    } catch (error) {
      console.error('Failed to add stock:', error);
    } finally {
      setAddingSymbol(null);
    }
  };

  const isAlreadyAdded = (symbol: string) => existingSymbols.includes(symbol);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>종목 검색</DialogTitle>
          <DialogDescription>
            {groupName ? `"${groupName}" 그룹에 ` : ''}종목을 검색하여 추가하세요.
          </DialogDescription>
        </DialogHeader>

        {/* 검색 입력 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="종목명 또는 종목코드 입력 (예: 삼성전자, 005930)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* 검색 결과 */}
        <div className="max-h-[400px] overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((stock) => {
                const alreadyAdded = isAlreadyAdded(stock.symbol);
                const isAdding = addingSymbol === stock.symbol;

                return (
                  <div
                    key={stock.symbol}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg transition-colors',
                      alreadyAdded
                        ? 'bg-muted/50 opacity-60'
                        : 'hover:bg-muted/50 cursor-pointer'
                    )}
                  >
                    {/* 종목 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{stock.name}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {stock.market}
                        </Badge>
                        {stock.fromApi && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            API
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{stock.symbol.slice(-6)}</span>
                        {stock.sector && (
                          <>
                            <span>·</span>
                            <span>{stock.sector}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 시세 정보 */}
                    {stock.price !== undefined && (
                      <div className="text-right mx-3">
                        <div className="font-medium tabular-nums">
                          {stock.price.toLocaleString()}원
                        </div>
                        {stock.changePercent !== undefined && (
                          <div
                            className={cn(
                              'flex items-center justify-end gap-1 text-sm',
                              stock.changePercent > 0 && 'text-red-500',
                              stock.changePercent < 0 && 'text-blue-500'
                            )}
                          >
                            {stock.changePercent > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : stock.changePercent < 0 ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : null}
                            <span>
                              {stock.changePercent > 0 ? '+' : ''}
                              {stock.changePercent.toFixed(2)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 추가 버튼 */}
                    {alreadyAdded ? (
                      <Badge variant="secondary" className="shrink-0">
                        추가됨
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAddStock(stock)}
                        disabled={isAdding}
                        className="shrink-0"
                      >
                        {isAdding ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : query.length > 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">검색 결과가 없습니다.</p>
              {isSymbolFormat(query) ? (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    종목코드 <span className="font-mono font-medium">{query}</span>를 API에서 검색할까요?
                  </p>
                  <Button
                    onClick={searchByCode}
                    disabled={isSearchingApi}
                    variant="outline"
                    size="sm"
                  >
                    {isSearchingApi ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    API에서 검색
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  다른 검색어로 시도하거나, 6자리 종목코드를 입력하세요.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">종목을 검색하세요</p>
              <p className="text-sm text-muted-foreground mt-1">
                예: 삼성전자, SK하이닉스, 005930
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
