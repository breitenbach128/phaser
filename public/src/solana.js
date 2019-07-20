class Solana extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'solana', 0)
        this.scene = scene;       
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);
        this.sprite = this;

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        
        const { width: w, height: h } = this.sprite;
        //const mainBody = Bodies.rectangle(0, 0, w * 0.6, h, { chamfer: { radius: 10 } });
        

        const mainBody = Bodies.rectangle(0, 0, w * 0.6, h-12);
        this.sensors = {
          bottom: Bodies.rectangle(0, h*0.5-6, w * 0.25, 2, { isSensor: true }),
          left: Bodies.rectangle(-w * 0.35, 0, 2, h * 0.5, { isSensor: true }),
          right: Bodies.rectangle(w * 0.35, 0, 2, h * 0.5, { isSensor: true })
        };
        this.sensors.bottom.label = "SOLANA_BOTTOM";
        this.sensors.left.label = "SOLANA_LEFT";
        this.sensors.right.label = "SOLANA_RIGHT";
        this.touching = {up:0,down:0,left:0,right:0};

        const compoundBody = Body.create({
          parts: [mainBody, this.sensors.bottom, this.sensors.left, this.sensors.right],
          //parts: [mainBody],
          frictionStatic: 0,
          frictionAir: 0.02,
          friction: 0.05
        });
       //Fix the draw offsets for the compound sprite.
        compoundBody.render.sprite.xOffset = .5;
        compoundBody.render.sprite.yOffset = .60;
        compoundBody.label = "SOLANA";

        this.sprite
          .setExistingBody(compoundBody)
          .setCollisionCategory(CATEGORY.SOLANA)
          .setScale(1)
          .setFixedRotation() // Sets inertia to infinity so the player can't rotate
          .setPosition(config.x, config.y);

        //this.sprite.setIgnoreGravity(true);
        //Custom Properties
        this.hp = 5;
        this.max_hp = 5;
        this.mv_speed = 6;
        this.mv_direction = {x:0,y:0};
        this.prev_position = {x:0,y:0};
        this.mv_Xdiff = 0;
        this.jump_speed = 6;
        this.prevJumpButtonPressed = false;
        this.onGround = false;
        this.onWall = false;
        this.jumpReady = false;
        this.alive = true;
        this.inLight = true;
        this.equipment = [
            {id:0,name:"Wand",lvl:0,equiped:false},
            {id:1,name:"Crown",lvl:0,equiped:false},
            {id:2,name:"Wings",lvl:0,equiped:false},
            {id:3,name:"Belt",lvl:0,equiped:false}
        ];

        this.debug = this.scene.add.text(this.x, this.y-16, 'Solana', { fontSize: '10px', fill: '#00FF00', stroke: '#000000', strokeThickness: 4 });
        //Sounds
        this.soundJump = game.sound.add('jumpSolana');

        //JumpTimer
        this.jumpTimer = this.scene.time.addEvent({ delay: 100, callback: this.forgiveJump, callbackScope: this, loop: false });
        this.jumpTimerRunning = false;
        this.jumpLock = false;
        this.jumpLockTimer;
        this.kickOff = this.mv_speed;

      }

    update(time,delta)
    {
        if(this.alive){
            //Only control if currently the active control object
            let control_left = (game.wasd.left.isDown || gamePad.buttons[14].value == 1);
            let control_right = (game.wasd.right.isDown || gamePad.buttons[15].value == 1);
            let control_shoot = (game.wasd.shoot.isDown || gamePad.buttons[0].value == 1);
            let control_jump = (Phaser.Input.Keyboard.JustDown(game.wasd.jump) || gamePad.buttons[2].pressed);

            //Detection Code for Jumping

            if((this.touching.left > 0 ||  this.touching.right > 0) && (control_right || control_left)){
                this.onWall = true;
            }else{
                this.onWall = false;
            }

            //Ground Check
            if(this.touching.down > 0){
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
                this.sprite.setVelocityY(0);
            }else{

            }

            //Movement Code
            if(curr_player==players.SOLANA){
                //Reduce Air Control
                let mv = this.onGround ? this.mv_speed : this.mv_speed*.75;
                if (control_left && this.jumpLock == false) {

                    this.sprite.setVelocityX(-mv);
                    this.sprite.flipX= true; // flip the sprite to the left
                    
                    this.mv_direction.x = -1;
                }
                else if (control_right && this.jumpLock == false) {

                    this.sprite.setVelocityX(mv);         
                    this.sprite.flipX= false; // flip the sprite to the right                 
            
                    this.mv_direction.x = 1;
                }
                else if(!control_right && !control_left && this.jumpLock == false){

                    this.sprite.setVelocityX(0);                   
                    this.mv_direction.x = 0; 
                }

                if(this.jumpLock){
                    this.sprite.setVelocityX(this.kickOff);
                }
                       
                if(this.mv_direction.x == 0){
                    this.sprite.anims.play('solana-idle', true);//Idle
                }else{
                    this.sprite.anims.play('solana-walk', true);
                }

                
                if (control_jump && !this.prevJumpButtonPressed && this.jumpReady) {
                    this.jump(this.jump_speed,this.mv_speed);   

                }
                // If the user wants to jump - check prev to make sure it is not just being held down
                this.prevJumpButtonPressed = gamePad.buttons[2].pressed;

                //Check for shooting 
                if(control_shoot && this.equipment[0].equiped){
                    solana.sprite.anims.play('solana-shoot', true);     
                    let costToFireWeapon = 10;      
                    if ((time-lastFired) >  240 && hud.energy.n > costToFireWeapon)//ROF(MS)
                    {
                        let solanaCenter = solana.sprite.getCenter();
                        let blast = ab_solarblasts.get();
                        if(solana.sprite.flipX){
                            blast.fire(solanaCenter.x-18, solanaCenter.y+12, -6, 0, 150);
                        }else{
                            blast.fire(solanaCenter.x+18, solanaCenter.y+12, 6, 0, 150);
                        }

                        lastFired = time;
                        //Remove Energy for the shooting
                        hud.alterEnergy(-costToFireWeapon);
                    }
                }  
            }

        }


        this.debug.setPosition(this.sprite.x+32, this.sprite.y+64);
        this.debug.setText("Ground:"+String(this.touching.down)
        +" \Velocity:"+String(this.sprite.body.velocity.x)+":"+String(Math.round(this.sprite.body.velocity.y))
        +" \nWall L:"+String(this.touching.left)+" R:"+String(this.touching.right)
        +" \njr:"+String(this.jumpReady)
        +" \njlck:"+String(this.jumpLock)
        +" \nInLight:"+String(this.inLight));

        //DO THIS LAST
        this.mv_Xdiff = Math.round(this.x - this.prev_position.x);
        this.prev_position.x = this.x;
        this.prev_position.y = this.y;
        
    }
    jumpLockReset(){
        this.jumpLock = false;
    }
    forgiveJump(){
        this.jumpReady = false;
        this.jumpTimerRunning = false; 
    }
    getThrown(xVel,yVel,time){
        //this.jumpLock = true;
        //this.applyForce({x:0,y:-.025});//forces are VERY SMALL. .001 is a small force. .05 is huge.
        //this.jumpLockTimer = this.scene.time.addEvent({ delay: time, callback: this.jumpLockReset, callbackScope: this, loop: false });
        this.sprite.setVelocityY(yVel*200);        
    }
    jump(jumpVel,mvVel){
        //Make vertical jump weaker if on wall
        
        if(this.touching.left > 0 && !this.onGround){
            this.sprite.setVelocityX(mvVel);
            this.jumpLock = true;
            this.kickOff = mvVel;
            this.jumpLockTimer = this.scene.time.addEvent({ delay: 200, callback: this.jumpLockReset, callbackScope: this, loop: false });
            jumpVel = (jumpVel/2);
        }
        if(this.touching.right > 0 && !this.onGround){
            this.sprite.setVelocityX(-mvVel);
            this.jumpLock = true;
            this.kickOff = -mvVel;
            this.jumpLockTimer = this.scene.time.addEvent({ delay: 200, callback: this.jumpLockReset, callbackScope: this, loop: false });
            jumpVel = (jumpVel/2);
        }   
        //this.applyForce({x:0,y:-.025});
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
    equipItem(id){
        this.equipment[id].equiped = true;
    }
    receiveDamage(damage) {
                
        if(this.alive){
            //Kill Blips
            this.scene.events.emit('playerHurt');
            hud.setHealth(this.hp,this.max_hp);
            //Remove health
            this.hp -= damage; 
            emitter_blood.active = true;
            emitter_blood.explode(24,this.x,this.y);

            // if hp drops below 0, die
            if(this.hp <= 0) {
                this.alive = false;                         
                this.sprite.setVelocityX(0);
                this.sprite.on('animationcomplete',this.death,this);            
                this.sprite.anims.play('solana-death', false);  
                console.log("deadly damage recv. Play death anim")              
            }
        }   
    }
}
