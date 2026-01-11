'use client';

import { useState } from 'react';
import { MoreHorizontal, Play, Edit2, Trash2, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { SignalPresetWithStats, TradingStrategy } from '@/lib/signals/types';

interface PresetCardProps {
  preset: SignalPresetWithStats;
  isDefault?: boolean;
  onSelect: (strategy: TradingStrategy) => void;
  onEdit?: (preset: SignalPresetWithStats) => void;
  onDelete?: (id: string) => Promise<void>;
}

export function PresetCard({
  preset,
  isDefault = false,
  onSelect,
  onEdit,
  onDelete,
}: PresetCardProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelect = () => {
    const strategy: TradingStrategy = {
      id: preset.id,
      name: preset.name,
      description: preset.description,
      buyCondition: preset.buyRules,
      sellCondition: preset.sellRules,
    };
    onSelect(strategy);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(preset.id);
      setIsDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPercent = (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{preset.name}</CardTitle>
                {isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    기본
                  </Badge>
                )}
                {!preset.isActive && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    비활성
                  </Badge>
                )}
              </div>
              {preset.description && (
                <CardDescription className="text-sm">
                  {preset.description}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSelect}>
                <Play className="h-4 w-4" />
              </Button>
              {!isDefault && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(preset)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      수정
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
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 성능 지표 */}
          {(preset.winRate !== undefined || preset.totalReturn !== undefined) && (
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">승률</span>
                <span className="font-medium">{formatPercent(preset.winRate)}</span>
              </div>
              <div className="flex items-center gap-1">
                {(preset.totalReturn ?? 0) >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className="text-muted-foreground">수익</span>
                <span
                  className={`font-medium ${
                    (preset.totalReturn ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {formatPercent(preset.totalReturn)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-orange-500" />
                <span className="text-muted-foreground">MDD</span>
                <span className="font-medium text-orange-500">
                  {preset.maxDrawdown ? `-${preset.maxDrawdown.toFixed(1)}%` : '-'}
                </span>
              </div>
            </div>
          )}
          {preset.winRate === undefined && preset.totalReturn === undefined && (
            <p className="text-sm text-muted-foreground">
              백테스트를 실행하면 성과 지표가 표시됩니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>전략 삭제</DialogTitle>
            <DialogDescription>
              &apos;{preset.name}&apos; 전략을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
