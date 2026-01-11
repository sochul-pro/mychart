'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StockInfo } from '@/types';

interface SymbolSelectProps {
  value: string;
  onChange: (symbol: string, name?: string) => void;
  className?: string;
}

interface SearchResult extends StockInfo {
  price?: number;
  changePercent?: number;
}

export function SymbolSelect({ value, onChange, className }: SymbolSelectProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<string>('');

  // Fetch stock name when value changes externally
  useEffect(() => {
    if (value && !selectedName) {
      fetch(`/api/stocks/${value}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.stock?.name) {
            setSelectedName(data.stock.name);
          }
        })
        .catch(() => {});
    }
  }, [value, selectedName]);

  const searchStocks = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchStocks(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchStocks]);

  const handleSelect = (stock: SearchResult) => {
    onChange(stock.symbol, stock.name);
    setSelectedName(stock.name);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('', undefined);
    setSelectedName('');
    setQuery('');
  };

  return (
    <div className={cn('relative', className)}>
      {value ? (
        <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
          <div className="flex-1">
            <div className="font-medium">{selectedName || value}</div>
            <div className="text-xs text-muted-foreground">{value.slice(-6)}</div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="종목명 또는 종목코드 입력"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="pl-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Dropdown results */}
          {isOpen && results.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
              {results.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleSelect(stock)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stock.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {stock.market}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{stock.symbol.slice(-6)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
