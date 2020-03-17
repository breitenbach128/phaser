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
          top: Bodies.rectangle(0, -h*0.35, w * 0.15, 2, { isSensor: true }),
          bottom: Bodies.rectangle(0, h*0.35, w * 0.15, 2, { isSensor: true }),
          left: Bodies.rectangle(-w * 0.11, 0, 2, h * 0.45, { isSensor: true }),
          right: Bodies.rectangle(w * 0.11, 0, 2, h * 0.45, { isSensor: true })
        };
        this.sensors.top.label = "SOLANA_TOP";
        this.sensors.bottom.label = "SOLANA_BOTTOM";
        this.sensors.left.label = "SOLANA_LEFT";
        this.sensors.right.label = "SOLANA_RIGHT";
        this.touching = {up:0,down:0,left:0,right:0};

        const compoundBody = Body.create({
          parts: [mainBody, this.sensors.top, this.sensors.bottom, this.sensors.left, this.sensors.right],
          //parts: [mainBody],
          frictionStatic: 0.0,
          frictionAir: 0.005,
          friction: 0.005, //0.01
          restitution: 0.01,
          density: 0.01 //0.01
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
        this.max_mv_speed = 2;
        this.hp = 5;
        this.max_hp = 5;
        this.mv_speed = 1.5; //Was 2
        this.mv_direction = {x:0,y:0};
        this.prev_position = {x:0,y:0};
        this.control_lock = false;
        this.mv_Xdiff = 0;
        this.mv_Ydiff = 0;
        this.jump_speed = 6;
        this.onGround = false;
        this.onWall = false;
        this.jumpReady = false;
        this.jumpCount = 0;
        this.beingThrown = {ready: false, vec: {x:0,y:0}, max_speed: 4};
        this.alive = true;
        this.lastEntrance = null;
        this.invuln = false;
        this.inLight = true;
        this.equipment = [
            {id:0,name:"Wand",lvl:0,equiped:false},
            {id:1,name:"Crown",lvl:0,equiped:false},
            {id:2,name:"Wings",lvl:0,equiped:false},
            {id:3,name:"Belt",lvl:0,equiped:false}
        ];
        this.effects = [];
        this.isAnimLocked = false;//Locks out new animations from playing to allow one to finish.
        this.isStunned = false;
        this.isSlowed = false;
        //Check Global equipment
        for(let e=0;e<solanaEquipment.length;e++){
            if(solanaEquipment[e].equiped){
                this.equipItem(e);
            }
        }

        this.debug = this.scene.add.text(this.x, this.y-16, 'Solana', { resolution: 2,fontSize: '10px', fill: '#00FF00', stroke: '#000000', strokeThickness: 4 }).setOrigin(.5);
        //Sounds
        this.soundJump = game.sound.add('jumpSolana');
        this.soundHurt = game.sound.add('impact_hurt_groan',{volume: 0.04});

        //JumpTimer
        this.jumpTimer = this.scene.time.addEvent({ delay: 10, callback: this.forgiveJump, callbackScope: this, loop: false });
        this.jumpTimerRunning = false;
        this.jumpLock = false;
        this.jumpLockTimer;
        this.kickOff = this.mv_speed;
        this.hjs = 0;//Highest Jump Speed (-)
        //Controller
        this.controller;
        this.ctrlDevice;
        this.ctrlDeviceId = -1;
      }

    update(time,delta)
    {
        if(this.alive){
            this.applyEffects();
            let mv_speed = this.mv_speed;//This will handle the modifications based on conditions/effects
            //Priority goes top to bottom, least speed to most speed
            if(this.isStunned){
                mv_speed = .01;
            }else if(this.isSlowed){
                mv_speed = 1.5;
            }

            //Only control if currently the active control object
            let control_left = this.getControllerAction('left');
            let control_right = this.getControllerAction('right');
            let control_shoot = this.getControllerAction('shoot');
            let control_shootRelease = this.getControllerAction('shootR');         
            let control_passPress = this.getControllerAction('pass');
            let control_passRelease = this.getControllerAction('passR');
            let control_brightFollow = this.getControllerAction('brightFollow');

            if (this.control_lock == false) {
                //Toggle Bright follow in single player mode. In Multiplayer mode, send an alert/highlight position/ping
                if (control_brightFollow && playerMode == 0) {
                    this.scene.brightFollowMode();
                }
                //Detection Code for Jumping

                if (this.touching.left > 0 && control_left) {
                    this.onWall = true;
                } else if (this.touching.right > 0 && control_right) {
                    this.onWall = true;
                } else {
                    this.onWall = false;
                }

                //Ground Check
                if (this.touching.down > 0) {
                    this.onGround = true;
                } else {
                    this.onGround = false;
                }
                //Touching a surface resets jump counter                
                if ((this.onGround || this.onWall) && this.body.velocity.y >= 0) { this.jumpCount = 0 }; //Add velocity check to not reset jump count if going up.

                //Check Jump ready
                if (this.onGround || this.onWall || (soullight.ownerid == 0 && this.jumpCount < 2)) {
                    this.jumpReady = true;
                    

                    if (this.mv_direction.x == 0) {
                        if (!this.isAnimLocked) { this.sprite.anims.play('solana-idle', true); };//Idle
                    } else {
                        if (!this.isAnimLocked) { this.sprite.anims.play('solana-walk', true); };
                    }
                } else {
                    if (!this.isAnimLocked) { this.sprite.anims.play('solana-jump', true); };
                    //Add Jump Forgiveness of 100ms  
                    if (this.jumpTimerRunning == false) {
                        this.jumpTimer = this.scene.time.addEvent({ delay: 100, callback: this.forgiveJump, callbackScope: this, loop: false });
                        this.jumpTimerRunning = true;
                    }

                }



                //Slow Descent if on Wall
                if (this.onWall && !this.onGround) {
                    if (Math.round(this.body.velocity.y) >= 0) { //Upwards
                        this.setVelocityY(0);
                        if (!this.isAnimLocked) { this.sprite.anims.play('solana-wallslide', true); };
                    }
                }

                //Movement Code
                if (curr_player == players.SOLANA || playerMode > 0) {
                    //Reduce Air Control
                    let control_jump = this.getControllerAction('jump');
                    let control_change = this.getControllerAction('changeplayer');
                    //Change Player in Single Mode
                    if (playerMode == 0) {
                        if (control_change) {
                            this.scene.changePlayer();
                        }
                    }
                    let mv = this.onGround ? mv_speed : mv_speed * .75;
                    //Move left/right
                    if (control_left && this.jumpLock == false) {

                        this.sprite.flipX = true; // flip the sprite to the left                    
                        this.mv_direction.x = -1;
                        this.sprite.applyForce({ x: -mv / 700, y: 0 })
                        //this.sprite.setVelocityX(-mv);

                    }
                    else if (control_right && this.jumpLock == false) {

                        this.sprite.flipX = false; // flip the sprite to the left                    
                        this.mv_direction.x = 1;
                        this.sprite.applyForce({ x: mv / 700, y: 0 })
                        //this.sprite.setVelocityX(mv);
                    }
                    else if (!control_right && !control_left && this.jumpLock == false) {

                        //This is fucking with friction and platform movement.

                        //if(!this.onGround){this.sprite.setVelocityX(0)};  

                        this.mv_direction.x = 0;
                    }
                    //Passing Soulight
                    if (soullight.ownerid == 0) {
                        if (control_passPress) { soullight.aimStart() };
                        if (control_passRelease) { soullight.aimStop(); };
                    }
                    if (this.jumpLock) {
                        //this.sprite.setVelocityX(this.kickOff);
                        this.sprite.applyForce({ x: this.kickOff / 500, y: 0 })
                    }

                    if (control_jump && this.jumpReady) {
                        this.jump(this.jump_speed, mv_speed);

                    }

                    //Check for shooting 
                    if (control_shoot && this.equipment[0].equiped) {
                        if (!this.isAnimLocked) { solana.sprite.anims.play('solana-shoot', true); };
                        let costToFireWeapon = 10;//Was 10     
                        let wpRof = 350;


                        if ((time - lastFired) > wpRof && hud.energy.n > costToFireWeapon)//ROF(MS)
                        {

                            let blast = ab_solarblasts.get();
                            let gameScale = camera_main.zoom;
                            let targVector = { x: pointer.worldX, y: pointer.worldY };
                            if (this.ctrlDeviceId >= 0) {
                                //Overwrite target vector with gamePad coords
                                let stickRight = gamePad[this.ctrlDeviceId].getStickRight(.1);
                                let stickLeft = gamePad[this.ctrlDeviceId].getStickLeft(.1);
                                let gpVec = stickRight.x == 0 && stickRight.y == 0 ? stickLeft : stickRight;
                                targVector = { x: this.x + gpVec.x, y: this.y + gpVec.y };
                                //console.log(gpVec,stickLeft,stickRight);
                            }
                            let angle = Phaser.Math.Angle.Between(this.x, this.y, targVector.x, targVector.y);
                            let bulletSpeed = 6;
                            let vecX = Math.cos(angle) * bulletSpeed;
                            let vecY = Math.sin(angle) * bulletSpeed;

                            blast.fire(this.x, this.y, vecX, vecY, 150);


                            lastFired = time;
                            //Remove Energy for the shooting
                            hud.alterEnergy(-costToFireWeapon);
                        }
                    }
                }
            }
        }
        if(this.beingThrown.ready == true){
            this.getThrown();            
            if(this.body.velocity.x > this.beingThrown.max_speed ){this.setVelocityX(this.beingThrown.max_speed);};
            if(this.body.velocity.x < -this.beingThrown.max_speed ){this.setVelocityX(-this.beingThrown.max_speed );};
        }else{
            //Set Max Velocities
            if(this.body.velocity.x > this.max_mv_speed ){this.setVelocityX(this.max_mv_speed );};
            if(this.body.velocity.x < -this.max_mv_speed ){this.setVelocityX(-this.max_mv_speed );};
        }

        let grnd_max_mv_sp = 2;
        
           
        //Gravity caps Y
        // if(this.body.velocity.y > this.max_mv_speed ){this.body.velocity.y = this.max_mv_speed};
        // if(this.body.velocity.y < -this.max_mv_speed ){this.body.velocity.y = -this.max_mv_speed };
           if(this.body.velocity.y > 4.9 ){this.setVelocityY(5);};

        this.debug.setPosition(this.sprite.x, this.sprite.y-32);
        this.debug.setText("jumpCount:"+String(this.jumpCount)
        +" \nVelocity:"+this.sprite.body.velocity.x.toFixed(4)+":"+this.sprite.body.velocity.y.toFixed(4));
        // +" \nWall L:"+String(this.touching.left)+" R:"+String(this.touching.right) + " oW:"+String(this.onWall)
        // +" \njr:"+String(this.jumpReady)
        // +" \njlck:"+String(this.jumpLock)
        // +" \nFriction:"+String(this.body.friction));

        //DO THIS LAST
        this.mv_Xdiff = Math.round(this.x - this.prev_position.x);
        this.mv_Ydiff = Math.round(this.y - this.prev_position.y);
        this.prev_position.x = this.x;
        this.prev_position.y = this.y;

        if(this.body.velocity.y < this.hjs){this.hjs = this.body.velocity.y};

        //This had a lot of bugginess. Not sure why it was suggested. Was too easy to be true.
        //CHange dynamic Body Property based on Y vel "UP"
        // if(this.body.velocity.y < 0 && this.body.collisionFilter.category != CATEGORY.SOLANA_UP){
        //     this.setCollisionCategory(CATEGORY.SOLANA_UP)
        // }else if(this.body.velocity.y >= 0 && this.body.collisionFilter.category != CATEGORY.SOLANA){
        //     this.setCollisionCategory(CATEGORY.SOLANA)
        // }
        
    }
    getControllerAction(action){
        if(this.ctrlDeviceId >=0){
            switch(action){
                case 'up':
                    return (gamePad[this.ctrlDeviceId].getStickLeft(.5).y < 0);
                case 'down':
                    return (gamePad[this.ctrlDeviceId].getStickLeft(.5).y > 0);
                case 'left':
                    return (gamePad[this.ctrlDeviceId].getStickLeft(.5).x < 0);
                case 'right':
                    return (gamePad[this.ctrlDeviceId].getStickLeft(.5).x > 0);
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
                case 'brightFollow':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('leftShoulder') == 1);
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
                case 'brightFollow':
                    return (keyPad.checkKeyState('Z') == 1);
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
    readyThrown(xVel,yVel,time){
        this.beingThrown.vec.x = xVel;
        this.beingThrown.vec.y = yVel;
        this.beingThrown.ready = true;
    }
    getThrown(){        
        this.beingThrown.ready = false;
        this.sprite.applyForce(this.beingThrown.vec);   
    }
    getVelocity(){
        return this.body.velocity;
    }
    jump(jumpVel,mvVel){
        //Reduce Downwards force to zero, if it exists. Keeps platforms from stealing the jump
        if(this.body.velocity.y != 0){ // Was >
            this.setVelocityY(0);
        }
        //Make vertical jump weaker if on wall
        
        if(this.touching.left > 0 && !this.onGround){
            this.sprite.applyForce({x:mvVel/1000,y:-0.003})
            //this.sprite.setVelocityX(mvVel);
            this.jumpLock = true;
            this.kickOff = mvVel;
            this.jumpLockTimer = this.scene.time.addEvent({ delay: 200, callback: this.jumpLockReset, callbackScope: this, loop: false });
            
        }
        if(this.touching.right > 0 && !this.onGround){
            this.sprite.applyForce({x:-mvVel/1000,y:-0.003})
            //this.sprite.setVelocityX(-mvVel);
            this.jumpLock = true;
            this.kickOff = -mvVel;
            this.jumpLockTimer = this.scene.time.addEvent({ delay: 200, callback: this.jumpLockReset, callbackScope: this, loop: false });
            
        }   
        //this.applyForce({x:0,y:-.025});
        if(this.onWall && this.onGround){
            //this.sprite.setVelocityY(-jumpVel*1.40);
            this.sprite.applyForce({x:0,y:-jumpVel/325});
        }else{
            //this.sprite.setVelocityY(-jumpVel);
            this.sprite.applyForce({x:0,y:-jumpVel/325});
        }
        
        this.soundJump.play("",{volume:.025});
        if(this.jumpCount > 0){
            let jumpBurst = new JumpBurst(this.scene,this.x,this.y);
        }
        this.jumpCount++;
    }
    addEffects(effects){
        //Loop through effect array. If found of same type, set new duration.
        //If not found, add into array.
        console.log('Adding Effect ', effects);
        effects.forEach(e=> {
            let newEffect = e;
            let findEffect = this.effects.map(e => e.type).indexOf(newEffect.type);
            if(findEffect == -1){
                this.effects.push(newEffect);
            }else{
                //Set the duration to be re-applied with the current one if it is higher
                if(newEffect.duration > this.effects[findEffect].duration){this.effects[findEffect].duration = newEffect.duration;};
                //If value is higher, apply the higher value
                if(newEffect.value > this.effects[findEffect].value){this.effects[findEffect].value = newEffect.value;};
            }
        });

    }
    applyEffects(){
        //Set Each frame for check. Could work on system with
        //two case statements for one apply and one remove. Might
        //be easier to work with?
        this.isAnimLocked = false;
        this.isStunned = false;
        this.isSlowed = false;

        if(this.effects.length > 0){
            this.effects.forEach(function(e,i){
                //Apply Effect
                switch (e.type) {
                    case 'Stunned':
                        //Apply Stunned
                        this.isStunned = true;
                        break;
                    case 'Slowed':
                        //Apply Slowed
                        this.isSlowed = true;
                        break;
                    case 'DOT':
                        //Apply DOT
                        break;
                    case 'Darkened':
                        //Apply Darkened
                        break;
                    case 'StealLight':
                        //Apply StealLight
                        break;
                    case 'StealDark':
                        //Apply StealDark
                        break;
                    case 'Throw':
                        //Apply Throw
                        break;
                    default:
                        console.log('ERROR:Unknown Effect applied');
                        break;
                }
                //Apply Visual Data
                if(e.visualType == 'Anim'){
                    console.log(e.visualType,e.visualData)
                    this.sprite.anims.play(e.visualData, true);
                    //Set Flag to true
                    this.isAnimLocked = true;
                };
                //Reduce Effect Duration by 1
                e.duration--;
                //If Effect duration is 0, remove the effect.
                if(e.duration <= 0){
                    this.effects.splice(i);
                    //Could Remove effect here? Trigger an onComplete function on this later.
                };
            },this);
        }
    }
    death(animation, frame){
        
        if(animation.key == 'solana-death'){
            this.setActive(false);
            //this.setVisible(false);
            this.debug.setVisible(false);
            
            console.log("Solanas DEAD!")
            //For debugging, reset to last entrance used
            //this.scene.gameOver();

            this.scene.time.addEvent({ delay: 2000, callback: this.resurrect, callbackScope: this, loop: false });
        }
        
    }
    setLastEntrance(entrance){
        this.lastEntrance = entrance;
    }
    resurrect(){
        this.sprite.anims.play('solana-idle', true);
        this.hp = this.max_hp;
        this.setActive(true);
        this.setVisible(true);
        this.debug.setVisible(true);
        this.alive = true; 
        hud.setHealth(this.hp,this.max_hp);
        hud.alterEnergy(300);
        // if(this.lastEntrance != null){
        //     this.sprite.setPosition(this.lastEntrance.x,this.lastEntrance.y+this.lastEntrance.height/2-solana.sprite.height/2);
        //     bright.sprite.setPosition(this.lastEntrance.x,this.lastEntrance.y-32);
        // }
        this.scene.scene.restart();
    }
    equipItem(id){
        this.equipment[id].equiped = true;
        solanaEquipment[id].equiped = true;
    }
    receiveDamage(damage) {
                
        if(this.alive && !this.invuln){
            this.invuln = true;
            this.setTint(0xFF0000);
            //invuln timer
            this.energyTimer = this.scene.time.addEvent({ delay: 300, callback: this.disableInvuln, callbackScope: this, loop: true });
            //Kill Blips
            this.scene.events.emit('playerHurt');
            hud.setHealth(this.hp,this.max_hp);
            //Remove health
            this.hp -= damage; 
            emitter_blood.active = true;
            emitter_blood.explode(24,this.x,this.y);
            // Play Sound
            this.soundHurt.play();
            // if hp drops below 0, die
            if(this.hp <= 0) {
                this.alive = false;                         
                this.sprite.setVelocityX(0);
                this.sprite.on('animationcomplete',this.death,this);            
                this.sprite.anims.play('solana-death', false);              
            }
        }   
    }
    disableInvuln(){
        this.invuln = false;
        this.clearTint();
    }
    setControlLock(){
        this.control_lock = true;
    }
    removeControlLock(){
        this.control_lock = false;
    }
}
