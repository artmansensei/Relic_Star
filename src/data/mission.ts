/**
 * Mission progression and deep space transmission data models.
 * Grounded in authentic NASA Deep Space Network (DSN) telemetry protocols.
 */

export interface ArtifactProgress {
  id: string;
  name: string;
  designation: string;
  agency: string;
  site: string;
  planetaryCoords: string;
  isDiscovered: boolean;
  isDocumented: boolean;
  isTransmitted: boolean;
  isArchived: boolean;
  discoveredAt?: string;
  documentedAt?: string;
  transmittedAt?: string;
  archivedAt?: string;
}

export interface MissionState {
  artifactsDiscovered: number;
  artifactsDocumented: number;
  artifactsTransmitted: number;
  artifactsArchived: number;
  totalArtifacts: number;
}

export type TransmissionStep =
  | 'idle'
  | 'link_request'
  | 'signal_acquired'
  | 'packetization'
  | 'transmitting'
  | 'deep_space_relay'
  | 'earth_receiving'
  | 'packet_verification'
  | 'archive_complete';

export interface TransmissionPacket {
  id: number;
  label: string;
  type: 'metadata' | 'field_telemetry' | 'geochemistry' | 'imagery' | 'spectra' | 'checksum';
  status: 'pending' | 'in_transit' | 'received' | 'verified' | 'dropped';
}

export interface TransmissionTelemetry {
  distanceKm: number;
  distanceAU: number;
  oneWayLightTimeSec: number;
  oneWayLightTimeStr: string;
  roundTripDelayStr: string;
  dsnGroundStation: string;
  frequencyBand: string;
  carrierLock: boolean;
}

/**
 * Calculates simulated Mars-to-Earth orbital distance and light propagation delays.
 * Mars-Earth distance varies between 55M km and 401M km (mean ~225M km).
 */
export function calculateDeepSpaceLinkTelemetry(): TransmissionTelemetry {
  // Realistic mean orbital transit distance (~1.436 AU)
  const distanceKm = 214840000;
  const distanceAU = 1.436;
  const SPEED_OF_LIGHT_KM_S = 299792.458; // Speed of light in vacuo

  const oneWaySeconds = distanceKm / SPEED_OF_LIGHT_KM_S;
  const roundTripSeconds = oneWaySeconds * 2;

  const formatDelay = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = (totalSeconds % 60).toFixed(1);
    return `${mins}m ${secs}s (${totalSeconds.toFixed(1)}s)`;
  };

  return {
    distanceKm,
    distanceAU,
    oneWayLightTimeSec: oneWaySeconds,
    oneWayLightTimeStr: formatDelay(oneWaySeconds),
    roundTripDelayStr: formatDelay(roundTripSeconds),
    dsnGroundStation: 'DSN Goldstone Complex (Deep Space Station 14 - 70m Antenna)',
    frequencyBand: 'X-Band (7.145–8.450 GHz)',
    carrierLock: true,
  };
}

/**
 * Pre-cataloged Mars exploration artifacts list.
 * Historical NASA Mars surface missions.
 */
