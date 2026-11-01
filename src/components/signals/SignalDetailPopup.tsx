'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ConditionResultDisplay } from './ConditionResultDisplay';
import type { SignalWithDetails } from '@/lib/signals/types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SignalDetailPopupProps {
  signal: SignalWithDetails | null;
  strategyName?: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 매매신호 상세정보 팝업
 * 수식 중 만족한 부분을 붉은색으로 강조 표시
 */
export function SignalDetailPopup({
  signal,
  strategyName,
  isOpen,
  onClose,
}: SignalDetailPopupProps) {
  if (!signal) return null;

  const isBuy = signal.type === 'buy';
  const signalDate = new Date(signal.time);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBuy ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <span className={isBuy ? 'text-green-600' : 'text-red-600'}>
              {isBuy ? '매수' : '매도'} 신호
            </span>
            <Badge variant="outline" className="ml-auto font-normal">
              {signalDate.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 전략 이름 */}
          {strategyName && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">전략</span>
              <span className="font-medium">{strategyName}</span>
            </div>
          )}

          {/* 가격 정보 */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">신호 발생 가격</span>
            <span className="font-medium">
              {signal.price.toLocaleString()}원
            </span>
          </div>

          {/* 조건 상세 */}
          <div>
            <h4 className="text-sm font-medium mb-2">조건 평가 결과</h4>
            <div className="bg-muted rounded-md p-3 text-sm">
              <ConditionResultDisplay result={signal.conditionResult} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>만족</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <span>불만족</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
