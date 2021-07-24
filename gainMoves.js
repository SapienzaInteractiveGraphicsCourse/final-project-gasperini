//TO DO :
// BABYLON and GAME VARIABLES  
var canvas = null;
var engine = null;
var scene = null;
var sceneToRender = null;
var advancedTexture;
var shadowGenerator;
var time; 

var createDefaultEngine = function() { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false}); };

const createScene =  () => {
  //SCENE
  const scene = new BABYLON.Scene(engine);

  //CAMERA
  var camera = new BABYLON.ArcRotateCamera("camera1",  0, 0, 20, new BABYLON.Vector3(0, 0, 0), scene);
  camera.setPosition(new BABYLON.Vector3(0, 40, 90));
  camera.attachControl(canvas, true);	  
  //camera.wheelPrecision = 5; //Mouse wheel speed

  //VIRTUAL CLICK
  setTimeout(function() { 
    const canvas = scene.getEngine().getRenderingCanvas()
    canvas.tabIndex = -1;
    canvas.focus();
    const clickEvent = document.createEvent("MouseEvent");
    clickEvent.initEvent("mousedown", true, true);
    canvas.dispatchEvent(clickEvent)
  }, 1);
   
  //LIGHTS
  var light1 = new BABYLON.DirectionalLight("light1", new BABYLON.Vector3(1, 2, 0), scene);
  var light2 = new BABYLON.HemisphericLight("light2", new BABYLON.Vector3(0, 1, 0), scene);
  light2.intensity = 0.75;  
  var light3 = new BABYLON.PointLight("light3", new BABYLON.Vector3(200,700,-100), scene);

  //SKYBOX
  const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:700}, scene);
  const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox", scene);
  skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
  skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
  skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
  skybox.material = skyboxMaterial;

  //GUI - INSTRUCTIONS ON SCREEN  
  advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
  var instructions = new BABYLON.GUI.TextBlock();
  instructions.text = "Move: space bar, Steering: A/D keys, Camera: mouse/arrows";
  instructions.color = "white";
  instructions.fontSize = 16;
  instructions.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
  instructions.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
  advancedTexture.addControl(instructions);
  

  //GROUND
  var groundSize = 400;
  var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: groundSize, height: groundSize}, scene);
  //var groundMaterial = new BABYLON.StandardMaterial("ground", scene);
  //groundMaterial.diffuseColor = new BABYLON.Color3(0.75, 1, 0.25);
  //ground.material = groundMaterial;
  ground.position.y = -1.5;

  
  //Create terrain material
  var terrainMaterial = new BABYLON.TerrainMaterial("terrainMaterial", scene);
  terrainMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  terrainMaterial.specularPower = 100;

  terrainMaterial.mixTexture = new BABYLON.Texture("textures/mixMap.png", scene);
  // Diffuse textures following the RGB values of the mix map
  // diffuseTexture1: Red
  // diffuseTexture2: Green
  // diffuseTexture3: Blue
  terrainMaterial.diffuseTexture1 = new BABYLON.Texture("textures/grass.png", scene);
  terrainMaterial.diffuseTexture2 = new BABYLON.Texture("textures/grass.png", scene);
  terrainMaterial.diffuseTexture3 = new BABYLON.Texture("textures/grass.png", scene);
  
  //Bump textures according to the previously set diffuse textures
  terrainMaterial.bumpTexture1 = new BABYLON.Texture("textures/grassn.png", scene);
  terrainMaterial.bumpTexture2 = new BABYLON.Texture("textures/grassn.png", scene);
  terrainMaterial.bumpTexture3 = new BABYLON.Texture("textures/grassn.png", scene);
 
  // Rescale textures according to the terrain
  terrainMaterial.diffuseTexture1.uScale = terrainMaterial.diffuseTexture1.vScale = 10;
  terrainMaterial.diffuseTexture2.uScale = terrainMaterial.diffuseTexture2.vScale = 10;
  terrainMaterial.diffuseTexture3.uScale = terrainMaterial.diffuseTexture3.vScale = 10; 

  ground.material = terrainMaterial;

  
  //Shadows
  //var torus  = BABYLON.MeshBuilder.CreateTorus("prova", {diameter: 10, thickness:5}, scene);
  //torus.position.y = 19;
	shadowGenerator = new BABYLON.ShadowGenerator(1024, light3);
	ground.receiveShadows = true;

  //KEY CONTROLS 
  var map ={}; 
  scene.actionManager = new BABYLON.ActionManager(scene);
 
  scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {								
    map[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    
  }));
  
  scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {								
    map[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
  }));	
  
  //VARIABLES FOR CAR ANIMATION 
  var theta = 0;
  var deltaTheta = 0;
  var D = 0; //distance translated per second
  var R = 50; //turning radius, initial set at pivot z value
  var NR; //Next turning radius on wheel turn
  var A = 4; //distance between wheel pivots
  var L = 4; // axel length
  var r = 1.5; // wheel radius
  var psi, psiRI, psiRO, psFI, psiFO; //wheel rotations  
  var phi; //rotation of car when turning 
  
  var F; // frames per second	
  
  //CAR
  const values = buildCar(scene);
  const pivot = values[0]; 
  const carBody = values[1];
  const pivotFI = values[2];
  const pivotFO = values[3];
  const wheelFI = values[4];
  const wheelFO = values[5];
  const wheelRI = values[6];
  const wheelRO = values[7];

  //CAR ANIMATION
  scene.registerAfterRender(function() {	
    F = engine.getFps();

    if(map[" "] && D < 15 ) {
      D += 1;		
    };
    
    if(D > 0.15) {
      D -= 0.15;
    } 
    else {
      D = 0;
    }
          
    distance = D/F;
    psi = D/(r * F);
    
    if((map["a"] || map["A"]) && -Math.PI/6 < theta) {
      deltaTheta = -Math.PI/100;
      theta += deltaTheta;
      pivotFI.rotate(BABYLON.Axis.Y, deltaTheta, BABYLON.Space.LOCAL);
      pivotFO.rotate(BABYLON.Axis.Y, deltaTheta, BABYLON.Space.LOCAL);
      if(Math.abs(theta) > 0.00000001) {
        NR = A/2 +L/Math.tan(theta);	
      }
      else {
        theta = 0;
        NR = 0;
      }
      pivot.translate(BABYLON.Axis.Z, NR - R, BABYLON.Space.LOCAL);
      carBody.translate(BABYLON.Axis.Z, R - NR, BABYLON.Space.LOCAL);
      R = NR;
                  
    };
      
    if((map["d"] || map["D"])  && theta < Math.PI/6) {
      deltaTheta = Math.PI/100;
      theta += deltaTheta;
      pivotFI.rotate(BABYLON.Axis.Y, deltaTheta, BABYLON.Space.LOCAL);
      pivotFO.rotate(BABYLON.Axis.Y, deltaTheta, BABYLON.Space.LOCAL);
      if(Math.abs(theta) > 0.00000001) {
        NR = A/2 +L/Math.tan(theta);	
      }
      else {
        theta = 0;
        NR = 0;
      }
      pivot.translate(BABYLON.Axis.Z, NR - R, BABYLON.Space.LOCAL);
      carBody.translate(BABYLON.Axis.Z, R - NR, BABYLON.Space.LOCAL);
      R = NR;
          
    };
    
    if(D > 0) {
      phi = D/(R * F);
      if(Math.abs(theta)>0) {	 
        pivot.rotate(BABYLON.Axis.Y, phi, BABYLON.Space.WORLD);
        psiRI = D/(r * F);
        psiRO = D * (R + A)/(r * F);
        psiFI = D * Math.sqrt(R* R + L * L)/(r * F);
        psiFO = D * Math.sqrt((R + A) * (R + A) + L * L)/(r * F);
      
        wheelFI.rotate(BABYLON.Axis.Y, psiFI, BABYLON.Space.LOCAL); 
        wheelFO.rotate(BABYLON.Axis.Y, psiFO, BABYLON.Space.LOCAL);
        wheelRI.rotate(BABYLON.Axis.Y, psiRI, BABYLON.Space.LOCAL);
        wheelRO.rotate(BABYLON.Axis.Y, psiRO, BABYLON.Space.LOCAL);
      }
      else {
        pivot.translate(BABYLON.Axis.X, -distance, BABYLON.Space.LOCAL);
        wheelFI.rotate(BABYLON.Axis.Y, psi, BABYLON.Space.LOCAL); 
        wheelFO.rotate(BABYLON.Axis.Y, psi, BABYLON.Space.LOCAL);
        wheelRI.rotate(BABYLON.Axis.Y, psi, BABYLON.Space.LOCAL);
        wheelRO.rotate(BABYLON.Axis.Y, psi, BABYLON.Space.LOCAL);
      }
       
    }
    
  });
  
  //check if car is on ground
  ground.isPickable = true;
  const ray = new BABYLON.Ray();
  const rayHelper = new BABYLON.RayHelper(ray);
  rayHelper.attachToMesh(carBody, new BABYLON.Vector3(0, -1, 0), new BABYLON.Vector3(0, 0, 0), 4);
  scene.onBeforeRenderObservable.add(() => {
    const pick = scene.pickWithRay(ray, (mesh) => {
      return mesh === ground;
    }, true);
    if (!pick.hit) {
      carBody.position.y -= 1;
      if(carBody.position.y <-10){
        time = 0;
      }
    }
  }); 

  //GAME FUNCTION
  game(scene, ground, carBody);

  return scene;
}

