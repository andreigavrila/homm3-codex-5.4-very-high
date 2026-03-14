import { describe, expect, it } from 'vitest';
import { findPath, getReachableHexes, hexDistance } from '../../src/lib/engine/pathfinding';
import { PLAYER_1, PLAYER_2, SCENARIO_SURROUNDED, UNIT_PIKEMAN, createEmptyBattlefield, createStack } from '../fixtures';

describe('pathfinding engine', () => {
  describe('A*', () => {
    it('findsShortestPath', () => {
      const battlefield = createEmptyBattlefield();
      const path = findPath({ col: 0, row: 5 }, { col: 3, row: 5 }, battlefield);
      expect(path).not.toBeNull();
      expect(path).toHaveLength(4);
    });

    it('avoidsObstacles', () => {
      const battlefield = createEmptyBattlefield();
      battlefield.hexes[2][5].isObstacle = true;
      const path = findPath({ col: 0, row: 5 }, { col: 4, row: 5 }, battlefield);
      expect(path).not.toBeNull();
      expect(path!.some((hex) => hex.col === 2 && hex.row === 5)).toBe(false);
    });

    it('avoidsOccupiedHexes', () => {
      const battlefield = createEmptyBattlefield();
      battlefield.hexes[2][5].occupant = createStack(UNIT_PIKEMAN, PLAYER_2, 3, { col: 2, row: 5 });
      const path = findPath({ col: 0, row: 5 }, { col: 4, row: 5 }, battlefield);
      expect(path).not.toBeNull();
      expect(path!.some((hex) => hex.col === 2 && hex.row === 5)).toBe(false);
    });

    it('returnsNullIfNoPath', () => {
      const battlefield = createEmptyBattlefield();
      for (let row = 0; row < 11; row += 1) {
        battlefield.hexes[5][row].isObstacle = true;
      }
      expect(findPath({ col: 0, row: 5 }, { col: 10, row: 5 }, battlefield)).toBeNull();
    });

    it('handlesEdgeOfGrid', () => {
      const battlefield = createEmptyBattlefield();
      const path = findPath({ col: 0, row: 0 }, { col: 0, row: 10 }, battlefield);
      expect(path).not.toBeNull();
      expect(path![0]).toEqual({ col: 0, row: 0 });
      expect(path![path!.length - 1]).toEqual({ col: 0, row: 10 });
    });
  });

  describe('reachable hexes', () => {
    it('calculatesReachableHexes', () => {
      const battlefield = createEmptyBattlefield();
      const stack = createStack(UNIT_PIKEMAN, PLAYER_1, 5, { col: 7, row: 5 });
      battlefield.hexes[7][5].occupant = stack;
      const reachable = getReachableHexes(stack, battlefield);
      expect(Object.keys(reachable).length).toBeGreaterThan(0);
      Object.values(reachable).forEach((distance) => expect(distance).toBeLessThanOrEqual(4));
    });

    it('excludesOccupiedHexes', () => {
      const battlefield = createEmptyBattlefield();
      const stack = createStack(UNIT_PIKEMAN, PLAYER_1, 5, { col: 7, row: 5 });
      const blocker = createStack(UNIT_PIKEMAN, PLAYER_2, 5, { col: 8, row: 5 });
      battlefield.hexes[7][5].occupant = stack;
      battlefield.hexes[8][5].occupant = blocker;
      const reachable = getReachableHexes(stack, battlefield);
      expect(reachable['8,5']).toBeUndefined();
    });

    it('respectsSpeedLimit', () => {
      const battlefield = createEmptyBattlefield();
      const stack = createStack(UNIT_PIKEMAN, PLAYER_1, 5, { col: 7, row: 5 });
      battlefield.hexes[7][5].occupant = stack;
      const reachable = getReachableHexes(stack, battlefield);
      Object.keys(reachable).forEach((key) => {
        const [col, row] = key.split(',').map(Number);
        expect(hexDistance(stack.position, { col, row })).toBeLessThanOrEqual(stack.unitType.speed);
      });
    });

    it('noMoveIfFullySurrounded', () => {
      const { battlefield, stack } = SCENARIO_SURROUNDED();
      expect(Object.keys(getReachableHexes(stack, battlefield))).toHaveLength(0);
    });
  });
});
