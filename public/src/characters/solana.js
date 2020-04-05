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
        const mainBody = Bodies.rectangle(0, 0, w * 0.2, h*.65, { chamfer: { radius: 5 } });
        this.sensors = {
          top: Bodies.rectangle(0, -h*0.35, w * 0.15, 2, { isSensor: true, friction: 0.0 }),
          bottom: Bodies.rectangle(0, h*0.35, w * 0.15, 2, { isSensor: true, friction: 0.0 }),
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
          //parts: [mainBody],
          //parts: [mainBody],
          frictionStatic: 0.0,
          frictionAir: 0.08,
          friction: 0.35, //0.01
          restitution: 0.0,
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
        this.hp = 5;
        this.max_hp = 5;
        this.max_mv_speed = 0.65;
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
        this.effect_dusty.emitters.list[0].startFollow(this,0,0,false);

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
            //console.log("SOL_R:",control_right,this.getControllerAction('right'),keyPad.checkKeyState('D'));

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
                    if (soullight.ownerid == 0 && soullight.claimed) {
                        if (control_passPress) { soullight.aimStart() };
                        if (control_passRelease) { soullight.aimStop(); };
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
                        let gameScale = camera_main.zoom;
                        let targVector = this.scene.getMouseVectorByCamera(players.SOLANAID);        
                        
                        if(this.ctrlDeviceId >= 0){
                            let gpVectors = this.scene.getGamepadVectors(this.ctrlDeviceId,this.LightShieldRadius,this.x,this.y)
                            let selectStick = gpVectors[1].x == this.x && gpVectors[1].y == this.y ? 0 : 1; // L / R , If right stick is not being used, us left stick.
                            targVector = gpVectors[selectStick];
                        }
                        this.LightShieldCircle.x = this.x;
                        this.LightShieldCircle.y = this.y;  
                
                        let angle = Phaser.Math.Angle.Between(this.x,this.y, targVector.x,targVector.y);
                        let normAngle = Phaser.Math.Angle.Normalize(angle);                
                        let point = Phaser.Geom.Circle.CircumferencePoint(this.LightShieldCircle, normAngle);

                        //this.LightShield.setPosition(point.x,point.y); 
                        this.LightShield.setAim(point.x,point.y);                         
                        this.LightShield.setRotation(normAngle);
                    }
                }
            }
            
        } // END IF ALIVE
        if(this.beingThrown.ready == true){

            if(this.beingThrown.start){this.getThrown();this.beingThrown.start = false;}            
            if(this.body.velocity.x > 10 ){this.setVelocityX(10);};
            if(this.body.velocity.x < -10 ){this.setVelocityX(-10);};
            if(this.body.velocity.y < -10 ){this.setVelocityY(-10);};
            if(this.body.velocity.y > 10 ){this.setVelocityY(10);};
        }else{
            //Set Max Velocities
            if(this.body.velocity.x > this.max_mv_speed ){this.setVelocityX(this.max_mv_speed );};
            if(this.body.velocity.x < -this.max_mv_speed ){this.setVelocityX(-this.max_mv_speed );};
            //if(this.body.velocity.y < -4.9 ){this.setVelocityY(-5);};
            if(this.body.velocity.y > 4.9 ){this.setVelocityY(5);};
        }  

        //DO THIS LAST
        this.mv_Xdiff = Math.round(this.x - this.prev_position.x);
        this.mv_Ydiff = Math.round(this.y - this.prev_position.y);
        this.prev_position.x = this.x;
        this.prev_position.y = this.y;

        this.drawDebugText();
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
    kickDusk(n){
        let bVec = this.getBottomCenter();
        for(let i = 0;i < n;i++){
            this.effect_dusty.emitters.list[0].emitParticle(1,bVec.x+Phaser.Math.Between(-16,16),bVec.y);
        }
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
        this.beingThrown.start = true;
        this.beingThrown.forgive = true;
        this.throwForgivenessTimer = this.scene.time.addEvent({ delay: time, callback: function(){this.beingThrown.forgive = false;}, callbackScope: this, loop: false });
    }
    disableThrown(){
        this.beingThrown.ready = false;
    }
    getThrown(){  
        console.log(this.beingThrown.vec)           
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
        //Make vertical jump weaker if on wall, only 70% as strong
        mvVel = mvVel*.70;

        if(this.touching.left > 0 && !this.onGround){
            this.sprite.applyForce({x:mvVel,y:-0.003});
            this.jumpLock = true;
            this.kickOff = mvVel;
            this.jumpLockTimer = this.scene.time.addEvent({ delay: 200, callback: this.jumpLockReset, callbackScope: this, loop: false });
            
        }
        if(this.touching.right > 0 && !this.onGround){
            this.sprite.applyForce({x:-mvVel,y:-0.003});
            this.jumpLock = true;
            this.kickOff = -mvVel;
            this.jumpLockTimer = this.scene.time.addEvent({ delay: 200, callback: this.jumpLockReset, callbackScope: this, loop: false });
            
        }   
        //this.applyForce({x:0,y:-.025});
        if(this.onWall && this.onGround){
            //this.sprite.setVelocityY(-jumpVel*1.40);
            this.sprite.applyForce({x:0,y:-jumpVel});
        }else{
            //this.sprite.setVelocityY(-jumpVel);
            this.sprite.applyForce({x:0,y:-jumpVel});
        }
        
        this.soundJump.play("",{volume:.025});
        if(this.jumpCount > 0){
            let jumpBurst = new JumpBurst(this.scene,this.x,this.y);
        }
        this.jumpCount++;
        this.kickDusk(2);
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
        hud.setHealth(this.hp,this.max_hp);
        hud.alterEnergySolana(300);
        // if(this.lastEntrance != null){
        //     this.sprite.setPosition(this.lastEntrance.x,this.lastEntrance.y+this.lastEntrance.height/2-solana.sprite.height/2);
        //     bright.sprite.setPosition(this.lastEntrance.x,this.lastEntrance.y-32);
        // }
        this.scene.scene.restart();
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