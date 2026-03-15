import type { CSSProperties } from 'react';
import HexCell, { type HexCellVariant } from './HexCell';
import type { HexCoord, Stack } from '../lib/types';
import { useGameStore } from '../lib/state/gameStore';
import { coordToKey } from '../lib/utils/hexUtils';
import { getUnitGlyph, isUnitImageIcon } from '../lib/utils/unitGlyph';

const HEX_WIDTH = 50;
const HEX_HEIGHT = 58;
const X_STEP = 50;
const Y_STEP = 43.5;
const HEX_POINTS = '25,0 50,14.5 50,43.5 25,58 0,43.5 0,14.5';
const BOARD_PADDING_X = 56;
const BOARD_PADDING_TOP = 92;
const BOARD_PADDING_BOTTOM = 22;
const UNIT_FOOT_Y = 48;

const UNIT_STAGE_BOX: Record<string, { width: number; height: number }> = {
  pikeman: { width: 92, height: 126 },
  archer: { width: 90, height: 122 },
  griffin: { width: 112, height: 126 },
  swordsman: { width: 94, height: 124 },
  monk: { width: 90, height: 120 },
  cavalier: { width: 108, height: 126 },
};

export interface StrikeEffect {
  id: string;
  attackerStackId: string;
  targetStackId: string;
  fromHex: HexCoord;
  toHex: HexCoord;
  kind: 'melee' | 'retaliation';
}

interface HexGridProps {
  strikeEffects?: StrikeEffect[];
}

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

export const getBattlefieldCenter = (col: number, row: number): { x: number; y: number } => {
  const center = getHexCenter(col, row);

  return {
    x: center.x + BOARD_PADDING_X,
    y: center.y + BOARD_PADDING_TOP,
  };
};

const getUnitStageFrame = (stack: Stack) => {
  const frame = UNIT_STAGE_BOX[stack.unitType.id] ?? { width: 96, height: 124 };

  return {
    width: frame.width,
    height: frame.height,
    x: HEX_WIDTH / 2 - frame.width / 2,
    y: UNIT_FOOT_Y - frame.height,
  };
};

const getBadgeFrame = (stack: Stack) => {
  const label = `${stack.creatureCount}`;
  const width = Math.max(24, label.length * 8 + 12);
  const x = stack.owner.id === 'player1' ? HEX_WIDTH + 6 : -width - 6;

  return {
    width,
    x,
    y: 33,
  };
};

const getLungeStyle = (effect: StrikeEffect): CSSProperties => {
  const from = getHexCenter(effect.fromHex.col, effect.fromHex.row);
  const to = getHexCenter(effect.toHex.col, effect.toHex.row);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.max(Math.hypot(dx, dy), 1);
  const reach = Math.min(12, distance * 0.26);

  return {
    '--lunge-x': `${(dx / distance) * reach}px`,
    '--lunge-y': `${(dy / distance) * reach}px`,
  } as CSSProperties;
};

