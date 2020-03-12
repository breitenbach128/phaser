//Main Game Scene
/// <reference path="../../def/phaser.d.ts"/>

var GameScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function GameScene ()
    {
        Phaser.Scene.call(this, { key: 'gamescene' });
    },

    preload: function ()
    {
        //this.load.scenePlugin('Slopes', 'src/plugins/phaser-slopes.min.js');
    },

    create: function ()
    {
        //Setup Global
        playScene = this;
        game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
        //Refresh/Setup HUD
        hud = this.scene.get('UIScene');;
        hud.handleEvents();
        


       
   
        // //Map the map
        // map = this.make.tilemap({key: 'map1'});
        // // tiles for the ground layer
        // var Tiles = map.addTilesetImage('map1_tiles','tiles');//called it map1_tiles in tiled
        // // create the ground layer
        // groundLayer = map.createDynamicLayer('ground', Tiles, 0, 0);

        //Map the map
        map = this.make.tilemap({key: current_map});

        //Create Background
        world_background = this.add.tileSprite(512, 256, map.widthInPixels*2, map.heightInPixels*2, 'forest_background');

        // tiles for the ground layer
        var TilesForest = map.addTilesetImage('32Tileset','tiles32');//called it 32Tileset in tiled
        var TilesCastle = map.addTilesetImage('32Castle','castle32');//called it 32Castle in tiled
        var TilesCorruption = map.addTilesetImage('32Corruption','corruption32');//called it 32Corruption in tiled
        var CollisionTiles = map.addTilesetImage('collision','collisions32');//called it collision in tiled
        // create the ground layer
      
        let bglayer3 = map.createStaticLayer('bg3', [TilesCastle,TilesForest,TilesCorruption], 0, 0);
        let bglayer2 = map.createStaticLayer('bg2', [TilesCastle,TilesForest,TilesCorruption], 0, 0);
        let bglayer = map.createStaticLayer('bg', [TilesCastle,TilesForest,TilesCorruption], 0, 0);
        let fglayer = map.createStaticLayer('fg', [TilesCastle,TilesForest,TilesCorruption], 0, 0); 
        let fghiddenlayer= map.createDynamicLayer('fg_hidden', [TilesCastle,TilesForest,TilesCorruption], 0, 0); 
       
        //CREATE SECRET AREAS WITH HIDDEN FOREGROUND
        //fghiddenlayer.setDepth(DEPTH_LAYERS.FG);
        secretTiles = this.add.group({classType:SecretTile, runChildUpdate:true});
        console.log("S Tile Grp",secretTiles);
        fghiddenlayer.forEachTile(function (tile) {
            if(tile.index != -1){
                //console.log(tile);
                let newImgIndex = tile.index - tile.tileset.firstgid;
                let secretTile = new SecretTile(this,tile.pixelX+tile.width/2,tile.pixelY+tile.height/2,tile.tileset.image.key,newImgIndex).setOrigin(0.5).setDepth(DEPTH_LAYERS.FG);
                secretTiles.add(secretTile);
            }
        },this);
        fghiddenlayer.destroy();
        
        this.collisionLayer = map.createDynamicLayer('collision', CollisionTiles, 0, 0);
        this.collisionLayer.setVisible(false);
        this.collisionLayer.setCollisionByProperty({ collides: true });
        // the solana will collide with this layer
        //groundLayer.setCollisionByExclusion([-1]);
        //groundLayer.setCollisionBetween(0, 256);
        // set the boundaries of our game world
        this.matter.world.convertTilemapLayer(this.collisionLayer);
        this.matter.world.setBounds(0,0,map.widthInPixels, map.heightInPixels);
        console.log("Map size:",map.widthInPixels, map.heightInPixels);
        //Generate shadow canvas
        //Shadow Canvas
        if(this.textures.get("canvasShadow").key != "__MISSING"){  
            let oldShadow = this.textures.get("canvasShadow");
            oldShadow.destroy();
        }
        shadow_layer = this.textures.createCanvas("canvasShadow", map.widthInPixels, map.heightInPixels);        
        shadow_context = shadow_layer.getContext();
        shadow_context.fillRect(0,0,map.widthInPixels, map.heightInPixels); 
        shadow_layer.refresh();

        //Draw Debug
        
        this.matter.world.createDebugGraphic();
        this.matter.world.drawDebug = false;
        //Add Labels for tile bodies for easier collision management
        this.collisionLayer.forEachTile(function (tile) {
            // In Tiled, the platform tiles have been given a "type" property which is a string
            //if (tile.properties.type === 'lava' || tile.properties.type === 'spike')
            //{
                if(tile.physics.matterBody){
                    tile.physics.matterBody.body.label = 'GROUND';
                    tile.physics.matterBody.setCollisionCategory(CATEGORY.GROUND);
                    tile.physics.matterBody.setFriction(.9,0);

                    //Fix "Gaps between tiles small bodies can squeeze thru" //TESTED 1.1 DOES NOT WORK
                    //Phaser.Physics.Matter.Matter.Body.scale(tile.physics.matterBody.body, 1.1, 1.0)

                    //Make them as light blocking polygons
                    lightPolygons.push(createLightObstacleRect(tile.x*32,tile.y*32,32,32));
                }
               
            //}
        });
        //Raycasting
        lightCanvas = this.add.graphics(0, 0);
        lightCanvas.setAlpha(0.5);
        //Perimeter Block
        lightPolygons.push([[-1, -1], [(map.widthInPixels + 1), -1], [(map.widthInPixels + 1), (map.heightInPixels + 1)], [-1, (map.heightInPixels + 1)]]);
        //console.log("Raycasting :",lightCanvas,lightPolygons);


        //NEED TO TEST THIS OUT WITH JUMP CODE. I NEED TO CREATE A TRUE GAME OBJECT HERE, SO I CAN REFERENCE THE TYPE.
        //NOT ABSOLUTELY NEEDED, BUT PROBABLY BETTER.

        //Test Hulls Layer for Object Creation for collision. Very Effecient.
        //See http://labs.phaser.io/edit.html?src=src/game%20objects/tilemap/collision/matter%20ghost%20collisions.js
        // let rectCarve = map.findObject('hulls', function (obj) { return obj.name === 'hull'; });
        // let rectHull = this.matter.add.rectangle(
        //     rectCarve.x + (rectCarve.width / 2), rectCarve.y + (rectCarve.height / 2),
        //     rectCarve.width, rectCarve.height,
        //     { isStatic: true }
        // );
        
        // rectHull.label = 'GROUND';
        // rectHull.collisionFilter.category = CATEGORY.GROUND;
        // rectHull.friction = .9;

        // console.log("RectHull",rectHull,rectCarve)
        




        //CREATE PLAYER ENTITIES
        // create the solana sprite    
        solana = new Solana(this,192,160);  
        bright = new Bright(this,192,128);
        soullight =new SoulLight({scene: this, x:192,y:128,sprite:'bright',frame:0},bright);

        //Create Soulight Effect
        //This should be inactive until the player retrieves the soulight gem for the first time.
        this.particle_soulight = this.add.particles('shapes',  this.cache.json.get('effect-flame-fall'));   
        //this.particle_soulight.emitters.list[0].setScale(0.5);
        this.particle_soulight.emitters.list[0].setLifespan(160);
        //
        this.changePlayerReady = true;
        //Emit Events
        //this.events.emit('solanaSetup'); 

        //Setup HUD
        hud.setupHud(solana);

        //Animations - Move to JSON later, if it makes sense       
        createAnimations(this);

        //Create Camera        
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels+128);  
        this.cameras.main.setBackgroundColor('#ccccff'); 
        this.cameras.main.setZoom(2);
        this.cameras.main.roundPixels = true;
        camera_main = this.cameras.main;
        
        

        //Controls
        createControls(this);


        //GROUPS
        //BrightBeams
        ab_brightbeams = this.add.group({ 
            classType: BrightBeamBlock,
            runChildUpdate: true 
        });
        //SolarBlasts
        ab_solarblasts = this.add.group({ 
            classType: SolarBlast,
            runChildUpdate: true 
        });
        //Enemies
        enemies = this.add.group({ 
            classType: Enemy,
            runChildUpdate: true 
        });
        //Flying Enemies
        enemiesFly = this.add.group({ 
            classType: EnemyFlying,
            runChildUpdate: true 
        });
        //Bullets
        bullets = this.add.group({
            classType: Bullet,
            //maxSize: 50,
            runChildUpdate: true
        });
        //Mirrors
        mirrors = this.add.group({ 
            classType: Mirror,
            runChildUpdate: true 
        });
        //Barriers
        barriers = this.add.group({ 
            classType: Barrier,
            runChildUpdate: true 
        });
        //Levers
        levers = this.add.group({ 
            classType: TMXLever,
            runChildUpdate: true 
        });
        //Pressure Plates
        plates = this.add.group({ 
            classType: TMXPlate,
            runChildUpdate: true 
        });
        //Platforms 
        platforms = this.add.group({ 
            classType: TMXPlatform,
            runChildUpdate: true 
        });
        //Falling Platforms
        platfalls = this.add.group({ 
            classType: Fallplat,
            runChildUpdate: true 
        });
        //Swings
        platSwingTweens = this.add.group({ 
            classType: PlatSwingTween,
            runChildUpdate: true 
        });

        //Buttons 
        buttons = this.add.group({ 
            classType: TMXButton,
            runChildUpdate: true 
        });
        //Zones
        triggerzones = this.add.group({ 
            classType: TMXZone,
            runChildUpdate: true 
        });
        //Lamps
        crystallamps = this.add.group({ 
            classType: CrystalLamp,
            runChildUpdate: true 
        });
        //Gates
        gates = this.add.group({ 
            classType: TMXGate,
            runChildUpdate: true 
        });
        //Exits
        exits = this.add.group({ 
            classType: Exit,
            runChildUpdate: true 
        });
        //Entrances
        entrances = this.add.group({ 
            classType: Entrance,
            runChildUpdate: true 
        });
        //Fireflies
        fireflies = this.add.group({ 
            classType: Firefly,
            runChildUpdate: true 
        });
        //Rocks
        rocks = this.add.group({ 
            classType: Rock,
            runChildUpdate: true 
        });
        //Crates
        crates = this.add.group({ 
            classType: Crate,
            runChildUpdate: true 
        });
        //NPCs
        npcs = this.add.group({ 
            classType: NPC,
            runChildUpdate: true 
        });
        //spiders
        spiders = this.add.group({ 
            classType: EnemySpider,
            runChildUpdate: true 
        });
        //Light Shards
        light_shards = this.add.group({ 
            classType: LightShard,
            runChildUpdate: true 
        });
        //Dark Shards
        //Breakable Tiles
        breakabletiles = this.add.group({ 
            classType: BreakableTile,
            runChildUpdate: true 
        });
        //Light Bursts
        light_bursts = this.add.group({ 
            classType: LightBurst,
            runChildUpdate: true 
        });
        
        //Clear Boss
        boss = -1;

        speed = Phaser.Math.GetSpeed(300, 1);
       

        //Create enemy layer
        enemylayer = map.getObjectLayer('enemies');
        //Create spawn layer 
        spawnlayer = map.getObjectLayer('spawns');
        //Create mirror Layer
        let objectlayer = map.getObjectLayer('objects');
        //Create Trigger Layer
        let triggerlayer = map.getObjectLayer('triggers');
        //Create exit layer
        let exitlayer = map.getObjectLayer('exit');
        //Create NPC layer
        let npclayer = map.getObjectLayer('npcs');

        //Spawn NPCs from Layer if the layer exist
        tutorialRunning = false;
        if(npclayer){
            for(e=0;e<npclayer.objects.length;e++){
                let tmxObjRef = npclayer.objects[e];
                let props = getTileProperties(tmxObjRef.properties);

                if(tmxObjRef.type == "guide"){
                    tutorialRunning = true;                    
                    polaris = new Polaris(this,tmxObjRef.x,tmxObjRef.y);

                    //Check for state saves
                    let findState = findWithAttr(guideStates,'map',current_map);
                    if(findState == -1){
                        guideStates.push(new stateData('polaris',current_map,polaris.x,polaris.y))
                    }else{
                        polaris.setPosition(guideStates[findState].pos.x,guideStates[findState].pos.y);
                    };//Set this so it starts the running guide
                }else{
                    npcs.get(tmxObjRef.x,tmxObjRef.y,'npc1');
                }
            }
        }


        //Spawn Enemies from Enemy TMX Object layer
        for(e=0;e<enemylayer.objects.length;e++){
            let tmxObjRef = enemylayer.objects[e];
            let props = getTileProperties(tmxObjRef.properties);
            let EnemyType = props.enemyType;
            let EnemyClass = props.enemyClass;
            let PassiveBehavior = props.pBehav;
            let AggressivBehavior = props.aBehav;
            let weapon = props.weapon;
            let new_enemy;
            let path = '[{"x":0,"y":0}]';

            //Boss?
            if(tmxObjRef.type == "boss"){
                console.log('boss',props);
                boss = new SpiderHive(this,tmxObjRef.x,tmxObjRef.y);
                boss.setPosition(tmxObjRef.x+tmxObjRef.width/2,tmxObjRef.y+tmxObjRef.height/2+18);
                //Setup boss HUD info
                hud.setBossVisible(true);
                hud.initBossHealth();
            //SPIDER
            }else if(tmxObjRef.type == "spider"){
                spider = spiders.get(tmxObjRef.x,tmxObjRef.y);
                spider.setPosition(tmxObjRef.x,tmxObjRef.y);
            }else{

                //Standard Types            
                if(EnemyClass == 'ground'){
                    new_enemy = enemies.get(enemylayer.objects[e].x,enemylayer.objects[e].y,EnemyType);
                }else if(EnemyClass == 'air'){
                    new_enemy = enemiesFly.get(enemylayer.objects[e].x,enemylayer.objects[e].y,EnemyType);                
                }else{
                    new_enemy = enemies.get(enemylayer.objects[e].x,enemylayer.objects[e].y,EnemyType);
                }

                if(props.path){
                    path = props.path;
                }
                if(props.tint){
                    let newTint =  (Phaser.Display.Color.HexStringToColor(props.tint))._color; //0x333333
                    new_enemy.setTint(newTint);
                }
                if(props.scale){
                    new_enemy.setScale(props.scale);
                }

                if(new_enemy){
                    //Setup Enemy
                    new_enemy.setActive(true);
                    new_enemy.setVisible(true);
                    new_enemy.setBehavior(PassiveBehavior,AggressivBehavior,weapon);
                    new_enemy.setPath(path);
                    
                    
                } 
            }
        }
        //Spawn Objects
        for(e=0;e<objectlayer.objects.length;e++){
            let mapObject;
            let x_offset = 0;
            let y_offset = 0;
            let tmxObjRef = objectlayer.objects[e];
            if(tmxObjRef.type == "mirror"){  
                mapObject = mirrors.get();
                x_offset = mapObject.width/2;
                y_offset = mapObject.height/2;
            }else if(tmxObjRef.type == "window"){  
                mapObject = barriers.get(-1000,-1000,"tmxwindow",0,true);
                x_offset = -mapObject.width/2;
                y_offset = mapObject.height/2;
            }else if(tmxObjRef.type == "hive"){
                let hiveProps = getTileProperties(tmxObjRef.properties);
                for(let b=0;b<hiveProps.bugsMax;b++){
                    let rX = Phaser.Math.Between(-32,32);
                    let rY = Phaser.Math.Between(-32,32);
                    fireflies.get(tmxObjRef.x+rX,tmxObjRef.y+rY);
                }
            }else if(tmxObjRef.type == "platfall"){ 
                x_offset = tmxObjRef.width/2;
                y_offset = tmxObjRef.height/2;
                //let newFallPlat = new Fallplat(this,tmxObjRef.x+x_offset,tmxObjRef.y-y_offset,'tiles32',tmxObjRef.gid-1);
                platfalls.get(tmxObjRef.x+x_offset,tmxObjRef.y-y_offset,'tiles32',tmxObjRef.gid-1);

            }else if(tmxObjRef.type == "breakabletile"){  
                x_offset = tmxObjRef.width/2;
                y_offset = tmxObjRef.height/2;
                let newbreakabletile = breakabletiles.get();
                let breakabletileProps = getTileProperties(tmxObjRef.properties);
                console.log("New Breakable",breakabletileProps);
                newbreakabletile.setup(tmxObjRef.x+x_offset,tmxObjRef.y+y_offset,1,breakabletileProps.frames);
            }else if(tmxObjRef.type == "rock"){  
                let newRock = rocks.get();
                newRock.setup(tmxObjRef.x,tmxObjRef.y,1);
            }else if(tmxObjRef.type == "crate"){  
                let newCrate = crates.get(tmxObjRef.x,tmxObjRef.y);
            }else if(tmxObjRef.type == "item"){
                let newitem = new EquipItem(this,tmxObjRef.x,tmxObjRef.y,'gameitems',GAMEITEM[tmxObjRef.name.toUpperCase()]);

            }else if(tmxObjRef.type == "swingTween"){  
                let swingTw = platSwingTweens.get(tmxObjRef.x+tmxObjRef.width/2,tmxObjRef.y+tmxObjRef.height/2);
                //Dynamically Resize platforms Swing
                swingTw.setSize(tmxObjRef.width,tmxObjRef.height);
                swingTw.setDisplaySize(tmxObjRef.width,tmxObjRef.height);
                swingTw.setup(swingTw.x,swingTw.y, getTileProperties(tmxObjRef.properties),tmxObjRef.name);

            }

            if(mapObject){ 
                mapObject.setup(tmxObjRef.x-x_offset,tmxObjRef.y-y_offset,tmxObjRef.rotation);
            }
        }
        //Spawn Triggers
        for(e=0;e<triggerlayer.objects.length;e++){
            //Check for Type first, to determine the GET method used.
            let triggerObj;
            let tmxObjRef = triggerlayer.objects[e];
            if(tmxObjRef.type == "lever"){  
                triggerObj = new TMXLever(this,tmxObjRef.x,tmxObjRef.y);             
                levers.add(triggerObj);
            }else if(tmxObjRef.type == "gate"){
                triggerObj = gates.get();
            }else if(tmxObjRef.type == "plate"){
                triggerObj = plates.get();
            }else if(tmxObjRef.type == "platform"){
                triggerObj = platforms.get();
            }else if(tmxObjRef.type == "button"){
                triggerObj = buttons.get();
            }else if(tmxObjRef.type == "crystallamp"){
                triggerObj = crystallamps.get();
            }else if(tmxObjRef.type == "zone"){
                triggerObj = triggerzones.get();
                triggerObj.setDisplaySize(tmxObjRef.width, tmxObjRef.height);
            }
            if(triggerObj){
                let trig_x_offset = tmxObjRef.width/2;
                let trig_y_offset = tmxObjRef.height/2;
                triggerObj.setup(tmxObjRef.x+trig_x_offset,tmxObjRef.y+trig_y_offset,getTileProperties(tmxObjRef.properties),tmxObjRef.name);
            }
        }
          
        //Spawn Exits
        for(e=0;e<exitlayer.objects.length;e++){  
            let exitObj;
            let tmxObjRef = exitlayer.objects[e];
            //console.log(tmxObjRef)
            if(tmxObjRef.type == "entrance"){
                exitObj = entrances.get();
                exitObj.setup(tmxObjRef.x+tmxObjRef.width/2,tmxObjRef.y+tmxObjRef.height/2,tmxObjRef.name);
                //Re-position player to match entrance to exit they left.
                if(exitObj.name == current_exit){
                    
                    solana.sprite.setPosition(exitObj.x,exitObj.y+exitObj.height/2-solana.sprite.height/2);
                    bright.sprite.setPosition(exitObj.x,exitObj.y-32);
                    soullight.sprite.setPosition(exitObj.x,exitObj.y-32);
                    solana.setLastEntrance(exitObj);
                    this.cameras.main.centerOn(exitObj.x,exitObj.y);
                    // make the camera follow the solana
                    //this.cameras.main.startFollow(solana.sprite,true,.1,.1,0,0);
                }
            }else{
                exitObj = exits.get();
                exitObj.setup(tmxObjRef.x+tmxObjRef.width/2,tmxObjRef.y+tmxObjRef.height/2,getTileProperties(tmxObjRef.properties),tmxObjRef.name);
                exitObj.setDisplaySize(tmxObjRef.width,tmxObjRef.height);
            } 
        }

        //SETUP LEVER TARGETS
        setupTriggerTargets(levers,"levers",this);
        setupTriggerTargets(plates,"plates",this);
        setupTriggerTargets(buttons,"buttons",this);
        setupTriggerTargets(triggerzones,"zones",this);
        setupTriggerTargets(platforms,"platforms",this);
        setupTriggerTargets(crystallamps,"crystallamps",this);

        //Particles
        emitter_dirt_spray = this.add.particles('impact1').createEmitter({
            x: 400,
            y: 300,
            speed: { min: -200, max: 200 },
            angle: { min: 0, max: -180 },
            scale: { start: 0.2, end: 0.1 },
            blendMode: 'NORMAL',
            active: false,
            lifespan: 100,
            gravityY: 800
         });
        emitter0 = this.add.particles('impact1').createEmitter({
            x: 400,
            y: 300,
            speed: { min: -800, max: 800 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.2, end: 0.1 },
            blendMode: 'NORMAL',
            active: false,
            lifespan: 200,
            gravityY: 800
         });
         emitter_blood = this.add.particles('impact1').createEmitter({
            x: 400,
            y: 300,
            speed: { min: -300, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.3, end: 0.05 },
            blendMode: 'NORMAL',
            active: false,
            lifespan: 300,
            gravityY: 600,
            tint: "#FF0000"
         });
         //Timer  - Example
         //spawner = this.time.addEvent({ delay: 5000, callback: this.spawnEnemies, callbackScope: this, loop: true });
         //timeEventName.remove();spawnEnemies(spawnlayer.objects)
         
         //Pass Energy Regen
         this.energyTimer = this.time.addEvent({ delay: 200, callback: this.generateEnergy, callbackScope: this, loop: true });

      
        
         //Lightning construct using preloaded cavnas called canvasShadow (See Preloader)
        var shadTexture = this.add.image(map.widthInPixels/2, map.heightInPixels/2, 'canvasShadow');
        shadTexture.alpha = .6;
        shadTexture.setDepth(DEPTH_LAYERS.FRONT)

        var light1 = this.add.image(256,64,'light1');
        light1.alpha = .5;
        light1.tint = 0xCCCC00;

        solana.z = light1.z+1;
        bright.z = light1.z+1;

         //Start soulight play
         soullight.sprite.anims.play('soulight-move', true);//Idle

        solana.setDepth(DEPTH_LAYERS.PLAYERS + 2);
        bright.setDepth(DEPTH_LAYERS.PLAYERS);

        //*********************************//
        // PHYSICS IMPLEMENTATION          //
        //  -Generate all detection        //
        //*********************************//

        //New Physics Implementation for Collision and Sensors
        // this.matterCollision.addOnCollideStart({
        //     objectA: bright,
        //     objectB: trapDoor,
        //     callback: function(eventData) {
        //       // This function will be invoked any time the player and trap door collide
        //       const { bodyA, bodyB, gameObjectA, gameObjectB, pair } = eventData;
        //       // bodyA & bodyB are the Matter bodies of the player and door respectively
        //       // gameObjectA & gameObjectB are the player and door respectively
        //       // pair is the raw Matter pair data
        //     },
        //     context: this // Context to apply to the callback function
        // });
        //Reset any check properties BEFORE the update checks.
        this.matter.world.on('beforeupdate', function (event) {
            bright.touching.left = 0;
            bright.touching.right = 0;
            bright.touching.up = 0;
            bright.touching.down = 0;
            //Add Solana checks for being on a wall or on the ground.
            solana.touching.left = 0;
            solana.touching.right = 0;
            solana.touching.up = 0;
            solana.touching.down = 0;
        });

        this.matterCollision.addOnCollideActive({
            objectA: [bright.sensor.sensors.bottom,
                bright.sensor.sensors.left,
                bright.sensor.sensors.right,
                bright.sensor.sensors.top],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
              if (gameObjectB !== undefined && gameObjectB instanceof Phaser.Tilemaps.Tile) {
                // Now you know that gameObjectB is a Tile, so you can check the index, properties, etc.
                
                if (gameObjectB.properties.collides){
                    if(bodyA.label == "BRIGHT_BOTTOM"){
                        bright.touching.down++;
                    }
                    if(bodyA.label == "BRIGHT_RIGHT"){
                        bright.touching.right++;
                    }
                    if(bodyA.label == "BRIGHT_LEFT"){
                        bright.touching.left++;
                    }
                    if(bodyA.label == "BRIGHT_TOP"){
                        bright.touching.up++;
                    }
                } 
              }
              if (gameObjectB !== undefined &&
                (gameObjectB instanceof TMXPlatform
                      || gameObjectB instanceof Barrier
                      || gameObjectB instanceof TMXGate
                      || gameObjectB instanceof TMXPlate
                      || gameObjectB instanceof Fallplat
                      || gameObjectB instanceof PlatSwingTween
                      || gameObjectB instanceof PlatSwing
                      || gameObjectB instanceof BrightBeamBlock)) {   
                
                //handle plaform jumping allowance             
                if(bodyA.label == "BRIGHT_BOTTOM"){
                    bright.touching.down++;
                }
                if(bodyA.label == "BRIGHT_RIGHT"){
                    bright.touching.right++;
                }
                if(bodyA.label == "BRIGHT_LEFT"){
                    bright.touching.left++;
                }
                if(bodyA.label == "BRIGHT_TOP"){
                    bright.touching.up++;
                }                         
              } 
            }
        });

        this.matterCollision.addOnCollideActive({
            objectA:[solana.sensors.top,solana.sensors.bottom,solana.sensors.left,solana.sensors.right],
            callback: eventData => {
              const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
              //console.log(bodyA.label,bodyB.label)
              if (gameObjectB !== undefined && gameObjectB instanceof Phaser.Tilemaps.Tile) {
                // Now you know that gameObjectB is a Tile, so you can check the index, properties, etc.
                if (gameObjectB.properties.collides){
                    if(bodyA.label == "SOLANA_TOP"){
                        solana.touching.up++;
                    }
                    if(bodyA.label == "SOLANA_BOTTOM"){
                        solana.touching.down++;
                    }
                    if(bodyA.label == "SOLANA_RIGHT"){
                        solana.touching.right++;
                        //solana.x--;
                    }
                    if(bodyA.label == "SOLANA_LEFT"){
                        solana.touching.left++;
                        //solana.x++;
                    }
                }                
              }
              //Allow Jumping off of objects
              if (gameObjectB !== undefined &&
                (gameObjectB instanceof TMXPlatform
                || gameObjectB instanceof Barrier
                || gameObjectB instanceof TMXGate
                || gameObjectB instanceof TMXPlate
                || gameObjectB instanceof Fallplat
                || gameObjectB instanceof PlatSwingTween  
                || gameObjectB instanceof PlatSwing              
                || gameObjectB instanceof BrightBeamBlock)) {  

                    //handle plaform jumping allowance             
                    if(bodyA.label == "SOLANA_TOP"){
                        solana.touching.up++;
                        if(bodyB.label == "PLAT_BOTTOM" && gameObjectA.body.velocity.y < 0){
                            //Start tracking and disable collisions
                            gameObjectB.oneWayStart(gameObjectA);
                        }                       
                    }
                    if(bodyA.label == "SOLANA_BOTTOM"){
                        solana.touching.down++;
                    }
                    if(bodyA.label == "SOLANA_RIGHT"){
                        solana.touching.right++;
                    }
                    if(bodyA.label == "SOLANA_LEFT"){
                        solana.touching.left++;
                    }                            
              }
            //Handle Platform Pass thru

            //Count rocks and crates as walls.
            if (gameObjectB !== undefined &&
                (gameObjectB instanceof Rock
                || gameObjectB instanceof Crate)) {   

                    if(bodyA.label == "SOLANA_BOTTOM"){
                        solana.touching.down++;
                    }                          
                }
            }
        });
        this.matterCollision.addOnCollideActive({
            objectA: bright,
            callback: eventData => {
              const { bodyB, gameObjectB, bodyA, gameObjectA } = eventData;

                if (gameObjectB !== undefined && gameObjectB instanceof TMXPlate) {
                    if (gameObjectA.light_status == 1) {//Only in Dark Mode
                        gameObjectB.usePlate();
                    }
                }

                if (gameObjectB !== undefined && gameObjectB instanceof TMXZone) {
                    gameObjectB.enterZone(bright);
                } 
            }
        });
        this.matterCollision.addOnCollideActive({
            objectA: solana.sprite,
            callback: eventData => {
              const { bodyB, gameObjectB } = eventData;

              let control_up = solana.ctrlDeviceId >= 0? gamePad[solana.ctrlDeviceId].checkButtonState('up') > 0 : keyPad.checkKeyState('W') > 0;
              let control_down = solana.ctrlDeviceId >= 0? gamePad[solana.ctrlDeviceId].checkButtonState('down') > 0 : keyPad.checkKeyState('S') > 0;

              if (gameObjectB !== undefined && gameObjectB instanceof TMXLever) {
                //Solana Touching a lever?
                if(curr_player==players.SOLANA){
                    //Only control if currently the active control object
                    if(control_up) {
                        gameObjectB.useLever();
                    }else if(control_down) {
                        gameObjectB.useLever();
                    }
                }
              }
              if (gameObjectB !== undefined && gameObjectB instanceof TMXButton) {
                //Solana Touching a lever?
                if(curr_player==players.SOLANA){
                    //Only control if currently the active control object
                    if(control_up) {
                        gameObjectB.useButton();
                    }else if(control_down) {
                        gameObjectB.useButton();
                    }
                }
              }
              if (gameObjectB !== undefined && gameObjectB instanceof TMXPlate) {
                //Solana Touching a lever?
                if(curr_player==players.SOLANA){
                    //Solana is not heavy enough to use plates
                    //gameObjectB.usePlate();

                }
              }
              if (gameObjectB !== undefined && gameObjectB instanceof MirrorSensor) {
                if(curr_player==players.SOLANA){
                    //Only control if currently the active control object
                    if(control_up) {
                        gameObjectB.parent.rotateMirror(2);
                    }else if(control_down) {
                        gameObjectB.parent.rotateMirror(-2);
                    }
                }
              }
              if (gameObjectB !== undefined && gameObjectB instanceof Exit) {
                //Solana Touching a lever?
                if(curr_player==players.SOLANA){

                    gameObjectB.exitLevel(solana);

                }
              }
              //Solana Enters a zone trigger
              if (gameObjectB !== undefined && gameObjectB instanceof TMXZone) {
                    gameObjectB.enterZone(solana);
              }

              if (gameObjectB !== undefined && gameObjectB instanceof EquipItem) {
                //Solana Touching a lever?
                if(curr_player==players.SOLANA){

                    gameObjectB.equipTo(solana);

                }
              }
              if (gameObjectB !== undefined && gameObjectB instanceof NPCSensor) {
                //Solana Touching a lever?
                if(curr_player==players.SOLANA && control_up){
                    gameObjectB.parent.interact(solana);
                }
              }
              if (gameObjectB !== undefined && bodyB.label == "GATE_BOTTOM") {
                //Solana being crushed by a gate?
                if(bodyB.velocity.y > 0){
                    solana.receiveDamage(1);
                    if(gameObjectB.x > solana.x){
                        solana.setVelocityX(-5);
                        //Work on making her not collide with the gate for a few seconds.
                    }else{
                        solana.setVelocityX(5);
                    }
                }
              }
            }
        });

        this.matter.world.on('collisionstart', function (event) {
            for (var i = 0; i < event.pairs.length; i++) {
                var bodyA = getRootBody(event.pairs[i].bodyA);
                var bodyB = getRootBody(event.pairs[i].bodyB);
                var GameObjectA =  bodyA.gameObject;
                var GameObjectB =  bodyB.gameObject;


                //Between Solana and Enemies
                if ((bodyA.label === 'ENEMY' && bodyB.label === 'SOLANA') || (bodyA.label === 'SOLANA' && bodyB.label === 'ENEMY')) {
                    
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'ENEMY');
                    if (!gObjs[0].dead){
                        //Need Damage invul timer
                        //gObjs[1].receiveDamage(1);
                        
                        if(gObjs[1].x < gObjs[0].x){
                            gObjs[1].setVelocity(-4,-4);
                        }else{
                            gObjs[1].setVelocity(4,-4);
                        }
                    }  
                }
                //Between Fallplat and Solana
                if ((bodyA.label === 'FALLPLAT' && bodyB.label === 'SOLANA') || (bodyA.label === 'SOLANA' && bodyB.label === 'FALLPLAT')) {
                    //Get Bullet Object and run hit function
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'FALLPLAT');
                    if (gObjs[0].active && gObjs[0].y > gObjs[1].y){
                        gObjs[0].touched();
                    }  
                }
                //Between Fallplat and ANYTHING ELSE
                if ((bodyA.label === 'FALLPLAT' && bodyB.label !== 'SOLANA') || (bodyA.label !== 'SOLANA' && bodyB.label === 'FALLPLAT')) {
                    //Get Bullet Object and run hit function
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'FALLPLAT');
                    //if (gObjs[0].ready == false && gObjs[0].y < gObjs[1].tile.pixelY){
                    if (gObjs[0].ready == false){
                        emitter0.active = true;
                        emitter0.explode(5,gObjs[0].x,gObjs[0].y);
                        gObjs[0].setDead();
                    }  
                }
                //Between Bullets and SOLID
                if ((bodyA.label === 'BULLET' && bodyB.label === 'SOLID') || (bodyA.label === 'SOLID' && bodyB.label === 'BULLET')) {
                    //Get Bullet Object and run hit function
                    const bulletBody = bodyA.label === 'BULLET' ? bodyA : bodyB;
                    const bulletObj = bulletBody.gameObject;
                    emitter0.active = true;
                    emitter0.explode(5,bulletObj.x,bulletObj.y);
                    bulletObj.hit();
                }
                //Between Bullets and GROUND
                if ((bodyA.label === 'BULLET' && bodyB.label === 'GROUND') || (bodyA.label === 'GROUND' && bodyB.label === 'BULLET')) {
                    //Get Bullet Object and run hit function
                    const bulletBody = bodyA.label === 'BULLET' ? bodyA : bodyB;
                    const bulletObj = bulletBody.gameObject;
                    emitter0.active = true;
                    emitter0.explode(5,bulletObj.x,bulletObj.y);
                    bulletObj.hit();
                }
                //Between Bullets and Solana
                if ((bodyA.label === 'BULLET' && bodyB.label === 'SOLANA') || (bodyA.label === 'SOLANA' && bodyB.label === 'BULLET')) {
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'BULLET');
                    if (gObjs[0].active){
                        gObjs[0].hit();
                        let applyTargetEffects = gObjs[0].getEffects();
                        if(applyTargetEffects.length > 0){gObjs[1].addEffects(applyTargetEffects)};
                        gObjs[1].receiveDamage(1);
                    }  
                }
                //Between Light Shards and Solana
                if ((bodyA.label === 'LIGHT_SHARD' && bodyB.label === 'SOLANA') || (bodyA.label === 'SOLANA' && bodyB.label === 'LIGHT_SHARD')) {
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'LIGHT_SHARD');
                    if (gObjs[0].active){
                        gObjs[0].hit();
                        hud.collectShard('light',1);
                    }  
                }
                //Between Solar blast and Enemies
                if ((bodyA.label === 'ABILITY-SOLAR-BLAST' && bodyB.label === 'ENEMY') || (bodyA.label === 'ENEMY' && bodyB.label === 'ABILITY-SOLAR-BLAST')) {
                    //Get Bullet Object and run hit function
                    let bulletObj = GameObjectB;
                    let enemyObj = GameObjectA;
                    if(bodyA.label === 'BULLET'){
                        bulletObj = GameObjectA;
                        enemyObj = GameObjectB;
                    }

                    if (bulletObj.active === true){
                        //bullet hits
                        bulletObj.hit();
                        //then hurt solana
                        enemyObj.receiveDamage(1);
                    }  

                }
                //Between Soulight and Solana
                if ((bodyA.label === 'SOULLIGHT' && bodyB.label === 'SOLANA') || (bodyA.label === 'SOLANA' && bodyB.label === 'SOULLIGHT')) {
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'SOULLIGHT');
                    if (gObjs[0].active){
                        gObjs[0].lockLight(gObjs[1],0);
                    }  
                }
                //Between Soulight and Bright
                if ((bodyA.label === 'SOULLIGHT' && bodyB.label === 'BRIGHT') || (bodyA.label === 'BRIGHT' && bodyB.label === 'SOULLIGHT')) {
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'SOULLIGHT');
                    if (gObjs[0].active){
                        gObjs[0].lockLight(gObjs[1],1);
                    }  
                }
                //Between SoulTransfer and Solana
                if ((bodyA.label === 'SOULTRANSFER' && bodyB.label === 'SOLANA') || (bodyA.label === 'SOLANA' && bodyB.label === 'SOULTRANSFER')) {
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'SOULTRANSFER');
                    if (gObjs[0].active){
                        gObjs[0].hit(0);
                    }  
                }
                //Between SoulTransfer and Solid
                if ((bodyA.label === 'SOULTRANSFER' && bodyB.label === 'SOLID') || (bodyA.label === 'SOLID' && bodyB.label === 'SOULTRANSFER')) {
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'SOULTRANSFER');
                    if (gObjs[0].active){
                        gObjs[0].burn();
                    }  
                }
                //Between SoulTransfer and Ground
                if ((bodyA.label === 'SOULTRANSFER' && bodyB.label === 'GROUND') || (bodyA.label === 'GROUND' && bodyB.label === 'SOULTRANSFER')) {
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'SOULTRANSFER');
                    if (gObjs[0].active){
                        gObjs[0].burn();
                    }  
                }
                //Between SoulTransfer and Enemies
                if ((bodyA.label === 'SOULTRANSFER' && bodyB.label === 'ENEMY') || (bodyA.label === 'ENEMY' && bodyB.label === 'SOULTRANSFER')) {
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'SOULTRANSFER');
                    if (gObjs[0].active){
                        gObjs[0].burn();
                        gObjs[1].receiveDamage(1);
                    }  
                }
                //Between SoulTransfer and Bright
                if ((bodyA.label === 'SOULTRANSFER' && bodyB.label === 'BRIGHT') || (bodyA.label === 'BRIGHT' && bodyB.label === 'SOULTRANSFER')) {
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'SOULTRANSFER');
                    if (gObjs[0].active){
                        gObjs[0].hit(1);
                    }  
                }
                //Between SoulTransfer and Bright
                if ((bodyA.label === 'SOULTRANSFER' && bodyB.label === 'MIRROR') || (bodyA.label === 'MIRROR' && bodyB.label === 'SOULTRANSFER')) {
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'MIRROR');
                    if (gObjs[0].active){
                        gObjs[0].hit();
                    }  
                }
                //Solana and Fireflies
                if ((bodyA.label === 'FIREFLY' && bodyB.label === 'SOLANA') || (bodyA.label === 'SOLANA' && bodyB.label === 'FIREFLY')) {
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'FIREFLY');
                    if (gObjs[0].active){
                        hud.alterEnergy(10);
                        fireflies.killAndHide(gObjs[0]);
                        //gObjs[0].collect();
                    }  
                }
                //Solar Blast and Mirrors
                if ((bodyA.label === 'ABILITY-SOLAR-BLAST' && bodyB.label === 'MIRROR') || (bodyA.label === 'MIRROR' && bodyB.label === 'ABILITY-SOLAR-BLAST')) {
                    //Break out of loop to allow normal physics hits
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'MIRROR');
                    if (gObjs[0].active){
                        gObjs[0].hit();
                    }  
                    continue;
                }
                //Lamps and Blast
                if ((bodyA.label === 'ABILITY-SOLAR-BLAST' && bodyB.label === 'CRYSTAL_LAMP') || (bodyA.label === 'CRYSTAL_LAMP' && bodyB.label === 'ABILITY-SOLAR-BLAST')) {
                    console.log("blast hit lamp");
                    let bulletObj = GameObjectB;
                    let lampObj = GameObjectA;
                    if(bodyA.label === 'ABILITY-SOLAR-BLAST'){
                        bulletObj = GameObjectA;
                        lampObj = GameObjectB;
                    }
                    bulletObj.hit();
                    lampObj.turnOn();

                }
                //Lamps and Soul Tranfser
                if ((bodyA.label === 'SOULTRANSFER' && bodyB.label === 'CRYSTAL_LAMP') || (bodyA.label === 'CRYSTAL_LAMP' && bodyB.label === 'SOULTRANSFER')) {
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'SOULTRANSFER');
                    gObjs[0].burn();
                    gObjs[1].turnOn();

                }
                //Catch any non-event projectiles and destory them if they hit anything else they would not interact with.
                if (bodyA.label === 'BULLET' || bodyB.label === 'BULLET'){const bulletBody = bodyA.label === 'BULLET' ? bodyA : bodyB;const bulletObj = bulletBody.gameObject;bulletObj.hit();};
                if (bodyA.label === 'ABILITY-SOLAR-BLAST' || bodyB.label === 'ABILITY-SOLAR-BLAST'){ 
                    const bulletBody = bodyA.label === 'ABILITY-SOLAR-BLAST' ? bodyA : bodyB;
                    const bulletObj = bulletBody.gameObject;
                    bulletObj.hit();
                };
            }
        }, this);

        //Mouse
        pointer = this.input.activePointer;

        keyPad = new KeyboardMouseControl(this,pointer)

        if(playerMode == 0){
            solana.setController(playerConfig[0].ctrl);
            bright.setController(playerConfig[0].ctrl);
        }else if(playerMode == 1){
            solana.setController(playerConfig[0].ctrl);
            bright.setController(playerConfig[1].ctrl);

        }

        console.log("player Configs:",gamePad,playerModes[playerMode],playerConfig);

        //TIME SCALE
        let timeScale = 1;
        this.tweens.timeScale = timeScale; // tweens
        this.matter.world.engine.timing.timeScale = timeScale; // physics
        this.time.timeScale = timeScale; // time events
        console.log(this.time);

        //Draw Point area debug
        this.debugPointer = this.add.graphics();
        var color = 0xffff00;
        var thickness = 2;
        var alpha = 1;
        this.debugPointer.lineStyle(thickness, color, alpha);
        //this.pointerDraw.strokeRect(pointer.worldX-16, pointer.worldX-16, 32, 32);
        this.debugPointer.strokeRect(0,0,16,16);

        //Probably need a statemachine like I have for gamePad for the keyboard and mouse controls to have them update in the game scene. Mouse2 is sticking on jump

        //Debug Properties
        this.debugAimLine = this.add.graphics(0, 0);
        //Need to push all debug graphics into a single debug array for easy enable
        this.cameraLevel = 1;

        //Lights2d
        // solana.setPipeline('Light2D');
        // let light  = this.lights.addLight(0, 0, 200).setScrollFactor(0.0).setIntensity(2);

        //TEST PLATSWING
        //let swing = new PlatSwing(this,solana.x+32,solana.y-32);
        //let swing = new PlatSwingTween(this,solana.x+32,solana.y-32);

        
    },
    update: function (time, delta)
    {

        //Controller Update
        updateGamePads();
        keyPad.updateKeyState();
        //center camera on the spot between the players. Zoom out to a max.
        let disPlayers = Phaser.Math.Distance.Between(solana.x,solana.y,bright.x,bright.y);

        let midPoint = {x:(solana.x+bright.x)/2,y:(solana.y+bright.y)/2}
        this.cameras.main.centerOn(midPoint.x,midPoint.y);
        //Lvl 1, Normal Mode
        if(disPlayers < 500 && this.cameraLevel != 1){
            this.cameraLevel = 1;
            this.cameras.main.zoomTo(2,1000,'Linear');
        }
        //Lvl 2, Zoom out
        if(disPlayers >= 500 && disPlayers < 750 && this.cameraLevel != 2){
            if( this.cameraLevel == 3){this.splitScreen(false);}//If it was split screen, cancel that.
            this.cameraLevel = 2;
            this.cameras.main.zoomTo(1.75,1000,'Linear');            
        }
        //Lvl 3, Split the Camera
        if(disPlayers >= 750 && this.cameraLevel != 3){  
            this.cameraLevel = 3;          
            this.splitScreen(true);
        }

        //DEBUG
        if(GLOBAL_DEBUG){
            //Draw Pointer - DEBUG
            this.debugAimLine.clear();
            this.debugAimLine.lineStyle(5, 0xFF00FF, 1.0);
            this.debugAimLine.beginPath();
            if(curr_player == players.SOLANA){
                this.debugAimLine.moveTo(solana.x, solana.y);
            }else{
                this.debugAimLine.moveTo(bright.x, bright.y);
            }
            
            let targVector = {x:pointer.worldX,y:pointer.worldY};
            //Adjust for Split Screen
            if(this.cameraLevel == 3){
                let cam_p1 = this.cameras.getCamera('cam_p1');
                let cam_p2 = this.cameras.getCamera('cam_p2');
                let camVec = {x:0,y:0};
                if(curr_player == players.SOLANA){
                    camVec= pointer.positionToCamera(cam_p1);
                }else{
                    camVec= pointer.positionToCamera(cam_p2);
                }
                targVector = camVec;
            }
            this.debugAimLine.lineTo(targVector.x, targVector.y);
            this.debugAimLine.closePath();
            this.debugAimLine.strokePath();
            this.debugPointer.x = targVector.x-8;
            this.debugPointer.y = targVector.y-8;
        }

        //Updates
        solana.update(time,delta);
        bright.update(time,delta);
        soullight.update(time,delta);
        this.particle_soulight.emitters.list[0].setPosition(soullight.x,soullight.y);
        this.particle_soulight.emitters.list[0].setSpeedX(soullight.body.velocity.x);
        this.particle_soulight.emitters.list[0].setSpeedY(soullight.body.velocity.y);
        if(boss != -1){boss.update(time,delta);}
        if(tutorialRunning){
            polaris.update(time,delta);
        };

        //Draw lighting        
        shadow_context.fillRect(0,0,map.widthInPixels, map.heightInPixels);    
        
        //Do Crystal Lamps and Light Checking
        var solana_in_light = false;
        let lamps = crystallamps.getChildren()
        for(var x = 0;x < lamps.length;x++){
            var lamp = lamps[x];
            shadow_context = this.cutCanvasCircle(lamp.x,lamp.y,lamp.brightness,shadow_context);
            
            //Check if solana is inside at least one light, if not, flag them and damage them every x seconds.
            if(Phaser.Math.Distance.Between(lamp.x,lamp.y,solana.sprite.x,solana.sprite.y) <= lamp.brightness){solana_in_light = true;}

        }
        

        shadow_context = this.cutCanvasCircle(soullight.sprite.x,soullight.sprite.y,soullight.protection_radius.value,shadow_context);
        shadow_context = this.cutCanvasCircle(bright.x,bright.y,bright.light_radius,shadow_context);
        if(tutorialRunning){
            shadow_context = this.cutCanvasCircle(polaris.x,polaris.y,128,shadow_context);
        }
        if(Phaser.Math.Distance.Between(soullight.sprite.x,soullight.y,solana.sprite.x,solana.sprite.y) <= soullight.protection_radius.value){solana_in_light = true;}

        //is the solana outside the light? Do damage!

        //Instead of doing damage right away, do drain energy. IF totally drained, then take damage.
        solana.inLight = solana_in_light;
        let rate_of_energy_drain_outside_light = 1;
        if(!solana_in_light){
            hud.alterEnergy(-rate_of_energy_drain_outside_light);
            if(hud.energy.n <= 0){solana.receiveDamage(1);};
        };

        shadow_layer.refresh();


        //Update Light Source
        moveLightSource(soullight.sprite.x,soullight.sprite.y);

        //KEYPRESS DETECTION - USING CUSTOM CONTROLLER CLASS
        //Suicide to test animation
        if(keyPad.checkKeyState('P') == 1){            
            solana.receiveDamage(1);
        }
        
        //GLOBAL DEBUG TURN ON/OFF
        if(keyPad.checkKeyState('O') == 1){
            GLOBAL_DEBUG = !GLOBAL_DEBUG;
            if(GLOBAL_DEBUG == false){
                this.debugAimLine.clear();
                this.debugPointer.x = -100;
                this.debugPointer.y = -100;
                this.matter.world.drawDebug = false;
                this.matter.world.debugGraphic.clear();
                console.log(this.matter.world);
            }else{
                this.matter.world.drawDebug = true;
               
            }
             
        }
        //Test Matter Point Query
        if(keyPad.checkMouseState('MB2') == 1){
            console.log("MB2 Clicked");
            //Phaser.Physics.Matter.Matter.Query.point(this.matter.world.localWorld.bodies, pointer); 
            //this.matter.world.engine.world.bodies
            console.log(Phaser.Physics.Matter.Matter.Query.point(this.matter.world.localWorld.bodies, {x:pointer.worldX, y:pointer.worldY}));
        }
        
        if(keyPad.checkKeyState('X') == 1){  
            if(current_map == "map2"){current_map = "map3"}else{current_map = "map2"}; 
            hud.clearHud();       
            this.scene.restart();
        }   
        
        //Scroll parallax based on movement of bright or solana
        if(solana.mv_Xdiff != 0){
            //Parallax Background
            let paraMove = solana.mv_Xdiff < 0 ? -.50 : .50;
            world_background.tilePositionX += paraMove;
        }   
      
    },
    brightFollowMode: function(){
        bright.followMode = !bright.followMode;
        if(!bright.dialogue.isRunning){
            let stext = "Alright, I'll follow you.";
            if(!bright.followMode){stext = "Staying put.";};
            let brightFollowSpeech = [{speaker:bright,ttl:2000,text:stext}];
            bright.dialogue = new Dialogue(this,brightFollowSpeech,54,-40);
            bright.dialogue.start();
        }
    },
    changePlayer: function(){
        //this.cameras.main.stopFollow();
        if(this.changePlayerReady){
            console.log("Player Changed")
            this.changePlayerReady = false;
            this.time.addEvent({ delay: 100, callback: function(){this.changePlayerReady = true;}, callbackScope: this, loop: false });
            if(curr_player == players.SOLANA){
                curr_player=players.BRIGHT;
                if(bright.light_status == 0){bright.reAlignBright();}            
                //this.cameras.main.startFollow(bright.sprite,true,.1,.1,0,0); 
            }else{
                curr_player=players.SOLANA;
                //this.cameras.main.startFollow(solana.sprite,true,.1,.1,0,0);
            }
        }
        

    },
    splitScreen(enable){
        if(enable){
            let cam_p1 = this.cameras.add(0,0,camera_main.width/2,camera_main.height,false,'cam_p1');//Second Camera
            let cam_p2 = this.cameras.add(camera_main.width/2,0,camera_main.width/2,camera_main.height,false,'cam_p2');//Second Camera
            cam_p1.setBounds(0, 0, map.widthInPixels, map.heightInPixels+128);  
            cam_p2.setBounds(0, 0, map.widthInPixels, map.heightInPixels+128);  
            cam_p1.setZoom(2);
            cam_p2.setZoom(2);
            cam_p1.startFollow(solana,true,.8,.8,0,0);
            cam_p2.startFollow(bright,true,.8,.8,0,0);
        }else{
            let cam_p1 = this.cameras.getCamera('cam_p1');
            let cam_p2 = this.cameras.getCamera('cam_p2');
            this.cameras.remove(cam_p1);
            this.cameras.remove(cam_p2);
        }
    },
    cutCanvasCircle: function(x,y,radius,ctx){
        ctx.save();         
        ctx.globalCompositeOperation='destination-out';
        ctx.beginPath();
        ctx.arc(x,y,radius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.restore();

        return ctx;
    },
	updateShadowTexture: function() {
        // This function updates the shadow texture (this.shadowTexture).
        // First, it fills the entire texture with a dark shadow color.
        // Then it draws a white circle centered on the pointer position.
        // Because the texture is drawn to the screen using the MULTIPLY
        // blend mode, the dark areas of the texture make all of the colors
        // underneath it darker, while the white area is unaffected.
    
        // Draw shadow
        this.shadowTexture.context.fillStyle = 'rgb(100, 100, 100)';
        this.shadowTexture.context.fillRect(0, 0, this.game.width, this.game.height);
    
        // Draw circle of light
        this.shadowTexture.context.beginPath();
        this.shadowTexture.context.fillStyle = 'rgb(255, 255, 255)';
        this.shadowTexture.context.arc(this.game.input.activePointer.x, this.game.input.activePointer.y,
            this.LIGHT_RADIUS, 0, Math.PI*2);
        this.shadowTexture.context.fill();
    
        // This just tells the engine it should update the texture cache
        this.shadowTexture.dirty = true;
    },
    doBack: function ()
    {
        
		this.scene.start('mainmenu');
    },
    generateEnergy(){
        hud.alterEnergy(1);
    },
    spawnEnemies(){
        console.log("timer spawner!");
        if(spawnlayer){
            var spawns = spawnlayer.objects;
            if(enemies.countActive() < 10){
                //Spawn a new enemy every 1 seconds at a random spawner
                var value = Phaser.Math.Between(0, spawns.length-1);
                new_enemy = enemies.get();
                if(new_enemy){
                    //Setup Enemy
                    new_enemy.setActive(true);
                    new_enemy.setVisible(true);
                    new_enemy.setPosition(spawns[value].x,spawns[value].y);
                    
                } 
            }
        }   
    },
    saveData(){
        //Save Polaris Data
        if(tutorialRunning){
            let findState = findWithAttr(guideStates,'map',current_map);
            if(findState != -1){
                guideStates[findState].pos.x = polaris.x;
                guideStates[findState].pos.y = polaris.y;
            }else{
                console.log("Error: No Polaris State data to update");
            }
        }
    },
    gameOver(){
        //Remove HUD
        hud.scene.remove();
        //Run game Over
        this.scene.start('gameover');
    },
    getMouseVectorByCamera(playerId){ //Player source is the source from where the mouse vector is generated. 0 - Solana, 1 - Bright
        
        let gameScale = camera_main.zoom;
        let targVector = {x:pointer.worldX,y:pointer.worldY};
        //Adjust for Split Screen
        if(this.cameraLevel == 3 && (playerId == 0 || playerId == 2)){
            let cameraSources = ['cam_p1','cam_p2'];
            let camera = this.cameras.getCamera(cameraSources[playerId]);
            let camVec = pointer.positionToCamera(camera);
            
            targVector = camVec;
        }
        return targVector;
    },
    getGamepadVectorByStick(gamePadID,stick,radius,x,y){
        let targVector = {x:0,y:0};
        let stickRight = gamePad[gamePadID].getStickRight(.1);
        let stickLeft = gamePad[gamePadID].getStickLeft(.1);
        let gpVec = stick == 'left' && stick == 'right' ? stickLeft : stickRight;
        targVector = {x:x+gpVec.x*radius,y:y+gpVec.y*radius};
        
        return targVector;
    }
    
});
//External Functions
function getObjectTilePosition(x,y,ts){
    return {x: Math.floor(x/ts),y: Math.floor(y/ts)};
}
function createLightObstacleRect(x,y,w,h){    
    return  [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}
function moveLightSource(x,y) {
    // when the mouse is moved, we determine the new visibility polygon 
    let shapes = [];
    lightPolygons.forEach(function(e){
        let d = Phaser.Math.Distance.Between(x,y,e[0][0],e[0][1]);
        if(d < 256){
            shapes.push(e);            
        }
    });	
    shapes.push(createLightObstacleRect(x-256,y-256,x+512,y+512));

    var visibility = createLightPolygon(x, y, shapes);
    if(visibility){
        // then we draw it
        lightCanvas.clear();
        lightCanvas.lineStyle(2, 0xff8800, 1);
        lightCanvas.fillStyle(0xffff00,1);
        lightCanvas.beginPath();
        lightCanvas.moveTo(visibility[0][0], visibility[0][1]);
        for (var i = 1; i <= visibility.length; i++) {
            lightCanvas.lineTo(visibility[i % visibility.length][0], visibility[i % visibility.length][1]);
        }
        lightCanvas.closePath();
        lightCanvas.fillPath();
    }
}

// and this is how the library generates the visibility polygon starting
// from an array of polygons and a source point
function createLightPolygon(x, y, polyset) {
    var segments = VisibilityPolygon.convertToSegments(polyset);
    segments = VisibilityPolygon.breakIntersections(segments);
    var position = [x, y];
    if (VisibilityPolygon.inPolygon(position, polyset[polyset.length - 1])) {
        return VisibilityPolygon.compute(position, segments);
    }
    return null;
}
function setupTriggerTargets(triggerGroup,triggerGroupName,scene){
    
    triggerGroup.children.each(function(trigger) {
        //console.log(triggerGroupName,trigger.target);
        if(trigger.target.name){
            if(trigger.target.type == "gate"){
                //Search all gets
                gates.children.each(function(gate) {
                    //console.log("Trigger had gate target, searching names");
                    if(gate.name == trigger.target.name){
                        trigger.setTarget(gate);
                    }
                },trigger);
            }
        }
    }, this);
}
function exitLevel(s, exit) {  
    // only if both enemy and bullet are alive
    if (exit.active === true && s.active === true) {
        exit.exitLevel();
    }
} 
function damageEnemy(enemy, bullet) {  
    // only if both enemy and bullet are alive
    if (enemy.active === true && bullet.active === true) {
        //bullet hits
        bullet.hit();          
        // decrease the enemy hp with BULLET_DAMAGE
        enemy.receiveDamage(bullet.damage);
    }
}   

function bulletHitGround(bullet,ground){
    if (bullet.active === true){
        //ground hit particles
        emitter0.active = true;
        emitter0.explode(5,bullet.x,bullet.y);
        //bullet hits
        bullet.hit();
    }
}
function bulletHitMirror(bullet,m){
    if (bullet.active === true && !bullet.bounced){
        bullet.bounced = true;
        let bCenter = bullet.getCenter();
        let mCenter = m.getCenter();
        //Get angle to mirror from bullet
        //let angleBetween = Phaser.Math.Angle.Between(mCenter.x,mCenter.y,bCenter.x,bCenter.y);//In radians

        let angleBetween = bullet.body.velocity.angle();
        //Normalize it to 2pi range
        angleBetween =  Phaser.Math.Angle.Normalize(angleBetween);

        //Get Reflection angle
        let angleofReflection = Phaser.Math.DegToRad(m.angle+m.reflectAngle);
        
        let angleDiff = (angleBetween - angleofReflection);
        let angResult = 0;
        if(angleDiff > 0){
            angResult = (Math.PI*2) - (angleDiff*2);
        }else{
            angResult = (Math.PI*2) + (angleDiff*-1);
        }
        
        angResult = Phaser.Math.Angle.Wrap(angResult)



        //console.log(Phaser.Math.RadToDeg(angleBetween),Phaser.Math.RadToDeg(angleofReflection),Phaser.Math.RadToDeg(angleDiff),Phaser.Math.RadToDeg(angResult));
        
        bullet.bounceOff(angResult,m.width,mCenter.x,mCenter.y);
        m.hit();
    }
}
function getTileProperties(propArray){    
    let object = {};
    if(propArray == undefined){return;}
    propArray.forEach(element => {
        object[element.name] = element.value;
    });
    return object;
}
function getRootBody(body) {
    if (body.parent === body) {
        return body;
    }
    while (body.parent !== body) {
        body = body.parent;
    }
    return body;
}
function getGameObjectBylabel(bodyA,bodyB,label){
    //Returns the game objects for the bodies in an array. The first matches the label
    let objArray = [];

    if(bodyA.label === label){
        objArray.push(bodyA.gameObject);
        objArray.push(bodyB.gameObject);
    }else{
        objArray.push(bodyB.gameObject);
        objArray.push(bodyA.gameObject);
    }

    return objArray;
}
//Gun Object Template
function Gun(rof,magsize,reloadtime){
    this.rofct = rof;
    this.rof  = rof;
    this.magsize = magsize;
    this.magsizect = magsize;
    this.reload = reloadtime;
    this.reloadct = reloadtime;
    this.reloading = false;
    this.ready = true;
    this.shoot = function(){
        this.magsizect--;
        if(this.magsizect <= 0){
            this.ready = false;
            this.reloading = true;
        }
    }
    this.update = function(){

        if(this.reloading){
            this.reloadct--;
            if(this.reloadct <= 0){
                this.reloading = false;
                this.magsizect = magsize;
                this.reloadct = this.reload;
            }
        }else{
            this.rofct--;
            if(this.rofct <= 0){
                this.ready = true;
                this.rofct = this.rof;
            }else{
                this.ready = false;
            }
        }
    }
}

function createAnimations(scene){
    scene.anims.create({
        key: 'slime1-idle',
        frames: scene.anims.generateFrameNumbers('slime1', { frames:[0] }),
        frameRate: 3,
        repeat: -1
    });
    scene.anims.create({
        key: 'slime1-move',
        frames: scene.anims.generateFrameNumbers('slime1', { frames:[0,1,2,3] }),
        frameRate: 10,
        repeat: -1
    });
    scene.anims.create({
        key: 'slime1-shoot',
        frames: scene.anims.generateFrameNumbers('slime1', { frames:[1]}),
        frameRate: 8,
        repeat: -1
    });
    scene.anims.create({
        key: 'slime1-death',
        frames: scene.anims.generateFrameNumbers('slime1', { start: 0, end: 0 }),
        frameRate: 6,
        repeat: 0
    });
    scene.anims.create({
        key: 'solana-death',
        frames: scene.anims.generateFrameNumbers('solana', { frames:[8,9,10,11,12,13,14,15,16] }),
        frameRate: 4,
        repeat: 0
    });
    scene.anims.create({
        key: 'solana-idle',
        frames: scene.anims.generateFrameNumbers('solana', { frames:[0,0,0,0,0,0,0,1,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}),
        frameRate: 11,
        repeat: -1
    });
    scene.anims.create({
        key: 'solana-walk',
        frames: scene.anims.generateFrameNumbers('solana', { frames:[20,21,5,6,17,18,5,6,17,18,5,6,17,18] }),
        frameRate: 6,
        repeat: -1
    });
    scene.anims.create({
       key: 'solana-walk2',
       frames: scene.anims.generateFrameNumbers('solana', { frames:[5,6,17,18] }),
       frameRate: 6,
       repeat: -1
    })
    scene.anims.create({
       key: 'solana-wallslide',
       frames: scene.anims.generateFrameNumbers('solana', { frames:[19,19] }),
       frameRate: 6,
       repeat: -1
    })
    scene.anims.create({
        key: 'solana-jump',
        frames: scene.anims.generateFrameNumbers('solana', { start: 7, end: 7 }),
        frameRate: 6,
        repeat: -1
    });
    scene.anims.create({
        key: 'solana-webbed',
        frames: scene.anims.generateFrameNumbers('solana', { start: 22, end: 22 }),
        frameRate: 6,
        repeat: -1
    });
    scene.anims.create({
        key: 'bright-idle',
        frames: scene.anims.generateFrameNumbers('bright', { start: 0, end: 1 }),
        frameRate: 2,
        repeat: -1
    });
    scene.anims.create({
        key: 'bright-sway',
        frames: scene.anims.generateFrameNumbers('bright', { frames:[0,2,3,4,5,6,7,8,9,10,11,0,2,3,18,17,16,15,14,13,12,11] }),
        frameRate: 24,
        repeat: -1
    });
    scene.anims.create({
        key: 'bright-move',
        frames: scene.anims.generateFrameNumbers('bright', { frames:[3,4,5,6,7,8,9,11,12,13,14,15,16,17,18] }),
        frameRate: 12,
        repeat: -1
    });        
    scene.anims.create({
        key: 'dark-idle',
        frames: scene.anims.generateFrameNumbers('dark', { frames:[0,1,2,1,0] }),
        frameRate: 6,
        repeat: -1
    });
    
    scene.anims.create({
        key: 'dark-falling',
        frames: scene.anims.generateFrameNumbers('dark', { start: 3, end: 3 }),
        frameRate: 6,
        repeat: -1
    });
    scene.anims.create({
        key: 'soulight-move',
        frames: scene.anims.generateFrameNumbers('soul_light', { frames:[0,1,2] }),
        frameRate: 12,
        repeat: -1
    });
    
    scene.anims.create({
        key: 'mirror-hit',
        frames: scene.anims.generateFrameNumbers('mirror', { frames:[1,2,3,4] }),
        frameRate: 24,
        repeat: 0
    });
    
    scene.anims.create({
        key: 'mirror-idle',
        frames: scene.anims.generateFrameNumbers('mirror', { frames:[0,0] }),
        frameRate: 1,
        repeat: -1
    });
    
    scene.anims.create({
        key: 'lever-idle',
        frames: scene.anims.generateFrameNumbers('lever', { frames:[0,0] }),
        frameRate: 1,
        repeat: -1
    });

    scene.anims.create({
        key: 'lever-operate-0',
        frames: scene.anims.generateFrameNumbers('lever', { frames:[0,1,2,3,4] }),
        frameRate: 12,
        repeat: 0
    });        
    
    scene.anims.create({
        key: 'lever-operate-1',
        frames: scene.anims.generateFrameNumbers('lever', { frames:[4,3,2,1,0] }),
        frameRate: 12,
        repeat: 0
    });

    scene.anims.create({
        key: 'button-activate',
        frames: scene.anims.generateFrameNumbers('tmxbutton', { frames:[4,3,2,1,0] }),
        frameRate: 12,
        repeat: 0
    });

    scene.anims.create({
        key: 'ability-solar-blast-shoot',
        frames: scene.anims.generateFrameNumbers('ability_solarblast', { frames:[0,1,2,3,4] }),
        frameRate: 24,
        repeat: -1
    });
    
    scene.anims.create({
        key: 'lamp-flicker',
        frames: scene.anims.generateFrameNumbers('light_crystal', { frames:[0,1] }),
        frameRate: 24,
        repeat: -1
    });

    scene.anims.create({
        key: 'lamp-turn-on',
        frames: scene.anims.generateFrameNumbers('light_crystal', { frames:[4,3,2,1,0] }),
        frameRate: 24,
        repeat: 0
    });

    scene.anims.create({
        key: 'lamp-turn-off',
        frames: scene.anims.generateFrameNumbers('light_crystal', { frames:[0,1,2,3,4] }),
        frameRate: 24,
        repeat: 0
    });
    
    scene.anims.create({
        key: 'firefly-move',
        frames: scene.anims.generateFrameNumbers('fireflies', { frames:[3,4] }),
        frameRate: 16,
        repeat: -1
    });
    
    scene.anims.create({
        key: 'firefly-flash',
        frames: scene.anims.generateFrameNumbers('fireflies', { frames:[0,1,2] }),
        frameRate: 16,
        repeat: 0
    });   
    
    scene.anims.create({
        key: 'bat-move',
        frames: scene.anims.generateFrameNumbers('bat', { frames:[12,13,14,15] }),
        frameRate: 16,
        repeat: -1
    });
    scene.anims.create({
        key: 'bat-idle',
        frames: scene.anims.generateFrameNumbers('bat', { frames:[12,13,14,15] }),
        frameRate: 16,
        repeat: -1
    });
    scene.anims.create({
        key: 'bat-shoot',
        frames: scene.anims.generateFrameNumbers('bat', { frames:[12,13,14,15] }),
        frameRate: 16,
        repeat: 0
    });
    scene.anims.create({
        key: 'bat-death',
        frames: scene.anims.generateFrameNumbers('bat', { frames:[12,13,14,15] }),
        frameRate: 16,
        repeat: 0
    });
    scene.anims.create({
        key: 'boss-spider',
        frames: scene.anims.generateFrameNumbers('spider', { frames:[0,1,2,3,4] }),
        frameRate: 12,
        repeat: 0
    });
    scene.anims.create({
        key: 'boss-hive',
        frames: scene.anims.generateFrameNumbers('boss_spiderhive', { frames:[0,1] }),
        frameRate: 3,
        repeat: 0
    });
    scene.anims.create({
        key: 'boss-hive-egg-idle',
        frames: scene.anims.generateFrameNumbers('boss_spideregg', { frames:[0] }),
        frameRate: 3,
        repeat: 0
    });
    scene.anims.create({
        key: 'boss-hive-egg-grow',
        frames: scene.anims.generateFrameNumbers('boss_spideregg', { frames:[3,2,1,0] }),
        frameRate: 3,
        repeat: 0
    });
    scene.anims.create({
        key: 'boss-hive-egg-crack',
        frames: scene.anims.generateFrameNumbers('boss_spideregg', { frames:[4,5,6,7,8] }),
        frameRate: 3,
        repeat: 0
    });
    scene.anims.create({
        key: 'boss-hive-egg-pulse',
        frames: scene.anims.generateFrameNumbers('boss_spideregg', { frames:[8,9,10,9] }),
        frameRate: 3,
        repeat: 0
    });
    scene.anims.create({
        key: 'light_burst_action',
        frames: scene.anims.generateFrameNumbers('light_burst_2', { frames:[0,1,2,3,4,5] }),
        frameRate: 12,
        repeat: 0
    });
    scene.anims.create({
        key: 'light_burst_idle',
        frames: scene.anims.generateFrameNumbers('light_burst_2', { frames:[0] }),
        frameRate: 1,
        repeat: 0
    });    
    scene.anims.create({
        key: 'double_jump_burst',
        frames: scene.anims.generateFrameNumbers('doublejump-1', { frames:[0,1,2,3] }),
        frameRate: 12,
        repeat: 0
    });  
    scene.anims.create({
        key: 'wind-1',
        frames: scene.anims.generateFrameNumbers('wind-1', { frames:[0,1,2,3,4,5,6] }),
        frameRate: 12,
        repeat: -1
    }); 
}