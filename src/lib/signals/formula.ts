/**
 * 수식 편집기 - 파서 및 생성기
 *
 * 지원하는 수식 문법:
 * - 단일 조건: RSI(14) < 30, SMA(20) > SMA(60), Price > 10000
 * - 크로스오버: SMA(5) cross_above SMA(20), MACD cross_below Signal
 * - 논리 연산: AND, OR (대소문자 무관)
 * - 괄호: (RSI(14) < 30 OR MACD cross_above Signal) AND Volume > 1000000
 *
 * 지표 목록:
 * - Price, Volume
 * - SMA(period), EMA(period)
 * - RSI(period)
 * - MACD, MACD_Signal, MACD_Histogram (또는 MACD(fast,slow,signal))
 * - Stochastic_K(k,d), Stochastic_D(k,d)
 * - Bollinger_Upper(period,stdDev), Bollinger_Middle, Bollinger_Lower
 * - Volume_MA(period)
 */

import type {
  Condition,
  SingleCondition,
  CrossoverCondition,
  LogicalCondition,
  SignalIndicator,
  ComparisonOperator,
  ArithmeticOperator,
  ArithmeticExpression,
} from './types';

// ========== 수식 생성기 (Condition → 문자열) ==========

/**
 * 지표를 수식 문자열로 변환
 */
function indicatorToString(
  indicator: SignalIndicator,
  params?: Record<string, number>
): string {
  switch (indicator) {
    case 'price':
      return 'Price';
    case 'volume':
      return 'Volume';
    case 'volume_ma':
      return `Volume_MA(${params?.period ?? 20})`;
    case 'high_n':
      return params?.period === 252 ? 'High_52W' : `High(${params?.period ?? 20})`;
    case 'low_n':
      return params?.period === 252 ? 'Low_52W' : `Low(${params?.period ?? 20})`;
    case 'sma':
      return `SMA(${params?.period ?? 20})`;
    case 'ema':
      return `EMA(${params?.period ?? 20})`;
    case 'rsi':
      return `RSI(${params?.period ?? 14})`;
    case 'macd':
      return 'MACD';
    case 'macd_signal':
      return 'MACD_Signal';
    case 'macd_histogram':
      return 'MACD_Histogram';
    case 'stochastic_k':
      return `Stochastic_K(${params?.kPeriod ?? 14},${params?.dPeriod ?? 3})`;
    case 'stochastic_d':
      return `Stochastic_D(${params?.kPeriod ?? 14},${params?.dPeriod ?? 3})`;
    case 'bollinger_upper':
      return `Bollinger_Upper(${params?.period ?? 20},${params?.stdDev ?? 2})`;
    case 'bollinger_middle':
      return `Bollinger_Middle(${params?.period ?? 20})`;
    case 'bollinger_lower':
      return `Bollinger_Lower(${params?.period ?? 20},${params?.stdDev ?? 2})`;
    default:
      return indicator;
  }
}

/**
 * 산술 연산자를 문자열로 변환
 */
function arithmeticOperatorToString(op: ArithmeticOperator): string {
  switch (op) {
    case 'add':
      return '+';
    case 'sub':
      return '-';
    case 'mul':
      return '*';
    case 'div':
      return '/';
    default:
      return op;
  }
}

/**
 * 산술 표현식을 수식 문자열로 변환
 */
function arithmeticExpressionToString(expr: ArithmeticExpression): string {
  let leftStr: string;
  if (typeof expr.left === 'number') {
    leftStr = expr.left.toString();
  } else {
    leftStr = indicatorToString(expr.left, expr.leftParams);
  }

  let rightStr: string;
  if (typeof expr.right === 'number') {
    rightStr = expr.right.toString();
  } else {
    rightStr = indicatorToString(expr.right, expr.rightParams);
  }

  const op = arithmeticOperatorToString(expr.operator);
  return `${leftStr} ${op} ${rightStr}`;
}

/**
 * 지표 또는 산술 표현식을 문자열로 변환
 */
function indicatorOrExprToString(
  value: SignalIndicator | ArithmeticExpression,
  params?: Record<string, number>
): string {
  if (typeof value === 'object' && value.type === 'arithmetic') {
    return arithmeticExpressionToString(value);
  }
  return indicatorToString(value as SignalIndicator, params);
}

/**
 * 비교 연산자를 문자열로 변환
 */
