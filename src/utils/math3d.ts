import * as THREE from 'three';
import { GeometryVertex } from '../types/geometry';

/**
 * Converts High School Math Coordinates (x, y, z where Oxy is ground and Oz is vertical height)
 * into Three.js 3D coordinates (X: right, Y: up, Z: front/back)
 */
export function mathToThreeCoord(coord: [number, number, number]): THREE.Vector3 {
  const [x, y, z] = coord;
  return new THREE.Vector3(x, z, -y);
}

/**
 * Converts Three.js coordinates back to Math coordinates
 */
export function threeToMathCoord(v: THREE.Vector3): [number, number, number] {
  return [
    parseFloat(v.x.toFixed(2)),
    parseFloat((-v.z).toFixed(2)),
    parseFloat(v.y.toFixed(2))
  ];
}

/**
 * Computes 3D points for a right-angle marker at vertex V between arm1 and arm2
 */
export function computeRightAngleLines(
  vCoord: THREE.Vector3,
  arm1Coord: THREE.Vector3,
  arm2Coord: THREE.Vector3,
  size: number = 0.32
): { lines: THREE.Vector3[]; faceVertices?: THREE.Vector3[] } {
  const dir1 = new THREE.Vector3().subVectors(arm1Coord, vCoord).normalize();
  const dir2 = new THREE.Vector3().subVectors(arm2Coord, vCoord).normalize();

  const p1 = new THREE.Vector3().copy(vCoord).addScaledVector(dir1, size);
  const p2 = new THREE.Vector3().copy(vCoord).addScaledVector(dir1, size).addScaledVector(dir2, size);
  const p3 = new THREE.Vector3().copy(vCoord).addScaledVector(dir2, size);

  return {
    lines: [p1, p2, p3],
    faceVertices: [vCoord, p1, p2, p3]
  };
}

/**
 * Calculates Euclidean distance between two 3D points
 */
export function calculateDistance(p1: [number, number, number], p2: [number, number, number]): number {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  const dz = p1[2] - p2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Tries to approximate a decimal value as an algebraic multiple of common math constants
 * like a, a√2, a√3, a√5, a/2, etc. for Vietnamese high school math context
 */
export function formatAlgebraicApproximation(val: number, unit = 'a'): string {
  if (Math.abs(val) < 0.001) return '0';
  const valSq = Math.round(val * val * 100) / 100;

  // Check integer square roots
  const intSq = Math.round(val * val);
  if (Math.abs(val * val - intSq) < 0.05) {
    if (intSq === 1) return `1${unit}`;
    if (intSq === 2) return `${unit}√2`;
    if (intSq === 3) return `${unit}√3`;
    if (intSq === 4) return `2${unit}`;
    if (intSq === 5) return `${unit}√5`;
    if (intSq === 6) return `${unit}√6`;
    if (intSq === 8) return `2${unit}√2`;
    if (intSq === 9) return `3${unit}`;
    if (intSq === 11) return `${unit}√11`;
    if (intSq === 13) return `${unit}√13`;
    if (intSq === 14) return `${unit}√14`;
  }

  // Check half square roots like √2/2, √3/2, 1/2
  if (Math.abs(val - 0.5) < 0.05) return `${unit}/2`;
  if (Math.abs(val - Math.sqrt(2) / 2) < 0.05) return `${unit}√2/2`;
  if (Math.abs(val - Math.sqrt(3) / 2) < 0.05) return `${unit}√3/2`;

  return `${val.toFixed(2)}${unit}`;
}

/**
 * Calculates normal vector of a plane defined by 3 vertices (in math coordinates)
 */
export function calculatePlaneNormal(
  p1: [number, number, number],
  p2: [number, number, number],
  p3: [number, number, number]
): [number, number, number] {
  const v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
  const v2 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];

  // Cross product v1 x v2
  const nx = v1[1] * v2[2] - v1[2] * v2[1];
  const ny = v1[2] * v2[0] - v1[0] * v2[2];
  const nz = v1[0] * v2[1] - v1[1] * v2[0];

  const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (length < 0.0001) return [0, 0, 1];

  return [nx / length, ny / length, nz / length];
}

/**
 * Calculates the dihedral angle between two planes (P) and (Q) in degrees [0°, 90°]
 * According to Vietnamese High School Math (GDPT 2018):
 * cos(alpha) = |n1 . n2| / (|n1| * |n2|)
 */
export function calculateDihedralAngle(
  normal1: [number, number, number],
  normal2: [number, number, number]
): {
  degrees: number;
  radians: number;
  cosVal: number;
  normal1: [number, number, number];
  normal2: [number, number, number];
} {
  const dot = normal1[0] * normal2[0] + normal1[1] * normal2[1] + normal1[2] * normal2[2];
  const absCos = Math.min(1.0, Math.max(0.0, Math.abs(dot)));
  const rad = Math.acos(absCos);
  const deg = (rad * 180) / Math.PI;

  return {
    degrees: parseFloat(deg.toFixed(2)),
    radians: parseFloat(rad.toFixed(4)),
    cosVal: parseFloat(absCos.toFixed(4)),
    normal1,
    normal2
  };
}

/**
 * Detect software WebGL renderer for performance optimizations
 */
export function checkIsSoftwareGl(): boolean {
  if (typeof document === 'undefined') return false;
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
}
