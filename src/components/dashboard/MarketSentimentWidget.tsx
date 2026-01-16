'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarketSentiment, type FearGreedData, type IndexData } from '@/hooks/useMarketSentiment';
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// 점수에 따른 색상 반환
function getScoreColor(score: number): string {
  if (score <= 25) return '#ea3943'; // Extreme Fear - 빨강
  if (score <= 45) return '#ea8c00'; // Fear - 주황
  if (score <= 55) return '#9b9b9b'; // Neutral - 회색
  if (score <= 75) return '#16c784'; // Greed - 초록
  return '#00a478'; // Extreme Greed - 진한 초록
}

// 점수에 따른 한글 등급 반환
function getRatingKorean(rating: FearGreedData['rating']): string {
  const ratings: Record<FearGreedData['rating'], string> = {
    'Extreme Fear': '극단적 공포',
    'Fear': '공포',
    'Neutral': '중립',
    'Greed': '탐욕',
    'Extreme Greed': '극단적 탐욕',
  };
  return ratings[rating];
}

// 스파크라인 차트 컴포넌트 (공용)
function Sparkline({ data, invertColor = false }: { data: number[]; invertColor?: boolean }) {
  if (!data || data.length < 2) return null;

  const width = 120;
  const height = 40;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const isUp = data[data.length - 1] > data[0];
  // invertColor가 true면 상승이 나쁨 (VIX), false면 상승이 좋음 (지수)
  const strokeColor = invertColor
    ? (isUp ? '#ef4444' : '#22c55e')
    : (isUp ? '#ef4444' : '#3b82f6');
  const fillColor = invertColor
    ? (isUp ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)')
    : (isUp ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)');

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const pathD = points
    .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
    .join(' ');

  const areaD = `${pathD} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <svg width={width} height={height} className="mt-1">
      <path d={areaD} fill={fillColor} />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2}
        fill={strokeColor}
      />
    </svg>
  );
}

// 미니 반원형 게이지 (축소 버전)
function MiniGauge({ score }: { score: number }) {
  const radius = 40;
  const strokeWidth = 8;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;
  const needleAngle = (score / 100) * 180 - 90;

  return (
    <svg width="90" height="50" viewBox="0 0 90 50">
      <defs>
        <linearGradient id="miniGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ea3943" />
          <stop offset="25%" stopColor="#ea8c00" />
          <stop offset="50%" stopColor="#9b9b9b" />
          <stop offset="75%" stopColor="#16c784" />
          <stop offset="100%" stopColor="#00a478" />
        </linearGradient>
      </defs>
      <path
        d="M 5 45 A 40 40 0 0 1 85 45"
        fill="none"
        stroke="#e5e5e5"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M 5 45 A 40 40 0 0 1 85 45"
        fill="none"
        stroke="url(#miniGaugeGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${progress} ${circumference}`}
        className="transition-all duration-500"
      />
      <g transform={`rotate(${needleAngle}, 45, 45)`}>
        <line
          x1="45"
          y1="45"
          x2="45"
          y2="15"
          stroke={getScoreColor(score)}
          strokeWidth="2"
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        <circle cx="45" cy="45" r="4" fill={getScoreColor(score)} />
      </g>
    </svg>
  );
}

// 지수 카드 컴포넌트 (KOSPI, KOSDAQ)
function IndexCard({ data }: { data: IndexData }) {
  const isUp = data.change >= 0;

  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-muted/30">
      <span className="text-sm font-medium text-muted-foreground mb-1">{data.name}</span>
      <div className="text-2xl font-bold">{data.value.toLocaleString()}</div>
      <div className={cn(
        'flex items-center gap-1 text-sm',
        isUp ? 'text-red-500' : 'text-blue-500'
      )}>
        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{isUp ? '+' : ''}{data.changePercent.toFixed(2)}%</span>
      </div>
      {data.history && data.history.length > 0 && (
        <Sparkline data={data.history} />
      )}
    </div>
  );
}

// 공포탐욕지수 카드
function FearGreedCard({ data }: { data: FearGreedData }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-muted/30">
      <span className="text-sm font-medium text-muted-foreground mb-1">공포탐욕지수</span>
      <MiniGauge score={data.score} />
      <div className="text-2xl font-bold" style={{ color: getScoreColor(data.score) }}>
        {data.score}
      </div>
      <div
        className="text-xs font-medium px-2 py-0.5 rounded-full"
        style={{
          backgroundColor: `${getScoreColor(data.score)}20`,
          color: getScoreColor(data.score),
        }}
      >
        {getRatingKorean(data.rating)}
      </div>
    </div>
  );
}

// VIX 카드
function VixCard({ value, change, changePercent, history }: { value: number; change: number; changePercent: number; history?: number[] }) {
  const isUp = change >= 0;

  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-muted/30">
      <div className="flex items-center gap-1 mb-1">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">VIX</span>
      </div>
      <div className="text-2xl font-bold">{value.toFixed(2)}</div>
      <div className={cn(
        'flex items-center gap-1 text-sm',
        isUp ? 'text-red-500' : 'text-green-500'
      )}>
        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{isUp ? '+' : ''}{changePercent.toFixed(2)}%</span>
      </div>
      {history && history.length > 0 && (
        <Sparkline data={history} invertColor />
      )}
    </div>
  );
}

// 스켈레톤 컴포넌트
function MarketSentimentSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">시장 지표</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center p-3 rounded-lg bg-muted/30 space-y-2">
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-20 h-8" />
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-24 h-10" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function MarketSentimentWidget() {
  const { kospi, kosdaq, fearGreed, vix, isLoading, isFetching, refetch, updatedAt } = useMarketSentiment();

  if (isLoading) {
    return <MarketSentimentSkeleton />;
  }

  // 모든 데이터가 없는 경우
  if (!kospi && !kosdaq && !fearGreed && !vix) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">시장 지표</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            시장 데이터를 불러올 수 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">시장 지표</CardTitle>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1 hover:bg-muted rounded transition-colors"
            title="새로고침"
          >
            <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isFetching && 'animate-spin')} />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* KOSPI */}
          {kospi && <IndexCard data={kospi} />}

          {/* KOSDAQ */}
          {kosdaq && <IndexCard data={kosdaq} />}

          {/* Fear & Greed */}
          {fearGreed && <FearGreedCard data={fearGreed} />}

          {/* VIX */}
          {vix && (
            <VixCard
              value={vix.value}
              change={vix.change}
              changePercent={vix.changePercent}
              history={vix.history}
            />
          )}
        </div>

        {updatedAt && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            {new Date(updatedAt).toLocaleTimeString('ko-KR')} 업데이트
          </p>
        )}
      </CardContent>
    </Card>
  );
}
