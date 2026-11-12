/**
 * Lunar mission progression, save/load persistence, and Earth-Moon telecommunications link model.
 * Grounded in Apollo Unified S-Band (USB) and DSN lunar communication protocols.
 */

import { ArtifactProgress, ArtifactStatusRecord, MissionState, TransmissionTelemetry } from './mission';

export const LUNAR_LOCAL_STORAGE_KEY = 'relic_star_lunar_mission_v1';

export type PersistentLunarMissionData = Record<string, ArtifactStatusRecord>;

/**
 * Calculates simulated Earth-Moon communications link telemetry.
 * Mean orbital distance: 384,400 km (~0.00257 AU).
 * Speed of light in vacuo: 299,792.458 km/s.
 * One-way light time: ~1.282 seconds.
 * Round-trip delay: ~2.565 seconds.
 */
export function calculateLunarLinkTelemetry(): TransmissionTelemetry {
  const distanceKm = 384400;
  const distanceAU = 0.00257;
  const SPEED_OF_LIGHT_KM_S = 299792.458;

  const oneWaySeconds = distanceKm / SPEED_OF_LIGHT_KM_S;
  const roundTripSeconds = oneWaySeconds * 2;

  const formatDelay = (totalSeconds: number): string => {
    return `${totalSeconds.toFixed(2)}s (${totalSeconds.toFixed(3)}s OWT)`;
  };

  return {
    distanceKm,
    distanceAU,
    oneWayLightTimeSec: oneWaySeconds,
    oneWayLightTimeStr: formatDelay(oneWaySeconds),
    roundTripDelayStr: formatDelay(roundTripSeconds),
    dsnGroundStation: 'Apollo Manned Space Flight Network (MSFN) / Goldstone DSS 14 & Honeysuckle Creek',
    frequencyBand: 'Unified S-Band (USB, 2.2875 GHz Downlink / 2.1064 GHz Uplink)',
    carrierLock: true,
  };
}

/**
 * Pre-cataloged Lunar exploration artifacts list (7 historically verified NASA Moon missions).
 */
export const CATALOGED_LUNAR_ARTIFACTS: ArtifactProgress[] = [
  {
    id: 'apollo11_eagle',
    name: 'Apollo 11 LM Descent Stage (Eagle)',
    designation: 'NASA Apollo 11 (LM-5)',
    agency: 'NASA / JSC',
    site: 'Mare Tranquillitatis (Tranquility Base)',
    planetaryCoords: '0.6741° N, 23.4730° E',
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  },
  {
    id: 'surveyor3_lander',
    name: 'Surveyor 3 Soft Lander',
    designation: 'NASA Surveyor 3',
    agency: 'NASA / JPL',
    site: 'Oceanus Procellarum (Surveyor Crater)',
    planetaryCoords: '3.0160° S, 23.4180° W',
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  },
  {
    id: 'apollo15_lrv',
    name: 'Apollo 15 Lunar Roving Vehicle (LRV-1)',
    designation: 'NASA Apollo 15',
    agency: 'NASA / MSFC / Boeing',
    site: 'Hadley-Apennine (Hadley Rille)',
    planetaryCoords: '26.1322° N, 3.6339° E',
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  },
  {
    id: 'apollo17_challenger',
    name: 'Apollo 17 LM Descent Stage (Challenger) & LRV-3',
    designation: 'NASA Apollo 17 (LM-12)',
    agency: 'NASA / JSC',
    site: 'Taurus-Littrow Valley',
    planetaryCoords: '20.1908° N, 30.7717° E',
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  },
  {
    id: 'surveyor1_lander',
    name: 'Surveyor 1 Soft Lander',
    designation: 'NASA Surveyor 1',
    agency: 'NASA / JPL',
    site: 'Oceanus Procellarum (Flamsteed Ring)',
    planetaryCoords: '2.4740° S, 43.3390° W',
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  },
  {
    id: 'apollo14_met',
    name: 'Apollo 14 Modular Equipment Transporter & ALSEP',
    designation: 'NASA Apollo 14 (MET / ALSEP)',
    agency: 'NASA / JSC',
    site: 'Fra Mauro Highlands',
    planetaryCoords: '3.6453° S, 17.4714° W',
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  },
  {
    id: 'lunar_laser_reflector',
    name: 'Laser Ranging Retroreflector Array (LRRR)',
    designation: 'NASA Apollo LRRR (11/14/15)',
    agency: 'NASA / Univ of Maryland',
    site: 'Mare Tranquillitatis / Fra Mauro',
    planetaryCoords: '0.6734° N, 23.4731° E',
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  },
];

