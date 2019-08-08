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
        //this.load.scenePlugin('Slopes', 'src/phaser-slopes.min.js');
    },

    create: function ()
    {
        //Setup Global
        playScene = this;
        game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
        //Refresh/Setup HUD
        hud = this.scene.get('UIScene');;
        hud.handleEvents();
        
        //Create Background
        world_background = this.add.tileSprite(512, 256, 4096, 512, 'forest_background');

       
   
        // //Map the map
        // map = this.make.tilemap({key: 'map1'});
        // // tiles for the ground layer
        // var Tiles = map.addTilesetImage('map1_tiles','tiles');//called it map1_tiles in tiled
        // // create the ground layer
        // groundLayer = map.createDynamicLayer('ground', Tiles, 0, 0);

        //Map the map
        map = this.make.tilemap({key: current_map});
        
        // tiles for the ground layer
        var Tiles = map.addTilesetImage('32Tileset','tiles32');//called it map1_tiles in tiled
        var CollisionTiles = map.addTilesetImage('collision','collisions32');//called it map1_tiles in tiled
        // create the ground layer
        let bglayer = map.createStaticLayer('bg', Tiles, 0, 0);
        let fglayer = map.createDynamicLayer('fg', Tiles, 0, 0);

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
                    tile.physics.matterBody.body.label = 'SOLID';
                    tile.physics.matterBody.setCollisionCategory(CATEGORY.GROUND);
                    tile.physics.matterBody.setFriction(.9,0);
                }
               
            //}
        });

        //CREATE PLAYER ENTITIES
        // create the solana sprite    
        solana = new Solana(this,128,128);  
        bright = new Bright(this,128,96);
        soullight =new SoulLight({scene: this, x:128,y:96,sprite:'bright',frame:0},bright);
        //Emit Events
        //this.events.emit('solanaSetup'); 

        //Animations - Move to JSON       
        createAnimations(this);

        //Create Camera        
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels+128);  
        this.cameras.main.setBackgroundColor('#ccccff'); 
        this.cameras.main.setZoom(2);
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
        //Entrances
        fireflies = this.add.group({ 
            classType: Firefly,
            runChildUpdate: true 
        });


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
        //Spawn Enemies from Enemy TMX Object layer
        for(e=0;e<enemylayer.objects.length;e++){
            
            new_enemy = enemies.get();
            if(new_enemy){
                //Setup Enemy
                new_enemy.setActive(true);
                new_enemy.setVisible(true);
                new_enemy.setPosition(enemylayer.objects[e].x,enemylayer.objects[e].y);
                
                
            } 
        }
        //Spawn Mirrors
        for(e=0;e<objectlayer.objects.length;e++){
            let mapObject;
            let x_offset = 0;
            let y_offset = 0;
            if(objectlayer.objects[e].type == "mirror"){  
                mapObject = mirrors.get();
                x_offset = mapObject.width/2;
                y_offset = mapObject.height/2;
            }else if(objectlayer.objects[e].type == "window"){  
                mapObject = barriers.get(-1000,-1000,"tmxwindow",0,true);
                x_offset = -mapObject.width/2;
                y_offset = mapObject.height/2;
            }else if(objectlayer.objects[e].type == "hive"){
                let hiveProps = getTileProperties(objectlayer.objects[e].properties);
                for(let b=0;b<hiveProps.bugsMax;b++){
                    let rX = Phaser.Math.Between(-32,32);
                    let rY = Phaser.Math.Between(-32,32);
                    fireflies.get(objectlayer.objects[e].x+rX,objectlayer.objects[e].y+rY);
                }
            }else if(objectlayer.objects[e].type == "platfall"){ 
                x_offset = objectlayer.objects[e].width/2;
                y_offset = objectlayer.objects[e].height/2;
                let newFallPlat = new Fallplat(this,objectlayer.objects[e].x+x_offset,objectlayer.objects[e].y-y_offset,'tiles32',objectlayer.objects[e].gid-1);
            }

            if(mapObject){ 
                mapObject.setup(objectlayer.objects[e].x-x_offset,objectlayer.objects[e].y-y_offset,objectlayer.objects[e].rotation);
            }
        }
        //Spawn Triggers
        for(e=0;e<triggerlayer.objects.length;e++){
            //Check for Type first, to determine the GET method used.
            let triggerObj;
            
            if(triggerlayer.objects[e].type == "lever"){  
                triggerObj = new TMXLever(this,triggerlayer.objects[e].x,triggerlayer.objects[e].y);             
                levers.add(triggerObj);
            }else if(triggerlayer.objects[e].type == "gate"){
                triggerObj = gates.get();
            }else if(triggerlayer.objects[e].type == "plate"){
                triggerObj = plates.get();
            }else if(triggerlayer.objects[e].type == "platform"){
                triggerObj = platforms.get();
            }else if(triggerlayer.objects[e].type == "button"){
                triggerObj = buttons.get();
            }else if(triggerlayer.objects[e].type == "crystallamp"){
                triggerObj = crystallamps.get();
            }else if(triggerlayer.objects[e].type == "zone"){
                triggerObj = triggerzones.get();
                triggerObj.setDisplaySize(triggerlayer.objects[e].width, triggerlayer.objects[e].height);
            }
            if(triggerObj){
                let trig_x_offset = triggerlayer.objects[e].width/2;
                let trig_y_offset = triggerlayer.objects[e].height/2;
                triggerObj.setup(triggerlayer.objects[e].x+trig_x_offset,triggerlayer.objects[e].y+trig_y_offset,getTileProperties(triggerlayer.objects[e].properties),triggerlayer.objects[e].name);
            }
        }
          
        //Spawn Exits
        for(e=0;e<exitlayer.objects.length;e++){  
            let exitObj;
            //console.log(exitlayer.objects[e])
            if(exitlayer.objects[e].type == "entrance"){
                exitObj = entrances.get();
                exitObj.setup(exitlayer.objects[e].x+16,exitlayer.objects[e].y+16,exitlayer.objects[e].name);
                
                //Re-position player to match entrance to exit they left.
                if(exitObj.name == current_exit){
                    
                    solana.sprite.setPosition(exitObj.x,exitObj.y);
                    bright.sprite.setPosition(exitObj.x,exitObj.y-32);
                    soullight.sprite.setPosition(exitObj.x,exitObj.y-32);
                    
                    this.cameras.main.centerOn(exitObj.x,exitObj.y);
                    // make the camera follow the solana
                    //this.cameras.main.startFollow(solana.sprite,true,.1,.1,0,0);
                }
            }else{
                exitObj = exits.get();
                exitObj.setup(exitlayer.objects[e].x+16,exitlayer.objects[e].y+16,getTileProperties(exitlayer.objects[e].properties),exitlayer.objects[e].name);
                exitObj.setDisplaySize(exitlayer.objects[e].width,exitlayer.objects[e].height);
            } 
        }

        //SETUP LEVER TARGETS
        setupTriggerTargets(levers,"levers",this);
        setupTriggerTargets(plates,"plates",this);
        setupTriggerTargets(buttons,"buttons",this);
        setupTriggerTargets(triggerzones,"zones",this);
        setupTriggerTargets(platforms,"platforms",this);

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
         //this.energyTimer = this.time.addEvent({ delay: 200, callback: this.generateEnergy, callbackScope: this, loop: true });

      
        
         //Lightning construct using preloaded cavnas called canvasShadow (See Preloader)
        var shadTexture = this.add.image(map.widthInPixels/2, map.heightInPixels/2, 'canvasShadow');
        shadTexture.alpha = .9;

        var light1 = this.add.image(256,64,'light1');
        light1.alpha = .5;
        light1.tint = 0xCCCC00;

        solana.z = light1.z+1;
        bright.z = light1.z+1;



        let newitem = new EquipItem(this,320,192,'gameitems',0);

         //Start soulight play
         soullight.sprite.anims.play('soulight-move', true);//Idle

        hud.setupHud(solana);

        solana.setDepth(DEPTH_LAYERS.FRONT);
        bright.setDepth(DEPTH_LAYERS.FRONT);

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
            objectA: [bright.sensors.bottom,bright.sensors.left,bright.sensors.right,bright.sensors.top],
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
                || gameObjectB instanceof TMXGate)) {   
                
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
            objectA:[solana.sensors.bottom,solana.sensors.left,solana.sensors.right],
            callback: eventData => {
              const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
              //console.log(bodyA.label,bodyB.label)
              if (gameObjectB !== undefined && gameObjectB instanceof Phaser.Tilemaps.Tile) {
                // Now you know that gameObjectB is a Tile, so you can check the index, properties, etc.
                if (gameObjectB.properties.collides){
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
                || gameObjectB instanceof BrightBeamBlock)) {  

                    //handle plaform jumping allowance             
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
            //Dont count rocks and crates as walls.
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
            objectA: solana.sprite,
            callback: eventData => {
              const { bodyB, gameObjectB } = eventData;
               
              if (gameObjectB !== undefined && gameObjectB instanceof TMXLever) {
                //Solana Touching a lever?
                if(curr_player==players.SOLANA){
                    //Only control if currently the active control object
                    if((game.wasd.up.isDown || gamePad.checkButtonState('up') > 0)) {
                        gameObjectB.useLever();
                    }else if((game.wasd.down.isDown || gamePad.checkButtonState('down') > 0)) {
                        gameObjectB.useLever();
                    }
                }
              }
              if (gameObjectB !== undefined && gameObjectB instanceof TMXButton) {
                //Solana Touching a lever?
                if(curr_player==players.SOLANA){
                    //Only control if currently the active control object
                    if((game.wasd.up.isDown || gamePad.checkButtonState('up') > 0)) {
                        gameObjectB.useButton();
                    }else if((game.wasd.down.isDown || gamePad.checkButtonState('down') > 0)) {
                        gameObjectB.useButton();
                    }
                }
              }
              if (gameObjectB !== undefined && gameObjectB instanceof TMXPlate) {
                //Solana Touching a lever?
                if(curr_player==players.SOLANA){

                    gameObjectB.usePlate();

                }
              }
              if (gameObjectB !== undefined && gameObjectB instanceof MirrorSensor) {
                if(curr_player==players.SOLANA){
                    //Only control if currently the active control object
                    if((game.wasd.up.isDown || gamePad.checkButtonState('up') > 0)) {
                        gameObjectB.parent.rotateMirror(2);
                    }else if((game.wasd.down.isDown || gamePad.checkButtonState('down') > 0)) {
                        gameObjectB.parent.rotateMirror(-2);
                    }
                }
              }
              if (gameObjectB !== undefined && gameObjectB instanceof Exit) {
                //Solana Touching a lever?
                if(curr_player==players.SOLANA){

                    gameObjectB.exitLevel();

                }
              }
              if (gameObjectB !== undefined && gameObjectB instanceof TMXZone) {
                //Solana Touching a lever?
                if(curr_player==players.SOLANA){

                    gameObjectB.enterZone(solana);

                }
              }
              if (gameObjectB !== undefined && gameObjectB instanceof EquipItem) {
                //Solana Touching a lever?
                if(curr_player==players.SOLANA){

                    gameObjectB.equipTo(solana);

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
                //Between Fallplat and Ground at velocity
                if ((bodyA.label === 'FALLPLAT' && bodyB.label === 'SOLID') || (bodyA.label === 'SOLID' && bodyB.label === 'FALLPLAT')) {
                    //Get Bullet Object and run hit function
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'FALLPLAT');
                    if (gObjs[0].ready == false && gObjs[0].y < gObjs[1].tile.pixelY){
                        emitter0.active = true;
                        emitter0.explode(5,gObjs[0].x,gObjs[0].y);
                        gObjs[0].destroy();
                    }  
                }
                //Between Bullets and Ground
                if ((bodyA.label === 'BULLET' && bodyB.label === 'SOLID') || (bodyA.label === 'SOLID' && bodyB.label === 'BULLET')) {
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
                        gObjs[1].receiveDamage(1);
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
                //Between SoulTransfer and Bright
                if ((bodyA.label === 'SOULTRANSFER' && bodyB.label === 'BRIGHT') || (bodyA.label === 'BRIGHT' && bodyB.label === 'SOULTRANSFER')) {
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'SOULTRANSFER');
                    if (gObjs[0].active){
                        gObjs[0].hit(1);
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
                    continue;
                }
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

        gamePad = new GamepadControl(0);
       
        this.input.gamepad.once('down', function (pad, button, index) {
            console.log('Playing with ' + pad.id);    
            gamePad = new GamepadControl(pad);    
        }, this);

        keyPad = new KeyboardMouseControl(this,pointer)

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

        for(let r=0;r<5;r++){
            let rX = Phaser.Math.Between(-64,64);
            let rock = new Rock(this,200+rX,100);
        }
        
        for(let r=0;r<1;r++){
            let rX = Phaser.Math.Between(-64,64);
            let crate = new Crate(this,400+rX,100);
        }
  
    },

    update: function (time, delta)
    {
        //Controller Update
        gamePad.updateButtonState();
        keyPad.updateKeyState();
 
        //center camera on the spot between the players. Zoom out to a max.
        let disPlayers = Phaser.Math.Distance.Between(solana.x,solana.y,bright.x,bright.y);

        let midPoint = {x:(solana.x+bright.x)/2,y:(solana.y+bright.y)/2}
        this.cameras.main.centerOn(midPoint.x,midPoint.y);
        if(disPlayers > 500 && this.cameras.main.zoom != 1.75){
            this.cameras.main.zoomTo(1.75,1000,'Linear');
        }
        if(disPlayers < 500 && this.cameras.main.zoom != 2){
            this.cameras.main.zoomTo(2,1000,'Linear');
        }
        //Teleport Bright
        if(disPlayers > 1000){bright.setPosition(solana.x,solana.y - 48)}

        //DEBUG
        if(GLOBAL_DEBUG){
            //Draw Pointer - DEBUG
            this.debugPointer.x = pointer.worldX-8;
            this.debugPointer.y = pointer.worldY-8;
            this.debugAimLine.clear();
            this.debugAimLine.lineStyle(5, 0xFF00FF, 1.0);
            this.debugAimLine.beginPath();
            this.debugAimLine.moveTo(solana.x, solana.y);
            this.debugAimLine.lineTo(pointer.worldX, pointer.worldY);
            this.debugAimLine.closePath();
            this.debugAimLine.strokePath();
        }

        //Updates
        solana.update(time,delta);
        bright.update(time,delta);
        soullight.update(time,delta);

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

        if(Phaser.Math.Distance.Between(soullight.sprite.x,soullight.y,solana.sprite.x,solana.sprite.y) <= soullight.protection_radius.value){solana_in_light = true;}

        //is the solana outside the light? Do damage!
        solana.inLight = solana_in_light;

        shadow_layer.refresh();


        //Suicide to test animation
        if(Phaser.Input.Keyboard.JustDown(game.wasd.suicide)){
            solana.receiveDamage(1);
        }
        
        //GLOBAL DEBUG TURN ON/OFF
        if(keyPad.checkKeyState('DEBUG') == 1){
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
        if(keyPad.checkMouseState('mb2') == 1){
            console.log("MB2 Clicked");
            //Phaser.Physics.Matter.Matter.Query.point(this.matter.world.localWorld.bodies, pointer); 
            //this.matter.world.engine.world.bodies
            console.log(Phaser.Physics.Matter.Matter.Query.point(this.matter.world.localWorld.bodies, {x:pointer.worldX, y:pointer.worldY}));
        }

        //Throw Soulight
        if(Phaser.Input.Keyboard.JustDown(game.wasd.passLight) || gamePad.checkButtonState('passLight') == 1){ 
            soullight.aimStart(); 
        }  

        if(Phaser.Input.Keyboard.JustUp(game.wasd.passLight) || gamePad.checkButtonState('passLight') == -1){
            console.log("Released Y");
            //Release gamepad throw light
            soullight.aimStop();
        }

        //Test Bright pulse
        if(Phaser.Input.Keyboard.JustDown(game.wasd.pulse)){
            bright.pulseCharge();
        }
        if(Phaser.Input.Keyboard.JustUp(game.wasd.pulse)){
            bright.pulseThrow(solana);
        }
        //Quick Change Map and Restart Scene
        if(Phaser.Input.Keyboard.JustDown(game.wasd.restart_scene)){  
            if(current_map == "map2"){current_map = "map3"}else{current_map = "map2"}; 
            hud.clearHud();       
            this.scene.restart();
        }     


        if(Phaser.Input.Keyboard.JustDown(game.wasd.switch) || gamePad.checkButtonState('switch') == 1){
            this.changePlayer();
        } 
        
        //Scroll parallax based on movement of bright or solana
        if(solana.mv_Xdiff != 0){
            //Parallax Background
            let paraMove = solana.mv_Xdiff < 0 ? -.50 : .50;
            world_background.tilePositionX += paraMove;
        }   
      
    },
    changePlayer: function(){
        this.cameras.main.stopFollow();
       
        if(curr_player == players.SOLANA){
            curr_player=players.BRIGHT;
            if(bright.light_status == 0){bright.reAlignBright();}            
            //this.cameras.main.startFollow(bright.sprite,true,.1,.1,0,0); 
        }else{
            curr_player=players.SOLANA;
            //this.cameras.main.startFollow(solana.sprite,true,.1,.1,0,0);
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
    }
});
//External Functions
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
function createAnimations(scene){
    scene.anims.create({
        key: 'enemy-idle',
        frames: scene.anims.generateFrameNumbers('enemy1', { frames:[0] }),
        frameRate: 3,
        repeat: -1
    });
    scene.anims.create({
        key: 'enemy-walk',
        frames: scene.anims.generateFrameNumbers('enemy1', { frames:[0,1,2,3] }),
        frameRate: 10,
        repeat: -1
    });
    scene.anims.create({
        key: 'enemy-shoot',
        frames: scene.anims.generateFrameNumbers('enemy1', { frames:[1]}),
        frameRate: 8,
        repeat: -1
    });
    scene.anims.create({
        key: 'enemy-death',
        frames: scene.anims.generateFrameNumbers('enemy1', { start: 0, end: 0 }),
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
    //scene.anims.create({
    //    key: 'solana-walk2',
    //    frames: scene.anims.generateFrameNumbers('solana', { frames:[5,6,17,18] }),
    //    frameRate: 6,
    //    repeat: -1
    //})
    scene.anims.create({
        key: 'solana-wallslide',
        frames: scene.anims.generateFrameNumbers('solana', { start: 19, end: 19 }),
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
        key: 'bright-idle',
        frames: scene.anims.generateFrameNumbers('bright', { start: 0, end: 1 }),
        frameRate: 6,
        repeat: -1
    });
    scene.anims.create({
        key: 'bright-sway',
        frames: scene.anims.generateFrameNumbers('bright', { frames:[0,2,3,4,5,6,7,8,9,10,11,0,2,3,18,17,16,15,14,13,12,11] }),
        frameRate: 12,
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
}