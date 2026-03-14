import { UNIT_ROSTER } from '../data/units';
import { PlayerSide, type ArmySelection, type Player, type Stack } from '../types';

export const clampCreatureCount = (count: number): number => Math.max(1, Math.min(99, count));

export const validateArmy = (selection: ArmySelection): boolean =>
  selection.slots.length === 3 &&
  selection.slots.every((slot) => slot.unitType && slot.creatureCount >= 1 && slot.creatureCount <= 99);

export const createStackFromSelection = (
  selection: ArmySelection['slots'][number],
  owner: Player,
  slotIndex: number,
): Stack => ({
  id: `${selection.unitType!.id}_${owner.id}_${slotIndex}`,
  unitType: selection.unitType!,
  owner,
  creatureCount: clampCreatureCount(selection.creatureCount),
  currentHp: selection.unitType!.hp,
  position: { col: owner.side === PlayerSide.LEFT ? 0 : 14, row: [1, 5, 9][slotIndex] },
  hasRetaliated: false,
  hasActed: false,
  isWaiting: false,
  isDefending: false,
  remainingShots: selection.unitType!.isRanged ? selection.unitType!.shots : null,
});

export const getDefaultArmy = (): ArmySelection => ({
  slots: [
    { unitType: UNIT_ROSTER[0], creatureCount: 20 },
    { unitType: UNIT_ROSTER[1], creatureCount: 12 },
    { unitType: UNIT_ROSTER[2], creatureCount: 8 },
  ],
  isReady: true,
});
