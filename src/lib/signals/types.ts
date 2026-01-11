/** 비교 연산자 */
export type ComparisonOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';

/** 지표 타입 */
export type SignalIndicator =
  | 'price'
  | 'volume'
  | 'sma'
  | 'ema'
  | 'rsi'
  | 'macd'
  | 'macd_signal'
  | 'macd_histogram'
  | 'stochastic_k'
  | 'stochastic_d'
  | 'bollinger_upper'
  | 'bollinger_middle'
  | 'bollinger_lower';

/** 단일 조건 */
export interface SingleCondition {
  type: 'single';
  indicator: SignalIndicator;
  operator: ComparisonOperator;
  value: number | SignalIndicator; // 고정값 또는 다른 지표와 비교
  params?: Record<string, number>; // 지표 파라미터 (예: period)
}

/** 크로스오버 조건 */
export interface CrossoverCondition {
  type: 'crossover';
  indicator1: SignalIndicator;
  indicator2: SignalIndicator;
  direction: 'up' | 'down'; // up: indicator1이 indicator2를 상향돌파, down: 하향돌파
  params1?: Record<string, number>;
  params2?: Record<string, number>;
}

/** 논리 연산자 조건 (AND/OR) */
export interface LogicalCondition {
  type: 'and' | 'or';
  conditions: Condition[];
}

/** 조건 유니온 타입 */
export type Condition = SingleCondition | CrossoverCondition | LogicalCondition;

/** 매매 신호 */
export interface Signal {
  type: 'buy' | 'sell';
  time: number;
  price: number;
  reason: string;
}

/** 매매 전략 */
export interface TradingStrategy {
  id: string;
  name: string;
  description?: string;
  buyCondition: Condition;
  sellCondition: Condition;
}

/** 지표 계산 결과 캐시 */
export interface IndicatorCache {
  sma: Map<number, (number | null)[]>; // key: period
  ema: Map<number, (number | null)[]>;
  rsi: Map<number, (number | null)[]>;
  macd: Map<string, { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] }>;
  stochastic: Map<string, { k: (number | null)[]; d: (number | null)[] }>;
  bollinger: Map<string, { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] }>;
}

/** 프리셋 전략 ID */
export type PresetStrategyId =
  | 'golden_cross'
  | 'death_cross'
  | 'rsi_oversold'
  | 'rsi_overbought'
  | 'macd_crossover'
  | 'bollinger_breakout';

/** 신호 생성 결과 */
export interface SignalResult {
  signals: Signal[];
  buyCount: number;
  sellCount: number;
}

/** 거래 기록 */
export interface Trade {
  id: string;
  entryTime: number;
  entryPrice: number;
  exitTime?: number;
  exitPrice?: number;
  type: 'long'; // 현재는 롱만 지원
  quantity: number;
  returnPct?: number;
  pnl?: number; // 손익 (원)
  status: 'open' | 'closed';
  entryReason: string;
  exitReason?: string;
}

/** 백테스트 설정 */
export interface BacktestConfig {
  symbol: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number; // 초기 자본 (원)
  commission: number; // 수수료율 (%, 기본 0.015)
  slippage: number; // 슬리피지 (%, 기본 0.1)
  positionSizing: 'fixed' | 'percent'; // 고정 금액 vs 비율
  positionSize: number; // 금액 or 비율
}

/** 백테스트 결과 */
export interface BacktestResult {
  // 기본 정보
  config: BacktestConfig;
  strategy: TradingStrategy;

  // 거래 통계
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;

  // 수익률 지표
  totalReturn: number;
  annualizedReturn: number;

  // 위험 지표
  maxDrawdown: number;
  maxDrawdownDuration: number; // 최대 낙폭 지속 기간 (일)
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;

  // 상세 통계
  avgWinPct: number;
  avgLossPct: number;
  profitFactor: number;
  expectancy: number; // 기대값
  avgHoldingDays: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;

  // 상세 데이터
  trades: Trade[];
  equityCurve: { time: number; value: number }[];
  drawdownCurve: { time: number; value: number }[];
  monthlyReturns: { month: string; return: number }[];
}

/** 알림 설정 */
export interface AlertConfig {
  id: string;
  presetId: string;
  symbols: string[];
  isActive: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  minPrice?: number;
  maxPrice?: number;
}

/** 알림 메시지 */
export interface AlertMessage {
  id: string;
  symbol: string;
  stockName: string;
  signalType: 'buy' | 'sell';
  price: number;
  strategyName: string;
  reason: string;
  timestamp: number;
  isRead: boolean;
}

/** 프리셋 with 성능 메타데이터 */
export interface SignalPresetWithStats {
  id: string;
  name: string;
  description?: string;
  buyRules: Condition;
  sellRules: Condition;
  isDefault: boolean;
  isActive: boolean;
  lastBacktestAt?: Date;
  winRate?: number;
  totalReturn?: number;
  maxDrawdown?: number;
  sharpeRatio?: number;
  createdAt: Date;
  updatedAt: Date;
}
