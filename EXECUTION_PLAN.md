# MyChart 실행계획

> PRD 기반으로 분해된 독립적인 개발 태스크 목록

---

## Phase 0: 프로젝트 초기 설정

### TASK-001: 프로젝트 스캐폴딩 ✅
**설명**: Next.js 기반 프로젝트 생성 및 기본 구조 설정
**범위**:
- Next.js 15 (App Router) 프로젝트 생성
- TypeScript 5.x 설정
- ESLint, Prettier 설정
- 폴더 구조 정의 (`/app`, `/components`, `/lib`, `/types` 등)
- Tailwind CSS 4 + shadcn/ui 설정

**산출물**: 실행 가능한 빈 프로젝트
**의존성**: 없음
**완료**: 2026-01-01

---

### TASK-002: 데이터베이스 설계 및 ORM 설정 ✅
**설명**: 사용자, 관심종목, 매매전략 등 데이터 모델 설계
**범위**:
- PostgreSQL 16.x + Prisma 6.x ORM 설정
- 스키마 설계:
  - User (사용자)
  - WatchlistGroup (관심종목 그룹)
  - WatchlistItem (관심종목)
  - Stock (종목 캐시)
  - SignalPreset (매매 전략)
  - ChartSettings (차트 설정)
- 마이그레이션 생성
- Prisma 클라이언트에 재시도 로직 추가

**산출물**: Prisma 스키마, DB 마이그레이션
**의존성**: TASK-001
**완료**: 2026-01-01

---

### TASK-003: 인증 시스템 구현 ✅
**설명**: 회원가입, 로그인, 세션 관리
**범위**:
- NextAuth.js 5 설정
- 이메일/비밀번호 인증 (Credentials Provider)
- JWT 세션 관리
- 로그인/회원가입 UI (shadcn/ui 기반)
- 보호된 라우트 미들웨어
- bcrypt 비밀번호 해싱

**산출물**: 인증 플로우 완성
**의존성**: TASK-001, TASK-002
**완료**: 2026-01-01

---

## Phase 1: 데이터 레이어 (Mock 기반)

### TASK-004: 주식 시세 데이터 레이어 ✅
**설명**: Mock/실제 API 기반 시세 데이터 Provider 구현
**범위**:
- StockDataProvider 인터페이스 정의
- MockProvider 구현 (개발/테스트용)
- KISProvider 구현 (한국투자증권 OpenAPI)
- ProviderFactory로 자동 Provider 선택
- 일/주/월봉 OHLCV 데이터
- 현재가, 호가 데이터
- 5대 순위 API (등락률, 회전율, 거래대금, 외인/기관, HTS 조회상위)
- HTS 조회상위 API (TR_ID: HHMCM000100C0) 연동
- API 캐싱 시스템 (30초~600초 TTL)
- Rate Limit 대응 (순차 호출 + 120ms 딜레이)

**산출물**:
- `/lib/api/stock-provider.ts` - Provider 인터페이스
- `/lib/api/mock-provider.ts` - Mock 구현체
- `/lib/api/kis-provider.ts` - 한투 API 구현체
- `/lib/api/provider-factory.ts` - Provider 팩토리
- `/lib/api/cache.ts` - 캐싱 시스템

