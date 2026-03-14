import type { CSSProperties } from 'react';
import CreatureCountBadge from './CreatureCountBadge';
import type { UnitType } from '../lib/types';
import { getUnitGlyph } from '../lib/utils/unitGlyph';

export interface UnitCardProps {
  unitType: UnitType;
  variant?: 'full' | 'compact' | 'mini';
  selected?: boolean;
  playerColor?: string | null;
  creatureCount?: number | null;
  onClick?: () => void;
}

const renderStat = (label: string, value: string | number) => (
  <div className="unit-card__stat" key={label}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export default function UnitCard({
  unitType,
  variant = 'full',
  selected = false,
  playerColor = null,
  creatureCount = null,
  onClick,
}: UnitCardProps) {
  const style = playerColor ? ({ '--player-card-color': playerColor } as CSSProperties) : undefined;

  return (
    <button
      type="button"
      className={`unit-card unit-card--${variant}${selected ? ' is-selected' : ''}${playerColor ? ' has-player-color' : ''}`}
      onClick={onClick}
      style={style}
    >
      <span className="unit-card__icon" aria-hidden="true">
        {getUnitGlyph(unitType)}
      </span>
      {variant !== 'mini' ? (
        <span className="unit-card__content">
          <span className="unit-card__name">{unitType.name}</span>
          {variant === 'full' ? (
            <span className="unit-card__stats">
              {renderStat('ATK', unitType.attack)}
              {renderStat('DEF', unitType.defense)}
              {renderStat('DMG', `${unitType.minDamage}-${unitType.maxDamage}`)}
              {renderStat('HP', unitType.hp)}
              {renderStat('SPD', unitType.speed)}
              {renderStat('INIT', unitType.initiative)}
            </span>
          ) : null}
          {variant === 'compact' && creatureCount !== null ? (
            <span className="unit-card__count-label">{creatureCount} creatures</span>
          ) : null}
        </span>
      ) : null}
      {creatureCount !== null ? <CreatureCountBadge count={creatureCount} maxCount={creatureCount} /> : null}
    </button>
  );
}
