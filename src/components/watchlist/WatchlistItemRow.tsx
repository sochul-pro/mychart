'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  return (
    <>
      <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md group">
        <Link
          href={`/stocks/${item.symbol}`}
          className="flex-1 flex items-center gap-3"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{item.name}</span>
              <span className="text-xs text-muted-foreground">{item.symbol}</span>
            </div>
            {item.memo && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{item.memo}</p>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {item.targetPrice && (
            <Badge variant="outline" className="text-xs">
              목표 {item.targetPrice.toLocaleString()}
            </Badge>
          )}
          {item.buyPrice && (
            <Badge variant="secondary" className="text-xs">
              매수 {item.buyPrice.toLocaleString()}
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
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
      </div>

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
