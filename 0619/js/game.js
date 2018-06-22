// 参数
const OPTIONS = {
  // 分数
  score: 0,
  // 哪个模型
  player: 0,
  // 模型缩放比例
  objScale: [0.1, 0.08],
  // 包围盒
  objBoundary: [[40, 20], []],
  // 海洋滚筒半径
  seaRadius: 600,
  // 蓝球生成间隔
  blueBallGeneTime: 5,
  // 蓝球角速度
  angleSpeed: 0.2,
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
  // camera.position.z = 2000;
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
const Player = function () {
  const loader = new THREE.FBXLoader();
  loader.load('assets/models/Player' + OPTIONS.player + '.fbx', function (object) {
    playerObj = object;
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
    scene.add(object);
    // 载入obj后动画循环
    loop();
  });
};

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

const Enemy = function () {

};

const RedBall = function() {
  const geom = new THREE.TetrahedronGeometry(8,2);
  const mat = new THREE.MeshPhongMaterial({
    color: COLORS.red,
    shininess: 0,
    specular: 0xffffff
  });
  mat.flatShading = true;
  this.mesh = new THREE.Mesh(geom, mat);
  this.angle = 0;
  this.dist = 0;
}

const RedBallsHolder = function () {
  this.mesh = new THREE.Object3D();
  this.ballsInUse = [];
}

RedBallsHolder.prototype.generate = function () {
  for (let i = 0; i < 10; i++) {
    var ennemy;
    if (ennemiesPool.length) {
      ennemy = ennemiesPool.pop();
    } else {
      ennemy = new Ennemy();
    }

    ennemy.angle = - (i*0.1);
    ennemy.distance = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight-20);
    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;

    this.mesh.add(ennemy.mesh);
    this.ennemiesInUse.push(ennemy);
  }
}

RedBallsHolder.prototype.rotate = function () {
  for (var i=0; i<this.ennemiesInUse.length; i++){
    var ennemy = this.ennemiesInUse[i];
    ennemy.angle += game.speed*deltaTime*game.ennemiesSpeed;

    if (ennemy.angle > Math.PI*2) ennemy.angle -= Math.PI*2;

    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;
    ennemy.mesh.rotation.z += Math.random()*.1;
    ennemy.mesh.rotation.y += Math.random()*.1;

    //var globalEnnemyPosition =  ennemy.mesh.localToWorld(new THREE.Vector3());
    var diffPos = airplane.mesh.position.clone().sub(ennemy.mesh.position.clone());
    var d = diffPos.length();
    if (d<game.ennemyDistanceTolerance){
      particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, COLORS.red, 3);

      ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
      this.mesh.remove(ennemy.mesh);
      game.planeCollisionSpeedX = 100 * diffPos.x / d;
      game.planeCollisionSpeedY = 100 * diffPos.y / d;
      ambientLight.intensity = 2;

      removeEnergy();
      i--;
    }else if (ennemy.angle > Math.PI){
      ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
      this.mesh.remove(ennemy.mesh);
      i--;
    }
  }
}

Particle = function(){
  var geom = new THREE.TetrahedronGeometry(3,0);
  var mat = new THREE.MeshPhongMaterial({
    color:0x009999,
    shininess:0,
    specular:0xffffff,
    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
}

Particle.prototype.explode = function(pos, color, scale){
  var _this = this;
  var _p = this.mesh.parent;
  this.mesh.material.color = new THREE.Color( color);
  this.mesh.material.needsUpdate = true;
  this.mesh.scale.set(scale, scale, scale);
  var targetX = pos.x + (-1 + Math.random()*2)*50;
  var targetY = pos.y + (-1 + Math.random()*2)*50;
  var speed = .6+Math.random()*.2;
  TweenMax.to(this.mesh.rotation, speed, {x:Math.random()*12, y:Math.random()*12});
  TweenMax.to(this.mesh.scale, speed, {x:.1, y:.1, z:.1});
  TweenMax.to(this.mesh.position, speed, {x:targetX, y:targetY, delay:Math.random() *.1, ease:Power2.easeOut, onComplete:function(){
      if(_p) _p.remove(_this.mesh);
      _this.mesh.scale.set(1,1,1);
      particlesPool.unshift(_this);
    }});
}

ParticlesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.particlesInUse = [];
}

ParticlesHolder.prototype.spawnParticles = function(pos, density, color, scale){

  var nPArticles = density;
  for (var i=0; i<nPArticles; i++){
    var particle;
    if (particlesPool.length) {
      particle = particlesPool.pop();
    }else{
      particle = new Particle();
    }
    this.mesh.add(particle.mesh);
    particle.mesh.visible = true;
    var _this = this;
    particle.mesh.position.y = pos.y;
    particle.mesh.position.x = pos.x;
    particle.explode(pos,color, scale);
  }
}

let greenBallsMesh;
const GreenBalls = function () {
  // 生成一排绿色球
  this.mesh = new THREE.Object3D();
  this.meshArr = [];
  const geom = new THREE.TetrahedronGeometry(10, 0);
  const mat = new THREE.MeshPhongMaterial({
    color: 0x00CD66,
    shininess: 0,
    specular: 0xffffff
  });
  mat.flatShading = true;
  // 每次几个球
  const count = 2;
  const ANGLE = Math.PI / 36;
  const h = 650;
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
  greenBallsMesh = this.mesh;
  scene.add(this.mesh);
}

GreenBalls.prototype.generate = function () {

};

GreenBalls.prototype.update = function (deltaTime) {
  // greenBallsMesh.rotation.z += deltaTime * OPTIONS.angleSpeed;
  // console.log(greenBallsMesh.rotation.z)
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
        // this.meshArr.splice(i, 1);
        this.mesh.remove(this.meshArr[i]);
        this.meshArr.shift();
        break;
    }
  }
};

