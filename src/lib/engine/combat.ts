import { effectiveDefense, isAlive, type DamageResult, type Stack } from '../types';
import { hexDistance } from '../utils/hexUtils';

export interface MeleeAttackResult {
  attack: DamageResult;
  retaliation: DamageResult;
  attackDamage: number;
  attackKills: number;
  retaliationDamage: number;
  retaliationKills: number;
}

export interface RangedAttackResult extends DamageResult {
  retaliationDamage: number;
  retaliationKills: number;
  usedMelee: boolean;
}

const rollBaseDamage = (stack: Stack): number => {
  const { minDamage, maxDamage } = stack.unitType;
  const spread = maxDamage - minDamage + 1;
  return Math.floor(Math.random() * spread) + minDamage;
};

export const calculateDamage = (attacker: Stack, defender: Stack): DamageResult => {
  const baseDamagePerCreature = rollBaseDamage(attacker);
  const totalBaseDamage = baseDamagePerCreature * Math.max(attacker.creatureCount, 0);
  const attack = attacker.unitType.attack;
  const defense = effectiveDefense(defender);

  let modifier = 1;
  if (attack > defense) {
    modifier = Math.min(1 + (attack - defense) * 0.05, 4.0);
  } else if (defense > attack) {
    modifier = Math.max(1 - (defense - attack) * 0.025, 0.3);
  }

  const damage = Math.max(Math.floor(totalBaseDamage * modifier), 1);
  let remainingDamage = damage;
  let creaturesKilled = 0;
  let currentHp = defender.currentHp;

  while (remainingDamage > 0 && creaturesKilled < defender.creatureCount) {
    if (remainingDamage >= currentHp) {
      remainingDamage -= currentHp;
      creaturesKilled += 1;
      currentHp = defender.unitType.hp;
      continue;
    }
    break;
  }

  return {
    damage,
    creaturesKilled,
  };
};

export const applyDamage = (stack: Stack, damage: number): DamageResult => {
  let remainingDamage = damage;
  let creaturesKilled = 0;

  while (remainingDamage > 0 && stack.creatureCount > 0) {
    if (remainingDamage >= stack.currentHp) {
      remainingDamage -= stack.currentHp;
      stack.creatureCount -= 1;
      creaturesKilled += 1;

      if (stack.creatureCount <= 0) {
        stack.creatureCount = 0;
        stack.currentHp = 0;
        break;
      }

      stack.currentHp = stack.unitType.hp;
      continue;
    }

    stack.currentHp -= remainingDamage;
    remainingDamage = 0;
  }

  return {
    damage,
    creaturesKilled,
  };
};

export const meleeAttack = (attacker: Stack, defender: Stack): MeleeAttackResult => {
  const attack = calculateDamage(attacker, defender);
  const appliedAttack = applyDamage(defender, attack.damage);
  let retaliation: DamageResult = { damage: 0, creaturesKilled: 0 };

  if (isAlive(defender) && !defender.hasRetaliated) {
    retaliation = calculateDamage(defender, attacker);
    retaliation = applyDamage(attacker, retaliation.damage);
    defender.hasRetaliated = true;
  }

  attacker.hasActed = true;

  return {
    attack: appliedAttack,
    retaliation,
    attackDamage: appliedAttack.damage,
    attackKills: appliedAttack.creaturesKilled,
    retaliationDamage: retaliation.damage,
    retaliationKills: retaliation.creaturesKilled,
  };
};

export const rangedAttack = (attacker: Stack, defender: Stack): RangedAttackResult => {
  if (hexDistance(attacker.position, defender.position) === 1) {
    const meleeResult = meleeAttack(attacker, defender);
    return {
      damage: meleeResult.attackDamage,
      creaturesKilled: meleeResult.attackKills,
      retaliationDamage: meleeResult.retaliationDamage,
      retaliationKills: meleeResult.retaliationKills,
      usedMelee: true,
    };
  }

  if (!attacker.unitType.isRanged || (attacker.remainingShots ?? 0) <= 0) {
    return {
      damage: 0,
      creaturesKilled: 0,
      retaliationDamage: 0,
      retaliationKills: 0,
      usedMelee: false,
    };
  }

  attacker.remainingShots = Math.max((attacker.remainingShots ?? 0) - 1, 0);
  const damage = calculateDamage(attacker, defender);
  const appliedDamage = applyDamage(defender, damage.damage);
  attacker.hasActed = true;

  return {
    ...appliedDamage,
    retaliationDamage: 0,
    retaliationKills: 0,
    usedMelee: false,
  };
};
