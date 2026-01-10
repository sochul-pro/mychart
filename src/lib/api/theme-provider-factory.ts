import type { ThemeProvider } from './theme-provider';
import { setThemeProvider } from './theme-provider';
import { MockThemeProvider } from './mock-theme-provider';
import { NaverThemeProvider } from './naver-theme-provider';

/**
 * Provider 타입
 */
export type ThemeProviderType = 'mock' | 'naver';

/**
 * 환경변수 기반 Provider 타입 결정
 */
function getProviderType(): ThemeProviderType {
  const envProvider = process.env.THEME_PROVIDER;

  if (envProvider === 'naver') {
    return 'naver';
  }

  // 개발 환경에서는 기본적으로 mock 사용
  if (process.env.NODE_ENV === 'development') {
    return 'mock';
  }

  // 프로덕션에서는 naver 사용
  return 'naver';
}

/**
 * Provider 생성
 */
export function createThemeProvider(type?: ThemeProviderType): ThemeProvider {
  const providerType = type || getProviderType();

  switch (providerType) {
    case 'naver':
      return new NaverThemeProvider();
    case 'mock':
    default:
      return new MockThemeProvider();
  }
}

/**
 * Provider 초기화 및 설정
 */
export function initializeThemeProvider(type?: ThemeProviderType): ThemeProvider {
  const provider = createThemeProvider(type);
  setThemeProvider(provider);
  return provider;
}

// 자동 초기화 (서버 시작 시)
let defaultProvider: ThemeProvider | null = null;

/**
 * 기본 Provider 가져오기 (지연 초기화)
 */
export function getDefaultThemeProvider(): ThemeProvider {
  if (!defaultProvider) {
    defaultProvider = createThemeProvider();
  }
  return defaultProvider;
}
