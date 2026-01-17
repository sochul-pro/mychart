import type { OHLCV } from '@/types';
import type {
  Condition,
  SingleCondition,
  CrossoverCondition,
  LogicalCondition,
  Signal,
  SignalResult,
  TradingStrategy,
  IndicatorCache,
  SignalIndicator,
  ArithmeticExpression,
} from './types';
import {
  createIndicatorCache,
  getIndicatorValues,
  compare,
  calculateArithmetic,
  detectCrossover,
} from './conditions';

/**
 * 조건 평가
 * @param condition 평가할 조건
 * @param data OHLCV 데이터
 * @param index 평가할 인덱스
 * @param cache 지표 캐시
 * @returns 조건 충족 여부
 */
export function evaluateCondition(
  condition: Condition,
  data: OHLCV[],
  index: number,
  cache: IndicatorCache
): boolean {
  switch (condition.type) {
    case 'single':
      return evaluateSingleCondition(condition, data, index, cache);
    case 'crossover':
      return evaluateCrossoverCondition(condition, data, index, cache);
    case 'and':
      return evaluateAndCondition(condition, data, index, cache);
    case 'or':
      return evaluateOrCondition(condition, data, index, cache);
    default:
      return false;
  }
}

/**
 * 산술 표현식 평가
 */
function evaluateArithmeticExpression(
  expr: ArithmeticExpression,
  data: OHLCV[],
  index: number,
  cache: IndicatorCache
): number | null {
  // 좌항 값 구하기
  let leftVal: number | null;
  if (typeof expr.left === 'number') {
    leftVal = expr.left;
  } else {
    const leftValues = getIndicatorValues(data, expr.left, expr.leftParams, cache);
    leftVal = leftValues[index];
  }

  // 우항 값 구하기
  let rightVal: number | null;
  if (typeof expr.right === 'number') {
    rightVal = expr.right;
  } else {
    const rightValues = getIndicatorValues(data, expr.right, expr.rightParams, cache);
    rightVal = rightValues[index];
  }

  return calculateArithmetic(leftVal, expr.operator, rightVal);
}

/**
 * 지표 또는 산술 표현식의 값 구하기
 */
function getIndicatorOrExpressionValue(
  indicatorOrExpr: SignalIndicator | ArithmeticExpression,
  params: Record<string, number> | undefined,
  data: OHLCV[],
  index: number,
  cache: IndicatorCache
): number | null {
  if (typeof indicatorOrExpr === 'object' && indicatorOrExpr.type === 'arithmetic') {
    return evaluateArithmeticExpression(indicatorOrExpr, data, index, cache);
  }
  const values = getIndicatorValues(data, indicatorOrExpr as SignalIndicator, params, cache);
  return values[index];
}

/**
 * 단일 조건 평가
 */
function evaluateSingleCondition(
  condition: SingleCondition,
  data: OHLCV[],
  index: number,
  cache: IndicatorCache
): boolean {
  // indicator가 산술 표현식일 수 있음
  const value1 = getIndicatorOrExpressionValue(
    condition.indicator,
    condition.params,
    data,
    index,
    cache
  );

  // value가 숫자, 지표, 또는 산술 표현식일 수 있음
  let value2: number | null;
  if (typeof condition.value === 'number') {
    value2 = condition.value;
  } else if (typeof condition.value === 'object' && condition.value.type === 'arithmetic') {
    value2 = evaluateArithmeticExpression(condition.value, data, index, cache);
  } else {
    // 다른 지표와 비교 - valueParams가 있으면 사용, 없으면 params 사용
    const compareParams = condition.valueParams ?? condition.params;
    const compareValues = getIndicatorValues(data, condition.value as SignalIndicator, compareParams, cache);
    value2 = compareValues[index];
  }

  return compare(value1, condition.operator, value2);
}

/**
 * 크로스오버 조건 평가
 */
function evaluateCrossoverCondition(
  condition: CrossoverCondition,
  data: OHLCV[],
  index: number,
  cache: IndicatorCache
): boolean {
  if (index < 1) return false;

  const values1 = getIndicatorValues(data, condition.indicator1, condition.params1, cache);
  const values2 = getIndicatorValues(data, condition.indicator2, condition.params2, cache);

  const crossovers = detectCrossover(values1, values2, condition.direction);
  return crossovers[index];
}

/**
 * AND 조건 평가
 */
