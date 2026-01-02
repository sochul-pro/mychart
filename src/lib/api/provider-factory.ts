import type { StockDataProvider } from './stock-provider';
import { mockProvider } from './mock-provider';
import { kisProvider } from './kis-provider';

/**
 * 환경에 따른 StockDataProvider 반환
 *
 * 우선순위:
 * 1. STOCK_PROVIDER 환경변수가 'kis'이고 KIS 설정이 있으면 KISProvider
 * 2. 그 외 MockProvider
 */
export function getProvider(): StockDataProvider {
  const providerType = process.env.STOCK_PROVIDER || 'mock';

  if (providerType === 'kis' && kisProvider) {
    return kisProvider;
  }

  return mockProvider;
}

/**
 * 현재 활성화된 Provider 이름 반환
 */
export function getProviderName(): string {
  return getProvider().name;
}

/**
 * Provider 타입 확인
 */
export function isProduction(): boolean {
  const providerType = process.env.STOCK_PROVIDER || 'mock';
  return providerType === 'kis' && kisProvider !== null;
}

/**
 * 기본 Provider 인스턴스
 */
export const stockProvider = getProvider();
