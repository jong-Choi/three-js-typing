import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FontLoader, TextGeometry } from "three-stdlib";
import { COLORS, pick } from "../../utils/colorUtils";

const FONT_URL =
  "https://cdn.jsdelivr.net/npm/three@0.150.1/examples/fonts/helvetiker_regular.typeface.json";
const MENU_TEXT = "THREE.JS TUTORIAL";

const DropEffect3D = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

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
      }
      scene.add(group);

      // 애니메이션 루프 (그룹 전체 회전)
      const animate = () => {
        group.rotation.y += 0.01;
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
  }, []);

  return <div ref={mountRef} style={{ width: 600, height: 400 }} />;
};

export default DropEffect3D;