function evaluateAndCondition(
  condition: LogicalCondition,
  data: OHLCV[],
  index: number,
  cache: IndicatorCache
): boolean {
  return condition.conditions.every((c) => evaluateCondition(c, data, index, cache));
}

/**
 * OR 조건 평가
 */
function evaluateOrCondition(
  condition: LogicalCondition,
  data: OHLCV[],
  index: number,
  cache: IndicatorCache
): boolean {
  return condition.conditions.some((c) => evaluateCondition(c, data, index, cache));
}

/**
 * 전략에 따른 신호 생성
 * @param strategy 매매 전략
 * @param data OHLCV 데이터
 * @returns 신호 결과
 */
export function generateSignals(
  strategy: TradingStrategy,
  data: OHLCV[]
): SignalResult {
  const signals: Signal[] = [];
  const cache = createIndicatorCache();

  // 첫 번째 유효 인덱스 찾기 (충분한 데이터가 있어야 함)
  const startIndex = Math.max(1, 30); // 최소 30개 데이터 필요

  // 포지션 상태 추적
  let hasPosition = false;

  for (let i = startIndex; i < data.length; i++) {
    const buyConditionMet = evaluateCondition(strategy.buyCondition, data, i, cache);
    const sellConditionMet = evaluateCondition(strategy.sellCondition, data, i, cache);

    // 같은 날 매수/매도 조건이 모두 충족되면 신호 생성하지 않음
    if (buyConditionMet && sellConditionMet) {
      continue;
    }

    // 매수 조건 확인 (포지션이 없을 때만)
    if (buyConditionMet && !hasPosition) {
      signals.push({
        type: 'buy',
        time: data[i].time,
        price: data[i].close,
        reason: getConditionDescriptionWithValues(strategy.buyCondition, data, i, cache),
      });
      hasPosition = true;
    }

    // 매도 조건 확인 (포지션이 있을 때만)
    if (sellConditionMet && hasPosition) {
      signals.push({
        type: 'sell',
        time: data[i].time,
        price: data[i].close,
        reason: getConditionDescriptionWithValues(strategy.sellCondition, data, i, cache),
      });
      hasPosition = false;
    }
  }

  return {
    signals,
    buyCount: signals.filter((s) => s.type === 'buy').length,
    sellCount: signals.filter((s) => s.type === 'sell').length,
  };
}

/**
 * 조건 설명 생성 (실제 값 포함)
 */
function getConditionDescriptionWithValues(
  condition: Condition,
  data: OHLCV[],
  index: number,
  cache: IndicatorCache
): string {
  switch (condition.type) {
    case 'single': {
      const indicatorName = formatIndicatorOrExpression(condition.indicator, condition.params);
      const actualValue = getIndicatorOrExpressionValue(condition.indicator, condition.params, data, index, cache);
      const operator = formatOperator(condition.operator);

      let targetValue: string;
      let targetActual: number | null = null;
      if (typeof condition.value === 'number') {
        targetValue = condition.value.toString();
      } else if (typeof condition.value === 'object' && condition.value.type === 'arithmetic') {
        targetValue = formatArithmeticExpression(condition.value);
        targetActual = evaluateArithmeticExpression(condition.value, data, index, cache);
      } else {
        const compareParams = condition.valueParams ?? condition.params;
        targetValue = formatIndicator(condition.value as SignalIndicator, compareParams);
        const compareValues = getIndicatorValues(data, condition.value as SignalIndicator, compareParams, cache);
        targetActual = compareValues[index];
      }

      const actualStr = actualValue !== null ? formatNumber(actualValue) : 'N/A';
      if (targetActual !== null) {
        return `${indicatorName}(${actualStr}) ${operator} ${targetValue}(${formatNumber(targetActual)})`;
      }
      return `${indicatorName}(${actualStr}) ${operator} ${targetValue}`;
    }
    case 'crossover': {
      const ind1Name = formatIndicator(condition.indicator1, condition.params1);
      const ind2Name = formatIndicator(condition.indicator2, condition.params2);
      const values1 = getIndicatorValues(data, condition.indicator1, condition.params1, cache);
      const values2 = getIndicatorValues(data, condition.indicator2, condition.params2, cache);
      const val1 = values1[index];
      const val2 = values2[index];
      const direction = condition.direction === 'up' ? '상향돌파' : '하향돌파';
      return `${ind1Name}(${formatNumber(val1)})이(가) ${ind2Name}(${formatNumber(val2)})을(를) ${direction}`;
    }
    case 'and':
      return condition.conditions.map((c) => getConditionDescriptionWithValues(c, data, index, cache)).join(' AND ');
    case 'or': {
      // OR 조건의 경우 만족된 조건만 표시
      const satisfiedConditions = condition.conditions
        .filter((c) => evaluateCondition(c, data, index, cache))
        .map((c) => getConditionDescriptionWithValues(c, data, index, cache));
      if (satisfiedConditions.length > 0) {
        return satisfiedConditions.join(' OR ');
      }
      return condition.conditions.map((c) => getConditionDescriptionWithValues(c, data, index, cache)).join(' OR ');
    }
    default:
      return '';
  }
}

