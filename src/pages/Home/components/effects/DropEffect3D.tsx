import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FontLoader, TextGeometry } from "three-stdlib";
import * as CANNON from "cannon-es";
import { COLORS, pick } from "../../utils/colorUtils";
import { Letter } from "../../types/letter";

const FONT_URL =
  "https://cdn.jsdelivr.net/npm/three@0.150.1/examples/fonts/helvetiker_regular.typeface.json";
const MENU_TEXT = "THREE.JS TUTORIAL";

const DropEffect3D = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<Letter[]>([]);
  const worldRef = useRef<CANNON.World>();
  const animationRef = useRef<number>();
  const groundRef = useRef<CANNON.Body>();

  useEffect(() => {
    if (!mountRef.current) return;
    const mountNode = mountRef.current;
    // Three.js 기본 세팅
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202533);
    const camera = new THREE.OrthographicCamera(-20, 20, 15, -15, -10, 100);
    camera.position.set(-10, 10, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(600, 400);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountNode.appendChild(renderer.domElement);

    // Light
    scene.add(new THREE.AmbientLight(0xcccccc));
    const foreLight = new THREE.DirectionalLight(0xffffff, 0.5);
    foreLight.position.set(5, 5, 20);
    scene.add(foreLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 1);
    backLight.position.set(-5, -5, -10);
    scene.add(backLight);

    // Cannon.js 월드
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -50, 0) });
    worldRef.current = world;

    // 바닥
    const ground = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(50, 0.5, 50)),
      position: new CANNON.Vec3(0, -10, 0),
    });
    world.addBody(ground);
    groundRef.current = ground;
    const groundMesh = new THREE.Mesh(
      new THREE.BoxGeometry(100, 1, 100),
      new THREE.MeshPhongMaterial({ color: 0x222222 }),
    );
    groundMesh.position.y = -10;
    scene.add(groundMesh);

    // 폰트 로딩 및 3D 텍스트 생성
    const fontLoader = new FontLoader();
    fontLoader.load(FONT_URL, (font) => {
      const options = {
        font,
        size: 3,
        height: 0.4,
        curveSegments: 24,
        bevelEnabled: true,
        bevelThickness: 0.9,
        bevelSize: 0.3,
        bevelOffset: 0,
        bevelSegments: 10,
      };
      const group = new THREE.Group();
      const colorSet = pick(COLORS);
      const letters: Letter[] = [];
      const offsetX = -((MENU_TEXT.length - 1) * 3 * 1.2) / 2;
      for (let i = 0; i < MENU_TEXT.length; i++) {
        const letter = MENU_TEXT[i];
        const progress = i / (MENU_TEXT.length - 1);
        const material = new THREE.MeshPhongMaterial({
          color: colorSet.from.clone().lerp(colorSet.to, progress),
        });
        const geometry = new TextGeometry(letter, options);
        geometry.computeBoundingBox();
        geometry.center();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(offsetX + i * 3 * 1.2, 5, 0);
        group.add(mesh);
        // Cannon body
        const box = geometry.boundingBox;
        if (!box) continue;
        const sx = (box.max.x - box.min.x) / 2;
        const sy = (box.max.y - box.min.y) / 2;
        const sz = (box.max.z - box.min.z) / 2;
        const shape = new CANNON.Box(new CANNON.Vec3(sx, sy, sz));
        const body = new CANNON.Body({
          mass: 1,
          position: new CANNON.Vec3(
            mesh.position.x,
            mesh.position.y,
            mesh.position.z,
          ),
          shape,
          angularDamping: 0.99,
        });
        world.addBody(body);
        letters.push({
          mesh,
          body,
          init: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
        });
      }
      scene.add(group);
      lettersRef.current = letters;

      // 애니메이션 루프
      const animate = () => {
        world.step(1 / 60);
        letters.forEach(({ mesh, body }) => {
          mesh.position.copy(body.position as unknown as THREE.Vector3);
          mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
        });
        renderer.render(scene, camera);
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
    });

    // 클린업
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      if (mountNode) {
        mountNode.removeChild(renderer.domElement);
      }
    };
  }, [mountRef]);

  return <div ref={mountRef} style={{ width: 600, height: 400 }} />;
};

export default DropEffect3D;
