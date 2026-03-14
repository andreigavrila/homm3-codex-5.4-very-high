import type { UnitType } from '../types';

export const getUnitGlyph = (unitType: UnitType): string => {
  const icon = unitType.icon.trim();

  if (/^[A-Za-z0-9]$/.test(icon)) {
    return icon.toUpperCase();
  }

  return unitType.name.charAt(0).toUpperCase();
};
