import UnitCard from './UnitCard';
import type { Stack, TurnOrderQueue } from '../lib/types';

interface TurnOrderBarProps extends TurnOrderQueue {}

export default function TurnOrderBar({ entries, activeIndex, waitQueue }: TurnOrderBarProps) {
  const waitingIds = new Set(waitQueue.map((stack) => stack.id));

  return (
    <section className="turn-order" role="list" aria-label="Turn order">
      {entries.map((stack: Stack, index) => (
        <div
          className={`turn-order__entry${index === activeIndex ? ' is-active' : ''}${waitingIds.has(stack.id) ? ' is-waiting' : ''}`}
          role="listitem"
          aria-current={index === activeIndex ? 'true' : undefined}
          key={stack.id}
        >
          <UnitCard
            unitType={stack.unitType}
            variant="mini"
            creatureCount={stack.creatureCount}
            playerColor={stack.owner.color}
          />
        </div>
      ))}
    </section>
  );
}
