/**
 * Cross-Planet Unified Save and Campaign State Manager.
 * Preserves independent save stores for Mars and Moon while reliably
 * tracking and resuming the player's last active planetary expedition.
 */

import {
  hasSavedMission,
  loadPersistentMission,
  savePersistentMission,
  resetPersistentMission,
  getSavedMissionSummary,
  PersistentMissionData,
} from './mission';
import {
  hasSavedLunarMission,
  loadPersistentLunarMission,
  savePersistentLunarMission,
  resetPersistentLunarMission,
  getSavedLunarMissionSummary,
  PersistentLunarMissionData,
} from './lunarMission';

export const LAST_PLAYED_PLANET_KEY = 'relic_star_last_played_planet';
export const MARS_PLAYER_STATE_KEY = 'relic_star_mars_player_state';
export const LUNAR_PLAYER_STATE_KEY = 'relic_star_lunar_player_state';

export interface SavedPlayerSessionState {
  position: { x: number; y: number; z: number };
  yaw: number;
  pitch: number;
  oxygen: number;
  energy: number;
  life: number;
  energyCharges: number;
  elapsedTimeSec: number;
  savedAt: number;
}

/**
 * Retrieves the most recently played planet from persistent storage.
 */
export function getLastPlayedPlanet(): 'mars' | 'moon' | null {
  try {
    const value = localStorage.getItem(LAST_PLAYED_PLANET_KEY);
    if (value === 'mars' || value === 'moon') {
      return value;
    }
  } catch (err) {
    console.warn('Failed to read lastPlayedPlanet from localStorage:', err);
  }
  return null;
}

/**
 * Persistently updates the last played planet.
 */
export function setLastPlayedPlanet(planet: 'mars' | 'moon'): void {
  try {
    localStorage.setItem(LAST_PLAYED_PLANET_KEY, planet);
  } catch (err) {
    console.warn('Failed to save lastPlayedPlanet to localStorage:', err);
  }
}

/**
 * Determines which planet should be resumed when the player clicks RESUME.
 * Strictly adheres to:
 * 1. If the last played planet has a valid save, resume it.
 * 2. If its save is missing or invalid, fall back to the other planet only if a valid save exists.
 * 3. If neither planet has a valid save, return null.
 */
export function getResolvableResumePlanet(): 'mars' | 'moon' | null {
  const last = getLastPlayedPlanet();
  const marsValid = hasSavedMission();
  const moonValid = hasSavedLunarMission();

  if (last === 'moon' && moonValid) {
    return 'moon';
  }
  if (last === 'mars' && marsValid) {
    return 'mars';
  }

  // Graceful fallback to whichever planet has valid saved data
  if (moonValid && !marsValid) {
    return 'moon';
  }
  if (marsValid && !moonValid) {
    return 'mars';
  }

  // If last was moon but moon has no save and mars does
  if (last === 'moon' && !moonValid && marsValid) {
    return 'mars';
  }
  // If last was mars but mars has no save and moon does
  if (last === 'mars' && !marsValid && moonValid) {
    return 'moon';
  }

  if (moonValid) return 'moon';
  if (marsValid) return 'mars';

  return null;
}

/**
 * Persists active player physical position and survival telemetry for a specific planet.
 */
export function savePlayerSessionState(
  planet: 'mars' | 'moon',
  state: SavedPlayerSessionState
): void {
  try {
    const key = planet === 'moon' ? LUNAR_PLAYER_STATE_KEY : MARS_PLAYER_STATE_KEY;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (err) {
    console.warn(`Failed to save ${planet} player session state:`, err);
  }
}

/**
 * Loads saved player position and survival telemetry for a specific planet.
 */
export function loadPlayerSessionState(
  planet: 'mars' | 'moon'
): SavedPlayerSessionState | null {
  try {
    const key = planet === 'moon' ? LUNAR_PLAYER_STATE_KEY : MARS_PLAYER_STATE_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.position && typeof parsed.position.x === 'number') {
      return parsed as SavedPlayerSessionState;
    }
  } catch (err) {
    console.warn(`Failed to load ${planet} player session state:`, err);
  }
  return null;
}

/**
 * Clears player session state for a specific planet (e.g. on New Game or death reset).
 */
export function clearPlayerSessionState(planet: 'mars' | 'moon'): void {
  try {
    const key = planet === 'moon' ? LUNAR_PLAYER_STATE_KEY : MARS_PLAYER_STATE_KEY;
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`Failed to clear ${planet} player session state:`, err);
  }
}

export {
  hasSavedMission,
  loadPersistentMission,
  savePersistentMission,
  resetPersistentMission,
  getSavedMissionSummary,
  hasSavedLunarMission,
  loadPersistentLunarMission,
  savePersistentLunarMission,
  resetPersistentLunarMission,
  getSavedLunarMissionSummary,
};
