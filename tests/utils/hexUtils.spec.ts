import { describe, expect, it } from 'vitest';
import {
  coordToKey,
  cubeToOffset,
  getHexNeighbors,
  hexDistance,
  keyToCoord,
  offsetToCube,
} from '../../src/lib/utils/hexUtils';

describe('hexUtils', () => {
  it('roundtrips offset and cube coordinates', () => {
    const original = { col: 5, row: 3 };
    expect(cubeToOffset(offsetToCube(original))).toEqual(original);
  });

  it('returns six neighbors for interior hexes', () => {
    expect(getHexNeighbors({ col: 7, row: 5 })).toHaveLength(6);
    expect(getHexNeighbors({ col: 7, row: 4 })).toHaveLength(6);
  });

  it('filters neighbors at the board edge', () => {
    expect(getHexNeighbors({ col: 0, row: 0 }).length).toBeLessThan(6);
    expect(getHexNeighbors({ col: 14, row: 10 }).length).toBeLessThan(6);
  });

  it('calculates cube distance correctly', () => {
    expect(hexDistance({ col: 0, row: 5 }, { col: 3, row: 5 })).toBe(3);
  });

  it('roundtrips coordinate keys', () => {
    expect(keyToCoord(coordToKey({ col: 9, row: 2 }))).toEqual({ col: 9, row: 2 });
  });
});
