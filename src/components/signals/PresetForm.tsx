'use client';

import { useState } from 'react';
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
  const [name, setName] = useState(preset?.name || '');
  const [description, setDescription] = useState(preset?.description || '');
  const [buyCondition, setBuyCondition] = useState<Condition>(
    preset?.buyRules || defaultBuyCondition
  );
  const [sellCondition, setSellCondition] = useState<Condition>(
    preset?.sellRules || defaultSellCondition
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

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
      // 폼 초기화
      setName('');
      setDescription('');
      setBuyCondition(defaultBuyCondition);
      setSellCondition(defaultSellCondition);
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
            <Label>매매 조건</Label>
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
                <ConditionBuilder
                  condition={buyCondition}
                  onConditionChange={setBuyCondition}
                  label="매수 조건"
                />
              </TabsContent>
              <TabsContent value="sell" className="border rounded-md p-4 mt-2">
                <ConditionBuilder
                  condition={sellCondition}
                  onConditionChange={setSellCondition}
                  label="매도 조건"
                />
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
