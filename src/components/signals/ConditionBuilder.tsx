'use client';

import { useCallback } from 'react';
import { Plus, GitBranch, Brackets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ConditionRow } from './ConditionRow';
import { CrossoverConditionRow } from './CrossoverConditionRow';
import { ConditionGroup } from './ConditionGroup';
import type {
  Condition,
  SingleCondition,
  CrossoverCondition,
  LogicalCondition,
} from '@/lib/signals/types';

export interface ConditionBuilderProps {
  /** 현재 조건 */
  condition: Condition;
  /** 조건 변경 콜백 */
  onConditionChange: (condition: Condition) => void;
  /** 라벨 */
  label: string;
}

/**
 * 기본 AND 조건 생성
 */
function createDefaultAndCondition(): LogicalCondition {
  return {
    type: 'and',
    conditions: [],
  };
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
 * 조건 빌더 컴포넌트
 * AND/OR 논리 연산자와 단일/크로스오버 조건을 조합할 수 있습니다.
 */
export function ConditionBuilder({
  condition,
  onConditionChange,
  label,
}: ConditionBuilderProps) {
  // 논리 조건인지 확인
  const isLogicalCondition = condition.type === 'and' || condition.type === 'or';
  const logicalCondition = isLogicalCondition
    ? (condition as LogicalCondition)
    : createDefaultAndCondition();

  // 논리 연산자 토글 (AND/OR)
  const toggleLogicalOperator = useCallback(() => {
    if (!isLogicalCondition) return;
    const newType = logicalCondition.type === 'and' ? 'or' : 'and';
    onConditionChange({
      ...logicalCondition,
      type: newType,
    } as LogicalCondition);
  }, [isLogicalCondition, logicalCondition, onConditionChange]);

  // 단일 조건 추가
  const addSingleCondition = useCallback(() => {
    if (isLogicalCondition) {
      onConditionChange({
        ...logicalCondition,
        conditions: [...logicalCondition.conditions, createDefaultSingleCondition()],
      });
    } else {
      // 기존 조건을 AND로 래핑
      onConditionChange({
        type: 'and',
        conditions: [condition, createDefaultSingleCondition()],
      });
    }
  }, [isLogicalCondition, logicalCondition, condition, onConditionChange]);

  // 크로스오버 조건 추가
  const addCrossoverCondition = useCallback(() => {
    if (isLogicalCondition) {
      onConditionChange({
        ...logicalCondition,
        conditions: [...logicalCondition.conditions, createDefaultCrossoverCondition()],
      });
    } else {
      onConditionChange({
        type: 'and',
        conditions: [condition, createDefaultCrossoverCondition()],
      });
    }
  }, [isLogicalCondition, logicalCondition, condition, onConditionChange]);

  // 그룹 조건 추가
  const addGroupCondition = useCallback(() => {
    if (isLogicalCondition) {
      onConditionChange({
        ...logicalCondition,
        conditions: [...logicalCondition.conditions, createDefaultGroupCondition()],
      });
    } else {
      onConditionChange({
        type: 'and',
        conditions: [condition, createDefaultGroupCondition()],
      });
    }
  }, [isLogicalCondition, logicalCondition, condition, onConditionChange]);

  // 조건 삭제
  const deleteCondition = useCallback(
    (index: number) => {
      if (!isLogicalCondition) return;
      const newConditions = logicalCondition.conditions.filter((_, i) => i !== index);
      if (newConditions.length === 0) {
        // 모든 조건이 삭제되면 기본 조건으로 대체
        onConditionChange(createDefaultSingleCondition());
      } else if (newConditions.length === 1) {
        // 하나만 남으면 그 조건으로 대체
        onConditionChange(newConditions[0]);
      } else {
        onConditionChange({
          ...logicalCondition,
          conditions: newConditions,
        });
      }
    },
    [isLogicalCondition, logicalCondition, onConditionChange]
  );

  // 조건 업데이트
  const updateCondition = useCallback(
    (index: number, newCondition: Condition) => {
      if (!isLogicalCondition) {
        onConditionChange(newCondition);
        return;
      }
      const newConditions = [...logicalCondition.conditions];
      newConditions[index] = newCondition;
      onConditionChange({
        ...logicalCondition,
        conditions: newConditions,
      });
    },
    [isLogicalCondition, logicalCondition, onConditionChange]
  );

  // 조건 렌더링
  const renderCondition = (cond: Condition, index: number) => {
    if (cond.type === 'single') {
      return (
        <ConditionRow
          key={index}
          condition={cond as SingleCondition}
          onChange={(updated) => updateCondition(index, updated)}
          onDelete={() => deleteCondition(index)}
        />
      );
    } else if (cond.type === 'crossover') {
      return (
        <CrossoverConditionRow
          key={index}
          condition={cond as CrossoverCondition}
          onChange={(updated) => updateCondition(index, updated)}
          onDelete={() => deleteCondition(index)}
        />
      );
    } else if (cond.type === 'and' || cond.type === 'or') {
      // 중첩된 그룹 렌더링
      return (
        <ConditionGroup
          key={index}
          condition={cond as LogicalCondition}
          onChange={(updated) => updateCondition(index, updated)}
          onDelete={() => deleteCondition(index)}
          depth={0}
        />
      );
    }
    return null;
  };

  // 단일 조건만 있는 경우
  if (!isLogicalCondition) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={addSingleCondition}
            >
              <Plus className="mr-1 h-3 w-3" />
              조건
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={addCrossoverCondition}
            >
              <GitBranch className="mr-1 h-3 w-3" />
              크로스
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={addGroupCondition}
            >
              <Brackets className="mr-1 h-3 w-3" />
              그룹
            </Button>
          </div>
        </div>
        {condition.type === 'single' && (
          <ConditionRow
            condition={condition as SingleCondition}
            onChange={(updated) => onConditionChange(updated)}
            onDelete={() => onConditionChange(createDefaultSingleCondition())}
          />
        )}
        {condition.type === 'crossover' && (
          <CrossoverConditionRow
            condition={condition as CrossoverCondition}
            onChange={(updated) => onConditionChange(updated)}
            onDelete={() => onConditionChange(createDefaultCrossoverCondition())}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          {/* AND/OR 토글 */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={toggleLogicalOperator}
          >
            {logicalCondition.type === 'and' ? 'AND' : 'OR'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={addSingleCondition}
          >
            <Plus className="mr-1 h-3 w-3" />
            조건
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={addCrossoverCondition}
          >
            <GitBranch className="mr-1 h-3 w-3" />
            크로스
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={addGroupCondition}
          >
            <Brackets className="mr-1 h-3 w-3" />
            그룹
          </Button>
        </div>
      </div>

      {/* 조건 목록 */}
      <div className="space-y-2">
        {logicalCondition.conditions.map((cond, index) => (
          <div key={index} className="relative">
            {index > 0 && (
              <div className="absolute -top-1.5 left-4 text-xs font-medium text-muted-foreground">
                {logicalCondition.type === 'and' ? 'AND' : 'OR'}
              </div>
            )}
            <div className={index > 0 ? 'pt-3' : ''}>
              {renderCondition(cond, index)}
            </div>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {logicalCondition.conditions.length === 0 && (
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          조건을 추가해주세요
        </div>
      )}
    </div>
  );
}

export default ConditionBuilder;
