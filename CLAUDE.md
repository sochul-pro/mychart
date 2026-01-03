# MyChart - Claude Code 프로젝트 가이드

## 프로젝트 개요

**MyChart**는 한국 주식 시장(KOSPI, KOSDAQ)에서 모멘텀이 있는 주도주를 발굴하고, 개인 관심종목을 관리하며, 차트 분석과 실시간 뉴스를 제공하는 웹 서비스입니다.

### 핵심 기능
- **주도주 스크리너**: 복합 지표(거래량, 상승률, 신고가) 기반 주도주 자동 선별
- **관심종목 관리**: 그룹별 관심종목 등록/관리
- **차트 뷰어**: 캔들차트 + 커스텀 기술적 지표 (이평선, RSI, MACD, 볼린저밴드 등)
- **매매 신호**: 사용자 정의 조건에 따른 매수/매도 신호 차트 표시
- **뉴스 피드**: 종목별 실시간 관련 뉴스

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript 5.x |
| 스타일링 | Tailwind CSS + shadcn/ui |
| 상태관리 | Zustand + TanStack Query |
| 차트 | Lightweight Charts (TradingView) |
| ORM | Prisma 6.x |
| 데이터베이스 | PostgreSQL 16.x |
| 인증 | NextAuth.js 5.x |
| 캐시 | Redis (선택) |

---

## 디렉토리 구조

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # 인증 라우트 그룹
│   │   ├── login/
│   │   └── register/
│   ├── (main)/               # 메인 앱 라우트 그룹
│   │   ├── dashboard/
│   │   ├── screener/
│   │   ├── stocks/[symbol]/
│   │   ├── watchlist/
│   │   └── settings/
│   └── api/                  # API Routes
│       ├── auth/
│       ├── stocks/
│       ├── watchlist/
│       ├── signals/
│       └── news/
├── components/
│   ├── ui/                   # shadcn/ui 컴포넌트
│   ├── charts/               # 차트 컴포넌트
│   ├── screener/
│   ├── watchlist/
│   └── news/
├── lib/
│   ├── db.ts                 # Prisma 클라이언트
│   ├── auth.ts               # NextAuth 설정
│   ├── api/                  # 외부 API 클라이언트
│   └── indicators/           # 기술적 지표 계산
├── hooks/                    # 커스텀 훅
├── stores/                   # Zustand 스토어
├── types/                    # TypeScript 타입
└── utils/                    # 유틸리티 함수
```

---

## 개발 컨벤션

### 코드 스타일
- ESLint + Prettier 사용
- 세미콜론 사용, 싱글 쿼트
- 들여쓰기 2칸

### 명명 규칙
| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `CandlestickChart.tsx` |
| 훅 | camelCase (use 접두사) | `useStockData.ts` |
| 유틸리티 | camelCase | `formatPrice.ts` |
| 타입/인터페이스 | PascalCase | `StockInfo`, `OHLCV` |
| API 라우트 | kebab-case | `/api/stocks/[symbol]/chart` |

### 컴포넌트 패턴
```typescript
// 함수형 컴포넌트 + TypeScript
interface Props {
  symbol: string;
}

export function StockCard({ symbol }: Props) {
  return <div>...</div>;
}
```

### API 라우트 패턴
```typescript
// app/api/stocks/[symbol]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  // ...
  return NextResponse.json(data);
}
```

---

## 주요 명령어

```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# 린트
npm run lint

# 타입 체크
npm run type-check

# 테스트
npm run test

# Prisma
npx prisma generate      # 클라이언트 생성
npx prisma migrate dev   # 마이그레이션 (개발)
npx prisma studio        # DB GUI
```

---

## 환경 변수

```env
# .env.local
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
REDIS_URL="redis://..." (optional)
STOCK_API_KEY="..."
STOCK_API_SECRET="..."
```

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| [PRD.md](./PRD.md) | 제품 요구사항 정의서 |
| [TECH-SPEC.md](./TECH-SPEC.md) | 기술 명세서 (상세 아키텍처, DB 스키마, API 설계) |
| [EXECUTION_PLAN.md](./EXECUTION_PLAN.md) | 실행계획 (21개 태스크 분해) |

---

## 현재 개발 상태

`EXECUTION_PLAN.md` 참조. 태스크는 다음 Phase로 구성:

| Phase | 내용 | 태스크 수 |
|-------|------|-----------|
| 0 | 프로젝트 초기 설정 | 3 |
| 1 | 외부 데이터 연동 | 2 |
| 2 | 차트 시스템 | 5 |
| 3 | 핵심 기능 | 5 |
| 4 | 페이지 조합 | 3 |
| 5 | 마무리 | 3 |

---

## 작업 시 참고사항

1. **태스크 단위로 작업**: `EXECUTION_PLAN.md`의 태스크 ID를 참조하여 작업
2. **의존성 확인**: 태스크 간 의존성 다이어그램 확인 후 순서대로 진행
3. **타입 우선**: 새 기능 추가 시 `types/` 디렉토리에 타입 먼저 정의
4. **테스트 작성**: `lib/indicators/` 등 핵심 로직은 단위 테스트 필수
5. **소스 동록**: 깃허브를 통한 소스 관리, 커밋할때 작업내역 상세하게 작성
6. **이슈 관리**: 깃허브를 통한 이슈 관리, 이슈종료 시 작업내역 상세하게 작성
 
