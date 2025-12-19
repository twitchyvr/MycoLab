// ============================================================================
// LOOKUP MAPS
// O(1) entity lookups using Map data structures
// Replaces linear array.find() operations
// ============================================================================

/**
 * Generic lookup map that provides O(1) lookups by ID
 */
export class LookupMap<T extends { id: string }> {
  private _map: Map<string, T> = new Map();
  private _array: T[] = [];
  private isDirty = true;

  constructor(items?: T[]) {
    if (items) {
      this.setAll(items);
    }
  }

  /**
   * Get an item by ID - O(1)
   */
  get(id: string): T | undefined {
    return this._map.get(id);
  }

  /**
   * Check if an ID exists - O(1)
   */
  has(id: string): boolean {
    return this._map.has(id);
  }

  /**
   * Set an item (add or update) - O(1)
   */
  set(item: T): void {
    this._map.set(item.id, item);
    this.isDirty = true;
  }

  /**
   * Delete an item by ID - O(1)
   */
  delete(id: string): boolean {
    const result = this._map.delete(id);
    if (result) {
      this.isDirty = true;
    }
    return result;
  }

  /**
   * Set all items (replaces existing)
   */
  setAll(items: T[]): void {
    this._map.clear();
    for (const item of items) {
      this._map.set(item.id, item);
    }
    this._array = items;
    this.isDirty = false;
  }

  /**
   * Get all items as an array (cached)
   */
  getAll(): T[] {
    if (this.isDirty) {
      this._array = Array.from(this._map.values());
      this.isDirty = false;
    }
    return this._array;
  }

  /**
   * Get the count of items
   */
  get size(): number {
    return this._map.size;
  }

  /**
   * Clear all items
   */
  clear(): void {
    this._map.clear();
    this._array = [];
    this.isDirty = false;
  }

  /**
   * Update an item by ID (partial update)
   */
  update(id: string, updates: Partial<T>): T | undefined {
    const existing = this._map.get(id);
    if (existing) {
      const updated = { ...existing, ...updates };
      this._map.set(id, updated);
      this.isDirty = true;
      return updated;
    }
    return undefined;
  }

  /**
   * Find items matching a predicate
   */
  filter(predicate: (item: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }

  /**
   * Get multiple items by IDs
   */
  getMany(ids: string[]): T[] {
    return ids.map((id) => this._map.get(id)).filter((item): item is T => item !== undefined);
  }

  /**
   * Iterate over all items
   */
  forEach(callback: (item: T, id: string) => void): void {
    this._map.forEach((item, id) => callback(item, id));
  }

  /**
   * Map over all items
   */
  map<U>(callback: (item: T, id: string) => U): U[] {
    const result: U[] = [];
    this._map.forEach((item, id) => {
      result.push(callback(item, id));
    });
    return result;
  }

  /**
   * Get items as entries
   */
  entries(): IterableIterator<[string, T]> {
    return this._map.entries();
  }

  /**
   * Get item IDs
   */
  keys(): IterableIterator<string> {
    return this._map.keys();
  }

  /**
   * Get item values
   */
  values(): IterableIterator<T> {
    return this._map.values();
  }
}

/**
 * Indexed lookup map with secondary indexes
 */
export class IndexedLookupMap<T extends { id: string }> extends LookupMap<T> {
  private indexes: Map<string, Map<unknown, Set<string>>> = new Map();

  constructor(items?: T[], indexFields?: string[]) {
    super(items);
    if (indexFields) {
      for (const field of indexFields) {
        this.createIndex(field);
      }
    }
  }

  /**
   * Create a secondary index on a field
   */
  createIndex(field: string): void {
    if (this.indexes.has(field)) return;

    const index = new Map<unknown, Set<string>>();
    this.indexes.set(field, index);

    // Build index from existing items
    this.forEach((item) => {
      const value = (item as Record<string, unknown>)[field];
      if (!index.has(value)) {
        index.set(value, new Set());
      }
      index.get(value)!.add(item.id);
    });
  }

  /**
   * Get items by indexed field value - O(1) lookup + O(n) retrieval
   */
  getByIndex(field: string, value: unknown): T[] {
    const index = this.indexes.get(field);
    if (!index) {
      console.warn(`[IndexedLookupMap] No index for field: ${field}`);
      return this.filter((item) => (item as Record<string, unknown>)[field] === value);
    }

    const ids = index.get(value);
    if (!ids) return [];

    return this.getMany(Array.from(ids));
  }

