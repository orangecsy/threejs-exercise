// 参数
const OPTIONS = {
  // 游戏状态
  status: "start",
  // 分数
  score: 0,
  // 哪个模型
  player: 0,
  // 模型缩放比例
  objScale: [0.1, 0.08],
  // 包围盒
  objBoundary: [[40, 20], [55, 30]],
  // 海洋滚筒半径
  seaRadius: 600,
  // 绿球分数
  greenBallScore: 5,
  // 绿球角速度
  angleSpeed: 0.2,
  // 红球分数
  redBallScore: 20
};

// 颜色表
const COLORS = {
  red: 0xf25346,
  white: 0xffffff,
  brown: 0x59332e,
  pink: 0xF5986E,
  brownDark: 0x23190f,
  blue: 0x68c3c0,
  blackBlue: 0x48a0c9,
  sand: 0xf7d9aa
};

// 声明变量
let scene, camera, renderer, HEIGHT, WIDTH;
let player, sea, greenBalls, redBalls, particles;
let scoreDOM, describeDOM;
const mousePos = {x: 0, y: 0};

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
  camera.position.z = 220;
  camera.position.y = 100;
  // 场景
  scene = new THREE.Scene();
  // 雾气效果：颜色，近点，远点
  // scene.fog = new THREE.Fog(COLORS.blue, 100, 950);
  // 渲染
  renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
  renderer.setSize(WIDTH, HEIGHT);
  // renderer.shadowMap.enabled = true;
  // 加入DOM
  container = document.getElementById('webgl');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);
}

// 屏幕自适应
function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

// 光照
function createLights() {
  // 直射光
  const shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
  shadowLight.position.set(150, 350, 350);
  scene.add(shadowLight);
}

// 对象构造器
let playerObj;
const mixers = [];
// 游戏人物
const Player = function () {
  const isExist = playerObj ? true : false;
  const loader = new THREE.FBXLoader();
  loader.load('assets/models/Player' + OPTIONS.player + '.fbx', function (object) {
    object.mixer = new THREE.AnimationMixer(object);
    mixers.push(object.mixer);
    const action = object.mixer.clipAction(object.animations[0]);
    action.play();
    // 侧面面对镜头
    object.rotation.y = 1.57;
    object.position.y = 50;
    object.position.z = 0;
    const scale = OPTIONS.objScale[OPTIONS.player];
    object.scale.set(scale, scale, scale);
    // 加入场景
    if (isExist) {
      scene.remove(playerObj)
      playerObj = object;
      scene.add(object);
    } else {
      playerObj = object;
      scene.add(object);
      // 载入obj后开始第一次动画循环
      loop();
    }
  });
};

// 海洋
const Sea = function () {
  // 锥：上底半径，下底半径，高度，圆面划分，高度划分
  const geom = new THREE.CylinderGeometry(OPTIONS.seaRadius, OPTIONS.seaRadius, 200, 40, 10);
  // 滚动
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
  geom.mergeVertices();
  // 增加波动
  this.waves = [];
  for (let i=0; i < geom.vertices.length; i++) {
    this.waves.push({
      y: geom.vertices[i].y,
      x: geom.vertices[i].x,
      z: geom.vertices[i].z,
      ang: Math.random() * Math.PI * 2,
      amp: 5 + Math.random() * 15,
      speed: 0.016 + Math.random() * 0.032
    });
  };
  // 材质
  const mat = new THREE.MeshPhongMaterial({
    color: COLORS.sand
  });
  mat.flatShading = true;
  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.position.y = -600;
  this.mesh.position.z = -100;
  scene.add(this.mesh);
}

Sea.prototype.wave = function () {
  const verts = this.mesh.geometry.vertices;
  for (let i=0; i < verts.length; i++) {
    const vprops = this.waves[i];
    verts[i].x =  vprops.x + Math.cos(vprops.ang) * vprops.amp;
    verts[i].y = vprops.y + Math.sin(vprops.ang) * vprops.amp;
    vprops.ang += vprops.speed;
  }
  this.mesh.geometry.verticesNeedUpdate = true;
  sea.mesh.rotation.z += 0.005;
}

