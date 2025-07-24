import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FontLoader, TextGeometry, OrbitControls, Font } from "three-stdlib";
import * as CANNON from "cannon-es";
import { Letter } from "../../types/letter";
import { useTypingImpulse } from "../../context/hooks";

const FONT_URL =
  "https://cdn.jsdelivr.net/npm/three@0.150.1/examples/fonts/helvetiker_regular.typeface.json";
const CORRECT_COLOR = "#4fc3f7";
const WRONG_COLOR = "#f06292";
const DEFAULT_COLOR = "#aaa";

const DropEffect3D = ({
  history,
  currentText,
  input,
}: {
  history: string[];
  currentText: string;
  input: string;
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<Letter[]>([]); // 누적된 모든 글자
  const worldRef = useRef<CANNON.World>();
  const sceneRef = useRef<THREE.Scene>();
  const groupRef = useRef<THREE.Group>();
  const animationRef = useRef<number>();
  const groundRef = useRef<CANNON.Body>();
  const controlsRef = useRef<OrbitControls>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.OrthographicCamera>();
  const { impulse } = useTypingImpulse();

  const geometryCache = useRef<{ [key: string]: TextGeometry }>({});
  const materialCache = useRef<{ [key: string]: THREE.Material }>({
    blue: new THREE.MeshPhongMaterial({ color: CORRECT_COLOR }),
    gray: new THREE.MeshPhongMaterial({ color: DEFAULT_COLOR }),
    red: new THREE.MeshPhongMaterial({ color: WRONG_COLOR }),
  });
  const fontLoaderRef = useRef<FontLoader>();
  const [font, setFont] = useState<Font | null>(null);

  useEffect(() => {
    fontLoaderRef.current = new FontLoader();
    fontLoaderRef.current.load(FONT_URL, (loadedFont) => {
      setFont(loadedFont);
    });
  }, []);
  const [hoveredLetterIdx, setHoveredLetterIdx] = useState<number | null>(null);
  const [isLetterPointerDown, setIsLetterPointerDown] = useState(false);

  // 최초 1회: 씬/월드/바닥/애니메이션 루프 생성
  useEffect(() => {
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
    // 카메라 - 화면 크기에 맞게 시야각 조정
    const aspectRatio = 1000 / 600; // width / height
    const viewSize = 30;
    const camera = new THREE.OrthographicCamera(
      -viewSize * aspectRatio,
      viewSize * aspectRatio,
      viewSize,
      -viewSize,
      -0.01,
      2000,
    );
    camera.position.set(-15, 10, 40);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    // 렌더러
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(1000, 600);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor("#353942");
    const mountNode = mountRef.current;
    if (!mountNode) return;
    mountNode.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    // OrbitControls
    controlsRef.current = new OrbitControls(camera, renderer.domElement);
    controlsRef.current.enableDamping = true;
    controlsRef.current.enableZoom = false;
    controlsRef.current.enablePan = false;
    controlsRef.current.enabled = true;
    // Cannon.js 월드
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -50, 0) });
    worldRef.current = world;
    // 바닥
    const ground = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(35, 0.5, 35)), // 기존 100 → 200
      position: new CANNON.Vec3(0, -10, 0),
    });
    world.addBody(ground);
    groundRef.current = ground;
    const groundMesh = new THREE.Mesh(
      new THREE.BoxGeometry(70, 1, 70), // 기존 200 → 400
      new THREE.MeshPhongMaterial({
        color: 0x353942,
        transparent: true,
        opacity: 0.8,
      }),
    );
    groundMesh.position.y = -10;
    scene.add(groundMesh);
    // 그룹
    const group = new THREE.Group();
    groupRef.current = group;
    scene.add(group);
    // 애니메이션 루프
    const animate = () => {
      world.step(1 / 60);
      controlsRef.current?.update();
      // 화면 밖으로 떨어진 글자 제거
      let removed = false;
      lettersRef.current = lettersRef.current.filter(({ mesh, body }) => {
        if (body.position.y < -100) {
          scene.remove(mesh);
          world.removeBody(body);
          // dispose로 메모리 누수 방지
          if (mesh.geometry) mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              if (m && typeof m.dispose === "function") m.dispose();
            });
          } else if (
            mesh.material &&
            typeof mesh.material.dispose === "function"
          ) {
            mesh.material.dispose();
          }
          if (!window.__disappearedCount) {
            window.__disappearedCount = 0;
          }
          window.__disappearedCount += 1;
          removed = true;
          return false;
        }
        return true;
      });

      // 상태 업데이트 (글자가 제거되었을 때만)
      if (removed) {
        setOnGroundCount(
          lettersRef.current.filter(({ body }) => body.position.y > -9).length,
        );
        setDisappearedCount(window.__disappearedCount || 0);
        setCachedCount(Object.keys(geometryCache.current).length);
      }

      lettersRef.current.forEach(({ mesh, body }) => {
        mesh.position.copy(body.position as unknown as THREE.Vector3);
        mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
      });
      if (rendererRef.current && cameraRef.current)
        rendererRef.current.render(scene, cameraRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    // 클린업
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        mountNode.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // wordList가 바뀔 때마다 새 글자만 추가
  useEffect(() => {
    if (!sceneRef.current || !groupRef.current || !worldRef.current) return;
    if (!font) return;

    const prevLetters = lettersRef.current.length;
    const currentLen = currentText.length;

    // 이미 currentText 글자가 생성되어 있으면 skip
    if (prevLetters >= history.join("").length + currentLen) return;

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

    for (let i = 0; i < currentLen; i++) {
      const totalIndex = history.join("").length + i;
      if (lettersRef.current[totalIndex]) continue;

      const geoKey = `${currentText[i]}_${options.size}_${options.height}_${options.bevelEnabled}`;
      let geometry = geometryCache.current[geoKey];
      if (!geometry) {
        geometry = new TextGeometry(currentText[i], options);
        geometry.computeBoundingBox();
        geometry.center();
        geometryCache.current[geoKey] = geometry;
      }

      const material = materialCache.current.gray;
      const mesh = new THREE.Mesh(geometry, material);

      const offsetX = -((currentLen - 1) * 3 * 1.2) / 2;
      mesh.position.set(offsetX + i * 3 * 1.2, 5 + history.length * 5, 0);
      groupRef.current.add(mesh);

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

      worldRef.current.addBody(body);

      lettersRef.current.push({
        mesh,
        body,
        init: {
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z,
        },
        wordIndex: history.length, // currentText는 마지막 word로 간주
        charIndex: i,
      });
    }

    // 상태 업데이트
    setOnGroundCount(
      lettersRef.current.filter(({ body }) => body.position.y > -9).length,
    );
    setDisappearedCount(window.__disappearedCount || 0);
    setCachedCount(Object.keys(geometryCache.current).length);
  }, [currentText, font, history]);

  // 임펄스 트리거 감지 및 적용
  useEffect(() => {
    if (!impulse) return;
    if (impulse.type === "letter") {
      // 현재 문제의 해당 글자에만 임펄스 적용
      const currentWordLetters = lettersRef.current.filter(
        (letter) =>
          letter.wordIndex !== undefined && letter.wordIndex === history.length,
      );
      const target = currentWordLetters[impulse.index || 0];
      if (target) {
        target.body.applyImpulse(
          new CANNON.Vec3(0, 0, -(impulse.strength || 0)),
          new CANNON.Vec3(),
        );
      }
    } else if (impulse.type === "word") {
      // 전체 글자에 impulse 적용 (너무 멀리 날아가지 않게 strength와 방향 조정)
      lettersRef.current.forEach((l) => {
        const s = Math.min(impulse.strength || 0, 32); // 최대 32로 약간 더 세게
        l.body.applyImpulse(
          new CANNON.Vec3(
            (Math.random() - 0.5) * s, // x축
            Math.random() * s * 0.7, // y축
            -s * (0.7 + Math.random() * 0.8), // z축, 0.7~1.5배
          ),
          new CANNON.Vec3(),
        );
      });
      impulse.type = null;
    }
  }, [impulse, history.length]);

  // input에 따라 3D 글자 색상 실시간 동기화 (현재 문제의 글자만)
  useEffect(() => {
    if (!sceneRef.current || !groupRef.current || !worldRef.current) return;
    if (lettersRef.current.length === 0) return;

    // 현재 문제의 글자들만 필터링
    const currentWordLetters = lettersRef.current.filter(
      (letter) =>
        letter.wordIndex !== undefined && letter.wordIndex === history.length,
    );

    // 현재 문제의 글자들 색상 변경
    currentWordLetters.forEach((letter, i) => {
      if (letter && letter.mesh) {
        if (input[i] === undefined) {
          // 입력 전
          letter.mesh.material = materialCache.current.gray;
        } else if (input[i] === currentText[i]) {
          // 맞춘 글자
          letter.mesh.material = materialCache.current.blue;
        } else {
          // 틀린 글자
          letter.mesh.material = materialCache.current.red;
        }
      }
    });

    // 이전 문제(바닥에 떨어진) 글자는 색상 고정(파란색)
    const previousWordLetters = lettersRef.current.filter(
      (letter) =>
        letter.wordIndex !== undefined && letter.wordIndex < history.length,
    );
    previousWordLetters.forEach((letter) => {
      if (letter && letter.mesh) {
        letter.mesh.material = materialCache.current.blue;
      }
    });
  }, [currentText, input, history.length]);

  // 바닥 위에 남아있는 글자 수, 사라진 글자 수 계산
  const [onGroundCount, setOnGroundCount] = useState(0);
  const [disappearedCount, setDisappearedCount] = useState(0);
  const [cachedCount, setCachedCount] = useState(0);

  useEffect(() => {
    if (!groupRef.current || !controlsRef.current) return;
    const group = groupRef.current;
    const renderer = rendererRef.current;
    if (!renderer) return;

    // Raycaster, mouse 좌표 준비
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // 커서 스타일 관리
    const setCursor = (cursor: string) => {
      if (renderer.domElement.style.cursor !== cursor) {
        renderer.domElement.style.cursor = cursor;
      }
    };

    // OrbitControls 드래그 상태 추적
    let isDragging = false;
    const handleControlsStart = () => {
      isDragging = true;
      setCursor("grabbing");
    };
    const handleControlsEnd = () => {
      isDragging = false;
      setCursor("grab");
    };
    if (controlsRef.current) {
      controlsRef.current.addEventListener("start", handleControlsStart);
      controlsRef.current.addEventListener("end", handleControlsEnd);
    }

    // 마우스 move: hover 체크
    const handlePointerMove = (event: MouseEvent) => {
      if (!cameraRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(group.children, false);
      if (intersects.length > 0) {
        setHoveredLetterIdx(group.children.indexOf(intersects[0].object));
        setCursor("pointer");
      } else {
        setHoveredLetterIdx(null);
        if (isLetterPointerDown) {
          setCursor("pointer");
        } else if (isDragging) {
          setCursor("grabbing");
        } else {
          setCursor("grab");
        }
      }
    };

    // 마우스 다운: 글자 클릭 시 impulse, OrbitControls 비활성화
    const handlePointerDown = () => {
      if (!controlsRef.current) return;
      if (hoveredLetterIdx !== null) {
        setIsLetterPointerDown(true);
        controlsRef.current.enabled = false;
        setCursor("pointer");
        // impulse 적용
        const letter = lettersRef.current[hoveredLetterIdx];
        if (letter && letter.body) {
          letter.body.applyImpulse(
            new CANNON.Vec3(0, 0, -10),
            new CANNON.Vec3(),
          );
        }
      }
    };
    // 마우스 업: OrbitControls 다시 활성화
    const handlePointerUp = () => {
      if (!controlsRef.current) return;
      setIsLetterPointerDown(false);
      controlsRef.current.enabled = true;
      setCursor("grab");
    };

    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      if (controlsRef.current) {
        controlsRef.current.removeEventListener("start", handleControlsStart);
        controlsRef.current.removeEventListener("end", handleControlsEnd);
      }
      setCursor("");
    };
  }, [hoveredLetterIdx, isLetterPointerDown]);

  return (
    <div
      style={{ position: "relative", width: 1000, height: 600 }}
      ref={mountRef}
    >
      <div
        style={{
          position: "absolute",
          left: 16,
          top: 12,
          color: "#fff",
          fontWeight: 700,
          fontSize: 20,
          zIndex: 2,
          textShadow: "0 1px 4px #222",
        }}
      >
        바닥 위 글자 수: {onGroundCount} / 떨어진 글자 수: {disappearedCount}
        <br />
        캐싱된 글자 수: {cachedCount}
      </div>
      <div
        style={{
          position: "absolute",
          right: 20,
          bottom: 16,
          color: "#fff",
          fontSize: 18,
          opacity: 0.7,
          textAlign: "right",
          zIndex: 2,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        글자 클릭 : 상호작용
        <br />
        화면 드래그 : 시점 변경
      </div>
    </div>
  );
};

export default DropEffect3D;
