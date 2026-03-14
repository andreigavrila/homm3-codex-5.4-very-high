import type { PropsWithChildren } from 'react';

interface CreatureCountBadgeProps extends PropsWithChildren {
  count: number;
  maxCount: number;
  className?: string;
}

export default function CreatureCountBadge({ count, maxCount, className, children }: CreatureCountBadgeProps) {
  const isLow = maxCount > 0 && count / maxCount < 0.25;

  return (
    <span className={`creature-count-badge${isLow ? ' is-low' : ''}${className ? ` ${className}` : ''}`}>
      {children ?? count}
    </span>
  );
}
