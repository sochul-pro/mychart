'use client';

import { useState } from 'react';
import { MoreHorizontal, Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { WatchlistItemRow } from './WatchlistItemRow';
import type { WatchlistGroup, WatchlistItem } from '@/types';

interface WatchlistGroupCardProps {
  group: WatchlistGroup;
  onRenameGroup: (groupId: string, name: string) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  onAddItem: (groupId: string, symbol: string, name: string) => Promise<void>;
  onUpdateItem: (
    groupId: string,
    itemId: string,
    data: { memo?: string | null; targetPrice?: number | null; buyPrice?: number | null }
  ) => Promise<void>;
  onDeleteItem: (groupId: string, itemId: string) => Promise<void>;
}

export function WatchlistGroupCard({
  group,
  onRenameGroup,
  onDeleteGroup,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: WatchlistGroupCardProps) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [newName, setNewName] = useState(group.name);
  const [stockSymbol, setStockSymbol] = useState('');
  const [stockName, setStockName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRename = async () => {
    if (!newName.trim()) return;
    setIsLoading(true);
    try {
      await onRenameGroup(group.id, newName.trim());
      setIsRenameOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDeleteGroup(group.id);
      setIsDeleteOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStock = async () => {
    if (!stockSymbol.trim() || !stockName.trim()) return;
    setIsLoading(true);
    try {
      await onAddItem(group.id, stockSymbol.trim(), stockName.trim());
      setStockSymbol('');
      setStockName('');
      setIsAddStockOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <CardTitle className="text-lg font-semibold">{group.name}</CardTitle>
            <span className="text-sm text-muted-foreground">({group.items.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsAddStockOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsRenameOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  이름 변경
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
        </CardHeader>
        <CardContent className="px-2">
          {group.items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              종목을 추가하세요
            </p>
          ) : (
            <div>
              {/* 테이블 헤더 */}
              <div className="grid grid-cols-[1fr_70px_65px_28px] sm:grid-cols-[1fr_80px_80px_70px_32px] items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs text-muted-foreground border-b mb-1">
                <span>종목명</span>
                <span className="text-right">현재가</span>
                <span className="text-right">등락률</span>
                <span className="hidden sm:block text-right">목표가</span>
                <span></span>
              </div>
              {/* 종목 행 */}
              <div className="space-y-0">
                {group.items.map((item: WatchlistItem) => (
                  <WatchlistItemRow
                    key={item.id}
                    item={item}
                    onUpdate={(data) => onUpdateItem(group.id, item.id, data)}
                    onDelete={() => onDeleteItem(group.id, item.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 이름 변경 다이얼로그 */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>그룹 이름 변경</DialogTitle>
            <DialogDescription>관심종목 그룹의 이름을 변경합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="그룹 이름"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              취소
            </Button>
            <Button onClick={handleRename} disabled={isLoading}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 종목 추가 다이얼로그 */}
      <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>종목 추가</DialogTitle>
            <DialogDescription>관심종목 그룹에 새로운 종목을 추가합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="symbol">종목코드</Label>
              <Input
                id="symbol"
                value={stockSymbol}
                onChange={(e) => setStockSymbol(e.target.value)}
                placeholder="005930"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stockName">종목명</Label>
              <Input
                id="stockName"
                value={stockName}
                onChange={(e) => setStockName(e.target.value)}
                placeholder="삼성전자"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStockOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAddStock} disabled={isLoading}>
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>그룹 삭제</DialogTitle>
            <DialogDescription>
              &apos;{group.name}&apos; 그룹을 삭제하시겠습니까? 그룹 내 모든 종목도 함께
              삭제됩니다.
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
