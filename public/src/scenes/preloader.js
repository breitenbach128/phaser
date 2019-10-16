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
		this.loadingbar_bg   = this.add.sprite(game.canvas.width/2, 300, "loadingbar_bg");
		this.loadingbar_fill = this.add.sprite(game.canvas.width/2, 300, "loadingbar_fill");
		this.setPreloadSprite(this.loadingbar_fill);

		
        //Setup Shader
        glowPipeline = game.renderer.addPipeline('GlowShader', new ShaderGlow(game));
        glowPipeline.setFloat1('alpha', 1.0);

		// now load images, audio etc.
		//Background
		this.load.image('forest_background', 'assets/world/forest_bg.png');
		//Icons
		this.load.image('icon_keyboard','img/keyboard_icon_w.png');
		this.load.image('icon_gamepad','img/gamepad_icon_w.png')
		this.load.image('red_cross','img/red_cross.png')
		// Menu
        this.load.atlas('sprites', 'img/spritearray.png', 'img/spritearray.json');
        this.load.image('Title1', 'img/Title1.png');
		this.load.image('button_sun', 'img/sun1.png');
		this.load.image('128games', 'img/128studiobg.png');
		//Gameover Scene
		this.load.image('GameOver', 'img/gameover.png');
		
		this.load.spritesheet('button_yellow','assets/ui/button_yellow.png',{frameWidth: 190, frameHeight: 49})

        //Map Assets  
		this.load.tilemapTiledJSON('map1', 'assets/world/map1_32ts.json'); 
		this.load.tilemapTiledJSON('map1a', 'assets/world/map1a_32ts.json'); 
		this.load.tilemapTiledJSON('map2', 'assets/world/map2_32ts.json'); 
		this.load.tilemapTiledJSON('map3', 'assets/world/map3_32ts.json');  
		this.load.tilemapTiledJSON('map4', 'assets/world/map4_32ts.json');  
		this.load.tilemapTiledJSON('map5', 'assets/world/map5_32ts.json');  
		//StoryBoard Maps 
		this.load.tilemapTiledJSON('storymap_forest_1', 'assets/world/storyboard_forest1.json');  
		this.load.spritesheet('tiles32', 'assets/world/oldTileset32.png', {frameWidth: 32, frameHeight: 32, spacing: 2}); 
		this.load.spritesheet('castle32', 'assets/world/tile_castle_grey.png', {frameWidth: 32, frameHeight: 32}); 
		this.load.spritesheet('collisions32', 'assets/world/map_collision.png', {frameWidth: 32, frameHeight: 32}); 
		
		//Entity Assets
        this.load.spritesheet('slime1', 'assets/characters/slimemonster2.png', {frameWidth: 64, frameHeight: 37});    
        this.load.spritesheet('bullet', 'assets/objects/projectiles.png', {frameWidth: 16, frameHeight: 16});
        this.load.image('impact1', 'assets/effects/particles.png');
        this.load.image('crate', 'assets/objects/crate.png');
        this.load.image('rocks', 'assets/objects/rocks.png');
        this.load.spritesheet('solana', 'assets/characters/solana.png', {frameWidth: 96, frameHeight: 64});
        this.load.spritesheet('bright', 'assets/characters/bright.png', {frameWidth: 48, frameHeight: 48});
        this.load.spritesheet('polaris', 'assets/characters/polaris.png', {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('npc1', 'assets/characters/npc1.png', {frameWidth: 16, frameHeight: 32});
        this.load.spritesheet('dark', 'assets/characters/dark.png', {frameWidth: 48, frameHeight: 48});
        this.load.spritesheet('soul_light', 'assets/characters/soul_light.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('mirror', 'assets/objects/mirror.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('lever', 'assets/objects/lever.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('pressure_plate', 'assets/objects/pressure_plate.png', {frameWidth: 32, frameHeight: 6});
		this.load.spritesheet('tmxbutton', 'assets/objects/tmxbutton.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('platform_160x16', 'assets/objects/platform_160x16.png', {frameWidth: 160, frameHeight: 16});
		this.load.spritesheet('gameitems', 'assets/objects/gameitems.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('light_crystal', 'assets/objects/light_crystal.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('fireflies', 'assets/objects/fireflies.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('bat', 'assets/characters/bat_32.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('shard_light', 'assets/objects/light_shard.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('shard_dark', 'assets/objects/dark_shard.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('breakables', 'assets/objects/breakables.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('burstwave', 'assets/objects/burstwave1.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('boss_spiderhive', 'assets/characters/boss_spiderhive.png', {frameWidth: 128, frameHeight: 128});
		
		//Bosses		
		this.load.spritesheet('spider', 'assets/characters/spider_x2.png', {frameWidth: 64, frameHeight: 64});
		//Images
		this.load.spritesheet('ability_solarblast', 'assets/objects/ability_solarblast.png', {frameWidth: 16, frameHeight: 16});		
		this.load.image('soullightblast', 'assets/objects/soullightblast.png');
		this.load.image('mask1', 'assets/objects/mask1.png');
		this.load.image('mask2', 'assets/objects/mask2.png');
		this.load.image('light1', 'assets/objects/light1.png');
		this.load.image('shadow', 'assets/world/shadow.png');
		this.load.image('health_blip', 'assets/hud/health_blip.png');
		this.load.image('exit', 'assets/objects/exit.png');
		this.load.image('entrance', 'assets/objects/entrance.png');
		this.load.image('gate', 'assets/objects/gate.png');
		this.load.image('triggerzone', 'assets/objects/triggerzone.png');
		this.load.image('speechbubble', 'assets/hud/speechBubble.png');
		this.load.image('tmxwindow', 'assets/objects/tmxwindow.png');
		// - HUD
		this.load.spritesheet('hud_interaction_control_arrows','assets/hud/hud_interaction_control_arrows.png',{frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('hud_energybar1','assets/hud/hud_energybar1.png',{frameWidth: 16, frameHeight: 96});
		this.load.spritesheet('hud_boss_health_bar','assets/hud/boss_health_bar.png',{frameWidth: 64, frameHeight: 16});
		//Effects / Particles
		this.load.atlas('shapes', 'assets/effects/shapes.png', 'assets/effects/shapes.json');
  		this.load.text('effect-bright-sparks', 'assets/effects/bright_sparks.json');
		this.load.image('lightburst-1', 'assets/effects/lightburst-1.png');

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
		//EXTERNAL JSON ANIMATION LOADERS
		//this.load.animation('gameAnimationsTest', 'anims/anims.json');
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
		this.scene.start('splashscene');

	}
});

//Source Credit :https://opengameart.org/content/16x16-platform-tileset