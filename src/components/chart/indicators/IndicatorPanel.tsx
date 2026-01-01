'use client';

import { useState } from 'react';
import type { IndicatorConfig, IndicatorType } from './types';
import { DEFAULT_INDICATOR_CONFIGS } from './types';

export interface IndicatorPanelProps {
  /** 현재 활성화된 지표들 */
  indicators: IndicatorConfig[];
  /** 지표 변경 콜백 */
  onIndicatorsChange: (indicators: IndicatorConfig[]) => void;
  /** 클래스명 */
  className?: string;
}

const INDICATOR_LABELS: Record<IndicatorType, string> = {
  sma: 'SMA',
  ema: 'EMA',
  bollinger: '볼린저밴드',
  rsi: 'RSI',
  macd: 'MACD',
  stochastic: '스토캐스틱',
  obv: 'OBV',
  atr: 'ATR',
};

const INDICATOR_DESCRIPTIONS: Record<IndicatorType, string> = {
  sma: '단순 이동평균',
  ema: '지수 이동평균',
  bollinger: '볼린저밴드 (상단/중간/하단)',
  rsi: '상대강도지수',
  macd: '이동평균 수렴·확산',
  stochastic: '스토캐스틱 오실레이터',
  obv: '거래량 균형',
  atr: '평균 실제 범위',
};

/**
 * 지표 토글 및 설정 패널
 */
