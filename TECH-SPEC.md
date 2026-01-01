# MyChart TECH-SPEC (기술 명세서)

## 1. 기술 스택 개요

| 영역 | 기술 | 버전 |
|------|------|------|
| **프론트엔드** | Next.js (App Router) | 15.x |
| **언어** | TypeScript | 5.x |
| **스타일링** | Tailwind CSS + shadcn/ui | 3.x |
| **상태관리** | Zustand + TanStack Query | - |
| **차트** | Lightweight Charts (TradingView) | 4.x |
| **백엔드** | Next.js API Routes | 15.x |
| **ORM** | Prisma | 6.x |
| **데이터베이스** | PostgreSQL | 16.x |
| **캐시** | Redis (선택적) | 7.x |
| **인증** | NextAuth.js | 5.x |
| **배포** | Vercel / Docker | - |

---

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         클라이언트                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Browser   │  │   Mobile    │  │   Tablet    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Application                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     App Router (Frontend)                  │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │ │
│  │  │Dashboard │ │Screener  │ │Chart     │ │Watchlist │      │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    API Routes (Backend)                    │ │
│  │  /api/stocks  /api/watchlist  /api/signals  /api/news     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        데이터 계층                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │    Redis     │  │External APIs │          │
│  │  (Primary)   │  │   (Cache)    │  │(증권사 API)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 디렉토리 구조

```
mychart/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # 인증 관련 라우트 그룹
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (main)/               # 메인 앱 라우트 그룹
│   │   │   ├── dashboard/        # 대시보드
│   │   │   ├── screener/         # 주도주 스크리너
│   │   │   ├── stocks/[symbol]/  # 종목 상세 (차트)
│   │   │   ├── watchlist/        # 관심종목
│   │   │   └── settings/         # 설정
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/
│   │   │   ├── stocks/
│   │   │   ├── watchlist/
│   │   │   ├── signals/
│   │   │   └── news/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                   # shadcn/ui 컴포넌트
│   │   ├── charts/               # 차트 관련 컴포넌트
│   │   │   ├── CandlestickChart.tsx
│   │   │   ├── VolumeChart.tsx
│   │   │   ├── IndicatorPanel.tsx
│   │   │   └── SignalMarkers.tsx
│   │   ├── screener/             # 스크리너 컴포넌트
│   │   ├── watchlist/            # 관심종목 컴포넌트
│   │   └── news/                 # 뉴스 컴포넌트
│   ├── lib/
│   │   ├── db.ts                 # Prisma 클라이언트
│   │   ├── auth.ts               # NextAuth 설정
│   │   ├── api/                  # 외부 API 클라이언트
│   │   │   └── stock-api.ts
│   │   └── indicators/           # 기술적 지표 계산
│   │       ├── moving-average.ts
│   │       ├── rsi.ts
│   │       ├── macd.ts
│   │       ├── bollinger.ts
│   │       └── index.ts
│   ├── hooks/                    # 커스텀 훅
│   │   ├── useStockData.ts
│   │   ├── useWatchlist.ts
│   │   └── useSignals.ts
│   ├── stores/                   # Zustand 스토어
│   │   ├── chart-store.ts
│   │   └── user-store.ts
│   ├── types/                    # TypeScript 타입
│   │   ├── stock.ts
│   │   ├── indicator.ts
│   │   └── signal.ts
│   └── utils/                    # 유틸리티 함수
├── prisma/
│   ├── schema.prisma             # DB 스키마
│   └── migrations/
├── public/
├── tests/
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. 데이터베이스 스키마 (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 사용자
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  watchlistGroups WatchlistGroup[]
  signalPresets   SignalPreset[]
  chartSettings   ChartSettings?
}

// 관심종목 그룹
model WatchlistGroup {
  id        String   @id @default(cuid())
  name      String
  order     Int      @default(0)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  items     WatchlistItem[]

  @@index([userId])
}

// 관심종목 항목
model WatchlistItem {
  id          String   @id @default(cuid())
  symbol      String   // 종목코드 (예: 005930)
  name        String   // 종목명 (예: 삼성전자)
  order       Int      @default(0)
  memo        String?  // 메모
  targetPrice Float?   // 목표가
  buyPrice    Float?   // 매수가
  groupId     String
  group       WatchlistGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([groupId])
  @@index([symbol])
}

// 종목 정보 (캐시)
model Stock {
  symbol      String   @id // 종목코드
  name        String   // 종목명
  market      String   // KOSPI, KOSDAQ
  sector      String?  // 섹터
  updatedAt   DateTime @updatedAt
}

// 매매 신호 프리셋
model SignalPreset {
  id        String   @id @default(cuid())
  name      String
  buyRules  Json     // 매수 조건 JSON
  sellRules Json     // 매도 조건 JSON
  isDefault Boolean  @default(false)
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

// 차트 설정
model ChartSettings {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  defaultInterval String   @default("D") // D, W, M
  indicators      Json     // 활성화된 지표 목록
  theme           String   @default("dark")
  updatedAt       DateTime @updatedAt
}
```

