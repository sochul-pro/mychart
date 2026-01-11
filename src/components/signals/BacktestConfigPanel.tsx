'use client';

import { Calendar, Settings2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { BacktestConfig } from '@/lib/signals/types';

interface BacktestConfigPanelProps {
  config: BacktestConfig;
  onChange: (config: Partial<BacktestConfig>) => void;
}

export function BacktestConfigPanel({ config, onChange }: BacktestConfigPanelProps) {
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-4">
      {/* 기간 설정 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            시작일
          </Label>
          <Input
            type="date"
            value={formatDateForInput(config.startDate)}
            onChange={(e) => onChange({ startDate: new Date(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            종료일
          </Label>
          <Input
            type="date"
            value={formatDateForInput(config.endDate)}
            onChange={(e) => onChange({ endDate: new Date(e.target.value) })}
          />
        </div>
      </div>

      {/* 빠른 기간 선택 */}
      <div className="flex gap-2">
        {[
          { label: '1개월', months: 1 },
          { label: '3개월', months: 3 },
          { label: '6개월', months: 6 },
          { label: '1년', months: 12 },
          { label: '2년', months: 24 },
          { label: '3년', months: 36 },
        ].map(({ label, months }) => {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - months);

          return (
            <Button
              key={label}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onChange({ startDate, endDate })}
            >
              {label}
            </Button>
          );
        })}
      </div>

      {/* 상세 설정 (접이식) */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Settings2 className="h-4 w-4 mr-2" />
            상세 설정
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          {/* 초기 자본 */}
          <div className="space-y-2">
            <Label className="text-sm">초기 자본 (원)</Label>
            <Input
              type="number"
              value={config.initialCapital}
              onChange={(e) => onChange({ initialCapital: Number(e.target.value) })}
              step={1000000}
              min={1000000}
            />
          </div>

          {/* 수수료 & 슬리피지 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">수수료 (%)</Label>
              <Input
                type="number"
                value={config.commission}
                onChange={(e) => onChange({ commission: Number(e.target.value) })}
                step={0.001}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">슬리피지 (%)</Label>
              <Input
                type="number"
                value={config.slippage}
                onChange={(e) => onChange({ slippage: Number(e.target.value) })}
                step={0.01}
                min={0}
              />
            </div>
          </div>

          {/* 포지션 사이징 */}
          <div className="space-y-2">
            <Label className="text-sm">포지션 크기 ({config.positionSizing === 'percent' ? '%' : '원'})</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={config.positionSize}
                onChange={(e) => onChange({ positionSize: Number(e.target.value) })}
                className="flex-1"
              />
              <Button
                variant={config.positionSizing === 'percent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange({ positionSizing: 'percent' })}
              >
                %
              </Button>
              <Button
                variant={config.positionSizing === 'fixed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange({ positionSizing: 'fixed' })}
              >
                고정
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
