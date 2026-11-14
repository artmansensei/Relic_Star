/**
 * Relic Star - Game Settings and User Preferences Model
 */

import { EnergyDrainRate } from './survivalConfig';

export interface GameSettings {
  masterVolume: number; // 0 - 100
  isMuted: boolean;
  mouseSensitivity: number; // 0.5 - 2.5 (1.0 default)
  graphicsQuality: 'low' | 'medium' | 'high';
  energyDrainRate: EnergyDrainRate; // 'relaxed' | 'standard' | 'challenging'
}

const SETTINGS_STORAGE_KEY = 'relic_star_settings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 85,
  isMuted: false,
  mouseSensitivity: 1.0,
  graphicsQuality: 'high',
  energyDrainRate: 'standard',
};

export function loadGameSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        masterVolume: typeof parsed.masterVolume === 'number' ? Math.max(0, Math.min(100, parsed.masterVolume)) : DEFAULT_SETTINGS.masterVolume,
        mouseSensitivity: typeof parsed.mouseSensitivity === 'number' ? Math.max(0.5, Math.min(2.5, parsed.mouseSensitivity)) : DEFAULT_SETTINGS.mouseSensitivity,
        graphicsQuality: ['low', 'medium', 'high'].includes(parsed.graphicsQuality) ? parsed.graphicsQuality : DEFAULT_SETTINGS.graphicsQuality,
        isMuted: typeof parsed.isMuted === 'boolean' ? parsed.isMuted : DEFAULT_SETTINGS.isMuted,
        energyDrainRate: ['relaxed', 'standard', 'challenging'].includes(parsed.energyDrainRate) ? parsed.energyDrainRate : DEFAULT_SETTINGS.energyDrainRate,
      };
    }
  } catch (err) {
    console.warn('Failed to load settings from storage:', err);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveGameSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save settings to storage:', err);
  }
}
