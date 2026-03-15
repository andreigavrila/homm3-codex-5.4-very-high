import { useEffect, useRef, useState } from 'react';
import ActionButtons from './ActionButtons';
import CombatLog from './CombatLog';
import DamagePopup from './DamagePopup';
import ErrorBoundary from './ErrorBoundary';
import HexGrid, { getBattlefieldCenter, type StrikeEffect } from './HexGrid';
import InfoPanel from './InfoPanel';
import PlayerBanner from './PlayerBanner';
import TurnOrderBar from './TurnOrderBar';
import { useActionGuards, useAttackableTargets, useGameStore, useHoveredStack } from '../lib/state/gameStore';
import { ActionType } from '../lib/types';
import { hexDistance } from '../lib/utils/hexUtils';

interface PopupState {
  id: string;
  amount: number;
  creaturesKilled: number;
  position: { x: number; y: number };
}

const ENTRY_STAGGER_MS = 260;
const STRIKE_DURATION_MS = 460;
const POPUP_DURATION_MS = 1200;

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
  const [strikeEffects, setStrikeEffects] = useState<StrikeEffect[]>([]);
  const lastLogIndex = useRef(0);

  useEffect(() => {
    if (combatLog.length < lastLogIndex.current) {
      lastLogIndex.current = 0;
      setPopups([]);
      setStrikeEffects([]);
    }

    if (combatLog.length <= lastLogIndex.current) {
      return;
    }

    const newEntries = combatLog.slice(lastLogIndex.current);
    lastLogIndex.current = combatLog.length;
    const timeoutIds: number[] = [];

    newEntries.forEach((entry, index) => {
      const baseDelay = index * ENTRY_STAGGER_MS;
      const strikeKind =
        entry.actionType === ActionType.MELEE_ATTACK
          ? 'melee'
          : entry.actionType === ActionType.RETALIATION
            ? 'retaliation'
            : null;

      if (strikeKind && entry.fromHex && entry.toHex && entry.targetStackId) {
        const strikeEffect: StrikeEffect = {
          id: `${entry.actorStackId}-${combatLog.length}-strike-${index}`,
          attackerStackId: entry.actorStackId,
          targetStackId: entry.targetStackId,
          fromHex: entry.fromHex,
          toHex: entry.toHex,
          kind: strikeKind,
        };

        timeoutIds.push(
          window.setTimeout(() => {
            setStrikeEffects((current) => [...current, strikeEffect]);
          }, baseDelay),
        );

        timeoutIds.push(
          window.setTimeout(() => {
            setStrikeEffects((current) => current.filter((effect) => effect.id !== strikeEffect.id));
          }, baseDelay + STRIKE_DURATION_MS),
        );
      }

      if (!entry.damageDealt || !entry.toHex) {
        return;
      }

      const popup: PopupState = {
        id: `${entry.actorStackId}-${combatLog.length}-popup-${index}`,
        amount: entry.damageDealt,
        creaturesKilled: entry.creaturesKilled ?? 0,
        position: getBattlefieldCenter(entry.toHex.col, entry.toHex.row),
      };
      const popupDelay = baseDelay + (strikeKind ? Math.floor(STRIKE_DURATION_MS * 0.32) : 40);

      timeoutIds.push(
        window.setTimeout(() => {
          setPopups((current) => [...current, popup]);
        }, popupDelay),
      );

      timeoutIds.push(
        window.setTimeout(() => {
          setPopups((current) => current.filter((effect) => effect.id !== popup.id));
        }, popupDelay + POPUP_DURATION_MS),
      );
    });

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
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
              <HexGrid strikeEffects={strikeEffects} />
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
