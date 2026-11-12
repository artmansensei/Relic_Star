/**
 * Official EVA Suit Survival System Configuration
 * Relic Star — Abandoned But Not Forgotten
 *
 * Configurable parameters for suit energy consumption, speed penalties,
 * zero-energy emergency grace period, and oxygen life-support.
 */

export interface SpeedStageDefinition {
  minEnergy: number; // Inclusive lower bound percentage [0-100]
  maxEnergy: number; // Inclusive upper bound percentage [0-100]
  multiplier: number; // Velocity multiplier applied to movement
  label: string;
  badgeColor: string;
}

export type EnergyDrainRate = 'relaxed' | 'standard' | 'challenging';

export interface EnergyDrainPreset {
  multiplier: number;
  label: string;
  description: string;
}

export const ENERGY_DRAIN_PRESETS: Record<EnergyDrainRate, EnergyDrainPreset> = {
  relaxed: {
    multiplier: 0.65,
    label: 'RELAXED (0.65x)',
    description: 'Extended battery life for relaxed surface exploration',
  },
  standard: {
    multiplier: 1.0,
    label: 'STANDARD (1.0x)',
    description: 'Authentic NASA EVA life-support & telemetry battery draw',
  },
  challenging: {
    multiplier: 1.35,
    label: 'CHALLENGING (1.35x)',
    description: 'Aggressive energy draw demanding strict tactical power conservation',
  },
};

export const SURVIVAL_CONFIG = {
  // 1. Energy Charge Inventory
  STARTING_ENERGY_CHARGES: 3,
  MAX_ENERGY_CHARGES: 6,
  DOCUMENTATION_REWARD_CHARGES: 1, // Exactly 1 charge awarded per eligible relic documentation

  // 2. Authoritative Energy Drain Rates (% per second, delta-time scaled)
  ENERGY_DRAIN_PASSIVE: 0.04, // Baseline spacesuit life-support & HUD telemetry draw (gentle passive draw)
  ENERGY_DRAIN_WALK: 0.20, // Surface EVA locomotion (~8.3 minutes of continuous walking per 100% battery)
  ENERGY_DRAIN_SPRINT: 1.2, // Thruster-assisted sprint booster consumption
  ENERGY_DRAIN_SCANNER: 0.5, // Active RF/LIDAR subsurface radar ping
  ENERGY_DRAIN_JUMP: 1.6, // Low-gravity spacesuit reaction leap (flat cost per jump)

  // Rapid inductive recharge at Expedition Base Clearing (0, 0, radius 16m)
  BASE_ENERGY_RECHARGE_RATE: 25.0, // % per second

  // 3. Speed Stages (Progressive degradation as battery depletes)
  // Stage 1: 60-100% -> Normal Speed (1.0x)
  // Stage 2: 30-59%  -> Moderately Reduced Speed (0.75x)
  // Stage 3: 1-29%   -> Critically Reduced Speed (0.50x)
  // Stage 4: 0%      -> Emergency State Crawl (0.25x)
  SPEED_STAGES: {
    OPTIMAL: {
      minEnergy: 60,
      maxEnergy: 100,
      multiplier: 1.0,
      label: 'NOMINAL (100%)',
      badgeColor: 'text-[#38bdf8]',
    },
    MODERATE: {
      minEnergy: 30,
      maxEnergy: 59.99,
      multiplier: 0.75,
      label: 'REDUCED (75%)',
      badgeColor: 'text-amber-400',
    },
    CRITICAL: {
      minEnergy: 0.01,
      maxEnergy: 29.99,
      multiplier: 0.5,
      label: 'DEGRADED (50%)',
      badgeColor: 'text-orange-400',
    },
    EMERGENCY: {
      minEnergy: 0,
      maxEnergy: 0,
      multiplier: 0.25,
      label: 'EMERGENCY CRAWL (25%)',
      badgeColor: 'text-red-400',
    },
  },

  // 4. Zero-Energy Emergency Grace Period (seconds)
  // Astronaut enters emergency shutdown grace period when energy hits 0%.
  // If no energy charge is used and base is not reached before expiry, life-support shuts down.
  EMERGENCY_GRACE_PERIOD_SEC: 25.0,

  // 5. Oxygen System Constants (Independent from energy)
  OXYGEN_DRAIN_WALK: 0.04, // ~41 minutes of continuous EVA walking
  OXYGEN_DRAIN_SPRINT: 0.078, // ~21 minutes of continuous sprint
  BASE_OXYGEN_RECHARGE_RATE: 15.0, // % per second at base
  OXYGEN_DEPLETION_HEALTH_DRAIN: 2.5, // Health damage per second at 0% O2
} as const;

/**
 * Calculates the speed multiplier and stage label from current energy level
 */
export function getEnergySpeedStage(energy: number): {
  multiplier: number;
  label: string;
  stageKey: 'OPTIMAL' | 'MODERATE' | 'CRITICAL' | 'EMERGENCY';
} {
  if (energy >= SURVIVAL_CONFIG.SPEED_STAGES.OPTIMAL.minEnergy) {
    return {
      multiplier: SURVIVAL_CONFIG.SPEED_STAGES.OPTIMAL.multiplier,
      label: SURVIVAL_CONFIG.SPEED_STAGES.OPTIMAL.label,
      stageKey: 'OPTIMAL',
    };
  }
  if (energy >= SURVIVAL_CONFIG.SPEED_STAGES.MODERATE.minEnergy) {
    return {
      multiplier: SURVIVAL_CONFIG.SPEED_STAGES.MODERATE.multiplier,
      label: SURVIVAL_CONFIG.SPEED_STAGES.MODERATE.label,
      stageKey: 'MODERATE',
    };
  }
  if (energy > 0) {
    return {
      multiplier: SURVIVAL_CONFIG.SPEED_STAGES.CRITICAL.multiplier,
      label: SURVIVAL_CONFIG.SPEED_STAGES.CRITICAL.label,
      stageKey: 'CRITICAL',
    };
  }
  return {
    multiplier: SURVIVAL_CONFIG.SPEED_STAGES.EMERGENCY.multiplier,
    label: SURVIVAL_CONFIG.SPEED_STAGES.EMERGENCY.label,
    stageKey: 'EMERGENCY',
  };
}

export type RechargeState =
  | 'IDLE'
  | 'CONFIRMATION'
  | 'RECHARGE_READY'
  | 'CHARGING'
  | 'COMPLETE';

export const RECHARGE_INTERACTION_CONFIG = {
  ANIMATION_DURATION_SEC: 1.2,
  COMPLETION_DISPLAY_SEC: 1.4,
} as const;
