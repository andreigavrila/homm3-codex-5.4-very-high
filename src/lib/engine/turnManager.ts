import { isAlive, type Stack, type TurnOrderQueue } from '../types';

const compareStacks = (a: Stack, b: Stack): number => {
  const initiativeDiff = b.unitType.initiative - a.unitType.initiative;
  if (initiativeDiff !== 0) {
    return initiativeDiff;
  }

  if (a.owner.id !== b.owner.id) {
    return a.owner.id === 'player1' ? -1 : 1;
  }

  const rowDiff = a.position.row - b.position.row;
  if (rowDiff !== 0) {
    return rowDiff;
  }

  return a.position.col - b.position.col;
};

const compareWaiters = (a: Stack, b: Stack): number => {
  const initiativeDiff = a.unitType.initiative - b.unitType.initiative;
  if (initiativeDiff !== 0) {
    return initiativeDiff;
  }

  if (a.owner.id !== b.owner.id) {
    return a.owner.id === 'player1' ? -1 : 1;
  }

  return a.position.row - b.position.row;
};

const sanitizeQueue = (queue: TurnOrderQueue): void => {
  queue.entries = queue.entries.filter(isAlive);
  queue.waitQueue = queue.waitQueue.filter(isAlive);
  if (queue.activeIndex >= queue.entries.length) {
    queue.activeIndex = Math.max(queue.entries.length - 1, 0);
  }
};

export const buildTurnOrder = (stacks: Stack[]): TurnOrderQueue => ({
  entries: stacks.filter(isAlive).sort(compareStacks),
  activeIndex: 0,
  waitQueue: [],
});

export const advanceTurn = (queue: TurnOrderQueue): TurnOrderQueue => {
  sanitizeQueue(queue);

  if (queue.entries.length > 0 && queue.activeIndex >= 0) {
    queue.entries.splice(queue.activeIndex, 1);
  }

  if (queue.entries.length === 0 && queue.waitQueue.length > 0) {
    queue.entries = queue.waitQueue.sort(compareWaiters);
    queue.waitQueue = [];
    queue.activeIndex = 0;
    return queue;
  }

  if (queue.entries.length === 0) {
    queue.activeIndex = 0;
    return queue;
  }

  queue.activeIndex = Math.min(queue.activeIndex, queue.entries.length - 1);
  return queue;
};

export const handleWait = (queue: TurnOrderQueue): TurnOrderQueue => {
  sanitizeQueue(queue);

  const activeStack = queue.entries[queue.activeIndex];
  if (!activeStack || activeStack.isWaiting) {
    return queue;
  }

  activeStack.isWaiting = true;
  queue.waitQueue.push(activeStack);
  queue.waitQueue.sort(compareWaiters);
  queue.entries.splice(queue.activeIndex, 1);

  if (queue.entries.length === 0 && queue.waitQueue.length > 0) {
    queue.entries = queue.waitQueue;
    queue.waitQueue = [];
    queue.activeIndex = 0;
    return queue;
  }

  queue.activeIndex = Math.min(queue.activeIndex, Math.max(queue.entries.length - 1, 0));
  return queue;
};

export const handleDefend = (stack: Stack): Stack => {
  stack.isDefending = true;
  stack.hasActed = true;
  return stack;
};

export const resetRound = (stacks: Stack[], currentRound = 0): { round: number; queue: TurnOrderQueue } => {
  for (const stack of stacks) {
    if (!isAlive(stack)) {
      continue;
    }

    stack.hasRetaliated = false;
    stack.hasActed = false;
    stack.isWaiting = false;
    stack.isDefending = false;
  }

  return {
    round: currentRound + 1,
    queue: buildTurnOrder(stacks),
  };
};
