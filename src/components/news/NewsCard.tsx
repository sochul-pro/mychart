'use client';

import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { News } from '@/types';

interface NewsCardProps {
  news: News;
}

export function NewsCard({ news }: NewsCardProps) {
  const timeAgo = getTimeAgo(news.publishedAt);

  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 hover:bg-muted/50 rounded-lg transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium line-clamp-2 group-hover:underline">
            {news.title}
          </h3>
          {news.summary && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {news.summary}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>{news.source}</span>
            <span>·</span>
            <span>{timeAgo}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SentimentBadge sentiment={news.sentiment} />
          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </a>
  );
}

function SentimentBadge({ sentiment }: { sentiment?: 'positive' | 'negative' | 'neutral' }) {
  if (!sentiment) return null;

  const variants: Record<string, { className: string; label: string }> = {
    positive: { className: 'bg-green-100 text-green-700', label: '긍정' },
    negative: { className: 'bg-red-100 text-red-700', label: '부정' },
    neutral: { className: 'bg-gray-100 text-gray-700', label: '중립' },
  };

  const { className, label } = variants[sentiment];

  return (
    <Badge variant="outline" className={cn('text-xs', className)}>
      {label}
    </Badge>
  );
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return new Date(timestamp).toLocaleDateString('ko-KR');
}
