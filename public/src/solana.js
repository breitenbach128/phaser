class Solana {
    constructor(config) {
        this.scene = config.scene;
        // Create the physics-based sprite that we will move around and animate
        this.sprite = this.scene.matter.add.sprite(config.x, config.y, config.sprite, config.frame);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        
        const { width: w, height: h } = this.sprite;
        //const mainBody = Bodies.rectangle(0, 0, w * 0.6, h, { chamfer: { radius: 10 } });
        

        const mainBody = Bodies.rectangle(0, 0, w * 0.6, h-12);
        
        this.sensors = {
          bottom: Bodies.rectangle(0, h*0.5-6, w * 0.25, 2, { isSensor: true }),
          left: Bodies.rectangle(-w * 0.35, 0, 2, h * 0.5, { isSensor: true }),
          right: Bodies.rectangle(w * 0.35, 0, 2, h * 0.5, { isSensor: true })
        };
        const compoundBody = Body.create({
          parts: [mainBody, this.sensors.bottom, this.sensors.left, this.sensors.right],
          //parts: [mainBody],
          frictionStatic: 0,
          frictionAir: 0.02,
          friction: 0.1
        });
       //Fix the draw offsets for the compound sprite.
        compoundBody.render.sprite.xOffset = .5;
        compoundBody.render.sprite.yOffset = .60;

        this.sprite
          .setExistingBody(compoundBody)
          .setFixedRotation() // Sets inertia to infinity so the player can't rotate
          .setPosition(config.x, config.y);

        //this.sprite.setIgnoreGravity(true);
        //Custom Properties
        this.hp = 5;
        this.max_hp = 5;
        this.mv_speed = 6;
        this.mv_direction = {x:0,y:0};
        this.jump_speed = 4;
        this.prevJumpButtonPressed = false;
        this.onGround = false;
        this.onWall = false;
        this.jumpReady = false;
        this.alive = true;
        this.inLight = true;


        this.debug = this.scene.add.text(this.x, this.y-16, 'Solana', { fontSize: '10px', fill: '#00FF00' });
        //Sounds
        this.soundJump = game.sound.add('jumpSolana');

        //JumpTimer
        this.jumpTimer = this.scene.time.addEvent({ delay: 100, callback: this.forgiveJump, callbackScope: this, loop: false });
        this.jumpTimerRunning = false;
        this.jumpLock = false;
        this.jumpLockTimer;

      }

    update(time,delta)
    {
        if(this.alive){

            //Detection Code for Jumping

            // // Solana on the ground and touching a wall on the right
            // if(this.sprite.body.blocked.right && this.sprite.body.blocked.down){
                
            //     this.onGround = true;
            // }
    
            // // Solana NOT on the ground and touching a wall on the right
            // if(this.sprite.body.blocked.right && !this.sprite.body.blocked.down){
    
            //     // Solana on a wall
            //     this.onWall = true;                
            //     this.flipX= true;
            // }
    
            // // same concept applies to the left
            // if(this.sprite.body.blocked.left && this.sprite.body.blocked.down){
               
            //     this.onGround = true;                
            //     this.flipX= false;

            // }
            // if(this.sprite.body.blocked.left && !this.sprite.body.blocked.down){
            //     this.onWall = true;
            // }
            // //Check for Walls
            // if(!this.sprite.body.blocked.left && !this.sprite.body.blocked.right){
            //     this.onWall = false;
            // }
            // //Final on Ground Check
            // if(this.body.blocked.down){
            //     this.onGround = true;
            // }else{
            //     this.onGround = false;
            // }

            // //Check Jump ready
            // if(this.onGround || this.onWall){
            //     this.jumpReady = true;
            // }else{  
            //     //Add Jump Forgiveness of 100ms  
            //     if(this.jumpTimerRunning == false){
            //         this.jumpTimer = this.scene.time.addEvent({ delay: 100, callback: this.forgiveJump, callbackScope: this, loop: false });
            //         this.jumpTimerRunning = true;         
            //     }   
                
            // }

            // //Slow Descent if on Wall
            // if(this.onWall){
            //     this.body.setVelocityY(0);
            // }else{

            // }

            //Movement Code
            if(curr_player==players.SOLANA){
                //Only control if currently the active control object
                let control_left = (game.wasd.left.isDown || gamePad.buttons[14].value == 1);
                let control_right = (game.wasd.right.isDown || gamePad.buttons[15].value == 1);

                if (control_left && this.jumpLock == false) {
                    if(this.onWall){
                            this.sprite.setVelocityX(-1);
                            this.sprite.flipX= false;
                    }else{
                            this.sprite.setVelocityX(-this.mv_speed);
                            this.sprite.flipX= true; // flip the sprite to the left
                    }
                    this.mv_direction.x = -1;
                }
                else if (control_right && this.jumpLock == false) {
                  
                    if(this.onWall){
                        this.sprite.setVelocityX(1);
                        this.sprite.flipX= true;
                    }else{
                        this.sprite.setVelocityX(this.mv_speed);                    
                        this.sprite.flipX= false; // flip the sprite to the right
                    }
            
                    this.mv_direction.x = 1;
                }
                else if(!control_right && !control_left){

                    this.sprite.setVelocityX(0);                   
                    this.mv_direction.x = 0; 
                }

                       
                if(this.mv_direction.x == 0){
                    this.sprite.anims.play('solana-idle', true);//Idle
                }else{
                    this.sprite.anims.play('solana-walk', true);
                }

                this.jumpReady = true;
                if ((Phaser.Input.Keyboard.JustDown(game.wasd.jump) || (gamePad.buttons[2].pressed && !this.prevJumpButtonPressed)) && this.jumpReady) {
                    this.jump(this.jump_speed,solana.mv_speed);            
                    //jumpSound.play();

                }
                // If the user wants to jump - check prev to make sure it is not just being held down
                this.prevJumpButtonPressed = gamePad.buttons[2].pressed;
            }

        }


        this.debug.setPosition(this.sprite.x+32, this.sprite.y+64);
        this.debug.setText("Ground:"+String(this.onGround)
        +" \Velocity:"+String(this.sprite.body.velocity.x)+":"+String(this.sprite.body.velocity.y)
        //+" \nWall L:"+String(this.sprite.body.blocked.left)+" R:"+String(this.sprite.body.blocked.right)
        +" \njr:"+String(this.jumpReady)
        +" \nflip:"+String(this.flipX)
        +" \nInLight:"+String(this.inLight));
        
    }
    jumpLockReset(){
        this.jumpLock = false;
    }
    forgiveJump(){
        this.jumpReady = false;
        this.jumpTimerRunning = false; 
    }
    jump(jumpVel,mvVel){
        // if(this.sprite.body.blocked.right){
        //     this.sprite.setVelocityX(-mvVel);
        //     this.jumpLock = true;
        //     this.jumpLockTimer = this.scene.time.addEvent({ delay: 400, callback: this.jumpLockReset, callbackScope: this, loop: false });
        // }
        // if(this.body.blocked.left){
        //     this.bospritedy.setVelocityX(mvVel);
        //     this.jumpLock = true;
        //     this.jumpLockTimer = this.scene.time.addEvent({ delay: 400, callback: this.jumpLockReset, callbackScope: this, loop: false });
        // }
        this.sprite.setVelocityY(-jumpVel);
        this.soundJump.play();
    }

    death(animation, frame){
        
        if(animation.key == 'solana-death'){
            this.setActive(false);
            //this.setVisible(false);
            this.debug.setVisible(false);
            
            console.log("Solanas DEAD!")
        }
        
    }
    resurect(){
        this.hp = this.max_hp;
        this.setActive(true);
        this.setVisible(true);
        this.debug.setVisible(true);
        this.alive = true; 
    }
    receiveDamage(damage) {
                
        if(this.alive){
            //Kill Blips
            this.scene.events.emit('playerHurt');
            hud.setHealth(this.hp,this.max_hp);
            //Remove health
            this.hp -= damage; 
            emitter0.active = true;
            emitter0.explode(5,this.x,this.y);

            // if hp drops below 0, die
            if(this.hp <= 0) {
                this.alive = false;                         
                this.body.setVelocityX(0);
                this.on('animationcomplete',this.death,this);            
                this.anims.play('solana-death', false);  
                console.log("deadly damage recv. Play death anim")              
            }
        }   
    }
}
