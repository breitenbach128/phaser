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
        const mainBody = Bodies.rectangle(0, 0, w * 0.2, h*.50, { chamfer: { radius: 2 } });//WAs .65 for H
        this.sensors = {
          top: Bodies.rectangle(0, -h*0.28, w * 0.15, 2, { isSensor: true, friction: 0.0 }), //Was .35 for H
          bottom: Bodies.rectangle(0, h*0.28, w * 0.15, 2, { isSensor: true, friction: 0.0 }),//Was .35 for H
          left: Bodies.rectangle(-w * 0.11, 0, 2, h * 0.45, { isSensor: true, friction: 0.0 }),
          right: Bodies.rectangle(w * 0.11, 0, 2, h * 0.45, { isSensor: true, friction: 0.0 })
        };
        this.sensors.top.label = "SOLANA_TOP";
        this.sensors.bottom.label = "SOLANA_BOTTOM";
        this.sensors.left.label = "SOLANA_LEFT";
        this.sensors.right.label = "SOLANA_RIGHT";
        this.touching = {up:0,down:0,left:0,right:0};
        
        const compoundBody = Body.create({
          parts: [mainBody, this.sensors.top, this.sensors.bottom, this.sensors.left, this.sensors.right],
          frictionStatic: 0.0,
          frictionAir: 0.08,
          friction: 0.35, //0.01
          restitution: 0.0,
          density: 0.01 //0.01
        });
        this.setScale(0.80);
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

        console.log("Solana's mass",this.body.mass); 
        //this.sprite.setIgnoreGravity(true);
        //Custom Properties
        this.hp = 5;
        this.max_hp = 5;
        this.max_mv_speed = {minX: -0.55,maxX: 0.55,minY: -4.9,maxY: 4.9, thrown: 10};
        this.max_mv_speed_baseX = 0.55;
        this.max_mv_speed_baseY = 4.9;
        this.mv_speed = 0.007; //0.00214285
        this.jump_speed = 0.045;//0.01846
        this.mv_direction = {x:0,y:0};
        this.prev_position = {x:0,y:0};
        this.control_lock = false;
        this.mv_Xdiff = 0;
        this.mv_Ydiff = 0;
        this.onGround = false;
        this.onWall = false;
        this.jumpReady = false;
        this.jumpCount = 0;
        this.beingThrown = {ready: false, start:false, forgive: false, vec: {x:0,y:0}, max_speed: 4};
        this.alive = true;
        this.lastEntrance = null;
        this.invuln = false;
        this.inLight = true;
        this.effects = [];
        this.isAnimLocked = false;//Locks out new animations from playing to allow one to finish.
        this.isStunned = false;
        this.isSlowed = false;
        //Create Light Shield
        this.isShielding = false;
        this.LightShieldRadius = 20;
        this.LightShieldCircle = new Phaser.Geom.Circle(this.x, this.y, this.LightShieldRadius);
        this.LightShield = new LightShield(this.scene,this.x+32,this.y,'solana_shield',0);
        this.LightShield.setActive(false);
        this.LightShield.setVisible(false);
        this.lastStickVec = {x:0,y:0};
        //Create Sol Bombs
        this.solbombbag = [];

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
        //Controller
        this.controller;
        this.ctrlDevice;
        this.ctrlDeviceId = -1;

        //Create Particles
        this.effect_dusty=this.scene.add.particles('shapes',  new Function('return ' + this.scene.cache.text.get('effect-dusty'))());        
        //this.effect_dusty.emitters.list[0].startFollow(this,0,0,false);
        //This is not very efficent. I need to disable and only activate it when I need particles.

      }

    update(time,delta)
    {
        if(this.alive){            

            this.applyEffects();
            let mv_speed = this.mv_speed;//This will handle the modifications based on conditions/effects
            //Priority goes top to bottom, least speed to most speed
            if(this.isStunned){
                mv_speed = 0;
            }else if(this.isSlowed){
                mv_speed = 0.00214285;
            }

            //Only control if currently the active control object
            let control_left = this.getControllerAction('left');
            let control_right = this.getControllerAction('right');
            let control_down = this.getControllerAction('down');
            let control_shoot = this.getControllerAction('shoot');
            let control_shootRelease = this.getControllerAction('shootR');         
            let control_passPress = this.getControllerAction('pass');
            let control_passRelease = this.getControllerAction('passR');
            let control_brightFollow = this.getControllerAction('brightFollow');
            let control_bomb = this.getControllerAction('bomb');
            let control_grab = this.getControllerAction('grab');
            //console.log("SOL_R:",control_right,this.getControllerAction('right'),keyPad.checkKeyState('D'));

            if (this.control_lock == false) {
                //Toggle Bright follow in single player mode. In Multiplayer mode, send an alert/highlight position/ping
                if (control_brightFollow && playerMode == 0) {
                    this.scene.brightFollowMode();
                }
                //Detection Code for Jumping

                // if (this.touching.left > 0 && control_left) {
                //     this.onWall = true;
                // } else if (this.touching.right > 0 && control_right) {
                //     this.onWall = true;
                // } else {
                //     this.onWall = false;
                // }
                this.onWall = (this.touching.right || this.touching.left);


                //Ground Check
                if (this.touching.down > 0) {
                    if(this.onGround == false){this.kickDusk(5);};//Ground hit
                    this.onGround = true;
                } else {
                    this.onGround = false;
                }
                //Touching a surface resets jump counter                
                if ((this.onGround || this.onWall) && this.body.velocity.y >= 0) { this.jumpCount = 0 }; //Add velocity check to not reset jump count if going up.

                //Check Jump ready
                if (this.onGround || this.onWall || (soullight.ownerid == 0 && soullight.claimed && this.jumpCount < 2)) {
                    this.jumpReady = true;

                } else {                    
                    //Add Jump Forgiveness of 100ms  
                    if (this.jumpTimerRunning == false) {
                        this.jumpTimer = this.scene.time.addEvent({ delay: 100, callback: this.forgiveJump, callbackScope: this, loop: false });
                        this.jumpTimerRunning = true;
                    }
                }

                //ANIMATION HANDLING
                if (!this.onGround) { 
                    if (!this.isAnimLocked) { this.sprite.anims.play('solana-jump', true); };
                }else if (this.mv_direction.x == 0) {
                    if (!this.isAnimLocked) { this.sprite.anims.play('solana-idle', true); };
                } else {
                    if (!this.isAnimLocked) { this.sprite.anims.play('solana-walk', true); };
                }
                
                //Reset Being Throw status if touching any wall or groupd
                if(this.beingThrown.forgive == false){
                    if(this.touching.left > 0 
                        || this.touching.right > 0 
                        || this.touching.up > 0 
                        || this.touching.down > 0
                        || control_left
                        || control_right){
                        this.disableThrown();
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
                        this.sprite.applyForce({ x: -mv, y: 0 })
                    }
                    else if (control_right && this.jumpLock == false) {

                        this.sprite.flipX = false; // flip the sprite to the left                    
                        this.mv_direction.x = 1;
                        this.sprite.applyForce({ x: mv, y: 0 })
                    }
                    else if (!control_right && !control_left && this.jumpLock == false) {

                        //This is fucking with friction and platform movement.

                        //if(!this.onGround){this.sprite.setVelocityX(0)};  

                        this.mv_direction.x = 0;
                    }
                    //Passing Soulight
                    if(soullight.claimed){
                        if (control_passPress && soullight.ownerid == 0) {    
                            let losRc = Phaser.Physics.Matter.Matter.Query.ray(losBlockers,{x:bright.x,y:bright.y},{x:soullight.x,y:soullight.y}); 
                            if(Phaser.Math.Distance.Between(soullight.x,soullight.y,bright.x,bright.y) > soullight.freePassDistance){                                
                                soullight.aimStart() 
                            }else{
                                if(losRc.length == 0){
                                    soullight.passLight();
                                }else{
                                    soullight.aimStart() 
                                }
                            }                        
                        };
                        if (control_passRelease && soullight.ownerid == 0) { if(soullight.aimer.started){soullight.aimStop();} };
                    }
                    // if (this.jumpLock) {
                    //     //this.sprite.setVelocityX(this.kickOff);
                    //     this.sprite.applyForce({ x: this.kickOff, y: 0 })
                    // }

                    if (control_jump && this.jumpReady) {
                        this.jump(this.jump_speed, mv_speed);

                    }

                    //Replace this with light shield
                    //Check for Shielding 
                    if (control_shoot && !this.isShielding) {
                        this.isShielding = true;                        
                        this.LightShield.setActive(true);
                        this.LightShield.setVisible(true);     
                        this.LightShield.anims.play('light-shield',true);
                        this.LightShield.setCollidesWith([ CATEGORY.BULLET ]);  
                        //Toggles the collides with function to block bullets
                    }else if(control_shootRelease){
                        this.isShielding = false; 
                        this.LightShield.setPosition(this.x,this.y);
                        this.LightShield.setActive(false);
                        this.LightShield.setVisible(false);
                        this.LightShield.setCollidesWith([ 0 ]); 
                    }

                    if(this.isShielding){
                        this.aimShield();
                    }

                    if(control_bomb){
                        this.activateBomb();
                    }
                    if(control_grab){
                        if(soullight.transfer != -1 && soullight.transfer != undefined){
                            if(Phaser.Math.Distance.Between(this.x,this.y,soullight.transfer.x,soullight.transfer.y) < soullight.freePassDistance*2){
                                soullight.transfer.setGrabbed(this);
                            }
                        }
                    }
                }
            }
            
        } // END IF ALIVE
        if(this.beingThrown.ready == true){

            if(this.beingThrown.start){this.getThrown();this.beingThrown.start = false;}            
            if(this.body.velocity.x > this.max_mv_speed.thrown ){this.setVelocityX(this.max_mv_speed.thrown);};
            if(this.body.velocity.x < -this.max_mv_speed.thrown ){this.setVelocityX(-this.max_mv_speed.thrown);};
            if(this.body.velocity.y < -this.max_mv_speed.thrown ){this.setVelocityY(-this.max_mv_speed.thrown);};
            if(this.body.velocity.y > this.max_mv_speed.thrown ){this.setVelocityY(this.max_mv_speed.thrown);};
        }else{
            //Set Max Velocities
            if(this.body.velocity.x > this.max_mv_speed.maxX ){this.setVelocityX(this.max_mv_speed.maxX);};
            if(this.body.velocity.x < this.max_mv_speed.minX ){this.setVelocityX(this.max_mv_speed.minX);};
            //if(this.body.velocity.y < -4.9 ){this.setVelocityY(-5);};
            if(this.body.velocity.y > this.max_mv_speed.maxY ){this.setVelocityY(this.max_mv_speed.maxY+0.1);};//0.1 from Jenkins testing
        }  

        //DO THIS LAST
        this.mv_Xdiff = Math.round(this.x - this.prev_position.x);
        this.mv_Ydiff = Math.round(this.y - this.prev_position.y);
        this.prev_position.x = this.x;
        this.prev_position.y = this.y;

        //this.drawDebugText();
    }
    drawDebugText(){
        this.debug.setPosition(this.sprite.x, this.sprite.y-32);
        this.debug.setText("beingThrown:"+String(this.beingThrown.ready)
        +" \nVelocity:"+this.sprite.body.velocity.x.toFixed(4)+":"+this.sprite.body.velocity.y.toFixed(4));
        // +" \nWall L:"+String(this.touching.left)+" R:"+String(this.touching.right) + " oW:"+String(this.onWall)
        // +" \njr:"+String(this.jumpReady)
        // +" \njlck:"+String(this.jumpLock)
        // +" \nFriction:"+String(this.body.friction));
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
                case 'bomb':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('B') == 1);
                case 'grab':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('X') == 1);
                case 'shoot':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('rightTrigger') > 0);
                case 'shootR':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('rightTrigger') == -1);
                case 'pass':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('leftTrigger') == 1);
                case 'passR':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('leftTrigger') == -1);
                case 'changeplayer':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('Y') == 1);
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
                case 'bomb':
                    return (keyPad.checkKeyState('G') == 1);
                case 'grab':
                    return (keyPad.checkKeyState('T') == 1);
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
    kickDusk(n){
        let bVec = this.getBottomCenter();
        for(let i = 0;i < n;i++){
            this.effect_dusty.emitters.list[0].emitParticle(1,bVec.x+Phaser.Math.Between(-16,16),bVec.y);
        }
    }
    setMaxMoveSpeed(xMin,xMax,yMin,yMax){
        this.max_mv_speed.minX =  -this.max_mv_speed_baseX+xMin;
        this.max_mv_speed.maxX = this.max_mv_speed_baseX+xMax;
        this.max_mv_speed.minY = -this.max_mv_speed_baseY+yMin;
        this.max_mv_speed.maxY = this.max_mv_speed_baseY+yMax;
    }
    jumpLockReset(){
        this.jumpLock = false;
        this.setMaxMoveSpeed(0,0,0,0);
    }
    forgiveJump(){
        this.jumpReady = false;
        this.jumpTimerRunning = false; 
    }
    readyThrown(xVel,yVel,time){
        this.beingThrown.vec.x = xVel;
        this.beingThrown.vec.y = yVel;
        this.beingThrown.ready = true;
        this.beingThrown.start = true;
        this.beingThrown.forgive = true;
        this.throwForgivenessTimer = this.scene.time.addEvent({ delay: time, callback: function(){this.beingThrown.forgive = false;}, callbackScope: this, loop: false });
    }
    disableThrown(){
        this.beingThrown.ready = false;
    }
    getThrown(){  
        //console.log(this.beingThrown.vec)           
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
               
        if(this.touching.left > 0 && !this.onGround){
            this.setMaxMoveSpeed(-6,6,-6,6);
            this.sprite.applyForce({x:mvVel*4,y:-0.003});
            this.jumpLock = true;
            this.kickOff = mvVel;
            this.jumpLockTimer = this.scene.time.addEvent({ delay: 200, callback: this.jumpLockReset, callbackScope: this, loop: false });
        }
        if(this.touching.right > 0 && !this.onGround){            
            this.setMaxMoveSpeed(-6,6,-6,6);
            this.sprite.applyForce({x:-mvVel*4,y:-0.003});
            this.jumpLock = true;
            this.kickOff = -mvVel;
            this.jumpLockTimer = this.scene.time.addEvent({ delay: 200, callback: this.jumpLockReset, callbackScope: this, loop: false });
            
        }
        //Note that onWall requires pushing in the direction of the wall. Touching should just the sensor.   
        if(this.onWall && this.onGround){
            //this.sprite.applyForce({x:0,y:-jumpVel*1.40}); //BUG - THIS IS APPLYING TO PLATFORM SENSOR BARS AS WELL.
            //I could fix by maybe lowing the sensor bar height on the platforms, or by making some custom checks.

            //This was intended to fix being stuck in a corner when you jump, but it may not be needed.
            this.sprite.applyForce({x:0,y:-jumpVel});
        }else{
            this.sprite.applyForce({x:0,y:-jumpVel});
        }
        
        this.soundJump.play("",{volume:.025});
        if(this.jumpCount > 0){
            let jumpBurst = new JumpBurst(this.scene,this.x,this.y);
        }
        this.jumpCount++;
        this.kickDusk(2);
    }
    aimShield(){
        let gameScale = camera_main.zoom;
        let targVector = this.scene.getMouseVectorByCamera(players.SOLANAID);  
        if(this.ctrlDeviceId >= 0){
            let gpVectors = this.scene.getGamepadVectors(this.ctrlDeviceId);
            //let selectStick = gpVectors[1].x == 0 && gpVectors[1].y == 0 ? 0 : 1; // L / R , If right stick is not being used, us left stick.             
            let selectStick = 1;//Only Right Stick Counts
            if(gpVectors[selectStick].x != 0 || gpVectors[selectStick].y != 0){this.lastStickVec = gpVectors[selectStick];};
            targVector = this.scene.getRelativeRadiusVector(this.x,this.y,this.lastStickVec.x,this.lastStickVec.y,this.LightShieldRadius);            
        }
        let aimpoint = this.scene.getCircleAimPoint(this.x,this.y,this.LightShieldCircle,targVector.x,targVector.y)  

        //this.LightShield.setPosition(point.x,point.y); 
        this.LightShield.setAim(aimpoint.p.x,aimpoint.p.y);                         
        this.LightShield.setRotation(aimpoint.normangle);
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
            this.scene.soundTheme.stop();
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
        this.scene.scene.restart();
        hud.setHealth(this.hp);
    }
    receiveDamage(damage) {
                
        if(this.alive && !this.invuln){            
            this.invuln = true;
            this.setTint(0xFF0000);
            //invuln timer
            this.invulnTimer = this.scene.time.addEvent({ delay: 1000, callback: this.disableInvuln, callbackScope: this, loop: false });
            //Kill Blips
            this.scene.events.emit('playerHurt');
            //Remove health
            this.hp -= damage; 
            hud.setHealth(this.hp,0);
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
    receiveHealth(health){
       this.hp+=health;
       if(this.hp > this.max_hp){
           this.hp = 5;
           for(let i=0;i < Phaser.Math.Between(1,3);i++){
                let ls = light_shards.get();
                ls.spawn(this.x,this.y,300,solana);
            }
        };
       hud.setHealth(this.hp,0);
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
    checkBombs(){
        return this.solbombbag.length;
    }
    createBomb(){
        this.solbombbag.push(solbombs.get(this.x,this.y));
    }
    activateBomb(){
        //Uses created bombs to generate a physics object
        if(this.solbombbag.length > 0 ){
            this.solbombbag[0].ready(15000);
            this.solbombbag.splice(0,1);
        }
    }
    enterWater(){
        this.setFrictionAir(0.25);
        this.jump_speed = 0.055;
    }
    exitWater(){
        this.setFrictionAir(0.08);
        this.jump_speed = 0.045;
    }
}


//SOLANA LIGHT SHIELD ENTITY
class LightShield extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y,texture) {
        super(scene.matter.world, x, y, texture, 0)
        this.scene = scene;
        // Create the physics-based sprite that we will move around and animate
        scene.matter.world.add(this);
        // config.scene.sys.displayList.add(this);
        // config.scene.sys.updateList.add(this);
        scene.add.existing(this); // This adds to the two listings of update and display.

        this.setActive(true);


        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        //const mainBody =  Bodies.rectangle(0, 0, w*0.50, h);
        const mainBody =  Bodies.fromVertices(0, 0, 
            [
                {x:w+w*0.20,y:h*0.45},
                {x:w+w*0.65,y:h*0.30},
                {x:w+w*0.75,y:h*0.15},
                {x:w+w*0.75,y:-h*0.15},
                {x:w+w*0.65,y:-h*0.30},
                {x:w+w*0.20,y:-h*0.45}
            ]);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 0.0,
            restitution: 1.0
        });
        compoundBody.render.sprite.xOffset = 0.63;

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SHIELD)
        .setCollidesWith([ 0 ]) // 0 Is nothing, 1 is everything, ~ is the inverse, so everything but the category
        .setPosition(x, y) // Sets inertia to infinity so the player can't rotate        
        .setIgnoreGravity(true);

        this.setAlpha(0.65);

        this.holdConstraint = Phaser.Physics.Matter.Matter.Constraint.create({
            pointA: { x: x, y: y },
            bodyB: this.body,
            angleB: this.rotation,
        });
        this.scene.matter.world.add(this.holdConstraint);  
    }
    update(time, delta)
    {       

    }
    setAim(x,y){
        this.holdConstraint.pointA =  { x: x, y: y };
        this.holdConstraint.angleB =  this.rotation;
    }
};

