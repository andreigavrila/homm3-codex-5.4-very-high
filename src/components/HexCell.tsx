import type { Stack, HexCoord } from '../lib/types';

export type HexCellVariant =
  | 'empty'
  | 'occupied-player1'
  | 'occupied-player2'
  | 'obstacle'
  | 'reachable'
  | 'attackable'
  | 'path'
  | 'active'
  | 'hovered';

interface HexCellProps {
  coord: HexCoord;
  x: number;
  y: number;
  points: string;
  state: HexCellVariant;
  occupant: Stack | null;
  showPath?: boolean;
  isActive?: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const labelForHex = (coord: HexCoord, occupant: Stack | null, state: HexCellVariant): string => {
  if (state === 'obstacle') {
    return `Obstacle at ${coord.col},${coord.row}`;
  }
  if (occupant) {
    return `Hex ${coord.col},${coord.row}: ${occupant.owner.name} ${occupant.unitType.name}, ${occupant.creatureCount} creatures`;
  }
  return `Empty hex ${coord.col},${coord.row}`;
};

export default function HexCell({
  coord,
  x,
  y,
  points,
  state,
  occupant,
  showPath = false,
  isActive = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: HexCellProps) {
  return (
    <g
      className={`hex-cell hex-cell--${state}${showPath ? ' is-path' : ''}${isActive ? ' is-active' : ''}`}
      transform={`translate(${x} ${y})`}
      role="gridcell"
      aria-label={labelForHex(coord, occupant, state)}
      tabIndex={0}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <title>{labelForHex(coord, occupant, state)}</title>
      <polygon points={points} />
    </g>
  );
}
