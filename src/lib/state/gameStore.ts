import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { UNIT_ROSTER } from '../data/units';
import { createStackFromSelection, getDefaultArmy, validateArmy } from '../engine/armySetup';
import { createBattlefield, deployStacks, generateObstacles } from '../engine/battlefieldGenerator';
import { meleeAttack, rangedAttack } from '../engine/combat';
import { createEmptyBattlefield, findPath, getReachableHexes } from '../engine/pathfinding';
import { advanceTurn, buildTurnOrder, handleDefend, handleWait, resetRound } from '../engine/turnManager';
import { buildBattleSummary, checkVictory } from '../engine/victoryCheck';
import {
  ActionType,
  GameState,
  PlayerSide,
  createEmptyArmySelection,
  isAlive,
  type ArmySelection,
  type Battlefield,
  type BattleSummary,
  type CombatLogEntry,
  type GameAction,
  type HexCoord,
  type Player,
  type Stack,
  type TurnOrderQueue,
  type UnitType,
} from '../types';
import { coordToKey, getHexNeighbors, hexDistance } from '../utils/hexUtils';

export type HighlightKind = 'reachable' | 'attack' | 'path';

export interface AppState {
  gameState: GameState;
  player1: Player;
  player2: Player;
  player1Selection: ArmySelection;
  player2Selection: ArmySelection;
  battlefield: Battlefield;
  turnOrder: TurnOrderQueue;
  currentRound: number;
  combatLog: CombatLogEntry[];
  winner: Player | null;
  battleSummary: BattleSummary | null;
  highlightedHexes: Map<string, HighlightKind>;
  hoveredHex: HexCoord | null;
  selectedStack: Stack | null;
  activeStack: Stack | null;
  dispatch: (action: GameAction) => void;
}

const createBasePlayer = (playerNumber: 1 | 2): Player => ({
  id: playerNumber === 1 ? 'player1' : 'player2',
  name: playerNumber === 1 ? 'Player 1' : 'Player 2',
  color: playerNumber === 1 ? '#3B82F6' : '#EF4444',
  stacks: [],
  side: playerNumber === 1 ? PlayerSide.LEFT : PlayerSide.RIGHT,
});

const createInitialCoreState = (): Omit<AppState, 'dispatch'> => ({
  gameState: GameState.SETUP,
  player1: createBasePlayer(1),
  player2: createBasePlayer(2),
  player1Selection: createEmptyArmySelection(),
  player2Selection: createEmptyArmySelection(),
  battlefield: createEmptyBattlefield(),
  turnOrder: { entries: [], activeIndex: 0, waitQueue: [] },
  currentRound: 1,
  combatLog: [],
  winner: null,
  battleSummary: null,
  highlightedHexes: new Map(),
  hoveredHex: null,
  selectedStack: null,
  activeStack: null,
});

const getSelectionKey = (playerNumber: 1 | 2): 'player1Selection' | 'player2Selection' =>
  playerNumber === 1 ? 'player1Selection' : 'player2Selection';

const getAllStacks = (player1: Player, player2: Player): Stack[] => [...player1.stacks, ...player2.stacks];

const clonePlayers = (
  player1: Player,
  player2: Player,
): { player1: Player; player2: Player; stackMap: Map<string, Stack> } => {
  const nextPlayer1: Player = { ...player1, stacks: [] };
  const nextPlayer2: Player = { ...player2, stacks: [] };
  const stackMap = new Map<string, Stack>();

  for (const stack of player1.stacks) {
    const clone: Stack = {
      ...stack,
      position: { ...stack.position },
      owner: nextPlayer1,
    };
    nextPlayer1.stacks.push(clone);
    stackMap.set(clone.id, clone);
  }

  for (const stack of player2.stacks) {
    const clone: Stack = {
      ...stack,
      position: { ...stack.position },
      owner: nextPlayer2,
    };
    nextPlayer2.stacks.push(clone);
    stackMap.set(clone.id, clone);
  }

  return { player1: nextPlayer1, player2: nextPlayer2, stackMap };
};

const mapQueueToClones = (queue: TurnOrderQueue, stackMap: Map<string, Stack>): TurnOrderQueue => ({
  entries: queue.entries.map((stack) => stackMap.get(stack.id)).filter(Boolean) as Stack[],
  activeIndex: Math.max(0, Math.min(queue.activeIndex, Math.max(queue.entries.length - 1, 0))),
  waitQueue: queue.waitQueue.map((stack) => stackMap.get(stack.id)).filter(Boolean) as Stack[],
});

