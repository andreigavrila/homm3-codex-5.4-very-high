import { describe, expect, it } from 'vitest';
import { clampCreatureCount, getDefaultArmy, validateArmy } from '../../src/lib/engine/armySetup';
import { UNIT_PIKEMAN } from '../fixtures';

describe('armySetup', () => {
  it('requires exactly 3 stacks', () => {
    expect(
      validateArmy({
        slots: [
          { unitType: UNIT_PIKEMAN, creatureCount: 10 },
          { unitType: UNIT_PIKEMAN, creatureCount: 10 },
          { unitType: null, creatureCount: 10 },
        ],
        isReady: false,
      }),
    ).toBe(false);
  });

  it('requires positive creature counts', () => {
    expect(
      validateArmy({
        slots: [
          { unitType: UNIT_PIKEMAN, creatureCount: 10 },
          { unitType: UNIT_PIKEMAN, creatureCount: 0 },
          { unitType: UNIT_PIKEMAN, creatureCount: 10 },
        ],
        isReady: false,
      }),
    ).toBe(false);
  });

  it('caps count at 99', () => {
    expect(clampCreatureCount(150)).toBe(99);
  });

  it('clamps negative values to 1', () => {
    expect(clampCreatureCount(-5)).toBe(1);
  });

  it('allows duplicate unit types', () => {
    expect(
      validateArmy({
        slots: [
          { unitType: UNIT_PIKEMAN, creatureCount: 10 },
          { unitType: UNIT_PIKEMAN, creatureCount: 10 },
          { unitType: UNIT_PIKEMAN, creatureCount: 10 },
        ],
        isReady: true,
      }),
    ).toBe(true);
  });

  it('returns a valid default army', () => {
    expect(validateArmy(getDefaultArmy())).toBe(true);
  });
});
