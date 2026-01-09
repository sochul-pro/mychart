import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, ChartErrorBoundary, NewsErrorBoundary } from './ErrorBoundary';

// 에러를 발생시키는 테스트용 컴포넌트
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>정상 렌더링</div>;
}

// console.error 모킹 (React의 에러 로그 억제)
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('ErrorBoundary', () => {
  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('정상 렌더링')).toBeInTheDocument();
  });

  it('should render default fallback UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /다시 시도/i })).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>커스텀 에러 UI</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('커스텀 에러 UI')).toBeInTheDocument();
    expect(screen.queryByText('문제가 발생했습니다')).not.toBeInTheDocument();
  });

  it('should render custom message when provided', () => {
    render(
      <ErrorBoundary message="데이터 로드 실패">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('데이터 로드 실패')).toBeInTheDocument();
  });

  it('should reset error state on retry button click', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // 에러 UI 확인
    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();

    // shouldThrow를 false로 변경하고 리렌더
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // 다시 시도 버튼 클릭
    fireEvent.click(screen.getByRole('button', { name: /다시 시도/i }));

    // 정상 렌더링 확인
    expect(screen.getByText('정상 렌더링')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onErrorMock = vi.fn();

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });
});

describe('ChartErrorBoundary', () => {
  it('should render children when no error', () => {
    render(
      <ChartErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ChartErrorBoundary>
    );

    expect(screen.getByText('정상 렌더링')).toBeInTheDocument();
  });

  it('should render chart-specific fallback UI when error occurs', () => {
    render(
      <ChartErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ChartErrorBoundary>
    );

    expect(screen.getByText('차트 렌더링에 실패했습니다.')).toBeInTheDocument();
    expect(screen.getByText('페이지를 새로고침 해주세요.')).toBeInTheDocument();
  });
});

describe('NewsErrorBoundary', () => {
  it('should render children when no error', () => {
    render(
      <NewsErrorBoundary>
        <ThrowError shouldThrow={false} />
      </NewsErrorBoundary>
    );

    expect(screen.getByText('정상 렌더링')).toBeInTheDocument();
  });

  it('should render news-specific fallback UI when error occurs', () => {
    render(
      <NewsErrorBoundary>
        <ThrowError shouldThrow={true} />
      </NewsErrorBoundary>
    );

    expect(screen.getByText('뉴스를 불러올 수 없습니다.')).toBeInTheDocument();
  });
});