**의존성**: TASK-001
**완료**: 2026-01-03, 2026-01-04 (#40 - HTS 조회상위 API 추가)

---

### TASK-005: 뉴스 데이터 레이어 ✅
**설명**: Mock/실제 뉴스 데이터 Provider 구현
**범위**:
- NewsProvider 인터페이스 정의
- MockNewsProvider 구현 (개발용)
- NaverNewsProvider 구현 (네이버 금융 뉴스)
- 종목별 뉴스 검색

**산출물**:
- `/lib/api/news-provider.ts` - Provider 인터페이스
- `/lib/api/mock-news-provider.ts` - Mock 구현체
- `/lib/api/naver-news-provider.ts` - 네이버 뉴스 구현체

**의존성**: TASK-001
**완료**: 2026-01-03

---

## Phase 2: 차트 시스템

### TASK-006: 캔들차트 컴포넌트 개발 ✅
**설명**: 주식 캔들차트 렌더링 컴포넌트
**범위**:
- TradingView Lightweight Charts 연동
- 캔들차트 + 거래량 히스토그램 렌더링
- 일/주/월봉 전환
- 차트 줌/팬 인터랙션
- 반응형 크기 조절
- 성능 최적화 (memo)

**산출물**: `/components/chart/CandleChart.tsx`
**의존성**: TASK-004
**완료**: 2026-01-02

---

### TASK-007: 기술적 지표 계산 엔진 ✅
**설명**: 이동평균선, RSI, MACD 등 지표 계산 로직
**범위**:
- 이동평균선 (SMA, EMA) 계산
- RSI 계산 (14일 기본)
- MACD 계산 (12/26/9)
- 볼린저밴드 계산 (2.0 표준편차)
- 스토캐스틱 계산
- OBV, ATR 계산
- 단위 테스트 완료

**산출물**: `/lib/indicators/` - 7개 지표별 계산 함수
**의존성**: 없음 (순수 계산 로직)
**완료**: 2026-01-02

---

### TASK-008: 기술적 지표 오버레이 렌더링 ✅
**설명**: 차트 위에 기술적 지표 시각화
**범위**:
- 이동평균선 오버레이 (5개 MA 지원, SMA/EMA 선택 가능)
- RSI 서브차트
- MACD 서브차트
- 스토캐스틱(Slow) 서브차트 (%K, %D 라인)
- 볼린저밴드 오버레이
- 지표 ON/OFF 토글 UI (IndicatorPanel)
- 지표 파라미터 설정 UI (기간, 색상)
- 지표 설정 DB 저장 (`/api/chart-settings`)
- `useChartSettings` 훅 (TanStack Query, 500ms 디바운스 자동저장)

**산출물**:
- `/components/chart/indicators/StockChartWithIndicators.tsx`
- `/components/chart/indicators/IndicatorPanel.tsx`
- `/hooks/useChartSettings.ts`
- `/app/api/chart-settings/route.ts`

**의존성**: TASK-006, TASK-007
**완료**: 2026-01-02 (지표 저장 기능 2026-01-04 추가)

---

### TASK-009: 매매 신호 시스템 - 조건 엔진 ✅
**설명**: 사용자 정의 매수/매도 조건 평가 엔진
**범위**:
- 조건 데이터 모델 정의 (JSON 스키마)
- 단일 조건 평가 (RSI < 30 등)
- 복합 조건 평가 (AND/OR 논리)
- 크로스오버 조건 (골든크로스 등)
- 과거 데이터 기반 신호 생성
- 단위 테스트 완료

**산출물**: `/lib/signals/engine.ts`, `/lib/signals/conditions.ts`
**의존성**: TASK-007
**완료**: 2026-01-02

---

### TASK-010: 매매 신호 시스템 - UI ✅
**설명**: 조건 빌더 UI 및 차트 신호 마커 표시
**범위**:
- 조건 빌더 UI (폼 기반)
- 프리셋 전략 선택 UI (StrategySelector)
- 차트에 매수(▲)/매도(▼) 마커 렌더링 (SignalMarkers)
- 전략 저장/불러오기 (DB 스키마 완료)
- 백테스트 결과 표시 (BacktestResult)
- **커스텀 전략 기능 (2026-01-09 추가, #42)**
  - ConditionBuilder: AND/OR 논리 연산자, 조건 추가/삭제
  - ConditionRow: 단일 조건 UI (지표/연산자/값)
  - CrossoverConditionRow: 크로스오버 조건 UI
  - StrategySelector에 "커스텀" 버튼 추가

**산출물**: `/components/signals/`
- `SignalMarkers.tsx` ✅
- `StrategySelector.tsx` ✅ (커스텀 전략 기능 추가)
- `BacktestResult.tsx` ✅
- `ConditionBuilder.tsx` ✅ (2026-01-09 추가)
- `ConditionRow.tsx` ✅ (2026-01-09 추가)
- `CrossoverConditionRow.tsx` ✅ (2026-01-09 추가)

**의존성**: TASK-006, TASK-009
**완료**: 2026-01-02 (조건 빌더 UI 2026-01-09 추가)

---

## Phase 3: 핵심 기능

### TASK-011: 관심종목 관리 - 백엔드 ✅
**설명**: 관심종목 CRUD API
**범위**:
- 관심종목 그룹 CRUD API
- 관심종목 추가/삭제/순서변경 API
- 메모, 목표가, 매수가 저장 API
- 사용자별 데이터 격리

**산출물**: `/app/api/watchlist/` - 9개 API 라우트
- `GET/POST /api/watchlist`
- `PUT/DELETE /api/watchlist/[groupId]`
- `POST /api/watchlist/[groupId]/items`
- `PUT/DELETE /api/watchlist/[groupId]/items/[itemId]`
- `PUT /api/watchlist/[groupId]/items/reorder`
- `PUT /api/watchlist/reorder`

**의존성**: TASK-002, TASK-003
**완료**: 2026-01-02

---

### TASK-012: 관심종목 관리 - 프론트엔드 ✅
**설명**: 관심종목 관리 UI
**범위**:
- 관심종목 그룹 목록/생성/수정/삭제 UI
- 종목 검색 및 추가 UI (다이얼로그)
- 드래그앤드롭 순서 변경 (인프라 완료)
- 메모, 목표가, 매수가 입력/수정 UI
- useWatchlist 훅 (TanStack Query)
- **2-panel 레이아웃 (2026-01-04 추가)**
  - PC: 왼쪽 종목 목록 + 오른쪽 차트 (side-by-side)
  - 모바일: 탭 전환 (목록/차트)
- **실시간 시세 표시 (2026-01-04 추가)**
  - 테이블 스타일 종목 목록 (종목명, 현재가, 등락률)
  - useStockQuote 훅으로 30초 자동 갱신
- **자동 순환 기능 (2026-01-04 추가)**
  - 5초/10초/30초/1분 간격 설정
  - 재생/일시정지, 이전/다음 버튼
  - 진행률 표시 (Progress 컴포넌트)
- **종목 삭제 기능 (2026-01-04 추가)**
  - 마우스 오버 시 휴지통 아이콘 표시
- **종목 검색 기능 (2026-01-04 추가, #41)**
  - StockSearchDialog 컴포넌트 (검색 다이얼로그)
  - 혼합 검색 방식: 마스터 데이터 + KIS API 폴백
  - 종목명/코드 검색, 현재가/등락률 표시
  - 마스터에 없는 종목코드 → "API에서 검색" 버튼
  - API 조회 종목 자동 저장 (동적 마스터)

**산출물**:
- `/app/(main)/watchlist/page.tsx` - 2-panel 레이아웃
- `/components/watchlist/WatchlistGroupCard.tsx`
- `/components/watchlist/WatchlistItemRow.tsx`
- `/components/watchlist/AutoRotateControl.tsx` - 자동 순환 컨트롤
- `/components/watchlist/StockSearchDialog.tsx` - 종목 검색 다이얼로그 (2026-01-04 추가)
- `/components/stock/StockQuoteCard.tsx` - 공용 시세 카드
- `/components/stock/StockChartCard.tsx` - 공용 차트 카드
- `/components/ui/progress.tsx` - 진행률 표시
- `/components/ui/tabs.tsx` - 탭 컴포넌트
- `/hooks/useWatchlist.ts`
- `/lib/api/stock-master.ts` - 종목 마스터 데이터 (정적+동적) (2026-01-04 추가)
- `/app/api/stocks/search/route.ts` - 종목 검색 API (2026-01-04 추가)

**의존성**: TASK-004, TASK-011
**완료**: 2026-01-02 (2-panel 레이아웃, 자동순환, 삭제 기능 2026-01-04 추가, 종목 검색 기능 2026-01-04 추가)

---

### TASK-013: 주도주 스크리너 - 백엔드 ✅
**설명**: 5대 순위 기반 주도주 선별 로직
**범위**:
- 등락률 순위 TOP 50 필터링
- 회전율 순위 TOP 50 필터링
- 거래대금 순위 TOP 50 필터링
- 외인/기관 순위 TOP 50 필터링
- **HTS 조회상위 순위 TOP 20 필터링 (2026-01-04 추가)**
- 복합 점수 계산: `(50 - rank) * weight`
- **순위 조건 선택 기능 (2026-01-04 추가)**
  - 사용자가 5개 순위 중 원하는 조건만 선택 가능
  - 선택된 조건만 점수 계산에 반영
- 캐싱 (30초 TTL)

**산출물**:
- `/lib/screener/leader-detector.ts`
- `/lib/screener/filters.ts`
- `/app/api/screener/route.ts`
- `/types/screener.ts` - SelectedRankings, RANKING_LABELS 타입 추가 (2026-01-04)

**의존성**: TASK-004
**완료**: 2026-01-03 (#31), 2026-01-04 (#40 - HTS 조회상위 API 연동, 순위 조건 필터)

---

### TASK-014: 주도주 스크리너 - 프론트엔드 ✅
**설명**: 주도주 리스트 UI
**범위**:
- 주도주 테이블 (ScreenerTable)
- 필터 옵션 (ScreenerFilters)
  - 시장 필터 (KOSPI/KOSDAQ/전체)
  - 5대 순위 가중치 슬라이더
  - 최소 순위 등장 횟수
  - **순위 조건 선택 UI (2026-01-04 추가)**
    - Badge 토글로 5개 순위 조건 ON/OFF
    - 아이콘 + 라벨로 직관적 표시
- 정렬 기능
- 종목 클릭 시 상세 페이지 이동
- useScreener 훅
- **useScreenerSettings 훅 (2026-01-04 추가)**
  - 설정값 localStorage 저장/로드
  - 자동 저장 (변경 시 즉시 반영)

**산출물**:
- `/app/(main)/screener/page.tsx`
- `/components/screener/ScreenerTable.tsx`
- `/components/screener/ScreenerFilters.tsx`
- `/hooks/useScreener.ts`
- `/hooks/useScreenerSettings.ts` (2026-01-04 추가)

**의존성**: TASK-013
**완료**: 2026-01-03 (#31), 2026-01-04 (#40 - 순위 조건 필터 UI, 설정 저장)

---

### TASK-015: 뉴스 피드 컴포넌트 ✅
**설명**: 종목별 뉴스 목록 UI
**범위**:
- 뉴스 리스트 컴포넌트 (NewsFeed)
- 뉴스 카드 (NewsCard) - 제목, 요약, 시간, 출처
- 새로고침 버튼
- 로딩 스켈레톤
- 다중 종목 뉴스 지원

**산출물**:
- `/components/news/NewsFeed.tsx`
- `/components/news/NewsCard.tsx`
- `/hooks/useNews.ts`
- `/app/api/news/route.ts`

**의존성**: TASK-005
**완료**: 2026-01-03

---

## Phase 4: 페이지 조합

### TASK-016: 종목 상세 페이지 ✅
**설명**: 차트 + 정보 + 뉴스 통합 페이지
**범위**:
- 시세 카드에 종목 정보 통합 (헤더 제거)
  - 종목명 정규화 (보통주 제거, 우선주는 (우) 표시)
  - 종목코드 하위 6자리만 표시
- 현재가 정보 카드 (OHLC, 등락률, 투자정보)
- 차트 뷰어 (StockChartWithIndicators, 높이 600px)
  - 지표 설정 자동 저장 (500ms 디바운스)
  - 일/주/월봉 전환
- 뉴스 피드 (차트 하단 배치)
- 관심종목 추가 다이얼로그
- 252일 (1년) OHLCV 데이터 (API 페이지네이션)

**산출물**: `/app/(main)/stocks/[symbol]/page.tsx`
**의존성**: TASK-006, TASK-008, TASK-010, TASK-015
**완료**: 2026-01-03 (레이아웃 개선 2026-01-04)

---

### TASK-017: 대시보드 페이지 ✅
**설명**: 메인 대시보드 (관심종목 요약, 주도주, 뉴스)
**범위**:
- 관심종목 시세 요약 위젯 (상위 3개 그룹)
- 오늘의 주도주 하이라이트 (TOP 5)
- 관심종목 관련 최신 뉴스 피드
- 3컬럼 반응형 그리드 레이아웃
- 로딩 스켈레톤

**산출물**: `/app/(main)/dashboard/page.tsx`
**의존성**: TASK-012, TASK-014, TASK-015
**완료**: 2026-01-03

---

### TASK-018: 설정 페이지 ✅
**설명**: 계정, 알림, 차트 기본값 설정
**범위**:
- 계정 정보 표시/수정 (이메일 읽기전용, 이름 수정 가능)
- ~~알림 설정 (이메일/푸시)~~ "준비 중" 표시
- 차트 기본 타임프레임 설정 UI
- 테마 설정 UI (다크/라이트)
- 기본 지표 토글 UI
- **API 연동 (2026-01-09 추가, #42)**
  - useUserSettings 훅 (프로필 + 차트설정 통합)
  - 프로필 API (이름 업데이트)
  - 저장 성공/실패 피드백 UI
  - 로딩 상태 Skeleton UI

**산출물**:
- `/app/(main)/settings/page.tsx`
- `/hooks/useUserSettings.ts` (2026-01-09 추가)
- `/app/api/user/profile/route.ts` (2026-01-09 추가)
- `/types/settings.ts` (2026-01-09 추가)

**의존성**: TASK-003
**완료**: 2026-01-03 (API 연동 2026-01-09 추가)

---

## Phase 5: 마무리

### TASK-019: 반응형 디자인 최적화 ✅
**설명**: 모바일/태블릿 대응
**범위**:
- 전체 페이지 반응형 점검
- 모바일 네비게이션 (MobileNav 컴포넌트)
- 터치 인터랙션 최적화
- 차트 모바일 UX 개선
- **E2E 테스트에서 모바일 뷰 검증 (2026-01-09 추가)**

**산출물**: 반응형 완성된 UI
**의존성**: TASK-016, TASK-017, TASK-018
**완료**: 2026-01-09 (#42)

---

### TASK-020: 성능 최적화 ✅
**설명**: 로딩 속도 및 렌더링 성능 개선
**범위**:
- 차트 렌더링 최적화 (memo 적용) ✅
- API 응답 캐싱 (30초~600초 TTL) ✅
- React 컴포넌트 메모이제이션 ✅
- 이미지 최적화 (AVIF, WebP 포맷) ✅
- **Lighthouse CI 설정 (2026-01-09 추가, #42)**
  - FCP, LCP, CLS, TBT 임계값 설정
  - 접근성, SEO 검사 규칙
  - 3개 페이지 자동 측정
- **Next.js 성능 최적화 (2026-01-09 추가)**
  - 압축 활성화
  - X-Powered-By 헤더 제거
  - 번들 분석 스크립트 (`npm run analyze`)

**산출물**:
- 캐싱 시스템 구축 완료
- `lighthouserc.js` (2026-01-09 추가)
- `next.config.ts` 최적화 설정 (2026-01-09 추가)

**의존성**: 모든 기능 완료 후
**완료**: 2026-01-03 (Lighthouse CI 2026-01-09 추가)

---

### TASK-021: 테스트 및 QA ✅
**설명**: 단위/통합 테스트 및 QA
**범위**:
- 핵심 로직 단위 테스트 (지표 계산, 신호 엔진) ✅
- 컴포넌트 테스트 (15+ 테스트 파일) ✅
- **E2E 테스트 (2026-01-09 추가, #42)**
  - Playwright 설정 (Desktop/Mobile Chrome)
  - `e2e/auth.spec.ts` - 로그인/회원가입 플로우
  - `e2e/screener.spec.ts` - 주도주 스크리너 테스트
  - `e2e/watchlist.spec.ts` - 관심종목 테스트
  - `e2e/stock-detail.spec.ts` - 종목 상세 페이지 테스트

**테스트 인프라**:
- Vitest + React Testing Library (단위/컴포넌트)
- Playwright (E2E) (2026-01-09 추가)
- JSDOM 환경

**새로운 테스트 스크립트**:
```bash
npm run test:e2e        # E2E 테스트 실행
npm run test:e2e:ui     # UI 모드로 테스트
npm run test:e2e:report # 테스트 리포트
```

**산출물**:
- 핵심 로직 테스트 완료
- `playwright.config.ts` (2026-01-09 추가)
- `e2e/*.spec.ts` 4개 시나리오 (2026-01-09 추가)

**의존성**: 모든 기능 완료 후
**완료**: 2026-01-03 (E2E 테스트 2026-01-09 추가)

---

## Phase 6: 실서비스 연동 (추후)

### TASK-022: 한국투자증권 OpenAPI 연동 ✅
**설명**: Mock Provider를 실제 한국투자증권 API로 교체
**범위**:
- 한국투자증권 OpenAPI 인증 (OAuth)
- KISProvider 구현 (StockDataProvider 인터페이스)
- 실시간 시세 조회
- 일/주/월봉 OHLCV 데이터 조회
- 토큰 갱신 및 에러 핸들링
- 환경변수 기반 Provider 전환

**산출물**: `/lib/api/kis-provider.ts`
**의존성**: TASK-004
**선행조건**: 한국투자증권 계좌 및 API 키 발급
**완료**: 2026-01-03 (#26)

---

### TASK-023: 실시간 뉴스 연동 ✅
**설명**: 실제 뉴스 소스 연동
**범위**:
- 뉴스 API 소스 선정 및 연동
- 종목코드 기반 뉴스 검색
- 뉴스 감정 분석 (선택)

**산출물**: 실제 뉴스 Provider
**의존성**: TASK-005
**완료**: 2026-01-03 (네이버 뉴스 API 연동, #27)

---

### TASK-024: 섹터/업종 데이터 시스템 ✅
**설명**: KRX 표준 업종 분류 기반 섹터 데이터 시스템 구현
**범위**:
- 섹터 타입 정의 (SectorCode, Sector, SectorSummary)
- KRX 표준 업종 분류 기반 17개 섹터 마스터 데이터
- 종목-섹터 매핑 데이터 (~80개 주요 종목)
- StockDataProvider 인터페이스에 섹터 관련 메서드 추가
- Mock/KIS Provider에 섹터 기능 구현

**산출물**:
- `/types/sector.ts` - 섹터 타입 정의
- `/lib/api/sector-master.ts` - 종목-섹터 매핑
- Provider 섹터 메서드 (getSectors, getStocksBySector, getSectorSummary)

**의존성**: TASK-004, TASK-022
**완료**: 2026-01-03 (#28)

---

### TASK-025: 스크리너 섹터별 핫 종목 UI ✅
**설명**: 스크리너 페이지에 섹터별 핫 종목 표시 기능
**범위**:
- 섹터 시세 요약 API 라우트 (/api/sectors/summary, /api/sectors/[code])
- SectorHotStocks 컴포넌트 구현
- 섹터별 평균 등락률, 상승/하락 종목 수 표시
- 섹터 내 핫 종목 상위 5개 표시
- 반응형 그리드 레이아웃 (1~3열)
- 스크리너 페이지에 통합

**핫 종목 점수 계산**:
| 지표 | 조건 | 점수 |
|------|------|------|
| 거래량 비율 | ≥5배/≥3배/≥2배/≥1.5배 | +30/+20/+15/+10 |
| 당일 등락률 | ≥10%/≥5%/≥3%/≥1%/<0% | +30/+20/+15/+10/-10 |
| 52주 신고가 | 돌파 시 | +20 |
| 52주 수익률 | ≥100%/≥50%/≥20%/≥0% | +20/+15/+10/+5 |

**산출물**:
- `/app/api/sectors/` - 섹터 API 라우트
- `/components/sectors/SectorHotStocks.tsx`
- `/hooks/useSectorSummary.ts`

**의존성**: TASK-024, TASK-014
**완료**: 2026-01-03 (#29)

---

## 보완 사항 (Maintenance)

### MAINT-001: 테스트 수정 및 안정화 ✅
**설명**: 실패 테스트 수정 및 테스트 커버리지 개선
**범위**:
- KIS Provider 테스트: Mock fetch에 `text()` 메서드 추가
- IndicatorPanel 테스트: 컴포넌트 구조 변경 반영 (testid 수정)
- WatchlistGroupCard 테스트: `useStockQuote` 훅 mock 추가
- WatchlistItemRow 테스트: Hook mock 및 테이블 UI assertion 업데이트

**결과**:
- 테스트 성공률: 90.3% → 97.8%
- 실패 테스트: 23개 → 5개 (KIS Provider 환경 의존 테스트 제외)

**산출물**:
- `src/lib/api/kis-provider.test.ts` (수정)
- `src/components/chart/indicators/IndicatorPanel.test.tsx` (수정)
- `src/components/watchlist/WatchlistGroupCard.test.tsx` (수정)
- `src/components/watchlist/WatchlistItemRow.test.tsx` (수정)

**완료**: 2026-01-09 (#43)

---

### MAINT-002: API 입력값 검증 (보안 강화) ✅
**설명**: API 쿼리 파라미터 검증 유틸리티 및 적용
**범위**:
- 입력 검증 유틸리티 생성 (`validation.ts`)
  - `validateLimit()`: 숫자 범위 검증 및 정규화
  - `safeJsonParse()`: 안전한 JSON 파싱 (try-catch 래핑)
  - `validateSymbol()`: 종목코드 유효성 검사 (6자리/12자리)
  - `normalizeSymbol()`: 종목코드 정규화 (12자리 → 6자리)
- OHLCV API: `limit` 범위 검증 (1-500)
- Screener API: `safeJsonParse` 적용, 파라미터 범위 검증
- News API: `limit` 범위 검증 (1-100)

**산출물**:
- `src/lib/validation.ts` (신규)
- `src/lib/validation.test.ts` (신규, 19개 테스트)
- `src/app/api/stocks/[symbol]/ohlcv/route.ts` (수정)
- `src/app/api/screener/route.ts` (수정)
- `src/app/api/news/route.ts` (수정)

**완료**: 2026-01-09 (#43)

---

### MAINT-003: 클라이언트 에러 바운더리 ✅
**설명**: React Error Boundary 컴포넌트 및 주요 페이지 적용
**범위**:
- ErrorBoundary 컴포넌트 생성
  - `ErrorBoundary`: 범용 클래스 컴포넌트 (fallback, onError, message props)
  - `ChartErrorBoundary`: 차트 전용 래퍼 (400px 높이 fallback)
  - `NewsErrorBoundary`: 뉴스 전용 래퍼 (간결한 fallback)
- 종목 상세 페이지 적용
  - `StockChartCard` → `ChartErrorBoundary`로 래핑
  - `NewsFeed` → `NewsErrorBoundary`로 래핑

**산출물**:
- `src/components/ErrorBoundary.tsx` (신규)
- `src/components/ErrorBoundary.test.tsx` (신규, 10개 테스트)
- `src/app/(main)/stocks/[symbol]/page.tsx` (수정)

**완료**: 2026-01-09 (#43)

---

### MAINT-004: 백테스트 차트 및 날짜 처리 버그 수정 ✅
**설명**: 백테스트 날짜 처리, OHLCV 캐시, 차트 UI 버그 수정
**범위**:

**1. 날짜 처리 버그 수정**
- BacktestConfigPanel: UTC vs 로컬 시간 불일치 문제 수정
  - `new Date(dateStr)` → `parseLocalDate(dateStr)` (로컬 자정으로 파싱)
  - `toISOString().split('T')[0]` → 로컬 날짜 포맷팅
- OHLCV 데이터(KST 자정)와 입력 날짜 일치시킴

**2. OHLCV 캐시 버그 수정**
- kis-provider.ts: 캐시에서 최신 데이터 대신 오래된 데이터를 반환하는 버그
  - `cached.slice(0, limit)` → `cached.slice(-limit)`

**3. 백테스트 엔진 개선**
- backtest-engine.ts: 마지막 거래일 매수 방지
  - 마지막 날 매수 시 바로 강제 청산되어 0일 보유 거래 발생
  - 마지막 날 매수 신호 무시하도록 수정

**4. 차트 UI 개선**
- SyncedBacktestCharts.tsx:
  - 차트 높이 조정: 가격(400→520px), 자산곡선(250→140px), 낙폭(150→140px)
  - 이동평균선 추가: 5일(노란), 10일(분홍), 20일(녹색), 60일(파란)
  - 이동평균선 범례 추가
  - 마커 필터링: 차트 데이터 범위 내의 거래만 표시

**산출물**:
- `src/components/signals/BacktestConfigPanel.tsx` (수정)
- `src/components/signals/SyncedBacktestCharts.tsx` (수정)
- `src/lib/api/kis-provider.ts` (수정)
- `src/lib/signals/backtest-engine.ts` (수정)

**완료**: 2026-01-12 (#58)

---

### MAINT-005: 내 전략 수정 폼 버그 수정 ✅
**설명**: 내 전략 수정 시 기존 데이터가 표시되지 않는 버그 수정
**범위**:
- PresetForm.tsx: useState 초기값이 마운트 시 1번만 실행되어 preset prop 변경 시 반영 안됨
- useEffect 추가하여 다이얼로그 열릴 때 폼 상태를 preset 데이터로 동기화
- handleSubmit에서 불필요한 폼 초기화 코드 제거

**산출물**:
- `src/components/signals/PresetForm.tsx` (수정)

**완료**: 2026-01-12 (#59)

---

### MAINT-006: 수식 편집기 입력 덮어쓰기 버그 수정 ✅
**설명**: 수식 편집 모드에서 사용자 입력이 정규화된 문자열로 덮어쓰여지는 버그 수정
**범위**:
- FormulaEditor.tsx: useEffect에서 condition 변경 시 formula를 덮어쓰는 문제
- 사용자 입력(소문자)과 정규화된 출력(대문자) 차이로 입력이 리셋됨
- isUserEditing 플래그 추가하여 사용자 편집 중 외부 동기화 방지
- 포커스 해제 시 플래그 리셋하여 정상 동기화 재개

**산출물**:
- `src/components/signals/FormulaEditor.tsx` (수정)

**완료**: 2026-01-12 (#63)

---

### MAINT-007: 관심종목 차트 이동평균선 범례 추가 ✅
**설명**: 관심종목 차트 상단에 활성화된 이동평균선 범례 표시
**범위**:
- StockChartWithIndicators.tsx: 이동평균선 범례 데이터 계산 (maLegendData)
- 타임프레임 버튼 옆에 색상 + 기간 범례 표시
- 반응형 레이아웃 지원

**산출물**:
- `src/components/chart/indicators/StockChartWithIndicators.tsx` (수정)

**완료**: 2026-01-12 (#64)

---

### MAINT-008: 관심테마 스파크라인 차트 개선 ✅
**설명**: 관심테마 페이지 스파크라인 차트에 실제 데이터 및 미니 캔들스틱 추가
**범위**:
- 기존 가상 데이터 대신 실제 20일 OHLCV 데이터 사용
- 스파크라인 차트 왼쪽에 최근 5개 일봉 캔들스틱 추가
- useSparklines 훅 신규 생성 (여러 종목 OHLCV 병렬 조회, 5분 캐시)
- SparklineChart 컴포넌트 확장 (ohlcv, candleCount props 추가)
- 차트 크기 조정: 50x20px → 75x24px (캔들 포함)

**산출물**:
- `/src/hooks/useSparklines.ts` (신규)
- `/src/components/themes/SparklineChart.tsx` (수정)
- `/src/components/themes/FavoriteThemeCard.tsx` (수정)

**완료**: 2026-01-15 (#67)

---

## Phase 7: 테마 시스템

### TASK-026: 테마 데이터 Provider 구현 ✅
**설명**: 네이버 금융 테마 페이지 크롤링 및 데이터 Provider 구현
**범위**:
- ThemeProvider 인터페이스 정의
- NaverThemeProvider 구현 (네이버 금융 테마 크롤링)
- MockThemeProvider 구현 (개발/테스트용)
- User-Agent 헤더 설정으로 크롤링 차단 대응
- EUC-KR 인코딩 처리
- 테마 데이터 캐싱 (5분 TTL)
- ProviderFactory 패턴으로 환경별 Provider 자동 선택

**산출물**:
- `/src/types/theme.ts` - 테마 타입 정의
- `/src/lib/api/theme-provider.ts` - Provider 인터페이스
- `/src/lib/api/naver-theme-provider.ts` - 네이버 크롤링 구현체
- `/src/lib/api/mock-theme-provider.ts` - Mock 구현체
- `/src/lib/api/theme-provider-factory.ts` - Provider 팩토리

**의존성**: 없음
**완료**: 2026-01-10 (#44)

---

### TASK-027: 테마 API 라우트 구현 ✅
**설명**: 테마 데이터 조회 및 관심 테마 관리 API
**범위**:
- 테마 목록 조회 API (`GET /api/themes`)
- 테마 상세 조회 API (`GET /api/themes/[themeId]`)
- 관심 테마 CRUD API
  - `GET /api/themes/favorites` - 관심 테마 목록
  - `POST /api/themes/favorites` - 관심 테마 추가 (중복 방지)
  - `DELETE /api/themes/favorites/[id]` - 관심 테마 삭제 (권한 검증)
  - `PUT /api/themes/favorites/reorder` - 관심 테마 순서 변경 (트랜잭션)

**산출물**:
- `/src/app/api/themes/route.ts`
- `/src/app/api/themes/[themeId]/route.ts`
- `/src/app/api/themes/favorites/route.ts`
- `/src/app/api/themes/favorites/[id]/route.ts`
- `/src/app/api/themes/favorites/reorder/route.ts`

**의존성**: TASK-026
**완료**: 2026-01-10 (#44)

---

### TASK-028: 테마 DB 스키마 및 훅 ✅
**설명**: 관심 테마 저장을 위한 DB 스키마 및 React 훅 구현
**범위**:
- FavoriteTheme Prisma 모델 추가
- useThemes 훅 (테마 목록 조회, 페이지네이션)
- useTheme 훅 (단일 테마 상세 조회)
- useFavoriteThemes 훅 (관심 테마 CRUD, 낙관적 업데이트)
- localStorage 기반 대체 저장소 (비로그인 사용자용)
- Zustand persist 미들웨어로 localStorage 자동 동기화

**산출물**:
- `prisma/schema.prisma` 수정 (FavoriteTheme 모델 추가)
- `/src/hooks/useThemes.ts`
- `/src/hooks/useFavoriteThemes.ts`
- `/src/stores/favoriteThemeStore.ts` (Zustand, 비로그인용)

**의존성**: TASK-026, TASK-027
**완료**: 2026-01-10 (#44)

---

### TASK-029: 오늘의 테마 페이지 UI ✅
**설명**: `/themes` 페이지 컴포넌트 구현
**범위**:
- 테마 페이지 레이아웃
- 상단 요약 카드 (핫 테마, 급등/급락 테마)
- 필터 영역 (전체/상승/하락, 정렬, 검색)
- 테마 카드 그리드 (1~3열 반응형)
- 페이지네이션 (10개씩)
- 테마 상세 모달 (주도주 목록, 상승/하락 비율)
- 관심 테마 즐겨찾기 토글

**산출물**:
- `/src/app/(main)/themes/page.tsx`
- `/src/components/themes/ThemeSummaryCards.tsx`
- `/src/components/themes/ThemeFilters.tsx`
- `/src/components/themes/ThemeCard.tsx`
- `/src/components/themes/ThemeGrid.tsx`
- `/src/components/themes/ThemeDetailModal.tsx`

**의존성**: TASK-027, TASK-028
**완료**: 2026-01-10 (#44)

---

### TASK-030: 관심 테마 페이지 UI ✅
**설명**: `/themes/favorites` 페이지 컴포넌트 구현
**범위**:
- 관심 테마 대시보드 레이아웃
- 2열 반응형 그리드 (md 이상)
- 드래그 정렬 인프라 (dragHandleProps)
- 스파크라인 차트 (주도주 20일 종가)
  - 크기: 60px x 24px (컴팩트)
  - 상승: red-600, 하락: blue-600 (WCAG AA 충족)
  - SVG polyline 렌더링
- 세로 스택 레이아웃 (테마 정보 → 상승/하락 비율 → 주도주)
- 접근성 개선
  - 드래그 핸들: `role="button"`, `aria-label="순서 변경"`
  - 삭제 버튼: `aria-label="${테마명} 관심 해제"`
  - Progress bar: `aria-label="상승 종목 비율 N%"`

**산출물**:
- `/src/app/(main)/themes/favorites/page.tsx`
- `/src/components/themes/FavoriteThemeCard.tsx`
- `/src/components/themes/SparklineChart.tsx`

**의존성**: TASK-029
**완료**: 2026-01-10 (#44)

---

### TASK-031: 테마 기능 테스트 및 마무리 ✅
**설명**: 테스트 및 네비게이션 통합
**범위**:
- Header에 "테마" 메뉴 추가 (네비게이션 통합)
- MobileNav에 "테마" 메뉴 추가
- skeleton.tsx UI 컴포넌트 추가
- ~~ThemeProvider 단위 테스트~~ (추후)
- ~~E2E 테스트 시나리오 추가~~ (추후)

**산출물**:
- `/src/components/layout/Header.tsx` (수정)
- `/src/components/layout/MobileNav.tsx` (수정)
- `/src/components/ui/skeleton.tsx` (신규)

**의존성**: TASK-029, TASK-030
**완료**: 2026-01-10 (#44)

---

### TASK-032: 관심 테마 주도주 표시 개선 ✅
**설명**: 관심 테마의 주도주 표시 기능 개선 (모멘텀 점수 기반 + 사용자 선택)
**범위**:
- 주도주 표시 개수: 3개 → 5개로 확대
- 모멘텀 점수 계산 로직 구현
  - 상승률 30%, 거래량 25%, 거래대금 25%, 시가총액 20%
  - Min-Max 정규화로 지표별 점수 산출
- 테마 내 전체 종목 조회 API (`GET /api/themes/[themeId]/stocks`)
- 종목 선택 모달 UI (StockSelectModal)
- 사용자 선택 종목 저장 (DB customStocks 필드)
- 비로그인 사용자: localStorage 저장 지원

**산출물**:
- `/src/lib/api/momentum-calculator.ts` - 모멘텀 점수 계산
- `/src/app/api/themes/[themeId]/stocks/route.ts` - 테마 종목 API
- `/src/components/themes/StockSelectModal.tsx` - 종목 선택 모달
- `/src/components/themes/FavoriteThemeCard.tsx` (수정)
- `/src/hooks/useThemes.ts` (수정, useThemeStocks 훅 추가)
- `/src/hooks/useFavoriteThemes.ts` (수정, updateCustomStocks 추가)
- `/src/stores/favoriteThemeStore.ts` (수정, customStocks 지원)
- `/src/types/theme.ts` (수정, ThemeStock, MomentumWeights 타입)
- `prisma/schema.prisma` (수정, customStocks 필드)

**의존성**: TASK-030
**완료**: 2026-01-10 (#45)

---

### TASK-033: 관심종목 그룹명 변경 기능 ✅
**설명**: 관심종목 그룹의 이름 변경 및 삭제 기능 UI 추가
**범위**:
- WatchlistGroupCardWithSelection 컴포넌트에 그룹 관리 기능 추가
- 드롭다운 메뉴(⋯ 버튼) 추가
- 이름 변경 다이얼로그 (Enter 키 저장 지원)
- 삭제 확인 다이얼로그
- 기존 handleRenameGroup, handleDeleteGroup 핸들러 연결

**산출물**:
- `/src/app/(main)/watchlist/page.tsx` (수정)
  - DropdownMenu, Pencil, MoreHorizontal 아이콘 import 추가
  - WatchlistGroupCardWithSelection에 onRenameGroup, onDeleteGroup props 추가
  - 이름 변경/삭제 다이얼로그 구현

**의존성**: TASK-012
**완료**: 2026-01-11 (#46)

---

### TASK-034: 매매 신호 시스템 구현 ✅
**설명**: 프리셋 CRUD, 상세 백테스트, 알림 시스템, 신호 히스토리 기능 구현
**범위**:

**1. DB 스키마 확장 (Prisma)**
- `SignalPreset` - 전략 프리셋 (성능 메타데이터: winRate, totalReturn, maxDrawdown, sharpeRatio)
- `SignalHistory` - 신호 발생 이력 (진입/청산, 손익률)
- `BacktestRun` - 백테스트 실행 기록 (설정, 통계, 거래내역)
- `SignalAlert` - 알림 설정 (프리셋별, 종목별, 이메일/푸시)
- `AlertNotification` - 알림 발송 기록 (읽음 처리)

**2. 백테스트 엔진**
- `BacktestEngine` - 거래 시뮬레이션 클래스
  - 매수/매도 신호 기반 포지션 진입/청산
  - 수수료, 슬리피지 적용
  - 자산 곡선, 낙폭 곡선 계산
- `statistics.ts` - 통계 지표 계산 모듈
  - 샤프 비율, 소르티노 비율, 칼마 비율
  - MDD (최대 낙폭), 이익 팩터, 기대값
  - 월별 수익률, 연속 승/패

**3. API 엔드포인트 (7개)**
- `GET/POST /api/signals/presets` - 프리셋 목록/생성
- `GET/PUT/DELETE /api/signals/presets/[id]` - 프리셋 상세/수정/삭제
- `POST /api/signals/backtest` - 백테스트 실행
- `GET/POST /api/signals/history` - 신호 이력 조회/생성
- `GET/POST /api/signals/alerts` - 알림 설정 목록/생성
- `PUT/DELETE /api/signals/alerts/[id]` - 알림 수정/삭제
- `GET/POST /api/signals/alerts/notifications` - 알림 목록/읽음처리

**4. React 훅 (4개)**
- `useSignalPresets` - 프리셋 CRUD (TanStack Query)
- `useBacktest` - 백테스트 실행 및 설정 관리
- `useSignalHistory` - 신호 이력 조회
- `useSignalAlerts` - 알림 관리 (30초 폴링)

**5. UI 컴포넌트 (15개)**
- `SymbolSelect` - 종목 검색/선택 (자동완성)
- `PresetManager` - 전략 관리 (탭: 기본/내 전략)
- `PresetCard` - 전략 카드 (성능 지표 표시)
- `PresetForm` - 전략 생성/수정 다이얼로그
- `BacktestConfigPanel` - 백테스트 설정 패널 (기간, 자본금, 수수료)
- `BacktestSummaryCards` - 결과 요약 카드 (총수익률, 승률, MDD, 샤프, 거래수)
- `BacktestDetailStats` - 상세 통계 (10개 지표)
- `EquityCurveChart` - 자산 곡선 차트 (Lightweight Charts)
- `DrawdownChart` - 낙폭 차트 (Area Series)
- `MonthlyReturnsTable` - 월별 수익률 히트맵 테이블
- `TradeHistoryTable` - 거래 내역 테이블 (정렬, 페이지네이션)
- `alert.tsx`, `collapsible.tsx`, `table.tsx`, `textarea.tsx` - shadcn/ui 컴포넌트

**6. 상태 관리**
- `signalStore` (Zustand) - 전략, 설정, 결과, UI 상태 관리
- localStorage persist (설정값 유지)

**7. 페이지**
- `/signals` - 매매 신호 메인 페이지
  - 2-panel 레이아웃 (사이드바: 설정 / 메인: 결과)
  - 탭 UI (상세통계 | 월별수익률 | 거래내역)

**산출물**:
- `prisma/schema.prisma` (수정, 5개 모델 추가)
- `/src/lib/signals/backtest-engine.ts`
- `/src/lib/signals/statistics.ts`
- `/src/lib/signals/alert-service.ts`
- `/src/app/api/signals/presets/route.ts`
- `/src/app/api/signals/presets/[id]/route.ts`
- `/src/app/api/signals/backtest/route.ts`
- `/src/app/api/signals/history/route.ts`
- `/src/app/api/signals/alerts/route.ts`
- `/src/app/api/signals/alerts/[id]/route.ts`
- `/src/app/api/signals/alerts/notifications/route.ts`
- `/src/hooks/useSignalPresets.ts`
- `/src/hooks/useBacktest.ts`
- `/src/hooks/useSignalHistory.ts`
- `/src/hooks/useSignalAlerts.ts`
- `/src/stores/signalStore.ts`
- `/src/app/(main)/signals/page.tsx`
- `/src/components/signals/*.tsx` (11개 컴포넌트)
- `/src/components/ui/*.tsx` (4개 컴포넌트)

**의존성**: TASK-009, TASK-010
**완료**: 2026-01-11 (#47)

---

### TASK-035: 매매 전략 조건 빌더 기능 개선 ✅
**설명**: 복잡한 조건 조합을 위한 그룹(괄호) 기능 및 수식 편집기 구현
**범위**:

**1. 상단 메뉴 매매신호 추가**
- Header.tsx: `/signals` → `매매신호` 링크 추가
- MobileNav.tsx: Activity 아이콘과 함께 매매신호 메뉴 추가

**2. 조건 그룹 (괄호) 기능**
- ConditionGroup 컴포넌트 구현
  - 중첩 가능한 조건 그룹 (최대 3단계)
  - AND/OR 논리 연산자 전환
  - 깊이에 따른 색상 구분 (시각적 계층 표현)
- ConditionBuilder에 [그룹] 버튼 추가
- 복잡한 조건 표현 가능: `(A OR B) AND C`

**3. 수식 편집기 기능**
- 수식 파서/생성기 (formula.ts)
  - `conditionToFormula()`: Condition 객체 → 수식 문자열
  - `parseFormula()`: 수식 문자열 → Condition 객체
  - `validateFormula()`: 유효성 검사
- 지원 지표: Price, Volume, SMA, EMA, RSI, MACD, Stochastic, Bollinger
- 지원 연산자: >, <, >=, <=, ==, cross_above, cross_below, AND, OR
- 괄호를 통한 우선순위 지정

**4. 수식 편집기 UI (FormulaEditor.tsx)**
- 실시간 수식 입력 및 유효성 검사
- 예제 수식 팝오버
- 지표/연산자 도움말 (클릭하여 삽입)
- 파싱 결과 미리보기
- 유효성 상태 아이콘 표시

**5. PresetForm 개선**
- UI 빌더 / 수식 모드 전환 토글 버튼
- 두 모드 간 자유롭게 전환 가능
- 조건 데이터 양방향 동기화

**6. 문서화**
- docs/FORMULA_SYNTAX.md 생성
- 지표, 연산자, 문법 규칙, 예제 상세 문서화

**수식 예시**:
```
RSI(14) < 30 AND SMA(20) > SMA(60)
(RSI(14) < 30 OR MACD cross_above MACD_Signal) AND Volume > 1000000
SMA(5) cross_above SMA(20) AND MACD > 0
```

**산출물**:
- `/src/components/signals/ConditionGroup.tsx` (신규)
- `/src/components/signals/FormulaEditor.tsx` (신규)
- `/src/lib/signals/formula.ts` (신규)
- `/src/components/ui/popover.tsx` (신규)
- `/src/components/layout/Header.tsx` (수정)
- `/src/components/layout/MobileNav.tsx` (수정)
- `/src/components/signals/ConditionBuilder.tsx` (수정)
- `/src/components/signals/PresetForm.tsx` (수정)
- `/docs/FORMULA_SYNTAX.md` (신규)

**의존성**: TASK-034
**완료**: 2026-01-12 (#49)

---

### TASK-036: 신고가/신저가 지표 지원 ✅
**설명**: 수식 편집기에 신고가/신저가 관련 지표 추가
**범위**:

**1. 신규 지표 타입 추가**
- `high_n`: N일 최고가 (최근 N일간 고가 중 최댓값)
- `low_n`: N일 최저가 (최근 N일간 저가 중 최솟값)
- `High_52W`: 52주(252거래일) 최고가 (= High(252))
- `Low_52W`: 52주(252거래일) 최저가 (= Low(252))

**2. 수식 문법**
```
High(20)              # 20일 최고가
Low(20)               # 20일 최저가
High_52W              # 52주 최고가
Low_52W               # 52주 최저가
Price > High(20)      # 신고가 돌파
Price cross_above High(20)  # 신고가 돌파 시점
```

**3. 구현 내용**
- `types.ts`: SignalIndicator에 high_n, low_n 추가, IndicatorCache 확장
- `formula.ts`: 파서/생성기에서 High, Low, High_52W, Low_52W 지원
- `conditions.ts`: 슬라이딩 윈도우 기반 최고/최저가 계산 로직
- `engine.ts`: 지표 표시 이름 추가 (20일 최고가, 52주 최고가 등)
- `FORMULA_SYNTAX.md`: 신고가/신저가 지표 문법 및 예제 문서화

**산출물**:
- `/src/lib/signals/types.ts` (수정)
- `/src/lib/signals/formula.ts` (수정)
- `/src/lib/signals/conditions.ts` (수정)
- `/src/lib/signals/engine.ts` (수정)
- `/docs/FORMULA_SYNTAX.md` (수정)

**의존성**: TASK-035
**완료**: 2026-01-12 (#50)

---

## 태스크 의존성 다이어그램

```
TASK-001 (스캐폴딩)
    ├── TASK-002 (DB 설계)
    │       └── TASK-003 (인증)
    │               └── TASK-011 (관심종목 BE)
    │                       └── TASK-012 (관심종목 FE)
    │               └── TASK-018 (설정)
    ├── TASK-004 (시세 API)
    │       ├── TASK-006 (캔들차트)
    │       │       ├── TASK-008 (지표 렌더링)
    │       │       │       └── TASK-016 (종목상세)
    │       │       └── TASK-010 (신호 UI)
    │       │               └── TASK-016 (종목상세)
    │       ├── TASK-012 (관심종목 FE)
    │       └── TASK-013 (스크리너 BE)
    │               └── TASK-014 (스크리너 FE)
    └── TASK-005 (뉴스 API)
            └── TASK-015 (뉴스피드)
                    └── TASK-016 (종목상세)

TASK-007 (지표 계산) ─── 독립
    ├── TASK-008 (지표 렌더링)
    └── TASK-009 (신호 엔진)
            └── TASK-010 (신호 UI)

TASK-016 + TASK-014 + TASK-012 + TASK-015
    └── TASK-017 (대시보드)

모든 기능 완료
    ├── TASK-019 (반응형)
    ├── TASK-020 (성능)
    └── TASK-021 (테스트)
```

---

## 우선순위 실행 순서

| 순서 | 태스크 | 병렬 가능 |
|------|--------|-----------|
| 1 | TASK-001 | - |
| 2 | TASK-002, TASK-004, TASK-005, TASK-007 | O |
| 3 | TASK-003, TASK-006, TASK-009 | O |
| 4 | TASK-008, TASK-010, TASK-011, TASK-013, TASK-015 | O |
| 5 | TASK-012, TASK-014, TASK-016 | O |
| 6 | TASK-017, TASK-018 | O |
| 7 | TASK-019, TASK-020, TASK-021 | O |

---

## 버전 이력
| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 0.1 | 2026-01-01 | 초안 작성 |
| 0.2 | 2026-01-01 | Phase 1을 Mock 기반으로 변경, Phase 6 (실서비스 연동) 추가 |
| 0.3 | 2026-01-03 | TASK-022~025 완료 표시, 섹터 시스템 태스크 추가 |
| 0.4 | 2026-01-04 | 전체 태스크 완료 상태 업데이트 (코드베이스 분석 기반) |
| 0.5 | 2026-01-04 | TASK-008, TASK-016 차트 기능 개선 내역 반영 (지표 저장, 레이아웃 개선) |
| 0.6 | 2026-01-04 | TASK-012 관심종목 기능 대폭 개선 (2-panel 레이아웃, 자동순환, 삭제 기능) |
| 0.7 | 2026-01-04 | TASK-004, TASK-013, TASK-014 스크리너 기능 개선 (#40 - HTS 조회상위 API 연동, 순위 조건 필터 기능) |
| 0.8 | 2026-01-04 | TASK-012 종목 검색 기능 추가 (#41 - 혼합 검색 방식, 동적 마스터 데이터) |
| 0.9 | 2026-01-09 | 미완료 태스크 전체 완료 (#42 - TASK-010 조건빌더UI, TASK-018 API연동, TASK-019~021 E2E테스트/성능/반응형) |
| 1.0 | 2026-01-09 | 보완 사항 섹션 추가 (#43 - MAINT-001~003: 테스트 수정, API 보안 강화, 에러 바운더리) |
| 1.1 | 2026-01-10 | Phase 7 테마 시스템 추가 (TASK-026~031: 오늘의 테마, 관심 테마 기능) |
| 1.2 | 2026-01-10 | Phase 7 테마 시스템 완료 (#44 - Provider, API, 훅, UI, 네비게이션 통합, 접근성 개선) |
| 1.3 | 2026-01-10 | TASK-032 관심 테마 주도주 표시 개선 (#45 - 모멘텀 점수 기반 5종목, 사용자 선택 기능) |
| 1.4 | 2026-01-11 | TASK-033 관심종목 그룹명 변경 기능 추가 (#46) |
| 1.5 | 2026-01-11 | TASK-034 매매 신호 시스템 구현 (#47) - 백테스트 엔진, 프리셋 관리, 알림 시스템, /signals 페이지 |
| 1.6 | 2026-01-12 | TASK-035 매매 전략 조건 빌더 기능 개선 (#49) - 그룹(괄호) 기능, 수식 편집기, 문법 문서화 |
| 1.7 | 2026-01-12 | TASK-036 신고가/신저가 지표 지원 (#50) - High(N), Low(N), High_52W, Low_52W |
| 1.8 | 2026-01-12 | MAINT-006~007 수식 편집기 버그 수정 (#63), 이동평균선 범례 추가 (#64) |
| 1.9 | 2026-01-15 | MAINT-008 관심테마 스파크라인 차트 개선 (#67) - 실제 데이터, 미니 캔들스틱 |

---

## 진행 상황 요약

| Phase | 태스크 수 | 완료 | 진행중 | 미착수 |
|-------|----------|------|--------|--------|
| Phase 0 | 3 | 3 | 0 | 0 |
| Phase 1 | 2 | 2 | 0 | 0 |
| Phase 2 | 5 | 5 | 0 | 0 |
| Phase 3 | 5 | 5 | 0 | 0 |
| Phase 4 | 3 | 3 | 0 | 0 |
| Phase 5 | 3 | 3 | 0 | 0 |
| Phase 6 | 4 | 4 | 0 | 0 |
| Phase 7 | 11 | 11 | 0 | 0 |
| Maintenance | 8 | 8 | 0 | 0 |
| **합계** | **44** | **44** | **0** | **0** |

### 완료 태스크 (✅): 44개
- TASK-001~036 전체 완료
- MAINT-001~008 보완 사항 완료

### 주요 완료 이력

| 날짜 | 완료 태스크 | 이슈 |
|------|-------------|------|
| 2026-01-01 | TASK-001~003 | - |
| 2026-01-02 | TASK-006~012 | - |
| 2026-01-03 | TASK-004~005, TASK-013~018, TASK-022~025 | #26~31 |
| 2026-01-04 | 기능 개선 (관심종목, 스크리너) | #39~41 |
| 2026-01-09 | TASK-010, 018~021 최종 완료 | #42 |
| 2026-01-09 | 보완 사항 구현 (테스트/보안/에러 바운더리) | #43 |
| 2026-01-10 | TASK-026~031 테마 시스템 완료 | #44 |
| 2026-01-10 | TASK-032 관심 테마 주도주 표시 개선 | #45 |
| 2026-01-11 | TASK-033 관심종목 그룹명 변경 기능 | #46 |
| 2026-01-11 | TASK-034 매매 신호 시스템 구현 | #47 |
| 2026-01-12 | TASK-035 매매 전략 조건 빌더 기능 개선 (그룹/수식 편집기) | #49 |
| 2026-01-12 | TASK-036 신고가/신저가 지표 지원 | #50 |
| 2026-01-12 | MAINT-006 수식 편집기 버그 수정 | #63 |
| 2026-01-12 | MAINT-007 관심종목 차트 이동평균선 범례 추가 | #64 |
| 2026-01-15 | MAINT-008 관심테마 스파크라인 차트 개선 | #67 |
