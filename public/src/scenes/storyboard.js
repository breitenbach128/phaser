//Main Game Scene
/// <reference path="../../def/phaser.d.ts"/>

var Storyboard = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function GameScene ()
    {
        Phaser.Scene.call(this, { key: 'storyboard' });
    },

    preload: function ()
    {
        //this.load.scenePlugin('Slopes', 'src/plugins/phaser-slopes.min.js');
    },

    create: function ()
    {

        //Create Background
        world_background = this.add.tileSprite(512, 256, 4096, 512, 'forest_background');      

        // create the map
        map = this.make.tilemap({key: "storymap_forest_1"});
        
        // create tiles for the layers
        var Tiles = map.addTilesetImage('32Tileset','tiles32');//called it 32Tileset in tiled
        var TIlesCastle = map.addTilesetImage('32Castle','castle32');//called it 32Castle in tiled
        var CollisionTiles = map.addTilesetImage('collision','collisions32');//called it collision in tiled

        // create the display layers
        let bglayer3 = map.createStaticLayer('bg3', Tiles, 0, 0);
        let bglayer2 = map.createStaticLayer('bg2', Tiles, 0, 0);
        let bglayer = map.createStaticLayer('bg', Tiles, 0, 0);
        let fglayer = map.createStaticLayer('fg', Tiles, 0, 0); 
        // create the collision layer
        this.collisionLayer = map.createDynamicLayer('collision', CollisionTiles, 0, 0);
        this.collisionLayer.setVisible(false);
        this.collisionLayer.setCollisionByProperty({ collides: true });
        // set the boundaries of our game world
        this.matter.world.convertTilemapLayer(this.collisionLayer);
        this.matter.world.setBounds(0,0,map.widthInPixels, map.heightInPixels);

        //Draw Debug for matter        
        this.matter.world.createDebugGraphic();
        this.matter.world.drawDebug = false;
        //Set Body labesl for Tiles
        this.collisionLayer.forEachTile(function (tile) {
            if(tile.physics.matterBody){
                tile.physics.matterBody.body.label = 'GROUND';
                tile.physics.matterBody.setCollisionCategory(CATEGORY.GROUND);
                tile.physics.matterBody.setFriction(.9,0);
            }
        });
        //Create Camera        
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels+128);  
        console.log(map.widthInPixels, map.heightInPixels)
        this.cameras.main.setBackgroundColor('#ccccff'); 
        this.cameras.main.roundPixels = true;
        this.cameras.main.setScroll(map.widthInPixels,0);
        //pan(x, y [, duration] [, ease] [, force] [, callback] [, context])
        this.cameras.main.pan(0,0,5000, Phaser.Math.Easing.Linear,false,this.nextScene,this);
    },
    update: function (time, delta)
    { 
      
    },
    nextScene(camera, progress, x, y){
        if(progress == 1){
            this.scene.start('intro');
        }
    }
});