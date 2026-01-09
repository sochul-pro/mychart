'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  /** 자식 컴포넌트 */
  children: ReactNode;
  /** 에러 발생 시 표시할 대체 UI */
  fallback?: ReactNode;
  /** 에러 발생 시 콜백 */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** 에러 메시지 */
  message?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React 에러 바운더리 컴포넌트
 * 자식 컴포넌트에서 발생한 렌더링 에러를 캐치하여 대체 UI를 표시합니다.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50">
          <AlertTriangle className="h-10 w-10 text-yellow-500 mb-3" />
          <h3 className="text-sm font-medium text-foreground mb-1">
            {this.props.message || '문제가 발생했습니다'}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleReset}
            className="gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            다시 시도
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 차트 에러 바운더리 - 차트 전용 대체 UI
 */
export function ChartErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      message="차트를 로드할 수 없습니다"
      fallback={
        <div className="flex items-center justify-center h-[400px] bg-muted/50 rounded-lg border border-dashed border-muted-foreground/25">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              차트 렌더링에 실패했습니다.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              페이지를 새로고침 해주세요.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * 뉴스 에러 바운더리 - 뉴스 전용 대체 UI
 */
export function NewsErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      message="뉴스를 로드할 수 없습니다"
      fallback={
        <div className="p-4 text-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50">
          <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            뉴스를 불러올 수 없습니다.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
