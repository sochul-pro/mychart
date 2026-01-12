'use client';

import { useState } from 'react';
import { Play, Loader2, BarChart3, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SymbolSelect } from '@/components/signals/SymbolSelect';
import { PresetManager } from '@/components/signals/PresetManager';
import { BacktestConfigPanel } from '@/components/signals/BacktestConfigPanel';
import { BacktestSummaryCards, BacktestDetailStats } from '@/components/signals/BacktestSummaryCards';
import { EquityCurveChart } from '@/components/signals/EquityCurveChart';
import { DrawdownChart } from '@/components/signals/DrawdownChart';
import { MonthlyReturnsTable } from '@/components/signals/MonthlyReturnsTable';
import { TradeHistoryTable } from '@/components/signals/TradeHistoryTable';
import { useBacktest, useBacktestConfig } from '@/hooks/useBacktest';
import { useSignalStore } from '@/stores/signalStore';
import type { TradingStrategy } from '@/lib/signals/types';

export default function SignalsPage() {
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [selectedStockName, setSelectedStockName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('stats');

  const { config, updateConfig } = useBacktestConfig();
  const { runBacktest, isRunning, error, lastResult, clearResult } = useBacktest();
  const setPresetStats = useSignalStore((state) => state.setPresetStats);

  const handleSelectStrategy = (strategy: TradingStrategy) => {
    setSelectedStrategy(strategy);
    clearResult();
  };

  const handleSymbolChange = (symbol: string, name?: string) => {
    setSelectedSymbol(symbol);
    setSelectedStockName(name || '');
    clearResult();
  };

  const handleRunBacktest = async () => {
    if (!selectedStrategy || !selectedSymbol) return;

    try {
      const response = await runBacktest(selectedSymbol, selectedStrategy, config);

      // 백테스트 결과를 프리셋 통계 캐시에 저장
      if (response?.result) {
        setPresetStats(selectedStrategy.id, {
          winRate: response.result.winRate,
          totalReturn: response.result.totalReturn,
          maxDrawdown: response.result.maxDrawdown,
          sharpeRatio: response.result.sharpeRatio,
          lastBacktestAt: new Date().toISOString(),
          symbol: selectedSymbol,
        });
      }
    } catch (err) {
      console.error('Backtest error:', err);
    }
  };

  const canRunBacktest = selectedStrategy && selectedSymbol && !isRunning;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">매매 신호</h1>
          <p className="text-muted-foreground">
            전략을 선택하고 백테스트를 실행하세요
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Strategy & Config */}
        <div className="lg:col-span-1 space-y-6">
          {/* Symbol Select */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">종목 선택</CardTitle>
              <CardDescription>분석할 종목을 검색하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <SymbolSelect
                value={selectedSymbol}
                onChange={handleSymbolChange}
              />
            </CardContent>
          </Card>

          {/* Strategy Selection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">전략 선택</CardTitle>
              <CardDescription>
                {selectedStrategy ? selectedStrategy.name : '전략을 선택하세요'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PresetManager onSelectStrategy={handleSelectStrategy} />
            </CardContent>
          </Card>

          {/* Backtest Config */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">백테스트 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <BacktestConfigPanel config={config} onChange={updateConfig} />
            </CardContent>
          </Card>

          {/* Run Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleRunBacktest}
            disabled={!canRunBacktest}
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                백테스트 실행 중...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                백테스트 실행
              </>
            )}
          </Button>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Main Content - Results */}
        <div className="lg:col-span-3 space-y-6">
          {lastResult ? (
            <>
              {/* Summary Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedStockName || selectedSymbol} - {selectedStrategy?.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {config.startDate.toLocaleDateString('ko-KR')} ~ {config.endDate.toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={clearResult}>
                    결과 초기화
                  </Button>
                </div>
              </div>

              {/* Summary Cards */}
              <BacktestSummaryCards result={lastResult} />

              {/* Charts */}
              <EquityCurveChart result={lastResult} />
              <DrawdownChart result={lastResult} />

              {/* Detail Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                  <TabsTrigger value="stats">상세 통계</TabsTrigger>
                  <TabsTrigger value="monthly">월별 수익률</TabsTrigger>
                  <TabsTrigger value="trades">거래 내역</TabsTrigger>
                </TabsList>

                <TabsContent value="stats" className="mt-4">
                  <BacktestDetailStats result={lastResult} />
                </TabsContent>

                <TabsContent value="monthly" className="mt-4">
                  <MonthlyReturnsTable result={lastResult} />
                </TabsContent>

                <TabsContent value="trades" className="mt-4">
                  <TradeHistoryTable trades={lastResult.trades} />
                </TabsContent>
              </Tabs>
            </>
          ) : (
            /* Empty State */
            <Card className="flex flex-col items-center justify-center py-16">
              <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">백테스트 결과</h3>
              <p className="text-muted-foreground text-center max-w-md">
                종목과 전략을 선택한 후 백테스트를 실행하면
                <br />
                여기에 결과가 표시됩니다.
              </p>
              <div className="mt-6 text-sm text-muted-foreground">
                <ol className="list-decimal list-inside space-y-1">
                  <li>종목을 검색하여 선택하세요</li>
                  <li>기본 전략 또는 내 전략을 선택하세요</li>
                  <li>기간을 설정하고 백테스트를 실행하세요</li>
                </ol>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
