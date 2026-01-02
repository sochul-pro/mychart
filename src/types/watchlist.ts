// 관심종목 그룹
export interface WatchlistGroup {
  id: string;
  name: string;
  order: number;
  items: WatchlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

// 관심종목 항목
export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  order: number;
  memo?: string | null;
  targetPrice?: number | null;
  buyPrice?: number | null;
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
}

// API 요청/응답 타입
export interface CreateWatchlistGroupRequest {
  name: string;
}

export interface UpdateWatchlistGroupRequest {
  name?: string;
  order?: number;
}

export interface AddWatchlistItemRequest {
  symbol: string;
  name: string;
  memo?: string;
  targetPrice?: number;
  buyPrice?: number;
}

export interface UpdateWatchlistItemRequest {
  memo?: string | null;
  targetPrice?: number | null;
  buyPrice?: number | null;
  order?: number;
}

export interface ReorderItemsRequest {
  itemIds: string[];
}

export interface ReorderGroupsRequest {
  groupIds: string[];
}
