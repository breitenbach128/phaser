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
        player = this.physics.add.sprite(200, 200, 'player'); 
        player.setBounce(0.0); // our player will bounce from items
        player.setSize(57, 48, 3, 11);//Xsize,Ysize,Xoffset,YOffset
        player.setCollideWorldBounds(true); // don't go out of the map
        player.setActive(true)
        player.rof = 220;
        player.hp = 10;
        // player walk animation
        this.anims.create({
            key: 'player-walk',
            frames: this.anims.generateFrameNumbers('player', { start: 2, end: 4 }),
            frameRate: 32,
            repeat: -1
        });
        //Player shoot animation
        this.anims.create({
            key: 'player-shoot',
            frames: this.anims.generateFrameNumbers('player', { start: 5, end: 6 }),
            frameRate: 16,
            repeat: -1
        });
        // idle with only one frame, so repeat is not neaded
        this.anims.create({
            key: 'player-idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
            frameRate: 2,
            repeat: -1
        });
        //Enemy animations       
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
       
        var enemy2 = new enemytest(this,300,200);
        enemies2.add(enemy2);

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
         
         spawner = this.time.addEvent({ delay: 5000, callback: spawnEnemies, callbackScope: this, loop: true });
         //timeEventName.remove();spawnEnemies(spawnlayer.objects)
    },

    update: function (time, delta)
    {
        //Collisions

        //Gamepad - Input required to start the gamepad.
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
      
        if (game.wasd.left.isDown || pad.buttons[14].value == 1) {
            player.body.velocity.x = -mv_speed;
            player.anims.play('player-walk', true);
            player.flipX= true; // flip the sprite to the left
        }
        else if (game.wasd.right.isDown || pad.buttons[15].value == 1) {
            player.body.velocity.x = mv_speed;
            player.anims.play('player-walk', true);
            player.flipX= false; // flip the sprite to the right
        }
        else {
            player.body.velocity.x = 0;
            player.anims.play('player-idle', true);
        }

        //Check for shooting 
        if(game.wasd.shoot.isDown || pad.buttons[0].value == 1){
            player.anims.play('player-shoot', true);
            var bullet = bullets.get();
            if (bullet && (time-lastFired) >  player.rof)//ROF(MS)
            {
                bullet.body.setAllowGravity(false)
                bullet.fire(player.x, player.y,player.flipX,600,1500);
                lastFired = time;
            }
        }  

        // If the user wants to jump
        if (((game.wasd.up.isDown) || pad.buttons[2].value == 1) && player.body.onFloor()) {// && Phaser.Time.now > jumpTimer
            player.body.velocity.y = -jump_vel; 
            jumpTimer = Phaser.Time.now + 750;
            //jumpSound.play();

        }
        scoreText.setText("TimeDelta:"+ String(spawner.getRepeatCount())+' : ' + String(enemies.countActive())+":"+String(enemies.getLength())+" : " + String(player.body.onFloor()));
      
    },
	
    doBack: function ()
    {
        
		this.scene.start('mainmenu');
    }

});