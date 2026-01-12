'use client';

import { useState, useMemo } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PresetCard } from './PresetCard';
import { PresetForm } from './PresetForm';
import { useSignalPresets } from '@/hooks/useSignalPresets';
import { useSignalStore } from '@/stores/signalStore';
import type { TradingStrategy, SignalPresetWithStats, Condition } from '@/lib/signals/types';

interface PresetManagerProps {
  onSelectStrategy: (strategy: TradingStrategy) => void;
}

export function PresetManager({ onSelectStrategy }: PresetManagerProps) {
  const {
    presets,
    defaultPresets,
    isLoading,
    createPresetAsync,
    updatePresetAsync,
    deletePresetAsync,
    isCreating,
    isUpdating,
  } = useSignalPresets();

  // 캐시된 백테스트 통계 가져오기
  const presetStats = useSignalStore((state) => state.presetStats);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<SignalPresetWithStats | null>(null);
  const [activeTab, setActiveTab] = useState<'default' | 'custom'>('default');

  // 기본 전략에 캐시된 통계 병합
  const defaultPresetsWithStats = useMemo(() => {
    return defaultPresets.map((preset) => {
      const cachedStats = presetStats[preset.id];
      if (cachedStats) {
        return {
          ...preset,
          winRate: cachedStats.winRate,
          totalReturn: cachedStats.totalReturn,
          maxDrawdown: cachedStats.maxDrawdown,
          sharpeRatio: cachedStats.sharpeRatio,
          lastBacktestAt: new Date(cachedStats.lastBacktestAt),
        };
      }
      return preset;
    });
  }, [defaultPresets, presetStats]);

  const handleCreate = async (data: {
    name: string;
    description?: string;
    buyRules: Condition;
    sellRules: Condition;
  }) => {
    await createPresetAsync(data);
  };

  const handleUpdate = async (data: {
    name: string;
    description?: string;
    buyRules: Condition;
    sellRules: Condition;
  }) => {
    if (!editingPreset) return;
    await updatePresetAsync({
      id: editingPreset.id,
      data,
    });
    setEditingPreset(null);
  };

  const handleEdit = (preset: SignalPresetWithStats) => {
    setEditingPreset(preset);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deletePresetAsync(id);
  };

  const handleOpenForm = () => {
    setEditingPreset(null);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">매매 전략</h3>
        <Button size="sm" onClick={handleOpenForm} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-1" />
          새 전략
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'default' | 'custom')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="default">
            기본 전략 ({defaultPresets.length})
          </TabsTrigger>
          <TabsTrigger value="custom">
            내 전략 ({presets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="default" className="mt-4">
          <div className="grid gap-3">
            {defaultPresetsWithStats.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isDefault
                onSelect={onSelectStrategy}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="mt-4">
          {presets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>아직 생성한 전략이 없습니다.</p>
              <p className="text-sm mt-1">새 전략 버튼을 눌러 나만의 전략을 만들어보세요.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {presets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  onSelect={onSelectStrategy}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PresetForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingPreset(null);
        }}
        preset={editingPreset}
        onSubmit={editingPreset ? handleUpdate : handleCreate}
      />
    </div>
  );
}