const rebuildBattlefield = (obstacles: HexCoord[], player1: Player, player2: Player): Battlefield => {
  const battlefield = createBattlefield();
  battlefield.obstacles = obstacles.map((coord) => ({ ...coord }));

  for (const obstacle of battlefield.obstacles) {
    battlefield.hexes[obstacle.col][obstacle.row].isObstacle = true;
  }

  for (const stack of getAllStacks(player1, player2)) {
    if (!isAlive(stack)) {
      continue;
    }
    battlefield.hexes[stack.position.col][stack.position.row].occupant = stack;
  }

  return battlefield;
};

const findStackById = (player1: Player, player2: Player, stackId: string): Stack | null =>
  getAllStacks(player1, player2).find((stack) => stack.id === stackId) ?? null;

const isMovementLocked = (activeStack: Stack | null, selectedStack: Stack | null): boolean =>
  Boolean(activeStack && selectedStack && activeStack.id === selectedStack.id);

const findMoveThenAttackPath = (
  attacker: Stack,
  defender: Stack,
  battlefield: Battlefield,
): HexCoord[] | null => {
  const candidates = getHexNeighbors(defender.position)
    .filter((coord) => {
      const hex = battlefield.hexes[coord.col]?.[coord.row];
      return hex && !hex.isObstacle && !hex.occupant;
    })
    .map((coord) => findPath(attacker.position, coord, battlefield))
    .filter((path): path is HexCoord[] => Boolean(path))
    .filter((path) => path.length - 1 <= attacker.unitType.speed)
    .sort((left, right) => left.length - right.length);

  return candidates[0] ?? null;
};

export const getAttackableTargetsForState = (
  activeStack: Stack | null,
  battlefield: Battlefield,
  movementLocked = false,
): Stack[] => {
  if (!activeStack || !isAlive(activeStack)) {
    return [];
  }

  const enemyStacks = battlefield.hexes
    .flat()
    .map((hex) => hex.occupant)
    .filter((stack): stack is Stack => stack !== null && isAlive(stack) && stack.owner.id !== activeStack.owner.id);

  if (activeStack.unitType.isRanged && (activeStack.remainingShots ?? 0) > 0 && !movementLocked) {
    return enemyStacks;
  }

  return enemyStacks.filter((stack) => {
    if (hexDistance(activeStack.position, stack.position) === 1) {
      return true;
    }

    if (movementLocked) {
      return false;
    }

    return Boolean(findMoveThenAttackPath(activeStack, stack, battlefield));
  });
};

const computeHighlights = (
  battlefield: Battlefield,
  activeStack: Stack | null,
  hoveredHex: HexCoord | null,
  selectedStack: Stack | null,
): Map<string, HighlightKind> => {
  const highlights = new Map<string, HighlightKind>();
  if (!activeStack) {
    return highlights;
  }

  const movementLocked = isMovementLocked(activeStack, selectedStack);

  if (!movementLocked) {
    const reachable = getReachableHexes(activeStack, battlefield);
    for (const key of Object.keys(reachable)) {
      highlights.set(key, 'reachable');
    }

    if (hoveredHex) {
      const hoverKey = coordToKey(hoveredHex);
      if (reachable[hoverKey]) {
        const path = findPath(activeStack.position, hoveredHex, battlefield);
        path?.slice(1).forEach((coord) => {
          if (coordToKey(coord) !== hoverKey) {
            highlights.set(coordToKey(coord), 'path');
          }
        });
      }
    }
  }

  for (const target of getAttackableTargetsForState(activeStack, battlefield, movementLocked)) {
    highlights.set(coordToKey(target.position), 'attack');
  }

  return highlights;
};

const getHoveredStack = (battlefield: Battlefield, hoveredHex: HexCoord | null): Stack | null => {
  if (!hoveredHex) {
    return null;
  }

  return battlefield.hexes[hoveredHex.col]?.[hoveredHex.row]?.occupant ?? null;
};

const createMoveLogEntry = (round: number, stack: Stack, fromHex: HexCoord, toHex: HexCoord): CombatLogEntry => ({
  round,
  actorStackId: stack.id,
  actionType: ActionType.MOVE,
  targetStackId: null,
  damageDealt: null,
  creaturesKilled: null,
  fromHex,
  toHex,
  message: `${stack.owner.name} ${stack.unitType.name} moves to (${toHex.col},${toHex.row})`,
});

