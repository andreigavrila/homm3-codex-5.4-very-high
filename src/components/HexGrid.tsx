import HexCell, { type HexCellVariant } from './HexCell';
import { useGameStore } from '../lib/state/gameStore';
import { coordToKey } from '../lib/utils/hexUtils';
import { getUnitGlyph } from '../lib/utils/unitGlyph';

const HEX_WIDTH = 50;
const HEX_HEIGHT = 58;
const X_STEP = 50;
const Y_STEP = 43.5;
const HEX_POINTS = '25,0 50,14.5 50,43.5 25,58 0,43.5 0,14.5';

const resolveVariant = (
  occupantId: string | null,
  ownerId: string | null,
  isObstacle: boolean,
  highlight: 'reachable' | 'attack' | 'path' | undefined,
  isActive: boolean,
  isHovered: boolean,
): HexCellVariant => {
  if (isActive) {
    return 'active';
  }
  if (highlight === 'attack') {
    return 'attackable';
  }
  if (highlight === 'path') {
    return 'path';
  }
  if (highlight === 'reachable') {
    return 'reachable';
  }
  if (isHovered) {
    return 'hovered';
  }
  if (isObstacle) {
    return 'obstacle';
  }
  if (occupantId) {
    return ownerId === 'player1' ? 'occupied-player1' : 'occupied-player2';
  }
  return 'empty';
};

const tooltipText = (col: number, row: number, occupantName?: string): string =>
  occupantName ? `(${col},${row}) ${occupantName}` : `(${col},${row})`;

export const getHexCenter = (col: number, row: number): { x: number; y: number } => ({
  x: col * X_STEP + (row % 2 === 1 ? HEX_WIDTH / 2 : 0) + HEX_WIDTH / 2,
  y: row * Y_STEP + HEX_HEIGHT / 2,
});

export default function HexGrid() {
  const battlefield = useGameStore((state) => state.battlefield);
  const highlightedHexes = useGameStore((state) => state.highlightedHexes);
  const hoveredHex = useGameStore((state) => state.hoveredHex);
  const activeStack = useGameStore((state) => state.activeStack);
  const dispatch = useGameStore((state) => state.dispatch);

  const allHexes = battlefield.hexes.flat();
  const occupiedHexes = allHexes.filter((hex) => hex.occupant);
  const width = battlefield.width * X_STEP + HEX_WIDTH;
  const height = battlefield.height * Y_STEP + HEX_HEIGHT / 2;
  const hoveredOccupant = hoveredHex ? battlefield.hexes[hoveredHex.col][hoveredHex.row].occupant : null;

  return (
    <div className="hex-grid-wrap">
      <svg className="hex-grid" viewBox={`0 0 ${width} ${height}`} role="grid" aria-label="Battlefield">
        <g className="hex-grid__cells">
          {allHexes.map((hex) => {
            const { x, y } = getHexCenter(hex.col, hex.row);
            const xOffset = x - HEX_WIDTH / 2;
            const yOffset = y - HEX_HEIGHT / 2;
            const key = coordToKey({ col: hex.col, row: hex.row });
            const highlight = highlightedHexes.get(key);
            const isHovered = hoveredHex?.col === hex.col && hoveredHex?.row === hex.row;
            const isActive = activeStack?.position.col === hex.col && activeStack?.position.row === hex.row;
            const variant = resolveVariant(
              hex.occupant?.id ?? null,
              hex.occupant?.owner.id ?? null,
              hex.isObstacle,
              highlight,
              Boolean(isActive),
              Boolean(isHovered),
            );

            return (
              <HexCell
                key={key}
                coord={{ col: hex.col, row: hex.row }}
                x={xOffset}
                y={yOffset}
                points={HEX_POINTS}
                state={variant}
                occupant={hex.occupant}
                showPath={highlight === 'path'}
                isActive={Boolean(isActive)}
                onClick={() => dispatch({ type: 'CLICK_HEX', payload: { hex: { col: hex.col, row: hex.row } } })}
                onMouseEnter={() => dispatch({ type: 'HOVER_HEX', payload: { hex: { col: hex.col, row: hex.row } } })}
                onMouseLeave={() => dispatch({ type: 'HOVER_HEX', payload: { hex: null } })}
              />
            );
          })}
        </g>
        <g className="hex-grid__occupants" aria-hidden="true">
          {occupiedHexes.map((hex) => {
            const occupant = hex.occupant!;
            const { x, y } = getHexCenter(hex.col, hex.row);
            const xOffset = x - HEX_WIDTH / 2;
            const yOffset = y - HEX_HEIGHT / 2;

            return (
              <g
                key={`overlay-${occupant.id}`}
                className={`hex-cell__overlay hex-cell__overlay--${occupant.owner.id}`}
                transform={`translate(${xOffset} ${yOffset})`}
              >
                <text x="25" y="24" textAnchor="middle" dominantBaseline="middle" className="hex-cell__icon">
                  {getUnitGlyph(occupant.unitType)}
                </text>
                <circle cx="25" cy="44" r="11" className="hex-cell__badge" />
                <text x="25" y="45" textAnchor="middle" dominantBaseline="middle" className="hex-cell__count">
                  {occupant.creatureCount}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <div className="hex-grid__tooltip">
        {hoveredHex ? tooltipText(hoveredHex.col, hoveredHex.row, hoveredOccupant?.unitType.name) : 'Hover a hex for info.'}
      </div>
    </div>
  );
}
