import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TradingStrategy, SignalResult, BacktestResult, BacktestConfig } from '@/lib/signals/types';

interface SignalStore {
  // 현재 선택된 전략
  selectedStrategy: TradingStrategy | null;
  setSelectedStrategy: (strategy: TradingStrategy | null) => void;

  // 현재 신호 결과 (메모리)
  currentSignals: SignalResult | null;
  setCurrentSignals: (signals: SignalResult | null) => void;

  // 백테스트 설정
  backtestConfig: BacktestConfig;
  setBacktestConfig: (config: Partial<BacktestConfig>) => void;
  resetBacktestConfig: () => void;

  // 백테스트 결과
  backtestResult: BacktestResult | null;
  setBacktestResult: (result: BacktestResult | null) => void;

  // 읽지 않은 알림 수
  unreadAlertCount: number;
  setUnreadAlertCount: (count: number) => void;
  incrementUnreadCount: () => void;

  // UI 상태
  isBacktestPanelOpen: boolean;
  toggleBacktestPanel: () => void;
  isAlertPanelOpen: boolean;
  toggleAlertPanel: () => void;
  isPresetManagerOpen: boolean;
  togglePresetManager: () => void;
}

const getDefaultBacktestConfig = (): BacktestConfig => {
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  return {
    symbol: '',
    startDate: oneYearAgo,
    endDate: now,
    initialCapital: 10000000,
    commission: 0.015,
    slippage: 0.1,
    positionSizing: 'percent',
    positionSize: 100,
  };
};

export const useSignalStore = create<SignalStore>()(
  persist(
    (set) => ({
      // 전략
      selectedStrategy: null,
      setSelectedStrategy: (strategy) => set({ selectedStrategy: strategy }),

      // 신호
      currentSignals: null,
      setCurrentSignals: (signals) => set({ currentSignals: signals }),

      // 백테스트 설정
      backtestConfig: getDefaultBacktestConfig(),
      setBacktestConfig: (config) =>
        set((state) => ({
          backtestConfig: { ...state.backtestConfig, ...config },
        })),
      resetBacktestConfig: () =>
        set({ backtestConfig: getDefaultBacktestConfig() }),

      // 백테스트 결과
      backtestResult: null,
      setBacktestResult: (result) => set({ backtestResult: result }),

      // 알림
      unreadAlertCount: 0,
      setUnreadAlertCount: (count) => set({ unreadAlertCount: count }),
      incrementUnreadCount: () =>
        set((state) => ({ unreadAlertCount: state.unreadAlertCount + 1 })),

      // UI 상태
      isBacktestPanelOpen: false,
      toggleBacktestPanel: () =>
        set((state) => ({ isBacktestPanelOpen: !state.isBacktestPanelOpen })),
      isAlertPanelOpen: false,
      toggleAlertPanel: () =>
        set((state) => ({ isAlertPanelOpen: !state.isAlertPanelOpen })),
      isPresetManagerOpen: false,
      togglePresetManager: () =>
        set((state) => ({ isPresetManagerOpen: !state.isPresetManagerOpen })),
    }),
    {
      name: 'mychart-signals',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // 영속 저장할 상태만 선택
        selectedStrategy: state.selectedStrategy,
        backtestConfig: {
          initialCapital: state.backtestConfig.initialCapital,
          commission: state.backtestConfig.commission,
          slippage: state.backtestConfig.slippage,
        },
      }),
    }
  )
);