export function IndicatorPanel({
  indicators,
  onIndicatorsChange,
  className = '',
}: IndicatorPanelProps) {
  const [expanded, setExpanded] = useState<IndicatorType | null>(null);

  // 지표 토글
  const toggleIndicator = (type: IndicatorType) => {
    const existingIndex = indicators.findIndex((i) => i.type === type);

    if (existingIndex >= 0) {
      // 이미 있으면 enabled 토글
      const updated = [...indicators];
      updated[existingIndex] = {
        ...updated[existingIndex],
        enabled: !updated[existingIndex].enabled,
      };
      onIndicatorsChange(updated);
    } else {
      // 없으면 기본값으로 추가
      const newIndicator = { ...DEFAULT_INDICATOR_CONFIGS[type], enabled: true };
      onIndicatorsChange([...indicators, newIndicator]);
    }
  };

  // 지표 설정 업데이트
  const updateIndicator = (type: IndicatorType, updates: Partial<IndicatorConfig>) => {
    const updated = indicators.map((i) =>
      i.type === type ? ({ ...i, ...updates } as IndicatorConfig) : i
    );
    onIndicatorsChange(updated);
  };

  // 지표가 활성화되어 있는지 확인
  const isEnabled = (type: IndicatorType) =>
    indicators.find((i) => i.type === type)?.enabled ?? false;

  // 지표 설정값 가져오기
  const getConfig = (type: IndicatorType) =>
    indicators.find((i) => i.type === type) ?? DEFAULT_INDICATOR_CONFIGS[type];

  return (
    <div className={`rounded-lg border bg-white p-4 ${className}`}>
      <h3 className="mb-3 text-sm font-semibold text-gray-800">기술적 지표</h3>

      <div className="space-y-2">
        {(Object.keys(INDICATOR_LABELS) as IndicatorType[]).map((type) => (
          <div key={type} className="rounded border bg-gray-50 p-2">
            {/* 토글 헤더 */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleIndicator(type)}
                className="flex items-center gap-2"
                data-testid={`toggle-${type}`}
              >
                <div
                  className={`h-4 w-4 rounded border-2 ${
                    isEnabled(type)
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isEnabled(type) && (
                    <svg className="h-full w-full text-white" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">{INDICATOR_LABELS[type]}</span>
              </button>

              <button
                onClick={() => setExpanded(expanded === type ? null : type)}
                className="text-gray-500 hover:text-gray-700"
                data-testid={`expand-${type}`}
              >
                <svg
                  className={`h-4 w-4 transition-transform ${expanded === type ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* 확장된 설정 */}
            {expanded === type && (
              <div className="mt-2 space-y-2 border-t pt-2">
                <p className="text-xs text-gray-500">{INDICATOR_DESCRIPTIONS[type]}</p>
                <IndicatorSettings
                  config={getConfig(type)}
                  onChange={(updates) => updateIndicator(type, updates)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** 지표별 설정 컴포넌트 */
function IndicatorSettings({
  config,
  onChange,
}: {
  config: IndicatorConfig;
  onChange: (updates: Partial<IndicatorConfig>) => void;
}) {
  switch (config.type) {
    case 'sma':
    case 'ema':
      return (
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">기간:</label>
          <input
            type="number"
            value={config.period}
            onChange={(e) => onChange({ period: parseInt(e.target.value) || 20 })}
            className="w-16 rounded border px-2 py-1 text-xs"
            min={1}
            max={200}
          />
        </div>
      );

    case 'bollinger':
      return (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">기간:</label>
            <input
              type="number"
              value={config.period}
              onChange={(e) => onChange({ period: parseInt(e.target.value) || 20 })}
              className="w-16 rounded border px-2 py-1 text-xs"
              min={1}
              max={200}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">표준편차:</label>
            <input
              type="number"
              value={config.stdDev}
              onChange={(e) => onChange({ stdDev: parseFloat(e.target.value) || 2 })}
              className="w-16 rounded border px-2 py-1 text-xs"
              min={0.5}
              max={5}
              step={0.5}
            />
          </div>
        </div>
      );

    case 'rsi':
      return (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">기간:</label>
            <input
              type="number"
              value={config.period}
              onChange={(e) => onChange({ period: parseInt(e.target.value) || 14 })}
              className="w-16 rounded border px-2 py-1 text-xs"
              min={1}
              max={100}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">과매수:</label>
            <input
              type="number"
              value={config.overbought}
              onChange={(e) => onChange({ overbought: parseInt(e.target.value) || 70 })}
              className="w-16 rounded border px-2 py-1 text-xs"
              min={50}
              max={100}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">과매도:</label>
            <input
              type="number"
              value={config.oversold}
              onChange={(e) => onChange({ oversold: parseInt(e.target.value) || 30 })}
              className="w-16 rounded border px-2 py-1 text-xs"
              min={0}
              max={50}
            />
          </div>
        </div>
      );

    case 'macd':
      return (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Fast:</label>
            <input
              type="number"
              value={config.fastPeriod}
              onChange={(e) => onChange({ fastPeriod: parseInt(e.target.value) || 12 })}
              className="w-14 rounded border px-2 py-1 text-xs"
              min={1}
              max={50}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Slow:</label>
            <input
              type="number"
              value={config.slowPeriod}
              onChange={(e) => onChange({ slowPeriod: parseInt(e.target.value) || 26 })}
              className="w-14 rounded border px-2 py-1 text-xs"
              min={1}
              max={100}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Signal:</label>
            <input
              type="number"
              value={config.signalPeriod}
              onChange={(e) => onChange({ signalPeriod: parseInt(e.target.value) || 9 })}
              className="w-14 rounded border px-2 py-1 text-xs"
              min={1}
              max={50}
            />
          </div>
        </div>
      );

    case 'stochastic':
      return (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">%K:</label>
            <input
              type="number"
              value={config.kPeriod}
              onChange={(e) => onChange({ kPeriod: parseInt(e.target.value) || 14 })}
              className="w-14 rounded border px-2 py-1 text-xs"
              min={1}
              max={50}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">%D:</label>
            <input
              type="number"
              value={config.dPeriod}
              onChange={(e) => onChange({ dPeriod: parseInt(e.target.value) || 3 })}
              className="w-14 rounded border px-2 py-1 text-xs"
              min={1}
              max={20}
            />
          </div>
        </div>
      );

    case 'atr':
      return (
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">기간:</label>
          <input
            type="number"
            value={config.period}
            onChange={(e) => onChange({ period: parseInt(e.target.value) || 14 })}
            className="w-16 rounded border px-2 py-1 text-xs"
            min={1}
            max={100}
          />
        </div>
      );

    case 'obv':
    default:
      return null;
  }
}

export default IndicatorPanel;