export const CATALOGED_MARS_ARTIFACTS: ArtifactProgress[] = [
  {
    id: 'mer_a_spirit',
    name: 'Spirit Rover',
    designation: 'NASA MER-A',
    agency: 'NASA / JPL',
    site: 'Gusev Crater (Columbia Memorial Station)',
    planetaryCoords: '14.5684° S, 175.47263° E',
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  },
  {
    id: 'mer_b_opportunity',
    name: 'Opportunity Rover',
    designation: 'NASA MER-B',
    agency: 'NASA / JPL',
    site: 'Meridiani Planum (Eagle Crater / Perseverance Valley)',
    planetaryCoords: '1.9483° S, 354.4742° E',
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  },
  {
    id: 'phoenix_lander',
    name: 'Phoenix Lander',
    designation: 'NASA Scout',
    agency: 'NASA / JPL / Univ. Arizona',
    site: 'Northern Plains of Mars (Vastitas Borealis)',
    planetaryCoords: '68.2188° N, 234.2508° E',
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  },
  {
    id: 'insight_lander',
    name: 'InSight Lander',
    designation: 'NASA Discovery',
    agency: 'NASA / JPL / CNES / DLR',
    site: 'Elysium Planitia (Homestead Hollow)',
    planetaryCoords: '4.5024° N, 135.6234° E',
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  },
  {
    id: 'msl_curiosity',
    name: 'Curiosity Rover',
    designation: 'NASA MSL',
    agency: 'NASA / JPL',
    site: 'Gale Crater (Bradbury Landing / Mount Sharp)',
    planetaryCoords: '4.5895° S, 137.4417° E',
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  },
  {
    id: 'pathfinder_sojourner',
    name: 'Sojourner Rover',
    designation: 'NASA Mars Pathfinder',
    agency: 'NASA / JPL',
    site: 'Ares Vallis (Carl Sagan Memorial Station)',
    planetaryCoords: '19.33° N, 33.55° W',
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  },
  {
    id: 'ingenuity_helicopter',
    name: 'Ingenuity Mars Helicopter',
    designation: 'NASA Mars 2020 / Tech Demo',
    agency: 'NASA / JPL',
    site: 'Jezero Crater (Airfield Chi / Valinor Hills)',
    planetaryCoords: '18.4447° N, 77.4508° E',
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  },
  {
    id: 'viking_1_lander',
    name: 'Viking 1 Lander',
    designation: 'NASA Viking 1 (VL-1)',
    agency: 'NASA / Langley / JPL',
    site: 'Chryse Planitia (Thomas A. Mutch Memorial Station)',
    planetaryCoords: '22.27° N, 312.05° E',
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  },
  {
    id: 'viking_2_lander',
    name: 'Viking 2 Lander',
    designation: 'NASA Viking 2 (VL-2)',
    agency: 'NASA / Langley / JPL',
    site: 'Utopia Planitia',
    planetaryCoords: '47.64° N, 134.29° E',
    isDiscovered: false,
    isDocumented: false,
    isTransmitted: false,
    isArchived: false,
  },
];

const LOCAL_STORAGE_KEY = 'abnf_mars_campaign_v2';
const LEGACY_STORAGE_KEY = 'abnf_mars_mission_v1';

export interface ArtifactStatusRecord {
  isDiscovered: boolean;
  isDocumented: boolean;
  isTransmitted: boolean;
  isArchived: boolean;
  discoveredAt?: string;
  documentedAt?: string;
  transmittedAt?: string;
  archivedAt?: string;
  rewardAwarded?: boolean; // Exactly 1 energy charge awarded on first successful documentation
}

export type PersistentMissionData = Record<string, ArtifactStatusRecord>;

const DEFAULT_ARTIFACT_RECORD: ArtifactStatusRecord = {
  isDiscovered: false,
  isDocumented: false,
  isTransmitted: false,
  isArchived: false,
  rewardAwarded: false,
};

export function loadPersistentMission(): PersistentMissionData {
  const result: PersistentMissionData = {};
  CATALOGED_MARS_ARTIFACTS.forEach((art) => {
    result[art.id] = { ...DEFAULT_ARTIFACT_RECORD };
  });

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.keys(result).forEach((key) => {
        if (parsed[key]) {
          const item = parsed[key];
          result[key] = {
            ...DEFAULT_ARTIFACT_RECORD,
            ...item,
            // Backwards compatibility: if relic was already documented in an earlier save,
            // preserve reward as already claimed to prevent duplicate reward exploits on reload.
            rewardAwarded: item.rewardAwarded ?? Boolean(item.isDocumented),
          };
        }
      });
      return result;
    }

    // Check legacy key for migration
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      if (parsedLegacy.mer_a_spirit) {
        const item = parsedLegacy.mer_a_spirit;
        result.mer_a_spirit = {
          ...DEFAULT_ARTIFACT_RECORD,
          ...item,
          rewardAwarded: item.rewardAwarded ?? Boolean(item.isDocumented),
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load mission progress from localStorage:', err);
  }

  return result;
}

export function savePersistentMission(data: PersistentMissionData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save mission progress to localStorage:', err);
  }
}

/**
 * Checks if a valid saved expedition exists with any localized progress.
 */
export function hasSavedMission(): boolean {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
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
 * Retrieves summary metrics for the saved Mars expedition.
 */
export function getSavedMissionSummary(): {
  discovered: number;
  documented: number;
  transmitted: number;
  archived: number;
  total: number;
  lastActiveDate?: string;
} {
  const data = loadPersistentMission();
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
    total: CATALOGED_MARS_ARTIFACTS.length,
    lastActiveDate,
  };
}

/**
 * Safely resets persistent mission progress to default fresh state.
 */
export function resetPersistentMission(): PersistentMissionData {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to reset mission progress:', err);
  }
  return loadPersistentMission();
}

