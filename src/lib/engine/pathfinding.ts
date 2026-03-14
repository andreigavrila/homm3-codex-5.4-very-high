import {
  type Battlefield,
  type HexCoord,
  type Stack,
  BATTLEFIELD_HEIGHT,
  BATTLEFIELD_WIDTH,
} from '../types';
import { coordToKey, getHexNeighbors, hexDistance, keyToCoord } from '../utils/hexUtils';

const canStepOn = (
  battlefield: Battlefield,
  coord: HexCoord,
  goalKey: string,
  allowOccupiedGoal: boolean,
): boolean => {
  const hex = battlefield.hexes[coord.col]?.[coord.row];
  if (!hex || hex.isObstacle) {
    return false;
  }

  if (hex.occupant && coordToKey(coord) !== goalKey) {
    return false;
  }

  if (hex.occupant && coordToKey(coord) === goalKey && !allowOccupiedGoal) {
    return false;
  }

  return true;
};

const reconstructPath = (cameFrom: Map<string, string>, currentKey: string): HexCoord[] => {
  const path: HexCoord[] = [keyToCoord(currentKey)];
  let walker = currentKey;

  while (cameFrom.has(walker)) {
    walker = cameFrom.get(walker)!;
    path.unshift(keyToCoord(walker));
  }

  return path;
};

export const findPath = (
  start: HexCoord,
  goal: HexCoord,
  battlefield: Battlefield,
  allowOccupiedGoal = false,
): HexCoord[] | null => {
  const startKey = coordToKey(start);
  const goalKey = coordToKey(goal);

  if (startKey === goalKey) {
    return [start];
  }

  const openSet = new Set<string>([startKey]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>([[startKey, 0]]);
  const fScore = new Map<string, number>([[startKey, hexDistance(start, goal)]]);

  while (openSet.size > 0) {
    let currentKey: string | null = null;
    let currentFScore = Number.POSITIVE_INFINITY;

    for (const key of openSet) {
      const score = fScore.get(key) ?? Number.POSITIVE_INFINITY;
      if (score < currentFScore) {
        currentFScore = score;
        currentKey = key;
      }
    }

    if (!currentKey) {
      break;
    }

    if (currentKey === goalKey) {
      return reconstructPath(cameFrom, currentKey);
    }

    openSet.delete(currentKey);
    const currentCoord = keyToCoord(currentKey);

    for (const neighbor of getHexNeighbors(currentCoord)) {
      if (!canStepOn(battlefield, neighbor, goalKey, allowOccupiedGoal)) {
        continue;
      }

      const neighborKey = coordToKey(neighbor);
      const tentativeGScore = (gScore.get(currentKey) ?? Number.POSITIVE_INFINITY) + 1;

      if (tentativeGScore < (gScore.get(neighborKey) ?? Number.POSITIVE_INFINITY)) {
        cameFrom.set(neighborKey, currentKey);
        gScore.set(neighborKey, tentativeGScore);
        fScore.set(neighborKey, tentativeGScore + hexDistance(neighbor, goal));
        openSet.add(neighborKey);
      }
    }
  }

  return null;
};

export const getReachableHexes = (stack: Stack, battlefield: Battlefield): Record<string, number> => {
  const queue: Array<{ coord: HexCoord; distance: number }> = [{ coord: stack.position, distance: 0 }];
  const visited = new Map<string, number>([[coordToKey(stack.position), 0]]);
  const reachable: Record<string, number> = {};

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.distance > 0) {
      reachable[coordToKey(current.coord)] = current.distance;
    }

    if (current.distance >= stack.unitType.speed) {
      continue;
    }

    for (const neighbor of getHexNeighbors(current.coord)) {
      const hex = battlefield.hexes[neighbor.col]?.[neighbor.row];
      const key = coordToKey(neighbor);
      if (!hex || hex.isObstacle) {
        continue;
      }
      if (hex.occupant && key !== coordToKey(stack.position)) {
        continue;
      }

      const nextDistance = current.distance + 1;
      if ((visited.get(key) ?? Number.POSITIVE_INFINITY) <= nextDistance) {
        continue;
      }

      visited.set(key, nextDistance);
      queue.push({ coord: neighbor, distance: nextDistance });
    }
  }

  return reachable;
};

export const createEmptyBattlefield = (): Battlefield => {
  const hexes: Battlefield['hexes'] = [];

  for (let col = 0; col < BATTLEFIELD_WIDTH; col += 1) {
    hexes[col] = [];
    for (let row = 0; row < BATTLEFIELD_HEIGHT; row += 1) {
      hexes[col][row] = {
        col,
        row,
        isObstacle: false,
        occupant: null,
      };
    }
  }

  return {
    width: 15,
    height: 11,
    hexes,
    obstacles: [],
  };
};

export { hexDistance };