function operatorToString(op: ComparisonOperator): string {
  switch (op) {
    case 'gt':
      return '>';
    case 'gte':
      return '>=';
    case 'lt':
      return '<';
    case 'lte':
      return '<=';
    case 'eq':
      return '==';
    default:
      return op;
  }
}

/**
 * 단일 조건을 수식 문자열로 변환
 */
function singleConditionToFormula(condition: SingleCondition): string {
  // indicator가 산술 표현식인 경우
  const indicator = indicatorOrExprToString(condition.indicator, condition.params);
  const op = operatorToString(condition.operator);

  let value: string;
  if (typeof condition.value === 'number') {
    value = condition.value.toString();
  } else if (typeof condition.value === 'object' && condition.value.type === 'arithmetic') {
    // value가 산술 표현식인 경우
    value = arithmeticExpressionToString(condition.value);
  } else {
    // 다른 지표와 비교 - valueParams가 있으면 사용
    const valueIndicatorParams = condition.valueParams ?? condition.params;
    value = indicatorToString(condition.value as SignalIndicator, valueIndicatorParams);
  }

  return `${indicator} ${op} ${value}`;
}

/**
 * 크로스오버 조건을 수식 문자열로 변환
 */
function crossoverConditionToFormula(condition: CrossoverCondition): string {
  const ind1 = indicatorToString(condition.indicator1, condition.params1);
  const ind2 = indicatorToString(condition.indicator2, condition.params2);
  const crossOp = condition.direction === 'up' ? 'cross_above' : 'cross_below';

  return `${ind1} ${crossOp} ${ind2}`;
}

/**
 * Condition 객체를 수식 문자열로 변환
 */
export function conditionToFormula(condition: Condition, wrapInParens = false): string {
  if (condition.type === 'single') {
    return singleConditionToFormula(condition as SingleCondition);
  }

  if (condition.type === 'crossover') {
    return crossoverConditionToFormula(condition as CrossoverCondition);
  }

  if (condition.type === 'and' || condition.type === 'or') {
    const logical = condition as LogicalCondition;
    const op = condition.type === 'and' ? ' AND ' : ' OR ';
    const parts = logical.conditions.map((c) => {
      // 중첩된 논리 조건은 괄호로 감싸기
      const needsParens = (c.type === 'and' || c.type === 'or') && c.type !== condition.type;
      return conditionToFormula(c, needsParens);
    });
    const result = parts.join(op);
    return wrapInParens ? `(${result})` : result;
  }

  return '';
}

// ========== 수식 파서 (문자열 → Condition) ==========

interface Token {
  type: 'INDICATOR' | 'NUMBER' | 'OPERATOR' | 'COMPARISON' | 'CROSS' | 'ARITHMETIC' | 'LPAREN' | 'RPAREN' | 'AND' | 'OR';
  value: string;
  params?: Record<string, number>;
}

/**
 * 수식 문자열을 토큰으로 분리
 */
