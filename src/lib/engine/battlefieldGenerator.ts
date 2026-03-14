import { isAlive, type Battlefield, type HexCoord, type Player } from '../types';
import { createEmptyBattlefield, findPath } from './pathfinding';

const DEPLOYMENT_ROWS = [1, 5, 9] as const;

const randomInt = (min: number, max: number, rng: () => number): number =>
  Math.floor(rng() * (max - min + 1)) + min;

const clearObstacles = (battlefield: Battlefield): void => {
  battlefield.obstacles = [];
  for (const column of battlefield.hexes) {
    for (const hex of column) {
      hex.isObstacle = false;
    }
  }
};

const sampleWithoutReplacement = <T>(items: T[], count: number, rng: () => number): T[] => {
  const pool = [...items];
  const sample: T[] = [];

  while (pool.length > 0 && sample.length < count) {
    const index = randomInt(0, pool.length - 1, rng);
    const [item] = pool.splice(index, 1);
    sample.push(item);
  }

  return sample;
};

export const createBattlefield = (): Battlefield => createEmptyBattlefield();

export const generateObstacles = (battlefield: Battlefield, rng: () => number = Math.random): HexCoord[] => {
  const candidates: HexCoord[] = [];
  for (let col = 2; col <= 12; col += 1) {
    for (let row = 0; row < battlefield.height; row += 1) {
      candidates.push({ col, row });
    }
  }

  for (let attempt = 0; attempt < 200; attempt += 1) {
    clearObstacles(battlefield);
    const targetCount = randomInt(6, 12, rng);
    battlefield.obstacles = sampleWithoutReplacement(candidates, targetCount, rng);

    for (const obstacle of battlefield.obstacles) {
      battlefield.hexes[obstacle.col][obstacle.row].isObstacle = true;
    }

    if (findPath({ col: 0, row: 5 }, { col: 14, row: 5 }, battlefield)) {
      return battlefield.obstacles;
    }
  }

  battlefield.obstacles = [];
  return battlefield.obstacles;
};

export const deployStacks = (player1: Player, player2: Player, battlefield: Battlefield): Battlefield => {
  for (const column of battlefield.hexes) {
    for (const hex of column) {
      hex.occupant = null;
    }
  }

  player1.stacks.filter(isAlive).forEach((stack, index) => {
    stack.position = { col: 0, row: DEPLOYMENT_ROWS[index] };
    battlefield.hexes[stack.position.col][stack.position.row].occupant = stack;
  });

  player2.stacks.filter(isAlive).forEach((stack, index) => {
    stack.position = { col: 14, row: DEPLOYMENT_ROWS[index] };
    battlefield.hexes[stack.position.col][stack.position.row].occupant = stack;
  });

  return battlefield;
};
