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
        //Register important events
        //Pause / UnPause
        this.events.on('pause', playPause);
        this.events.on('resume', playResume);
        
        //Play Theme Music
        this.soundTheme = game.sound.add('forestTheme1');
        // this.soundTheme.addMarker({name:'themepart1',start:0,duration:6.0});  
        // this.soundTheme.play('themepart1',{loop: true, volume: 0.20});
        this.soundTheme.play({loop: true, volume: 0.20});   


        //Make the map
        map = this.make.tilemap({key: current_map});   
        //Update Global Tilesizes
        mapTileSize.tw = map.tileWidth;   
        mapTileSize.th = map.tileHeight;
        //Get the lvl config from config.js object
        let lvlCfg = getLevelConfigByName(current_map);
        console.log(current_map,lvlCfg)
        //console.log(map);
        //Create Background - This will need to be custom based on the map.
        lvlCfg.backgrounds.forEach(e=>{
            world_backgrounds.push(this.add.tileSprite(512, 256, map.widthInPixels*2, map.heightInPixels*2, e));
        });
        
        var tilesetImages = [];
        lvlCfg.tsPairs.forEach(e=>{
            tilesetImages.push(map.addTilesetImage(e.tsName,e.tsKey));
        });

    
        //Load the collision tiles
        var CollisionTiles = map.addTilesetImage('collision','collisions32');//called it collision in tiled
        // create the Graphic layers      
        this.bglayer3 = map.createStaticLayer('bg3', tilesetImages, 0, 0);
        this.bglayer2 = map.createStaticLayer('bg2', tilesetImages, 0, 0);
        this.bglayer = map.createStaticLayer('bg', tilesetImages, 0, 0);
        this.fglayer = map.createStaticLayer('fg', tilesetImages, 0, 0); 
        //Create the special layers
        let fghiddenlayer= map.createDynamicLayer('fg_hidden', tilesetImages, 0, 0); 
        let fgbreakablelayer= map.createDynamicLayer('fg_breakable', tilesetImages, 0, 0); 
       
        //CREATE SECRET AREAS WITH HIDDEN FOREGROUND
        //fghiddenlayer.setDepth(DEPTH_LAYERS.FG);
        secretTiles = this.add.group({classType:SecretTile, runChildUpdate:true});
        fghiddenlayer.forEachTile(function (tile) {
            if(tile.index != -1){
                //console.log(tile);
                let newImgIndex = tile.index - tile.tileset.firstgid;
                let secretTile = new SecretTile(this,tile.pixelX+tile.width/2,tile.pixelY+tile.height/2,tile.tileset.image.key,newImgIndex).setOrigin(0.5).setDepth(DEPTH_LAYERS.FG);
                secretTiles.add(secretTile);
            }
        },this);
        fghiddenlayer.destroy();
        //Make Breakable Tile Objects just like secret tiles
        if(fgbreakablelayer){
            fgbreakablelayer.forEachTile(function (tile) {
                if(tile.index != -1){
                    //console.log(tile);
                    let newImgIndex = tile.index - tile.tileset.firstgid;
                    let breakTile = new BreakableTile(this,tile.pixelX+tile.width/2,tile.pixelY+tile.height/2,tile.tileset.image.key,newImgIndex).setOrigin(0.5).setDepth(DEPTH_LAYERS.FG);
                }
            },this);
            fgbreakablelayer.destroy();
        }else{
            console.log("DEBUG:", "No Breakable Tiles Layer found.")
        }


        this.collisionLayer = map.createDynamicLayer('collision', CollisionTiles, 0, 0);
        this.collisionLayer.setVisible(false);
        this.collisionLayer.setCollisionByProperty({ collides: true });
        // the solana will collide with this layer
        //groundLayer.setCollisionByExclusion([-1]);
        //groundLayer.setCollisionBetween(0, 256);
        // set the boundaries of our game world
        this.matter.world.convertTilemapLayer(this.collisionLayer);
        this.matter.world.setBounds(0,0,map.widthInPixels, map.heightInPixels);
        
        //Clear Light Polygons
        lightPolygons = [];
        //Generate shadow canvas
        this.shadow_background =  this.add.rectangle(0,0,map.widthInPixels*2, map.heightInPixels*2,0x000000,0.9);
        this.shadow_graphic = this.make.graphics();    
        this.shadow_graphic.setPosition(0,0);        
        this.shadow_mask = this.shadow_graphic.createGeometryMask();
        this.shadow_mask.setInvertAlpha();
        this.shadow_background.setMask(this.shadow_mask);

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
                    lightPolygons.push(createLightObstacleRect(tile.x*mapTileSize.tw,tile.y*mapTileSize.th,mapTileSize.tw,mapTileSize.th));
                }
               
            //}
        });
        
        //Raycasting - setup. For troubleshooting ONLY - REmove once no longer needed.
        // lightCanvas = this.add.graphics(0, 0);
        // lightCanvas.setVisible(false);
        // lightCanvas.setAlpha(0.5);

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
        
        let hullsLayer = map.getObjectLayer('hulls');
        hulls = [];
        hullsLayer.objects.forEach(e=>{
            //console.log(e);
            let newBody = null;
            let shapeObject = null;
            if(e.rectangle){
                shapeObject = this.add.rectangle(e.x + (e.width / 2), e.y + (e.height / 2),e.width, e.height);
                newBody = this.matter.add.gameObject(shapeObject, { shape: { type: 'rectangle', flagInternal: true } });
                //console.log("Light Shape: RECT :",createLightObstacleRect(e.x,e.y,e.width,e.height));
                lightPolygons.push(createLightObstacleRect(e.x,e.y,e.width,e.height));
            }else if(e.ellipse && (e.width == e.height)){
                shapeObject = this.add.circle(e.x + (e.width / 2), e.y + (e.height / 2),e.width/2); 
                newBody = this.matter.add.gameObject(shapeObject, { shape: { type: 'circle', flagInternal: true } });
            }else{
                let center = Phaser.Physics.Matter.Matter.Vertices.centre(e.polygon);
                shapeObject = this.add.polygon(e.x+center.x, e.y+center.y, e.polygon, 0x0000ff, 0.2);
                
                // newHull=this.matter.add.fromVertices(e.x+center.x,e.y+center.y,e.polygon,{isStatic: true}, true);
                //var center = Vertices.centre(vertices);// Line in Phaser.js 169217
                //newHull = new HullPolygon(this,e.x,e.y,e.polygon,0x0000ff,0.2);

                newBody = this.matter.add.gameObject(shapeObject, { shape: { type: 'fromVerts', verts: e.polygon, flagInternal: true } });  
                //console.log("Light Shape: POLYGON :",createLightObstaclePolygon(e.x,e.y,shapeObject.geom.points));  
                lightPolygons.push(createLightObstaclePolygon(e.x,e.y,shapeObject.geom.points));            
            }
            shapeObject.setVisible(false);
            shapeObject.setStatic(true);
            shapeObject.setCollisionCategory(CATEGORY.GROUND) 
            shapeObject.body.label = 'GROUND'; 
            //console.log("Poly Object",shapeObject);
            //Need to add light blocking polygon check here.
            hulls.push(shapeObject);
            losBlockers.push(shapeObject.body);
        });

        //Perimeter Block for Blocking Light
        lightPolygons.push([[-1, -1], [(map.widthInPixels + 1), -1], [(map.widthInPixels + 1), (map.heightInPixels + 1)], [-1, (map.heightInPixels + 1)]]);


        //CREATE PLAYER ENTITIES
        // create the solana sprite    
        solana = new Solana(this,192,160);  
        bright = new Bright(this,192,128);
        soullight =new SoulLight({scene: this, x:192,y:128,sprite:'bright',frame:0},solana);

        //
        this.changePlayerReady = true;
        //Emit Events
        //this.events.emit('solanaSetup');
        
        //Once Game is ready, start updating HUD
        hud.setReady();

        //Animations - Move to JSON later, if it makes sense       
        createAnimations(this);

        bright.toDark(); //Bright Starts the game off as dark

        //Create Camera        
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels+128);  
        this.cameras.main.setBackgroundColor('#000000'); 
        this.cameras.main.roundPixels = true;
        this.cameras.main.setZoom(2);
        camera_main = this.cameras.main;
        this.camMovement = {x:camera_main.worldView.x,y:camera_main.worldView.y};

        //camera_main.setRenderToTexture(glowPipeline);
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
        //Solbombs
        solbombs = this.add.group({ 
            classType: SolBomb,
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
                    //polaris = new Polaris(this,tmxObjRef.x,tmxObjRef.y);

                    //Check for state saves
                    let findState = findWithAttr(guideStates,'map',current_map);
                    if(findState == -1){
                        //guideStates.push(new stateData('polaris',current_map,polaris.x,polaris.y))
                    }else{
                        //polaris.setPosition(guideStates[findState].pos.x,guideStates[findState].pos.y);
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
                // boss = new SpiderHive(this,tmxObjRef.x,tmxObjRef.y);
                // boss.setPosition(tmxObjRef.x+tmxObjRef.width/2,tmxObjRef.y+tmxObjRef.height/2+18);
                // //Setup boss HUD info
                // hud.setBossVisible(true);
                // hud.initBossHealth();
                if(props.bossid == 0){
                    boss = new BossSlime(this,tmxObjRef.x+tmxObjRef.width/2,tmxObjRef.y+tmxObjRef.height/2);
                }

            //SPIDER
            }else if(tmxObjRef.type == "spider"){
                spider = spiders.get(tmxObjRef.x,tmxObjRef.y);
                spider.setPosition(tmxObjRef.x,tmxObjRef.y);
            }else{
                //Standard Types            
                if(EnemyClass == 'ground'){
                    new_enemy = enemies.get(tmxObjRef.x,tmxObjRef.y,EnemyType);
                }else if(EnemyClass == 'air'){
                    new_enemy = enemiesFly.get(tmxObjRef.x,tmxObjRef.y,EnemyType);                
                }else{
                    new_enemy = enemies.get(tmxObjRef.x,tmxObjRef.y,EnemyType);
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
            //NOTE: TMX has a really weird setup for object origins: Rectangles are top-left. But other objects, like image objects (windows) are bottom-left
            //This makes things tricky. I need to manually correct for those.
            let x_offset = 0;
            let y_offset = 0;
            let tmxObjRef = objectlayer.objects[e];
            if(tmxObjRef.type == "mirror"){  
                let mir = mirrors.get();
                let tmxOrigin = {x:tmxObjRef.x,y:tmxObjRef.y};
                let centerPoint = new Phaser.Geom.Point(tmxObjRef.x+tmxObjRef.width/2,tmxObjRef.y-tmxObjRef.height/2);
                let rotRad = Phaser.Math.DegToRad(tmxObjRef.rotation);
                if(tmxObjRef.rotation != 0){      
                    Phaser.Math.RotateAround(centerPoint,tmxOrigin.x,tmxOrigin.y,rotRad);
                }     
                mir.setup(centerPoint.x,centerPoint.y,tmxObjRef.rotation);
            }else if(tmxObjRef.type == "window"){  
                let bar = barriers.get(-1000,-1000,"tmxwindow",0,true);
                let tmxOrigin = {x:tmxObjRef.x,y:tmxObjRef.y};
                let centerPoint = new Phaser.Geom.Point(tmxObjRef.x+tmxObjRef.width/2,tmxObjRef.y-tmxObjRef.height/2);
                let rotRad = Phaser.Math.DegToRad(tmxObjRef.rotation);
                if(tmxObjRef.rotation != 0){      
                    Phaser.Math.RotateAround(centerPoint,tmxOrigin.x,tmxOrigin.y,rotRad);
                }                
                bar.setup(centerPoint.x,centerPoint.y,rotRad);
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
                //Changed this to layer object. I may still want this, so leave it in for now. 3/14/2020 - BNB
                x_offset = tmxObjRef.width/2;
                y_offset = tmxObjRef.height/2;
                let newbreakabletile = breakabletiles.get();
                let breakabletileProps = getTileProperties(tmxObjRef.properties);
                newbreakabletile.setup(tmxObjRef.x+x_offset,tmxObjRef.y+y_offset,1,breakabletileProps.frames);
            }else if(tmxObjRef.type == "rock"){  
                let newRock = rocks.get();
                newRock.setup(tmxObjRef.x,tmxObjRef.y,1);
                
            }else if(tmxObjRef.type == "rockchute"){  
                let rockchute = new RockChute(this,tmxObjRef.x+tmxObjRef.width/2,tmxObjRef.y+tmxObjRef.height/2);                
            }else if(tmxObjRef.type == "crate"){  
                let newCrate = crates.get(tmxObjRef.x,tmxObjRef.y);
            }else if(tmxObjRef.type == "telebeam"){
                let tb = new Telebeam(this,tmxObjRef.x+tmxObjRef.width/2,tmxObjRef.y+tmxObjRef.height/2);
                let telebeamProps = getTileProperties(tmxObjRef.properties);
                tb.setRotation(Phaser.Math.DegToRad(telebeamProps.initAngle));

            }else if(tmxObjRef.type == "swingTween"){  
                let swingTw = platSwingTweens.get(tmxObjRef.x+tmxObjRef.width/2,tmxObjRef.y+tmxObjRef.height/2);
                //Dynamically Resize platforms Swing
                swingTw.setSize(tmxObjRef.width,tmxObjRef.height);
                swingTw.setDisplaySize(tmxObjRef.width,tmxObjRef.height);
                swingTw.setup(swingTw.x,swingTw.y, getTileProperties(tmxObjRef.properties),tmxObjRef.name);

            }else if(tmxObjRef.type == 'soulcrystal'){
                let scprops = getTileProperties(tmxObjRef.properties);
                let sc = new SoulCrystal(this,tmxObjRef.x+tmxObjRef.width/2,tmxObjRef.y+tmxObjRef.height/2,'soulcrystal_'+scprops.color,'scry_'+scprops.color,0,+scprops.scid)
            }else if(tmxObjRef.type == 'junk'){

                    //console.log(e);
                    let newBody = null;
                    let shapeObject = null;
                    if(tmxObjRef.rectangle){
                        shapeObject = this.add.rectangle(tmxObjRef.x + (tmxObjRef.width / 2), tmxObjRef.y + (tmxObjRef.height / 2),tmxObjRef.width, tmxObjRef.height, 0x0000ff, 1);
                        newBody = this.matter.add.gameObject(shapeObject, { shape: { type: 'rectangle', flagInternal: true } });
                    }else if(tmxObjRef.ellipse && (tmxObjRef.width == tmxObjRef.height)){  
                        let b = this.matter.add.circle(tmxObjRef.x, tmxObjRef.y,tmxObjRef.width/2,{density: 0.01,friction: 0.1});
                        shapeObject = this.add.ellipse(b.x, b.y , tmxObjRef.width, tmxObjRef.height, 0x0000ff, 1);
                        newBody = this.matter.add.gameObject(shapeObject,b);
                        
                    }else{
                        let center = Phaser.Physics.Matter.Matter.Vertices.centre(tmxObjRef.polygon);                        
                        let b = this.matter.add.fromVertices(tmxObjRef.x, tmxObjRef.y, tmxObjRef.polygon, {density: 0.01,friction: 0.1});
                        shapeObject = this.add.polygon(tmxObjRef.x, tmxObjRef.y, tmxObjRef.polygon, 0x0000ff, 1);
                        b.render.sprite.xOffset = center.x/(b.bounds.max.x - b.bounds.min.x);
                        b.render.sprite.yOffset = center.y/(b.bounds.max.y - b.bounds.min.y);                        
                        newBody = this.matter.add.gameObject(shapeObject,b);  
                        newBody.setPosition(newBody.x+(center.x),newBody.y+(center.y));
                        newBody.setStatic(true);
                    }
                    shapeObject.setCollisionCategory(CATEGORY.SOLID) 
                    shapeObject.body.label = 'JUNK'; 
            }else if(tmxObjRef.type == 'water'){
                let wtprops = getTileProperties(tmxObjRef.properties);
                let wtOps = {dampening: .0001,tension: 0.01,texture: 'water'};
                let wt = new TMXWater(this,tmxObjRef.x,tmxObjRef.y,tmxObjRef.width,tmxObjRef.height,tmxObjRef.height,wtOps);
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
                triggerObj.setup(tmxObjRef.x+trig_x_offset,tmxObjRef.y+trig_y_offset,getTileProperties(tmxObjRef.properties),tmxObjRef.name,tmxObjRef.width,tmxObjRef.height);
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
                if(exitObj.name == current_exit.solana){                    
                    solana.setPosition(exitObj.x,exitObj.y+exitObj.height/2-solana.height/2);
                    soullight.setPosition(exitObj.x,exitObj.y-32);
                    solana.setLastEntrance(exitObj);
                    this.cameras.main.centerOn(exitObj.x,exitObj.y); 

                }
                if(exitObj.name == current_exit.bright){                    
                    bright.setPosition(exitObj.x,exitObj.y-32);
                    bright.setLastEntrance(exitObj);                    
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
         
         //Pass Energy Regen
         this.energyTimer = this.time.addEvent({ delay: 250, callback: this.generateEnergy, callbackScope: this, loop: true });
     
         //Start soulight play
         soullight.sprite.anims.play('soulight-move', true);//Idle

        solana.setDepth(DEPTH_LAYERS.PLAYERS + 2);
        bright.bg.setDepth(DEPTH_LAYERS.PLAYERS);
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
            //For HULLS and MATTER SHAPES
            if (gameObjectB !== undefined && 
                (gameObjectB instanceof Phaser.GameObjects.Rectangle
                || gameObjectB instanceof Phaser.GameObjects.Ellipse
                || gameObjectB instanceof Phaser.GameObjects.Polygon)) {
                // Now you know that gameObjectB is a Tile, so you can check the index, properties, etc.
                if (bodyB.label == 'GROUND'){
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
                      || gameObjectB instanceof BreakableTile 
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
              //For HULLS and MATTER SHAPES
              if (gameObjectB !== undefined && 
                (gameObjectB instanceof Phaser.GameObjects.Rectangle
                || gameObjectB instanceof Phaser.GameObjects.Ellipse
                || gameObjectB instanceof Phaser.GameObjects.Polygon)) {
                // Now you know that gameObjectB is a Tile, so you can check the index, properties, etc.
                if (bodyB.label == 'GROUND'){
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
                || gameObjectB instanceof BreakableTile              
                || gameObjectB instanceof BrightBeamBlock)) {  

                    //handle plaform jumping allowance             
                    if(bodyA.label == "SOLANA_TOP"){
                        solana.touching.up++;
                        if(bodyB.label == "PLAT_BOTTOM" && gameObjectA.body.velocity.y < 0){
                            //Start tracking and disable collisions
                            gameObjectB.oneWayStart(gameObjectA,'up');
                        }                       
                    }
                    if(bodyA.label == "SOLANA_BOTTOM"){
                        solana.touching.down++;                        
                        if(bodyB.label == "PLAT_TOP" && gameObjectA.getControllerAction('down')){
                            //Allow Fall Thru of platform if pressing down
                            gameObjectB.oneWayStart(gameObjectA,'down');
                        }  
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
                    gameObjectB.enterZone(bright,1);
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
              //Solana Enters a zone trigger
              if (gameObjectB !== undefined && gameObjectB instanceof TMXZone) {
                    gameObjectB.enterZone(solana,0);
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
                //I need to clean this up and remove redundant code. I could use label lists and a check function to handle
                //the results.

                //Better function for checking bullets with impact but not additional things
                let bulletHitList1 = ['SOLID','GROUND','CRATE','PLATFORM'];
                if((bodyA.label == 'BULLET' && bulletHitList1.includes(bodyB.label)) || (bodyB.label == 'BULLET' && bulletHitList1.includes(bodyA.label)) ){
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
                //Between SoulCrystal and Solana
                if ((bodyA.label === 'SOULCRYSTAL' && bodyB.label === 'SOLANA') || (bodyA.label === 'SOLANA' && bodyB.label === 'SOULCRYSTAL')) {
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'SOULCRYSTAL');
                    if (gObjs[0].active){
                        gObjs[0].collect();
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
                //Between SoulTransfer and Solid/Ground
                let SoulTransferBurnList1 = ['SOLID','GROUND'];
                if((bodyA.label == 'SOULTRANSFER' && bulletHitList1.includes(bodyB.label)) || (bodyB.label == 'SOULTRANSFER' && bulletHitList1.includes(bodyA.label)) ){
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
                //Between SoulTransfer and TELEBEAM
                if ((bodyA.label === 'SOULTRANSFER' && bodyB.label === 'TELEBEAM') || (bodyA.label === 'TELEBEAM' && bodyB.label === 'SOULTRANSFER')) {
                    let gObjs = getGameObjectBylabel(bodyA,bodyB,'SOULTRANSFER');
                    if (gObjs[0].active){;
                        gObjs[0].chain(gObjs[1].rotation-(Math.PI/2),soullight.projectile_speed,gObjs[1]);
                    }  
                }
                //Between SoulTransfer and MIRROR
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
                        hud.alterEnergySolana(10);
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
                //Turned this off to allow for bullet bouncing
                //if (bodyA.label === 'BULLET' || bodyB.label === 'BULLET'){const bulletBody = bodyA.label === 'BULLET' ? bodyA : bodyB;const bulletObj = bulletBody.gameObject;bulletObj.hit();};
                
                if (bodyA.label === 'ABILITY-SOLAR-BLAST' || bodyB.label === 'ABILITY-SOLAR-BLAST'){ 
                    const bulletBody = bodyA.label === 'ABILITY-SOLAR-BLAST' ? bodyA : bodyB;
                    const bulletObj = bulletBody.gameObject;
                    bulletObj.hit();
                };
            }
        }, this);

        //Mouse
        // pointer = this.input.activePointer;

        // keyPad = new KeyboardMouseControl(this,pointer)
        this.doKPClear = false;

        if(playerMode == 0){
            solana.setController(playerConfig[0].ctrl);
            bright.setController(playerConfig[0].ctrl);
        }else if(playerMode == 1){
            solana.setController(playerConfig[0].ctrl);
            bright.setController(playerConfig[1].ctrl);

        }

        //console.log("player Configs:",gamePad,playerModes[playerMode],playerConfig);

        //TIME SCALE
        let timeScale = 1;
        this.tweens.timeScale = timeScale; // tweens
        this.matter.world.engine.timing.timeScale = timeScale; // physics
        this.time.timeScale = timeScale; // time events
        //console.log(this.time);

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
        
    },
    update: function (time, delta)
    {
       

        //center camera on the spot between the players. Zoom out to a max.
        let disPlayers = Phaser.Math.Distance.Between(solana.x,solana.y,bright.x,bright.y);
        let disPlayersX = Math.abs(solana.x - bright.x);
        let disPlayersY = Math.abs(solana.y - bright.y);

        let midPoint = {x:(solana.x+bright.x)/2,y:(solana.y+bright.y)/2}
        this.cameras.main.centerOn(midPoint.x,midPoint.y);
        //Lvl 1, Normal Mode
        if(disPlayersX < 500 && disPlayersY < 250 && this.cameraLevel != 1){
            this.cameraLevel = 1;
            this.cameras.main.zoomTo(2,1000,'Linear');
        }
        //Lvl 2, Zoom out
        if((disPlayersX >= 500 && disPlayersX < 750) || (disPlayersY >= 250 && disPlayersY < 450) && this.cameraLevel != 2){
            if( this.cameraLevel == 3){this.splitScreen(false);}//If it was split screen, cancel that.
            this.cameraLevel = 2;
            this.cameras.main.zoomTo(1.75,1000,'Linear');            
        }
        //Lvl 3, Split the Camera
        if((disPlayersX >= 750 || disPlayersY >= 450) && this.cameraLevel != 3){  
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
        
        if(tutorialRunning){
            //polaris.update(time,delta);
        };
        //Draw lighting
        var solana_in_light = false;
        this.shadow_graphic.clear();
        this.cutGraphicRaycastPolgon(soullight.x,soullight.y,1440);
        //CENTER ON CAMERA AND CALC FOR ANY APPLICABLE OFFSETS        
        this.shadow_graphic.fillCircle(bright.x, bright.y, bright.light_radius);

        //Solana in Soullight Range?
        if(Phaser.Math.Distance.Between(soullight.x,soullight.y,solana.x,solana.y) <= soullight.protection_radius.value){
            //Can the light reach her without being blocked?
            let losRc = Phaser.Physics.Matter.Matter.Query.ray(losBlockers,{x:solana.x,y:solana.y},{x:soullight.x,y:soullight.y});
            if(losRc.length == 0){solana_in_light = true;};
        }
        if(Phaser.Math.Distance.Between(bright.x,bright.y,solana.x,solana.y) <= bright.light_radius){solana_in_light = true;}

        let lamps = crystallamps.getChildren()
        for(var x = 0;x < lamps.length;x++){
            var lamp = lamps[x];
            this.shadow_graphic.fillCircle(lamp.x, lamp.y, lamp.brightness);
            if(Phaser.Math.Distance.Between(lamp.x,lamp.y,solana.x,solana.y) <= lamp.brightness){solana_in_light = true;}
        }
        let sbs = solbombs.getChildren();
        for(let s=0;s<sbs.length;s++){
            let sb = sbs[s];
            this.shadow_graphic.fillCircle(sb.x, sb.y, sb.light_radius);
            if(Phaser.Math.Distance.Between(sb.x,sb.y,solana.x,solana.y) <= sb.light_radius){solana_in_light = true;}
        }


        //Instead of doing damage right away, do drain energy. IF totally drained, then take damage.
        solana.inLight = solana_in_light;
        let rate_of_energy_drain_outside_light = 1;
        if(!solana_in_light){
            hud.alterEnergySolana(-rate_of_energy_drain_outside_light);
            if(hud.solanaStatBar.getValue() <= 0){solana.receiveDamage(1);};
        };

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
                //console.log(this.matter.world);
            }else{
                this.matter.world.drawDebug = true;
               
            }
             
        }

        //Test Matter Point Query
        
        if(keyPad.checkMouseState('MB2') == 1){
            console.log("MB2 Clicked");
            //Phaser.Physics.Matter.Matter.Query.point(this.matter.world.localWorld.bodies, pointer); 
            //this.matter.world.engine.world.bodies
            let bodiesClicked = Phaser.Physics.Matter.Matter.Query.point(this.matter.world.localWorld.bodies, {x:pointer.worldX, y:pointer.worldY});
            console.log(bodiesClicked);
            // bodiesClicked.forEach(e=>{
            //     if(e.label == 'CRATE'){
            //         e.gameObject.clicked();
            //     }
            // });
        }else if(keyPad.checkMouseState('MB2') == -1){
            // let c = crates.getChildren();
            // c.forEach(e=>{                
            //     e.released();                
            // });
        }
         
        
        //Scroll parallax based on movement of bright or solana
        let camMvdiff = Math.round(this.camMovement.x - camera_main.worldView.x);
        if(camMvdiff != 0){
            //Parallax Background
            let paraMove = camMvdiff < 0 ? -1 : 1;
            for(let i=0;i < world_backgrounds.length;i++){
                let mvVal = (0.10+(0.10*i))*paraMove;
                world_backgrounds[i].tilePositionX += mvVal;
            }
           
        }   

        //Update camera locations to track movement
        this.camMovement.x=camera_main.worldView.x;
        this.camMovement.y=camera_main.worldView.y;
      
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
    cutGraphicRaycastPolgon(x,y,range){
        let shapes = [];
        lightPolygons.forEach(function(e){
            let d = Phaser.Math.Distance.Between(x,y,e[0][0],e[0][1]);
            if(d < range){
                shapes.push(e);            
            }
        });	

        let soullight_border_verts = soullight.protection_circle.getPoints(24);
        shapes.push(createLightObstaclePolygon(0,0,soullight_border_verts));

        var visibility = createLightPolygon(x, y, shapes);
        if(visibility){
            this.shadow_graphic.beginPath();
            this.shadow_graphic.moveTo(visibility[0][0], visibility[0][1]);
            for (var i = 1; i <= visibility.length; i++) {
                this.shadow_graphic.lineTo(visibility[i % visibility.length][0], visibility[i % visibility.length][1]);
            }
            this.shadow_graphic.fillPath();
            this.shadow_graphic.closePath();
        }
    },
    cutCanvasRaycastPolygon(x,y,range,ctx){
        let shapes = [];
        lightPolygons.forEach(function(e){
            let d = Phaser.Math.Distance.Between(x,y,e[0][0],e[0][1]);
            if(d < range){
                shapes.push(e);            
            }
        });	
        shapes.push(createLightObstacleRect(x-range/2,y-range/2,range,range));
    
        var visibility = createLightPolygon(x, y, shapes);
        if(visibility){
            ctx.beginPath();
            ctx.moveTo(visibility[0][0], visibility[0][1]);
            for (var i = 1; i <= visibility.length; i++) {
                ctx.lineTo(visibility[i % visibility.length][0], visibility[i % visibility.length][1]);
            }
            ctx.closePath();
            ctx.clip();
        }
        return ctx;
    },
    cutCanvasCircle: function(x,y,radius,ctx){    
        ctx.beginPath();
        ctx.arc(x,y,radius, 0, 2 * Math.PI, false);        
        ctx.fill();

        return ctx;
    },
    doBack: function ()
    {        
		this.scene.start('mainmenu');
    },
    generateEnergy(){
        hud.alterEnergySolana(2);
        hud.alterEnergyBright(2);
    },
    saveData(){
        //Save Polaris Data
        if(tutorialRunning){
            let findState = findWithAttr(guideStates,'map',current_map);
            if(findState != -1){
                //guideStates[findState].pos.x = polaris.x;
                //guideStates[findState].pos.y = polaris.y;
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
    getGamepadVectors(gamePadID,radius,x,y){
        if(gamePad[gamePadID]){
            let stickRight = gamePad[gamePadID].getStickRight(.1);
            let stickLeft = gamePad[gamePadID].getStickLeft(.1);
            let rightVector = {x:x+stickRight.x*radius,y:y+stickRight.y*radius};
            let leftVector = {x:x+stickLeft.x*radius,y:y+stickLeft.y*radius};
            return [leftVector,rightVector];
        }
        
        return [{x:0,y:0},{x:0,y:0}];
    },
    clearKeypad(){
        this.doKPClear = true;
    }
    
});
//External Functions
function playPause(){
    //console.log('Pause',keyPad, solana.getControllerAction('right'),keyPad.checkKeyState('D'));

}
function playResume(){
    //console.log('Resume',keyPad, solana.getControllerAction('right'),keyPad.checkKeyState('D'));
    //Setup keypad clear on next update
    //playScene.clearKeypad();    
}
function getObjectTilePosition(x,y,ts){
    return {x: Math.floor(x/ts),y: Math.floor(y/ts)};
}
function createLightObstacleRect(x,y,w,h){    
    return  [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}
function createLightObstaclePolygon(x,y,points){
    let shape = [];
    points.forEach(e=>{
        shape.push([x+e.x,y+e.y])
    });
    return shape;
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
    //Currently restricted to types. I need to expand this
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
            }else if(trigger.target.type == "zone"){
                triggerzones.children.each(function(zone) {
                    //console.log("Trigger had gate target, searching names");
                    if(zone.name == trigger.target.name){
                        trigger.setTarget(zone);
                    }
                },trigger);
            }

        }
    }, this);
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
        frames: scene.anims.generateFrameNumbers('solana', { frames:[8,9,10,11,12,13] }),
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
        frames: scene.anims.generateFrameNumbers('bright', { start: 1, end: 1 }),
        frameRate: 2,
        repeat: -1
    });
    scene.anims.create({
        key: 'bright-pulse',
        frames: scene.anims.generateFrameNumbers('bright_pulse', { start: 0, end: 0 }),
        frameRate: 2,
        repeat: -1
    });
    scene.anims.create({
        key: 'bright-sway',
        frames: scene.anims.generateFrameNumbers('bright', { frames:[1] }),
        frameRate: 24,
        repeat: -1
    });
    scene.anims.create({
        key: 'bright-move',
        frames: scene.anims.generateFrameNumbers('bright', { frames:[1] }),
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
    //Soul Crystals 
    scene.anims.create({
        key: 'scry_blue',
        frames: scene.anims.generateFrameNumbers('soulcrystal_blue', { frames:[0,1,2,3,4,5,6,7] }),
        frameRate: 12,
        repeat: -1
    }); 
    scene.anims.create({
        key: 'scry_green',
        frames: scene.anims.generateFrameNumbers('soulcrystal_green', { frames:[0,1,2,3,4,5,6,7] }),
        frameRate: 12,
        repeat: -1
    }); 
    scene.anims.create({
        key: 'scry_grey',
        frames: scene.anims.generateFrameNumbers('soulcrystal_grey', { frames:[0,1,2,3,4,5,6,7] }),
        frameRate: 12,
        repeat: -1
    }); 
    scene.anims.create({
        key: 'scry_pink',
        frames: scene.anims.generateFrameNumbers('soulcrystal_pink', { frames:[0,1,2,3,4,5,6,7] }),
        frameRate: 12,
        repeat: -1
    }); 
    scene.anims.create({
        key: 'scry_orange',
        frames: scene.anims.generateFrameNumbers('soulcrystal_orange', { frames:[0,1,2,3,4,5,6,7] }),
        frameRate: 12,
        repeat: -1
    }); 
    scene.anims.create({
        key: 'scry_yellow',
        frames: scene.anims.generateFrameNumbers('soulcrystal_yellow', { frames:[0,1,2,3,4,5,6,7] }),
        frameRate: 12,
        repeat: -1
    });  
    scene.anims.create({
        key: 'telebeam-idle',
        frames: scene.anims.generateFrameNumbers('telebeam', { frames:[0,1,2] }),
        frameRate: 12,
        repeat: -1
    }); 
     
    scene.anims.create({
        key: 'light-shield',
        frames: scene.anims.generateFrameNumbers('solana_shield', { frames:[0,1,2,1,0] }),
        frameRate: 12,
        repeat: -1
    }); 
}