// GreenBalls.prototype.remove = function () {

// };

const greenBallsArr = [];
const GreenBallsHolder = function () {
  this.mesh = new THREE.Object3D();
  // 总共多少能量球带
  const count = 10;
  const ANGLE = 2 * Math.PI / count;
  for (let i = 0; i < count; i++) {
    const greenBalls = new GreenBalls();
    const h = 650;
    greenBalls.mesh.position.y = Math.sin(ANGLE * i) * h;
    greenBalls.mesh.position.x = Math.cos(ANGLE * i) * h;
    greenBalls.mesh.position.z = 0;
    greenBalls.mesh.rotation.z = ANGLE * i + Math.PI/2;
    greenBallsArr.push(greenBalls);
    this.mesh.add(greenBalls.mesh);
  }
  // 在滚筒上方
  this.mesh.position.y = -600;
  scene.add(this.mesh);
}

GreenBallsHolder.prototype.update = function () {
  const count = greenBallsArr.length;
  for (let i = 0; i < count; i++) {
    greenBallsArr[i].update();
  }
};

GreenBallsHolder.prototype.generate = function() {
  // 生成数量
  // var nCoins = 1 + Math.floor(Math.random()*10);
  const count = 3;

  // var d = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight-20);
  // var amplitude = 10 + Math.round(Math.random()*10);
  for (let i=0; i < count; i++){
    var coin;
    if (this.coinsPool.length) {
      coin = this.coinsPool.pop();
    }else{
      coin = new Coin();
    }
    this.mesh.add(coin.mesh);
    this.coinsInUse.push(coin);
    // coin.angle = - (i*0.02);
    // coin.distance = Math.cos(i*.5)*amplitude;
    coin.mesh.position.y = OPTIONS.seaRadius;
    // coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
  }
}

GreenBallsHolder.prototype.rotate = function(){
  // for (let i = 0; )
  for (let i = 0; i < this.coinsInUse.length; i++){
    var coin = this.coinsInUse[i];
    if (coin.exploding) continue;
    // coin.angle += game.speed*deltaTime*game.coinsSpeed;
    if (coin.angle>Math.PI*2) coin.angle -= Math.PI*2;
    // coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle)*coin.distance;
    // coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
    coin.mesh.rotation.z += Math.random()*.1;
    coin.mesh.rotation.y += Math.random()*.1;

    //var globalCoinPosition =  coin.mesh.localToWorld(new THREE.Vector3());
    // var diffPos = airplane.mesh.position.clone().sub(coin.mesh.position.clone());
    // var d = diffPos.length();
    // if (d<game.coinDistanceTolerance){
    //   this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
    //   this.mesh.remove(coin.mesh);
    //   particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, 0x009999, .8);
    //   addEnergy();
    //   i--;
    // }else if (coin.angle > Math.PI){
    //   this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
    //   this.mesh.remove(coin.mesh);
    //   i--;
    // }
  }
}

// 创建对象
const redBalls = [];
function createRedBall() {
  for (let i = 0; i < 10; i++){
    const redBall = new RedBall();
    redBalls.push(redBall);
  }
  redBallsHolder = new RedBallsHolder();
  scene.add(redBallsHolder.mesh)
}

function creacreateBlueBalls() {


}

function createEnnemies(){
  for (var i=0; i<10; i++){
    var ennemy = new Ennemy();
    ennemiesPool.push(ennemy);
  }
  ennemiesHolder = new EnnemiesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(ennemiesHolder.mesh)
}

function createParticles(){
  for (var i=0; i<10; i++){
    var particle = new Particle();
    particlesPool.push(particle);
  }
  particlesHolder = new ParticlesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(particlesHolder.mesh)
}


let player;
let sea;
let greenBallsHolder;
// let background;
function createObject() {
  // 玩家
  player = new Player();
  // 海洋滚筒
  sea = new Sea();
  // background = new Background();
  // 蓝色球
  greenBalls = new GreenBalls();
  // 红球
  // createRedBall();
  // 粒子碎片
  // createParticles();
}

// 动画循环
const clock = new THREE.Clock();
let lastClock = 1;
function loop() {
  requestAnimationFrame(loop);
  // console.log(clock.getElapsedTime())
  const deltaTime = clock.getDelta();
  // const elapsedTime = clock.getElapsedTime();
  // player动画
  for (let i = 0; i < mixers.length; i ++) {
    mixers[i].update(deltaTime);
  }
  // 海洋动画
  sea.mesh.rotation.z += 0.005;
  sea.wave();
  // background.rotation.z += 0.01;
  // redBallsHolder.generate();
  // 绿色小球旋转
  greenBalls.update(deltaTime);
  // greenBalls.mesh.rotation.z += 0.01;
  // console.log(playerObj.position)

  // ennemiesHolder.spawnEnnemies();
  // ennemiesHolder.rotateEnnemies();
  // if (elapsedTime > lastClock) {
  //   lastClock = elapsedTime + 1;
  //   // coinsHolder.spawnCoins();
    
  //   // playerObj.position.y += 5;
  // }
  // coinsHolder.rotateCoins();
  renderer.render(scene, camera);
}

function init() {
  // document.addEventListener('mousemove', handleMouseMove, false);
  createScene();
  createLights();
  createObject();
  // loop();
}

window.addEventListener('load', init, false);