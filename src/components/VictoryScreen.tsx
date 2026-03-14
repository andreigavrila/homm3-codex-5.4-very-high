import UnitCard from './UnitCard';
import { useGameStore } from '../lib/state/gameStore';
import type { BattleSummary } from '../lib/types';

interface VictoryScreenProps {
  summary: BattleSummary;
}

export default function VictoryScreen({ summary }: VictoryScreenProps) {
  const dispatch = useGameStore((state) => state.dispatch);

  return (
    <div className="victory-screen" role="dialog" aria-modal="true">
      <div className="victory-screen__card">
        <p className="victory-screen__eyebrow">Battle Complete</p>
        <h2 className="victory-screen__title">Victory!</h2>
        <p className="victory-screen__winner" style={{ color: summary.winner.color }}>
          {summary.winner.name} wins the battle.
        </p>
        <div className="victory-screen__summary">
          <div>
            <span>Rounds</span>
            <strong>{summary.totalRounds}</strong>
          </div>
          <div>
            <span>P1 Damage</span>
            <strong>{summary.totalDamageDealt.player1}</strong>
          </div>
          <div>
            <span>P2 Damage</span>
            <strong>{summary.totalDamageDealt.player2}</strong>
          </div>
        </div>
        <div className="victory-screen__survivors">
          {summary.survivingStacks.map((stack, index) => (
            <UnitCard
              key={`${stack.unitType.id}-${index}`}
              unitType={stack.unitType}
              variant="compact"
              creatureCount={stack.remainingCreatures}
            />
          ))}
        </div>
        <button type="button" className="app-button" onClick={() => dispatch({ type: 'NEW_GAME' })}>
          New Game
        </button>
      </div>
    </div>
  );
}
