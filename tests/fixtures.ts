import { PlayerSide, type Battlefield, type HexCoord, type Player, type Stack, type UnitType } from '../src/lib/types';

export const UNIT_PIKEMAN: UnitType = {
  id: 'pikeman',
  name: 'Pikeman',
  attack: 4,
  defense: 5,
  minDamage: 1,
  maxDamage: 3,
  hp: 10,
  speed: 4,
  initiative: 8,
  isRanged: false,
  shots: null,
  icon: 'P',
};

export const UNIT_ARCHER: UnitType = {
  id: 'archer',
  name: 'Archer',
  attack: 6,
  defense: 3,
  minDamage: 2,
  maxDamage: 3,
  hp: 10,
  speed: 4,
  initiative: 9,
  isRanged: true,
  shots: 12,
  icon: 'A',
};

export const UNIT_GRIFFIN: UnitType = {
  id: 'griffin',
  name: 'Griffin',
  attack: 8,
  defense: 8,
  minDamage: 3,
  maxDamage: 6,
  hp: 25,
  speed: 6,
  initiative: 12,
  isRanged: false,
  shots: null,
  icon: 'G',
};

export const UNIT_SWORDSMAN: UnitType = {
  id: 'swordsman',
  name: 'Swordsman',
  attack: 10,
  defense: 12,
  minDamage: 6,
  maxDamage: 9,
  hp: 35,
  speed: 5,
  initiative: 11,
  isRanged: false,
  shots: null,
  icon: 'S',
};

export const UNIT_CAVALIER: UnitType = {
  id: 'cavalier',
  name: 'Cavalier',
  attack: 15,
  defense: 15,
  minDamage: 15,
  maxDamage: 25,
  hp: 100,
  speed: 7,
  initiative: 13,
  isRanged: false,
  shots: null,
  icon: 'C',
};

export const PLAYER_1: Player = {
  id: 'player1',
  name: 'Player 1',
  color: '#3B82F6',
  stacks: [],
  side: PlayerSide.LEFT,
};

export const PLAYER_2: Player = {
  id: 'player2',
  name: 'Player 2',
  color: '#EF4444',
  stacks: [],
  side: PlayerSide.RIGHT,
};

export function createStack(unitType: UnitType, owner: Player, count: number, position: HexCoord): Stack {
  return {
    id: `${unitType.id}_${owner.id}_${position.col}_${position.row}`,
    unitType,
    owner,
    creatureCount: count,
    currentHp: count > 0 ? unitType.hp : 0,
    position,
    hasRetaliated: false,
    hasActed: false,
    isWaiting: false,
    isDefending: false,
    remainingShots: unitType.isRanged ? unitType.shots : null,
  };
}

export function createEmptyBattlefield(): Battlefield {
  const hexes: Battlefield['hexes'] = [];
  for (let col = 0; col < 15; col += 1) {
    hexes[col] = [];
    for (let row = 0; row < 11; row += 1) {
      hexes[col][row] = { col, row, isObstacle: false, occupant: null };
    }
  }

  return { width: 15, height: 11, hexes, obstacles: [] };
}

export const SCENARIO_BASIC_MELEE = () => {
  const battlefield = createEmptyBattlefield();
  const attacker = createStack(UNIT_PIKEMAN, PLAYER_1, 10, { col: 5, row: 5 });
  const defender = createStack(UNIT_SWORDSMAN, PLAYER_2, 3, { col: 6, row: 5 });
  battlefield.hexes[5][5].occupant = attacker;
  battlefield.hexes[6][5].occupant = defender;
  return { battlefield, attacker, defender };
};

export const SCENARIO_RANGED_ATTACK = () => {
  const battlefield = createEmptyBattlefield();
  const attacker = createStack(UNIT_ARCHER, PLAYER_1, 8, { col: 1, row: 5 });
  const defender = createStack(UNIT_SWORDSMAN, PLAYER_2, 3, { col: 10, row: 5 });
  battlefield.hexes[1][5].occupant = attacker;
  battlefield.hexes[10][5].occupant = defender;
  return { battlefield, attacker, defender };
};

export const SCENARIO_SURROUNDED = () => {
  const battlefield = createEmptyBattlefield();
  const stack = createStack(UNIT_PIKEMAN, PLAYER_1, 5, { col: 7, row: 5 });
  battlefield.hexes[7][5].occupant = stack;
  const neighbors = [
    { col: 8, row: 5 },
    { col: 8, row: 4 },
    { col: 7, row: 4 },
    { col: 6, row: 5 },
    { col: 7, row: 6 },
    { col: 8, row: 6 },
  ];

  for (const neighbor of neighbors) {
    battlefield.hexes[neighbor.col][neighbor.row].isObstacle = true;
  }

  return { battlefield, stack };
};