---

## 5. API 엔드포인트 설계

### 5.1 인증 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/auth/me` | 현재 사용자 정보 |

### 5.2 주식 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/stocks` | 종목 목록 조회 |
| GET | `/api/stocks/:symbol` | 종목 상세 정보 |
| GET | `/api/stocks/:symbol/chart` | 차트 데이터 (OHLCV) |
| GET | `/api/stocks/:symbol/news` | 종목 뉴스 |

### 5.3 스크리너 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/screener/leaders` | 주도주 목록 |
| GET | `/api/screener/volume` | 거래량 급증 종목 |
| GET | `/api/screener/high` | 신고가 종목 |
| GET | `/api/screener/foreign` | 외국인 순매수 |

### 5.4 관심종목 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/watchlist` | 그룹 목록 조회 |
| POST | `/api/watchlist` | 그룹 생성 |
| PUT | `/api/watchlist/:groupId` | 그룹 수정 |
| DELETE | `/api/watchlist/:groupId` | 그룹 삭제 |
| POST | `/api/watchlist/:groupId/items` | 종목 추가 |
| PUT | `/api/watchlist/:groupId/items/:itemId` | 종목 수정 |
| DELETE | `/api/watchlist/:groupId/items/:itemId` | 종목 삭제 |

### 5.5 매매 신호 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/signals/presets` | 프리셋 목록 |
| POST | `/api/signals/presets` | 프리셋 생성 |
| PUT | `/api/signals/presets/:id` | 프리셋 수정 |
| DELETE | `/api/signals/presets/:id` | 프리셋 삭제 |
| POST | `/api/signals/calculate` | 신호 계산 |

---

## 6. 프론트엔드 상세

### 6.1 주요 페이지 구성

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 랜딩 | `/` | 서비스 소개, 로그인 유도 |
| 로그인 | `/login` | 로그인 폼 |
| 회원가입 | `/register` | 회원가입 폼 |
| 대시보드 | `/dashboard` | 관심종목 요약, 주도주 하이라이트 |
| 스크리너 | `/screener` | 주도주 필터링 및 목록 |
| 종목 상세 | `/stocks/[symbol]` | 차트 + 뉴스 + 정보 |
| 관심종목 | `/watchlist` | 그룹별 관심종목 관리 |
| 설정 | `/settings` | 계정, 알림, 차트 설정 |

### 6.2 차트 컴포넌트 구조

```
ChartContainer
├── ChartToolbar          # 시간 프레임, 지표 선택
├── MainChart             # 캔들스틱 + 이동평균선
│   └── SignalMarkers     # 매수/매도 신호
├── VolumeChart           # 거래량 차트
└── IndicatorPanels       # 보조 지표 (RSI, MACD 등)
```

### 6.3 상태 관리 전략

| 영역 | 상태 관리 | 용도 |
|------|----------|------|
| 서버 데이터 | TanStack Query | 주식 데이터, 관심종목, 뉴스 |
| UI 상태 | Zustand | 차트 설정, 선택된 지표 |
| 폼 상태 | React Hook Form | 로그인, 설정 폼 |

---

## 7. 기술적 지표 구현

### 7.1 지원 지표 목록

| 카테고리 | 지표 | 파라미터 |
|----------|------|----------|
| 추세 | SMA (단순이동평균) | period: 5, 10, 20, 60, 120 |
| 추세 | EMA (지수이동평균) | period: 5, 10, 20, 60, 120 |
| 추세 | MACD | fast: 12, slow: 26, signal: 9 |
| 모멘텀 | RSI | period: 14 |
| 모멘텀 | Stochastic | k: 14, d: 3, smooth: 3 |
| 변동성 | Bollinger Bands | period: 20, stdDev: 2 |
| 변동성 | ATR | period: 14 |
| 거래량 | OBV | - |
| 거래량 | Volume MA | period: 20 |

### 7.2 지표 계산 인터페이스

```typescript
// types/indicator.ts
interface IndicatorConfig {
  type: IndicatorType;
  params: Record<string, number>;
  visible: boolean;
  color?: string;
}

interface IndicatorResult {
  time: number;
  value: number | Record<string, number>;
}

// lib/indicators/index.ts
function calculateIndicator(
  data: OHLCV[],
  config: IndicatorConfig
): IndicatorResult[];
```

---

## 8. 매매 신호 시스템

### 8.1 조건 빌더 스키마

```typescript
// types/signal.ts
interface SignalRule {
  id: string;
  indicator: IndicatorType;
  params: Record<string, number>;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'cross_above' | 'cross_below';
  value: number | 'upper_band' | 'lower_band' | 'signal_line';
}

interface SignalPreset {
  id: string;
  name: string;
  buyRules: {
    rules: SignalRule[];
    logic: 'AND' | 'OR';
  };
  sellRules: {
    rules: SignalRule[];
    logic: 'AND' | 'OR';
  };
}
```

### 8.2 기본 프리셋

