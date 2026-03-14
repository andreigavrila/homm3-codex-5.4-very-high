import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBattlefield } from '../../src/lib/engine/battlefieldGenerator';
import { buildTurnOrder } from '../../src/lib/engine/turnManager';
import { GameState, PlayerSide, createEmptyArmySelection, type Battlefield, type Player, type Stack } from '../../src/lib/types';
import { useGameStore } from '../../src/lib/state/gameStore';
import { PLAYER_1, PLAYER_2, UNIT_ARCHER, UNIT_CAVALIER, UNIT_PIKEMAN, UNIT_SWORDSMAN, createStack } from '../fixtures';

const createPlayer = (source: Player): Player => ({ ...source, stacks: [], side: source.side ?? PlayerSide.LEFT });

const placeStacks = (battlefield: Battlefield, stacks: Stack[]): void => {
  for (const stack of stacks) {
    if (stack.creatureCount > 0) {
      battlefield.hexes[stack.position.col][stack.position.row].occupant = stack;
    }
  }
};

const seedBattleState = (player1Stacks: Stack[], player2Stacks: Stack[], activeStack: Stack): void => {
  const battlefield = createBattlefield();
  placeStacks(battlefield, [...player1Stacks, ...player2Stacks]);
  const turnOrder = buildTurnOrder([...player1Stacks, ...player2Stacks]);
  const activeIndex = turnOrder.entries.findIndex((stack) => stack.id === activeStack.id);
  turnOrder.activeIndex = activeIndex === -1 ? 0 : activeIndex;

  useGameStore.setState((state) => ({
    ...state,
    gameState: GameState.BATTLE,
    player1: { ...state.player1, stacks: player1Stacks },
    player2: { ...state.player2, stacks: player2Stacks },
    battlefield,
    turnOrder,
    currentRound: 1,
    combatLog: [],
    winner: null,
    battleSummary: null,
    hoveredHex: null,
    selectedStack: null,
    activeStack,
    highlightedHexes: new Map(),
  }));
};

