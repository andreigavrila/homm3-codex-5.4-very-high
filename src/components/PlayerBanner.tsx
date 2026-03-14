import type { CSSProperties } from 'react';
import type { Player } from '../lib/types';

interface PlayerBannerProps {
  player: Player;
  isActive: boolean;
}

export default function PlayerBanner({ player, isActive }: PlayerBannerProps) {
  return (
    <div className={`player-banner${isActive ? ' is-active' : ''}`} style={{ '--banner-color': player.color } as CSSProperties}>
      <span className="player-banner__label">{player.name}</span>
      <strong>{isActive ? 'Your Turn' : 'Waiting'}</strong>
    </div>
  );
}

