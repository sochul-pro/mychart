'use client';

import type {
  ConditionResult,
  SingleConditionResult,
  CrossoverConditionResult,
  LogicalConditionResult,
  SignalIndicator,
  ArithmeticExpression,
} from '@/lib/signals/types';
import { Check, X } from 'lucide-react';

// 스타일 상수 (Tailwind purge 문제 회피를 위해 인라인 스타일 사용)
const STYLES = {
  satisfied: {
    backgroundColor: '#fef2f2', // red-100
    color: '#b91c1c', // red-700
    fontWeight: 600,
  },
  unsatisfied: {
    backgroundColor: '#f3f4f6', // gray-100
    color: '#6b7280', // gray-500
    fontWeight: 400,
  },
  satisfiedText: { color: '#ef4444' }, // red-500
  unsatisfiedText: { color: '#9ca3af' }, // gray-400
  andLabel: {
    backgroundColor: '#dbeafe', // blue-100
    color: '#2563eb', // blue-600
  },
  orLabel: {
    backgroundColor: '#f3e8ff', // purple-100
    color: '#9333ea', // purple-600
  },
};

interface ConditionResultDisplayProps {
  result: ConditionResult;
  depth?: number;
}

/**
 * 조건 평가 결과를 시각적으로 표시하는 컴포넌트
 * 만족한 조건: 빨간색 + 볼드
 * 불만족 조건: 회색
 */
export function ConditionResultDisplay({
  result,
  depth = 0,
}: ConditionResultDisplayProps) {
  if (result.type === 'single') {
    return <SingleConditionResultView result={result} />;
  }

  if (result.type === 'crossover') {
    return <CrossoverConditionResultView result={result} />;
  }

  // 논리 조건 (AND/OR)
  return <LogicalConditionResultView result={result} depth={depth} />;
}

/**
 * 단일 조건 결과 표시
 */
function SingleConditionResultView({ result }: { result: SingleConditionResult }) {
  const { condition, satisfied, leftValue, rightValue } = result;

  const indicatorName = formatIndicatorOrExpression(condition.indicator, condition.params);
  const operator = formatOperator(condition.operator);
  const targetName = formatTargetValue(condition.value, condition.valueParams ?? condition.params);

  const containerStyle = satisfied ? STYLES.satisfied : STYLES.unsatisfied;
  const valueStyle = satisfied ? STYLES.satisfiedText : STYLES.unsatisfiedText;

  return (
    <div
      className="flex items-center gap-1.5 py-1 px-2 rounded"
      style={containerStyle}
    >
      <StatusIcon satisfied={satisfied} />
      <span>{indicatorName}</span>
      <span className="text-xs" style={valueStyle}>
        ({formatNumber(leftValue)})
      </span>
      <span className="mx-0.5">{operator}</span>
      <span>{targetName}</span>
      {typeof condition.value !== 'number' && (
        <span className="text-xs" style={valueStyle}>
          ({formatNumber(rightValue)})
        </span>
      )}
    </div>
  );
}

/**
 * 크로스오버 조건 결과 표시
 */
function CrossoverConditionResultView({
  result,
}: {
  result: CrossoverConditionResult;
}) {
  const { condition, satisfied, indicator1Value, indicator2Value } = result;

  const ind1Name = formatIndicator(condition.indicator1, condition.params1);
  const ind2Name = formatIndicator(condition.indicator2, condition.params2);
  const direction = condition.direction === 'up' ? '상향돌파' : '하향돌파';

  const containerStyle = satisfied ? STYLES.satisfied : STYLES.unsatisfied;
  const valueStyle = satisfied ? STYLES.satisfiedText : STYLES.unsatisfiedText;

  return (
    <div
      className="flex items-center gap-1.5 py-1 px-2 rounded"
      style={containerStyle}
    >
      <StatusIcon satisfied={satisfied} />
      <span>{ind1Name}</span>
      <span className="text-xs" style={valueStyle}>
        ({formatNumber(indicator1Value)})
      </span>
      <span className="mx-0.5">{direction}</span>
      <span>{ind2Name}</span>
      <span className="text-xs" style={valueStyle}>
        ({formatNumber(indicator2Value)})
      </span>
    </div>
  );
}

/**
 * 논리 조건 결과 표시 (재귀)
 */
