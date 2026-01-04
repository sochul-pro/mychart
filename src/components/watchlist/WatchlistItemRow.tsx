'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Trash2, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useStockQuote } from '@/hooks/useStock';
import { cn } from '@/lib/utils';
import type { WatchlistItem } from '@/types';

interface WatchlistItemRowProps {
  item: WatchlistItem;
  onUpdate: (data: {
    memo?: string | null;
    targetPrice?: number | null;
    buyPrice?: number | null;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function WatchlistItemRow({ item, onUpdate, onDelete }: WatchlistItemRowProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [memo, setMemo] = useState(item.memo ?? '');
  const [targetPrice, setTargetPrice] = useState(item.targetPrice?.toString() ?? '');
  const [buyPrice, setBuyPrice] = useState(item.buyPrice?.toString() ?? '');
  const [isLoading, setIsLoading] = useState(false);

  const { data: quote, isLoading: isQuoteLoading } = useStockQuote({ symbol: item.symbol });

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      await onUpdate({
        memo: memo.trim() || null,
        targetPrice: targetPrice ? parseFloat(targetPrice) : null,
        buyPrice: buyPrice ? parseFloat(buyPrice) : null,
      });
      setIsEditOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete();
      setIsDeleteOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 종목명 정규화 (보통주 제거, 우선주 → (우))
  const displayName = item.name.includes('우선주')
    ? item.name.replace('우선주', '') + '(우)'
    : item.name.replace('보통주', '');

  return (
    <>
      <Link
        href={`/stocks/${item.symbol}`}
        className="grid grid-cols-[1fr_70px_65px_28px] sm:grid-cols-[1fr_80px_80px_70px_32px] items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 hover:bg-muted/50 rounded-md group text-sm"
      >
        {/* 종목명 + 코드 */}
        <div className="min-w-0">
          <span className="font-medium truncate block">{displayName}</span>
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

        {/* 목표가 - 모바일에서 숨김 */}
        <div className="hidden sm:block text-right tabular-nums text-muted-foreground">
          {item.targetPrice ? item.targetPrice.toLocaleString() : '-'}
        </div>

        {/* 메뉴 버튼 */}
        <div onClick={(e) => e.preventDefault()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 sm:opacity-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                메모/가격 수정
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Link>

      {/* 수정 다이얼로그 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{item.name} 수정</DialogTitle>
            <DialogDescription>메모와 목표가/매수가를 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="memo">메모</Label>
              <Input
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모를 입력하세요"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="targetPrice">목표가</Label>
              <Input
                id="targetPrice"
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="80000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buyPrice">매수가</Label>
              <Input
                id="buyPrice"
                type="number"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="70000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>종목 삭제</DialogTitle>
            <DialogDescription>
              &apos;{item.name}&apos;을(를) 관심종목에서 삭제하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