// 绿色小球
const GreenBalls = function () {
  this.generate();
}

GreenBalls.prototype.generate = function () {
  // 删除已有mesh
  if (this.meshArr) {
    for (let i = 0; i < this.meshArr.length; i++) {
      this.mesh.remove(this.meshArr[i]);
    }
  }
  // 生成一排绿色球
  this.mesh = new THREE.Object3D();
  this.meshArr = [];
  const geom = new THREE.TetrahedronGeometry(10, 0);
  const mat = new THREE.MeshPhongMaterial({
    color: 0x00CD66,
    shininess: 0,
    specular: 0xFFFFFF
  });
  mat.flatShading = true;
  // 每次几个球
  const count = Math.floor(2 + Math.random() * 6);
  const ANGLE = Math.PI / 50;
  // 高度范围620-800
  const h = 620 + Math.random() * 180;
  for (let i = 0; i < count; i++) {
    const greenBallMesh = new THREE.Mesh(geom.clone(), mat);
    greenBallMesh.position.x = Math.sin(ANGLE * i + Math.PI / 3) * h;
    greenBallMesh.position.y = Math.cos(ANGLE * i + Math.PI / 3) * h;
    greenBallMesh.position.z = 0;
    greenBallMesh.rotation.y = Math.random() * Math.PI;
    greenBallMesh.rotation.z = Math.random() * Math.PI;
    greenBallMesh.angle = ANGLE * i + Math.PI / 3;
    greenBallMesh.h = h;
    this.mesh.add(greenBallMesh);
    this.meshArr.push(greenBallMesh);
  }
  this.mesh.position.y = -600;
  scene.add(this.mesh);
};

GreenBalls.prototype.update = function (deltaTime) {
  const count = this.meshArr.length;
  for (let i = 0; i < count; i++) {
    // 自转
    this.meshArr[i].rotation.x += 3 * deltaTime * OPTIONS.angleSpeed;
    this.meshArr[i].rotation.z += 2 * deltaTime * OPTIONS.angleSpeed;
    // 公转，逆时针旋转
    this.meshArr[i].angle -= deltaTime * OPTIONS.angleSpeed;
    const angle = this.meshArr[i].angle;
    const h = this.meshArr[i].h;
    this.meshArr[i].position.x = Math.sin(angle) * h;
    this.meshArr[i].position.y = Math.cos(angle) * h;
    // 判断是否碰撞
    let diffX = this.meshArr[i].position.x - playerObj.position.x;
    diffX = diffX > 0 ? diffX : -diffX;
    let diffY = this.meshArr[i].position.y - (playerObj.position.y + 600);
    diffY = diffY > 0 ? diffY : -diffY;
    if (diffX < OPTIONS.objBoundary[OPTIONS.player][0] &&
      diffY < OPTIONS.objBoundary[OPTIONS.player][1]) {
        particles.generate(15, playerObj.position.clone(), 0x009999, 3);
        this.mesh.remove(this.meshArr[i]);
        this.meshArr.splice(i, 1);
        // this.meshArr.shift();
        // 计分
        OPTIONS.score += OPTIONS.greenBallScore;
        // 玩家选择鲨鱼，单独加一定分数
        if (OPTIONS.player === 1) {
          OPTIONS.score += 5;
        }
        break;
    }
  }
  // 绿球都被吃或超过左边界
  if (this.meshArr.length === 0 || this.meshArr[0].angle < -Math.PI / 3) {
    this.generate();
  }
};

// 红色小球
const RedBall = function () {
  this.generate();
}

