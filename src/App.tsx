import BattleScreen from './components/BattleScreen';
import ErrorBoundary from './components/ErrorBoundary';
import SetupScreen from './components/SetupScreen';
import VictoryScreen from './components/VictoryScreen';
import { useGameStore } from './lib/state/gameStore';
import { GameState } from './lib/types';

export default function App() {
  const gameState = useGameStore((state) => state.gameState);
  const battleSummary = useGameStore((state) => state.battleSummary);

  if (gameState === GameState.SETUP || gameState === GameState.PLAYER1_PICKING || gameState === GameState.PLAYER2_PICKING) {
    return (
      <ErrorBoundary title="Setup Screen">
        <SetupScreen />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary title="Battle Screen">
      <div className="app-shell">
        <BattleScreen />
        {gameState === GameState.FINISHED && battleSummary ? <VictoryScreen summary={battleSummary} /> : null}
      </div>
    </ErrorBoundary>
  );
}
