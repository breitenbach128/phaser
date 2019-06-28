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


        //Map the map
        map = this.make.tilemap({key: 'map1'});
        // tiles for the ground layer
        var Tiles = map.addTilesetImage('map1_tiles','tiles');//called it map1_tiles in tiled
        // create the ground layer
        groundLayer = map.createDynamicLayer('ground', Tiles, 0, 0);

        // the player will collide with this layer
        groundLayer.setCollisionByExclusion([-1]);
    
        // set the boundaries of our game world
        this.physics.world.bounds.width = groundLayer.width;
        this.physics.world.bounds.height = groundLayer.height;

        // create the player sprite    
        player = new Solana(this,200,200);
        //player.setPipeline('Light2D');
        bright = new Bright(this,200,500);
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
            frames: this.anims.generateFrameNumbers('enemy1', { start: 6, end: 10 }),
            frameRate: 6,
            repeat: 0
        });
        this.anims.create({
            key: 'solana-death',
            frames: this.anims.generateFrameNumbers('solana', { start: 0, end: 1 }),
            frameRate: 6,
            repeat: 0
        });
        this.anims.create({
            key: 'solana-walk',
            frames: this.anims.generateFrameNumbers('solana', { start: 0, end: 1 }),
            frameRate: 6,
            repeat: -1
        });
        this.anims.create({
            key: 'bright-walk',
            frames: this.anims.generateFrameNumbers('bright', { start: 0, end: 1 }),
            frameRate: 6,
            repeat: -1
        });

        // set bounds so the camera won't go outside the game world
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        // make the camera follow the player
        this.cameras.main.startFollow(player);
        
        // set background color, so the sky is not black    
        this.cameras.main.setBackgroundColor('#ccccff'); 
        
        game.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            shoot: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L)
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
    },

    update: function (time, delta)
    {
        // this.spotlight.x = player.x;
        // this.spotlight.y = player.y;
        //Updates
        //this.updateShadowTexture();
        player.update(time,delta);
        // this.img1.x = player.x;
        // this.img1.y = player.y;

        //Draw lighting
        this.shadowctx.fillRect(0,0,1280,1280);     
        this.shadowctx = this.cutCanvasCircle(250,250,250,this.shadowctx);
        this.shadowctx = this.cutCanvasCircle(700,200,300,this.shadowctx);
        this.shadowctx = this.cutCanvasCircle(500,600,150,this.shadowctx);
        this.shadowctx = this.cutCanvasCircle(player.x,player.y,250,this.shadowctx);
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
            player.anims.play('solana-walk', true);//Idle
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

        // If the user wants to jump - check prev to make sure it is not just being held down       
        
        if ((Phaser.Input.Keyboard.JustDown(game.wasd.up) || (pad.buttons[2].pressed && !prevJumpButtonPressed)) && player.jumpReady) {
            player.jump(jump_vel,mv_speed);            
            //jumpSound.play();

        }
        prevJumpButtonPressed = pad.buttons[2].pressed;

        scoreText.setText("Debug Text area");
      
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