import UnitCard from './UnitCard';
import { getNextEmptySlotIndex, useGameStore } from '../lib/state/gameStore';
import { GameState } from '../lib/types';
import { UNIT_ROSTER } from '../lib/data/units';

export default function SetupScreen() {
  const gameState = useGameStore((state) => state.gameState);
  const player1Selection = useGameStore((state) => state.player1Selection);
  const player2Selection = useGameStore((state) => state.player2Selection);
  const dispatch = useGameStore((state) => state.dispatch);

  if (gameState === GameState.SETUP) {
    return (
      <main className="setup-screen setup-screen--intro">
        <div className="setup-screen__hero">
          <p className="setup-screen__eyebrow">Heroes of Might and Magic III</p>
          <h1 className="setup-screen__title">Battle Simulation</h1>
          <p className="setup-screen__copy">
            Build two three-stack armies, deploy them onto a hex battlefield, and fight to elimination in hotseat mode.
          </p>
          <button type="button" className="app-button" onClick={() => dispatch({ type: 'START_GAME' })}>
            Start Game
          </button>
        </div>
      </main>
    );
  }

  const currentPlayerNumber = gameState === GameState.PLAYER2_PICKING ? 2 : 1;
  const currentSelection = currentPlayerNumber === 1 ? player1Selection : player2Selection;
  const selectedUnitIds = new Set(currentSelection.slots.map((slot) => slot.unitType?.id).filter(Boolean));

  const handleSelectUnit = (unitId: string) => {
    const slotIndex = currentSelection.slots.findIndex((slot) => slot.unitType?.id === unitId);
    if (slotIndex >= 0) {
      dispatch({
        type: 'DESELECT_UNIT',
        payload: { playerNumber: currentPlayerNumber, slotIndex: slotIndex as 0 | 1 | 2 },
      });
      return;
    }

    const nextEmptySlot = getNextEmptySlotIndex(currentSelection);
    if (nextEmptySlot === null) {
      return;
    }

    const unit = UNIT_ROSTER.find((entry) => entry.id === unitId);
    if (!unit) {
      return;
    }

    dispatch({
      type: 'SELECT_UNIT',
      payload: { playerNumber: currentPlayerNumber, slotIndex: nextEmptySlot, unitType: unit },
    });
  };

  return (
    <main className="setup-screen">
      <header className="setup-screen__header">
        <p className="setup-screen__eyebrow">Army Draft</p>
        <h1 className="setup-screen__title">Player {currentPlayerNumber}: Pick Your Army</h1>
        <p className="setup-screen__copy">Select exactly three stacks and assign 1-99 creatures to each.</p>
      </header>

      <section className="setup-screen__roster">
        {UNIT_ROSTER.map((unit) => (
          <UnitCard
            key={unit.id}
            unitType={unit}
            variant="full"
            selected={selectedUnitIds.has(unit.id)}
            onClick={() => handleSelectUnit(unit.id)}
          />
        ))}
      </section>

      <section className="setup-screen__army">
        <div className="setup-screen__army-header">
          <h2 className="panel-title">Your Army</h2>
          <p>{currentSelection.slots.filter((slot) => slot.unitType).length}/3 selected</p>
        </div>
        <div className="setup-screen__slots">
          {currentSelection.slots.map((slot, index) => (
            <div className="setup-slot" key={`slot-${index}`}>
              {slot.unitType ? (
                <>
                  <UnitCard unitType={slot.unitType} variant="compact" creatureCount={slot.creatureCount} />
                  <label className="setup-slot__label">
                    Creature Count
                    <input
                      className="number-input"
                      type="number"
                      min={1}
                      max={99}
                      value={slot.creatureCount}
                      onChange={(event) =>
                        dispatch({
                          type: 'SET_CREATURE_COUNT',
                          payload: {
                            playerNumber: currentPlayerNumber,
                            slotIndex: index as 0 | 1 | 2,
                            count: Number(event.target.value),
                          },
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="app-button app-button--ghost"
                    onClick={() =>
                      dispatch({
                        type: 'DESELECT_UNIT',
                        payload: { playerNumber: currentPlayerNumber, slotIndex: index as 0 | 1 | 2 },
                      })
                    }
                  >
                    Remove
                  </button>
                </>
              ) : (
                <div className="setup-slot__empty">Empty slot</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="setup-screen__actions">
        <button
          type="button"
          className="app-button app-button--secondary"
          onClick={() => dispatch({ type: 'LOAD_DEFAULT_ARMY', payload: { playerNumber: currentPlayerNumber } })}
        >
          Default Army
        </button>
        <button
          type="button"
          className="app-button"
          disabled={!currentSelection.isReady}
          onClick={() => dispatch({ type: 'CONFIRM_ARMY', payload: { playerNumber: currentPlayerNumber } })}
        >
          Ready
        </button>
      </div>
    </main>
  );
}
