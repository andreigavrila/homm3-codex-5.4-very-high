import { describe, expect, it } from 'vitest';
import { buildBattleSummary, checkVictory } from '../../src/lib/engine/victoryCheck';
import { PLAYER_1, PLAYER_2, UNIT_PIKEMAN, createStack } from '../fixtures';

describe('victory check', () => {
  it('player2WinsWhenP1AllDead', () => {
    const p1Stacks = [
      createStack(UNIT_PIKEMAN, PLAYER_1, 0, { col: 0, row: 1 }),
      createStack(UNIT_PIKEMAN, PLAYER_1, 0, { col: 0, row: 5 }),
      createStack(UNIT_PIKEMAN, PLAYER_1, 0, { col: 0, row: 9 }),
    ];
    const p2Stacks = [createStack(UNIT_PIKEMAN, PLAYER_2, 3, { col: 14, row: 5 })];
    expect(checkVictory(p1Stacks, p2Stacks)).toBe('player2');
  });

  it('player1WinsWhenP2AllDead', () => {
    const p1Stacks = [createStack(UNIT_PIKEMAN, PLAYER_1, 5, { col: 0, row: 1 })];
    const p2Stacks = [createStack(UNIT_PIKEMAN, PLAYER_2, 0, { col: 14, row: 1 })];
    expect(checkVictory(p1Stacks, p2Stacks)).toBe('player1');
  });

  it('noVictoryWhileBothAlive', () => {
    const p1Stacks = [createStack(UNIT_PIKEMAN, PLAYER_1, 5, { col: 0, row: 1 })];
    const p2Stacks = [createStack(UNIT_PIKEMAN, PLAYER_2, 3, { col: 14, row: 1 })];
    expect(checkVictory(p1Stacks, p2Stacks)).toBeNull();
  });

  it('buildsBattleSummary', () => {
    PLAYER_1.stacks = [createStack(UNIT_PIKEMAN, PLAYER_1, 4, { col: 0, row: 1 })];
    PLAYER_2.stacks = [createStack(UNIT_PIKEMAN, PLAYER_2, 0, { col: 14, row: 1 })];
    const summary = buildBattleSummary(PLAYER_1, PLAYER_2, 3, [
      {
        round: 1,
        actorStackId: 'pikeman_player1_0_1',
        actionType: 'melee_attack' as never,
        targetStackId: 'pikeman_player2_14_1',
        damageDealt: 10,
        creaturesKilled: 1,
        fromHex: null,
        toHex: null,
        message: 'attack',
      },
    ]);
    expect(summary.totalRounds).toBe(3);
    expect(summary.totalDamageDealt.player1).toBe(10);
    expect(summary.survivingStacks[0].remainingCreatures).toBe(4);
  });
});
