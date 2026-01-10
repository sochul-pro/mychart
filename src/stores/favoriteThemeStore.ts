import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FavoriteTheme } from '@/types';

interface LocalFavoriteTheme {
  id: string;
  themeId: string;
  themeName: string;
  order: number;
  createdAt: number;
}

interface FavoriteThemeStore {
  favorites: LocalFavoriteTheme[];

  // 액션
  addFavorite: (themeId: string, themeName: string) => void;
  removeFavorite: (id: string) => void;
  removeByThemeId: (themeId: string) => void;
  reorderFavorites: (orderedIds: string[]) => void;
  clearAll: () => void;

  // 유틸리티
  isFavorite: (themeId: string) => boolean;
  getFavoriteByThemeId: (themeId: string) => LocalFavoriteTheme | undefined;
}

/**
 * 비로그인 사용자를 위한 관심 테마 로컬 스토어
 * localStorage에 저장됩니다.
 */
export const useFavoriteThemeStore = create<FavoriteThemeStore>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (themeId: string, themeName: string) => {
        const { favorites, isFavorite } = get();

        // 이미 추가된 테마인지 확인
        if (isFavorite(themeId)) return;

        const newFavorite: LocalFavoriteTheme = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          themeId,
          themeName,
          order: favorites.length,
          createdAt: Date.now(),
        };

        set({ favorites: [...favorites, newFavorite] });
      },

      removeFavorite: (id: string) => {
        const { favorites } = get();
        const filtered = favorites.filter((f) => f.id !== id);

        // 순서 재정렬
        const reordered = filtered.map((f, index) => ({ ...f, order: index }));
        set({ favorites: reordered });
      },

      removeByThemeId: (themeId: string) => {
        const { favorites } = get();
        const filtered = favorites.filter((f) => f.themeId !== themeId);

        // 순서 재정렬
        const reordered = filtered.map((f, index) => ({ ...f, order: index }));
        set({ favorites: reordered });
      },

      reorderFavorites: (orderedIds: string[]) => {
        const { favorites } = get();
        const reordered = orderedIds
          .map((id, index) => {
            const item = favorites.find((f) => f.id === id);
            return item ? { ...item, order: index } : null;
          })
          .filter(Boolean) as LocalFavoriteTheme[];

        set({ favorites: reordered });
      },

      clearAll: () => {
        set({ favorites: [] });
      },

      isFavorite: (themeId: string) => {
        return get().favorites.some((f) => f.themeId === themeId);
      },

      getFavoriteByThemeId: (themeId: string) => {
        return get().favorites.find((f) => f.themeId === themeId);
      },
    }),
    {
      name: 'mychart-favorite-themes',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
