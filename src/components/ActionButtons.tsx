interface ActionButtonsProps {
  canAttack: boolean;
  canWait: boolean;
  canDefend: boolean;
  isRanged: boolean;
  remainingShots: number;
  onAttack: () => void;
  onWait: () => void;
  onDefend: () => void;
}

export default function ActionButtons({
  canAttack,
  canWait,
  canDefend,
  isRanged,
  remainingShots,
  onAttack,
  onWait,
  onDefend,
}: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      <button type="button" className="app-button app-button--danger" disabled={!canAttack} onClick={onAttack}>
        {isRanged ? `Attack (${remainingShots})` : 'Attack'}
      </button>
      <button type="button" className="app-button app-button--secondary" disabled={!canWait} onClick={onWait}>
        Wait
      </button>
      <button type="button" className="app-button app-button--secondary" disabled={!canDefend} onClick={onDefend}>
        Defend
      </button>
    </div>
  );
}
