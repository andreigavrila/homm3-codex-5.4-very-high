interface DamagePopupProps {
  amount: number;
  creaturesKilled?: number;
  position: { x: number; y: number };
}

export default function DamagePopup({ amount, creaturesKilled = 0, position }: DamagePopupProps) {
  return (
    <div
      className="damage-popup"
      style={{ left: position.x, top: position.y }}
      aria-live="assertive"
    >
      <div>-{amount}</div>
      {creaturesKilled > 0 ? <small>Skulls x{creaturesKilled}</small> : null}
    </div>
  );
}
