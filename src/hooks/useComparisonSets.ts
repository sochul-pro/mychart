import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ComparisonSet, ComparePeriod } from '@/types/comparison';

/**
 * 비교 세트 목록 조회
 */
async function fetchComparisonSets(): Promise<ComparisonSet[]> {
  const res = await fetch('/api/compare/sets');

  if (!res.ok) {
    if (res.status === 401) {
      return []; // 로그인 안 된 경우 빈 배열
    }
    throw new Error('비교 세트를 불러오는데 실패했습니다.');
  }

  return res.json();
}

/**
 * 비교 세트 생성
 */
async function createComparisonSet(data: {
  name: string;
  symbols: string[];
  period?: ComparePeriod;
}): Promise<ComparisonSet> {
  const res = await fetch('/api/compare/sets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || '세트 저장에 실패했습니다.');
  }

  return res.json();
}

/**
 * 비교 세트 수정
 */
async function updateComparisonSet(
  id: string,
  data: {
    name?: string;
    symbols?: string[];
    period?: ComparePeriod;
  }
): Promise<ComparisonSet> {
  const res = await fetch(`/api/compare/sets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || '세트 수정에 실패했습니다.');
  }

  return res.json();
}

/**
 * 비교 세트 삭제
 */
async function deleteComparisonSet(id: string): Promise<void> {
  const res = await fetch(`/api/compare/sets/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || '세트 삭제에 실패했습니다.');
  }
}

/**
 * 비교 세트 CRUD 훅
 *
 * @example
 * ```tsx
 * const {
 *   sets,
 *   isLoading,
 *   createSet,
 *   updateSet,
 *   deleteSet,
 * } = useComparisonSets();
 *
 * // 세트 생성
 * await createSet({ name: '반도체 비교', symbols: ['005930', '000660'] });
 *
 * // 세트 수정
 * await updateSet({ id: 'xxx', symbols: ['005930', '000660', '373220'] });
 *
 * // 세트 삭제
 * await deleteSet('xxx');
 * ```
 */
export function useComparisonSets() {
  const queryClient = useQueryClient();
  const queryKey = ['comparison', 'sets'];

  // 목록 조회
  const {
    data: sets = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: fetchComparisonSets,
    staleTime: 5 * 60 * 1000,
  });

  // 생성 뮤테이션
  const createMutation = useMutation({
    mutationFn: createComparisonSet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 수정 뮤테이션
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; symbols?: string[]; period?: ComparePeriod }) =>
      updateComparisonSet(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: deleteComparisonSet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    sets,
    isLoading,
    error,
    refetch,

    // 생성
    createSet: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    // 수정
    updateSet: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // 삭제
    deleteSet: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // 전체 로딩/에러 상태
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
