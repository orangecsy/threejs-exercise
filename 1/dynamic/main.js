
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
  // 交互
  const controls = new THREE.OrbitControls( camera );
  controls.target.set(0, 100, 0);
  controls.update();
  // 场景
  scene = new THREE.Scene();
  // 渲染
  renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
  renderer.setSize(WIDTH, HEIGHT);
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
  const light = new THREE.HemisphereLight( 0xFFFFFF, 0xFFFFFF, 0.85 );
  light.position.set(0, 200, 0);
  scene.add(light);
}

var mixers = [];
var clock = new THREE.Clock();
function createObject() {
  const loader = new THREE.FBXLoader();
  loader.load('Fish.fbx', function (object) {
    object.mixer = new THREE.AnimationMixer(object);
    mixers.push(object.mixer);

    const action = object.mixer.clipAction(object.animations[0]);
    action.play();

    // 侧面面对镜头
    object.rotation.y = -1.57;
    // 加入场景
    scene.add(object);
    // 载入obj后动画循环
    loop();
  });
}

// 动画循环
function loop() {
  requestAnimationFrame(loop);
  if (mixers.length > 0) {
    for (let i = 0; i < mixers.length; i ++) {
      mixers[i].update(clock.getDelta());
    }
  }
  renderer.render(scene, camera);
}

function init() {
  createScene();
  createLights();
  createObject();
}

window.addEventListener('load', init, false);