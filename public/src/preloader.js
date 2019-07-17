// preloader and loading bar

var Preloader = new Phaser.Class({

	Extends: Phaser.Scene,

	initialize:

	function Preloader ()
	{
		// note: the pack:{files[]} acts like a pre-preloader
		// this eliminates the need for an extra "boot" scene just to preload the loadingbar images
		Phaser.Scene.call(this, {
			key: 'preloader',
			pack: {
				files: [
					{ type: 'image', key: 'loadingbar_bg', url: 'img/loadingbar_bg.png' },
					{ type: 'image', key: 'loadingbar_fill', url: 'img/loadingbar_fill.png' }
				]
			}
		});
	},
	
	setPreloadSprite: function (sprite)
	{
		this.preloadSprite = { sprite: sprite, width: sprite.width, height: sprite.height };

		//sprite.crop(this.preloadSprite.rect);
		sprite.visible = true;

		// set callback for loading progress updates
		this.load.on('progress', this.onProgress, this );
		this.load.on('fileprogress', this.onFileProgress, this );
	},
	
	onProgress: function (value) {

		if (this.preloadSprite)
		{
			// calculate width based on value=0.0 .. 1.0
			var w = Math.floor(this.preloadSprite.width * value);
			
			// set width of sprite			
			this.preloadSprite.sprite.frame.width    = w;
			this.preloadSprite.sprite.frame.cutWidth = w;

			// update screen
			this.preloadSprite.sprite.frame.updateUVs();
		}
	},
	
	onFileProgress: function (file) {
		//debugger;
		//assetText.setText('onFileProgress: file.key=' + file.key);
	},

	preload: function ()
	{
		// setup the loading bar
		// note: images are available during preload because of the pack-property in the constructor
		this.loadingbar_bg   = this.add.sprite(400, 300, "loadingbar_bg");
		this.loadingbar_fill = this.add.sprite(400, 300, "loadingbar_fill");
		this.setPreloadSprite(this.loadingbar_fill);

		// now load images, audio etc.
		//Background
		this.load.image('forest_background', 'assets/world/forest_bg.png');
		// sprites
        this.load.atlas('sprites', 'img/spritearray.png', 'img/spritearray.json');
        //Map Assets  
		this.load.tilemapTiledJSON('map2', 'assets/world/map2_32ts.json'); 
		this.load.tilemapTiledJSON('map3', 'assets/world/map3_32ts.json');    
		this.load.spritesheet('tiles32', 'assets/world/oldTileset32.png', {frameWidth: 32, frameHeight: 32}); 
		this.load.spritesheet('collisions32', 'assets/world/map_collision.png', {frameWidth: 32, frameHeight: 32}); 
		//Entity Assets
        this.load.spritesheet('enemy1', 'assets/characters/enemy1.png', {frameWidth: 64, frameHeight: 64});    
        this.load.spritesheet('bullet', 'assets/objects/projectiles.png', {frameWidth: 16, frameHeight: 16});
        this.load.image('impact1', 'assets/effects/particles.png');
        this.load.spritesheet('solana', 'assets/characters/solana.png', {frameWidth: 32, frameHeight: 64});
        this.load.spritesheet('bright', 'assets/characters/bright.png', {frameWidth: 48, frameHeight: 48});
        this.load.spritesheet('dark', 'assets/characters/dark.png', {frameWidth: 48, frameHeight: 48});
        this.load.spritesheet('soul_light', 'assets/characters/soul_light.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('mirror', 'assets/objects/mirror.png', {frameWidth: 48, frameHeight: 48});
		this.load.spritesheet('lever', 'assets/objects/lever.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('pressure_plate', 'assets/objects/pressure_plate.png', {frameWidth: 32, frameHeight: 6});
		this.load.spritesheet('tmxbutton', 'assets/objects/tmxbutton.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('platform_160x16', 'assets/objects/platform_160x16.png', {frameWidth: 160, frameHeight: 16});
		this.load.image('mask1', 'assets/objects/mask1.png');
		this.load.image('mask2', 'assets/objects/mask2.png');
		this.load.image('light1', 'assets/objects/light1.png');
		this.load.image('shadow', 'assets/world/shadow.png');
		this.load.image('light_crystal', 'assets/objects/light_crystal.png');
		this.load.image('health_blip', 'assets/hud/health_blip.png');
		this.load.image('exit', 'assets/objects/exit.png');
		this.load.image('entrance', 'assets/objects/entrance.png');
		this.load.image('gate', 'assets/objects/gate.png');
		this.load.image('triggerzone', 'assets/objects/triggerzone.png');
		this.load.image('speechbubble', 'assets/hud/speechBubble.png');
		// - HUD
		this.load.spritesheet('hud_interaction_control_arrows','assets/hud/hud_interaction_control_arrows.png',{frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('hud_energybar1','assets/hud/hud_energybar1.png',{frameWidth: 16, frameHeight: 96});

		//Shadow Canvas
		shadow_layer = this.textures.createCanvas("canvasShadow", 1280, 1280);        
        shadow_context = shadow_layer.getContext();
        shadow_context.fillRect(0,0,1280,1280); 
        shadow_layer.refresh();

		// font
		this.load.bitmapFont('fontwhite', 'img/fontwhite.png', 'img/fontwhite.xml');
		
		// sound effects
		//this.load.audio('bg', [this.p('audio/bg.mp3'),this.p('audio/bg.ogg')]);
		this.load.audio('coin', ['snd/coin.mp3', 'snd/coin.ogg']);
		this.load.audio('bomb', ['snd/expl.mp3', 'snd/expl.ogg']);
		this.load.audio('btn',  ['snd/btn.mp3', 'snd/btn.ogg']);
		this.load.audio('jumpSolana',  ['snd/SFX_Jump_07.wav']);
		this.load.audio('switch1',  ['snd/switch1.mp3']);
		this.load.audio('switch2',  ['snd/switch2.mp3']);
		
		// !! TESTING !! load the same image 500 times just to slow down the load and test the loading bar
		// for (var i = 0; i < 500; i++) {
		// 	this.load.image('testloading'+i, 'img/spritearray.png');
		// };
		// !! TESTING !!
	},

	create: function ()
	{

		// also create animations
		this.anims.create({
				key: 'cointurn',
				frames: [
					{ key: 'sprites', frame: 'coin1' },
					{ key: 'sprites', frame: 'coin2' },
					{ key: 'sprites', frame: 'coin3' },
					{ key: 'sprites', frame: 'coin4' },
					{ key: 'sprites', frame: 'coin5' },
					{ key: 'sprites', frame: 'coin6' },
					{ key: 'sprites', frame: 'coin7' },
					{ key: 'sprites', frame: 'coin8' }
				],
				frameRate: 15,
				repeat: -1
			});
			
		console.log('Preloader scene is ready, now start the actual game and never return to this scene');

		// dispose loader bar images
		this.loadingbar_bg.destroy();
		this.loadingbar_fill.destroy();
		this.preloadSprite = null;

		// start actual game
		this.scene.start('mainmenu');

	}
});

//Source Credit :https://opengameart.org/content/16x16-platform-tileset