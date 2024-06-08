import * as THREE from "three";
import * as CANNON from "cannon-es";

export type Letter = {
  mesh: THREE.Mesh;
  body: CANNON.Body;
  init: { x: number; y: number; z: number };
  wordIndex?: number;
  charIndex?: number;
};
