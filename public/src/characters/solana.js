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
        

        const mainBody = Bodies.rectangle(0, 0, w * 0.2, h*.65, { chamfer: { radius: 5 } });
        this.sensors = {
          bottom: Bodies.rectangle(0, h*0.35, w * 0.15, 2, { isSensor: true }),
          left: Bodies.rectangle(-w * 0.11, 0, 2, h * 0.45, { isSensor: true }),
          right: Bodies.rectangle(w * 0.11, 0, 2, h * 0.45, { isSensor: true })
        };
        this.sensors.bottom.label = "SOLANA_BOTTOM";
        this.sensors.left.label = "SOLANA_LEFT";
        this.sensors.right.label = "SOLANA_RIGHT";
        this.touching = {up:0,down:0,left:0,right:0};

        const compoundBody = Body.create({
          parts: [mainBody, this.sensors.bottom, this.sensors.left, this.sensors.right],
          //parts: [mainBody],
          frictionStatic: 0.1,
          frictionAir: 0.02,
          friction: 0.35,
          restitution: 0.05,
          density: 0.01
        });
       //Fix the draw offsets for the compound sprite.
        compoundBody.render.sprite.xOffset = .51;
        compoundBody.render.sprite.yOffset = .65;
        compoundBody.label = "SOLANA";

        this.sprite
          .setExistingBody(compoundBody)
          .setCollisionCategory(CATEGORY.SOLANA)
          .setScale(1)
          .setFixedRotation() // Sets inertia to infinity so the player can't rotate
          .setPosition(x, y);

        //this.sprite.setIgnoreGravity(true);
        //Custom Properties
        this.hp = 5;
        this.max_hp = 5;
        this.mv_speed = 2;
        this.mv_direction = {x:0,y:0};
        this.prev_position = {x:0,y:0};
        this.mv_Xdiff = 0;
        this.mv_Ydiff = 0;
        this.jump_speed = 6;
        this.onGround = false;
        this.onWall = false;
        this.jumpReady = false;
        this.alive = true;
        this.invuln = false;
        this.inLight = true;
        this.equipment = [
            {id:0,name:"Wand",lvl:0,equiped:false},
            {id:1,name:"Crown",lvl:0,equiped:false},
            {id:2,name:"Wings",lvl:0,equiped:false},
            {id:3,name:"Belt",lvl:0,equiped:false}
        ];

        this.debug = this.scene.add.text(this.x, this.y-16, 'Solana', { resolution: 2,fontSize: '10px', fill: '#00FF00', stroke: '#000000', strokeThickness: 4 }).setOrigin(.5);
        //Sounds
        this.soundJump = game.sound.add('jumpSolana');

        //JumpTimer
        this.jumpTimer = this.scene.time.addEvent({ delay: 10, callback: this.forgiveJump, callbackScope: this, loop: false });
        this.jumpTimerRunning = false;
        this.jumpLock = false;
        this.jumpLockTimer;
        this.kickOff = this.mv_speed;
        //Controller
        this.controller;
        this.ctrlDevice;
        this.ctrlDeviceId = -1;
      }

    update(time,delta)
    {
        if(this.alive){
            //Only control if currently the active control object
            let control_left = this.getControllerAction('left');
            let control_right = this.getControllerAction('right');
            let control_shoot = this.getControllerAction('shoot');
            let control_shootRelease = this.getControllerAction('shootR');         
            let control_passPress = this.getControllerAction('pass');
            let control_passRelease = this.getControllerAction('passR');

            //Detection Code for Jumping

            if(this.touching.left > 0 && control_left){                
                this.onWall = true;
            }else if(this.touching.right > 0 && control_right){
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

                if(this.mv_direction.x == 0){
                    this.sprite.anims.play('solana-idle', true);//Idle
                }else{
                    this.sprite.anims.play('solana-walk', true);
                }
            }else{
                this.sprite.anims.play('solana-jump', true);  
                //Add Jump Forgiveness of 100ms  
                if(this.jumpTimerRunning == false){
                    this.jumpTimer = this.scene.time.addEvent({ delay: 100, callback: this.forgiveJump, callbackScope: this, loop: false });
                    this.jumpTimerRunning = true;         
                }   
                
            }
            


            //Slow Descent if on Wall
            if(this.onWall){
               if(Math.round(this.body.velocity.y) >= 0){ //Upwards
                    this.setVelocityY(0);
                    this.sprite.anims.play('solana-wallslide', true);
               }
            }

            //Movement Code
            if(curr_player==players.SOLANA || playerMode > 0){
                //Reduce Air Control
                let control_jump = this.getControllerAction('jump');
                let control_change = this.getControllerAction('changeplayer');
                //Change Player in Single Mode
                if(playerMode == 0){
                    if(control_change){
                        this.scene.changePlayer();
                    } 
                }
                let mv = this.onGround ? this.mv_speed : this.mv_speed*.75;
                //Move left/right
                if (control_left && this.jumpLock == false) {

                    this.sprite.flipX= true; // flip the sprite to the left                    
                    this.mv_direction.x = -1;                   
                    this.sprite.setVelocityX(-mv);
                    
                }
                else if (control_right && this.jumpLock == false) {

                    this.sprite.flipX= false; // flip the sprite to the left                    
                    this.mv_direction.x = 1;
                    this.sprite.setVelocityX(mv);
                }
                else if(!control_right && !control_left && this.jumpLock == false){

                    //This is fucking with friction and platform movement.

                    if(!this.onGround){this.sprite.setVelocityX(0)};  

                    this.mv_direction.x = 0; 
                }
                //Passing Soulight
                if(soullight.ownerid == 0){
                    if(control_passPress){soullight.aimStart()};
                    if(control_passRelease){soullight.aimStop();};
                }
                if(this.jumpLock){
                    this.sprite.setVelocityX(this.kickOff);
                }    

                if (control_jump && this.jumpReady) {
                    this.jump(this.jump_speed,this.mv_speed);   

                }

                //Check for shooting 
                if(control_shoot && this.equipment[0].equiped){
                    solana.sprite.anims.play('solana-shoot', true);     
                    let costToFireWeapon = -9000;//Was 10     
                    let wpRof = 350;

                    
                    if ((time-lastFired) >  wpRof && hud.energy.n > costToFireWeapon)//ROF(MS)
                    {
                        
                        let blast = ab_solarblasts.get();
                        let gameScale = camera_main.zoom;
                        let targVector = {x:pointer.worldX,y:pointer.worldY};
                        if(this.ctrlDeviceId >=0){
                            //Overwrite target vector with gamePad coords
                            let gpVec = gamePad[this.ctrlDeviceId].getStickRight(0);
                            targVector = {x:this.x+gpVec.x,y:this.y+gpVec.y};
                            console.log(gpVec);
                        }
                        let angle = Phaser.Math.Angle.Between(this.x,this.y, targVector.x,targVector.y);
                        let bulletSpeed = 6;
                        let vecX = Math.cos(angle)*bulletSpeed;
                        let vecY = Math.sin(angle)*bulletSpeed;  
                        
                        blast.fire(this.x,this.y, vecX, vecY, 150);
                        

                        lastFired = time;
                        //Remove Energy for the shooting
                        hud.alterEnergy(-costToFireWeapon);
                    }
                }  
            }

        }


        this.debug.setPosition(this.sprite.x, this.sprite.y-32);
        // this.debug.setText("Ground:"+String(this.touching.down)
        // +" \Velocity:"+String(this.sprite.body.velocity.x)+":"+String(Math.round(this.sprite.body.velocity.y))
        // +" \nWall L:"+String(this.touching.left)+" R:"+String(this.touching.right) + " oW:"+String(this.onWall)
        // +" \njr:"+String(this.jumpReady)
        // +" \njlck:"+String(this.jumpLock)
        // +" \nFriction:"+String(this.body.friction));

        //DO THIS LAST
        this.mv_Xdiff = Math.round(this.x - this.prev_position.x);
        this.mv_Ydiff = Math.round(this.y - this.prev_position.y);
        this.prev_position.x = this.x;
        this.prev_position.y = this.y;
        
    }
    getControllerAction(action){
        if(this.ctrlDeviceId >=0){
            switch(action){
                case 'up':
                    return (gamePad[this.ctrlDeviceId].getStickLeft(.1).y < 0);
                case 'down':
                    return (gamePad[this.ctrlDeviceId].getStickLeft(.1).y > 0);
                case 'left':
                    return (gamePad[this.ctrlDeviceId].getStickLeft(.1).x < 0);
                case 'right':
                    return (gamePad[this.ctrlDeviceId].getStickLeft(.1).x > 0);
                case 'jump':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('A') == 1);
                case 'shoot':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('rightTrigger') > 0);
                case 'shootR':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('rightTrigger') == -1);
                case 'pass':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('Y') == 1);
                case 'passR':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('Y') == -1);
                case 'changeplayer':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('leftTrigger') == 1);
                default:
                    return false;
            }
        }else if(this.ctrlDeviceId == -1){
            switch(action){
                case 'up':
                    return (keyPad.checkKeyState('W') > 0);
                case 'down':
                    return (keyPad.checkKeyState('S') > 0);
                case 'left':
                    return (keyPad.checkKeyState('A') > 0);
                case 'right':
                    return (keyPad.checkKeyState('D') > 0);
                case 'jump':
                    return (keyPad.checkKeyState('SPC') == 1);
                case 'shoot':
                    return (keyPad.checkMouseState('MB0') > 0);
                case 'shootR':
                    return (keyPad.checkMouseState('MB0') == -1);
                case 'pass':
                    return (keyPad.checkKeyState('R') == 1);
                case 'passR':
                    return (keyPad.checkKeyState('R') == -1);
                case 'changeplayer':
                    return (keyPad.checkKeyState('Q') == 1);
                default:
                    return false;
    
                } 
        }else{
            return false
        }
    }
    setController(ctrlId){
        //Sets the controller Source
        this.ctrlDeviceId = ctrlId;
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
    getVelocity(){
        return this.body.velocity;
    }
    jump(jumpVel,mvVel){
        //Make vertical jump weaker if on wall
        
        if(this.touching.left > 0 && !this.onGround){
            this.sprite.setVelocityX(mvVel);
            this.jumpLock = true;
            this.kickOff = mvVel;
            this.jumpLockTimer = this.scene.time.addEvent({ delay: 200, callback: this.jumpLockReset, callbackScope: this, loop: false });
            
        }
        if(this.touching.right > 0 && !this.onGround){
            this.sprite.setVelocityX(-mvVel);
            this.jumpLock = true;
            this.kickOff = -mvVel;
            this.jumpLockTimer = this.scene.time.addEvent({ delay: 200, callback: this.jumpLockReset, callbackScope: this, loop: false });
            
        }   
        //this.applyForce({x:0,y:-.025});
        if(this.onWall && this.onGround){
            this.sprite.setVelocityY(-jumpVel*1.40);
        }else{
            this.sprite.setVelocityY(-jumpVel);
        }
        
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
                
        if(this.alive && !this.invuln){
            this.invuln = true;
            this.setTint(0xFF0000);
            //invuln timer
            this.energyTimer = this.scene.time.addEvent({ delay: 100, callback: this.disableInvuln, callbackScope: this, loop: true });
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
    disableInvuln(){
        this.invuln = false;
        this.clearTint();
    }
}