const createAttackLogEntry = (
  round: number,
  attacker: Stack,
  defender: Stack,
  actionType: ActionType.MELEE_ATTACK | ActionType.RANGED_ATTACK | ActionType.RETALIATION,
  damage: number,
  creaturesKilled: number,
): CombatLogEntry => ({
  round,
  actorStackId: attacker.id,
  actionType,
  targetStackId: defender.id,
  damageDealt: damage,
  creaturesKilled,
  fromHex: attacker.position,
  toHex: defender.position,
  message: `${attacker.owner.name} ${attacker.unitType.name} deals ${damage} to ${defender.unitType.name}${
    creaturesKilled > 0 ? ` and kills ${creaturesKilled}` : ''
  }`,
});

const createDeathLogEntry = (round: number, stack: Stack): CombatLogEntry => ({
  round,
  actorStackId: stack.id,
  actionType: ActionType.DEATH,
  targetStackId: null,
  damageDealt: null,
  creaturesKilled: null,
  fromHex: stack.position,
  toHex: null,
  message: `${stack.owner.name} ${stack.unitType.name} is slain`,
});

const createWaitLogEntry = (round: number, stack: Stack): CombatLogEntry => ({
  round,
  actorStackId: stack.id,
  actionType: ActionType.WAIT,
  targetStackId: null,
  damageDealt: null,
  creaturesKilled: null,
  fromHex: stack.position,
  toHex: null,
  message: `${stack.owner.name} ${stack.unitType.name} waits`,
});

const createDefendLogEntry = (round: number, stack: Stack): CombatLogEntry => ({
  round,
  actorStackId: stack.id,
  actionType: ActionType.DEFEND,
  targetStackId: null,
  damageDealt: null,
  creaturesKilled: null,
  fromHex: stack.position,
  toHex: null,
  message: `${stack.owner.name} ${stack.unitType.name} defends`,
});

const finalizeBattleState = (
  state: Omit<AppState, 'dispatch'>,
  player1: Player,
  player2: Player,
  turnOrder: TurnOrderQueue,
  combatLog: CombatLogEntry[],
  selectedStack: Stack | null,
  hoveredHex: HexCoord | null,
): Omit<AppState, 'dispatch'> => {
  const battlefield = rebuildBattlefield(state.battlefield.obstacles, player1, player2);
  const winnerId = checkVictory(player1.stacks, player2.stacks);

  if (winnerId) {
    const winner = winnerId === 'player1' ? player1 : player2;
    const loser = winnerId === 'player1' ? player2 : player1;
    return {
      ...state,
      player1,
      player2,
      battlefield,
      turnOrder,
      combatLog,
      gameState: GameState.FINISHED,
      winner,
      battleSummary: buildBattleSummary(winner, loser, state.currentRound, combatLog),
      activeStack: null,
      selectedStack: null,
      hoveredHex,
      highlightedHexes: new Map(),
    };
  }

  let nextTurnOrder = advanceTurn(turnOrder);
  let nextRound = state.currentRound;

  if (nextTurnOrder.entries.length === 0 && nextTurnOrder.waitQueue.length === 0) {
    const roundReset = resetRound(getAllStacks(player1, player2), state.currentRound);
    nextTurnOrder = roundReset.queue;
    nextRound = roundReset.round;
  }

  const activeStack = nextTurnOrder.entries[nextTurnOrder.activeIndex] ?? null;
  return {
    ...state,
    player1,
    player2,
    battlefield,
    turnOrder: nextTurnOrder,
    currentRound: nextRound,
    combatLog,
    activeStack,
    selectedStack,
    hoveredHex,
    highlightedHexes: computeHighlights(battlefield, activeStack, hoveredHex, selectedStack),
  };
};

const startBattle = (state: Omit<AppState, 'dispatch'>): Omit<AppState, 'dispatch'> => {
  const player1 = createBasePlayer(1);
  const player2 = createBasePlayer(2);
  player1.stacks = state.player1Selection.slots.map((slot, index) => createStackFromSelection(slot, player1, index));
  player2.stacks = state.player2Selection.slots.map((slot, index) => createStackFromSelection(slot, player2, index));

  const battlefield = createBattlefield();
  generateObstacles(battlefield);
  deployStacks(player1, player2, battlefield);
  const turnOrder = buildTurnOrder(getAllStacks(player1, player2));
  const activeStack = turnOrder.entries[turnOrder.activeIndex] ?? null;

  return {
    ...state,
    gameState: GameState.BATTLE,
    player1,
    player2,
    battlefield,
    turnOrder,
    currentRound: 1,
    combatLog: [],
    winner: null,
    battleSummary: null,
    hoveredHex: null,
    selectedStack: null,
    activeStack,
    highlightedHexes: computeHighlights(battlefield, activeStack, null, null),
  };
};