  /**
   * Override set to update indexes
   */
  set(item: T): void {
    const existing = this.get(item.id);

    // Remove from old index positions
    if (existing) {
      this.removeFromIndexes(existing);
    }

    super.set(item);
    this.addToIndexes(item);
  }

  /**
   * Override delete to update indexes
   */
  delete(id: string): boolean {
    const existing = this.get(id);
    if (existing) {
      this.removeFromIndexes(existing);
    }
    return super.delete(id);
  }

  /**
   * Override setAll to rebuild indexes
   */
  setAll(items: T[]): void {
    // Clear all indexes
    for (const index of this.indexes.values()) {
      index.clear();
    }

    super.setAll(items);

    // Rebuild indexes
    for (const item of items) {
      this.addToIndexes(item);
    }
  }

  /**
   * Override clear to clear indexes
   */
  clear(): void {
    for (const index of this.indexes.values()) {
      index.clear();
    }
    super.clear();
  }

  private addToIndexes(item: T): void {
    for (const [field, index] of this.indexes.entries()) {
      const value = (item as Record<string, unknown>)[field];
      if (!index.has(value)) {
        index.set(value, new Set());
      }
      index.get(value)!.add(item.id);
    }
  }

  private removeFromIndexes(item: T): void {
    for (const [field, index] of this.indexes.entries()) {
      const value = (item as Record<string, unknown>)[field];
      const ids = index.get(value);
      if (ids) {
        ids.delete(item.id);
        if (ids.size === 0) {
          index.delete(value);
        }
      }
    }
  }
}

/**
 * Store of all entity lookup maps
 */
export class EntityStore {
  private readonly _entityMaps: Map<string, LookupMap<any>> = new Map();

  /**
   * Get or create a lookup map for an entity type
   */
  getMap<T extends { id: string }>(entityType: string): LookupMap<T> {
    if (!this._entityMaps.has(entityType)) {
      this._entityMaps.set(entityType, new LookupMap<T>());
    }
    return this._entityMaps.get(entityType) as LookupMap<T>;
  }

  /**
   * Get or create an indexed lookup map
   */
  getIndexedMap<T extends { id: string }>(
    entityType: string,
    indexFields: string[]
  ): IndexedLookupMap<T> {
    if (!this._entityMaps.has(entityType)) {
      this._entityMaps.set(entityType, new IndexedLookupMap<T>([], indexFields));
    }
    return this._entityMaps.get(entityType) as IndexedLookupMap<T>;
  }

  /**
   * Set items for an entity type
   */
  setItems<T extends { id: string }>(entityType: string, items: T[]): void {
    this.getMap<T>(entityType).setAll(items);
  }

  /**
   * Get an item by type and ID
   */
  getItem<T extends { id: string }>(entityType: string, id: string): T | undefined {
    return this.getMap<T>(entityType).get(id);
  }

  /**
   * Get all items of a type
   */
  getAllItems<T extends { id: string }>(entityType: string): T[] {
    return this.getMap<T>(entityType).getAll();
  }

  /**
   * Clear all maps
   */
  clear(): void {
    for (const lookupMap of this._entityMaps.values()) {
      lookupMap.clear();
    }
    this._entityMaps.clear();
  }

  /**
   * Get statistics
   */
  getStats(): { entityType: string; count: number }[] {
    return Array.from(this._entityMaps.entries()).map(([entityType, lookupMap]) => ({
      entityType,
      count: lookupMap.size,
    }));
  }
}

// Create singleton instance
export const entityStore = new EntityStore();

// ============================================================================
// REACT HOOKS FOR LOOKUP MAPS
// ============================================================================

import { useMemo, useCallback } from 'react';

/**
 * Hook to create a memoized lookup map from an array
 */
export function useLookupMap<T extends { id: string }>(items: T[]): LookupMap<T> {
  return useMemo(() => {
    const map = new LookupMap<T>();
    map.setAll(items);
    return map;
  }, [items]);
}

/**
 * Hook to create a memoized indexed lookup map
 */
export function useIndexedLookupMap<T extends { id: string }>(
  items: T[],
  indexFields: string[]
): IndexedLookupMap<T> {
  return useMemo(() => {
    const map = new IndexedLookupMap<T>(items, indexFields);
    return map;
  }, [items, indexFields.join(',')]);
}

/**
 * Hook to get a memoized lookup function
 */
export function useLookup<T extends { id: string }>(
  items: T[]
): (id: string) => T | undefined {
  const map = useLookupMap(items);
  return useCallback((id: string) => map.get(id), [map]);
}
