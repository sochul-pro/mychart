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

### TASK-010: 매매 신호 시스템 - UI 🔄
**설명**: 조건 빌더 UI 및 차트 신호 마커 표시
**범위**:
- ~~조건 빌더 UI (드래그앤드롭 또는 폼 기반)~~ (미완료)
- 프리셋 전략 선택 UI (StrategySelector)
- 차트에 매수(▲)/매도(▼) 마커 렌더링 (SignalMarkers)
- 전략 저장/불러오기 (DB 스키마 완료)
- 백테스트 결과 표시 (BacktestResult)

**산출물**: `/components/signals/`
- `SignalMarkers.tsx` ✅
- `StrategySelector.tsx` ✅
- `BacktestResult.tsx` ✅
- 조건 빌더 UI ❌ (미완료)

**의존성**: TASK-006, TASK-009
**상태**: 80% 완료 - 조건 빌더 UI 미완료, 종목 상세 페이지 통합 필요

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

### TASK-018: 설정 페이지 🔄
**설명**: 계정, 알림, 차트 기본값 설정
**범위**:
- 계정 정보 표시 (이메일 읽기전용)
- ~~알림 설정 (이메일/푸시)~~ "준비 중" 표시
- 차트 기본 타임프레임 설정 UI
- 테마 설정 UI (다크/라이트/시스템)
- 기본 지표 토글 UI

**산출물**: `/app/(main)/settings/page.tsx`
**의존성**: TASK-003
**상태**: 70% 완료 - UI 완성, API 연동 미완료

---

## Phase 5: 마무리

### TASK-019: 반응형 디자인 최적화 🔄
**설명**: 모바일/태블릿 대응
**범위**:
- 전체 페이지 반응형 점검
- 모바일 네비게이션 (MobileNav 컴포넌트)
- 터치 인터랙션 최적화
- 차트 모바일 UX 개선

**산출물**: 반응형 완성된 UI
**의존성**: TASK-016, TASK-017, TASK-018
**상태**: 60% 완료 - 기본 반응형 완료, 모바일 네비게이션 인프라 있음, 세부 최적화 필요

---

### TASK-020: 성능 최적화 🔄
**설명**: 로딩 속도 및 렌더링 성능 개선
**범위**:
- 차트 렌더링 최적화 (memo 적용)
- API 응답 캐싱 (30초~600초 TTL) ✅
- React 컴포넌트 메모이제이션 ✅
- ~~페이지 로딩 2초 이내 달성~~ (미측정)
- ~~이미지/번들 최적화~~ (미완료)
- ~~Lighthouse 성능 점수 측정~~ (미완료)

**산출물**: 캐싱 시스템 구축 완료
**의존성**: 모든 기능 완료 후
**상태**: 50% 완료 - 캐싱 완료, Lighthouse 측정 및 번들 최적화 필요

---

### TASK-021: 테스트 및 QA 🔄
**설명**: 단위/통합 테스트 및 QA
**범위**:
- 핵심 로직 단위 테스트 (지표 계산, 신호 엔진) ✅
- 컴포넌트 테스트 (15+ 테스트 파일) ✅
- ~~API 통합 테스트~~ (부분)
- ~~E2E 테스트~~ (미완료)
- ~~크로스 브라우저 테스트~~ (미완료)

**테스트 인프라**:
- Vitest + React Testing Library
- JSDOM 환경

**산출물**: 핵심 로직 테스트 완료
**의존성**: 모든 기능 완료 후
**상태**: 40% 완료 - 단위/컴포넌트 테스트 있음, E2E 및 통합 테스트 미완료

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

---

## 진행 상황 요약

| Phase | 태스크 수 | 완료 | 진행중 | 미착수 |
|-------|----------|------|--------|--------|
| Phase 0 | 3 | 3 | 0 | 0 |
| Phase 1 | 2 | 2 | 0 | 0 |
| Phase 2 | 5 | 4 | 1 | 0 |
| Phase 3 | 5 | 5 | 0 | 0 |
| Phase 4 | 3 | 2 | 1 | 0 |
| Phase 5 | 3 | 0 | 3 | 0 |
| Phase 6 | 4 | 4 | 0 | 0 |
| **합계** | **25** | **20** | **5** | **0** |

### 완료 태스크 (✅): 20개
TASK-001~009, TASK-011~017, TASK-022~025

### 진행중 태스크 (🔄): 5개
- TASK-010: 매매 신호 UI (80%) - 조건 빌더 UI 미완료
- TASK-018: 설정 페이지 (70%) - API 연동 미완료
- TASK-019: 반응형 최적화 (60%) - 세부 최적화 필요
- TASK-020: 성능 최적화 (50%) - Lighthouse 측정 필요
- TASK-021: 테스트 및 QA (40%) - E2E 테스트 미완료