const reduceAction = (state: Omit<AppState, 'dispatch'>, action: GameAction): Omit<AppState, 'dispatch'> => {
  switch (action.type) {
    case 'START_GAME': {
      if (state.gameState !== GameState.SETUP) {
        return state;
      }
      return {
        ...state,
        gameState: GameState.PLAYER1_PICKING,
      };
    }

    case 'SELECT_UNIT': {
      const key = getSelectionKey(action.payload.playerNumber);
      const nextSelection: ArmySelection = {
        ...state[key],
        slots: state[key].slots.map((slot, index) =>
          index === action.payload.slotIndex ? { ...slot, unitType: action.payload.unitType } : slot,
        ) as ArmySelection['slots'],
        isReady: false,
      };
      nextSelection.isReady = validateArmy(nextSelection);
      return {
        ...state,
        [key]: nextSelection,
      };
    }

    case 'DESELECT_UNIT': {
      const key = getSelectionKey(action.payload.playerNumber);
      const nextSelection: ArmySelection = {
        ...state[key],
        slots: state[key].slots.map((slot, index) =>
          index === action.payload.slotIndex ? { ...slot, unitType: null, creatureCount: 1 } : slot,
        ) as ArmySelection['slots'],
        isReady: false,
      };
      return {
        ...state,
        [key]: nextSelection,
      };
    }

    case 'SET_CREATURE_COUNT': {
      const key = getSelectionKey(action.payload.playerNumber);
      const count = Math.max(1, Math.min(99, action.payload.count));
      const nextSelection: ArmySelection = {
        ...state[key],
        slots: state[key].slots.map((slot, index) =>
          index === action.payload.slotIndex ? { ...slot, creatureCount: count } : slot,
        ) as ArmySelection['slots'],
        isReady: false,
      };
      nextSelection.isReady = validateArmy(nextSelection);
      return {
        ...state,
        [key]: nextSelection,
      };
    }

    case 'LOAD_DEFAULT_ARMY': {
      const key = getSelectionKey(action.payload.playerNumber);
      return {
        ...state,
        [key]: getDefaultArmy(),
      };
    }

    case 'CONFIRM_ARMY': {
      const key = getSelectionKey(action.payload.playerNumber);
      if (!validateArmy(state[key])) {
        return state;
      }

      if (action.payload.playerNumber === 1 && state.gameState === GameState.PLAYER1_PICKING) {
        return {
          ...state,
          player1Selection: { ...state.player1Selection, isReady: true },
          gameState: GameState.PLAYER2_PICKING,
        };
      }

      if (action.payload.playerNumber === 2 && state.gameState === GameState.PLAYER2_PICKING) {
        const readyState = {
          ...state,
          player2Selection: { ...state.player2Selection, isReady: true },
        };
        return startBattle(readyState);
      }

      return state;
    }

    case 'NEW_GAME': {
      return createInitialCoreState();
    }

    case 'HOVER_HEX': {
      const hoveredHex = action.payload.hex;
      return {
        ...state,
        hoveredHex,
        highlightedHexes: computeHighlights(state.battlefield, state.activeStack, hoveredHex, state.selectedStack),
      };
    }

    default:
      break;
  }

  if (state.gameState !== GameState.BATTLE || !state.activeStack) {
    return state;
  }

  const movementLocked = isMovementLocked(state.activeStack, state.selectedStack);
  const cloned = clonePlayers(state.player1, state.player2);
  const player1 = cloned.player1;
  const player2 = cloned.player2;
  const turnOrder = mapQueueToClones(state.turnOrder, cloned.stackMap);
  const activeStack = cloned.stackMap.get(state.activeStack.id) ?? null;
  const selectedStack = state.selectedStack ? cloned.stackMap.get(state.selectedStack.id) ?? null : null;
  const hoveredHex = state.hoveredHex ? { ...state.hoveredHex } : null;
  const battlefield = rebuildBattlefield(state.battlefield.obstacles, player1, player2);

  if (!activeStack) {
    return state;
  }

  switch (action.type) {
    case 'WAIT': {
      if (movementLocked || activeStack.isWaiting) {
        return state;
      }
      const nextTurnOrder = handleWait(turnOrder);
      const nextActiveStack = nextTurnOrder.entries[nextTurnOrder.activeIndex] ?? null;
      const combatLog = [...state.combatLog, createWaitLogEntry(state.currentRound, activeStack)];
      const nextBattlefield = rebuildBattlefield(state.battlefield.obstacles, player1, player2);
      return {
        ...state,
        player1,
        player2,
        battlefield: nextBattlefield,
        turnOrder: nextTurnOrder,
        combatLog,
        activeStack: nextActiveStack,
        selectedStack: null,
        hoveredHex,
        highlightedHexes: computeHighlights(nextBattlefield, nextActiveStack, hoveredHex, null),
      };
    }

    case 'DEFEND': {
      if (movementLocked) {
        return state;
      }
      handleDefend(activeStack);
      const combatLog = [...state.combatLog, createDefendLogEntry(state.currentRound, activeStack)];
      return finalizeBattleState(state, player1, player2, turnOrder, combatLog, null, hoveredHex);
    }

    case 'MOVE_STACK': {
      if (action.payload.stackId !== activeStack.id || movementLocked) {
        return state;
      }

      const reachable = getReachableHexes(activeStack, battlefield);
      const targetKey = coordToKey(action.payload.targetHex);
      if (!reachable[targetKey]) {
        return state;
      }

      const fromHex = { ...activeStack.position };
      activeStack.position = { ...action.payload.targetHex };
      const movedBattlefield = rebuildBattlefield(state.battlefield.obstacles, player1, player2);
      const combatLog = [...state.combatLog, createMoveLogEntry(state.currentRound, activeStack, fromHex, activeStack.position)];
      const targets = getAttackableTargetsForState(activeStack, movedBattlefield, true);

      if (targets.length === 0) {
        activeStack.hasActed = true;
        return finalizeBattleState(
          { ...state, battlefield: movedBattlefield },
          player1,
          player2,
          turnOrder,
          combatLog,
          null,
          hoveredHex,
        );
      }

      return {
        ...state,
        player1,
        player2,
        battlefield: movedBattlefield,
        turnOrder,
        combatLog,
        activeStack,
        selectedStack: activeStack,
        hoveredHex,
        highlightedHexes: computeHighlights(movedBattlefield, activeStack, hoveredHex, activeStack),
      };
    }

    case 'MELEE_ATTACK': {
      if (action.payload.attackerStackId !== activeStack.id) {
        return state;
      }

      const defender = findStackById(player1, player2, action.payload.defenderStackId);
      if (!defender || defender.owner.id === activeStack.owner.id || !isAlive(defender)) {
        return state;
      }

      let combatLog = [...state.combatLog];
      if (hexDistance(activeStack.position, defender.position) > 1) {
        if (movementLocked) {
          return state;
        }

        const path = findMoveThenAttackPath(activeStack, defender, battlefield);
        if (!path) {
          return state;
        }

        const fromHex = { ...activeStack.position };
        activeStack.position = { ...path[path.length - 1] };
        combatLog.push(createMoveLogEntry(state.currentRound, activeStack, fromHex, activeStack.position));
      }

      const result = meleeAttack(activeStack, defender);
      combatLog.push(
        createAttackLogEntry(state.currentRound, activeStack, defender, ActionType.MELEE_ATTACK, result.attackDamage, result.attackKills),
      );
      if (result.retaliationDamage > 0) {
        combatLog.push(
          createAttackLogEntry(
            state.currentRound,
            defender,
            activeStack,
            ActionType.RETALIATION,
            result.retaliationDamage,
            result.retaliationKills,
          ),
        );
      }
      if (!isAlive(defender)) {
        combatLog.push(createDeathLogEntry(state.currentRound, defender));
      }
      if (!isAlive(activeStack)) {
        combatLog.push(createDeathLogEntry(state.currentRound, activeStack));
      }

      return finalizeBattleState(state, player1, player2, turnOrder, combatLog, null, hoveredHex);
    }

    case 'RANGED_ATTACK': {
      if (action.payload.attackerStackId !== activeStack.id) {
        return state;
      }

      const defender = findStackById(player1, player2, action.payload.defenderStackId);
      if (!defender || defender.owner.id === activeStack.owner.id || !isAlive(defender)) {
        return state;
      }

      if (movementLocked && hexDistance(activeStack.position, defender.position) > 1) {
        return state;
      }

      const result = rangedAttack(activeStack, defender);
      if (result.damage <= 0 && result.usedMelee === false) {
        return state;
      }

      const combatLog = [...state.combatLog];
      combatLog.push(
        createAttackLogEntry(
          state.currentRound,
          activeStack,
          defender,
          result.usedMelee ? ActionType.MELEE_ATTACK : ActionType.RANGED_ATTACK,
          result.damage,
          result.creaturesKilled,
        ),
      );
      if (result.retaliationDamage > 0) {
        combatLog.push(
          createAttackLogEntry(
            state.currentRound,
            defender,
            activeStack,
            ActionType.RETALIATION,
            result.retaliationDamage,
            result.retaliationKills,
          ),
        );
      }
      if (!isAlive(defender)) {
        combatLog.push(createDeathLogEntry(state.currentRound, defender));
      }
      if (!isAlive(activeStack)) {
        combatLog.push(createDeathLogEntry(state.currentRound, activeStack));
      }

      return finalizeBattleState(state, player1, player2, turnOrder, combatLog, null, hoveredHex);
    }

    case 'CLICK_HEX': {
      const clickedHex = battlefield.hexes[action.payload.hex.col]?.[action.payload.hex.row];
      if (!clickedHex) {
        return state;
      }

      if (movementLocked && coordToKey(action.payload.hex) === coordToKey(activeStack.position)) {
        activeStack.hasActed = true;
        return finalizeBattleState(state, player1, player2, turnOrder, state.combatLog, null, hoveredHex);
      }

      if (clickedHex.occupant && clickedHex.occupant.owner.id !== activeStack.owner.id) {
        if (activeStack.unitType.isRanged && (activeStack.remainingShots ?? 0) > 0 && !movementLocked) {
          return reduceAction(state, {
            type: 'RANGED_ATTACK',
            payload: { attackerStackId: activeStack.id, defenderStackId: clickedHex.occupant.id },
          });
        }
        return reduceAction(state, {
          type: 'MELEE_ATTACK',
          payload: { attackerStackId: activeStack.id, defenderStackId: clickedHex.occupant.id },
        });
      }

      const highlight = state.highlightedHexes.get(coordToKey(action.payload.hex));
      if (highlight === 'reachable') {
        return reduceAction(state, {
          type: 'MOVE_STACK',
          payload: { stackId: activeStack.id, targetHex: action.payload.hex },
        });
      }

      return state;
    }

    default:
      return state;
  }
};

