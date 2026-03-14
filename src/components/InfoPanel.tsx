import type { Stack } from '../lib/types';
import { getUnitGlyph } from '../lib/utils/unitGlyph';

interface InfoPanelProps {
  stack: Stack | null;
  mode?: 'active' | 'preview';
}

export default function InfoPanel({ stack, mode = 'active' }: InfoPanelProps) {
  if (!stack) {
    return (
      <aside className="info-panel">
        <h2 className="panel-title">Info Panel</h2>
        <p className="info-panel__empty">Hover a stack or start the battle to inspect unit details.</p>
      </aside>
    );
  }

  const hpPercent = Math.max(0, Math.min(100, (stack.currentHp / Math.max(stack.unitType.hp, 1)) * 100));

  return (
    <aside className="info-panel">
      <div className="info-panel__header">
        <span className="info-panel__icon" aria-hidden="true">
          {getUnitGlyph(stack.unitType)}
        </span>
        <div>
          <p className="info-panel__eyebrow">{mode === 'active' ? 'Active Stack' : 'Preview'}</p>
          <h2 className="panel-title">{stack.unitType.name}</h2>
          <p className="info-panel__owner" style={{ color: stack.owner.color }}>
            {stack.owner.name}
          </p>
        </div>
      </div>
      <div className="info-panel__count">{stack.creatureCount} creatures</div>
      <div className="info-panel__hp-bar">
        <span className="info-panel__hp-fill" style={{ width: `${hpPercent}%` }} />
      </div>
      <p className="info-panel__hp-label">
        Top Creature HP: {stack.currentHp}/{stack.unitType.hp}
      </p>
      <div className="info-panel__stats">
        <div><span>ATK</span><strong>{stack.unitType.attack}</strong></div>
        <div><span>DEF</span><strong>{stack.unitType.defense}</strong></div>
        <div><span>DMG</span><strong>{stack.unitType.minDamage}-{stack.unitType.maxDamage}</strong></div>
        <div><span>HP</span><strong>{stack.unitType.hp}</strong></div>
        <div><span>SPD</span><strong>{stack.unitType.speed}</strong></div>
        <div><span>INIT</span><strong>{stack.unitType.initiative}</strong></div>
      </div>
      {stack.unitType.isRanged ? (
        <p className="info-panel__detail">Shots: {stack.remainingShots ?? 0}</p>
      ) : null}
      <div className="info-panel__statuses">
        {stack.isDefending ? <span className="status-pill">Defending</span> : null}
        {stack.isWaiting ? <span className="status-pill">Waiting</span> : null}
        {stack.hasRetaliated ? <span className="status-pill">Retaliated</span> : null}
      </div>
    </aside>
  );
}