export default function HexGrid({ strikeEffects = [] }: HexGridProps) {
  const battlefield = useGameStore((state) => state.battlefield);
  const highlightedHexes = useGameStore((state) => state.highlightedHexes);
  const hoveredHex = useGameStore((state) => state.hoveredHex);
  const activeStack = useGameStore((state) => state.activeStack);
  const dispatch = useGameStore((state) => state.dispatch);

  const allHexes = battlefield.hexes.flat();
  const occupiedHexes = allHexes
    .filter((hex) => hex.occupant)
    .sort((left, right) => left.row - right.row || left.col - right.col);
  const boardWidth = battlefield.width * X_STEP + HEX_WIDTH;
  const boardHeight = battlefield.height * Y_STEP + HEX_HEIGHT / 2;
  const width = boardWidth + BOARD_PADDING_X * 2;
  const height = boardHeight + BOARD_PADDING_TOP + BOARD_PADDING_BOTTOM;
  const hoveredOccupant = hoveredHex ? battlefield.hexes[hoveredHex.col][hoveredHex.row].occupant : null;

  return (
    <div className="hex-grid-wrap">
      <svg className="hex-grid" viewBox={`0 0 ${width} ${height}`} role="grid" aria-label="Battlefield">
        <g transform={`translate(${BOARD_PADDING_X} ${BOARD_PADDING_TOP})`}>
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
              const showsImage = isUnitImageIcon(occupant.unitType.icon);
              const unitFrame = getUnitStageFrame(occupant);
              const badgeFrame = getBadgeFrame(occupant);
              const isActive = activeStack?.id === occupant.id;
              const strikeEffect = strikeEffects.find(
                (effect) => effect.attackerStackId === occupant.id || effect.targetStackId === occupant.id,
              );
              const isStriking = strikeEffect?.attackerStackId === occupant.id;
              const isStrikeTarget = strikeEffect?.targetStackId === occupant.id;

              return (
                <g
                  key={`overlay-${occupant.id}`}
                  className={`hex-cell__overlay hex-cell__overlay--${occupant.owner.id}${isActive ? ' is-active' : ''}`}
                  transform={`translate(${xOffset} ${yOffset})`}
                >
                  <g
                    className={`hex-cell__unit${isStriking ? ' is-striking' : ''}${isStrikeTarget ? ' is-strike-target' : ''}`}
                    style={isStriking && strikeEffect ? getLungeStyle(strikeEffect) : undefined}
                  >
                    <ellipse cx="25" cy="47" rx="16" ry="5" className="hex-cell__shadow" />
                    {showsImage ? (
                      <image
                        href={occupant.unitType.icon}
                        x={unitFrame.x}
                        y={unitFrame.y}
                        width={unitFrame.width}
                        height={unitFrame.height}
                        preserveAspectRatio="xMidYMax meet"
                        className="hex-cell__portrait hex-cell__portrait--full"
                      />
                    ) : (
                      <>
                        <circle cx="25" cy="20" r="18" className="hex-cell__portrait-frame" />
                        <text x="25" y="20" textAnchor="middle" dominantBaseline="middle" className="hex-cell__icon">
                          {getUnitGlyph(occupant.unitType)}
                        </text>
                      </>
                    )}
                  </g>
                  <rect
                    x={badgeFrame.x}
                    y={badgeFrame.y}
                    width={badgeFrame.width}
                    height="18"
                    rx="4"
                    className="hex-cell__badge"
                  />
                  <text
                    x={badgeFrame.x + badgeFrame.width / 2}
                    y={badgeFrame.y + 9.5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="hex-cell__count"
                  >
                    {occupant.creatureCount}
                  </text>
                </g>
              );
            })}
          </g>
          <g className="hex-grid__strikes" aria-hidden="true">
            {strikeEffects.map((effect) => {
              const from = getHexCenter(effect.fromHex.col, effect.fromHex.row);
              const to = getHexCenter(effect.toHex.col, effect.toHex.row);
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const distance = Math.max(Math.hypot(dx, dy), 1);
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              const originOffset = 7;
              const travel = Math.max(distance - 14, 14);

              return (
                <g
                  key={effect.id}
                  className={`melee-strike melee-strike--${effect.kind}`}
                  transform={`translate(${from.x} ${from.y}) rotate(${angle})`}
                >
                  <circle cx="0" cy="0" r="5" className="melee-strike__origin" />
                  <line
                    x1={originOffset}
                    y1="0"
                    x2={originOffset + travel}
                    y2="0"
                    className="melee-strike__trail"
                    style={{ strokeDasharray: `${travel} ${travel}`, strokeDashoffset: travel }}
                  />
                  <circle cx={originOffset + travel} cy="0" r="10" className="melee-strike__impact" />
                </g>
              );
            })}
          </g>
        </g>
      </svg>
      <div className="hex-grid__tooltip">
        {hoveredHex ? tooltipText(hoveredHex.col, hoveredHex.row, hoveredOccupant?.unitType.name) : 'Hover a hex for info.'}
      </div>
    </div>
  );
}
