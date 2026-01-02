'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WatchlistGroupCard } from '@/components/watchlist';
import { useWatchlist } from '@/hooks/useWatchlist';

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

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">관심종목</h1>
        <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          그룹 추가
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <WatchlistGroupCard
              key={group.id}
              group={group}
              onRenameGroup={handleRenameGroup}
              onDeleteGroup={handleDeleteGroup}
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
            />
          ))}
        </div>
      )}

      {/* 그룹 생성 다이얼로그 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 관심종목 그룹</DialogTitle>
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
