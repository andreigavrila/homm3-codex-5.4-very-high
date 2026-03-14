import { useEffect, useRef } from 'react';
import { ActionType, type CombatLogEntry } from '../lib/types';

interface CombatLogProps {
  entries: CombatLogEntry[];
}

const toneClass = (entry: CombatLogEntry): string => {
  if (entry.actionType === ActionType.DEATH) {
    return 'combat-log__entry is-danger';
  }
  if (entry.actionType === ActionType.WAIT || entry.actionType === ActionType.DEFEND) {
    return 'combat-log__entry is-gold';
  }
  if (entry.damageDealt) {
    return 'combat-log__entry is-damage';
  }
  return 'combat-log__entry';
};

export default function CombatLog({ entries }: CombatLogProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [entries]);

  let lastRound = 0;

  return (
    <aside className="combat-log-panel">
      <h2 className="panel-title">Combat Log</h2>
      <div className="combat-log" role="log" aria-live="polite" ref={ref}>
        {entries.length === 0 ? <p className="combat-log__empty">Battle events will appear here.</p> : null}
        {entries.map((entry, index) => {
          const needsSeparator = entry.round !== lastRound;
          lastRound = entry.round;
          return (
            <div key={`${entry.actorStackId}-${entry.actionType}-${index}`}>
              {needsSeparator ? <div className="combat-log__round">Round {entry.round}</div> : null}
              <p className={toneClass(entry)}>{entry.message}</p>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
