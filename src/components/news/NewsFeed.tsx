'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { NewsCard } from './NewsCard';
import { useNews } from '@/hooks/useNews';

interface NewsFeedProps {
  symbol?: string;
  symbols?: string[];
  limit?: number;
  title?: string;
  height?: string;
}

export function NewsFeed({
  symbol,
  symbols,
  limit = 20,
  title = '뉴스',
  height = '500px',
}: NewsFeedProps) {
  const { news, isLoading, error, refetch } = useNews({
    symbol,
    symbols,
    limit,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{title}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {error ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          뉴스를 불러올 수 없습니다.
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          뉴스가 없습니다.
        </div>
      ) : (
        <ScrollArea style={{ height }} className="-mx-4">
          <div className="px-4">
            {news.map((item, index) => (
              <div key={item.id}>
                <NewsCard news={item} />
                {index < news.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