RedBall.prototype.generate = function () {
  // 删除已有mesh
  if (this.meshTemp) {
    this.mesh.remove(this.meshTemp);
  }
  this.mesh = new THREE.Object3D();
  // 生成一排绿色球
  const geom = new THREE.TetrahedronGeometry(8, 2);
  const mat = new THREE.MeshPhongMaterial({
    color: COLORS.red,
    shininess: 0,
    specular: 0xFFFFFF
  });
  mat.flatShading = true;
  const h = 620 + Math.random() * 180;
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.x = Math.sin(Math.PI / 3) * h;
  mesh.position.y = -600 + Math.cos(Math.PI / 3) * h;
  mesh.position.z = 0;
  mesh.rotation.y = Math.random() * Math.PI;
  mesh.rotation.z = Math.random() * Math.PI;
  mesh.angle = Math.PI / 3;
  mesh.h = h;
  this.meshTemp = mesh;
  this.mesh.add(mesh);
  scene.add(this.mesh);
};

RedBall.prototype.update = function (deltaTime) {
  // 自转
  this.meshTemp.rotation.x -= 2 * deltaTime * OPTIONS.angleSpeed;
  this.meshTemp.rotation.z -= 3 * deltaTime * OPTIONS.angleSpeed;
  // 公转，逆时针旋转，绿色小球的1.8倍
  this.meshTemp.angle -= 1.8 * deltaTime * OPTIONS.angleSpeed;
  const angle = this.meshTemp.angle;
  const h = this.meshTemp.h;
  this.meshTemp.position.x = Math.sin(angle) * h;
  this.meshTemp.position.y = -600 + Math.cos(angle) * h;
  // 判断是否碰撞
  let diffX = this.meshTemp.position.x - playerObj.position.x;
  diffX = diffX > 0 ? diffX : -diffX;
  let diffY = this.meshTemp.position.y - (playerObj.position.y);
  diffY = diffY > 0 ? diffY : -diffY;
  // console.log(diffX + "  " + diffY)
  if (diffX < OPTIONS.objBoundary[OPTIONS.player][0] && 
    diffY < OPTIONS.objBoundary[OPTIONS.player][1]) {
    // 发生碰撞
    this.mesh.remove(this.meshTemp);
    this.meshTemp = undefined;
    playerObj.position.x -= 20;
    playerObj.position.y -= 5;
    particles.generate(15, playerObj.position.clone(), COLORS.red, 3);
    // 计分
    OPTIONS.score -= OPTIONS.redBallScore;
  }
  // 红球被吃或超过左边界
  if (this.meshTemp === undefined || this.meshTemp.angle < -Math.PI / 3) {
    this.generate();
  }
};

const Particle = function() {
  const geom = new THREE.TetrahedronGeometry(3, 0);
  const mat = new THREE.MeshPhongMaterial({
    color: 0x009999,
    shininess: 0,
    specular: 0xFFFFFF
  });
  mat.flatShading = true;
  this.mesh = new THREE.Mesh(geom,mat);
}

Particle.prototype.animate = function(position, color, scale) {
  this.mesh.material.color = new THREE.Color(color);
  this.mesh.material.needsUpdate = true;
  this.mesh.scale.set(scale, scale, scale);
  // 向周围四散
  const speed = 0.6 + Math.random() * 0.2;
  TweenMax.to(this.mesh.rotation, speed, {
    x: Math.random() * 12, 
    y: Math.random() * 12
  });
  TweenMax.to(this.mesh.scale, speed, {
    x: 0.1,
    y: 0.1, 
    z: 0.1
  });
  TweenMax.to(this.mesh.position, speed, {
    x: position.x + (Math.random() * 2 - 1) * 50, 
    y: position.y + (Math.random() * 2 - 1) * 50, 
    delay: Math.random() * 0.1, 
    ease: Power2.easeOut
  });
}

Particles = function () {
  this.mesh = new THREE.Object3D();
  scene.add(this.mesh)
}