const DEFAULT_LUNAR_ARTIFACT_RECORD: ArtifactStatusRecord = {
  isDiscovered: false,
  isDocumented: false,
  isTransmitted: false,
  isArchived: false,
  rewardAwarded: false,
};

/**
 * Initializes a fresh default state for all 7 cataloged lunar artifacts.
 */
export function createDefaultLunarMissionData(): PersistentLunarMissionData {
  const result: PersistentLunarMissionData = {};
  CATALOGED_LUNAR_ARTIFACTS.forEach((art) => {
    result[art.id] = { ...DEFAULT_LUNAR_ARTIFACT_RECORD };
  });
  return result;
}

/**
 * Loads saved lunar mission progress from localStorage with safe fallback.
 */
export function loadPersistentLunarMission(): PersistentLunarMissionData {
  const result = createDefaultLunarMissionData();

  try {
    const raw = localStorage.getItem(LUNAR_LOCAL_STORAGE_KEY);
    if (!raw) return result;

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      Object.keys(result).forEach((key) => {
        if (parsed[key]) {
          const item = parsed[key];
          result[key] = {
            ...DEFAULT_LUNAR_ARTIFACT_RECORD,
            ...item,
            rewardAwarded: item.rewardAwarded ?? Boolean(item.isDocumented),
          };
        }
      });
    }
  } catch (err) {
    console.warn('Failed to load lunar mission progress from localStorage:', err);
  }

  return result;
}

/**
 * Persists lunar mission progress data to localStorage.
 */
export function savePersistentLunarMission(data: PersistentLunarMissionData): void {
  try {
    localStorage.setItem(LUNAR_LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save lunar mission progress to localStorage:', err);
  }
}

/**
 * Checks if a valid saved lunar expedition exists with any progress.
 */
export function hasSavedLunarMission(): boolean {
  try {
    const raw = localStorage.getItem(LUNAR_LOCAL_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Object.values(parsed).some(
      (item: any) => item?.isDiscovered || item?.isDocumented || item?.isTransmitted || item?.isArchived
    );
  } catch {
    return false;
  }
}

/**
 * Retrieves summary metrics for the saved Lunar expedition.
 */
export function getSavedLunarMissionSummary(): {
  discovered: number;
  documented: number;
  transmitted: number;
  archived: number;
  total: number;
  lastActiveDate?: string;
} {
  const data = loadPersistentLunarMission();
  let discovered = 0;
  let documented = 0;
  let transmitted = 0;
  let archived = 0;
  let lastActiveDate: string | undefined;

  Object.values(data).forEach((item) => {
    if (item.isDiscovered) discovered++;
    if (item.isDocumented) documented++;
    if (item.isTransmitted) transmitted++;
    if (item.isArchived) archived++;

    if (item.archivedAt && !lastActiveDate) lastActiveDate = item.archivedAt;
    else if (item.transmittedAt && !lastActiveDate) lastActiveDate = item.transmittedAt;
    else if (item.documentedAt && !lastActiveDate) lastActiveDate = item.documentedAt;
    else if (item.discoveredAt && !lastActiveDate) lastActiveDate = item.discoveredAt;
  });

  return {
    discovered,
    documented,
    transmitted,
    archived,
    total: 7,
    lastActiveDate,
  };
}

/**
 * Resets persistent lunar mission progress to default fresh state.
 */
export function resetPersistentLunarMission(): PersistentLunarMissionData {
  try {
    localStorage.removeItem(LUNAR_LOCAL_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to reset lunar mission progress:', err);
  }
  return loadPersistentLunarMission();
}
