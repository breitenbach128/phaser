class Solana extends Phaser.GameObjects.Sprite {

    constructor(scene,x,y) {
        super(scene, x,y, "solana")
        this.scene = scene;

        this.scene.physics.world.enable(this);
        this.scene.add.existing(this)

        //this.body.setBounce(1, 1);
        this.body.setCollideWorldBounds(true);
        this.setActive(true)
        
        this.hp = 5;
        this.max_hp = 5;
        this.mv_speed = 220;
        this.mv_direction = {x:0,y:0};
        this.jump_speed = 300;
        this.prevJumpButtonPressed = false;
        this.onGround = false;
        this.onWall = false;
        this.jumpReady = false;
        this.alive = true;
        this.inLight = true;
        
        this.debug = scene.add.text(this.x, this.y-16, 'Solana', { fontSize: '10px', fill: '#00FF00' });
        //Sounds
        this.soundJump = game.sound.add('jumpSolana');

        //JumpTimer
        this.jumpTimer = this.scene.time.addEvent({ delay: 100, callback: this.forgiveJump, callbackScope: this, loop: false });
        this.jumpTimerRunning = false;
        this.jumpLock = false;
        this.jumpLockTimer;

        //Custom additional gravity
        this.body.setGravityY(300);
    }

    update(time,delta)
    {
        if(this.alive){

            //Detection Code for Jumping

            // Solana on the ground and touching a wall on the right
            if(this.body.blocked.right && this.body.blocked.down){
                
                this.onGround = true;
            }
    
            // Solana NOT on the ground and touching a wall on the right
            if(this.body.blocked.right && !this.body.blocked.down){
    
                // Solana on a wall
                this.onWall = true;                
                this.flipX= true;
            }
    
            // same concept applies to the left
            if(this.body.blocked.left && this.body.blocked.down){
               
                this.onGround = true;                
                this.flipX= false;

            }
            if(this.body.blocked.left && !this.body.blocked.down){
                this.onWall = true;
            }
            //Check for Walls
            if(!this.body.blocked.left && !this.body.blocked.right){
                this.onWall = false;
            }
            //Final on Ground Check
            if(this.body.blocked.down){
                this.onGround = true;
            }else{
                this.onGround = false;
            }

            //Check Jump ready
            if(this.onGround || this.onWall){
                this.jumpReady = true;
            }else{  
                //Add Jump Forgiveness of 100ms  
                if(this.jumpTimerRunning == false){
                    this.jumpTimer = this.scene.time.addEvent({ delay: 100, callback: this.forgiveJump, callbackScope: this, loop: false });
                    this.jumpTimerRunning = true;         
                }   
                
            }

            //Slow Descent if on Wall
            if(this.onWall){
                this.body.setVelocityY(0);
            }else{

            }

            //Movement Code
            if(curr_player==players.SOLANA){
                //Only control if currently the active control object
                if ((game.wasd.left.isDown || gamePad.buttons[14].value == 1) && this.jumpLock == false) {
                    if(this.onWall){
                        this.body.setVelocityX(-1);
                        this.flipX= false;
                    }else{
                        this.body.setVelocityX(-this.mv_speed);
                        this.flipX= true; // flip the sprite to the left
                    }
                    this.mv_direction.x = -1;
                }
                else if ((game.wasd.right.isDown || gamePad.buttons[15].value == 1) && this.jumpLock == false) {
                    if(this.onWall){
                        this.body.setVelocityX(1);
                        this.flipX= true;
                    }else{
                        this.body.setVelocityX(this.mv_speed);                    
                        this.flipX= false; // flip the sprite to the right
                    }
                    this.mv_direction.x = 1;
                }
                else if(!(game.wasd.right.isDown || gamePad.buttons[15].value == 1) && !(game.wasd.left.isDown || gamePad.buttons[14].value == 1)){
                    this.body.setVelocityX(0);                    
                    this.mv_direction.x = 0;
                }
                // If the user wants to jump - check prev to make sure it is not just being held down       
                if(this.mv_direction.x == 0){
                    this.anims.play('solana-idle', true);//Idle
                }else{
                    this.anims.play('solana-walk', true);
                }


                if ((Phaser.Input.Keyboard.JustDown(game.wasd.jump) || (gamePad.buttons[2].pressed && !this.prevJumpButtonPressed)) && this.jumpReady) {
                    this.jump(this.jump_speed,solana.mv_speed);            
                    //jumpSound.play();

                }

                this.prevJumpButtonPressed = gamePad.buttons[2].pressed;
            }

        }


        this.debug.setPosition(this.x+32, this.y-64);
        this.debug.setText("Ground:"+String(this.onGround)
        +" \Velocity:"+String(this.body.velocity.x)+":"+String(this.body.velocity.y)
        +" \nWall L:"+String(this.body.blocked.left)+" R:"+String(this.body.blocked.right)
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
        if(this.body.blocked.right){
            this.body.setVelocityX(-mvVel);
            this.jumpLock = true;
            this.jumpLockTimer = this.scene.time.addEvent({ delay: 400, callback: this.jumpLockReset, callbackScope: this, loop: false });
        }
        if(this.body.blocked.left){
            this.body.setVelocityX(mvVel);
            this.jumpLock = true;
            this.jumpLockTimer = this.scene.time.addEvent({ delay: 400, callback: this.jumpLockReset, callbackScope: this, loop: false });
        }
        this.body.setVelocityY(-jumpVel);
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

