## Three JS 튜토리얼

참고 : [Building a Physics-based 3D Menu with Cannon.js and Three.js - codrops](https://tympanus.net/codrops/2019/12/10/building-a-physics-based-3d-menu-with-cannon-js-and-three-js/?utm_source=chatgpt.com)
[typescript-react-tailwind-vite - GitHub @oluqom](https://github.com/oluqom/typescript-react-tailwind-vite.git)

Three JS와 Cannon JS를 이용해서 인터랙티브한 Three JS 글자 만들기

## Three.js로 3D 텍스트 렌더링

### 기본 셋업

React 환경에서 Three.js를 사용하는 경우, 일반적으로 `useRef`로 DOM 요소에 접근하고, `useEffect` 내부에서 씬을 초기화하고 렌더링한다.

```tsx
const mountRef = useRef<HTMLDivElement>(null);
const animationRef = useRef<number>();
```

`mountRef`는 Three.js 렌더링 캔버스를 DOM에 부착할 위치를 지정한다. `animationRef`는 requestAnimationFrame의 ID를 저장해 언마운트 시 제거하는 데 사용된다.

### 씬(Scene), 카메라(Camera), 렌더러(Renderer) 설정

```tsx
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202533);
```

`Scene`은 Three.js에서 3D 객체를 담는 컨테이너 역할을 한다. 배경색은 어두운 남색 계열로 설정했다.

```tsx
const camera = new THREE.OrthographicCamera(-20, 20, 15, -15, -10, 100);
camera.position.set(-10, 10, 10);
camera.lookAt(0, 0, 0);
```

`OrthographicCamera`는 원근감 없이 평면적으로 보이는 카메라다. 시야 범위(left, right, top, bottom, near, far)를 설정하고, 대각선 위쪽에서 원점을 바라보도록 위치시킨다.

```tsx
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(600, 400);
renderer.setPixelRatio(window.devicePixelRatio);
mountNode.appendChild(renderer.domElement);
```

`WebGLRenderer`는 실제로 DOM에 그려주는 렌더링 엔진이다. `antialias: true`는 계단 현상을 줄여주며, `setSize`와 `setPixelRatio`는 해상도 대응을 위해 설정한다.

### 조명 설정

```tsx
scene.add(new THREE.AmbientLight(0xcccccc));
const foreLight = new THREE.DirectionalLight(0xffffff, 0.5);
foreLight.position.set(5, 5, 20);
scene.add(foreLight);
const backLight = new THREE.DirectionalLight(0xffffff, 1);
backLight.position.set(-5, -5, -10);
scene.add(backLight);
```

`AmbientLight`는 전체적으로 퍼지는 조명이다. `DirectionalLight`는 특정 방향에서 광원을 쏘는 조명으로, 위치에 따라 그림자가 생길 수도 있다. 이 예제에서는 앞뒤에서 각각 비추는 조명을 추가했다.

### 폰트 로딩과 텍스트 생성

```tsx
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
  ...
});
```

`FontLoader`는 `.json` 형식의 폰트를 로드한다. 이때 사용하는 폰트는 Helvetiker이며, Three.js 예제용으로 CDN에 올라와 있다. `TextGeometry`를 사용할 때 bevel(모서리 깎기) 옵션을 켜면 입체적인 느낌이 더 강해진다.

`.json`의 폴더는 벡터로 렌더링하기 위해 사용되며, 예제에 사용되는 json에는 한글이 없다.

### 글자별 Mesh 생성 및 배치

```tsx
const group = new THREE.Group();
const offsetX = -((MENU_TEXT.length - 1) * 3 * 1.2) / 2;
```

`Group`은 여러 Mesh를 하나의 객체처럼 다룰 수 있게 묶는 컨테이너다. 각 글자를 개별적으로 만들고, X축 기준으로 균등하게 배치하기 위해 `offsetX`를 계산한다.

```tsx
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
```

`TextGeometry`는 주어진 폰트와 옵션을 바탕으로 3D 형태의 글자 geometry를 만든다. `boundingBox`를 계산하고 center를 호출해야 회전 시 중심 기준으로 도는 게 보장된다. 각 글자에는 `MeshPhongMaterial`을 적용하고, 앞서 정의한 컬러 유틸로 그라데이션을 입힌다.

### 애니메이션 루프

```tsx
const animate = () => {
  group.rotation.y += 0.01;
  renderer.render(scene, camera);
  animationRef.current = requestAnimationFrame(animate);
};
animate();
```

회전 효과를 주기 위해 `group.rotation.y` 값을 매 프레임마다 조금씩 증가시킨다. `requestAnimationFrame`은 매 프레임마다 해당 함수를 호출해 부드러운 애니메이션을 구현할 수 있게 한다.

### 정리 및 클린업

```tsx
return () => {
  if (animationRef.current) cancelAnimationFrame(animationRef.current);
  renderer.dispose();
  if (mountNode) {
    mountNode.removeChild(renderer.domElement);
  }
};
```

React의 `useEffect` 클린업 함수에서는 애니메이션을 중단하고 렌더러를 제거하며 DOM도 정리해준다.

## Cannon.js로 물리효과 추가

Cannon.js는 3D 물리 엔진이다. Three.js의 `Mesh`가 화면에 보여지는 역할이라면, Cannon.js의 `Body`는 충돌, 중력, 반사 같은 실제 물리 법칙을 처리하는 역할을 한다. 각 텍스트는 Three.js의 `Mesh`와 Cannon.js의 `Body`로 동시에 생성되고, 매 프레임마다 `Body`의 위치와 회전 값을 `Mesh`에 복사해 동기화한다.

### 물리 월드 생성

```ts
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -50, 0) });
worldRef.current = world;
```

`World`는 Cannon에서 물리 시뮬레이션이 이루어지는 공간이다. `gravity`는 중력을 의미하며, Y축 방향으로 -50의 중력을 설정했다.

### 바닥 생성

```ts
const ground = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Box(new CANNON.Vec3(50, 0.5, 50)),
  position: new CANNON.Vec3(0, -10, 0),
});
world.addBody(ground);
```

`Body`는 물리 시뮬레이션 대상 객체를 뜻한다. `mass`가 0인 바디는 고정(static body)으로, 움직이지 않는 바닥이나 벽 등에 사용된다. `CANNON.Box`는 직육면체 형태의 충돌체를 정의하며, 여기서는 100x1x100 크기의 바닥이다.

바닥은 Cannon에서는 `Body`로, Three.js에서는 `Mesh`로 각각 만들어진 뒤 동일한 위치에 배치된다. 단, Three.js에서의 시각적 표현은 직접 동기화하지 않기 때문에 따로 움직일 필요는 없다.

### 텍스트 하나당 Mesh와 Body 생성

폰트 로딩 후 TextGeometry를 만든 후, Cannon에서 사용할 수 있도록 충돌 범위를 계산한다.

```ts
geometry.computeBoundingBox();
const box = geometry.boundingBox;
const sx = (box.max.x - box.min.x) / 2;
const sy = (box.max.y - box.min.y) / 2;
const sz = (box.max.z - box.min.z) / 2;
const shape = new CANNON.Box(new CANNON.Vec3(sx, sy, sz));
```

`TextGeometry`는 3D 텍스트를 벡터 형태로 생성해준다. 하지만 이 자체는 물리적인 의미가 없기 때문에, `computeBoundingBox()`로 경계값을 계산한 후 해당 크기를 기반으로 Cannon용 Box 충돌체를 만든다.

```ts
const body = new CANNON.Body({
  mass: 1,
  position: new CANNON.Vec3(...),
  shape,
  angularDamping: 0.99,
});
```

`mass`는 질량을 의미한다. 1 이상이면 중력의 영향을 받는다. `angularDamping`은 회전 감쇠 값으로, 0이면 계속 회전하고 1에 가까울수록 빠르게 멈춘다.

텍스트 메쉬와 바디는 다음처럼 묶어서 저장된다.

```ts
letters.push({
  mesh,
  body,
  init: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
});
```

### 물리 시뮬레이션과 렌더링 동기화

```ts
const animate = () => {
  world.step(1 / 60);
  letters.forEach(({ mesh, body }) => {
    mesh.position.copy(body.position as THREE.Vector3);
    mesh.quaternion.copy(body.quaternion as THREE.Quaternion);
  });
  renderer.render(scene, camera);
  animationRef.current = requestAnimationFrame(animate);
};
animate();
```

`world.step(1 / 60)`은 1초에 60프레임 단위로 물리 시뮬레이션을 한 단계 진행한다.
각 텍스트의 Cannon 바디에서 계산된 `position`과 `quaternion`(회전값)을 Three.js의 메쉬에 복사한다. 이로써 화면에 보이는 텍스트가 중력과 충돌에 따라 움직이는 것처럼 표현된다.

## 마우스 인터렉션

좋아. 지금 추가된 이 부분은 **사용자 인터랙션**에 관련된 핵심 로직이야.
즉, **마우스를 움직이면 커서가 바뀌고**, **클릭하면 글자가 튕겨나가고**, **더블클릭하면 원래 위치로 리셋**되는 인터랙티브 기능을 담고 있어.

아래는 해당 코드 부분만 **집중적으로 설명하는 튜토리얼**이다.

## 마우스 인터랙션으로 글자와 상호작용하기

Three.js의 `Raycaster`를 활용하면 화면 속 3D 객체와 마우스 포인터 간의 교차 여부를 계산할 수 있다. 이 기능을 통해 마우스를 움직일 때 커서를 변경하거나, 특정 객체를 클릭했을 때 반응하도록 만들 수 있다.

클릭은 충격 주기, 더블 클릭은 초기화로 구현한다.

### Raycaster 기본 설정

```ts
raycaster.current = new THREE.Raycaster();
```

`Raycaster`는 마우스 좌표를 기반으로 3D 공간에 "직선(ray)"을 쏘고, 해당 직선과 교차하는 Mesh 객체를 탐색할 수 있게 해주는 유틸리티이다.

### 마우스 위치 추적 및 hover 처리

```ts
const onMouseMove = (e: MouseEvent) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
```

화면 상의 마우스 좌표(e.clientX, Y)를 \[-1, 1] 범위의 \*\*정규화된 디바이스 좌표(NDC)\*\*로 변환한다.
이 변환은 `Raycaster`가 `setFromCamera()`를 사용할 때 요구하는 형태다.

```ts
const mouseVec = new THREE.Vector2(mouse.current.x, mouse.current.y);
raycaster.current.setFromCamera(mouseVec, camera);
```

`setFromCamera()`는 현재 카메라를 기준으로 마우스 위치에서 직선을 발사할 준비를 한다.

```ts
const intersects = raycaster.current.intersectObjects(
  lettersRef.current.map((l) => l.mesh),
);
```

`intersectObjects()`는 주어진 3D 객체 리스트 중 실제로 이 직선과 교차하는 대상들을 반환한다.
결과가 존재하면 그 중 가장 가까운 교차 객체가 `intersects[0]`이다.

```ts
renderer.domElement.style.cursor = intersects.length > 0 ? "pointer" : "";
```

하나라도 교차한 글자가 있다면 커서를 포인터로 바꿔서 "클릭 가능한 대상"임을 사용자에게 알려준다.

### 클릭 시 impulse 적용

```ts
const onClick = () => {
  const mouseVec = new THREE.Vector2(mouse.current.x, mouse.current.y);
  raycaster.current.setFromCamera(mouseVec, camera);
  const intersects = raycaster.current.intersectObjects(
    lettersRef.current.map((l) => l.mesh),
  );
```

마우스를 클릭했을 때도 마찬가지로 Raycaster를 통해 교차된 객체를 찾는다.

```ts
const obj = intersects[0].object;
const letter = lettersRef.current.find((l) => l.mesh === obj);
```

화면에 보이는 `Mesh`를 기준으로, 해당 Mesh와 연결된 Cannon `Body`를 찾아낸다.

```ts
const impulse = new CANNON.Vec3(0, 0, -25);
letter.body.applyImpulse(impulse, new CANNON.Vec3());
```

찾은 바디에 `applyImpulse()`를 호출해 순간적인 충격을 준다.
첫 번째 인자는 충격의 벡터 방향이고, 두 번째 인자는 충격을 가할 위치이다. 여기서는 중심(0, 0, 0) 기준으로 -Z 방향으로 밀어낸다. 이 값은 실험적으로 조정할 수 있다.

### 더블클릭 시 리셋

```ts
const reset = () => {
  lettersRef.current.forEach((l) => {
    l.body.position.set(l.init.x, l.init.y, l.init.z);
    l.body.velocity.setZero();
    l.body.angularVelocity.setZero();
    l.body.quaternion.set(0, 0, 0, 1);
  });
};
```

글자가 아래로 떨어진 후 다시 원래 위치로 되돌리려면 초기 위치를 기억하고 있어야 한다.
이때 `init`은 각 글자의 초기 좌표를 저장한 객체이고, 해당 위치로 `position`을 다시 설정한다.
추가로 속도와 회전 속도도 모두 0으로 만들고, `quaternion`은 회전을 초기화한다.

### 이벤트 연결

```ts
renderer.domElement.addEventListener("mousemove", onMouseMove);
renderer.domElement.addEventListener("click", onClick);
renderer.domElement.addEventListener("dblclick", reset);
```

이벤트 리스너는 Three.js가 붙인 canvas 엘리먼트 (`renderer.domElement`)에 직접 등록한다.
React 컴포넌트의 DOM이 아니라 Three.js 내부에서 직접 다루기 때문에 `addEventListener`를 사용한다.