/*--------------START FUNCTIONS --------------------------*/

window.initFunction = async function() {               
  var asyncEngineCreation = async function() {
    try {
      return createDefaultEngine();
    } catch(e) {
      console.log("the available createEngine function failed. Creating the default engine instead");
      return createDefaultEngine();
    }
  }
  window.engine = await asyncEngineCreation();
  if (!engine) throw 'engine should not be null.';
  window.scene = createScene();
};


window.onload = function init(){
  document.body.style.zoom = "140%";
  
  canvas = document.getElementById("renderCanvas");

  var game_tictactoe = localStorage.getItem("game_tictactoe");
  game_tictactoe = JSON.parse(game_tictactoe);
  if(game_tictactoe=== null
	  ||typeof(game_tictactoe.bool_isfirstplayer) == "undefined"){

		window.location.href = "beforeGame.html";
  }

  initFunction().then(() => {sceneToRender = scene        
    engine.runRenderLoop(function () {
        if (sceneToRender && sceneToRender.activeCamera) {
          sceneToRender.render();
        }
    });
  });

  // Resize
  window.addEventListener("resize", function () {
    engine.resize();
  });
}

/*-------------- END START FUNCTIONS --------------------------*/

//CAR STRUCTURE
const buildCar = (scene) => {
  //CAR BODY
  //Car Body Material 
  var bodyMaterial = new BABYLON.StandardMaterial("body_mat", scene);
  bodyMaterial.diffuseTexture = new BABYLON.Texture("textures/albedo.png.jpg");
  bodyMaterial.backFaceCulling = false;

  //trapezium side of car
  var side = [new BABYLON.Vector3(-6.5, 2.5, -2),
    new BABYLON.Vector3(2.5, 2.5, -2),
    new BABYLON.Vector3(3.5, 0.5, -2),
    new BABYLON.Vector3(-9.5, 0.5, -2)				
  ];

  side.push(side[0]);	

  var extrudePath = [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 4)];

  //Create car body 
  var carBody = BABYLON.MeshBuilder.ExtrudeShape("body", {shape: side, path: extrudePath, cap : BABYLON.Mesh.CAP_ALL}, scene);
  carBody.material = bodyMaterial;

  //WHEELS 
  //Wheel Material 
  var wheelMaterial = new BABYLON.StandardMaterial("wheel_mat", scene);
  var wheelTexture = new BABYLON.Texture("textures/wheel.png", scene);
  wheelMaterial.diffuseTexture = wheelTexture;

  var faceColors=[];
  faceColors[1] = new BABYLON.Color3(0,0,0);

  //set texture for flat face of wheel 
  var faceUV =[];
  faceUV[0] = new BABYLON.Vector4(0,0,1,1);
  faceUV[2] = new BABYLON.Vector4(0,0,1,1);

  
  var wheelFI = BABYLON.MeshBuilder.CreateCylinder("wheelFI", {diameter: 3, height: 1, tessellation: 24, faceColors:faceColors, faceUV:faceUV}, scene);
  wheelFI.material = wheelMaterial; 
  wheelFI.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.WORLD); 	
  
  //pivots front wheels 
  var pivotFI = new BABYLON.Mesh("pivotFI", scene);
  //var pivotFI = new BABYLON.MeshBuilder.CreateBox("pivotFI", {size: 2}, scene);
  pivotFI.parent = carBody;
  pivotFI.position = new BABYLON.Vector3(-6.5, 0, -2);

  var pivotFO = new BABYLON.Mesh("pivotFO", scene);
  pivotFO.parent = carBody;
  pivotFO.position = new BABYLON.Vector3(-6.5, 0, 2);  
  
  //instantiate wheels 
  var wheelFO = wheelFI.createInstance("FO");
  wheelFO.parent = pivotFO;
  wheelFO.position = new BABYLON.Vector3(0, 0, 1.8);

  var wheelRI = wheelFI.createInstance("RI");
  wheelRI.parent = carBody;
  wheelRI.position = new BABYLON.Vector3(0, 0, -2.8);

  var wheelRO = wheelFI.createInstance("RO");
  wheelRO.parent = carBody;
  wheelRO.position = new BABYLON.Vector3(0, 0, 2.8);

  wheelFI.parent = pivotFI;
  wheelFI.position = new BABYLON.Vector3(0, 0, -1.8);
  
  //car centre of rotation
  pivot = new BABYLON.Mesh("pivot", scene); //current centre of rotation
  //var pivot = new BABYLON.MeshBuilder.CreateBox("pivot", {size: 1}, scene);
  pivot.position.z = 50;
  carBody.parent = pivot;
  carBody.position = new BABYLON.Vector3(0, 0, -50);

  //cup 
  const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 8, slice: 0.4, sideOrientation: BABYLON.Mesh.DOUBLESIDE});
  const sphereMat = new BABYLON.StandardMaterial("sphereMat");
  sphereMat.diffuseTexture = new BABYLON.Texture("textures/albedo.png.jpg");
  sphere.material = sphereMat;
  sphere.parent = carBody;
  sphere.rotation.x = -Math.PI;
  sphere.position.y = 6.59;
  sphere.position.x = -2;

  return [pivot, carBody, pivotFI, pivotFO, wheelFI, wheelFO, wheelRI, wheelRO];
}


