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

    },

    create: function ()
    {
        //Refresh/Setup HUD
        let hud_scene = this.scene.get('UIScene');;
        hud_scene.updateGameScene();
        
        //Create Background
        world_background = this.add.tileSprite(512, 256, 2048, 512, 'forest_background');

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
        // create the ground layer
        let groundLayer = map.createDynamicLayer('fg', Tiles, 0, 0);
        let bglayer = map.createStaticLayer('bg', Tiles, 0, 0);
        
        // the solana will collide with this layer
        groundLayer.setCollisionByExclusion([-1]);
        //groundLayer.setCollisionBetween(0, 256);
        // set the boundaries of our game world
        this.physics.world.bounds.width = groundLayer.width;
        this.physics.world.bounds.height = groundLayer.height;
        
        // create the solana sprite    
        solana = new Solana(this,128,128);
        solana.body.setSize(32, 44);
        solana.body.setOffset(0,20);
        this.events.emit('solanaSetup');
        
        //solana.setPipeline('Light2D');
        bright = new Bright(this,256,64);
        //Enemy animations - Move to JSON       
        this.anims.create({
            key: 'enemy-idle',
            frames: this.anims.generateFrameNumbers('enemy1', { frames:[0,3] }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: 'enemy-walk',
            frames: this.anims.generateFrameNumbers('enemy1', { start: 1, end: 2 }),
            frameRate: 24,
            repeat: -1
        });
        this.anims.create({
            key: 'enemy-shoot',
            frames: this.anims.generateFrameNumbers('enemy1', { frames:[5,5,4,5]}),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'enemy-death',
            frames: this.anims.generateFrameNumbers('enemy1', { start: 0, end: 0 }),
            frameRate: 6,
            repeat: 0
        });
        this.anims.create({
            key: 'solana-death',
            frames: this.anims.generateFrameNumbers('solana', { frames:[8,9,10,11,12,13,14,15,16] }),
            frameRate: 4,
            repeat: 0
        });
        this.anims.create({
            key: 'solana-idle',
            frames: this.anims.generateFrameNumbers('solana', { start: 0, end: 1 }),
            frameRate: 2,
            repeat: -1
        });
        this.anims.create({
            key: 'solana-walk',
            frames: this.anims.generateFrameNumbers('solana', { start: 5, end: 6 }),
            frameRate: 6,
            repeat: -1
        });
        this.anims.create({
            key: 'solana-jump',
            frames: this.anims.generateFrameNumbers('solana', { start: 7, end: 7 }),
            frameRate: 6,
            repeat: -1
        });
        this.anims.create({
            key: 'bright-idle',
            frames: this.anims.generateFrameNumbers('bright', { start: 0, end: 1 }),
            frameRate: 6,
            repeat: -1
        });
        this.anims.create({
            key: 'bright-sway',
            frames: this.anims.generateFrameNumbers('bright', { frames:[0,2,3,4,5,6,7,8,9,10,11,0,2,3,18,17,16,15,14,13,12,11] }),
            frameRate: 12,
            repeat: -1
        });
        this.anims.create({
            key: 'bright-move',
            frames: this.anims.generateFrameNumbers('bright', { frames:[3,4,5,6,7,8,9,11,12,13,14,15,16,17,18] }),
            frameRate: 12,
            repeat: -1
        });        
        this.anims.create({
            key: 'dark-idle',
            frames: this.anims.generateFrameNumbers('dark', { frames:[0,1,2,1,0] }),
            frameRate: 6,
            repeat: -1
        });
        
        this.anims.create({
            key: 'dark-falling',
            frames: this.anims.generateFrameNumbers('dark', { start: 3, end: 3 }),
            frameRate: 6,
            repeat: -1
        });
        this.anims.create({
            key: 'soulight-move',
            frames: this.anims.generateFrameNumbers('soul_light', { frames:[0,1,2] }),
            frameRate: 12,
            repeat: -1
        });
        
        this.anims.create({
            key: 'mirror-hit',
            frames: this.anims.generateFrameNumbers('mirror', { frames:[1,2,3,4] }),
            frameRate: 24,
            repeat: 0
        });
        
        this.anims.create({
            key: 'mirror-idle',
            frames: this.anims.generateFrameNumbers('mirror', { frames:[0,0] }),
            frameRate: 1,
            repeat: -1
        });
        // set bounds so the camera won't go outside the game world
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        // make the camera follow the solana
        this.cameras.main.startFollow(solana,true,.1,.1,0,0);
        
        // set background color, so the sky is not black    
        this.cameras.main.setBackgroundColor('#ccccff'); 
        this.cameras.main.setZoom(2);
        
        
        
        camera_main = this.cameras.main;
        //Configure Controls by simple names
        game.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            shoot: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
            jump: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
            suicide: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
            bright_move: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            bright_sway: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            passLight: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
            restart_scene: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
            change_player: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K)

        };
        //Example Text
        scoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#000' });

        //groups
        //Enemies
        enemies = this.physics.add.group({ 
            classType: Enemy,
            runChildUpdate: true 
        });
        //Enemiestest
        enemies2 = this.physics.add.group({ 
            classType: enemytest,
            runChildUpdate: true 
        });
        //Bullets
        bullets = this.physics.add.group({
            classType: Bullet,
            //maxSize: 50,
            runChildUpdate: true
        });
        //Mirrors
        mirrors = this.physics.add.group({ 
            classType: Mirror,
            runChildUpdate: true 
        });
        //Exits
        exits = this.physics.add.group({ 
            classType: Exit,
            runChildUpdate: true 
        });


        speed = Phaser.Math.GetSpeed(300, 1);
        //Set Overlaps
        this.physics.add.overlap(enemies, bullets, damageEnemy);        
        this.physics.add.overlap(solana, bullets, damageSolana);
        this.physics.add.overlap(solana, mirrors, controlMirror);
        this.physics.add.overlap(solana, exits, exitLevel);
        //Set Colliders
        this.physics.add.collider(solana, groundLayer);
        this.physics.add.collider(bright, groundLayer);
        this.physics.add.collider(enemies2, groundLayer);
        this.physics.add.collider(enemies, groundLayer);
        this.physics.add.collider(mirrors, groundLayer);
        this.physics.add.collider(bullets, mirrors, bulletHitMirror);
        this.physics.add.collider(bullets, groundLayer, bulletHitGround);

        //Create enemy layer
        enemylayer = map.getObjectLayer('enemies');
        //Create spawn layer 
        spawnlayer = map.getObjectLayer('spawns');
        //Create mirror Layer
        let mirrorlayer = map.getObjectLayer('mirrors');
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
                new_enemy.body.setBounce(0.1);
                
            } 
        }
        //Spawn Mirrors
        for(e=0;e<mirrorlayer.objects.length;e++){
            let new_mirror = mirrors.get();
            if(new_mirror){
                new_mirror.setup(mirrorlayer.objects[e].x,mirrorlayer.objects[e].y,mirrorlayer.objects[e].rotation);
            }
        }
        //Spawn Exits
        for(e=0;e<exitlayer.objects.length;e++){
            let new_exit = exits.get();
            if(new_exit){
                console.log(exitlayer.objects[e].properties,current_map);
                new_exit.setup(exitlayer.objects[e].x,exitlayer.objects[e].y,getTileProperties(exitlayer.objects[e].properties));
            }
        }
        //var enemy2 = new enemytest(this,300,200);
        //enemies2.add(enemy2);

        //Particles - Example
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
         
         //Timer  - Example
         //spawner = this.time.addEvent({ delay: 5000, callback: this.spawnEnemies, callbackScope: this, loop: true });
         //timeEventName.remove();spawnEnemies(spawnlayer.objects)


      
        
         //Lightning construct using preloaded cavnas called canvasShadow (See Preloader)
        var shadTexture = this.add.image(640, 640, 'canvasShadow');
        shadTexture.alpha = .9;

        var light1 = this.add.image(256,64,'light1');
        light1.alpha = .5;
        light1.tint = 0xCCCC00;
        solana.depth = light1.depth+1;
        bright.depth = light1.depth+1;

        //MOve these to a layer in Tiled/TMX
        this.light_crystals = new Array();
        this.light_crystals.push(new CrystalLamp(this,250,250,150));
        this.light_crystals.push(new CrystalLamp(this,700,200,150));
        this.light_crystals.push(new CrystalLamp(this,500,600,150));

        this.soul_light =new SoulLight(this,128,64,solana);
        this.soul_light.anims.play('soulight-move', true);//Idle


        hud_scene.setupHud(solana);
    },

    update: function (time, delta)
    {
        //Establish Gamepad - MOve to menu - one time call in the future.
        if (this.input.gamepad.total != 0)
        {     
            var pads = this.input.gamepad.gamepads;
            gamePad = pads[0];
        }else{
            gamePad = {id:1,buttons:[]} //Load with empty values if pad is not valid
            for(var i=0;i<99;i++){
                gamePad.buttons[i]=0;
            }
        }
        // this.spotlight.x = solana.x;
        // this.spotlight.y = solana.y;
        //Updates
        //this.updateShadowTexture();
        solana.update(time,delta);
        bright.update(time,delta);
        this.soul_light.update(time,delta);
        // this.img1.x = solana.x;
        // this.img1.y = solana.y;

        //Draw lighting        
        shadow_context.fillRect(0,0,1280,1280);    
        
        //Do Crystal Lamps and Light Checking
        var solana_in_light = false;
        for(var x = 0;x < this.light_crystals.length;x++){
            var lamp = this.light_crystals[x];
            shadow_context = this.cutCanvasCircle(lamp.x,lamp.y,lamp.brightness,shadow_context);
            
            //Check if solana is inside at least one light, if not, flag them and damage them every x seconds.
            if(Phaser.Math.Distance.Between(lamp.x,lamp.y,solana.x,solana.y) <= lamp.brightness){solana_in_light = true;}

        }
        

        shadow_context = this.cutCanvasCircle(this.soul_light.x,this.soul_light.y,this.soul_light.protection_radius,shadow_context);

        if(Phaser.Math.Distance.Between(this.soul_light.x,this.soul_light.y,solana.x,solana.y) <= this.soul_light.protection_radius){solana_in_light = true;}

        //is the solana outside the light? Do damage!
        solana.inLight = solana_in_light;

        shadow_layer.refresh();

        //Draw Circle
        // this.graphics2.clear()
        // this.graphics2.fillStyle(0xDDDDDD, .2);
        // this.graphics2.setBlendMode(Phaser.BlendModes.DIFFERENCE);
        // this.graphics2.beginPath();
        // this.graphics2.arc(solana.x,solana.y,200, 0, 2 * Math.PI, false);
        // this.graphics2.fill();

        //Collisions



 
        //Check for shooting 
        if(game.wasd.shoot.isDown || gamePad.buttons[0].value == 1){
            solana.anims.play('solana-shoot', true);            
            if ((time-lastFired) >  240)//ROF(MS)
            {
                let solanaCenter = solana.getCenter();
                let bullet = bullets.get();
                bullet.body.setAllowGravity(false)
                bullet.fire(solanaCenter.x, solanaCenter.y, solana.flipX, 150, 1,0, 64);
                lastFired = time;
            }
        }  

        scoreText.setText("Debug Text area");

        //Suicide to test animation
        if(Phaser.Input.Keyboard.JustDown(game.wasd.suicide)){
            solana.receiveDamage(1);
        }
        //Test bright
        if(Phaser.Input.Keyboard.JustDown(game.wasd.bright_move)){
            bright.anims.play('bright-move', true);
        }
        if(Phaser.Input.Keyboard.JustDown(game.wasd.bright_sway)){
            bright.anims.play('bright-sway', true);
        } 
        if(Phaser.Input.Keyboard.JustDown(game.wasd.passLight)){
            if(this.soul_light.ownerid == 1){
                //Owner is solana, Pass to dark, dark becomes bright.
                this.soul_light.passLight(bright,2);
                bright.toBright();
            }else{
                //Owner is Bright, pass to solana, become dark.
                this.soul_light.passLight(solana,1);
                bright.toDark();
            }
        }  
        if(Phaser.Input.Keyboard.JustDown(game.wasd.restart_scene)){  
            if(current_map == "map2"){current_map = "map3"}else{current_map = "map2"};   
            let hud_scene = this.scene.get('UIScene');;
            hud_scene.clearHud();       
            this.scene.restart();
        }     
        if(Phaser.Input.Keyboard.JustDown(game.wasd.change_player)){
            this.changePlayer();
        } 
 
      
    },
    changePlayer: function(){
        curr_player == players.SOLANA ? curr_player=players.BRIGHT : curr_player=players.SOLANA;
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
                    new_enemy.body.setBounce(0.1);
                    
                } 
            }
        }   
    }
});
//External Functions

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



        console.log(Phaser.Math.RadToDeg(angleBetween),Phaser.Math.RadToDeg(angleofReflection),Phaser.Math.RadToDeg(angleDiff),Phaser.Math.RadToDeg(angResult));
        
        bullet.bounceOff(angResult,m.width,mCenter.x,mCenter.y);
        m.hit();
    }
}
function damageSolana(p,bullet){
    if (bullet.active === true){
        //bullet hits
        bullet.hit();
        //then hurt solana
        p.receiveDamage(1);
    }
}
function controlMirror(s,m){
    if(curr_player==players.SOLANA){
        //Only control if currently the active control object
        if((game.wasd.up.isDown || gamePad.buttons[12].value == 1)) {
            m.rotateMirror(2);
        }else if((game.wasd.down.isDown || gamePad.buttons[13].value == 1)) {
            m.rotateMirror(-2);
        }
    }
}
function getTileProperties(propArray){
    let object = {};
    propArray.forEach(element => {
        object[element.name] = element.value;
    });
    return object;
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