//var socket = io();
    var config = {
        type: Phaser.WEBGL,
        width: 1280,
        height: 896, 
        pixelArt: true,
        input: {
            gamepad: true
        },
        physics: {
            default: 'matter',
            arcade: {
                tileBias: 8,
                debug: false,
                gravity: { y: 400 }
            },
            matter: {
                gravity: { y: .70 },
                positionIterations: 8, //6
                velocityIterations: 6, //4
                constraintIterations: 4 //2
            }
        },
        // Install the scene plugin
        plugins: {
            scene: [
            {
                plugin: PhaserMatterCollisionPlugin, // The plugin class
                key: "matterCollision", // Where to store in Scene.Systems, e.g. scene.sys.matterCollision
                mapping: "matterCollision" // Where to store in the Scene, e.g. scene.matterCollision
            }
            ]
        }, 
        scene: [ Preloader, SplashScene, MainMenu, IntroScene, LobbyScene, GameScene, HudScene, Storyboard, GameoverScene ]
    };
    
    //Globals
    //Global Game Access
    var buildVersion = "a-2-20-2020";
    var game;
    var hud;
    var playScene;
    var GLOBAL_DEBUG = false;
    //Physics
    var global_gravity = 400;
    //Tiles
    var map; 
    var current_map = "map4";
    var current_exit = "west1";
    var world_background;
    //Game Objects
    var solana,bright,soullight,polaris,
    enemies,enemiesFly,bullets,
    mirrors,exits,entrances,
    levers,gates,plates,buttons,platfalls,
    triggerzones,platforms,barriers,
    ab_solarblasts,crystallamps,ab_brightbeams,
    rocks,crates,npcs,spiders,boss,light_shards,
    breakabletiles,light_bursts;    
    var new_enemy;
    var spawner;
    var spawnlayer;
    //NPC Control
    var guideDialogueIndex = 0;
    var tutorialRunning = false;
    var guideStates = []; //new statedata for mapdata
    //Particles
    var emitter0;
    var emitter_dirt_spray;
    var emitter_blood;
    //HUD
    var scoreText;
    //Graphics
    var shadow_layer,shadow_context;
    var lightPolygons = [];
    var lightCanvas;
    //Shaders
    var glowPipeline;
    //Camera
    var camera_main;    
    //Controls
    var pointer;
    var prevJumpButtonPressed=false;
    var jumpTimer;
    var speed;
    var lastFired = 0;
    var gamePad = [new GamepadControl(0),new GamepadControl(0)];
    var keyPad;
    //Equipment
    var solanaEquipment = [
        {id:0,name:"Wand",lvl:0,equiped:false},
        {id:1,name:"Crown",lvl:0,equiped:false},
        {id:2,name:"Wings",lvl:0,equiped:false},
        {id:3,name:"Belt",lvl:0,equiped:false}
    ];
    //Player Management
    var playerMode = 0;//0-Single,1-LocalCoop,2-OnlineCoop
    var playerModes = ['Single','Local-COOP','Online'];
    const CTRLS={
        KB: -1,
        GP1:0,
        GP2:1
    }
    const players  = {
        SOLANA: 'Solana',
        BRIGHT: 'Bright',
        SOLANAID: 0,
        BRIGHTID: 1
    }
    const CATEGORY = {
        SOLANA: 2,
        BRIGHT: 4,
        DARK: 8,
        BULLET: 16,
        MIRROR: 32,
        BARRIER: 64,
        GROUND: 128,
        SOLID: 256,
        ENEMY: 512
    }
    const DEPTH_LAYERS = {
        BG: 10,
        FG: 600,
        ENEMIES: 200,
        PLAYERS: 300,
        FRONT: 999
    }
    const GAMEITEM = {
        WAND: 0,
        CROWN: 1,
        WING: 2,
        BELT: 3
    }
    var playerConfig = 
    [{
        id:0,
        ctrl:CTRLS.KB, // What is the index in the GAMEPAD array this is linked to?
        ctrlSN: 0, // WHat is the serial number / id?
        ctrlIndex: -1,// What is the index in the Gamepad API listing is this linked to?
        char:players.SOLANA
    },
    {
        id:1,
        ctrl:CTRLS.KB,
        ctrlSN: 0,
        ctrlIndex: -1,// What is the index in the Gamepad API listing is this linked to?
        char:players.BRIGHT
    }];
    var curr_player = playerConfig[0].char;
    var gamepadConfigs = {
        XBOX360: {
            ids:["Xbox"],
            setupButtons:  {          
                up: {i:12,s:0},
                down: {i:13,s:0},
                left: {i:14,s:0},
                right: {i:15,s:0},
                A: {i:0,s:0}, //A
                B: {i:1,s:0}, //B
                X: {i:2,s:0}, //X
                Y: {i:3,s:0}, //Y
                leftShoulder: {i:4,s:0}, //Left Shoulder
                rightShoulder: {i:5,s:0}, // Right Shoulder
                leftTrigger: {i:6,s:0}, //Left Trigger
                rightTrigger: {i:7,s:0}, // Right Trigger
                select : {i:8,s:0},
                start: {i:9,s:0},
                leftPush: {i:10,s:0},
                rightPush: {i:11,s:0}
            },
            setupAxes:{
                left : {x : 0, y : 1 },
                right: {x : 2, y : 3 }
            },
            setupAnalogDirPad: false,

        },
        GAMECUBE:{
            ids:["Wired Fight Pad","Faceoff Wired Pro"],
            setupButtons:  {      
                X: {i:0,s:0}, 
                B: {i:1,s:0}, 
                A: {i:2,s:0}, 
                Y: {i:3,s:0}, 
                leftShoulder: {i:4,s:0}, //Left Shoulder
                rightShoulder: {i:5,s:0}, // Right Shoulder
                leftTrigger: {i:6,s:0}, //Left Trigger
                rightTrigger: {i:7,s:0}, // Right Trigger
                select : {i:8,s:0},
                start: {i:9,s:0},
                leftPush: {i:10,s:0},
                rightPush: {i:11,s:0}
            },
            setupAxes:{
                left : {x : 0, y : 1 },
                right: {x : 2, y : 3 }
            },
            setupAnalogDirPad: true,
            setupDirPad: {
                up: {i:9,v:-1,s:0},
                down: {i:9,v:0.14285719394683838,s:0},
                left: {i:9,v:0.7142857313156128,s:0},
                right: {i:9,v:-0.4285714030265808,s:0},
            }

        },
        SWITCH:{
            ids:["Core \\(Plus\\) Wired Controller"],
            setupButtons:  {      
                Y: {i:0,s:0}, 
                B: {i:1,s:0}, 
                A: {i:2,s:0}, 
                X: {i:3,s:0}, 
                leftShoulder: {i:4,s:0}, //Left Shoulder
                rightShoulder: {i:5,s:0}, // Right Shoulder
                leftTrigger: {i:6,s:0}, //Left Trigger
                rightTrigger: {i:7,s:0}, // Right Trigger
                select : {i:8,s:0},//minus
                start: {i:9,s:0},//plus
                leftPush: {i:10,s:0},
                rightPush: {i:11,s:0},
                home: {i:12,s:0},//home
                circle: {i:13,s:0}//Circle
            },
            setupAxes:{
                left : {x : 0, y : 1 },
                right: {x : 2, y : 5 }
            },
            setupAnalogDirPad: true,
            setupDirPad: {
                up: {i:9,v:-1,s:0},
                down: {i:9,v:0.14285719394683838,s:0},
                left: {i:9,v:0.7142857313156128,s:0},
                right: {i:9,v:-0.4285714030265808,s:0},
            }

        }
    }
    //Global Gamepad Mozilla API functions
    // window.addEventListener("gamepadconnected", function(e) {
    //     console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
    //       e.gamepad.index, e.gamepad.id,
    //       e.gamepad.buttons.length, e.gamepad.axes.length);
    //       console.log(e.gamepad);
    //       addGamePads(new GamepadControl(e.gamepad));  
    // });
    // function getActiveMozillaGamePads(){
    //     let c=0;
    //     for(let i=0;i < navigator.getGamepads().length;i++){ 
    //         if(navigator.getGamepads()[i] != null){
    //             c++;
    //         }
    //     }
    //     return c;
    // }
    // function updateMozillaGamePads(){
    //     for(let i=0;i < gamePad.length;i++){    
    //         let ck = navigator.getGamepads()[i];
    //         if(ck == null){
    //             gamePad[i].pad = 0;
    //         }else{               
    //             gamePad[i].pad = navigator.getGamepads()[i]; 
    //         }      
                    
    //     }
    // }

    //Global Gamepad Phaser Functions
    function initGamePads(scene,callback){
        console.log("Setup GamePad for ", scene.scene.key);
        gamePad[0] = new GamepadControl(0);
        gamePad[1] = new GamepadControl(0);

        scene.input.gamepad.on('down', function (pad, button, index) {
            let iagp = getInactiveGamePad();
            if(iagp != -1){
                if(checkPadIsTaken(pad.index) == false){
                    console.log("DEBUG: NEWGP:",pad)

                    gamePad[iagp] = new GamepadControl(pad);
                    console.log(scene.scene.key,'Playing with ' + pad.id, pad.index,"Slot",iagp,gamePad);    
                    callback(scene,pad.index,iagp);      

                }
            }
        }, scene);
       
    }
    //Update Buttons on GamePads per update loop in scenes.
    function updateGamePads(){
        for(let i=0;i < gamePad.length;i++){            
            gamePad[i].updateButtonState();            
        }
    }
    function getInactiveGamePad(){
        for(let i=0;i < gamePad.length;i++){
            if(gamePad[i].ready == false){
                return i;
            }
        }
        return -1;
    }
    //Check if the pad has already been added.
    function checkPadIsTaken(padIndex){
        for(let i=0;i < gamePad.length;i++){
            if(gamePad[i].index == padIndex){
                return true;
            }
        }
        return false;
    }
    function getActiveGamePadCount(){
        let c = 0;
        for(let i=0;i < gamePad.length;i++){
            if(gamePad[i].ready == true){
                c++;
            }
        }
        return c;
    }
    function checkPadIsActive(index){ 
        return gamePad[index].ready;
             
    }
    function getActiveGamePad(){
        for(let i=0;i < gamePad.length;i++){
            if(gamePad[i].ready == true){
                return i;
            }
        }
        return -1;
    }
    function getLastActiveGamePad(){
        let la = 0;
        for(let i=0;i < gamePad.length;i++){
            if(gamePad[i].ready == true){
                la = i;
            }
        }
        return la;
    }
    function addGamePads(pad){
        let availPad = getInactiveGamePad();
        console.log("Adding Game Pad (FUNC): to index",availPad);
        if(availPad == -1){
            //All pads filled up. 
            console.log("No gamepads available!")
        }else{
            gamePad[availPad] = pad;
            gamePad[availPad].index = availPad;            
        }
        console.log("gamepad data:",gamePad,"navGPs:",navigator.getGamepads());
    }
    function createControls(scene){
        //Configure Controls by simple names
        game.wasd = {
            up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            shoot: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
            jump: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
            suicide: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
            passLight: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
            restart_scene: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
            switch: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            pulse: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F)
    
        };
    }
    //Find by Property
    function findWithAttr(array, attr, value) {
        for(var i = 0; i < array.length; i += 1) {
            if(array[i][attr] === value) {
                return i;
            }
        }
        return -1;
    }
    //SaveStateObject
    function stateData(id,map,x,y){
        this.id = id;
        this.map = map;
        this.pos = {x:x,y:y};
    }

    //Debug:Version
    console.log(String(Phaser.VERSION));
    //Font Preloader
    
    //Game
    var game = new Phaser.Game(config);