function game(scene, ground, carBody){ 

  // Particle system
  var box = BABYLON.MeshBuilder.CreateTorus("b", {diameter: 2, thickness:2}, scene);  
  var particleNb = 200;
  var SPS = new BABYLON.SolidParticleSystem('SPS', scene, {particleIntersection: true});
  SPS.addShape(box, particleNb);
  box.dispose();
  var mesh = SPS.buildMesh();
  SPS.isAlwaysVisible = true;  
  
  //origin
  mesh.position.y = 80.0;
  mesh.position.x = -70.0; 

  // Shadows
  shadowGenerator.addShadowCaster(mesh);
  shadowGenerator.addShadowCaster(carBody);
	shadowGenerator.useExponentialShadowMap = true;

  // shared variables
  var count = -200;
  var speed = 1.9;                  // particle max speed
  var cone = 2.3;                   // emitter aperture
  var gravity = -speed / 100;       // gravity
  var sign = 1;                     // current dot product

  //COUNTER PANEL  
  var elements_counter = createRectangle();
  var countPanel = elements_counter[0];
  var text_countPanel = elements_counter[1];
  countPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  countPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_UP;
  text_countPanel.text = "Count: 0";


  // SPS initialization 
  SPS.initParticles = function() {
    for (var p = 0; p < SPS.nbParticles; p++) {
      SPS.recycleParticle(SPS.particles[p]);
    }
  };

  // recycle : reset the particle at the emitter origin
  SPS.recycleParticle = function(particle) {
    particle.position.x = 0;
    particle.position.y = 0;
    particle.position.z = 0;
    particle.velocity.x = Math.random() * speed;
    particle.velocity.y = (Math.random() - 0.3) * cone * speed;
    particle.velocity.z = (Math.random() - 0.5) * cone * speed;
    
    particle.rotation.x = Math.random() * Math.PI;
    particle.rotation.y = Math.random() * Math.PI;
    particle.rotation.z = Math.random() * Math.PI;
    
    particle.color.r = 1.0;
    particle.color.g = 0.0;
    particle.color.b = 1.0;
    particle.color.a = 1.0;
  };


  // particle behavior
  SPS.updateParticle = function(particle) {  

    // recycle if touched the ground
    if ((particle.position.y + mesh.position.y) < ground.position.y) {
      this.recycleParticle(particle);
    }
    
    // update velocity, rotation and position
    particle.velocity.y += gravity;                         // apply gravity to y
    (particle.position).addInPlace(particle.velocity);      // update particle new position
    sign = (particle.idx % 2 == 0) ? 1 : -1;                // rotation sign and then new value
    particle.rotation.z += 0.1 * sign;
    particle.rotation.x += 0.05 * sign;
    particle.rotation.y += 0.008 * sign;

    mesh.computeWorldMatrix();
    carBody.computeWorldMatrix();

    //check intersection between particles and car
    if (particle.intersectsMesh(carBody)) { 
      count++;
      //console.log(count);
      if(count > 0){
        text_countPanel.text = "Count: " + count.toString(); 
      }
    }
  };
 
  SPS.initParticles();
 
  scene.registerBeforeRender(function() {
    SPS.setParticles();
  });

  //TIMER
  time = 40;
  var elements_timer = createRectangle();
  var timerPanel = elements_timer[0];
  var text_timerPanel = elements_timer[1];
  timerPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
  timerPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT; 

  timerPanel.width = 0.15;
  timerPanel.height = "40px"; 
  timerPanel.color = "black"; 
  timerPanel.background = "grey"; 


  scene.onBeforeRenderObservable.add((thisScene, state) => {
    if (!thisScene.deltaTime) return;
    time -= (thisScene.deltaTime / 1000);
    text_timerPanel.text = "Time left: " +  String(Math.round(time));

    if(Math.round(time) === 0 || time < 0){ //time over
      var game_tictactoe = localStorage.getItem("game_tictactoe");
      game_tictactoe = JSON.parse(game_tictactoe);
      if(game_tictactoe.bool_isfirstplayer){
        game_tictactoe.bool_isfirstplayer = 0;
        game_tictactoe.movesPlayer1 = count ;
        localStorage.game_tictactoe = JSON.stringify(game_tictactoe); 
        
        window.location.href='playGame.html'; 
      }
      else{
        game_tictactoe.movesPlayer2 = count ;
        localStorage.game_tictactoe = JSON.stringify(game_tictactoe);
            
        window.location.href='tic_tac_toe.html'; 
      }
    }
  });
}


//CREATE PANLES 
var createRectangle = function() {
  var rect1 = new BABYLON.GUI.Rectangle();
  rect1.width = 0.2;
  rect1.height = "40px";
  rect1.cornerRadius = 20;
  rect1.color = "Orange";
  rect1.thickness = 4;
  rect1.background = "green";
  advancedTexture.addControl(rect1);  
  
  var text1 = new BABYLON.GUI.TextBlock();
  text1.text = "Timer";
  text1.color = "white";
  text1.fontSize = 16;
  rect1.addControl(text1);    
  text1.onLinesReadyObservable.add(()=>{
      var textHeight = (text1.fontOffset.height) * text1.lines.length;
      var ratioHeights = text1.parent.heightInPixels/textHeight;
      var textWidth = text1.lines[0].width;
      var ratioWidths = text1.parent.widthInPixels/textWidth;              
      if(ratioWidths < 1) {
          text1.fontSize = parseFloat(text1.fontSizeInPixels) * ratioWidths + "px";
      }
  });
  return [rect1, text1];
}