describe('gameStore integration', () => {
  beforeEach(() => {
    useGameStore.getState().dispatch({ type: 'NEW_GAME' });
  });

  it('transitionsSetupToP1Picking', () => {
    useGameStore.getState().dispatch({ type: 'START_GAME' });
    expect(useGameStore.getState().gameState).toBe(GameState.PLAYER1_PICKING);
  });

  it('transitionsP1PickingToP2Picking', () => {
    const store = useGameStore.getState();
    store.dispatch({ type: 'START_GAME' });
    store.dispatch({ type: 'LOAD_DEFAULT_ARMY', payload: { playerNumber: 1 } });
    store.dispatch({ type: 'CONFIRM_ARMY', payload: { playerNumber: 1 } });
    expect(useGameStore.getState().gameState).toBe(GameState.PLAYER2_PICKING);
  });

  it('transitionsP2PickingToBattle', () => {
    const store = useGameStore.getState();
    store.dispatch({ type: 'START_GAME' });
    store.dispatch({ type: 'LOAD_DEFAULT_ARMY', payload: { playerNumber: 1 } });
    store.dispatch({ type: 'CONFIRM_ARMY', payload: { playerNumber: 1 } });
    store.dispatch({ type: 'LOAD_DEFAULT_ARMY', payload: { playerNumber: 2 } });
    store.dispatch({ type: 'CONFIRM_ARMY', payload: { playerNumber: 2 } });
    expect(useGameStore.getState().gameState).toBe(GameState.BATTLE);
    expect(useGameStore.getState().turnOrder.entries.length).toBeGreaterThan(0);
  });

  it('updatesBattlefieldOnMove', () => {
    const player1 = createPlayer(PLAYER_1);
    const player2 = createPlayer(PLAYER_2);
    const mover = createStack(UNIT_PIKEMAN, player1, 10, { col: 0, row: 5 });
    const defender = createStack(UNIT_PIKEMAN, player2, 5, { col: 14, row: 5 });
    player1.stacks = [mover];
    player2.stacks = [defender];
    seedBattleState(player1.stacks, player2.stacks, mover);

    useGameStore.getState().dispatch({
      type: 'MOVE_STACK',
      payload: { stackId: mover.id, targetHex: { col: 1, row: 5 } },
    });

    const state = useGameStore.getState();
    expect(state.battlefield.hexes[0][5].occupant).toBeNull();
    expect(state.battlefield.hexes[1][5].occupant?.id).toBe(mover.id);
  });

  it('moveThenMeleeAttack', () => {
    const player1 = createPlayer(PLAYER_1);
    const player2 = createPlayer(PLAYER_2);
    const attacker = createStack(UNIT_SWORDSMAN, player1, 3, { col: 0, row: 5 });
    const defender = createStack(UNIT_PIKEMAN, player2, 5, { col: 4, row: 5 });
    player1.stacks = [attacker];
    player2.stacks = [defender];
    seedBattleState(player1.stacks, player2.stacks, attacker);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    useGameStore.getState().dispatch({
      type: 'MELEE_ATTACK',
      payload: { attackerStackId: attacker.id, defenderStackId: defender.id },
    });

    const state = useGameStore.getState();
    expect(state.combatLog.some((entry) => entry.actionType === 'move')).toBe(true);
    expect(state.combatLog.some((entry) => entry.actionType === 'melee_attack')).toBe(true);
    expect(state.player1.stacks[0].position.col).toBe(3);
    vi.restoreAllMocks();
  });

  it('choosesShortestAdjacentHex', () => {
    const player1 = createPlayer(PLAYER_1);
    const player2 = createPlayer(PLAYER_2);
    const attacker = createStack(UNIT_SWORDSMAN, player1, 3, { col: 0, row: 5 });
    const defender = createStack(UNIT_PIKEMAN, player2, 5, { col: 4, row: 6 });
    player1.stacks = [attacker];
    player2.stacks = [defender];
    seedBattleState(player1.stacks, player2.stacks, attacker);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    useGameStore.getState().dispatch({
      type: 'MELEE_ATTACK',
      payload: { attackerStackId: attacker.id, defenderStackId: defender.id },
    });

    expect(useGameStore.getState().player1.stacks[0].position).toEqual({ col: 3, row: 5 });
    vi.restoreAllMocks();
  });

  it('gameEndsOnLastStackKill', () => {
    const player1 = createPlayer(PLAYER_1);
    const player2 = createPlayer(PLAYER_2);
    const attacker = createStack(UNIT_CAVALIER, player1, 10, { col: 5, row: 5 });
    const support = createStack(UNIT_ARCHER, player1, 3, { col: 0, row: 0 });
    const defender = createStack(UNIT_PIKEMAN, player2, 1, { col: 6, row: 5 });
    player1.stacks = [attacker, support];
    player2.stacks = [defender];
    seedBattleState(player1.stacks, player2.stacks, attacker);
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    useGameStore.getState().dispatch({
      type: 'MELEE_ATTACK',
      payload: { attackerStackId: attacker.id, defenderStackId: defender.id },
    });

    const state = useGameStore.getState();
    expect(state.gameState).toBe(GameState.FINISHED);
    expect(state.winner?.id).toBe('player1');
    expect(state.battleSummary?.winner.id).toBe('player1');
    vi.restoreAllMocks();
  });

  it('transitionsFinishedToSetup', () => {
    useGameStore.setState((state) => ({
      ...state,
      gameState: GameState.FINISHED,
      player1Selection: createEmptyArmySelection(),
      player2Selection: createEmptyArmySelection(),
    }));
    useGameStore.getState().dispatch({ type: 'NEW_GAME' });
    expect(useGameStore.getState().gameState).toBe(GameState.SETUP);
  });
});

