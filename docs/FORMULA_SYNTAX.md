# 수식 편집기 문법 가이드

MyChart 매매 신호 시스템에서 사용하는 수식 편집기 문법입니다.

## 목차

1. [지표 (Indicators)](#1-지표-indicators)
2. [비교 연산자](#2-비교-연산자)
3. [산술 연산자](#3-산술-연산자)
4. [크로스오버 연산자](#4-크로스오버-연산자)
5. [논리 연산자](#5-논리-연산자)
6. [괄호 (우선순위)](#6-괄호-우선순위)
7. [수식 예제](#7-수식-예제)
8. [문법 규칙 요약](#8-문법-규칙-요약)

---

## 1. 지표 (Indicators)

### 가격/거래량

| 지표 | 문법 | 설명 | 예시 |
|------|------|------|------|
| 가격 | `Price` 또는 `Close` | 종가 | `Price > 10000` |
| 거래량 | `Volume` | 거래량 | `Volume > 1000000` |
| 거래량 이동평균 | `Volume_MA(기간)` 또는 `Vol_MA` | 거래량의 단순이동평균 | `Volume > Volume_MA(20)` |

### 신고가/신저가

| 지표 | 문법 | 설명 | 예시 |
|------|------|------|------|
| N일 최고가 | `High(기간)` | 최근 N일간 최고가 | `Price > High(20)` |
| N일 최저가 | `Low(기간)` | 최근 N일간 최저가 | `Price < Low(20)` |
| 52주 최고가 | `High_52W` | 52주(252일) 최고가 | `Price > High_52W` |
| 52주 최저가 | `Low_52W` | 52주(252일) 최저가 | `Price < Low_52W` |

- `High(N)`은 최근 N일간의 고가 중 최댓값
- `Low(N)`은 최근 N일간의 저가 중 최솟값
- `High_52W`, `Low_52W`는 `High(252)`, `Low(252)`와 동일

### 이동평균선

| 지표 | 문법 | 설명 | 예시 |
|------|------|------|------|
| 단순이동평균 | `SMA(기간)` | Simple Moving Average | `SMA(20)`, `SMA(60)` |
| 지수이동평균 | `EMA(기간)` | Exponential Moving Average | `EMA(12)`, `EMA(26)` |

### RSI (상대강도지수)

| 지표 | 문법 | 설명 | 예시 |
|------|------|------|------|
| RSI | `RSI(기간)` | Relative Strength Index | `RSI(14)` |

- 일반적으로 14일 기간 사용
- 30 이하: 과매도, 70 이상: 과매수

### MACD

| 지표 | 문법 | 설명 | 예시 |
|------|------|------|------|
| MACD 라인 | `MACD` | MACD 메인 라인 | `MACD > 0` |
| MACD 시그널 | `MACD_Signal` 또는 `Signal` | MACD 시그널 라인 | `MACD cross_above MACD_Signal` |
| MACD 히스토그램 | `MACD_Histogram` 또는 `Histogram` | MACD 히스토그램 | `MACD_Histogram > 0` |

- 기본 설정: fast=12, slow=26, signal=9

### 스토캐스틱

| 지표 | 문법 | 설명 | 예시 |
|------|------|------|------|
| 스토캐스틱 %K | `Stochastic_K(k기간,d기간)` 또는 `Stoch_K` | %K 라인 | `Stochastic_K(14,3)` |
| 스토캐스틱 %D | `Stochastic_D(k기간,d기간)` 또는 `Stoch_D` | %D 라인 | `Stochastic_D(14,3)` |

- 20 이하: 과매도, 80 이상: 과매수

### 볼린저 밴드

| 지표 | 문법 | 설명 | 예시 |
|------|------|------|------|
| 볼린저 상단 | `Bollinger_Upper(기간,표준편차)` 또는 `BB_Upper` | 상단 밴드 | `Bollinger_Upper(20,2)` |
| 볼린저 중심 | `Bollinger_Middle(기간)` 또는 `BB_Middle` | 중심선 (SMA) | `Bollinger_Middle(20)` |
| 볼린저 하단 | `Bollinger_Lower(기간,표준편차)` 또는 `BB_Lower` | 하단 밴드 | `Bollinger_Lower(20,2)` |

- 기본 설정: 기간=20, 표준편차=2

---

## 2. 비교 연산자

| 연산자 | 의미 | 예시 |
|--------|------|------|
| `>` | ~보다 큼 | `RSI(14) > 70` |
| `<` | ~보다 작음 | `RSI(14) < 30` |
| `>=` | ~보다 크거나 같음 | `Price >= 10000` |
| `<=` | ~보다 작거나 같음 | `Price <= 50000` |
| `==` | ~와 같음 | `Volume == 0` |

### 지표 간 비교

숫자뿐만 아니라 다른 지표와도 비교할 수 있습니다:

```
Price > SMA(20)           # 가격이 20일선 위
SMA(5) > SMA(20)          # 5일선이 20일선 위 (정배열)
SMA(20) > SMA(60)         # 20일선이 60일선 위
Price > High(20)          # 가격이 20일 최고가 돌파 (신고가)
Price < Low(20)           # 가격이 20일 최저가 이탈 (신저가)
```

---

## 3. 산술 연산자

지표와 숫자 간의 산술 연산을 수행합니다. 마크 미너비니(Mark Minervini) 전략과 같이 비율 기반 조건을 표현할 때 유용합니다.

| 연산자 | 의미 | 예시 |
|--------|------|------|
| `*` | 곱셈 | `Low_52W * 1.3` |
| `/` | 나눗셈 | `Price / SMA(20)` |

### 산술 연산 예시

```
# 52주 최저가 대비 30% 이상 상승
Price > Low_52W * 1.3

# 52주 최고가의 75% 이상
Price >= High_52W * 0.75

# 가격이 이동평균의 1.1배 이상
Price > SMA(200) * 1.1

# 지표 간 비율 비교
SMA(50) > SMA(200) * 1.05
```

### 마크 미너비니 Trend Template 전략

마크 미너비니의 8가지 조건을 수식으로 표현할 수 있습니다:

```
Price > SMA(50) AND
Price > SMA(150) AND
Price > SMA(200) AND
SMA(50) > SMA(150) AND
SMA(150) > SMA(200) AND
Price > Low_52W * 1.3 AND
Price >= High_52W * 0.75
```

| 조건 | 설명 |
|------|------|
| `Price > SMA(50)` | 주가 > 50일선 |
| `Price > SMA(150)` | 주가 > 150일선 |
| `Price > SMA(200)` | 주가 > 200일선 |
| `SMA(50) > SMA(150)` | 50일선 > 150일선 |
| `SMA(150) > SMA(200)` | 150일선 > 200일선 (상승 추세) |
| `Price > Low_52W * 1.3` | 52주 최저가 대비 30% 이상 |
| `Price >= High_52W * 0.75` | 52주 최고가의 75% 이내 |

---

## 4. 크로스오버 연산자

두 지표가 교차하는 시점을 감지합니다.

| 연산자 | 의미 | 설명 | 예시 |
|--------|------|------|------|
| `cross_above` | 상향돌파 | 왼쪽 지표가 오른쪽 지표를 위로 돌파 | `SMA(5) cross_above SMA(20)` |
| `cross_below` | 하향돌파 | 왼쪽 지표가 오른쪽 지표를 아래로 돌파 | `SMA(5) cross_below SMA(20)` |

### 크로스오버 예시

```
# 이동평균 크로스
SMA(5) cross_above SMA(20)      # 골든크로스 (단기선이 장기선 상향돌파)
SMA(5) cross_below SMA(20)      # 데드크로스 (단기선이 장기선 하향돌파)

# MACD 크로스
MACD cross_above MACD_Signal    # MACD 매수 신호
MACD cross_below MACD_Signal    # MACD 매도 신호

# 스토캐스틱 크로스
Stochastic_K(14,3) cross_above Stochastic_D(14,3)  # 스토캐스틱 골든크로스
```

---

## 5. 논리 연산자

여러 조건을 조합할 때 사용합니다.

| 연산자 | 의미 | 설명 | 예시 |
|--------|------|------|------|
| `AND` | 그리고 | 모든 조건이 참이어야 함 | `RSI(14) < 30 AND Volume > 1000000` |
| `OR` | 또는 | 하나라도 참이면 됨 | `RSI(14) < 30 OR MACD cross_above Signal` |

- **대소문자 구분 없음**: `and`, `AND`, `And` 모두 동일하게 작동

### 다중 조건 예시

```
# AND: 모든 조건 충족
RSI(14) < 30 AND Volume > 1000000
SMA(5) > SMA(20) AND SMA(20) > SMA(60) AND RSI(14) < 50

# OR: 하나라도 충족
RSI(14) < 30 OR Price < Bollinger_Lower(20,2)
MACD cross_above Signal OR RSI(14) < 25
```

---

## 6. 괄호 (우선순위)

복잡한 조건을 그룹화하여 연산 우선순위를 지정합니다.

### 기본 규칙

- 괄호 안의 조건이 먼저 평가됨
- 괄호가 없으면 AND가 OR보다 우선

### 괄호 사용 예시

```
# 괄호 없음: A AND B OR C = (A AND B) OR C
RSI(14) < 30 AND Volume > 1000000 OR MACD cross_above Signal

# 괄호 사용: A AND (B OR C)
RSI(14) < 30 AND (Volume > 1000000 OR MACD cross_above Signal)

# 복잡한 조건
(RSI(14) < 30 OR MACD cross_above MACD_Signal) AND SMA(20) > SMA(60)
```

### 해석 예시

```
(RSI(14) < 30 OR MACD cross_above MACD_Signal) AND Volume > 1000000
```

위 수식의 의미:
1. RSI가 30 미만이거나, MACD가 시그널을 상향돌파 (둘 중 하나 이상)
2. **그리고** 거래량이 100만 이상

---

## 7. 수식 예제

### 기본 조건

```
# RSI 기반
RSI(14) < 30                    # RSI 과매도 (매수 신호)
RSI(14) > 70                    # RSI 과매수 (매도 신호)
RSI(14) < 40                    # RSI 약세 구간

# 가격 기반
Price > SMA(20)                 # 가격이 20일선 위
Price > SMA(60)                 # 가격이 60일선 위
Price < Bollinger_Lower(20,2)   # 볼린저 밴드 하단 이탈

# 거래량 기반
Volume > 1000000                # 거래량 100만주 이상
Volume > 5000000                # 거래량 500만주 이상
```

### 이동평균 전략

```
# 골든크로스/데드크로스
SMA(5) cross_above SMA(20)      # 5일선 > 20일선 골든크로스
SMA(5) cross_below SMA(20)      # 5일선 < 20일선 데드크로스
SMA(20) cross_above SMA(60)     # 20일선 > 60일선 골든크로스

# 정배열/역배열
SMA(5) > SMA(20) AND SMA(20) > SMA(60)   # 정배열 (상승 추세)
SMA(5) < SMA(20) AND SMA(20) < SMA(60)   # 역배열 (하락 추세)

# EMA 크로스
EMA(12) cross_above EMA(26)     # EMA 골든크로스
```

### MACD 전략

```
# 기본 MACD 신호
MACD cross_above MACD_Signal    # MACD 매수 신호
MACD cross_below MACD_Signal    # MACD 매도 신호

# MACD 추세 확인
MACD > 0                        # MACD 양수 (상승 추세)
MACD < 0                        # MACD 음수 (하락 추세)
MACD_Histogram > 0              # 히스토그램 양수 (모멘텀 상승)

# MACD 복합 조건
MACD cross_above MACD_Signal AND MACD < 0   # 바닥권 MACD 골든크로스
```

### 볼린저 밴드 전략

```
# 밴드 돌파
Price < Bollinger_Lower(20,2)   # 하단 밴드 이탈 (과매도)
Price > Bollinger_Upper(20,2)   # 상단 밴드 이탈 (과매수)

# 밴드 복귀
Price cross_above Bollinger_Lower(20,2)   # 하단에서 복귀 (매수)
Price cross_below Bollinger_Upper(20,2)   # 상단에서 복귀 (매도)

# 중심선 기준
Price > Bollinger_Middle(20)    # 중심선 위 (상승 추세)
Price cross_above Bollinger_Middle(20)    # 중심선 돌파
```

### 스토캐스틱 전략

```
# 과매수/과매도
Stochastic_K(14,3) < 20         # %K 과매도
Stochastic_K(14,3) > 80         # %K 과매수

# 크로스
Stochastic_K(14,3) cross_above Stochastic_D(14,3)  # 스토캐스틱 골든크로스
Stochastic_K(14,3) cross_below Stochastic_D(14,3)  # 스토캐스틱 데드크로스

# 과매도 구간에서 골든크로스
Stochastic_K(14,3) < 20 AND Stochastic_K(14,3) cross_above Stochastic_D(14,3)
```

### 신고가/신저가 전략

```
# 신고가 돌파
Price > High(20)                # 20일 신고가 돌파
Price > High(60)                # 60일 신고가 돌파
Price > High_52W                # 52주 신고가 돌파

# 신저가 이탈
Price < Low(20)                 # 20일 신저가 이탈
Price < Low(60)                 # 60일 신저가 이탈
Price < Low_52W                 # 52주 신저가 이탈

# 신고가 복귀 (풀백)
Price cross_above High(20)      # 20일 신고가 돌파 시점
Price cross_below High(20)      # 20일 신고가 아래로 복귀

# 신고가 + 거래량 확인
Price > High(20) AND Volume > Volume_MA(20)   # 신고가 + 거래량 증가
Price > High_52W AND Volume > 1000000         # 52주 신고가 + 대량 거래

# 박스권 돌파 (채널 브레이크아웃)
Price > High(20) AND SMA(20) > SMA(60)        # 상승추세 + 박스권 상단 돌파
```

### 복합 전략

```
# RSI + 거래량
RSI(14) < 30 AND Volume > 1000000

# 골든크로스 + MACD 확인
SMA(5) cross_above SMA(20) AND MACD > 0

# 볼린저 + RSI 복합 (강력한 과매도)
Price < Bollinger_Lower(20,2) AND RSI(14) < 30

# 트리플 스크린 매수
SMA(20) > SMA(60) AND RSI(14) < 40 AND MACD cross_above MACD_Signal

# 다중 지표 확인
(RSI(14) < 30 OR MACD cross_above Signal) AND SMA(20) > SMA(60) AND Volume > 1000000

# 추세 + 모멘텀 + 거래량
SMA(5) > SMA(20) AND RSI(14) > 50 AND RSI(14) < 70 AND Volume > 500000
```

---

## 8. 문법 규칙 요약

### 기본 규칙

| 규칙 | 설명 | 예시 |
|------|------|------|
| 대소문자 | 구분 없음 | `RSI`, `rsi`, `Rsi` 모두 동일 |
| 공백 | 자유롭게 사용 | `RSI(14)<30`, `RSI(14) < 30` 동일 |
| 숫자 | 정수, 소수점 지원 | `30`, `0.5`, `1000000` |

### 지표 파라미터

- 괄호 안에 쉼표로 구분하여 입력
- 파라미터 순서 중요

```
SMA(20)                     # 기간: 20
Bollinger_Upper(20,2)       # 기간: 20, 표준편차: 2
Stochastic_K(14,3)          # K기간: 14, D기간: 3
```

### 연산자 우선순위

1. 괄호 `()`
2. 산술 연산자 `*`, `/` (곱셈, 나눗셈)
3. 비교 연산자 `>`, `<`, `>=`, `<=`, `==`
4. 크로스오버 `cross_above`, `cross_below`
5. AND
6. OR

### 자주 하는 실수

| 잘못된 예시 | 올바른 예시 | 설명 |
|-------------|-------------|------|
| `RSI(14) = 30` | `RSI(14) == 30` | 등호는 `==` 사용 |
| `SMA(5) crosses SMA(20)` | `SMA(5) cross_above SMA(20)` | `cross_above` 또는 `cross_below` 사용 |
| `RSI(14) < 30 & Volume > 1000000` | `RSI(14) < 30 AND Volume > 1000000` | `&` 대신 `AND` 사용 |

---

## 참고

- 수식 편집기에서 **[도움말]** 버튼을 클릭하면 지표와 연산자 목록을 확인할 수 있습니다.
- **[예제]** 버튼을 클릭하면 미리 정의된 수식 예제를 선택할 수 있습니다.
- UI 빌더와 수식 편집기는 자유롭게 전환 가능하며, 서로 동기화됩니다.
