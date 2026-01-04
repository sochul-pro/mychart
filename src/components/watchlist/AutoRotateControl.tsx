'use client';

import { useEffect, useState, useCallback } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const INTERVAL_OPTIONS = [
  { value: '5', label: '5초' },
  { value: '10', label: '10초' },
  { value: '30', label: '30초' },
  { value: '60', label: '1분' },
];

interface AutoRotateControlProps {
  currentIndex: number;
  totalCount: number;
  currentStockName?: string;
  nextStockName?: string;
  onPrevious: () => void;
  onNext: () => void;
  onIndexChange: (index: number) => void;
  className?: string;
}

export function AutoRotateControl({
  currentIndex,
  totalCount,
  currentStockName,
  nextStockName,
  onPrevious,
  onNext,
  onIndexChange,
  className,
}: AutoRotateControlProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [interval, setInterval] = useState('5');
  const [progress, setProgress] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  const intervalMs = parseInt(interval) * 1000;

  const handleNext = useCallback(() => {
    if (totalCount > 0) {
      const nextIndex = (currentIndex + 1) % totalCount;
      onIndexChange(nextIndex);
    }
  }, [currentIndex, totalCount, onIndexChange]);

  useEffect(() => {
    if (!isPlaying || totalCount === 0) {
      setProgress(0);
      setRemainingTime(0);
      return;
    }

    const startTime = Date.now();
    const updateInterval = 100;

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / intervalMs) * 100, 100);
      const remaining = Math.max(0, Math.ceil((intervalMs - elapsed) / 1000));

      setProgress(newProgress);
      setRemainingTime(remaining);

      if (elapsed >= intervalMs) {
        handleNext();
        setProgress(0);
      }
    }, updateInterval);

    return () => window.clearInterval(timer);
  }, [isPlaying, intervalMs, currentIndex, handleNext, totalCount]);

  useEffect(() => {
    if (isPlaying) {
      setProgress(0);
    }
  }, [currentIndex, isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setProgress(0);
    }
  };

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* 컨트롤 영역 */}
      <div className="flex items-center gap-2">
        <Button
          variant={isPlaying ? 'default' : 'outline'}
          size="sm"
          onClick={togglePlay}
          className="gap-1"
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4" />
              <span className="hidden sm:inline">정지</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">시작</span>
            </>
          )}
        </Button>

        <Select value={interval} onValueChange={setInterval} disabled={isPlaying}>
          <SelectTrigger className="w-[80px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INTERVAL_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground ml-auto">
          {currentIndex + 1} / {totalCount}
        </span>
      </div>

      {/* 진행 바 (실행 중일 때만 표시) */}
      {isPlaying && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1" />
          {nextStockName && (
            <p className="text-xs text-muted-foreground">
              다음: {nextStockName} ({remainingTime}초)
            </p>
          )}
        </div>
      )}

      {/* 네비게이션 */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevious}
          disabled={totalCount <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          이전
        </Button>

        <div className="flex gap-1">
          {totalCount <= 10 &&
            Array.from({ length: totalCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => onIndexChange(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  i === currentIndex
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                )}
              />
            ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={totalCount <= 1}
        >
          다음
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
