import { useEffect, useRef, useState } from 'react';
import ActionButtons from './ActionButtons';
import CombatLog from './CombatLog';
import DamagePopup from './DamagePopup';
import ErrorBoundary from './ErrorBoundary';
import HexGrid, { getHexCenter } from './HexGrid';
import InfoPanel from './InfoPanel';
import PlayerBanner from './PlayerBanner';
import TurnOrderBar from './TurnOrderBar';
import { useActionGuards, useAttackableTargets, useGameStore, useHoveredStack } from '../lib/state/gameStore';
import { hexDistance } from '../lib/utils/hexUtils';

interface PopupState {
  id: string;
  amount: number;
  creaturesKilled: number;
  position: { x: number; y: number };
}

export default function BattleScreen() {
  const player1 = useGameStore((state) => state.player1);
  const player2 = useGameStore((state) => state.player2);
  const activeStack = useGameStore((state) => state.activeStack);
  const selectedStack = useGameStore((state) => state.selectedStack);
  const currentRound = useGameStore((state) => state.currentRound);
  const turnOrder = useGameStore((state) => state.turnOrder);
  const combatLog = useGameStore((state) => state.combatLog);
  const dispatch = useGameStore((state) => state.dispatch);
  const hoveredStack = useHoveredStack();
  const attackableTargets = useAttackableTargets();
  const actionGuards = useActionGuards();
  const [popups, setPopups] = useState<PopupState[]>([]);
  const lastLogIndex = useRef(0);

  useEffect(() => {
    if (combatLog.length <= lastLogIndex.current) {
      return;
    }

    const latestEntry = combatLog[combatLog.length - 1];
    lastLogIndex.current = combatLog.length;
    if (!latestEntry.damageDealt || !latestEntry.toHex) {
      return;
    }

    const center = getHexCenter(latestEntry.toHex.col, latestEntry.toHex.row);
    const popup: PopupState = {
      id: `${latestEntry.actorStackId}-${combatLog.length}`,
      amount: latestEntry.damageDealt,
      creaturesKilled: latestEntry.creaturesKilled ?? 0,
      position: center,
    };

    setPopups((current) => [...current, popup]);
    const timeoutId = window.setTimeout(() => {
      setPopups((current) => current.filter((entry) => entry.id !== popup.id));
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [combatLog]);

  const attackTarget =
    hoveredStack && attackableTargets.some((stack) => stack.id === hoveredStack.id) ? hoveredStack : attackableTargets[0] ?? null;

  const handleAttack = () => {
    if (!activeStack || !attackTarget) {
      return;
    }

    const distance = hexDistance(activeStack.position, attackTarget.position);
    const useRanged = activeStack.unitType.isRanged && (activeStack.remainingShots ?? 0) > 0 && distance > 1 && !selectedStack;
    dispatch({
      type: useRanged ? 'RANGED_ATTACK' : 'MELEE_ATTACK',
      payload: { attackerStackId: activeStack.id, defenderStackId: attackTarget.id },
    });
  };

  return (
    <main className="battle-screen">
      <header className="battle-screen__topbar">
        <PlayerBanner player={player1} isActive={activeStack?.owner.id === player1.id} />
        <TurnOrderBar {...turnOrder} />
        <PlayerBanner player={player2} isActive={activeStack?.owner.id === player2.id} />
      </header>

      <div className="battle-screen__body">
        <ErrorBoundary title="Info Panel">
          <InfoPanel stack={hoveredStack ?? activeStack} mode={hoveredStack ? 'preview' : 'active'} />
        </ErrorBoundary>
        <ErrorBoundary title="Battlefield">
          <section className="battlefield-panel">
            <div className="battlefield-panel__meta">
              <span>Round {currentRound}</span>
              <span>{selectedStack?.id === activeStack?.id ? 'Moved: attack or click current hex to end turn' : 'Select a move or attack target'}</span>
            </div>
            <div className="battlefield-panel__grid-wrap">
              <HexGrid />
              <div className="battlefield-panel__popups">
                {popups.map((popup) => (
                  <DamagePopup
                    key={popup.id}
                    amount={popup.amount}
                    creaturesKilled={popup.creaturesKilled}
                    position={popup.position}
                  />
                ))}
              </div>
            </div>
            <ActionButtons
              canAttack={actionGuards.canAttack}
              canWait={actionGuards.canWait}
              canDefend={actionGuards.canDefend}
              isRanged={Boolean(activeStack?.unitType.isRanged)}
              remainingShots={activeStack?.remainingShots ?? 0}
              onAttack={handleAttack}
              onWait={() => dispatch({ type: 'WAIT' })}
              onDefend={() => dispatch({ type: 'DEFEND' })}
            />
          </section>
        </ErrorBoundary>
        <ErrorBoundary title="Combat Log">
          <CombatLog entries={combatLog} />
        </ErrorBoundary>
      </div>
    </main>
  );
}
