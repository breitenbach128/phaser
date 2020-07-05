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
		this.load.image('PF_2DCastle1_1_background', 'tmx/tilesets/PF_2DCastle1.1/background.png');
		this.load.image('PF_Caslte_1_0_background_day1', 'tmx/tilesets/PF_Caslte_1.0/background_day1.png');
		this.load.image('PF_Caslte_1_0_background_day2', 'tmx/tilesets/PF_Caslte_1.0/background_day2.png');
		this.load.image('PF_Caslte_1_0_background_day3', 'tmx/tilesets/PF_Caslte_1.0/background_day3.png');
		this.load.image('PF_Caslte_1_0_background_night1', 'tmx/tilesets/PF_Caslte_1.0/background_night1.png');
		this.load.image('PF_Caslte_1_0_background_night2', 'tmx/tilesets/PF_Caslte_1.0/background_night2.png');
		this.load.image('PF_Caslte_1_0_background_night3', 'tmx/tilesets/PF_Caslte_1.0/background_night3.png');
		this.load.image('PF_CastlePrison1_0_background_obj', 'tmx/tilesets/PF_CastlePrison1.0/background_obj.png');
		this.load.image('PF_Caves_1_0_background1', 'tmx/tilesets/PF_Caves_1.0/background1.png');
		this.load.image('PF_Caves_1_0_background2', 'tmx/tilesets/PF_Caves_1.0/background2.png');
		this.load.image('PF_Caves_1_0_background3', 'tmx/tilesets/PF_Caves_1.0/background3.png');
		this.load.image('PF_Caves_1_0_background4a', 'tmx/tilesets/PF_Caves_1.0/background4a.png');
		this.load.image('PF_Caves_1_0_background4b', 'tmx/tilesets/PF_Caves_1.0/background4b.png');
		this.load.image('PF_Fantasy_SET1_v1_0_background_day1', 'tmx/tilesets/PF_Fantasy_SET1_v1.0/background_day1.png');
		this.load.image('PF_Fantasy_SET1_v1_0_background_day2', 'tmx/tilesets/PF_Fantasy_SET1_v1.0/background_day2.png');
		this.load.image('PF_Fantasy_SET1_v1_0_background_day3', 'tmx/tilesets/PF_Fantasy_SET1_v1.0/background_day3.png');
		this.load.image('PF_Fantasy_SET1_v1_0_background_night1', 'tmx/tilesets/PF_Fantasy_SET1_v1.0/background_night1.png');
		this.load.image('PF_Fantasy_SET1_v1_0_background_night2', 'tmx/tilesets/PF_Fantasy_SET1_v1.0/background_night2.png');
		this.load.image('PF_Fantasy_SET1_v1_0_background_night3', 'tmx/tilesets/PF_Fantasy_SET1_v1.0/background_night3.png');
		this.load.image('PF_Fantasy_SET1_v1_0_background_obj', 'tmx/tilesets/PF_Fantasy_SET1_v1.0/background_obj.png');
		this.load.image('PF_MountainPass_v1_0_background1', 'tmx/tilesets/PF_MountainPass_v1.0/background1.png');
		this.load.image('PF_MountainPass_v1_0_background2', 'tmx/tilesets/PF_MountainPass_v1.0/background2.png');
		this.load.image('PF_MountainPass_v1_0_background3', 'tmx/tilesets/PF_MountainPass_v1.0/background3.png');
		this.load.image('PF_MountainPass_v1_0_background_sky', 'tmx/tilesets/PF_MountainPass_v1.0/background_sky.png');
		this.load.image('PF_SET2_v1_0_background_day1', 'tmx/tilesets/PF_SET2_v1.0/background_day1.png');
		this.load.image('PF_SET2_v1_0_background_day2', 'tmx/tilesets/PF_SET2_v1.0/background_day2.png');
		this.load.image('PF_SET2_v1_0_background_day3', 'tmx/tilesets/PF_SET2_v1.0/background_day3.png');
		this.load.image('PF_SET2_v1_0_background_day4', 'tmx/tilesets/PF_SET2_v1.0/background_day4.png');
		this.load.image('PF_SET2_v1_0_background_night1', 'tmx/tilesets/PF_SET2_v1.0/background_night1.png');
		this.load.image('PF_SET2_v1_0_background_night2', 'tmx/tilesets/PF_SET2_v1.0/background_night2.png');
		this.load.image('PF_SET2_v1_0_background_night3', 'tmx/tilesets/PF_SET2_v1.0/background_night3.png');
		this.load.image('PF_SET2_v1_0_background_night4', 'tmx/tilesets/PF_SET2_v1.0/background_night4.png');
		this.load.image('PF_SET3_v1_0_background1', 'tmx/tilesets/PF_SET3_v1.0/background1.png');
		this.load.image('PF_SET3_v1_0_background2', 'tmx/tilesets/PF_SET3_v1.0/background2.png');
		this.load.image('PF_SET3_v1_0_background3', 'tmx/tilesets/PF_SET3_v1.0/background3a.png');
		this.load.image('PF_SET3_v1_0_background4', 'tmx/tilesets/PF_SET3_v1.0/background4a.png');
		this.load.image('PF_Set4_v1_0_background1_day', 'tmx/tilesets/PF_Set4_v1.0/background1_day.png');
		this.load.image('PF_Set4_v1_0_background1_night', 'tmx/tilesets/PF_Set4_v1.0/background1_night.png');
		this.load.image('PF_Set4_v1_0_background2A_day', 'tmx/tilesets/PF_Set4_v1.0/background2A_day.png');
		this.load.image('PF_Set4_v1_0_background2A_night', 'tmx/tilesets/PF_Set4_v1.0/background2A_night.png');
		this.load.image('PF_Set4_v1_0_background2B_day', 'tmx/tilesets/PF_Set4_v1.0/background2B_day.png');
		this.load.image('PF_Set4_v1_0_background2B_night', 'tmx/tilesets/PF_Set4_v1.0/background2B_night.png');
		this.load.image('PF_Set4_v1_0_background3_day', 'tmx/tilesets/PF_Set4_v1.0/background3_day.png');
		this.load.image('PF_Set4_v1_0_background3_night', 'tmx/tilesets/PF_Set4_v1.0/background3_night.png');
		this.load.image('PF_Set4_v1_0_background4_day', 'tmx/tilesets/PF_Set4_v1.0/background4_day.png');
		this.load.image('PF_Set4_v1_0_background4_night', 'tmx/tilesets/PF_Set4_v1.0/background4_night.png');
		this.load.image('PF_Set5_v1_0_background1', 'tmx/tilesets/PF_Set5_v1.0/background1.png');
		this.load.image('PF_Set5_v1_0_background2', 'tmx/tilesets/PF_Set5_v1.0/background2.png');
		this.load.image('PF_Set5_v1_0_background3', 'tmx/tilesets/PF_Set5_v1.0/background3.png');
		this.load.image('PF_Set5_v1_0_background4', 'tmx/tilesets/PF_Set5_v1.0/background4.png');
		this.load.image('PF_SnowyMountains_1_0_background1', 'tmx/tilesets/PF_SnowyMountains_1.0/background1.png');
		this.load.image('PF_SnowyMountains_1_0_background2a', 'tmx/tilesets/PF_SnowyMountains_1.0/background2a.png');
		this.load.image('PF_SnowyMountains_1_0_background2b', 'tmx/tilesets/PF_SnowyMountains_1.0/background2b.png');
		this.load.image('PF_SnowyMountains_1_0_background3', 'tmx/tilesets/PF_SnowyMountains_1.0/background3.png');
		this.load.image('PF_SnowyMountains_1_0_background4', 'tmx/tilesets/PF_SnowyMountains_1.0/background4.png');
		this.load.image('PF_SnowyMountains_1_0_background5', 'tmx/tilesets/PF_SnowyMountains_1.0/background5.png');
		this.load.image('PF_StrangeMountains_v1_0_background1', 'tmx/tilesets/PF_StrangeMountains_v1.0/background1.png');
		this.load.image('PF_StrangeMountains_v1_0_background2', 'tmx/tilesets/PF_StrangeMountains_v1.0/background2.png');
		this.load.image('PF_StrangeMountains_v1_0_background3', 'tmx/tilesets/PF_StrangeMountains_v1.0/background3.png');
		this.load.image('PF_StrangeMountains_v1_0_background4', 'tmx/tilesets/PF_StrangeMountains_v1.0/background4.png');
		this.load.image('PF_StrangeMountains_v1_0_background5', 'tmx/tilesets/PF_StrangeMountains_v1.0/background5.png');
		this.load.image('PF_StrangeMountains_v1_0_background6', 'tmx/tilesets/PF_StrangeMountains_v1.0/background6.png');
		this.load.image('PF_StrangeMountains_v1_0_background_fog', 'tmx/tilesets/PF_StrangeMountains_v1.0/background_fog.png');
		this.load.image('PF_StrangeWorld1_0_background1', 'tmx/tilesets/PF_StrangeWorld1.0/background 1.png');
		this.load.image('PF_StrangeWorld1_0_background2', 'tmx/tilesets/PF_StrangeWorld1.0/background 2.png');
		this.load.image('PF_StrangeWorld1_0_background3', 'tmx/tilesets/PF_StrangeWorld1.0/background 3.png');
		this.load.image('PF_StrangeWorld1_0_background4', 'tmx/tilesets/PF_StrangeWorld1.0/background 4.png');

		//Icons
		this.load.image('icon_keyboard','img/keyboard_icon_w.png');
		this.load.image('icon_gamepad','img/gamepad_icon_w.png')
		this.load.image('red_cross','img/red_cross.png')
		// Menu
        this.load.atlas('sprites', 'img/spritearray.png', 'img/spritearray.json');
        this.load.image('Title1', 'img/Title2.png');
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
		this.load.tilemapTiledJSON('map6', 'assets/world/map6_32ts.json');
		this.load.tilemapTiledJSON('map7', 'assets/world/map7_32ts.json');
		this.load.tilemapTiledJSON('map8', 'assets/world/map8_32ts.json');
		//Map Assets - Intro levels
		this.load.tilemapTiledJSON('i1s1', 'assets/world/i1s1.json');
		this.load.tilemapTiledJSON('i1s2', 'assets/world/i1s2.json');
		this.load.tilemapTiledJSON('i1s3', 'assets/world/i1s3.json');
		this.load.tilemapTiledJSON('i1s4', 'assets/world/i1s4.json');
		this.load.tilemapTiledJSON('i1s5', 'assets/world/i1s5.json');
		//Map Assets - Game		
		this.load.tilemapTiledJSON('m1s1', 'assets/world/m1s1.json');
		this.load.tilemapTiledJSON('m1s1a', 'assets/world/m1s1a.json');
		this.load.tilemapTiledJSON('m2s1', 'assets/world/m2s1.json');
		this.load.tilemapTiledJSON('m2s2', 'assets/world/m2s2.json');
		this.load.tilemapTiledJSON('m2s3', 'assets/world/m2s3.json');
		this.load.tilemapTiledJSON('m2s4', 'assets/world/m2s4.json');
		this.load.tilemapTiledJSON('m2s5', 'assets/world/m2s5.json');
		this.load.tilemapTiledJSON('m6s1', 'assets/world/m6s1.json');
		this.load.tilemapTiledJSON('m6s1a', 'assets/world/m6s1a.json');
		//Map Tilesets
		this.load.tilemapTiledJSON('storymap_forest_1', 'assets/world/storyboard_forest1.json');  
		this.load.spritesheet('tiles32', 'assets/world/oldTileset32.png', {frameWidth: 32, frameHeight: 32, spacing: 2});
		this.load.spritesheet('tiles_custom', 'assets/world/tile_custom.png', {frameWidth: 16, frameHeight: 16,});  
		this.load.spritesheet('castle32', 'assets/world/tile_castle_grey_extruded.png', {frameWidth: 32, frameHeight: 32}); 
		this.load.spritesheet('corruption32', 'assets/world/corruption.png', {frameWidth: 32, frameHeight: 32}); 
		this.load.spritesheet('collisions32', 'assets/world/map_collision.png', {frameWidth: 32, frameHeight: 32}); 
		//Map Tilests - Game
		this.load.spritesheet('PF_2DCastle1_1_environment', 'tmx/tilesets/PF_2DCastle1.1/environment.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_2DCastle1_1_env_objects', 'tmx/tilesets/PF_2DCastle1.1/env_objects.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_2DCastle1_1_env_objects_far', 'tmx/tilesets/PF_2DCastle1.1/env_objects_far.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_2DCastle1_1_ground', 'tmx/tilesets/PF_2DCastle1.1/ground.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_2DCastle1_1_terrain', 'tmx/tilesets/PF_2DCastle1.1/terrain.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_2DCastle1_1_walls', 'tmx/tilesets/PF_2DCastle1.1/walls.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_2DCastle1_1_walls_far', 'tmx/tilesets/PF_2DCastle1.1/walls_far.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_2DCastle1_1_walls_side_top', 'tmx/tilesets/PF_2DCastle1.1/walls_side_top.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_2DCastle1_1_walls_side_top_far', 'tmx/tilesets/PF_2DCastle1.1/walls_side_top_far.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_2DCastle1_1_wood_env', 'tmx/tilesets/PF_2DCastle1.1/wood_env.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_Caslte_1_0_decorative', 'tmx/tilesets/PF_Caslte_1.0/decorative.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('PF_Caslte_1_0_mainlevbuild_A', 'tmx/tilesets/PF_Caslte_1.0/mainlevbuild_A.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('PF_Caslte_1_0_mainlevbuild_B', 'tmx/tilesets/PF_Caslte_1.0/mainlevbuild_B.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('PF_CastlePrison1_0_mainlevbuild', 'tmx/tilesets/PF_CastlePrison1.0/mainlevbuild.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_CastlePrison1_0_mainlevbuildB', 'tmx/tilesets/PF_CastlePrison1.0/mainlevbuildB.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_Caves_1_0_mainlev_build', 'tmx/tilesets/PF_Caves_1.0/mainlev_build.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_Caves_1_0_props1', 'tmx/tilesets/PF_Caves_1.0/props1.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_Caves_1_0_props2', 'tmx/tilesets/PF_Caves_1.0/props2.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_Fantasy_SET1_v1_0_decorative_obj', 'tmx/tilesets/PF_Fantasy_SET1_v1.0/decorative_obj.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_Fantasy_SET1_v1_0_mainlevbuild', 'tmx/tilesets/PF_Fantasy_SET1_v1.0/mainlevbuild.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_MountainPass_v1_0_decorative', 'tmx/tilesets/PF_MountainPass_v1.0/decorative.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_MountainPass_v1_0_mainlevbuild1', 'tmx/tilesets/PF_MountainPass_v1.0/mainlevbuild1.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_Platformer1v_1_1_main_lev_build', 'tmx/tilesets/PF_Platformer1v.1.1/main_lev_build.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_Platformer1v_1_1_other_and_decorative', 'tmx/tilesets/PF_Platformer1v.1.1/other_and_decorative.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_SET2_v1_0_decorative_obj', 'tmx/tilesets/PF_SET2_v1.0/decorative_obj.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_SET2_v1_0_mainlevbuild1', 'tmx/tilesets/PF_SET2_v1.0/mainlevbuild1.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_SET2_v1_0_mainlevbuild2', 'tmx/tilesets/PF_SET2_v1.0/mainlevbuild2.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_SET3_v1_0_mainlevbuild1', 'tmx/tilesets/PF_SET3_v1.0/mainlevbuild1.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('PF_SET3_v1_0_mainlevbuild2', 'tmx/tilesets/PF_SET3_v1.0/mainlevbuild2.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('PF_SET3_v1_0_mainlevbuild3', 'tmx/tilesets/PF_SET3_v1.0/mainlevbuild3.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('PF_Set4_v1_0_anim_water', 'tmx/tilesets/PF_Set4_v1.0/anim_water.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_Set4_v1_0_anim_water2', 'tmx/tilesets/PF_Set4_v1.0/anim_water2.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_Set4_v1_0_decorative1', 'tmx/tilesets/PF_Set4_v1.0/decorative1.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_Set4_v1_0_decorative2', 'tmx/tilesets/PF_Set4_v1.0/decorative2.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_Set4_v1_0_mainlevbuild', 'tmx/tilesets/PF_Set4_v1.0/mainlevbuild.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_Set5_v1_0_decorative1', 'tmx/tilesets/PF_Set5_v1.0/decorative1.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_Set5_v1_0_decorative2', 'tmx/tilesets/PF_Set5_v1.0/decorative2.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_Set5_v1_0_mainlevbuild', 'tmx/tilesets/PF_Set5_v1.0/mainlevbuild.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_SnowyMountains_1_0_mainlevbuild1', 'tmx/tilesets/PF_SnowyMountains_1.0/mainlevbuild1.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_SnowyMountains_1_0_mainlevbuild2', 'tmx/tilesets/PF_SnowyMountains_1.0/mainlevbuild2.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_StrangeMountains_v1_0_fog', 'tmx/tilesets/PF_StrangeMountains_v1.0/fog.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_StrangeMountains_v1_0_mainlevbuild1', 'tmx/tilesets/PF_StrangeMountains_v1.0/mainlevbuild1.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_StrangeMountains_v1_0_mainlevbuild2', 'tmx/tilesets/PF_StrangeMountains_v1.0/mainlevbuild2.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_StrangeWorld1_0_decorative', 'tmx/tilesets/PF_StrangeWorld1.0/decorative.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_StrangeWorld1_0_mainlevbuildA', 'tmx/tilesets/PF_StrangeWorld1.0/mainlevbuildA.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('PF_StrangeWorld1_0_mainlevbuildB', 'tmx/tilesets/PF_StrangeWorld1.0/mainlevbuildB.png', {frameWidth: 32, frameHeight: 32});

		//load level config data
		this.load.json('levelconfigdata', 'src/utility/levelsconfig.json ');

		//Entity Assets
        this.load.spritesheet('slime1', 'assets/characters/slimemonster2.png', {frameWidth: 64, frameHeight: 37});    
        this.load.spritesheet('bullet', 'assets/objects/projectiles.png', {frameWidth: 16, frameHeight: 16});
        this.load.image('impact1', 'assets/effects/particles.png');
        this.load.spritesheet('light_burst_2', 'assets/effects/lightburst-2.png', {frameWidth: 64, frameHeight: 64});
        this.load.image('crate', 'assets/objects/crate2.png');
        this.load.image('rocks', 'assets/objects/rocks.png');
        this.load.spritesheet('solbomb', 'assets/objects/solbomb.png', {frameWidth: 16, frameHeight: 16})
        this.load.image('rockchute', 'assets/characters/boss/rockChute1.png');
        this.load.spritesheet('solana', 'assets/characters/solanaV2.png', {frameWidth: 96, frameHeight: 64});
        this.load.spritesheet('bright', 'assets/characters/brightV2.png', {frameWidth: 48, frameHeight: 48});
        this.load.spritesheet('polaris', 'assets/characters/polaris.png', {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('npc1', 'assets/characters/npc1.png', {frameWidth: 16, frameHeight: 32});
        this.load.spritesheet('dark', 'assets/characters/darkV2.png', {frameWidth: 48, frameHeight: 48});
        this.load.spritesheet('soul_light', 'assets/characters/soul_light.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('mirror', 'assets/objects/mirror.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('lever', 'assets/objects/lever.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('pressure_plate', 'assets/objects/pressure_plate.png', {frameWidth: 32, frameHeight: 16});
		this.load.spritesheet('tmxbutton', 'assets/objects/tmxbutton.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('platform_160x16', 'assets/objects/platform_160x16.png', {frameWidth: 160, frameHeight: 16});
		this.load.spritesheet('light_crystal', 'assets/objects/light_crystal.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('fireflies', 'assets/objects/fireflies.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('bat', 'assets/characters/bat_32.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('shard_light', 'assets/objects/light_shard.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('shard_dark', 'assets/objects/dark_shard.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('breakables', 'assets/objects/breakables.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('burstwave', 'assets/objects/burstwave1.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('sol_pieces', 'assets/objects/Sol_pieces.png', {frameWidth: 64, frameHeight: 64});
		this.load.spritesheet('breakablecracks', 'assets/objects/breakablecracks.png', {frameWidth: 16, frameHeight: 16});	
		this.load.spritesheet('bright_pulse', 'assets/characters/pulseV2.png', {frameWidth: 48, frameHeight: 48});
		this.load.spritesheet('telebeam', 'assets/objects/telebeam.png', {frameWidth: 64, frameHeight: 64});
		this.load.spritesheet('window_shatter', 'assets/objects/window_shatter.png', {frameWidth: 64, frameHeight: 96});
        this.load.spritesheet('solana_shield', 'assets/objects/solana_shield.png', {frameWidth: 32, frameHeight: 32});
        this.load.spritesheet('chest', 'assets/objects/chest.png', {frameWidth: 64, frameHeight: 48});
        this.load.spritesheet('gear', 'assets/objects/gear.png', {frameWidth: 16, frameHeight: 16});
        this.load.spritesheet('minecart', 'assets/objects/minecart.png', {frameWidth: 96, frameHeight: 48});
		this.load.spritesheet('minecart_wheel', 'assets/objects/minecart_wheel.png', {frameWidth: 13, frameHeight: 13});
		this.load.image('seesaw', 'assets/objects/seesaw.png');
		//Interactive Objects
		//Light Bridge / Sollink		
        this.load.spritesheet('sollink', 'assets/objects/sollink.png', {frameWidth: 32, frameHeight: 32});
        this.load.spritesheet('solanchor', 'assets/objects/solanchor.png', {frameWidth: 32, frameHeight: 32});
		//Props
		this.load.spritesheet('fan-1', 'assets/objects/fan-1.png', {frameWidth: 64, frameHeight: 32});
		this.load.spritesheet('inchworm-1', 'assets/objects/props_inchworm.png', {frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('bat-1', 'assets/objects/props_bat.png', {frameWidth: 32, frameHeight: 16});
		this.load.spritesheet('spiderweb-1', 'assets/objects/prop_spiderweb.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('puddle-1', 'assets/objects/prop_puddle1.png', {frameWidth: 32, frameHeight: 16});
		//SoulCrystals
		this.load.spritesheet('soulcrystal_blue', 'assets/objects/crystal-qubodup-ccby3-32-blue.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('soulcrystal_grey', 'assets/objects/crystal-qubodup-ccby3-32-grey.png', {frameWidth: 32, frameHeight: 32});		
		this.load.spritesheet('soulcrystal_pink', 'assets/objects/crystal-qubodup-ccby3-32-pink.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('soulcrystal_yellow', 'assets/objects/crystal-qubodup-ccby3-32-yellow.png', {frameWidth: 32, frameHeight: 32});		
		this.load.spritesheet('soulcrystal_orange', 'assets/objects/crystal-qubodup-ccby3-32-orange.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('soulcrystal_green', 'assets/objects/crystal-qubodup-ccby3-32-green.png', {frameWidth: 32, frameHeight: 32});

		//Bosses		
		this.load.spritesheet('spider', 'assets/characters/spider_x2.png', {frameWidth: 64, frameHeight: 64});
		this.load.spritesheet('boss_spiderhive', 'assets/characters/boss_spiderhive.png', {frameWidth: 128, frameHeight: 128});
		this.load.spritesheet('boss_spideregg', 'assets/characters/boss_spiderhive_egg.png', {frameWidth: 32, frameHeight: 32});
		//Slime		
		this.load.spritesheet('boss_slime_main', 'assets/characters/boss/boss_slime.png', {frameWidth: 256, frameHeight: 256});
		this.load.spritesheet('boss_slime_column', 'assets/characters/boss/boss_slime_column.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('boss_slime_acidpool', 'assets/characters/boss/boss_slime_acidpool.png', {frameWidth: 32, frameHeight: 32});
		//Enemies		
		this.load.spritesheet('shrieker', 'assets/objects/mushroom_2.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('spiker', 'assets/objects/spiker_1.png', {frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('oilblob2', 'assets/objects/oil_blob2.png',{frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('statue', 'assets/characters/statue3.png',{frameWidth: 32, frameHeight: 48});
		this.load.spritesheet('shadow1', 'assets/characters/enemy_shadow2.png',{frameWidth: 48, frameHeight: 64});
		//Controller
		this.load.image('icon_kb_spcbar', 'assets/UI/Keyboard_Mouse/Dark/Keyboard_Black_Space.png');
		
		//Images
		this.load.spritesheet('ability_solarblast', 'assets/objects/ability_solarblast.png', {frameWidth: 16, frameHeight: 16});		
		this.load.spritesheet('soullightblast', 'assets/objects/soullightblastv2.png',{frameWidth: 64, frameHeight: 64});
		this.load.image('mask1', 'assets/objects/mask1.png');
		this.load.image('mask2', 'assets/objects/mask2.png');
		this.load.image('light1', 'assets/objects/light1.png');
		this.load.image('shadow', 'assets/world/shadow.png');
		this.load.image('exit', 'assets/objects/exit.png');
		this.load.spritesheet('exit_marker', 'assets/objects/exit_marker.png', {frameWidth: 64, frameHeight: 64});
		this.load.image('entrance', 'assets/objects/entrance.png');
		this.load.image('gate', 'assets/objects/gate.png');
		this.load.image('triggerzone', 'assets/objects/triggerzone.png');
		this.load.image('speechbubble', 'assets/hud/speechBubble.png');
		this.load.image('tmxwindow', 'assets/objects/tmxwindow.png');
		this.load.image('glasstile', 'assets/objects/glasstile.png');
		this.load.image('mushroom1', 'assets/objects/mushroom_1.png');
		this.load.image('grinder', 'assets/objects/grinder.png');
		this.load.image('conveyor_wheel', 'assets/objects/conveyor_wheel.png');
		// - HUD
		this.load.spritesheet('health_blip', 'assets/hud/health_blip.png',{frameWidth: 16, frameHeight: 16});
		this.load.spritesheet('hud_interaction_control_arrows','assets/hud/hud_interaction_control_arrows.png',{frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('hud_energybar1','assets/hud/hud_energybar1.png',{frameWidth: 16, frameHeight: 96});		
		this.load.spritesheet('hud_energybar3','assets/hud/hud_energybar3.png',{frameWidth: 192, frameHeight: 24});	
		this.load.spritesheet('hud_energybar3_solana_head','assets/hud/hud_energybar3_solana_head.png',{frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('hud_energybar3_bright_head','assets/hud/hud_energybar3_bright_head.png',{frameWidth: 32, frameHeight: 32});
		this.load.spritesheet('hud_corruptionbar1','assets/hud/hud_corruptionbar1.png',{frameWidth: 16, frameHeight: 96});
		//Make these talking animations later		
		this.load.image('hud_solana_head', 'assets/hud/hud_Solana_head.png');
		this.load.image('hud_bright_head', 'assets/hud/hud_Bright_head.png');
		
		this.load.spritesheet('hud_boss_health_bar','assets/hud/boss_health_bar.png',{frameWidth: 64, frameHeight: 16});
		//Effects / Particles
		this.load.atlas('shapes', 'assets/effects/shapes.png', 'assets/effects/shapes.json');;
		this.load.text('effect-bright-sparks', 'assets/effects/bright_sparks.json');
		this.load.text('effect-bright-pulse1', 'assets/effects/bright_pulse1.json');	
		this.load.text('effect-trigger-teleporter', 'assets/effects/teleporter.json'); 
		this.load.text('effect-dusty', 'assets/effects/dusty.json');	  
  		this.load.json('effect-flame-fall', 'assets/effects/particles_flame_fall.json');
		this.load.image('lightburst-1', 'assets/effects/lightburst-1.png');
		this.load.spritesheet('doublejump-1', 'assets/effects/doublejmp.png',{frameWidth: 24, frameHeight: 24});
		this.load.spritesheet('wind-1', 'assets/effects/wind1.png',{frameWidth: 32, frameHeight: 32});
		//Water // https://github.com/jorbascrumps/phaser-plugin-water-body
		this.load.image('droplet', 'assets/effects/water/droplet.png');
		this.load.image('water', 'assets/effects/water/water.jpg');
		this.load.image('liquiddroplet', 'assets/objects/droplet.png');
		this.load.spritesheet('lightblock', 'assets/objects/lightblock.png',{frameWidth: 2, frameHeight: 2});
		this.load.spritesheet('lightblock2', 'assets/objects/lightblock2.png',{frameWidth: 8, frameHeight: 8});
		this.load.spritesheet('lightblockdeath', 'assets/objects/lightblockdeath.png',{frameWidth: 16, frameHeight: 16});

		// font
		this.load.bitmapFont('fontwhite', 'img/fontwhite.png', 'img/fontwhite.xml');
		
		// sound effects
		//this.load.audio('bg', [this.p('audio/bg.mp3'),this.p('audio/bg.ogg')]);
		this.load.audio('coin', ['snd/coin.mp3', 'snd/coin.ogg']);
		this.load.audio('bomb', ['snd/expl.mp3', 'snd/expl.ogg']);
		this.load.audio('btn',  ['snd/btn.mp3', 'snd/btn.ogg']);
		//this.load.audio('jumpSolana',  ['snd/jump1.mp3']);
		this.load.audio('grabbedLight',  ['snd/grabbed.wav']);
		this.load.audio('jumpSolana',  ['snd/jumpland.wav']);
		this.load.audio('switch1',  ['snd/switch1.mp3']);
		this.load.audio('switch2',  ['snd/switch2.mp3']);
		this.load.audio('impact_hurt_groan',['snd/johnj_human_impact_hit_punch_head_slam_male_groan.mp3'])
		this.load.audio('hitting_wall',  ['snd/Hitting_Wall.wav']);
		this.load.audio('wavingtorch',  ['snd/WavingTorch.wav']);
		this.load.audio('shard1',  ['snd/shard1.wav']);
		//Bright
		this.load.audio('block1',  ['snd/bright/blockProjectile1.wav']);
		
		//Music
		this.load.audio('theme1',  ['snd/theme1.wav']);
		this.load.audio('intro1',  ['snd/intro1.ogg']);
		this.load.audio('forestTheme1',  ['snd/safe_room_theme.ogg']);
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
			
		//console.log('Preloader scene is ready, now start the actual game and never return to this scene');

		// dispose loader bar images
		this.loadingbar_bg.destroy();
		this.loadingbar_fill.destroy();
		this.preloadSprite = null;

		// start actual game
		this.scene.start('splashscene');

	}
});

//Source Credit :https://opengameart.org/content/16x16-platform-tileset