/**
 * 숫자 포맷 (천 단위 구분)
 */
function formatNumber(value: number | null): string {
  if (value === null) return 'N/A';
  if (Math.abs(value) >= 1000) {
    return value.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
  }
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
}

/**
 * 조건 설명 생성
 */
function getConditionDescription(condition: Condition): string {
  switch (condition.type) {
    case 'single': {
      const indicator = formatIndicatorOrExpression(condition.indicator, condition.params);
      const operator = formatOperator(condition.operator);
      let value: string;
      if (typeof condition.value === 'number') {
        value = condition.value.toString();
      } else if (typeof condition.value === 'object' && condition.value.type === 'arithmetic') {
        value = formatArithmeticExpression(condition.value);
      } else {
        value = formatIndicator(condition.value as SignalIndicator, condition.valueParams ?? condition.params);
      }
      return `${indicator} ${operator} ${value}`;
    }
    case 'crossover': {
      const ind1 = formatIndicator(condition.indicator1, condition.params1);
      const ind2 = formatIndicator(condition.indicator2, condition.params2);
      const direction = condition.direction === 'up' ? '상향돌파' : '하향돌파';
      return `${ind1}이(가) ${ind2}을(를) ${direction}`;
    }
    case 'and':
      return condition.conditions.map(getConditionDescription).join(' AND ');
    case 'or':
      return condition.conditions.map(getConditionDescription).join(' OR ');
    default:
      return '';
  }
}

/**
 * 산술 연산자 포맷
 */
function formatArithmeticOperator(op: string): string {
  const ops: Record<string, string> = {
    add: '+',
    sub: '-',
    mul: '×',
    div: '÷',
  };
  return ops[op] || op;
}

/**
 * 산술 표현식 포맷
 */
function formatArithmeticExpression(expr: ArithmeticExpression): string {
  const left = typeof expr.left === 'number'
    ? expr.left.toString()
    : formatIndicator(expr.left, expr.leftParams);
  const right = typeof expr.right === 'number'
    ? expr.right.toString()
    : formatIndicator(expr.right, expr.rightParams);
  const op = formatArithmeticOperator(expr.operator);
  return `${left} ${op} ${right}`;
}

/**
 * 지표 또는 산술 표현식 포맷
 */
function formatIndicatorOrExpression(
  indicatorOrExpr: SignalIndicator | ArithmeticExpression,
  params?: Record<string, number>
): string {
  if (typeof indicatorOrExpr === 'object' && indicatorOrExpr.type === 'arithmetic') {
    return formatArithmeticExpression(indicatorOrExpr);
  }
  return formatIndicator(indicatorOrExpr as SignalIndicator, params);
}

/**
 * 지표 이름 포맷
 */
function formatIndicator(indicator: SignalIndicator, params?: Record<string, number>): string {
  const period = params?.period;
  const names: Record<SignalIndicator, string> = {
    price: '종가',
    volume: '거래량',
    volume_ma: `거래량MA(${period || 20})`,
    high_n: period === 252 ? '52주 최고가' : `${period || 20}일 최고가`,
    low_n: period === 252 ? '52주 최저가' : `${period || 20}일 최저가`,
    sma: `SMA(${period || 20})`,
    ema: `EMA(${period || 20})`,
    rsi: `RSI(${params?.period || 14})`,
    macd: 'MACD',
    macd_signal: 'MACD Signal',
    macd_histogram: 'MACD Histogram',
    stochastic_k: '%K',
    stochastic_d: '%D',
    bollinger_upper: 'BB 상단',
    bollinger_middle: 'BB 중간',
    bollinger_lower: 'BB 하단',
  };
  return names[indicator] || indicator;
}

/**
 * 연산자 포맷
 */
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
