// BABYLON and GAME VARIABLES 
var canvas = null;
var engine = null;
var scene = null;
var sceneToRender = null; 
var gameState = [];
var n;
var camera; 
var movesPlayer1 ;
var movesPlayer2 ; 
var gui
var firstPlayer;


var createDefaultEngine = function() { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false}); };

const createScene =  () => {

    //SCENE   
    var scene = new BABYLON.Scene(engine);
	scene.clearColor = new BABYLON.Color3(0.26,0.26,0.33);
	scene.enablePhysics(new BABYLON.Vector3(0, 0, 0));

    // PHISYCS ENGINE
    var physicsViewer = new BABYLON.Debug.PhysicsViewer();
    var physicsHelper = new BABYLON.PhysicsHelper(scene);
    
	//CAMERA
	camera = new BABYLON.ArcRotateCamera("Camera",-2, 1, 15, BABYLON.Vector3.Zero(), scene);	
	scene.activeCamera = camera;
    camera.attachControl(canvas, true); 
    camera.wheelPrecision = 5; //Mouse wheel speed
    
	//LIGHTS
	const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(-1, 2, -2), scene);
	const light = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 5, 0), scene);
	light.intensity = 0.75; 
	
	// PARTICLES
	var particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
	particleSystem.particleTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/flare.png");
	particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
	particleSystem.color2 = new BABYLON.Color4(0.9, 0.1, .1, 1.0);
	particleSystem.colorDead = new BABYLON.Color4(0, 0.5, 1, 0.0);
	particleSystem.minSize = 0.05;
	particleSystem.maxSize = 0.4;
	particleSystem.minLifeTime = 0.3;
	particleSystem.maxLifeTime = 1.5;
	particleSystem.emitRate = 1500;
	particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
	particleSystem.direction1 = new BABYLON.Vector3(-7, 8, 3);
	particleSystem.direction2 = new BABYLON.Vector3(7, -8, -3);
	particleSystem.minAngularSpeed = 0;
	particleSystem.maxAngularSpeed = Math.PI;
	particleSystem.minEmitPower = 1;
	particleSystem.maxEmitPower = 3;
	particleSystem.updateSpeed = 0.005;
	particleSystem.emitter = new BABYLON.Vector3(1, -1, -1);
	particleSystem.startDelay = 1500;
	
	//BIG CUBE
	const proto = BABYLON.MeshBuilder.CreateBox("proto", {
		size: 1
	}, scene); 
	proto.isVisible = false; 

	const boxPositions = new Array((n+2)*(n+2)*(n+2)); 
	var target = parseInt((n+2)/2); 
	var x = -target - 0.1*target ;
	var z = target + 0.1*target +1.1; 
	var y = target + 0.1*target +1.1;
	for(var i=0; i<((n+2)*(n+2)*(n+2)); i++){
		boxPositions[i] = new Array(3);		
		if( i % ((n+2)*(n+2)) == 0){
			y -= 1.1;
			y = parseFloat(y.toFixed(1)); 
			z = target + 0.1*target+ 1.1;
		}

		if(i % (n+2) == 0){
			x = -target - 0.1*target ;
			z -= 1.1;
			z = parseFloat(z.toFixed(1)); 
		}
		else if(i%(n+2) != 0){
			x += 1.1;  
			x = parseFloat(x.toFixed(1)); 
		}
		
		boxPositions[i][0] = x;
		boxPositions[i][1] = y;
		boxPositions[i][2] = z; 
	} 
	
	let bPos = function(fieldmesh, order) { 
		fieldmesh.position = new BABYLON.Vector3(boxPositions[order][0], boxPositions[order][1], boxPositions[order][2]);
	}	

	const clickable_boxes = new Array(n*n*6);
	var idx = 0;
	for(var k = 0; k < n+2; k++){
		for(var i = 0; i < n+2; i++){
			for(var j = 0; j < n+2; j++){
				if((k == 0 || k == n+1) && !(i == 0 || j == 0 || i == n+1 || j == n+1)){
					clickable_boxes[idx] = i*(n+2)+j+k*(n+2)*(n+2); 
					idx++;
				}
				else if(!(k == 0 || k == n+1) && ((!(i == 0 || i == n+1) && (j == 0 || j == n+1))||((i == 0 || i == n+1) && !(j == 0 || j == n+1)))){
					clickable_boxes[idx] = i*(n+2)+j+k*(n+2)*(n+2); 
					idx++;
				}
			}
		}
	}

	const position_pieces_boxes = new Array(6); 
	//0:Top - 1:Bottom - 2: Left - 3:Right - 4:Front - 5:Back 
	for(var z= 0; z<6; z++){
		position_pieces_boxes[z] = [];
	} 
	for(var k = 0; k < n+2; k++){
		for(var i = 0; i < n+2; i++){
			for(var j = 0; j < n+2; j++){
				if(k == 0){
					position_pieces_boxes[0].push(i*(n+2)+j+k*(n+2)*(n+2));
				}
				else if(k == n+1){
					position_pieces_boxes[1].push(i*(n+2)+j+k*(n+2)*(n+2));
				}

				if(j == 0){
					position_pieces_boxes[2].push(i*(n+2)+j+k*(n+2)*(n+2));
				}
				else if(j == n+1){
					position_pieces_boxes[3].push(i*(n+2)+j+k*(n+2)*(n+2));
				}
				if(i == 0){
					position_pieces_boxes[5].push(i*(n+2)+j+k*(n+2)*(n+2));
				}
				else if(i == n+1){
					position_pieces_boxes[4].push(i*(n+2)+j+k*(n+2)*(n+2));
				} 
			}
		}
	} 

	const ordered_conditions = []; 
	for(var z= 0; z<6; z++){
		var arr = [];
		for(var i = 0; i< (n+2)*(n+2); i++){
			if(clickable_boxes.includes(position_pieces_boxes[z][i])){
				arr.push(position_pieces_boxes[z][i]);
			}
			if(arr.length == n){
				ordered_conditions.push(arr);
				arr = [];
			}
		}
	}  

	//cubes materials 
	var mat_click = new BABYLON.StandardMaterial("mat_click");
	var mat_noclick = new BABYLON.StandardMaterial("mat_noclick");
	
	mat_click.diffuseColor = new BABYLON.Color3(0.3, 0.23, 0.89);
	mat_noclick.diffuseColor = new BABYLON.Color3(1, 0.23, 0.89);

	var hl = new BABYLON.HighlightLayer("hl1", scene);	//glow cubes

	const boxes = new Array((n+2)*(n+2)*(n+2) + 64 + 20);
	var boxImpostorParams = { mass: 1, restitution: 0, friction: 1 };
	for(var i = 0; i< (n+2)*(n+2)*(n+2); i++){
		boxes[i] = proto.clone("box"+i);
		boxes[i].isVisible = true;
		if(!clickable_boxes.includes(i)){ 
			boxes[i].material = mat_noclick;
		}
		else{
			boxes[i].material = mat_click;
		}
		
		bPos(boxes[i],i);
		boxes[i].physicsImpostor = new BABYLON.PhysicsImpostor(boxes[i], BABYLON.PhysicsImpostor.BoxImpostor, boxImpostorParams, scene);
	} 

	target = target*(n+2)+target+target*(n+2)*(n+2); 
		
	var centerEmpty = new BABYLON.Mesh("emptymesh", scene);
	centerEmpty.position = new BABYLON.Vector3(boxes[target].position.x, boxes[target].position.y, boxes[target].position.z);
	
	for(var i = 0; i< (n+2)*(n+2)*(n+2); i++){
		boxes[i].parent= centerEmpty;	
	} 

	//LETTERS FOR FINAL ANIMATION
	const letterPositions = [
		//P 10
		[-15,0,5],
		[-15,0,3.8],
		[-15,0,2.6],
		[-15,0,1.4],
		[-15,0,0.2],
		[-13.8,0,5],
		[-12.6,0,5],
		[-12.6,0,3.8],
		[-12.6,0,2.6],
		[-13.8,0,2.6],
		//L 7
		[-10,0,5],
		[-10,0,3.8],
		[-10,0,2.6],
		[-10,0,1.4],
		[-10,0,0.2],
		[-8.8,0,0.2],
		[-7.6,0,0.2],

		//A 14
		[-5,0,5],
		[-5,0,3.8],
		[-5,0,2.6],
		[-5,0,1.4],
		[-5,0,0.2],
		[-3.8,0,5],
		[-2.6,0,5],
		[-1.4,0,5],
		[-1.4,0,3.8],
		[-1.4,0,2.6],
		[-1.4,0,1.4],
		[-1.4,0,0.2],
		[-3.8,0,1.4],
		[-2.6,0,1.4],

		//Y 11
		[1,0,5],
		[1,0,3.8],
		[1,0,2.6],
		[2.1,0,2.6],
		[3.2,0,5],
		[3.2,0,3.8],
		[3.2,0,2.6],
		[3.2,0,1.4],
		[3.2,0,0.2],
		[2.1,0,0.2],
		[1,0,0.2],

		//E 10
		[5.6,0,5],
		[5.6,0,3.8],
		[5.6,0,2.6],
		[5.6,0,1.4],
		[5.6,0,0.2],
		[6.8,0,5],
		[8,0,5],
		[6.8,0,0.2],
		[8,0,0.2],
		[6.8,0,2.6],

		//R 12
		[10.4,0,5],
		[10.4,0,3.8],
		[10.4,0,2.6],
		[10.4,0,1.4],
		[10.4,0,0.2],
		[11.6,0,5],
		[12.8,0,5],
		[12.8,0,3.8],
		[12.8,0,2.6],
		[11.6,0,2.6],
		[13.4,0,1.4],
		[14,0,0.2],

		//1 9
		[0,0,-1.8],
		[0,0,-3],
		[0,0,-4.2],
		[0,0,-5.4],
		[0,0,-6.6],
		[0,0,-7.8],
		[1.1,0,-7.8],
		[-1.1,0,-7.8],
		[-1.1,0,-2.4],

		//2 11
		[-1.1,0,-1.8],
		[0,0,-1.8],
		[1.1,0,-1.8],
		[1.1,0,-3],
		[1.1,0,-4.2],
		[0,0,-4.2],
		[-1.1,0,-4.2],
		[-1.1,0,-5.4],
		[-1.1,0,-6.6],
		[0,0,-6.6],
		[1.1,0,-6.6]
	];

	let lPos = function(fieldmesh, order) { 
		fieldmesh.position = new BABYLON.Vector3(letterPositions[order][0], letterPositions[order][2], letterPositions[order][1]);
	}
	for(var i = (n+2)*(n+2)*(n+2); i< (n+2)*(n+2)*(n+2)+64; i++){
		boxes[i] = proto.clone("box"+i);
		boxes[i].isVisible = false;
		boxes[i].isPickable = false;
		
		lPos(boxes[i],i-(n+2)*(n+2)*(n+2));
	} 

	for(var i = (n+2)*(n+2)*(n+2)+64; i< (n+2)*(n+2)*(n+2)+64+9; i++){
		boxes[i] = proto.clone("box"+i);
		boxes[i].isVisible = false;
		boxes[i].isPickable = false;
		
		lPos(boxes[i],i-(n+2)*(n+2)*(n+2));
	} 
	for(var i = (n+2)*(n+2)*(n+2)+64+9; i< (n+2)*(n+2)*(n+2)+64+9+11; i++){
		boxes[i] = proto.clone("box"+i);
		boxes[i].isVisible = false;
		boxes[i].isPickable = false;
		
		lPos(boxes[i],i-(n+2)*(n+2)*(n+2));
	} 

	//GAME PAWNS 
	// "O" 
	const torus = BABYLON.MeshBuilder.CreateTorus("torus", {
		thickness: 0.20,
		diameter: 0.75,
		tessellation: 32
	}); 
	torus.material = new BABYLON.StandardMaterial("torusmaterial");
	torus.material.diffuseColor = new BABYLON.Color3(0.6, 0.1, 0.3);
	torus.isVisible = false;

	// "X"
	let cylinder = BABYLON.MeshBuilder.CreateCylinder('cylinder', {
		height: 1,
		diameter: 0.2
	}, scene);
	let newcylinder = cylinder.clone();
	newcylinder.rotation.x = -Math.PI / 2;;
	const mesh = BABYLON.Mesh.MergeMeshes([cylinder, newcylinder]); 
	mesh.position.y = 0.1;
	mesh.material = new BABYLON.StandardMaterial("meshmaterial");
	mesh.material.diffuseColor = new BABYLON.Color3(0.2, 0.9, 0.3);
	mesh.isVisible = false;


	//BUTTONS
	gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("myUI");
	var button = BABYLON.GUI.Button.CreateSimpleButton("button", "Restart button \n Now is the turn of " + firstPlayer);
	button.top = "0";
	button.left = "0";
    button.verticalAlignment = 0;
  	button.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT; 
	button.width = "300px";
	button.height = "60px";
	button.cornerRadius = 10;
	button.thickness = 4;
	button.children[0].color = "#FFFFFF";
	button.children[0].fontSize = 22;
	button.color = "#424254" ;//"#FF7979";
	button.background = "#EB4D4B";
	gui.addControl(button);

	var button_home = BABYLON.GUI.Button.CreateSimpleButton("button_home", "Home");
	button_home.top = "0";
	button_home.left = "0";
    button_home.verticalAlignment = 0;
	button_home.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT; 
	button_home.width = "150px";
	button_home.height = "60px";
	button_home.cornerRadius = 10;
	button_home.thickness = 4;
	button_home.children[0].color = "#424254";
	button_home.children[0].fontSize = 22;
	button_home.color = "#424254";
	button_home.background = "#CCCCD9";
	gui.addControl(button_home);	
	button_home.onPointerClickObservable.add(function() {
		window.location.href='beforeGame.html';;
	});

	//PANELS
	var elements_counter = createRectangle();
	var movesPlayer1Panel = elements_counter[0];
	var text_movesPlayer1Panel = elements_counter[1];
	movesPlayer1Panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
	movesPlayer1Panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
	text_movesPlayer1Panel.text = "Moves Player 1 (X): "+ movesPlayer1.toString();

	movesPlayer1Panel.width = 0.18;
	movesPlayer1Panel.height = "40px"; 
	movesPlayer1Panel.color = "black"; 
	movesPlayer1Panel.background = "grey"; 

	elements_counter = createRectangle();
	var movesPlayer2Panel = elements_counter[0];
	var text_movesPlayer2Panel = elements_counter[1];
	movesPlayer2Panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
	movesPlayer2Panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
	text_movesPlayer2Panel.text = "Moves Player 2 (O): "+ movesPlayer2.toString();

	movesPlayer2Panel.width = 0.18;
	movesPlayer2Panel.height = "40px"; 
	movesPlayer2Panel.color = "black"; 
	movesPlayer2Panel.background = "grey"; 

	//GAME FUNCTIONS
	let currentPlayer = firstPlayer; 
	let gameActive = true;
	var winningMessage = () => `Click to play again!`;

	function handlePlayerChange() {
		currentPlayer = currentPlayer === "X" ? "O" : "X";
		if(movesPlayer1 === 0){
			currentPlayer = "O";
		}
		if(movesPlayer2 === 0){
			currentPlayer = "X";
		}
	}
	const drawMessage = () => `DRAW - Click to play again!`;

	const winningConditions = []; 

	for(var k = 0; k < n*6; k=k+n){ 
		var tmp_conditions = new Array(n+2);
		for(var z = 0; z< n+2; z++){
			tmp_conditions[z] = [];
		} 

		for(var i = k; i-k<n; i++){ 	
			for(var j = 0; j<n; j++){
				tmp_conditions[j].push(ordered_conditions[i][j]);
				if(i%n ==j){
					tmp_conditions[n].push(ordered_conditions[i][j]);
				}
				if(j+1 == n -(i%n)){
					tmp_conditions[n+1].push(ordered_conditions[i][j]);
				}
			}
			winningConditions.push(ordered_conditions[i]);
		}  

		for(var z = 0; z< n+2; z++){
			winningConditions.push(tmp_conditions[z])
		} 
	} 
	

	let dynamicText;
	let showTurn = function() {
		dynamicText = "Now is the turn of " + currentPlayer;
		button.children[0].text = dynamicText;
	}

	//check game state
	function handleResultValidation() {
		let roundWon = false;
		const allEqual = arr => arr.every( v => v === arr[0] );
		for(let i = 0; i < winningConditions.length; i++) {
			const winCondition = winningConditions[i];
			var states = [];
			for(var z = 0; z < winCondition.length; z++){
				states.push('');
			}
			for(var k = 0; k< winCondition.length; k++){
				if(gameState[winCondition[k]] === ''){
					break;
				}
				else{
					states[k] = gameState[winCondition[k]];
				}
			} 

			if(allEqual(states) && states[0] !== ''){ //if win
				roundWon = true; 
				MoveCamera(); //camera animation 
				particleSystem.start(); //particles animation							
					
				// Vortex 			
				var vortexOrigin = new BABYLON.Vector3(0, -8, 8);
				var gravitationalFieldOrigin = new BABYLON.Vector3(0, 0, 0);
				
				setTimeout(function() {
					
					for(let i = 0; i < scene.meshes.length; i++) {
						if(scene.getMeshByName("torusmain")) {
							scene.getMeshByName("torusmain").dispose();
						}
						if(scene.getMeshByName("meshmain")) {
							scene.getMeshByName("meshmain").dispose();
						}
					}
					
					var event = physicsHelper.vortex(
						vortexOrigin,
						{
							radius: 20,
							strength: 20,
							height: 20,
						}
					);
					event.enable(); //start vortex

					var event1 = physicsHelper.gravitationalField(
						gravitationalFieldOrigin,
						{
							radius: 20,
							strength: 9,
							falloff: BABYLON.PhysicsRadialImpulseFalloff.Linear,
						}
					);
					event1.enable(); //start gravitational field

					//END VORTEX
					setTimeout(function (cylinder) { 
						event.disable(); //end vortex
						event1.disable(); //end gravitational field

						//make incription visible
						for(var i = (n+2)*(n+2)*(n+2); i< (n+2)*(n+2)*(n+2)+64; i++){
							boxes[i].isVisible = true;  
						} 
						if(states[0] === 'X'){
							for(var i = (n+2)*(n+2)*(n+2)+64; i< (n+2)*(n+2)*(n+2)+64+9; i++){ 
								boxes[i].isVisible = true;  
							} 
						}
						else{
							for(var i = (n+2)*(n+2)*(n+2)+64+9; i< (n+2)*(n+2)*(n+2)+64+9+11; i++){
								boxes[i].isVisible = true;
							} 
						}				
						
						event.dispose(); 
						event1.dispose(); 
						
					}, 3000, cylinder);
					
				}, 300); 
				break;
			}
		}
		
		if(roundWon) {
			gameActive = false;
			button.children[0].text = winningMessage();
			return;
		}

		//check if draw game
		let roundDraw = true;  
		for(var i = 0; i < n*n*6; i++){
			if(gameState[clickable_boxes[i]] === ''){
				roundDraw = false;
			}
		}
		if(roundDraw || (movesPlayer1 === 0 && movesPlayer2 === 0)) {
			button.children[0].text = drawMessage();
			gameActive = false;
			return;
		}
	} 

	//FUNCTIONS HANDLING EVENTS
	scene.onPointerDown = function(evt, pickResult) {
		if(gameActive) {
			if(pickResult.hit) { 
				if(currentPlayer == "X") {
					if(pickResult.pickedMesh.name.includes("box")) {
						var str = pickResult.pickedMesh.name;
						var matches = str.match(/(\d+)/);
						var boxIndex = parseInt( matches[0], 10); 
						if(clickable_boxes.includes(boxIndex) && !gameState[boxIndex]) {
							gameState[boxIndex] = currentPlayer;
							movesPlayer1--;
							text_movesPlayer1Panel.text =  "Moves Player 1 (X): "+ movesPlayer1.toString();
							var turnMesh = mesh.createInstance("meshmain"); 
							
							//0:Top - 1:Bottom - 2: Left - 3:Right - 4:Front - 5:Back 
							for(var i = 0; i<6; i++){
								if(position_pieces_boxes[i].includes(boxIndex)){
									switch (i) {
										case 0:
											turnMesh.rotation.y = Math.PI / 4;
											turnMesh.rotation.z = -Math.PI / 2;
											turnMesh.position = new BABYLON.Vector3(boxPositions[boxIndex][0], boxPositions[boxIndex][1] + 0.5, boxPositions[boxIndex][2]);
											break;
										case 1:
											turnMesh.rotation.y = Math.PI / 4;
											turnMesh.rotation.z = -Math.PI / 2;
											turnMesh.position = new BABYLON.Vector3(boxPositions[boxIndex][0], boxPositions[boxIndex][1] - 0.5, boxPositions[boxIndex][2]);
											break;
										case 2:
											turnMesh.rotation.x = -Math.PI / 4;
											turnMesh.position = new BABYLON.Vector3(boxPositions[boxIndex][0] - 0.5, boxPositions[boxIndex][1] , boxPositions[boxIndex][2]);
											break;
										case 3:		
											turnMesh.rotation.x = -Math.PI / 4;
											turnMesh.position = new BABYLON.Vector3(boxPositions[boxIndex][0] + 0.5, boxPositions[boxIndex][1] , boxPositions[boxIndex][2]);
											break;
										case 4:
											turnMesh.rotation.y = Math.PI / 2;
											turnMesh.rotation.x = -Math.PI / 4;
											turnMesh.position = new BABYLON.Vector3(boxPositions[boxIndex][0], boxPositions[boxIndex][1] , boxPositions[boxIndex][2] - 0.5);
											break;
										case 5:
											turnMesh.rotation.y = Math.PI / 2;
											turnMesh.rotation.x = -Math.PI / 4;
											turnMesh.position = new BABYLON.Vector3(boxPositions[boxIndex][0], boxPositions[boxIndex][1] , boxPositions[boxIndex][2] + 0.5);
											break; 
									}
									break;
								}
							}
							
							let numbers = gameState;
							let result = true;
							for(let i = 0; i < numbers.length; i++) {
								if(numbers[i] == "") {
									result = false;
									break;
								}
							}
							if(gameActive) {
								if(!result) {
									handlePlayerChange(); 
								}
							}
						}
					}
				}  
				else {
					if(pickResult.pickedMesh.name.includes("box")) {
						var str = pickResult.pickedMesh.name;
						var matches = str.match(/(\d+)/);
						
						var boxIndex = parseInt( matches[0], 10); 
						if(clickable_boxes.includes(boxIndex) && !gameState[boxIndex]) {
							gameState[boxIndex] = currentPlayer;
							movesPlayer2--;
							text_movesPlayer2Panel.text =  "Moves Player 2 (O): "+ movesPlayer2.toString();
							var turnMesh = torus.createInstance("torusmain") 
							
							//0:Top - 1:Bottom - 2: Left - 3:Right - 4:Front - 5:Back 
							for(var i = 0; i<6; i++){
								if(position_pieces_boxes[i].includes(boxIndex)){
									switch (i) {
										case 0: 
											turnMesh.position = new BABYLON.Vector3(boxPositions[boxIndex][0], boxPositions[boxIndex][1] + 0.5, boxPositions[boxIndex][2]);
											break;
										case 1: 
											turnMesh.position = new BABYLON.Vector3(boxPositions[boxIndex][0], boxPositions[boxIndex][1] - 0.5, boxPositions[boxIndex][2]);
											break;
										case 2:
											turnMesh.rotation.z = -Math.PI /2;
											turnMesh.position = new BABYLON.Vector3(boxPositions[boxIndex][0] - 0.5, boxPositions[boxIndex][1] , boxPositions[boxIndex][2]);
											break;
										case 3:		
											turnMesh.rotation.z = -Math.PI /2;
											turnMesh.position = new BABYLON.Vector3(boxPositions[boxIndex][0] + 0.5, boxPositions[boxIndex][1] , boxPositions[boxIndex][2]);
											break;
										case 4: 
											turnMesh.rotation.x = -Math.PI / 2;
											turnMesh.position = new BABYLON.Vector3(boxPositions[boxIndex][0], boxPositions[boxIndex][1] , boxPositions[boxIndex][2] - 0.5);
											break;
										case 5: 
											turnMesh.rotation.x = -Math.PI / 2;
											turnMesh.position = new BABYLON.Vector3(boxPositions[boxIndex][0], boxPositions[boxIndex][1] , boxPositions[boxIndex][2] + 0.5);
											break; 
									}
									break;
								}
							}
							
							let numbers = gameState;
							let result = true;
							for(let i = 0; i < numbers.length; i++) {
								if(numbers[i] == "") {
									result = false;
									break;
								}
							}
							if(gameActive) {
								if(!result) {
									handlePlayerChange(); 
								}
							}
						}
					}
				}
				showTurn();
				handleResultValidation();

				function handleRestartGame() {
					var game_tictactoe = localStorage.getItem("game_tictactoe");
  					game_tictactoe = JSON.parse(game_tictactoe);
					game_tictactoe.firstPlayer = firstPlayer === "X" ? "O" : "X";
					localStorage.game_tictactoe = JSON.stringify(game_tictactoe);
					window.location.reload();
				}
				button.onPointerClickObservable.add(function() {
					handleRestartGame();
				});
			}  
		}
	};

	var highlighted_box = 'box0';
	scene.onPointerMove = function(evt) {
		if(gameActive) {
			var pickResult = scene.pick(scene.pointerX, scene.pointerY, null, false, camera);
			if(pickResult.hit) { 
				if(pickResult.pickedMesh.name.includes("box")) {
					var str = pickResult.pickedMesh.name;
					var matches = str.match(/(\d+)/);
					var boxIndex = parseInt( matches[0], 10); 
					if(clickable_boxes.includes(boxIndex) && !gameState[boxIndex] ) {
						hl.removeMesh(scene.getMeshByName(highlighted_box), BABYLON.Color3.White());
						hl.addMesh(scene.getMeshByName(str), BABYLON.Color3.White());
						highlighted_box = str;
					}
					else{
						hl.removeMesh(scene.getMeshByName(highlighted_box), BABYLON.Color3.White());
					}					
				}
			}
			else{
				hl.removeMesh(scene.getMeshByName(highlighted_box), BABYLON.Color3.White());
			}
		}
	};

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
  canvas = document.getElementById("renderCanvas");
 
  var game_tictactoe = localStorage.getItem("game_tictactoe");
  game_tictactoe = JSON.parse(game_tictactoe);
  if(game_tictactoe=== null
	||typeof(game_tictactoe.n) == "undefined" 
  	||typeof(game_tictactoe.movesPlayer1) == "undefined"
  	||typeof(game_tictactoe.movesPlayer2) == "undefined" 
	||typeof(game_tictactoe.firstPlayer) == "undefined"){
		window.location.href = "beforeGame.html";
  }
  n = game_tictactoe.n;
  movesPlayer1 = n*n + game_tictactoe.movesPlayer1;
  movesPlayer2 = n*n + game_tictactoe.movesPlayer2;
  
  firstPlayer = game_tictactoe.firstPlayer; 

  gameState = new Array((n+2)*(n+2)*(n+2));
  for(var i = 0; i<(n+2)*(n+2)*(n+2); i++){
	gameState[i] = "";
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


//FUNCTIONS FOR CAMERA ANIMATION
var MyPath = function (CameraPosition,GoalPosition){

	var path=[];
	for(var i=0;i<11;i++)
	{
		var directionalVector=new BABYLON.Vector3((GoalPosition.x-CameraPosition.x),(GoalPosition.y-CameraPosition.y),(GoalPosition.z-CameraPosition.z))
		var X = CameraPosition.x+directionalVector.x*0.1*i;
		var Y = CameraPosition.y+directionalVector.y*0.1*i;
		var Z = CameraPosition.z+directionalVector.z*0.1*i;
		path.push(new BABYLON.Vector3(X,Y,Z));
	}
	const catmullRom = BABYLON.Curve3.CreateCatmullRomSpline(path,20);
	return catmullRom;
}


var MoveCameraThrough = function ( scene , camera, MyCurve)
{
	const path3d = new BABYLON.Path3D(MyCurve.getPoints());
	const tangents = path3d.getTangents(); // array of tangents to the curve
	const normals = path3d.getNormals(); // array of normals to the curve
	const binormals = path3d.getBinormals(); // array of binormals to curve
	const speed = 90; 
	const animationPosition = new BABYLON.Animation('animPos', 'position', speed, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
	const animationRotation = new BABYLON.Animation('animRot', 'rotation', speed, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
	const keysPosition = [];
	const keysRotation = [];

	for (let p = 0; p < MyCurve.getPoints().length; p++) {
		keysPosition.push({
			frame: p,
			value: MyCurve.getPoints()[p]
		});
		keysRotation.push({
			frame: p,
			value: BABYLON.Vector3.RotationFromAxis(normals[p], binormals[p], tangents[p])
		});
	}
	animationPosition.setKeys(keysPosition);
	animationRotation.setKeys(keysRotation);

	camera.animations=[
		animationPosition,
		animationRotation
	];
	scene.beginAnimation(camera, 0, 200, false);
}

var MoveCamera=function(){
	var MyGoal = new BABYLON.Vector3(0,0,-30);
	var MyCurve= MyPath(camera.position,MyGoal);
	MoveCameraThrough(scene, camera, MyCurve);
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
	gui.addControl(rect1);  
	
	var text1 = new BABYLON.GUI.TextBlock();
	text1.text = "Moves Player";
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