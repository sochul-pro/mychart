import type { NewsProvider } from './news-provider';
import { mockNewsProvider } from './mock-news-provider';
import { naverNewsProvider } from './naver-news-provider';

/**
 * 환경에 따른 NewsProvider 반환
 *
 * 우선순위:
 * 1. NEWS_PROVIDER 환경변수가 'naver'이고 네이버 API 설정이 있으면 NaverNewsProvider
 * 2. 그 외 MockNewsProvider
 */
export function getNewsProvider(): NewsProvider {
  const providerType = process.env.NEWS_PROVIDER || 'mock';

  if (providerType === 'naver' && naverNewsProvider) {
    return naverNewsProvider;
  }

  return mockNewsProvider;
}

/**
 * 현재 활성화된 Provider 이름 반환
 */
export function getNewsProviderName(): string {
  return getNewsProvider().name;
}

/**
 * 실제 뉴스 Provider 사용 여부
 */
export function isRealNewsProvider(): boolean {
  const providerType = process.env.NEWS_PROVIDER || 'mock';
  return providerType === 'naver' && naverNewsProvider !== null;
}

/**
 * 기본 NewsProvider 인스턴스
 */
export const newsProvider = getNewsProvider();
