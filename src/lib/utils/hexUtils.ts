import { BATTLEFIELD_HEIGHT, BATTLEFIELD_WIDTH, type HexCoord } from '../types';

export interface CubeCoord {
  x: number;
  y: number;
  z: number;
}

export const inBounds = (coord: HexCoord): boolean =>
  coord.col >= 0 &&
  coord.col < BATTLEFIELD_WIDTH &&
  coord.row >= 0 &&
  coord.row < BATTLEFIELD_HEIGHT;

export const offsetToCube = ({ col, row }: HexCoord): CubeCoord => {
  const x = col - ((row - (row & 1)) >> 1);
  const z = row;
  const y = -x - z;
  return { x, y, z };
};

export const cubeToOffset = ({ x, z }: CubeCoord): HexCoord => ({
  col: x + ((z - (z & 1)) >> 1),
  row: z,
});

export const hexDistance = (a: HexCoord, b: HexCoord): number => {
  const aCube = offsetToCube(a);
  const bCube = offsetToCube(b);
  return Math.max(
    Math.abs(aCube.x - bCube.x),
    Math.abs(aCube.y - bCube.y),
    Math.abs(aCube.z - bCube.z),
  );
};

export const coordToKey = ({ col, row }: HexCoord): string => `${col},${row}`;

export const keyToCoord = (key: string): HexCoord => {
  const [col, row] = key.split(',').map(Number);
  return { col, row };
};

export const getHexNeighbors = (coord: HexCoord): HexCoord[] => {
  const directions =
    coord.row % 2 === 1
      ? [
          { col: 1, row: 0 },
          { col: 1, row: -1 },
          { col: 0, row: -1 },
          { col: -1, row: 0 },
          { col: 0, row: 1 },
          { col: 1, row: 1 },
        ]
      : [
          { col: 1, row: 0 },
          { col: 0, row: -1 },
          { col: -1, row: -1 },
          { col: -1, row: 0 },
          { col: -1, row: 1 },
          { col: 0, row: 1 },
        ];

  return directions
    .map(({ col, row }) => ({ col: coord.col + col, row: coord.row + row }))
    .filter(inBounds);
};
