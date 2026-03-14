import { describe, expect, it, vi } from 'vitest';
import { applyDamage, calculateDamage, meleeAttack, rangedAttack } from '../../src/lib/engine/combat';
import {
  PLAYER_1,
  PLAYER_2,
  SCENARIO_BASIC_MELEE,
  SCENARIO_RANGED_ATTACK,
  UNIT_ARCHER,
  UNIT_CAVALIER,
  UNIT_PIKEMAN,
  UNIT_SWORDSMAN,
  createStack,
} from '../fixtures';

describe('combat engine', () => {
  describe('damage formula', () => {
    it('damageFormulaBasic', () => {
      const attacker = createStack(UNIT_PIKEMAN, PLAYER_1, 10, { col: 0, row: 0 });
      const defender = createStack({ ...UNIT_PIKEMAN, defense: 4 }, PLAYER_2, 5, { col: 1, row: 0 });
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(calculateDamage(attacker, defender).damage).toBe(10);
      vi.restoreAllMocks();
    });

    it('increases damage by 5 pct per attack advantage point', () => {
      const attacker = createStack(UNIT_SWORDSMAN, PLAYER_1, 1, { col: 0, row: 0 });
      const defender = createStack(UNIT_PIKEMAN, PLAYER_2, 1, { col: 1, row: 0 });
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(calculateDamage(attacker, defender).damage).toBe(7);
      vi.restoreAllMocks();
    });

    it('caps positive modifier at 4x', () => {
      const attacker = createStack({ ...UNIT_CAVALIER, attack: 80 }, PLAYER_1, 1, { col: 0, row: 0 });
      const defender = createStack({ ...UNIT_PIKEMAN, defense: 1 }, PLAYER_2, 1, { col: 1, row: 0 });
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(calculateDamage(attacker, defender).damage).toBe(60);
      vi.restoreAllMocks();
    });

    it('minimumDamageIs1', () => {
      const attacker = createStack({ ...UNIT_PIKEMAN, attack: 1, minDamage: 1, maxDamage: 1 }, PLAYER_1, 1, { col: 0, row: 0 });
      const defender = createStack({ ...UNIT_CAVALIER, defense: 50 }, PLAYER_2, 1, { col: 1, row: 0 });
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(calculateDamage(attacker, defender).damage).toBe(1);
      vi.restoreAllMocks();
    });

    it('damageScalesWithCreatureCount', () => {
      const attacker = createStack(UNIT_PIKEMAN, PLAYER_1, 10, { col: 0, row: 0 });
      const defender = createStack({ ...UNIT_PIKEMAN, defense: 4 }, PLAYER_2, 5, { col: 1, row: 0 });
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(calculateDamage(attacker, defender).damage).toBeGreaterThan(
        calculateDamage({ ...attacker, creatureCount: 2 }, defender).damage,
      );
      vi.restoreAllMocks();
    });
  });

  describe('damage application', () => {
    it('partialDamageToTopCreature', () => {
      const stack = createStack(UNIT_PIKEMAN, PLAYER_1, 5, { col: 0, row: 0 });
      applyDamage(stack, 3);
      expect(stack.currentHp).toBe(7);
      expect(stack.creatureCount).toBe(5);
    });

    it('killsCreaturesOneByOne', () => {
      const stack = createStack(UNIT_PIKEMAN, PLAYER_1, 3, { col: 0, row: 0 });
      stack.currentHp = 4;
      applyDamage(stack, 22);
      expect(stack.creatureCount).toBe(1);
      expect(stack.currentHp).toBe(2);
    });

    it('eliminatesStackWhenAllDead', () => {
      const stack = createStack(UNIT_PIKEMAN, PLAYER_1, 2, { col: 0, row: 0 });
      applyDamage(stack, 999);
      expect(stack.creatureCount).toBe(0);
      expect(stack.currentHp).toBe(0);
    });
  });

  describe('melee', () => {
    it('dealsDamageToDefender', () => {
      const { attacker, defender } = SCENARIO_BASIC_MELEE();
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = meleeAttack(attacker, defender);
      expect(result.attackDamage).toBeGreaterThan(0);
      expect(defender.currentHp).toBeLessThan(35);
      vi.restoreAllMocks();
    });

    it('triggersRetaliationIfDefenderAlive', () => {
      const { attacker, defender } = SCENARIO_BASIC_MELEE();
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = meleeAttack(attacker, defender);
      expect(result.retaliationDamage).toBeGreaterThan(0);
      expect(defender.hasRetaliated).toBe(true);
      vi.restoreAllMocks();
    });

    it('noRetaliationIfDefenderDies', () => {
      const attacker = createStack(UNIT_CAVALIER, PLAYER_1, 10, { col: 5, row: 5 });
      const defender = createStack(UNIT_PIKEMAN, PLAYER_2, 1, { col: 6, row: 5 });
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      const result = meleeAttack(attacker, defender);
      expect(defender.creatureCount).toBe(0);
      expect(result.retaliationDamage).toBe(0);
      vi.restoreAllMocks();
    });

    it('retaliatesOncePerRound', () => {
      const defender = createStack(UNIT_SWORDSMAN, PLAYER_2, 5, { col: 6, row: 5 });
      const attacker1 = createStack(UNIT_PIKEMAN, PLAYER_1, 5, { col: 5, row: 5 });
      const attacker2 = createStack(UNIT_PIKEMAN, PLAYER_1, 5, { col: 7, row: 5 });
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      expect(meleeAttack(attacker1, defender).retaliationDamage).toBeGreaterThan(0);
      expect(meleeAttack(attacker2, defender).retaliationDamage).toBe(0);
      vi.restoreAllMocks();
    });
  });

  describe('ranged', () => {
    it('rangedAttackNoRetaliation', () => {
      const { attacker, defender } = SCENARIO_RANGED_ATTACK();
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = rangedAttack(attacker, defender);
      expect(result.damage).toBeGreaterThan(0);
      expect(result.retaliationDamage).toBe(0);
      vi.restoreAllMocks();
    });

    it('decrementsShots', () => {
      const attacker = createStack(UNIT_ARCHER, PLAYER_1, 5, { col: 0, row: 0 });
      const defender = createStack(UNIT_SWORDSMAN, PLAYER_2, 3, { col: 10, row: 5 });
      expect(attacker.remainingShots).toBe(12);
      rangedAttack(attacker, defender);
      expect(attacker.remainingShots).toBe(11);
    });

    it('adjacentRangedIsMelee', () => {
      const attacker = createStack(UNIT_ARCHER, PLAYER_1, 5, { col: 0, row: 0 });
      const defender = createStack(UNIT_PIKEMAN, PLAYER_2, 4, { col: 1, row: 0 });
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const result = rangedAttack(attacker, defender);
      expect(result.usedMelee).toBe(true);
      expect(result.retaliationDamage).toBeGreaterThanOrEqual(0);
      vi.restoreAllMocks();
    });

    it('noRangedWithZeroShots', () => {
      const attacker = createStack(UNIT_ARCHER, PLAYER_1, 5, { col: 0, row: 0 });
      attacker.remainingShots = 0;
      const defender = createStack(UNIT_SWORDSMAN, PLAYER_2, 3, { col: 10, row: 5 });
      expect(rangedAttack(attacker, defender).damage).toBe(0);
    });
  });
});

