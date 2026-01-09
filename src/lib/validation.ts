/**
 * API 입력값 검증 유틸리티
 */

/**
 * 숫자 범위 검증 및 정규화
 * @param value - 쿼리 파라미터 문자열
 * @param options - 기본값, 최소값, 최대값
 * @returns 검증된 숫자
 */
export function validateLimit(
  value: string | null,
  options: { defaultValue: number; min: number; max: number }
): number {
  const parsed = parseInt(value || '', 10);
  if (isNaN(parsed)) return options.defaultValue;
  return Math.max(options.min, Math.min(options.max, parsed));
}

/**
 * 안전한 JSON 파싱
 * @param value - JSON 문자열
 * @param defaultValue - 파싱 실패 시 기본값
 * @returns 파싱된 객체 또는 기본값
 */
export function safeJsonParse<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 종목코드 검증 (6자리 숫자)
 * @param symbol - 종목코드
 * @returns 유효 여부
 */
export function validateSymbol(symbol: string): boolean {
  // 6자리 숫자 또는 12자리 종목코드 (KR + 6자리 + 4자리)
  return /^\d{6}$/.test(symbol) || /^KR\d{10}$/.test(symbol);
}

/**
 * 종목코드 정규화 (12자리 → 6자리)
 * @param symbol - 종목코드
 * @returns 6자리 종목코드
 */
export function normalizeSymbol(symbol: string): string {
  // 12자리면 끝에서 6자리 추출 (마지막 4자리 제외)
  if (symbol.length === 12 && symbol.startsWith('KR')) {
    return symbol.slice(2, 8);
  }
  return symbol.slice(-6);
}
