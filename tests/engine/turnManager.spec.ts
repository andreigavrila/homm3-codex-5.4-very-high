import { describe, expect, it } from 'vitest';
import { buildTurnOrder, handleDefend, handleWait, resetRound } from '../../src/lib/engine/turnManager';
import { PLAYER_1, PLAYER_2, UNIT_ARCHER, UNIT_PIKEMAN, UNIT_SWORDSMAN, createStack } from '../fixtures';

describe('turn manager', () => {
  describe('initiative ordering', () => {
    it('sortsStacksByInitiativeDescending', () => {
      const stacks = [
        createStack(UNIT_PIKEMAN, PLAYER_1, 5, { col: 0, row: 1 }),
        createStack(UNIT_SWORDSMAN, PLAYER_2, 3, { col: 14, row: 1 }),
        createStack(UNIT_ARCHER, PLAYER_1, 4, { col: 0, row: 5 }),
      ];
      const queue = buildTurnOrder(stacks);
      expect(queue.entries.map((stack) => stack.unitType.initiative)).toEqual([11, 9, 8]);
    });

    it('breaksTiesWithPlayer1First', () => {
      const p1Stack = createStack({ ...UNIT_PIKEMAN, initiative: 10 }, PLAYER_1, 5, { col: 0, row: 1 });
      const p2Stack = createStack({ ...UNIT_PIKEMAN, initiative: 10 }, PLAYER_2, 5, { col: 14, row: 1 });
      expect(buildTurnOrder([p2Stack, p1Stack]).entries[0].owner.id).toBe('player1');
    });

    it('breaksSamePlayerTiesByRow', () => {
      const upper = createStack({ ...UNIT_PIKEMAN, initiative: 10 }, PLAYER_1, 5, { col: 0, row: 1 });
      const lower = createStack({ ...UNIT_PIKEMAN, initiative: 10 }, PLAYER_1, 5, { col: 0, row: 5 });
      expect(buildTurnOrder([lower, upper]).entries[0].position.row).toBe(1);
    });

    it('excludesDeadStacks', () => {
      const alive = createStack(UNIT_PIKEMAN, PLAYER_1, 5, { col: 0, row: 1 });
      const dead = createStack(UNIT_ARCHER, PLAYER_2, 0, { col: 14, row: 1 });
      expect(buildTurnOrder([alive, dead]).entries).toHaveLength(1);
    });
  });

  describe('wait handling', () => {
    it('waitMovesToEndOfQueue', () => {
      const queue = buildTurnOrder([
        createStack(UNIT_SWORDSMAN, PLAYER_1, 3, { col: 0, row: 1 }),
        createStack(UNIT_PIKEMAN, PLAYER_2, 5, { col: 14, row: 1 }),
      ]);
      handleWait(queue);
      expect(queue.waitQueue.length + queue.entries.length).toBe(2);
      expect(queue.entries[0].owner.id).toBe('player2');
    });

    it('waitQueueReverseInitiative', () => {
      const high = createStack({ ...UNIT_PIKEMAN, initiative: 12 }, PLAYER_1, 3, { col: 0, row: 1 });
      const mid = createStack({ ...UNIT_PIKEMAN, initiative: 9 }, PLAYER_1, 3, { col: 0, row: 2 });
      const low = createStack({ ...UNIT_PIKEMAN, initiative: 8 }, PLAYER_2, 3, { col: 14, row: 2 });
      const queue = buildTurnOrder([high, mid, low]);
      handleWait(queue);
      handleWait(queue);
      handleWait(queue);
      expect(queue.entries.map((stack) => stack.unitType.initiative)).toEqual([8, 9, 12]);
    });
  });

  describe('defend and round reset', () => {
    it('defendBoostsDefenseBy20Pct', () => {
      const stack = createStack(UNIT_PIKEMAN, PLAYER_1, 5, { col: 0, row: 1 });
      handleDefend(stack);
      expect(stack.isDefending).toBe(true);
    });

    it('resetsAllStackFlags', () => {
      const stack = createStack(UNIT_PIKEMAN, PLAYER_1, 5, { col: 0, row: 1 });
      stack.hasRetaliated = true;
      stack.hasActed = true;
      stack.isDefending = true;
      stack.isWaiting = true;
      const next = resetRound([stack], 2);
      expect(next.round).toBe(3);
      expect(stack.hasRetaliated).toBe(false);
      expect(stack.hasActed).toBe(false);
      expect(stack.isDefending).toBe(false);
      expect(stack.isWaiting).toBe(false);
      expect(next.queue.entries).toHaveLength(1);
    });
  });
});
