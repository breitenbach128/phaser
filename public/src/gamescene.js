//Main Game Scene

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
        //Create Background
        world_background = this.add.tileSprite(512, 256, 2048, 512, 'forest_background');

        // //Map the map
        // map = this.make.tilemap({key: 'map1'});
        // // tiles for the ground layer
        // var Tiles = map.addTilesetImage('map1_tiles','tiles');//called it map1_tiles in tiled
        // // create the ground layer
        // groundLayer = map.createDynamicLayer('ground', Tiles, 0, 0);

        //Map the map
        map = this.make.tilemap({key: 'map2'});
        // tiles for the ground layer
        var Tiles = map.addTilesetImage('32Tileset','tiles32');//called it map1_tiles in tiled
        // create the ground layer
        groundLayer = map.createDynamicLayer('fg', Tiles, 0, 0);
        bglayer = map.createStaticLayer('bg', Tiles, 0, 0);

        // the player will collide with this layer
        groundLayer.setCollisionByExclusion([-1]);
    
        // set the boundaries of our game world
        this.physics.world.bounds.width = groundLayer.width;
        this.physics.world.bounds.height = groundLayer.height;

        // create the player sprite    
        player = new Solana(this,128,128);
        player.body.setSize(32, 44);
        player.body.setOffset(0,20);
        this.events.emit('playerSetup');

        //player.setPipeline('Light2D');
        bright = new Bright(this,256,64);
        bright.body.setAllowGravity(false);
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
            key: 'soulight-move',
            frames: this.anims.generateFrameNumbers('soul_light', { frames:[0,1,2] }),
            frameRate: 12,
            repeat: -1
        });
        // set bounds so the camera won't go outside the game world
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        // make the camera follow the player
        this.cameras.main.startFollow(player,true,.1,.1,0,0);
        
        // set background color, so the sky is not black    
        this.cameras.main.setBackgroundColor('#ccccff'); 
        this.cameras.main.setZoom(2);

        game.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            shoot: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
            suicide: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
            bright_move: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            bright_sway: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            passLight: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)

        };
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


        speed = Phaser.Math.GetSpeed(300, 1);
        this.physics.add.overlap(enemies, bullets, damageEnemy);        
        this.physics.add.overlap(player, bullets, damagePlayer);
        //Set Colliders
        this.physics.add.collider(player, groundLayer);
        this.physics.add.collider(bright, groundLayer);
        this.physics.add.collider(enemies2, groundLayer);
        this.physics.add.collider(enemies, groundLayer);
        this.physics.add.collider(bullets, groundLayer, bulletHitGround);

        //Create enemy layer
        enemylayer = map.getObjectLayer('enemies');
        //Create spawn layer 
        spawnlayer = map.getObjectLayer('spawns');

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
       
        //var enemy2 = new enemytest(this,300,200);
        //enemies2.add(enemy2);

        //Particles
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
         
         //spawner = this.time.addEvent({ delay: 5000, callback: this.spawnEnemies, callbackScope: this, loop: true });
         //timeEventName.remove();spawnEnemies(spawnlayer.objects)
        //  this.LIGHT_RADIUS = 100;
        //  // Create the shadow texture
        //  this.shadowTexture = this.textures.createCanvas('shadow',1280, 1280);
        //  var ctx = this.shadowTexture.context;
        //  ctx.globalCompositeOperation = 'multiply';
        //  ctx.fillRect(0, 0, 1280, 1280);
        //  this.shadowTexture.refresh();
        //  // Create an object that will use the bitmap as a texture
        //  var lightSprite = this.add.image(0, 0, 'shadow');
 
        //  // Set the blend mode to MULTIPLY. This will darken the colors of
        //  // everything below this sprite.
        //  lightSprite.blendMode = Phaser.BlendModes.MULTIPLY;
         
        // this.graphics = this.add.graphics();

        // // var color = 0xffffff; // diff
        // // var color = 0x0000ff; // mult
        // this.graphics.setBlendMode(Phaser.BlendModes.MULTIPLY);
        // this.graphics.fillStyle(0x000000, .9);    
        // this.graphics.fillRect(0, 0, 1280, 1280);
        // this.graphics.fillStyle(0xffffff, .9);
        // this.graphics.beginPath();
        // this.graphics.arc(300,400,100, 0, 2 * Math.PI, false);
        // this.graphics.fill();

        
        // this.graphics.setBlendMode(Phaser.BlendModes.MULTIPLY);
        // graphics.setBlendMode(Phaser.BlendModes.SCREEN);
        // graphics.setBlendMode(Phaser.BlendModes.DIFFERENCE);
        //this.graphics.generateTexture("shadow1");
        //this.graphics.destroy();
        
        // var image_shadow = this.add.image(0,0,"shadow1");

        // this.graphics2 = this.add.graphics();
        // this.graphics2.fillStyle(0xffffff, 0);
        // //this.graphics2.setBlendMode(Phaser.BlendModes.DIFFERENCE);
        // this.graphics2.beginPath();
        // this.graphics2.arc(300,400,100, 0, 2 * Math.PI, false);
        // this.graphics2.fill();
      
        
        // var mask = this.graphics2.createGeometryMask();

        // player.setMask(mask);
        // image_shadow.setMask(mask); 

        //  var cam1 = this.cameras.add(0, 0, 400, 300);
        //  cam1.setBackgroundColor('rgba(255, 0, 0, 0.5)');

        
        // this.lights.enable().setAmbientColor(0x333333);
        // player.setPipeline('Light2D');
        // var light = this.lights.addLight(180, 80, 200).setColor(0xffffff).setIntensity(2);
        // this.input.on('pointermove', function (pointer) {
        //     light.x = pointer.x;
        //     light.y = pointer.y;
        // });
        // this.spotlight = this.make.sprite({
        //     x: 400,
        //     y: 300,
        //     key: 'mask2',
        //     add: false
        // });
        // var spotlight_mask =  new Phaser.Display.Masks.BitmapMask(this, this.spotlight);
        // player.setMask(spotlight_mask);
        // bright.setMask(spotlight_mask);

        console.log(String(Phaser.VERSION));

        
        
        // background = this.add.image(640,640,'shadow').setAlpha(.95);


      

        // this.img1 = this.make.sprite({
        //     x: 200,
        //     y: 200,
        //     key: 'mask1',
        //     add: false
        // });

        // background.mask = new Phaser.Display.Masks.BitmapMask(this, this.img1);
        // background.mask.invertAlpha = true;
        //-----------------------------------------
        // const circle = document.createElement('canvas');
        // const ctx = circle.getContext('2d');
        // ctx.fillRect(0,0,1280,1280);
 
    
        // ctx.save();
        // ctx.globalCompositeOperation='destination-out';
        // ctx.beginPath();
        // ctx.arc(250,250,120, 0, 2 * Math.PI, false);
        // ctx.fill();
        // ctx.restore();

        // // Draw the circle using Phaser 3
        // this.textures.addCanvas('circle', circle);
        // const circleImage = this.add.image(150, 200, 'circle');
        // circleImage.alpha = .9;
        //-----------------------------------------
        this.shadowTexture = this.textures.createCanvas("canvasShadow", 1280, 1280);
        
        this.shadowctx = this.shadowTexture.getContext();
        this.shadowctx.fillRect(0,0,1280,1280); 

        this.shadowTexture.refresh();
        var shadTexture = this.add.image(640, 640, 'canvasShadow');
        shadTexture.alpha = .9;

        var light1 = this.add.image(256,64,'light1');
        light1.alpha = .5;
        light1.tint = 0xCCCC00;
        player.depth = light1.depth+1;
        bright.depth = light1.depth+1;

        this.light_crystals = new Array();
        this.light_crystals.push(new CrystalLamp(this,250,250,150));
        this.light_crystals.push(new CrystalLamp(this,700,200,150));
        this.light_crystals.push(new CrystalLamp(this,500,600,150));

        this.soul_light =new SoulLight(this,128,64,player);
        this.soul_light.anims.play('soulight-move', true);//Idle

    },

    update: function (time, delta)
    {
        // this.spotlight.x = player.x;
        // this.spotlight.y = player.y;
        //Updates
        //this.updateShadowTexture();
        player.update(time,delta);
        this.soul_light.update(time,delta);
        // this.img1.x = player.x;
        // this.img1.y = player.y;

        //Draw lighting
        this.shadowctx.fillRect(0,0,1280,1280);    
        
        //Do Crystal Lamps and Light Checking
        var player_in_light = false;
        for(var x = 0;x < this.light_crystals.length;x++){
            var lamp = this.light_crystals[x];
            this.shadowctx = this.cutCanvasCircle(lamp.x,lamp.y,lamp.brightness,this.shadowctx);
            
            //Check if player is inside at least one light, if not, flag them and damage them every x seconds.
            if(Phaser.Math.Distance.Between(lamp.x,lamp.y,player.x,player.y) <= lamp.brightness){player_in_light = true;}

        }
        

        this.shadowctx = this.cutCanvasCircle(this.soul_light.x,this.soul_light.y,this.soul_light.protection_radius,this.shadowctx);

        if(Phaser.Math.Distance.Between(this.soul_light.x,this.soul_light.y,player.x,player.y) <= this.soul_light.protection_radius){player_in_light = true;}

        //is the player outside the light? Do damage!
        player.inLight = player_in_light;

        this.shadowTexture.refresh();

        //Draw Circle
        // this.graphics2.clear()
        // this.graphics2.fillStyle(0xDDDDDD, .2);
        // this.graphics2.setBlendMode(Phaser.BlendModes.DIFFERENCE);
        // this.graphics2.beginPath();
        // this.graphics2.arc(player.x,player.y,200, 0, 2 * Math.PI, false);
        // this.graphics2.fill();

        //Collisions

        if (this.input.gamepad.total != 0)
        {     
            var pads = this.input.gamepad.gamepads;
            var pad = pads[0];
        }else{
            var pad = {id:1,buttons:[]} //Load with empty values if pad is not valid
            for(var i=0;i<99;i++){
                pad.buttons[i]=0;
            }
        }

        //Control Player if alive.
        if(player.alive){
            if ((game.wasd.left.isDown || pad.buttons[14].value == 1)) {
                player.body.setVelocityX(-mv_speed);
                player.anims.play('solana-walk', true);
                player.flipX= true; // flip the sprite to the left
            }
            else if ((game.wasd.right.isDown || pad.buttons[15].value == 1)) {
                player.body.setVelocityX(mv_speed);
                player.anims.play('solana-walk', true);
                player.flipX= false; // flip the sprite to the right
            }
            else if(!(game.wasd.right.isDown || pad.buttons[15].value == 1) && !(game.wasd.left.isDown || pad.buttons[14].value == 1)){
                player.body.setVelocityX(0);
                player.anims.play('solana-idle', true);//Idle
            }
            // If the user wants to jump - check prev to make sure it is not just being held down       
            
            if ((Phaser.Input.Keyboard.JustDown(game.wasd.up) || (pad.buttons[2].pressed && !prevJumpButtonPressed)) && player.jumpReady) {
                player.jump(jump_vel,mv_speed);            
                //jumpSound.play();

            }

            prevJumpButtonPressed = pad.buttons[2].pressed;
        }
        // //Check for shooting 
        // if(game.wasd.shoot.isDown || pad.buttons[0].value == 1){
        //     player.anims.play('player-shoot', true);
        //     var bullet = bullets.get();
        //     if (bullet && (time-lastFired) >  player.rof)//ROF(MS)
        //     {
        //         bullet.body.setAllowGravity(false)
        //         bullet.fire(player.x, player.y,player.flipX,600,1500);
        //         lastFired = time;
        //     }
        // }  
        scoreText.setText("Debug Text area");

        //Suicide to test animation
        if(Phaser.Input.Keyboard.JustDown(game.wasd.suicide)){
            player.receiveDamage(1);
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
                this.soul_light.passLight(bright,2);
            }else{
                this.soul_light.passLight(player,1);
            }
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
    //ground hit particles
    emitter0.active = true;
    emitter0.explode(5,bullet.x,bullet.y);
    //bullet hits
    bullet.hit();
}
function damagePlayer(p,bullet){
    //bullet hits
    bullet.hit();
    //then hurt player
    p.receiveDamage(1);
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