function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const input = formula.trim();

  while (i < input.length) {
    // 공백 건너뛰기
    if (/\s/.test(input[i])) {
      i++;
      continue;
    }

    // 괄호
    if (input[i] === '(') {
      // 지표 뒤의 파라미터 괄호인지 확인
      if (tokens.length > 0 && tokens[tokens.length - 1].type === 'INDICATOR') {
        // 파라미터 파싱
        const start = i + 1;
        let depth = 1;
        i++;
        while (i < input.length && depth > 0) {
          if (input[i] === '(') depth++;
          if (input[i] === ')') depth--;
          i++;
        }
        const paramsStr = input.slice(start, i - 1);
        const paramValues = paramsStr.split(',').map((p) => parseFloat(p.trim()));

        // 지표에 따라 파라미터 설정
        const lastToken = tokens[tokens.length - 1];
        const indicatorName = lastToken.value.toUpperCase();

        if (['SMA', 'EMA', 'RSI', 'VOLUME_MA', 'HIGH', 'HIGH_N', 'LOW', 'LOW_N'].includes(indicatorName)) {
          lastToken.params = { period: paramValues[0] || 20 };
        } else if (indicatorName === 'MACD') {
          lastToken.params = {
            fast: paramValues[0] || 12,
            slow: paramValues[1] || 26,
            signal: paramValues[2] || 9,
          };
        } else if (['STOCHASTIC_K', 'STOCHASTIC_D'].includes(indicatorName)) {
          lastToken.params = {
            kPeriod: paramValues[0] || 14,
            dPeriod: paramValues[1] || 3,
          };
        } else if (['BOLLINGER_UPPER', 'BOLLINGER_MIDDLE', 'BOLLINGER_LOWER'].includes(indicatorName)) {
          lastToken.params = {
            period: paramValues[0] || 20,
            stdDev: paramValues[1] || 2,
          };
        }
        continue;
      }
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (input[i] === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    // 산술 연산자 (*, /)
    if (input[i] === '*' || input[i] === '/') {
      tokens.push({ type: 'ARITHMETIC', value: input[i] });
      i++;
      continue;
    }

    // 비교 연산자
    if (input.slice(i, i + 2) === '>=') {
      tokens.push({ type: 'COMPARISON', value: '>=' });
      i += 2;
      continue;
    }
    if (input.slice(i, i + 2) === '<=') {
      tokens.push({ type: 'COMPARISON', value: '<=' });
      i += 2;
      continue;
    }
    if (input.slice(i, i + 2) === '==') {
      tokens.push({ type: 'COMPARISON', value: '==' });
      i += 2;
      continue;
    }
    if (input[i] === '>') {
      tokens.push({ type: 'COMPARISON', value: '>' });
      i++;
      continue;
    }
    if (input[i] === '<') {
      tokens.push({ type: 'COMPARISON', value: '<' });
      i++;
      continue;
    }

    // 크로스오버 연산자
    const crossAboveMatch = input.slice(i).match(/^cross_above/i);
    if (crossAboveMatch) {
      tokens.push({ type: 'CROSS', value: 'cross_above' });
      i += crossAboveMatch[0].length;
      continue;
    }
    const crossBelowMatch = input.slice(i).match(/^cross_below/i);
    if (crossBelowMatch) {
      tokens.push({ type: 'CROSS', value: 'cross_below' });
      i += crossBelowMatch[0].length;
      continue;
    }

    // 논리 연산자
    const andMatch = input.slice(i).match(/^AND\b/i);
    if (andMatch) {
      tokens.push({ type: 'AND', value: 'AND' });
      i += andMatch[0].length;
      continue;
    }
    const orMatch = input.slice(i).match(/^OR\b/i);
    if (orMatch) {
      tokens.push({ type: 'OR', value: 'OR' });
      i += orMatch[0].length;
      continue;
    }

    // 숫자
    const numMatch = input.slice(i).match(/^-?\d+(\.\d+)?/);
    if (numMatch) {
      tokens.push({ type: 'NUMBER', value: numMatch[0] });
      i += numMatch[0].length;
      continue;
    }

    // 지표 이름 (알파벳, 숫자, 언더스코어)
    const identMatch = input.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (identMatch) {
      const indicatorName = identMatch[0].toUpperCase();
      const token: Token = { type: 'INDICATOR', value: identMatch[0] };
      // HIGH_52W, LOW_52W는 자동으로 period=252 설정
      if (indicatorName === 'HIGH_52W') {
        token.params = { period: 252 };
      } else if (indicatorName === 'LOW_52W') {
        token.params = { period: 252 };
      }
      tokens.push(token);
      i += identMatch[0].length;
      continue;
    }

    // 알 수 없는 문자는 건너뛰기
    i++;
  }

  return tokens;
}

/**
 * 지표 이름을 SignalIndicator 타입으로 변환
 */
function parseIndicatorName(name: string): SignalIndicator {
  const upper = name.toUpperCase();
  const mapping: Record<string, SignalIndicator> = {
    'PRICE': 'price',
    'CLOSE': 'price',
    'VOLUME': 'volume',
    'SMA': 'sma',
    'EMA': 'ema',
    'RSI': 'rsi',
    'MACD': 'macd',
    'MACD_SIGNAL': 'macd_signal',
    'SIGNAL': 'macd_signal',
    'MACD_HISTOGRAM': 'macd_histogram',
    'HISTOGRAM': 'macd_histogram',
    'STOCHASTIC_K': 'stochastic_k',
    'STOCH_K': 'stochastic_k',
    'STOCHASTIC_D': 'stochastic_d',
    'STOCH_D': 'stochastic_d',
    'BOLLINGER_UPPER': 'bollinger_upper',
    'BB_UPPER': 'bollinger_upper',
    'BOLLINGER_MIDDLE': 'bollinger_middle',
    'BB_MIDDLE': 'bollinger_middle',
    'BOLLINGER_LOWER': 'bollinger_lower',
    'BB_LOWER': 'bollinger_lower',
    'VOLUME_MA': 'volume_ma',
    'VOL_MA': 'volume_ma',
    'HIGH': 'high_n',
    'HIGH_N': 'high_n',
    'HIGH_52W': 'high_n',
    'LOW': 'low_n',
    'LOW_N': 'low_n',
    'LOW_52W': 'low_n',
  };
  return mapping[upper] || 'price';
}

/**
 * 비교 연산자를 ComparisonOperator로 변환
 */
function parseComparisonOperator(op: string): ComparisonOperator {
  switch (op) {
    case '>':
      return 'gt';
    case '>=':
      return 'gte';
    case '<':
      return 'lt';
    case '<=':
      return 'lte';
    case '==':
      return 'eq';
    default:
      return 'gt';
  }
}

/**
 * 산술 연산자 문자열을 ArithmeticOperator로 변환
 */
function parseArithmeticOperator(op: string): ArithmeticOperator {
  switch (op) {
    case '+':
      return 'add';
    case '-':
      return 'sub';
    case '*':
      return 'mul';
    case '/':
      return 'div';
    default:
      return 'mul';
  }
}

// 파서 클래스
class FormulaParser {
  private tokens: Token[];
  private pos: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  private peek(): Token | null {
    return this.tokens[this.pos] || null;
  }

  private consume(): Token | null {
    return this.tokens[this.pos++] || null;
  }

  private expect(type: Token['type']): Token {
    const token = this.consume();
    if (!token || token.type !== type) {
      throw new Error(`Expected ${type}, got ${token?.type || 'EOF'}`);
    }
    return token;
  }

  /**
   * 최상위 파싱: OR 연산
   */
  parse(): Condition {
    return this.parseOr();
  }

  /**
   * OR 연산 파싱
   */
  private parseOr(): Condition {
    let left = this.parseAnd();

    while (this.peek()?.type === 'OR') {
      this.consume(); // OR
      const right = this.parseAnd();

      // 기존이 OR이면 조건 추가, 아니면 새 OR 생성
      if (left.type === 'or') {
        (left as LogicalCondition).conditions.push(right);
      } else {
        left = {
          type: 'or',
          conditions: [left, right],
        };
      }
    }

    return left;
  }

  /**
   * AND 연산 파싱
   */
  private parseAnd(): Condition {
    let left = this.parsePrimary();

    while (this.peek()?.type === 'AND') {
      this.consume(); // AND
      const right = this.parsePrimary();

      // 기존이 AND이면 조건 추가, 아니면 새 AND 생성
      if (left.type === 'and') {
        (left as LogicalCondition).conditions.push(right);
      } else {
        left = {
          type: 'and',
          conditions: [left, right],
        };
      }
    }

    return left;
  }

  /**
   * 기본 조건 파싱 (괄호, 단일 조건, 크로스오버)
   */
  private parsePrimary(): Condition {
    const token = this.peek();

    // 괄호
    if (token?.type === 'LPAREN') {
      this.consume(); // (
      const condition = this.parseOr();
      this.expect('RPAREN'); // )
      return condition;
    }

    // 지표로 시작하는 조건
    if (token?.type === 'INDICATOR') {
      return this.parseCondition();
    }

    throw new Error(`Unexpected token: ${token?.value || 'EOF'}`);
  }

  /**
   * 산술 표현식 또는 단일 값 파싱 (예: Low_52W * 1.3 또는 그냥 30)
   * 반환: { value, params } 또는 { arithmeticExpr }
   */
  private parseArithmeticOrValue(): {
    value?: number | SignalIndicator;
    params?: Record<string, number>;
    arithmeticExpr?: ArithmeticExpression;
  } {
    const firstToken = this.consume();
    if (!firstToken) {
      throw new Error('Expected value or indicator');
    }

    let left: number | SignalIndicator;
    let leftParams: Record<string, number> | undefined;

    if (firstToken.type === 'NUMBER') {
      left = parseFloat(firstToken.value);
    } else if (firstToken.type === 'INDICATOR') {
      left = parseIndicatorName(firstToken.value);
      leftParams = firstToken.params;
    } else {
      throw new Error(`Unexpected token: ${firstToken.value}`);
    }

    // 산술 연산자가 뒤따르는지 확인
    if (this.peek()?.type === 'ARITHMETIC') {
      const opToken = this.consume()!;
      const arithmeticOp = parseArithmeticOperator(opToken.value);

      const rightToken = this.consume();
      if (!rightToken) {
        throw new Error('Expected value after arithmetic operator');
      }

      let right: number | SignalIndicator;
      let rightParams: Record<string, number> | undefined;

      if (rightToken.type === 'NUMBER') {
        right = parseFloat(rightToken.value);
      } else if (rightToken.type === 'INDICATOR') {
        right = parseIndicatorName(rightToken.value);
        rightParams = rightToken.params;
      } else {
        throw new Error(`Unexpected token: ${rightToken.value}`);
      }

      return {
        arithmeticExpr: {
          type: 'arithmetic',
          left,
          operator: arithmeticOp,
          right,
          leftParams,
          rightParams,
        },
      };
    }

    // 산술 연산자가 없으면 단일 값 반환
    return {
      value: left,
      params: leftParams,
    };
  }

  /**
   * 단일 조건 또는 크로스오버 파싱
   */
  private parseCondition(): Condition {
    const indicator1Token = this.consume()!;
    const indicator1 = parseIndicatorName(indicator1Token.value);
    const params1 = indicator1Token.params;

    const nextToken = this.peek();

    // 산술 연산자가 바로 뒤에 있으면 (예: Low_52W * 1.3 > ...)
    // indicator1을 산술 표현식의 left로 처리
    if (nextToken?.type === 'ARITHMETIC') {
      const opToken = this.consume()!;
      const arithmeticOp = parseArithmeticOperator(opToken.value);

      const rightToken = this.consume();
      if (!rightToken) {
        throw new Error('Expected value after arithmetic operator');
      }

      let right: number | SignalIndicator;
      let rightParams: Record<string, number> | undefined;

      if (rightToken.type === 'NUMBER') {
        right = parseFloat(rightToken.value);
      } else if (rightToken.type === 'INDICATOR') {
        right = parseIndicatorName(rightToken.value);
        rightParams = rightToken.params;
      } else {
        throw new Error(`Unexpected token: ${rightToken.value}`);
      }

      const leftArithmetic: ArithmeticExpression = {
        type: 'arithmetic',
        left: indicator1,
        operator: arithmeticOp,
        right,
        leftParams: params1,
        rightParams,
      };

      // 이제 비교 연산자가 와야 함
      const compToken = this.peek();
      if (compToken?.type !== 'COMPARISON') {
        throw new Error(`Expected comparison operator, got ${compToken?.value || 'EOF'}`);
      }
      this.consume();
      const operator = parseComparisonOperator(compToken.value);

      // 비교 대상 값 파싱
      const rightSide = this.parseArithmeticOrValue();

      if (rightSide.arithmeticExpr) {
        return {
          type: 'single',
          indicator: leftArithmetic,
          operator,
          value: rightSide.arithmeticExpr,
        } as SingleCondition;
      }

      return {
        type: 'single',
        indicator: leftArithmetic,
        operator,
        value: rightSide.value!,
        valueParams: rightSide.params,
      } as SingleCondition;
    }

    // 크로스오버
    if (nextToken?.type === 'CROSS') {
      this.consume(); // cross_above/cross_below
      const indicator2Token = this.consume();
      if (!indicator2Token || indicator2Token.type !== 'INDICATOR') {
        throw new Error('Expected indicator after cross operator');
      }
      const indicator2 = parseIndicatorName(indicator2Token.value);
      const params2 = indicator2Token.params;

      return {
        type: 'crossover',
        indicator1,
        indicator2,
        direction: nextToken.value === 'cross_above' ? 'up' : 'down',
        params1,
        params2,
      } as CrossoverCondition;
    }

    // 비교 연산
    if (nextToken?.type === 'COMPARISON') {
      this.consume(); // 비교 연산자
      const operator = parseComparisonOperator(nextToken.value);

      // 비교 대상 값 파싱 (산술 표현식 또는 단일 값)
      const rightSide = this.parseArithmeticOrValue();

      if (rightSide.arithmeticExpr) {
        return {
          type: 'single',
          indicator: indicator1,
          operator,
          value: rightSide.arithmeticExpr,
          params: params1,
        } as SingleCondition;
      }

      return {
        type: 'single',
        indicator: indicator1,
        operator,
        value: rightSide.value!,
        params: params1,
        valueParams: rightSide.params,
      } as SingleCondition;
    }

    throw new Error(`Expected comparison or cross operator, got ${nextToken?.value || 'EOF'}`);
  }
}

/**
 * 수식 문자열을 Condition 객체로 파싱
 */
export function parseFormula(formula: string): Condition {
  const trimmed = formula.trim();
  if (!trimmed) {
    throw new Error('수식이 비어있습니다');
  }

  const tokens = tokenize(trimmed);
  if (tokens.length === 0) {
    throw new Error('유효한 토큰이 없습니다');
  }

  const parser = new FormulaParser(tokens);
  return parser.parse();
}

/**
 * 수식 유효성 검사
 */
export function validateFormula(formula: string): { valid: boolean; error?: string } {
  try {
    parseFormula(formula);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

/**
 * 자동완성을 위한 지표 목록
 */
export const FORMULA_INDICATORS = [
  { name: 'Price', description: '현재가' },
  { name: 'Volume', description: '거래량' },
  { name: 'Volume_MA(period)', description: '거래량 이동평균', example: 'Volume_MA(20)' },
  { name: 'High(period)', description: 'N일 최고가', example: 'High(20)' },
  { name: 'Low(period)', description: 'N일 최저가', example: 'Low(20)' },
  { name: 'High_52W', description: '52주 신고가 (252일)' },
  { name: 'Low_52W', description: '52주 신저가 (252일)' },
  { name: 'SMA(period)', description: '단순이동평균', example: 'SMA(20)' },
  { name: 'EMA(period)', description: '지수이동평균', example: 'EMA(20)' },
  { name: 'RSI(period)', description: '상대강도지수', example: 'RSI(14)' },
  { name: 'MACD', description: 'MACD 라인' },
  { name: 'MACD_Signal', description: 'MACD 시그널' },
  { name: 'MACD_Histogram', description: 'MACD 히스토그램' },
  { name: 'Stochastic_K(k,d)', description: '스토캐스틱 %K', example: 'Stochastic_K(14,3)' },
  { name: 'Stochastic_D(k,d)', description: '스토캐스틱 %D', example: 'Stochastic_D(14,3)' },
  { name: 'Bollinger_Upper(period,std)', description: '볼린저 상단', example: 'Bollinger_Upper(20,2)' },
  { name: 'Bollinger_Middle(period)', description: '볼린저 중심', example: 'Bollinger_Middle(20)' },
  { name: 'Bollinger_Lower(period,std)', description: '볼린저 하단', example: 'Bollinger_Lower(20,2)' },
];

/**
 * 자동완성을 위한 연산자 목록
 */
export const FORMULA_OPERATORS = [
  { name: '>', description: '~보다 큼' },
  { name: '<', description: '~보다 작음' },
  { name: '>=', description: '~보다 크거나 같음' },
  { name: '<=', description: '~보다 작거나 같음' },
  { name: '==', description: '~와 같음' },
  { name: 'cross_above', description: '상향돌파 (골든크로스)' },
  { name: 'cross_below', description: '하향돌파 (데드크로스)' },
  { name: 'AND', description: '그리고 (모든 조건 충족)' },
  { name: 'OR', description: '또는 (하나라도 충족)' },
];

/**
 * 수식 예제
 */
export const FORMULA_EXAMPLES = [
  { formula: 'RSI(14) < 30', description: 'RSI 과매도' },
  { formula: 'RSI(14) > 70', description: 'RSI 과매수' },
  { formula: 'SMA(5) cross_above SMA(20)', description: '골든크로스 (5일선 > 20일선)' },
  { formula: 'SMA(5) cross_below SMA(20)', description: '데드크로스 (5일선 < 20일선)' },
  { formula: 'MACD cross_above MACD_Signal', description: 'MACD 매수 신호' },
  { formula: 'Price < Bollinger_Lower(20,2)', description: '볼린저 하단 돌파' },
  { formula: '(RSI(14) < 30 OR MACD cross_above MACD_Signal) AND Volume > 1000000', description: '복합 조건' },
];
