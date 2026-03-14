export enum GameState {
  SETUP = 'SETUP',
  PLAYER1_PICKING = 'PLAYER1_PICKING',
  PLAYER2_PICKING = 'PLAYER2_PICKING',
  BATTLE = 'BATTLE',
  FINISHED = 'FINISHED',
}

export enum ActionType {
  MOVE = 'move',
  MELEE_ATTACK = 'melee_attack',
  RANGED_ATTACK = 'ranged_attack',
  RETALIATION = 'retaliation',
  WAIT = 'wait',
  DEFEND = 'defend',
  DEATH = 'death',
}

export enum PlayerSide {
  LEFT = 'left',
  RIGHT = 'right',
}

export interface HexCoord {
  col: number;
  row: number;
}

export interface UnitType {
  id: string;
  name: string;
  attack: number;
  defense: number;
  minDamage: number;
  maxDamage: number;
  hp: number;
  speed: number;
  initiative: number;
  isRanged: boolean;
  shots: number | null;
  icon: string;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  stacks: Stack[];
  side: PlayerSide;
}

export interface Stack {
  id: string;
  unitType: UnitType;
  owner: Player;
  creatureCount: number;
  currentHp: number;
  position: HexCoord;
  hasRetaliated: boolean;
  hasActed: boolean;
  isWaiting: boolean;
  isDefending: boolean;
  remainingShots: number | null;
}

export interface Hex {
  col: number;
  row: number;
  isObstacle: boolean;
  occupant: Stack | null;
}

export interface Battlefield {
  width: 15;
  height: 11;
  hexes: Hex[][];
  obstacles: HexCoord[];
}

export interface TurnOrderQueue {
  entries: Stack[];
  activeIndex: number;
  waitQueue: Stack[];
}

export interface CombatLogEntry {
  round: number;
  actorStackId: string;
  actionType: ActionType;
  targetStackId: string | null;
  damageDealt: number | null;
  creaturesKilled: number | null;
  fromHex: HexCoord | null;
  toHex: HexCoord | null;
  message: string;
}

export interface DamageResult {
  damage: number;
  creaturesKilled: number;
}

export interface PathResult {
  path: HexCoord[];
  length: number;
}

export interface ArmySlot {
  unitType: UnitType | null;
  creatureCount: number;
}

export interface ArmySelection {
  slots: [ArmySlot, ArmySlot, ArmySlot];
  isReady: boolean;
}

export interface BattleSummary {
  winner: Player;
  loser: Player;
  totalRounds: number;
  survivingStacks: Array<{
    unitType: UnitType;
    remainingCreatures: number;
    remainingHp: number;
  }>;
  totalDamageDealt: { player1: number; player2: number };
  totalCreaturesKilled: { player1: number; player2: number };
}

export type GameAction =
  | { type: 'SELECT_UNIT'; payload: { playerNumber: 1 | 2; slotIndex: 0 | 1 | 2; unitType: UnitType } }
  | { type: 'SET_CREATURE_COUNT'; payload: { playerNumber: 1 | 2; slotIndex: 0 | 1 | 2; count: number } }
  | { type: 'DESELECT_UNIT'; payload: { playerNumber: 1 | 2; slotIndex: 0 | 1 | 2 } }
  | { type: 'CONFIRM_ARMY'; payload: { playerNumber: 1 | 2 } }
  | { type: 'LOAD_DEFAULT_ARMY'; payload: { playerNumber: 1 | 2 } }
  | { type: 'MOVE_STACK'; payload: { stackId: string; targetHex: HexCoord } }
  | { type: 'MELEE_ATTACK'; payload: { attackerStackId: string; defenderStackId: string } }
  | { type: 'RANGED_ATTACK'; payload: { attackerStackId: string; defenderStackId: string } }
  | { type: 'WAIT' }
  | { type: 'DEFEND' }
  | { type: 'START_GAME' }
  | { type: 'NEW_GAME' }
  | { type: 'HOVER_HEX'; payload: { hex: HexCoord | null } }
  | { type: 'CLICK_HEX'; payload: { hex: HexCoord } };

export const BATTLEFIELD_WIDTH = 15;
export const BATTLEFIELD_HEIGHT = 11;

export const createEmptyArmySelection = (): ArmySelection => ({
  slots: [
    { unitType: null, creatureCount: 1 },
    { unitType: null, creatureCount: 1 },
    { unitType: null, creatureCount: 1 },
  ],
  isReady: false,
});

export const isAlive = (stack: Stack): boolean => stack.creatureCount > 0;

export const totalHp = (stack: Stack): number =>
  stack.creatureCount <= 0 ? 0 : (stack.creatureCount - 1) * stack.unitType.hp + stack.currentHp;

export const effectiveDefense = (stack: Stack): number =>
  stack.isDefending ? Math.floor(stack.unitType.defense * 1.2) : stack.unitType.defense;
