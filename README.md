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
