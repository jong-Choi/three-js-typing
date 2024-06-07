import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FontLoader, TextGeometry, OrbitControls } from "three-stdlib";
import * as CANNON from "cannon-es";
import { COLORS, pick } from "../../utils/colorUtils";
import { Letter } from "../../types/letter";

const FONT_URL =
  "https://cdn.jsdelivr.net/npm/three@0.150.1/examples/fonts/helvetiker_regular.typeface.json";

const DropEffect3D = ({ text = "TYPING" }: { text?: string }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const raycaster = useRef<THREE.Raycaster>();
  const lettersRef = useRef<Letter[]>([]);
  const worldRef = useRef<CANNON.World>();
  const animationRef = useRef<number>();
  const groundRef = useRef<CANNON.Body>();
  const controlsRef = useRef<OrbitControls>();
  const dragState = useRef({ isDragging: false, start: { x: 0, y: 0 } });
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!mountRef.current) return;
    const mountNode = mountRef.current;
    // Three.js 기본 세팅
    const scene = new THREE.Scene();
    // 배경색
    scene.background = new THREE.Color(0x353942);
    // Light
    scene.add(new THREE.AmbientLight(0xcccccc, 1.4));
    const foreLight = new THREE.DirectionalLight(0xffffff, 0.8);
    foreLight.position.set(5, 5, 20);
    scene.add(foreLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 1.2);
    backLight.position.set(-5, -5, -10);
    scene.add(backLight);

    const camera = new THREE.OrthographicCamera(-40, 40, 30, -30, -10, 100);
    camera.position.set(-15, 15, 40);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(1200, 800);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountNode.appendChild(renderer.domElement);

    // 드래그 카메라 컨트롤
    controlsRef.current = new OrbitControls(camera, renderer.domElement);
    controlsRef.current.enableDamping = true;
    controlsRef.current.enableZoom = false;
    controlsRef.current.enablePan = false;
    controlsRef.current.enabled = true;
    const controls = controlsRef.current;

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
      new THREE.MeshPhongMaterial({ color: 0x353942 }),
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
      const offsetX = -((text.length - 1) * 3 * 1.2) / 2;
      for (let i = 0; i < text.length; i++) {
        const letter = text[i];
        const progress = i / (text.length - 1);
        const material = new THREE.MeshPhongMaterial({
          color: colorSet.from.clone().lerp(colorSet.to, progress),
          shininess: 80,
          specular: 0xffffff,
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

    // 마우스 인터랙션
    raycaster.current = new THREE.Raycaster();

    const getMouseVec = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      return new THREE.Vector2(x, y);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!raycaster.current) return;
      const mouseVec = getMouseVec(e);
      raycaster.current.setFromCamera(mouseVec, camera);
      const intersects = raycaster.current.intersectObjects(
        lettersRef.current.map((l) => l.mesh),
      );
      if (intersects.length > 0) {
        renderer.domElement.style.cursor = "pointer";
      } else {
        renderer.domElement.style.cursor = isDraggingRef.current
          ? "grabbing"
          : "grab";
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      if (!raycaster.current) return;

      dragState.current.isDragging = false;
      dragState.current.start = { x: e.clientX, y: e.clientY };
      // 글자 hit test
      const mouseVec = getMouseVec(e);
      raycaster.current.setFromCamera(mouseVec, camera);
      const intersects = raycaster.current.intersectObjects(
        lettersRef.current.map((l) => l.mesh),
      );
      if (intersects.length > 0) {
        controls.enabled = false;
        const obj = intersects[0].object;
        const letter = lettersRef.current.find((l) => l.mesh === obj);
        if (letter) {
          const impulse = new CANNON.Vec3(0, 0, -25);
          letter.body.applyImpulse(impulse, new CANNON.Vec3());
        }
        // OrbitControls의 pointerdown 이벤트를 막음
        e.preventDefault();
        e.stopPropagation();
        setTimeout(() => {
          controls.enabled = true;
        }, 0); // 다음 프레임에 다시 활성화
      } else {
        // 글자 아닌 곳: OrbitControls가 정상 동작
        isDraggingRef.current = true;
        renderer.domElement.style.cursor = "grabbing";
      }
    };
    const onMouseUp = (e: MouseEvent) => {
      if (!raycaster.current) return;
      isDraggingRef.current = false;
      // 항상 활성화 유지
      // 마우스가 올라간 위치에 따라 커서 업데이트
      const mouseVec = getMouseVec(e);
      raycaster.current.setFromCamera(mouseVec, camera);
      const intersects = raycaster.current.intersectObjects(
        lettersRef.current.map((l) => l.mesh),
      );
      if (intersects.length > 0) {
        renderer.domElement.style.cursor = "pointer";
      } else {
        renderer.domElement.style.cursor = "grab";
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!raycaster.current) return;
      const mouseVec = getMouseVec(e);
      raycaster.current.setFromCamera(mouseVec, camera);
      const intersects = raycaster.current.intersectObjects(
        lettersRef.current.map((l) => l.mesh),
      );
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        const letter = lettersRef.current.find((l) => l.mesh === obj);
        if (letter) {
          const impulse = new CANNON.Vec3(0, 0, -25);
          letter.body.applyImpulse(impulse, new CANNON.Vec3());
        }
      }
    };
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("click", onClick);

    // 리셋(글자 떨어지면 다시 올리기)
    const reset = () => {
      lettersRef.current.forEach((l) => {
        l.body.position.set(l.init.x, l.init.y, l.init.z);
        l.body.velocity.setZero();
        l.body.angularVelocity.setZero();
        l.body.quaternion.set(0, 0, 0, 1);
      });
    };
    renderer.domElement.addEventListener("dblclick", reset);

    // 클린업
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("mouseleave", () => {
      controls.enabled = false;
    });
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      if (mountNode) {
        mountNode.removeChild(renderer.domElement);
      }
    };
  }, [mountRef, text]);

  return <div ref={mountRef} style={{ width: 1200, height: 800 }} />;
};

export default DropEffect3D;
