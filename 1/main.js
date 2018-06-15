
// 声明变量
let scene, camera, renderer, HEIGHT, WIDTH;
 
// 创建场景
function createScene() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  const fieldOfView = 60;
  const aspectRatio = WIDTH / HEIGHT;
  const nearPlane = 1;
  const farPlane = 10000;
  // 相机
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 1000;
  // 场景
  scene = new THREE.Scene();
  // 渲染
  renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true;
  // 加入DOM
  const container = document.getElementById('main');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);
}

// 屏幕缩放
function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

// 光照
function createLights() {
  // 天空的反光颜色，地面的反光颜色，光的强度
  const light = new THREE.HemisphereLight( 0xFFFFFF, 0xFFFFFF, 0.8 );
  light.position.set(0, 200, 0);
  scene.add(light);
}

// 创建物体，暴露接口
let obj;
function createObject() {
  const loader = new THREE.FBXLoader();
  loader.load('ship1.fbx', function (object) {
    obj = object;
    scene.add(object);
    // 载入obj后动画循环
    loop();
  });
}

// 动画循环
function loop() {
  obj.rotation.y += 0.01;
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function init() {
  createScene();
  createLights();
  createObject();
}

window.addEventListener('load', init, false);