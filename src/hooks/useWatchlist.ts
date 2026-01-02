import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  WatchlistGroup,
  WatchlistItem,
  CreateWatchlistGroupRequest,
  UpdateWatchlistGroupRequest,
  AddWatchlistItemRequest,
  UpdateWatchlistItemRequest,
} from '@/types';

const WATCHLIST_KEY = ['watchlist'];

async function fetchWatchlist(): Promise<WatchlistGroup[]> {
  const res = await fetch('/api/watchlist');
  if (!res.ok) throw new Error('Failed to fetch watchlist');
  return res.json();
}

async function createGroup(data: CreateWatchlistGroupRequest): Promise<WatchlistGroup> {
  const res = await fetch('/api/watchlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create group');
  return res.json();
}

async function updateGroup(
  groupId: string,
  data: UpdateWatchlistGroupRequest
): Promise<WatchlistGroup> {
  const res = await fetch(`/api/watchlist/${groupId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update group');
  return res.json();
}

async function deleteGroup(groupId: string): Promise<void> {
  const res = await fetch(`/api/watchlist/${groupId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete group');
}

async function addItem(
  groupId: string,
  data: AddWatchlistItemRequest
): Promise<WatchlistItem> {
  const res = await fetch(`/api/watchlist/${groupId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add item');
  }
  return res.json();
}

async function updateItem(
  groupId: string,
  itemId: string,
  data: UpdateWatchlistItemRequest
): Promise<WatchlistItem> {
  const res = await fetch(`/api/watchlist/${groupId}/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update item');
  return res.json();
}

async function deleteItem(groupId: string, itemId: string): Promise<void> {
  const res = await fetch(`/api/watchlist/${groupId}/items/${itemId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete item');
}

async function reorderItems(groupId: string, itemIds: string[]): Promise<void> {
  const res = await fetch(`/api/watchlist/${groupId}/items/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemIds }),
  });
  if (!res.ok) throw new Error('Failed to reorder items');
}

async function reorderGroups(groupIds: string[]): Promise<void> {
  const res = await fetch('/api/watchlist/reorder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupIds }),
  });
  if (!res.ok) throw new Error('Failed to reorder groups');
}

export function useWatchlist() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: WATCHLIST_KEY,
    queryFn: fetchWatchlist,
  });

  const createGroupMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEY });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: UpdateWatchlistGroupRequest }) =>
      updateGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEY });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEY });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: AddWatchlistItemRequest }) =>
      addItem(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEY });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({
      groupId,
      itemId,
      data,
    }: {
      groupId: string;
      itemId: string;
      data: UpdateWatchlistItemRequest;
    }) => updateItem(groupId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEY });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ groupId, itemId }: { groupId: string; itemId: string }) =>
      deleteItem(groupId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEY });
    },
  });

  const reorderItemsMutation = useMutation({
    mutationFn: ({ groupId, itemIds }: { groupId: string; itemIds: string[] }) =>
      reorderItems(groupId, itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEY });
    },
  });

  const reorderGroupsMutation = useMutation({
    mutationFn: reorderGroups,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEY });
    },
  });

  return {
    groups: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createGroup: createGroupMutation.mutateAsync,
    updateGroup: updateGroupMutation.mutateAsync,
    deleteGroup: deleteGroupMutation.mutateAsync,
    addItem: addItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutateAsync,
    deleteItem: deleteItemMutation.mutateAsync,
    reorderItems: reorderItemsMutation.mutateAsync,
    reorderGroups: reorderGroupsMutation.mutateAsync,
    isCreatingGroup: createGroupMutation.isPending,
    isAddingItem: addItemMutation.isPending,
  };
}