function LogicalConditionResultView({
  result,
  depth,
}: {
  result: LogicalConditionResult;
  depth: number;
}) {
  const { type, satisfied, children } = result;
  const logicLabel = type.toUpperCase();
  const labelStyle = type === 'and' ? STYLES.andLabel : STYLES.orLabel;

  return (
    <div className="space-y-2" style={{ marginLeft: depth > 0 ? 12 : 0 }}>
      {children.map((child, idx) => (
        <div key={idx}>
          {idx > 0 && (
            <div
              className="text-xs font-bold my-2 px-2 py-0.5 rounded inline-block"
              style={labelStyle}
            >
              {logicLabel}
            </div>
          )}
          <ConditionResultDisplay result={child} depth={depth + 1} />
        </div>
      ))}
      {depth === 0 && (
        <div
          className="mt-3 pt-2 border-t text-sm font-medium"
          style={{ color: satisfied ? '#16a34a' : '#6b7280' }}
        >
          결과: {satisfied ? '✓ 조건 충족' : '✗ 조건 미충족'}
        </div>
      )}
    </div>
  );
}

/**
 * 상태 아이콘
 */
function StatusIcon({ satisfied }: { satisfied: boolean }) {
  if (satisfied) {
    return <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#dc2626' }} />;
  }
  return <X className="w-4 h-4 flex-shrink-0" style={{ color: '#9ca3af' }} />;
}

// ==========================================
// 포맷 유틸리티 함수들
// ==========================================

function formatNumber(value: number | null): string {
  if (value === null) return 'N/A';
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(value) >= 1000) {
    return value.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
  }
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
}

function formatOperator(operator: string): string {
  const ops: Record<string, string> = {
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    eq: '=',
  };
  return ops[operator] || operator;
}

function formatIndicator(
  indicator: SignalIndicator,
  params?: Record<string, number>
): string {
  const period = params?.period;
  const lag = params?.lag;
  const names: Record<SignalIndicator, string> = {
    price: '종가',
    volume: '거래량',
    volume_ma: `거래량MA(${period || 20})`,
    high_n: period === 252 ? '52주최고' : `${period || 20}일최고`,
    low_n: period === 252 ? '52주최저' : `${period || 20}일최저`,
    sma: `SMA(${period || 20})`,
    sma_lagged: `SMA(${period || 20}, ${lag || 1}일전)`,
    ema: `EMA(${period || 20})`,
    ema_lagged: `EMA(${period || 20}, ${lag || 1}일전)`,
    rsi: `RSI(${params?.period || 14})`,
    macd: 'MACD',
    macd_signal: 'Signal',
    macd_histogram: 'Histogram',
    stochastic_k: '%K',
    stochastic_d: '%D',
    bollinger_upper: 'BB상단',
    bollinger_middle: 'BB중간',
    bollinger_lower: 'BB하단',
  };
  return names[indicator] || indicator;
}

function formatArithmeticExpression(expr: ArithmeticExpression): string {
  const left =
    typeof expr.left === 'number'
      ? expr.left.toString()
      : formatIndicator(expr.left, expr.leftParams);
  const right =
    typeof expr.right === 'number'
      ? expr.right.toString()
      : formatIndicator(expr.right, expr.rightParams);
  const ops: Record<string, string> = {
    add: '+',
    sub: '-',
    mul: '×',
    div: '÷',
  };
  const op = ops[expr.operator] || expr.operator;
  return `${left}${op}${right}`;
}

function formatIndicatorOrExpression(
  indicatorOrExpr: SignalIndicator | ArithmeticExpression,
  params?: Record<string, number>
): string {
  if (typeof indicatorOrExpr === 'object' && indicatorOrExpr.type === 'arithmetic') {
    return formatArithmeticExpression(indicatorOrExpr);
  }
  return formatIndicator(indicatorOrExpr as SignalIndicator, params);
}

function formatTargetValue(
  value: number | SignalIndicator | ArithmeticExpression,
  params?: Record<string, number>
): string {
  if (typeof value === 'number') {
    return formatNumber(value);
  }
  if (typeof value === 'object' && value.type === 'arithmetic') {
    return formatArithmeticExpression(value);
  }
  return formatIndicator(value as SignalIndicator, params);
}