//Solbomb - Solana's main weapon besides the Soullight. She can generate these from shards she picks up. They allow her to generate temporary light
//as well as give her a weapon against certain enemies.
class SolBomb extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'solbomb', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);


        const { Body, Bodies } = Phaser.Physics.Matter.Matter; 
        const { width: w, height: h } = this;
        const mainBody =  Bodies.circle(0, 0, w*0.50);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.2,
            restitution: 0.1,
            label: "SOLBOMB"
        });

        //this.orbitEllipse = new Phaser.Geom.Ellipse(solana.x, solana.y, solana.width*(0.86), solana.height*(0.25));
        this.orbitEllipse = new Phaser.Curves.Ellipse(solana.x, solana.y, solana.width*(0.45), solana.height*(0.25));
        //let rot = (solbombs.getTotalUsed()) * ((Math.PI*2)/20);
        let rot = 0;
        this.orbitEllipse.setRotation(rot);
        //let point = Phaser.Geom.Ellipse.CircumferencePoint(this.orbitEllipse, 0);
        let point = this.orbitEllipse.getPoint(0);

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.BULLET)
        .setCollidesWith([ 0 ]) // 0 Is nothing, 1 is everything, ~ is the inverse, so everything but the category
        .setPosition(point.x, point.y)
        .setIgnoreGravity(true)
        .setFixedRotation();

        this.setScale(0.75);

        this.orbitpos = 0;
        //this.orbitOS = Phaser.Math.FloatBetween(0,0.15); //Offset
        this.orbitOS = solbombs.getTotalUsed()*0.20; //Offset
        this.setDepth(solana.depth+1);
        //rotate to angle based on existence of others. Use the contructor to do this, or look for group number of active
        this.orbitTween = this.scene.add.tween({
            targets: this,
            ease: 'Linear',
            orbitpos: 1,
            repeat: -1,
            duration: 2500,
            onUpdate: function(tween,targets,bomb){
                bomb.orbitEllipse.x = solana.x;
                bomb.orbitEllipse.y = solana.y;
                let finalPos = wrapAtMax(bomb.orbitpos + bomb.orbitOS,1.0);                
                let orbitPoint = bomb.orbitEllipse.getPoint(finalPos);
                bomb.setPosition(orbitPoint.x,orbitPoint.y);
                if(finalPos < 0.5 && finalPos > 0 && bomb.depth < solana.depth){bomb.setDepth(solana.depth+1)};
                if(finalPos > 0.5 && finalPos < 1 && bomb.depth > solana.depth){bomb.setDepth(solana.depth-1)};
            },
            onUpdateParams:[this]
        });
        this.light_radius = 8;
        this.light_radius_max = 150;
        this.isLit = false;
        this.lifespan = 20000;
        this.isGrabbed  = false;
    }
    update(time, delta)
    {       
        if(this.isLit){
            this.light_radius = this.light_radius_max*(1-this.lifeTimer.getProgress());

            if(this.isGrabbed){
                this.holdConstraint.pointA =  { x: bright.x, y: bright.y };
                //this.holdConstraint.pointB = {x:this.scene.input.activePointer.worldX-this.x,y:this.scene.input.activePointer.worldY - this.y};
                this.holdConstraint.angleB =  this.rotation;
            }
            //Highlight if it can be grabbed by bright
            if(Phaser.Math.Distance.Between(this.x,this.y,bright.x,bright.y) < 32 && soullight.ownerid == 1){
                this.setTint(0xe0dd7b);
            }else{
                if(this.tintTopLeft > 0){
                    this.clearTint();
                }
            }
        }
    }
    ready(lifespan){
        this.isGrabbed  = false;
        this.light_radius = 150;
        this.lifespan = lifespan;
        this.isLit = true;
        this.orbitTween.remove();
        this.setIgnoreGravity(false);
        this.setCollidesWith([CATEGORY.GROUND, CATEGORY.SOLID, CATEGORY.DARK, CATEGORY.ENEMY]);
        this.lifeTimer = this.scene.time.addEvent({ delay: this.lifespan, callback: this.unready, callbackScope: this, loop: false });
        
    }
    unready(){
        let jumpBurst = new JumpBurst(this.scene,this.x,this.y);
        if(this.holdConstraint){this.scene.matter.world.remove(this.holdConstraint);}
        //Detonate
        //Remove
        this.destroy();
    }
    grabbed(){
        if(!this.isGrabbed && this.isLit){
            this.holdConstraint = Phaser.Physics.Matter.Matter.Constraint.create({
                pointA: { x: bright.x, y: bright.y },
                bodyB: this.body,
                //pointB: {x:this.scene.input.activePointer.worldX-this.x,y:this.scene.input.activePointer.worldY - this.y},
                angleB: this.rotation,
                length:48,
                stiffness: 0.4
            });
            this.scene.matter.world.add(this.holdConstraint);   

            this.isGrabbed  = true;
        }
    }
    released(){
        if(this.isGrabbed){
            this.scene.matter.world.remove(this.holdConstraint);
            this.isGrabbed  = false;
        }
    }
    enterWater(){
        this.setFrictionAir(0.25);
    }
    exitWater(){
        this.setFrictionAir(0.02)
    }
}

//Health
class Heart extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'health_blip', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(x,y,w,h);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 0.8,//Was 0.1
            restitution: 0.3,
            label: 'HEART'
        });
 
        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setCollidesWith([ CATEGORY.BRIGHT, CATEGORY.SOLANA, CATEGORY.GROUND, CATEGORY.SOLID])
        .setPosition(x, y+h*0.20) 
        this.isReady = false;

        this.readyTimer = this.scene.time.addEvent({ delay: 1000, callback: function(){this.isReady = true;}, callbackScope: this, loop: false });

        this.scene.matterCollision.addOnCollideActive({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Solana) {
                    gameObjectA.collect(gameObjectB)
                }
            }
        });
    }
    setup(x,y, properties,name){
        this.setActive(true); 
        this.setPosition(x,y);
        this.name = name;
 
    }
    update(time, delta)
    {       


    }
    collect(obj){
        if(this.isReady){
            obj.receiveHealth(1);
            this.destroy();
        }
    }
};