export const useGameStore = create<AppState>((set) => ({
  ...createInitialCoreState(),
  dispatch: (action) => {
    set((state) => ({
      ...reduceAction(state, action),
      dispatch: state.dispatch,
    }));
  },
}));

export const useActiveStack = (): Stack | null => useGameStore((state) => state.activeStack);

export const useHoveredStack = (): Stack | null =>
  useGameStore((state) => getHoveredStack(state.battlefield, state.hoveredHex));

export const useReachableHexes = (): string[] =>
  useGameStore(
    useShallow((state) =>
      [...state.highlightedHexes.entries()]
        .filter(([, value]) => value === 'reachable')
        .map(([key]) => key),
    ),
  );

export const useAttackableTargets = (): Stack[] =>
  useGameStore(
    useShallow((state) =>
      getAttackableTargetsForState(
        state.activeStack,
        state.battlefield,
        isMovementLocked(state.activeStack, state.selectedStack),
      ),
    ),
  );

export const useActionGuards = (): {
  canAttack: boolean;
  canWait: boolean;
  canDefend: boolean;
  canRangedAttack: boolean;
} =>
  useGameStore(
    useShallow((state) => {
      const activeStack = state.activeStack;
      const movementLocked = isMovementLocked(activeStack, state.selectedStack);
      const attackTargets = getAttackableTargetsForState(activeStack, state.battlefield, movementLocked);
      return {
        canAttack: attackTargets.length > 0,
        canWait: Boolean(activeStack && !activeStack.isWaiting && !movementLocked),
        canDefend: Boolean(activeStack && !movementLocked),
        canRangedAttack: Boolean(
          activeStack && activeStack.unitType.isRanged && (activeStack.remainingShots ?? 0) > 0 && !movementLocked,
        ),
      };
    }),
  );

export const getNextEmptySlotIndex = (selection: ArmySelection): 0 | 1 | 2 | null => {
  const index = selection.slots.findIndex((slot) => slot.unitType === null);
  return index === -1 ? null : (index as 0 | 1 | 2);
};

export const getRosterUnit = (unitId: string): UnitType | undefined => UNIT_ROSTER.find((unit) => unit.id === unitId);


