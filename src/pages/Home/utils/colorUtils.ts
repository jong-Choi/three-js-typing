import * as THREE from "three";

export const COLORS = [
  { from: new THREE.Color("#4fc3f7"), to: new THREE.Color("#1976d2") },
  { from: new THREE.Color("#f06292"), to: new THREE.Color("#c2185b") },
  { from: new THREE.Color("#ffd54f"), to: new THREE.Color("#f57c00") },
  { from: new THREE.Color("#81c784"), to: new THREE.Color("#388e3c") },
];

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
