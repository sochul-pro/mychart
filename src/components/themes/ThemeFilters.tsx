'use client';

import { memo } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ThemeFilter, ThemeFilterType, ThemeSortBy } from '@/types';

interface ThemeFiltersProps {
  filter: Partial<ThemeFilter>;
  onFilterChange: (filter: Partial<ThemeFilter>) => void;
  onReset?: () => void;
}

const FILTER_TYPES: { value: ThemeFilterType; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'advance', label: '상승' },
  { value: 'decline', label: '하락' },
];

const SORT_OPTIONS: { value: ThemeSortBy; label: string }[] = [
  { value: 'change', label: '등락률' },
  { value: 'stockCount', label: '종목수' },
  { value: 'name', label: '테마명' },
];

export const ThemeFilters = memo(function ThemeFilters({
  filter,
  onFilterChange,
  onReset,
}: ThemeFiltersProps) {
  const handleTypeChange = (type: ThemeFilterType) => {
    onFilterChange({ ...filter, type });
  };

  const handleSortByChange = (sortBy: ThemeSortBy) => {
    onFilterChange({ ...filter, sortBy });
  };

  const handleSortOrderToggle = () => {
    onFilterChange({
      ...filter,
      sortOrder: filter.sortOrder === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleSearchChange = (search: string) => {
    onFilterChange({ ...filter, search: search || undefined });
  };

  return (
    <div className="space-y-4">
      {/* 필터 타입 */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_TYPES.map((type) => (
          <Badge
            key={type.value}
            variant={filter.type === type.value ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer select-none px-3 py-1',
              filter.type === type.value && 'bg-primary'
            )}
            onClick={() => handleTypeChange(type.value)}
          >
            {type.label}
          </Badge>
        ))}
      </div>

      {/* 정렬 및 검색 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">정렬:</span>
          <Select
            value={filter.sortBy || 'change'}
            onValueChange={(value) => handleSortByChange(value as ThemeSortBy)}
          >
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSortOrderToggle}
            className="h-9 px-2"
          >
            {filter.sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="테마 검색..."
            value={filter.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {onReset && (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-9">
            <RotateCcw className="h-4 w-4 mr-1" />
            초기화
          </Button>
        )}
      </div>
    </div>
  );
});
