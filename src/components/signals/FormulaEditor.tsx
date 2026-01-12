'use client';

import { useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, Lightbulb } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  parseFormula,
  validateFormula,
  conditionToFormula,
  FORMULA_INDICATORS,
  FORMULA_OPERATORS,
  FORMULA_EXAMPLES,
} from '@/lib/signals/formula';
import type { Condition } from '@/lib/signals/types';

interface FormulaEditorProps {
  /** 라벨 */
  label: string;
  /** 현재 조건 */
  condition: Condition;
  /** 조건 변경 콜백 */
  onConditionChange: (condition: Condition) => void;
  /** 플레이스홀더 */
  placeholder?: string;
}

/**
 * 수식 편집기 컴포넌트
 */
export function FormulaEditor({
  label,
  condition,
  onConditionChange,
  placeholder = 'RSI(14) < 30 AND SMA(20) > SMA(60)',
}: FormulaEditorProps) {
  // 수식 문자열 상태
  const [formula, setFormula] = useState(() => conditionToFormula(condition));
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  // 조건이 외부에서 변경되면 수식 업데이트
  useEffect(() => {
    const newFormula = conditionToFormula(condition);
    if (newFormula !== formula) {
      setFormula(newFormula);
      setError(null);
      setIsValid(true);
    }
  // formula를 의존성에서 제외 (무한 루프 방지)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condition]);

  // 수식 변경 핸들러
  const handleFormulaChange = useCallback((value: string) => {
    setFormula(value);

    if (!value.trim()) {
      setError(null);
      setIsValid(false);
      return;
    }

    const validation = validateFormula(value);
    if (validation.valid) {
      setError(null);
      setIsValid(true);
      try {
        const parsed = parseFormula(value);
        onConditionChange(parsed);
      } catch {
        // 파싱 실패 시 무시
      }
    } else {
      setError(validation.error || '수식이 올바르지 않습니다');
      setIsValid(false);
    }
  }, [onConditionChange]);

  // 예제 클릭
  const handleExampleClick = useCallback((exampleFormula: string) => {
    setFormula(exampleFormula);
    handleFormulaChange(exampleFormula);
    setShowExamples(false);
  }, [handleFormulaChange]);

  // 지표 삽입
  const insertIndicator = useCallback((indicator: string) => {
    const newFormula = formula ? `${formula} ${indicator}` : indicator;
    setFormula(newFormula);
    handleFormulaChange(newFormula);
  }, [formula, handleFormulaChange]);

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-1">
          {/* 예제 버튼 */}
          <Popover open={showExamples} onOpenChange={setShowExamples}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <Lightbulb className="mr-1 h-3 w-3" />
                예제
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96" align="end">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">수식 예제</h4>
                <div className="space-y-1">
                  {FORMULA_EXAMPLES.map((example, i) => (
                    <button
                      key={i}
                      className="w-full text-left p-2 rounded hover:bg-muted text-sm"
                      onClick={() => handleExampleClick(example.formula)}
                    >
                      <div className="font-mono text-xs text-primary">
                        {example.formula}
                      </div>
                      <div className="text-muted-foreground text-xs mt-0.5">
                        {example.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* 도움말 버튼 */}
          <Popover open={showHelp} onOpenChange={setShowHelp}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <HelpCircle className="mr-1 h-3 w-3" />
                도움말
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">수식 문법</h4>

                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary">
                    <Badge variant="outline">지표</Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="grid gap-1 text-xs">
                      {FORMULA_INDICATORS.map((ind, i) => (
                        <button
                          key={i}
                          className="flex justify-between p-1 rounded hover:bg-muted text-left"
                          onClick={() => {
                            insertIndicator(ind.example || ind.name);
                            setShowHelp(false);
                          }}
                        >
                          <code className="text-primary">{ind.name}</code>
                          <span className="text-muted-foreground">{ind.description}</span>
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary">
                    <Badge variant="outline">연산자</Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="grid gap-1 text-xs">
                      {FORMULA_OPERATORS.map((op, i) => (
                        <button
                          key={i}
                          className="flex justify-between p-1 rounded hover:bg-muted text-left"
                          onClick={() => {
                            insertIndicator(op.name);
                            setShowHelp(false);
                          }}
                        >
                          <code className="text-primary">{op.name}</code>
                          <span className="text-muted-foreground">{op.description}</span>
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="text-xs text-muted-foreground">
                  <p>• 괄호로 우선순위 지정: <code>(A OR B) AND C</code></p>
                  <p>• 대소문자 구분 없음</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 수식 입력 */}
      <div className="relative">
        <Textarea
          value={formula}
          onChange={(e) => handleFormulaChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'font-mono text-sm min-h-[80px] pr-8',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
        />
        {/* 유효성 아이콘 */}
        <div className="absolute right-2 top-2">
          {formula.trim() && (
            isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )
          )}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* 파싱된 조건 미리보기 */}
      {isValid && formula.trim() && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
          <span className="font-medium">파싱 결과: </span>
          <code>{conditionToFormula(condition)}</code>
        </div>
      )}
    </div>
  );
}

export default FormulaEditor;
