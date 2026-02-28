'use client';

import { useState } from 'react';
import { Save, FolderOpen, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ComparisonSet, ComparePeriod } from '@/types/comparison';
import { MAX_COMPARISON_SETS } from '@/types/comparison';

interface ComparisonSetManagerProps {
  /** 저장된 세트 목록 */
  sets: ComparisonSet[];
  /** 현재 선택된 세트 ID */
  currentSetId?: string;
  /** 현재 종목 목록 */
  currentSymbols: string[];
  /** 현재 기간 */
  currentPeriod: ComparePeriod;
  /** 세트 생성 */
  onCreateSet: (data: { name: string; symbols: string[]; period: ComparePeriod }) => Promise<void>;
  /** 세트 불러오기 */
  onLoadSet: (set: ComparisonSet) => void;
  /** 세트 삭제 */
  onDeleteSet: (id: string) => Promise<void>;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 저장 중 상태 */
  isSaving?: boolean;
}

export function ComparisonSetManager({
  sets,
  currentSetId,
  currentSymbols,
  currentPeriod,
  onCreateSet,
  onLoadSet,
  onDeleteSet,
  isLoading = false,
  isSaving = false,
}: ComparisonSetManagerProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [setToDelete, setSetToDelete] = useState<ComparisonSet | null>(null);
  const [newSetName, setNewSetName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const currentSet = sets.find((s) => s.id === currentSetId);
  const isAtLimit = sets.length >= MAX_COMPARISON_SETS;
  const canSave = currentSymbols.length > 0;

  // 저장 다이얼로그 열기
  const handleOpenSaveDialog = () => {
    setNewSetName('');
    setSaveError(null);
    setSaveDialogOpen(true);
  };

  // 세트 저장
  const handleSave = async () => {
    if (!newSetName.trim()) {
      setSaveError('이름을 입력해주세요.');
      return;
    }

    try {
      setSaveError(null);
      await onCreateSet({
        name: newSetName.trim(),
        symbols: currentSymbols,
        period: currentPeriod,
      });
      setSaveDialogOpen(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '저장에 실패했습니다.');
    }
  };

  // 삭제 확인 다이얼로그 열기
  const handleOpenDeleteDialog = (set: ComparisonSet) => {
    setSetToDelete(set);
    setDeleteDialogOpen(true);
  };

  // 세트 삭제
  const handleDelete = async () => {
    if (!setToDelete) return;

    try {
      await onDeleteSet(setToDelete.id);
      setDeleteDialogOpen(false);
      setSetToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* 불러오기 드롭다운 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoading || sets.length === 0}>
              <FolderOpen className="mr-2 h-4 w-4" />
              {currentSet ? currentSet.name : '불러오기'}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            {sets.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                저장된 세트가 없습니다
              </div>
            ) : (
              sets.map((set) => (
                <DropdownMenuItem
                  key={set.id}
                  className="flex items-center justify-between"
                  onClick={() => onLoadSet(set)}
                >
                  <span className="truncate">{set.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDeleteDialog(set);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuItem>
              ))
            )}
            {sets.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  {sets.length}/{MAX_COMPARISON_SETS} 세트 저장됨
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 저장 버튼 */}
        <Button
          variant="outline"
          size="sm"
          disabled={!canSave || isAtLimit || isSaving}
          onClick={handleOpenSaveDialog}
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          저장
        </Button>
      </div>

      {/* 저장 다이얼로그 */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>비교 세트 저장</DialogTitle>
            <DialogDescription>
              현재 비교 중인 {currentSymbols.length}개 종목을 세트로 저장합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">세트 이름</label>
              <Input
                placeholder="예: 반도체 vs 2차전지"
                value={newSetName}
                onChange={(e) => setNewSetName(e.target.value)}
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
              {saveError && (
                <p className="mt-1 text-sm text-red-500">{saveError}</p>
              )}
            </div>

            <div className="rounded-lg bg-muted p-3">
              <div className="text-sm font-medium">포함된 종목</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {currentSymbols.join(', ')}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>세트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &apos;{setToDelete?.name}&apos; 세트를 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ComparisonSetManager;