| 프리셋 | 매수 조건 | 매도 조건 |
|--------|----------|----------|
| RSI 과매도/과매수 | RSI < 30 | RSI > 70 |
| 이평선 골든크로스 | MA5 > MA20 (크로스) | MA5 < MA20 (크로스) |
| 볼린저밴드 터치 | 가격 < 하단밴드 | 가격 > 상단밴드 |
| MACD 크로스 | MACD > Signal (크로스) | MACD < Signal (크로스) |

---

## 9. 외부 API 연동 (주식 데이터)

### 9.1 데이터 소스 추상화

```typescript
// lib/api/stock-api.ts
interface StockDataProvider {
  // 종목 정보
  getStockInfo(symbol: string): Promise<StockInfo>;

  // OHLCV 데이터
  getOHLCV(symbol: string, interval: string, limit: number): Promise<OHLCV[]>;

  // 현재가
  getQuote(symbol: string): Promise<Quote>;

  // 호가
  getOrderbook(symbol: string): Promise<Orderbook>;
}

// 구현체는 나중에 결정된 API에 맞춰 개발
class KISProvider implements StockDataProvider { ... }
class KiwoomProvider implements StockDataProvider { ... }
class MockProvider implements StockDataProvider { ... } // 개발용
```

### 9.2 개발 단계 데이터 전략

1. **Phase 1**: Mock 데이터로 UI 개발
2. **Phase 2**: 무료 API (Yahoo Finance 등) 연동
3. **Phase 3**: 증권사 API 연동 (한투/키움)

---

## 10. 보안 및 인증

### 10.1 인증 플로우

```
1. 사용자 로그인 (이메일/비밀번호)
2. NextAuth.js가 세션 생성
3. JWT 토큰 발급 (httpOnly 쿠키)
4. API 요청 시 토큰 자동 첨부
5. 서버에서 토큰 검증
```

### 10.2 보안 체크리스트

- [ ] 비밀번호 bcrypt 해싱
- [ ] HTTPS 강제
- [ ] CSRF 보호
- [ ] Rate Limiting
- [ ] SQL Injection 방지 (Prisma ORM)
- [ ] XSS 방지 (React 기본 이스케이프)

---

## 11. 배포 및 인프라

### 11.1 권장 인프라 (Vercel)

```
┌─────────────────────────────────────────────────┐
│                    Vercel                       │
│  ┌─────────────────────────────────────────┐   │
│  │           Next.js Application           │   │
│  │         (Serverless Functions)          │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│   Supabase or    │   │   Upstash Redis  │
│   Neon (PG)      │   │   (Cache/Rate)   │
└──────────────────┘   └──────────────────┘
```

### 11.2 환경 변수

```env
# .env.local

# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Redis (optional)
REDIS_URL="redis://..."

# Stock API (추후 결정)
STOCK_API_KEY="..."
STOCK_API_SECRET="..."
```

---

## 12. 개발 로드맵

### Phase 1: 기반 구축
- [ ] Next.js 프로젝트 초기화
- [ ] Prisma + PostgreSQL 설정
- [ ] NextAuth.js 인증 구현
- [ ] 기본 레이아웃 및 네비게이션
- [ ] shadcn/ui 컴포넌트 설치

### Phase 2: 핵심 기능 (차트)
- [ ] Lightweight Charts 통합
- [ ] 캔들차트 + 거래량 차트
- [ ] 기술적 지표 계산 로직
- [ ] 지표 오버레이 구현
- [ ] 차트 설정 저장

### Phase 3: 관심종목
- [ ] 그룹 CRUD
- [ ] 종목 추가/삭제
- [ ] 드래그 앤 드롭 정렬
- [ ] 메모 기능

### Phase 4: 스크리너
- [ ] 주도주 선정 알고리즘
- [ ] 필터링 UI
- [ ] 실시간 업데이트

### Phase 5: 매매 신호
- [ ] 신호 조건 빌더 UI
- [ ] 신호 계산 엔진
- [ ] 차트 마커 표시
- [ ] 프리셋 저장/로드

### Phase 6: 뉴스 & 마무리
- [ ] 뉴스 피드 연동
- [ ] 알림 시스템
- [ ] 성능 최적화
- [ ] 테스트 작성

---

## 13. 기술적 고려사항

### 13.1 성능 최적화

| 영역 | 전략 |
|------|------|
| 차트 렌더링 | Canvas 기반 (Lightweight Charts) |
| 데이터 캐싱 | TanStack Query + Redis |
| 번들 크기 | Dynamic Import, Tree Shaking |
| 이미지 | Next.js Image Optimization |

### 13.2 에러 처리

```typescript
// 전역 에러 바운더리
// API 에러 표준화
// 사용자 친화적 에러 메시지
```

### 13.3 테스트 전략

| 유형 | 도구 | 대상 |
|------|------|------|
| 단위 테스트 | Vitest | 지표 계산, 유틸리티 |
| 통합 테스트 | Testing Library | 컴포넌트 |
| E2E 테스트 | Playwright | 주요 사용자 플로우 |

---

*이 문서는 개발 진행에 따라 업데이트됩니다.*
