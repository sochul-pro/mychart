'use client';

import { useCallback } from 'react';
import { Plus, GitBranch, Trash2, Brackets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConditionRow } from './ConditionRow';
import { CrossoverConditionRow } from './CrossoverConditionRow';
import type {
  Condition,
  SingleCondition,
  CrossoverCondition,
  LogicalCondition,
} from '@/lib/signals/types';
import { cn } from '@/lib/utils';

interface ConditionGroupProps {
  /** 현재 논리 조건 */
  condition: LogicalCondition;
  /** 조건 변경 콜백 */
  onChange: (condition: Condition) => void;
  /** 삭제 콜백 */
  onDelete?: () => void;
  /** 중첩 깊이 (스타일링용) */
  depth?: number;
}

/**
 * 기본 단일 조건 생성
 */
function createDefaultSingleCondition(): SingleCondition {
  return {
    type: 'single',
    indicator: 'rsi',
    operator: 'lt',
    value: 30,
    params: { period: 14 },
  };
}

/**
 * 기본 크로스오버 조건 생성
 */
function createDefaultCrossoverCondition(): CrossoverCondition {
  return {
    type: 'crossover',
    indicator1: 'sma',
    indicator2: 'sma',
    direction: 'up',
    params1: { period: 5 },
    params2: { period: 20 },
  };
}

/**
 * 기본 그룹 조건 생성
 */
function createDefaultGroupCondition(): LogicalCondition {
  return {
    type: 'and',
    conditions: [createDefaultSingleCondition()],
  };
}

/**
 * 조건 그룹 컴포넌트
 * 중첩된 AND/OR 그룹을 렌더링합니다.
 */
export function ConditionGroup({
  condition,
  onChange,
  onDelete,
  depth = 0,
}: ConditionGroupProps) {
  // 논리 연산자 토글 (AND/OR)
  const toggleLogicalOperator = useCallback(() => {
    const newType = condition.type === 'and' ? 'or' : 'and';
    onChange({
      ...condition,
      type: newType,
    } as LogicalCondition);
  }, [condition, onChange]);

  // 단일 조건 추가
  const addSingleCondition = useCallback(() => {
    onChange({
      ...condition,
      conditions: [...condition.conditions, createDefaultSingleCondition()],
    });
  }, [condition, onChange]);

  // 크로스오버 조건 추가
  const addCrossoverCondition = useCallback(() => {
    onChange({
      ...condition,
      conditions: [...condition.conditions, createDefaultCrossoverCondition()],
    });
  }, [condition, onChange]);

  // 그룹 조건 추가
  const addGroupCondition = useCallback(() => {
    onChange({
      ...condition,
      conditions: [...condition.conditions, createDefaultGroupCondition()],
    });
  }, [condition, onChange]);

  // 조건 삭제
  const deleteCondition = useCallback(
    (index: number) => {
      const newConditions = condition.conditions.filter((_, i) => i !== index);
      if (newConditions.length === 0) {
        // 모든 조건이 삭제되면 기본 조건으로 대체
        onChange(createDefaultSingleCondition());
      } else if (newConditions.length === 1) {
        // 하나만 남으면 그 조건으로 대체 (그룹 해제)
        onChange(newConditions[0]);
      } else {
        onChange({
          ...condition,
          conditions: newConditions,
        });
      }
    },
    [condition, onChange]
  );

  // 조건 업데이트
  const updateCondition = useCallback(
    (index: number, newCond: Condition) => {
      const newConditions = [...condition.conditions];
      newConditions[index] = newCond;
      onChange({
        ...condition,
        conditions: newConditions,
      });
    },
    [condition, onChange]
  );

  // 조건 렌더링
  const renderCondition = (cond: Condition, index: number) => {
    if (cond.type === 'single') {
      return (
        <ConditionRow
          condition={cond as SingleCondition}
          onChange={(updated) => updateCondition(index, updated)}
          onDelete={() => deleteCondition(index)}
        />
      );
    } else if (cond.type === 'crossover') {
      return (
        <CrossoverConditionRow
          condition={cond as CrossoverCondition}
          onChange={(updated) => updateCondition(index, updated)}
          onDelete={() => deleteCondition(index)}
        />
      );
    } else if (cond.type === 'and' || cond.type === 'or') {
      // 중첩된 그룹 - 재귀 렌더링
      return (
        <ConditionGroup
          condition={cond as LogicalCondition}
          onChange={(updated) => updateCondition(index, updated)}
          onDelete={() => deleteCondition(index)}
          depth={depth + 1}
        />
      );
    }
    return null;
  };

  // 깊이에 따른 스타일
  const borderColors = [
    'border-blue-500/50',
    'border-green-500/50',
    'border-purple-500/50',
    'border-orange-500/50',
  ];
  const bgColors = [
    'bg-blue-500/5',
    'bg-green-500/5',
    'bg-purple-500/5',
    'bg-orange-500/5',
  ];

  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed p-3 space-y-2',
        borderColors[depth % borderColors.length],
        bgColors[depth % bgColors.length]
      )}
    >
      {/* 그룹 헤더 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Brackets className="h-4 w-4 text-muted-foreground" />
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs font-bold"
            onClick={toggleLogicalOperator}
          >
            {condition.type === 'and' ? 'AND' : 'OR'}
          </Button>
          <span className="text-xs text-muted-foreground">그룹</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={addSingleCondition}
          >
            <Plus className="mr-1 h-3 w-3" />
            조건
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={addCrossoverCondition}
          >
            <GitBranch className="mr-1 h-3 w-3" />
            크로스
          </Button>
          {depth < 2 && ( // 최대 3단계 중첩까지 허용
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={addGroupCondition}
            >
              <Brackets className="mr-1 h-3 w-3" />
              그룹
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* 조건 목록 */}
      <div className="space-y-2">
        {condition.conditions.map((cond, index) => (
          <div key={index} className="relative">
            {index > 0 && (
              <div className="flex items-center justify-center py-1">
                <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 rounded bg-muted">
                  {condition.type === 'and' ? 'AND' : 'OR'}
                </span>
              </div>
            )}
            {renderCondition(cond, index)}
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {condition.conditions.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-2">
          조건을 추가해주세요
        </div>
      )}
    </div>
  );
}

export default ConditionGroup;
