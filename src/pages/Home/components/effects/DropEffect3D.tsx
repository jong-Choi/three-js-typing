import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FontLoader, TextGeometry, OrbitControls } from "three-stdlib";
import * as CANNON from "cannon-es";
import { COLORS, pick } from "../../utils/colorUtils";
import { Letter } from "../../types/letter";
import { useTypingImpulse } from "../../context/hooks";

const FONT_URL =
  "https://cdn.jsdelivr.net/npm/three@0.150.1/examples/fonts/helvetiker_regular.typeface.json";

const DropEffect3D = ({ history }: { history: string[] }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const raycaster = useRef<THREE.Raycaster>();
  const lettersRef = useRef<Letter[]>([]);
  const worldRef = useRef<CANNON.World>();
  const sceneRef = useRef<THREE.Scene>();
  const groupRef = useRef<THREE.Group>();
  const animationRef = useRef<number>();
  const groundRef = useRef<CANNON.Body>();
  const controlsRef = useRef<OrbitControls>();
  const dragState = useRef({ isDragging: false, start: { x: 0, y: 0 } });
  const isDraggingRef = useRef(false);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.OrthographicCamera>();
  const { impulse } = useTypingImpulse();

  // 최초 1회: 씬/월드/바닥/애니메이션 루프 생성
  useEffect(() => {
    if (!mountRef.current) return;
    const mountNode = mountRef.current;
    // 씬
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.add(new THREE.AmbientLight(0xcccccc, 1.4));
    const foreLight = new THREE.DirectionalLight(0xffffff, 0.8);
    foreLight.position.set(5, 5, 20);
    scene.add(foreLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 1.2);
    backLight.position.set(-5, -5, -10);
    scene.add(backLight);
    scene.background = new THREE.Color(0x353942);
    // 카메라
    const camera = new THREE.OrthographicCamera(-40, 40, 30, -30, -10, 100);
    camera.position.set(-15, 15, 40);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    // 렌더러
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(1200, 800);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor("#353942");
    mountNode.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    // OrbitControls
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
      shape: new CANNON.Box(new CANNON.Vec3(100, 0.5, 100)),
      position: new CANNON.Vec3(0, -10, 0),
    });
    world.addBody(ground);
    groundRef.current = ground;
    const groundMesh = new THREE.Mesh(
      new THREE.BoxGeometry(200, 1, 200),
      new THREE.MeshPhongMaterial({ color: 0x353942 }),
    );
    groundMesh.position.y = -10;
    scene.add(groundMesh);
    // 그룹
    const group = new THREE.Group();
    groupRef.current = group;
    scene.add(group);
    // 애니메이션 루프
    const animate = () => {
      if (!sceneRef.current || !cameraRef.current) return;
      world.step(1 / 60);
      controlsRef.current?.update();
      lettersRef.current.forEach(({ mesh, body }) => {
        mesh.position.copy(body.position as unknown as THREE.Vector3);
        mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
      });
      rendererRef.current?.render(sceneRef.current, cameraRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

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
  }, []);

  // history가 바뀔 때마다 새 글자만 추가
  useEffect(() => {
    if (!sceneRef.current || !groupRef.current || !worldRef.current) return;
    // history의 각 단어를 누적해서, 이미 추가된 글자 수보다 많은 경우만 추가
    let letterCount = lettersRef.current.length;
    const group = groupRef.current;
    const world = worldRef.current;
    for (let h = 0; h < history.length; h++) {
      const text = history[h];
      for (let i = 0; i < text.length; i++) {
        if (
          letterCount >=
          (h === 0
            ? 0
            : history.slice(0, h).reduce((a, t) => a + t.length, 0)) +
            i +
            1
        )
          continue;
        // 새 글자만 추가
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
          const colorSet = pick(COLORS);
          const progress = i / (text.length - 1);
          const material = new THREE.MeshPhongMaterial({
            color: colorSet.from.clone().lerp(colorSet.to, progress),
            shininess: 80,
            specular: 0xffffff,
          });
          const geometry = new TextGeometry(text[i], options);
          geometry.computeBoundingBox();
          geometry.center();
          const mesh = new THREE.Mesh(geometry, material);
          // 위치: 단어별로 y축을 다르게, x축은 단어 내에서만 오프셋
          const offsetX = -((text.length - 1) * 3 * 1.2) / 2;
          mesh.position.set(offsetX + i * 3 * 1.2, 5 + h * 5, 0); // y축 h*5로 쌓임
          group.add(mesh);
          // Cannon body
          const box = geometry.boundingBox;
          if (!box) return;
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
          lettersRef.current.push({
            mesh,
            body,
            init: {
              x: mesh.position.x,
              y: mesh.position.y,
              z: mesh.position.z,
            },
          });
        });
        letterCount++;
      }
    }
  }, [history]);

  // 임펄스 트리거 감지 및 적용
  useEffect(() => {
    if (!impulse) return;
    if (impulse.type === "letter") {
      // 마지막 단어(현재 문제)의 해당 글자에만 임펄스 적용
      const lastWordLen = history[history.length - 1]?.length || 0;
      const startIdx = lettersRef.current.length - lastWordLen;
      const target = lettersRef.current[startIdx + impulse.index];
      if (target) {
        target.body.applyImpulse(
          new CANNON.Vec3(0, 0, -impulse.strength),
          new CANNON.Vec3(),
        );
      }
    } else if (impulse.type === "word") {
      // 전체 글자에 impulse 적용 (너무 멀리 날아가지 않게 strength와 방향 조정)
      lettersRef.current.forEach((l) => {
        const s = Math.min(impulse.strength, 32); // 최대 32로 약간 더 세게
        l.body.applyImpulse(
          new CANNON.Vec3(
            (Math.random() - 0.5) * s, // x축
            Math.random() * s * 0.7, // y축
            -s * (0.7 + Math.random() * 0.8), // z축, 0.7~1.5배
          ),
          new CANNON.Vec3(),
        );
      });
    }
  }, [impulse?.ts, history]);

  return <div ref={mountRef} style={{ width: 1200, height: 800 }} />;
};

export default DropEffect3D;
