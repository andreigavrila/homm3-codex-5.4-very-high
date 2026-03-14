import { isAlive, type BattleSummary, type CombatLogEntry, type Player, type Stack } from '../types';

export const checkVictory = (player1Stacks: Stack[], player2Stacks: Stack[]): 'player1' | 'player2' | null => {
  const player1Alive = player1Stacks.some(isAlive);
  const player2Alive = player2Stacks.some(isAlive);

  if (!player1Alive && player2Alive) {
    return 'player2';
  }

  if (!player2Alive && player1Alive) {
    return 'player1';
  }

  return null;
};

export const buildBattleSummary = (
  winner: Player,
  loser: Player,
  totalRounds: number,
  combatLog: CombatLogEntry[] = [],
): BattleSummary => {
  const totalDamageDealt = { player1: 0, player2: 0 };
  const totalCreaturesKilled = { player1: 0, player2: 0 };

  for (const entry of combatLog) {
    if (entry.damageDealt) {
      if (entry.actorStackId.includes('player1')) {
        totalDamageDealt.player1 += entry.damageDealt;
      } else if (entry.actorStackId.includes('player2')) {
        totalDamageDealt.player2 += entry.damageDealt;
      }
    }

    if (entry.creaturesKilled) {
      if (entry.actorStackId.includes('player1')) {
        totalCreaturesKilled.player1 += entry.creaturesKilled;
      } else if (entry.actorStackId.includes('player2')) {
        totalCreaturesKilled.player2 += entry.creaturesKilled;
      }
    }
  }

  return {
    winner,
    loser,
    totalRounds,
    survivingStacks: winner.stacks.filter(isAlive).map((stack) => ({
      unitType: stack.unitType,
      remainingCreatures: stack.creatureCount,
      remainingHp: stack.currentHp,
    })),
    totalDamageDealt,
    totalCreaturesKilled,
  };
};