Particles.prototype.generate = function(count, position, color, scale) {
  for (var i = 0; i < count; i++) {
    const particle = new Particle();
    particle.mesh.visible = true;
    particle.mesh.position.x = position.x + OPTIONS.objBoundary[OPTIONS.player][0];
    particle.mesh.position.y = position.y;
    this.mesh.add(particle.mesh);
    particle.animate(position, color, scale);
  }
}

// 创建对象
function createObject() {
  // 玩家
  player = new Player();
  // 海洋滚筒
  sea = new Sea();
  // 绿色球
  greenBalls = new GreenBalls();
  // 红色球
  redBall = new RedBall();
  // 粒子效果
  particles = new Particles();
}

// 动画循环
const clock = new THREE.Clock();
let lastClock = 1;
function loop() {
  //status: "start",
  if (OPTIONS.status === 'start') {
    requestAnimationFrame(loop);
    const deltaTime = clock.getDelta();
    // player动画
    for (let i = 0; i < mixers.length; i ++) {
      mixers[i].update(deltaTime);
    }
    // 海洋动画
    sea.mesh.rotation.z += 0.005;
    sea.wave();
    scoreDOM.innerText = '鼠标点击切换人物\n按任意键开始';
    if (OPTIONS.player === 0) {
      describeDOM.innerText = '海豚体型小巧，速度较快，不易触碰水雷\n但每次获取的绿色能量较少';
    } else if (OPTIONS.player === 1) {
      describeDOM.innerText = '鲨鱼体型巨大，速度较慢，较易触碰水雷\n但每次获取的绿色能量会有一定加成';
    }
    renderer.render(scene, camera);
  } else if (OPTIONS.status === 'play') {
    requestAnimationFrame(loop);
    const deltaTime = clock.getDelta();
    // player移动
    if (OPTIONS.player === 0) {
      playerObj.position.x += 2 * mousePos.x;
      playerObj.position.y -= 2 * mousePos.y;
    } else if (OPTIONS.player === 1) {
      playerObj.position.x += 1.5 * mousePos.x;
      playerObj.position.y -= 1.5 * mousePos.y;
    }
    // player动画
    for (let i = 0; i < mixers.length; i ++) {
      mixers[i].update(deltaTime);
    }
    // 海洋动画
    sea.mesh.rotation.z += 0.005;
    sea.wave();
    // 绿色小球旋转
    greenBalls.update(deltaTime);
    // 红色小球旋转
    redBall.update(deltaTime);
    if (OPTIONS.score < 0) {
      OPTIONS.status = 'start';
      OPTIONS.score = 0;
      // 归位
      playerObj.position.x = 0;
      playerObj.position.y = 50;
    }
    scoreDOM.innerText = '分数 ' + OPTIONS.score;
    renderer.render(scene, camera);
  }
}

// 交互
function handleMouseClick(event) {
  if (OPTIONS.status === 'start') {
    // 选择玩家
    if (OPTIONS.player === 0) {
      OPTIONS.player = 1;
      player = new Player();
    } else if (OPTIONS.player === 1) {
      OPTIONS.player = 0;
      player = new Player();
    }
  }
}

function handleKeyDown(event) {
  if (OPTIONS.status === 'start') {
    describeDOM.innerText = '';
    OPTIONS.status = 'play';
  }
}

function handleMouseMove(event) {
  if (OPTIONS.status === 'play') {
    // -1到1之间
    const tx = -1 + (event.clientX / WIDTH) * 2;
    const ty = -1 + (event.clientY / HEIGHT) * 2;
    mousePos.x = tx;
    mousePos.y = ty;
  }
}

function init() {
  document.addEventListener('mousedown', handleMouseClick, false);
  document.addEventListener('keydown', handleKeyDown, false);
  document.addEventListener('mousemove', handleMouseMove, false);
  scoreDOM = document.getElementById('score');
  describeDOM = document.getElementById('describe');
  createScene();
  createLights();
  createObject();
}

window.addEventListener('load', init, false);