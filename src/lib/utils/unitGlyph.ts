import type { UnitType } from '../types';

const IMAGE_ICON_PATTERN = /^(data:image\/|https?:\/\/|blob:|\/|.*\.(png|jpg|jpeg|webp|svg)(\?.*)?$)/i;

export const isUnitImageIcon = (icon: string): boolean => IMAGE_ICON_PATTERN.test(icon.trim());

export const getUnitGlyph = (unitType: UnitType): string => {
  const icon = unitType.icon.trim();

  if (/^[A-Za-z0-9]$/.test(icon)) {
    return icon.toUpperCase();
  }

  return unitType.name.charAt(0).toUpperCase();
};
