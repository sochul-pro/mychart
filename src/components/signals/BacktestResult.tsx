'use client';

import type { SignalResult, Signal } from '@/lib/signals/types';

export interface BacktestResultProps {
  /** 신호 결과 */
  result: SignalResult | null;
  /** 클래스명 */
  className?: string;
}

/**
 * 백테스트 결과 표시 컴포넌트
 */
export function BacktestResult({ result, className = '' }: BacktestResultProps) {
  if (!result) {
    return (
      <div className={`rounded-lg border bg-gray-50 p-4 ${className}`}>
        <p className="text-center text-sm text-gray-500">
          전략을 선택하면 백테스트 결과가 표시됩니다.
        </p>
      </div>
    );
  }

  const { signals, buyCount, sellCount } = result;

  // 최근 10개 신호만 표시
  const recentSignals = signals.slice(-10).reverse();

  return (
    <div className={`rounded-lg border bg-white p-4 ${className}`} data-testid="backtest-result">
      <h3 className="mb-3 text-sm font-semibold text-gray-800">백테스트 결과</h3>

      {/* 요약 통계 */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded bg-gray-50 p-2 text-center">
          <p className="text-xs text-gray-500">총 신호</p>
          <p className="text-lg font-bold text-gray-900">{signals.length}</p>
        </div>
        <div className="rounded bg-green-50 p-2 text-center">
          <p className="text-xs text-green-600">매수</p>
          <p className="text-lg font-bold text-green-700">{buyCount}</p>
        </div>
        <div className="rounded bg-red-50 p-2 text-center">
          <p className="text-xs text-red-600">매도</p>
          <p className="text-lg font-bold text-red-700">{sellCount}</p>
        </div>
      </div>

      {/* 최근 신호 목록 */}
      {recentSignals.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-gray-700">최근 신호</h4>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {recentSignals.map((signal, index) => (
              <SignalItem key={index} signal={signal} />
            ))}
          </div>
        </div>
      )}

      {signals.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          해당 기간에 발생한 신호가 없습니다.
        </p>
      )}
    </div>
  );
}

/** 신호 아이템 */
function SignalItem({ signal }: { signal: Signal }) {
  const isBuy = signal.type === 'buy';
  const date = new Date(signal.time);
  const dateStr = date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className={`flex items-center justify-between rounded p-2 text-xs ${
        isBuy ? 'bg-green-50' : 'bg-red-50'
      }`}
      data-testid={`signal-item-${signal.type}`}
    >
      <div className="flex items-center gap-2">
        <span className={`font-bold ${isBuy ? 'text-green-600' : 'text-red-600'}`}>
          {isBuy ? '▲ 매수' : '▼ 매도'}
        </span>
        <span className="text-gray-500">{dateStr}</span>
      </div>
      <span className="font-medium text-gray-900">{signal.price.toLocaleString()}원</span>
    </div>
  );
}

export default BacktestResult;
