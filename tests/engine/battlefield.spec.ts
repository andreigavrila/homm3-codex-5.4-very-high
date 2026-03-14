import { describe, expect, it } from 'vitest';
import { createBattlefield, deployStacks, generateObstacles } from '../../src/lib/engine/battlefieldGenerator';
import { findPath } from '../../src/lib/engine/pathfinding';
import { PLAYER_1, PLAYER_2, UNIT_ARCHER, UNIT_GRIFFIN, UNIT_PIKEMAN, createStack } from '../fixtures';

describe('battlefield generator', () => {
  it('generatesCorrectObstacleCount', () => {
    const battlefield = createBattlefield();
    const obstacles = generateObstacles(battlefield, () => 0.5);
    expect(obstacles.length).toBeGreaterThanOrEqual(6);
    expect(obstacles.length).toBeLessThanOrEqual(12);
  });

  it('noObstaclesInDeployZones', () => {
    const battlefield = createBattlefield();
    const obstacles = generateObstacles(battlefield);
    expect(obstacles.every((coord) => coord.col >= 2 && coord.col <= 12)).toBe(true);
  });

  it('ensuresPathConnectivity', () => {
    for (let index = 0; index < 100; index += 1) {
      const battlefield = createBattlefield();
      generateObstacles(battlefield);
      expect(findPath({ col: 0, row: 5 }, { col: 14, row: 5 }, battlefield)).not.toBeNull();
    }
  });

  it('deploysP1OnLeftColumn', () => {
    PLAYER_1.stacks = [
      createStack(UNIT_PIKEMAN, PLAYER_1, 5, { col: 0, row: 0 }),
      createStack(UNIT_ARCHER, PLAYER_1, 5, { col: 0, row: 0 }),
      createStack(UNIT_GRIFFIN, PLAYER_1, 5, { col: 0, row: 0 }),
    ];
    PLAYER_2.stacks = [];
    const battlefield = deployStacks(PLAYER_1, PLAYER_2, createBattlefield());
    expect(PLAYER_1.stacks.map((stack) => stack.position)).toEqual([
      { col: 0, row: 1 },
      { col: 0, row: 5 },
      { col: 0, row: 9 },
    ]);
    expect(battlefield.hexes[0][1].occupant?.id).toBe(PLAYER_1.stacks[0].id);
  });

  it('deploysP2OnRightColumn', () => {
    PLAYER_1.stacks = [];
    PLAYER_2.stacks = [
      createStack(UNIT_PIKEMAN, PLAYER_2, 5, { col: 0, row: 0 }),
      createStack(UNIT_ARCHER, PLAYER_2, 5, { col: 0, row: 0 }),
      createStack(UNIT_GRIFFIN, PLAYER_2, 5, { col: 0, row: 0 }),
    ];
    const battlefield = deployStacks(PLAYER_1, PLAYER_2, createBattlefield());
    expect(PLAYER_2.stacks.map((stack) => stack.position)).toEqual([
      { col: 14, row: 1 },
      { col: 14, row: 5 },
      { col: 14, row: 9 },
    ]);
    expect(battlefield.hexes[14][5].occupant?.id).toBe(PLAYER_2.stacks[1].id);
  });
});
