var socket = io();
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
        scene: [ Preloader, SplashScene, MainMenu, IntroScene, LobbyScene, GameScene, HudScene ]
    };
    
    //Globals
    //Global Game Access
    var buildVersion = "a1";
    var game;
    var hud;
    var playScene;
    var GLOBAL_DEBUG = false;
    //Physics
    var global_gravity = 400;
    //Tiles
    var map; 
    var current_map = "map2";
    var current_exit = "west1";
    var world_background;
    //Game Objects
    var solana,bright,soullight,
    enemies,enemiesFly,bullets,
    mirrors,exits,entrances,
    levers,gates,plates,buttons,
    triggerzones,platforms,barriers,
    ab_solarblasts,crystallamps,ab_brightbeams,
    rocks,crates;    
    var new_enemy;
    var spawner;
    var spawnlayer;
    //Particles
    var emitter0;
    var emitter_dirt_spray;
    var emitter_blood;
    //HUD
    var scoreText;
    //Graphics
    var shadow_layer,shadow_context;
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
        FG: 100,
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
        ctrl:CTRLS.KB,
        ctrlSN: 0,
        char:players.SOLANA
    },
    {
        id:1,
        ctrl:CTRLS.GP1,
        ctrlSN: 0,
        char:players.BRIGHT
    }];
    var curr_player = playerConfig[0].char;
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

        // scene.input.gamepad.once('connected', function (pad) {
        //     //   'pad' is a reference to the gamepad that was just connected
        //     console.log(scene.scene.key,"gamepad connected"); 
        //     addGamePads(new GamepadControl(pad));            
        //     callback(scene); 
        // }, scene);
        scene.input.gamepad.once('down', function (pad, button, index) {
            console.log(scene.scene.key,'Playing with ' + pad.id);    
            addGamePads(new GamepadControl(pad));  
            callback(scene); 
        }, scene);
       
    }
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
    function getActiveGamePadCount(){
        let c = 0;
        for(let i=0;i < gamePad.length;i++){
            if(gamePad[i].ready == true){
                c++;
            }
        }
        return c;
    }
    function getActiveGamePad(){
        for(let i=0;i < gamePad.length;i++){
            if(gamePad[i].ready == true){
                return i;
            }
        }
        return -1;
    }
    function addGamePads(pad){
        let availPad = getInactiveGamePad();
        if(availPad == -1){
            //All pads filled up. 
        }else{
            gamePad[availPad] = pad;
            gamePad[availPad].index = availPad;
        }
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
    //Debug:Version
    console.log(String(Phaser.VERSION));
    //Font Preloader
    
    //Game
    var game = new Phaser.Game(config);