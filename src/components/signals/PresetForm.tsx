'use client';

import { useState, useEffect } from 'react';
import { Blocks, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConditionBuilder } from './ConditionBuilder';
import { FormulaEditor } from './FormulaEditor';
import { cn } from '@/lib/utils';
import type { Condition, SignalPresetWithStats } from '@/lib/signals/types';

interface PresetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset?: SignalPresetWithStats | null;
  onSubmit: (data: {
    name: string;
    description?: string;
    buyRules: Condition;
    sellRules: Condition;
  }) => Promise<void>;
}

const defaultBuyCondition: Condition = {
  type: 'single',
  indicator: 'rsi',
  operator: 'lte',
  value: 30,
  params: { period: 14 },
};

const defaultSellCondition: Condition = {
  type: 'single',
  indicator: 'rsi',
  operator: 'gte',
  value: 70,
  params: { period: 14 },
};

export function PresetForm({ open, onOpenChange, preset, onSubmit }: PresetFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [buyCondition, setBuyCondition] = useState<Condition>(defaultBuyCondition);
  const [sellCondition, setSellCondition] = useState<Condition>(defaultSellCondition);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [editMode, setEditMode] = useState<'builder' | 'formula'>('builder');

  // preset이 변경되거나 다이얼로그가 열릴 때 폼 상태 동기화
  useEffect(() => {
    if (open) {
      setName(preset?.name || '');
      setDescription(preset?.description || '');
      setBuyCondition(preset?.buyRules || defaultBuyCondition);
      setSellCondition(preset?.sellRules || defaultSellCondition);
      setActiveTab('buy');
    }
  }, [open, preset]);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        buyRules: buyCondition,
        sellRules: sellCondition,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEdit = !!preset;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? '전략 수정' : '새 전략 만들기'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? '매매 전략의 이름과 조건을 수정합니다.'
              : '매수/매도 조건을 설정하여 나만의 매매 전략을 만듭니다.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 기본 정보 */}
          <div className="space-y-2">
            <Label htmlFor="name">전략 이름 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 나의 RSI 전략"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명 (선택)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="전략에 대한 간단한 설명을 입력하세요"
              rows={2}
              maxLength={500}
            />
          </div>

          {/* 매수/매도 조건 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>매매 조건</Label>
              {/* 편집 모드 전환 */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <button
                  type="button"
                  onClick={() => setEditMode('builder')}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                    editMode === 'builder'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Blocks className="h-3 w-3" />
                  UI 빌더
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode('formula')}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                    editMode === 'formula'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Code2 className="h-3 w-3" />
                  수식
                </button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buy' | 'sell')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy" className="text-green-600 data-[state=active]:text-green-600">
                  매수 조건
                </TabsTrigger>
                <TabsTrigger value="sell" className="text-red-600 data-[state=active]:text-red-600">
                  매도 조건
                </TabsTrigger>
              </TabsList>

              <TabsContent value="buy" className="border rounded-md p-4 mt-2">
                {editMode === 'builder' ? (
                  <ConditionBuilder
                    condition={buyCondition}
                    onConditionChange={setBuyCondition}
                    label="매수 조건"
                  />
                ) : (
                  <FormulaEditor
                    label="매수 조건"
                    condition={buyCondition}
                    onConditionChange={setBuyCondition}
                    placeholder="RSI(14) < 30 AND SMA(20) cross_above SMA(60)"
                  />
                )}
              </TabsContent>

              <TabsContent value="sell" className="border rounded-md p-4 mt-2">
                {editMode === 'builder' ? (
                  <ConditionBuilder
                    condition={sellCondition}
                    onConditionChange={setSellCondition}
                    label="매도 조건"
                  />
                ) : (
                  <FormulaEditor
                    label="매도 조건"
                    condition={sellCondition}
                    onConditionChange={setSellCondition}
                    placeholder="RSI(14) > 70 OR SMA(20) cross_below SMA(60)"
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? '저장 중...' : isEdit ? '수정' : '생성'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
