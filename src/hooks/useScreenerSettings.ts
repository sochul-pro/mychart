'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RankingWeights, ScreenerFilter, SelectedRankings } from '@/types';
import { DEFAULT_RANKING_WEIGHTS, DEFAULT_SELECTED_RANKINGS } from '@/types/screener';

const STORAGE_KEY = 'screener-settings';

interface ScreenerSettings {
  weights: RankingWeights;
  filter: ScreenerFilter;
  minRankingCount: number;
  selectedRankings: SelectedRankings;
}

const DEFAULT_SETTINGS: ScreenerSettings = {
  weights: DEFAULT_RANKING_WEIGHTS,
  filter: { market: 'all' },
  minRankingCount: 0,
  selectedRankings: DEFAULT_SELECTED_RANKINGS,
};

/**
 * 스크리너 설정 저장/로드 훅
 * localStorage를 사용하여 가중치, 필터, 순위 조건을 저장합니다.
 */
export function useScreenerSettings() {
  const [settings, setSettings] = useState<ScreenerSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 초기 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ScreenerSettings;
        // 새로 추가된 필드가 있을 경우 기본값으로 병합
        setSettings({
          weights: { ...DEFAULT_RANKING_WEIGHTS, ...parsed.weights },
          filter: { ...DEFAULT_SETTINGS.filter, ...parsed.filter },
          minRankingCount: parsed.minRankingCount ?? 0,
          selectedRankings: { ...DEFAULT_SELECTED_RANKINGS, ...parsed.selectedRankings },
        });
      }
    } catch (error) {
      console.warn('[ScreenerSettings] 설정 로드 실패:', error);
    }
    setIsLoaded(true);
  }, []);

  // 설정 저장
  const saveSettings = useCallback((newSettings: Partial<ScreenerSettings>) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        ...newSettings,
        weights: newSettings.weights ? { ...prev.weights, ...newSettings.weights } : prev.weights,
        filter: newSettings.filter ? { ...prev.filter, ...newSettings.filter } : prev.filter,
        selectedRankings: newSettings.selectedRankings
          ? { ...prev.selectedRankings, ...newSettings.selectedRankings }
          : prev.selectedRankings,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setLastSaved(new Date());
      } catch (error) {
        console.warn('[ScreenerSettings] 설정 저장 실패:', error);
      }

      return updated;
    });
  }, []);

  // 가중치 업데이트
  const updateWeights = useCallback((weights: RankingWeights) => {
    saveSettings({ weights });
  }, [saveSettings]);

  // 필터 업데이트
  const updateFilter = useCallback((filter: ScreenerFilter) => {
    saveSettings({ filter });
  }, [saveSettings]);

  // 순위 조건 업데이트
  const updateMinRankingCount = useCallback((minRankingCount: number) => {
    saveSettings({ minRankingCount });
  }, [saveSettings]);

  // 선택된 순위 업데이트
  const updateSelectedRankings = useCallback((selectedRankings: SelectedRankings) => {
    saveSettings({ selectedRankings });
  }, [saveSettings]);

  // 기본값으로 초기화
  const resetToDefault = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
      setLastSaved(null);
    } catch (error) {
      console.warn('[ScreenerSettings] 설정 초기화 실패:', error);
    }
  }, []);

  return {
    // 현재 설정값
    weights: settings.weights,
    filter: settings.filter,
    minRankingCount: settings.minRankingCount,
    selectedRankings: settings.selectedRankings,

    // 상태
    isLoaded,
    lastSaved,

    // 업데이트 함수
    updateWeights,
    updateFilter,
    updateMinRankingCount,
    updateSelectedRankings,
    resetToDefault,
  };
}
