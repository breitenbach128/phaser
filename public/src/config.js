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
                gravity: { y: .70 }
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
    var gamePad;
    var keyPad;
    //Player Management
    var playerMode = 0;//0-Single,1-LocalCoop,2-OnlineCoop
    var playerModes = ['Single','Local-COOP','Online'];
    const ctrls={
        kb: 0,
        gp1:1,
        gp2:2
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
    var playerConfig = {
        one:{
            ctrl:ctrls.kb,
            char:players.SOLANA
        },
        two:{
            ctrl:ctrls.gp1,
            char:players.BRIGHT
        }
    };
    var curr_player = playerConfig.one.char;
    //Global Functions
    function initGamePads(scene){
        console.log("Setup GamePad for ");
        gamePad = new GamepadControl(0);
        scene.input.gamepad.once('connected', function (pad) {
            //   'pad' is a reference to the gamepad that was just connected
            console.log(scene.scene.key,"gamepad connected"); 
            gamePad = new GamepadControl(pad);

        }, scene);
        scene.input.gamepad.once('down', function (pad, button, index) {
            console.log(scene.scene.key,'Playing with ' + pad.id);    
            gamePad = new GamepadControl(pad);    
        }, scene);
    }
    function getInactiveGamePad(){
        for(let i=0;i < gamePads.length;i++){
            if(gamePads[i].ready == false){
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
            gamePads[availPad] = pad;
        }
    }
    //Debug:Version
    console.log(String(Phaser.VERSION));
    //Font Preloader
    
    //Game
    var game = new Phaser.Game(config);