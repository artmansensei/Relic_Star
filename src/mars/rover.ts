/**
 * Mars Artifacts & Rover backward-compatibility layer.
 * Delegates 3D models to artifacts3d.ts.
 */

import * as THREE from 'three';
import { ALL_ARTIFACTS } from '../data/artifacts';
import { getTerrainHeight } from './terrain';
import { createSpiritRover3D, Artifact3DObject } from './artifacts3d';

export const ROVER_POSITION = new THREE.Vector3(
  ALL_ARTIFACTS.mer_a_spirit.worldPosition.x,
  getTerrainHeight(ALL_ARTIFACTS.mer_a_spirit.worldPosition.x, ALL_ARTIFACTS.mer_a_spirit.worldPosition.z),
  ALL_ARTIFACTS.mer_a_spirit.worldPosition.z
);

export type RoverObject = Artifact3DObject;

export function createMarsRover(): Artifact3DObject {
  return createSpiritRover3D();
}
