class Bright extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'bright', 0)
        this.scene = scene;       
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);
        this.sprite = this;
    
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this.sprite;
        const mainBody = Bodies.circle(0,0,w*.1);     

        const compoundBody = Body.create({
          parts: [mainBody],
          frictionStatic: 0.3,
          frictionAir: 0.3,
          friction: 0.9,
          restitution: 0.00,
          density: 0.05,
          label: "BRIGHT"
        });
        this.sprite
        .setExistingBody(compoundBody)          
        .setCollisionCategory(CATEGORY.BRIGHT)
        .setCollidesWith([ ~CATEGORY.SOLANA ])
        .setScale(1.0)
        //.setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setPosition(x, y)
        .setIgnoreGravity(true);
        
        this.setDepth(DEPTH_LAYERS.PLAYERS);
        this.bg = this.scene.add.image(x,y,'bright',0).setVisible(false).setDepth(this.depth-1);
        this.scene.tweens.add({
            targets: this.bg,
            rotation: (Math.PI*2),              
            ease: 'Linear',
            repeat: -1,       
            duration: 4000,
            yoyo: true,  
        });

        //Sensors
        this.sensor = new BrightSensors(scene,x,y);


        console.log("Brights's mass",this.body.mass);
        //Custom properties
        this.light_status = 0;//0 - Bright, 1 - Dark;
        this.hp = 5;
        this.max_hp = 5;
        this.energyChange = 0;
        this.mv_speed = 3;
        this.roll_speed = 0.400;
        this.jump_speed = 0.016;
        this.max_speed = {air:10,ground:10};
        this.alive = true;
        this.invuln = false;
        this.falling = false;
        this.debug = this.scene.add.text(this.x, this.y-16, 'bright', { resolution: 2, fontSize: '10px', fill: '#00FF00' });
        this.touching = {up:0,down:0,left:0,right:0};
        this.onGround = false;
        this.jumpCount = 0;
        this.jumpCountPrev = 0;
        this.airTime = 40;//For Camera Shake
        this.light_radius = 75;
        //Dialogue    
        this.dialogue = new Dialogue(this.scene,[{speaker:this,ttl:0,text:""}],54,-40);  
        //FollowMode Solana
        this.followMode = false;

        //Create Effects
        this.effect=[
            this.scene.add.particles('shapes',  new Function('return ' + this.scene.cache.text.get('effect-bright-pulse1'))())
        ];
        //console.log(this.effect[0].emitters.list[0]);
        this.effect[0].setVisible(false);
        this.effect[0].emitters.list[0].setPosition(this.x,this.y);
        //this.effect[0].emitters.list[0].startFollow(this);

        //ABILITIES
        this.abPulseRadius = 64;
        this.abPulse = {c:0,max:100,doCharge:false,vec:{x:0,y:0},circle:new Phaser.Geom.Circle(x, y, this.abPulseRadius)};//32 Is the circle radius
        this.lastStickVec = {x:0,y:0};
        //Abilities
        this.beamAbility = new BrightBeam(this.scene,this.x,this.y,this.rotation);
        this.beamReady = true;
        this.beamCoolDown = this.scene.time.addEvent({ delay: 1000, callback: this.resetBeam, callbackScope: this, loop: true });

        this.darkdashTimer = this.scene.time.addEvent({ delay: 200, callback: this.resetDarkDask, callbackScope: this, loop: false });
        this.darkdashReady = true;
        this.slamReady = true;

        //Controller
        this.controller;
        this.ctrlDevice;
        this.ctrlDeviceId = -1;

    }

    update()
    {
        this.bg.setPosition(this.x,this.y);
        if(this.alive){
                this.effect[0].emitters.list[0].setPosition(this.x,this.y);
                this.sensor.setPosition(this.x,this.y);
                this.sensor.update();
                if(this.dialogue.isRunning){
                    this.dialogue.update();
                }

                if(this.touching.down > 0){
                    this.onGround = true;
                    this.airTime=0;
                    this.slamReady = true;
                }else{
                    this.onGround = false;
                    this.airTime++;
                }
                
                if(this.abPulse.doCharge){
                    this.pulseUpdate();
                    
                    if(this.abPulse.c < this.abPulse.max){
                    this.abPulse.c++;
                    }
                }


            //Do Dark Updates
            if(this.light_status == 1){
                if(this.touching.down == 0 && this.airTime > 40){
                    //Falling, so change animation
                    this.sprite.anims.play('dark-falling', false);
                    this.falling = true;
                }else{
                    //On ground now.
                    this.sprite.anims.play('dark-idle', false);
                    if(this.falling){
                        //If I was falling, shake the camera.
                        camera_main.shake(80,.005);
                        this.falling = false;
                        
                    }
                }
            }
            //Movement Code
            //Control Based on Light or Dark Modes
            let darkMode = 1;
            let brightMode = 0;
            //Drain Energy since not bright
            if(this.light_status == darkMode){
                this.addEnergy(-1);
                if(hud.brightStatBar.getValue() <= 0){this.receiveDamage(1);};
            };
            //This creates a wobble of contention for add and remove values on different update loops.
            //I should calc all the values and then apply the final result one time.

            if(curr_player==players.BRIGHT || playerMode > 0){
                //Only control if currently the active control object
                let control_left = this.getControllerAction('left');
                let control_right = this.getControllerAction('right');
                let control_up = this.getControllerAction('up');
                let control_down = this.getControllerAction('down');
                let control_jump = this.getControllerAction('jump');
                let control_beam = this.getControllerAction('beam');
                let control_passPress = this.getControllerAction('pass');
                let control_passRelease = this.getControllerAction('passR');
                let control_pulsePress = this.getControllerAction('pulse');
                let control_pulseRelease = this.getControllerAction('pulseR');
                let control_change = this.getControllerAction('changeplayer');
                let control_dash = this.getControllerAction('dash');  
                let control_jumphold = this.getControllerAction('jumphold');
                
                //Change Player in Single Mode
                if(playerMode == 0){
                    if(control_change){
                        this.scene.changePlayer();
                    } 
                }
                if(this.light_status == brightMode){
                    this.angle = 0;
                    //BRIGHT CONTROLS 
                    if(control_beam && this.beamReady ){
                        this.beamReady = false;
                        soullight.setAimer();
                        this.beamAbility.create(soullight.aimer.x,soullight.aimer.y,soullight.aimer.rotation);
                    }                    
                    if(control_left){
                        this.sprite.setVelocityX(-this.mv_speed);
                        this.flipX= true; // flip the sprite to the left
                    }
                    if(control_right){
                        this.sprite.setVelocityX(this.mv_speed);
                        this.flipX= false; // flip the sprite to the right
                    }
                    if (control_up) {
                        this.sprite.setVelocityY(-this.mv_speed);
                    }
                    if (control_down) {
                        this.sprite.setVelocityY(this.mv_speed);
                    }
                    if(!control_left && !control_right && !control_up && !control_down){
                        //this.sprite.anims.play('bright-idle', true);//Idle
                    }
                    //Handle Animations
                    if(this.abPulse.doCharge){
                        this.sprite.anims.play('bright-pulse', false);
                    }else{
                        this.sprite.anims.play('bright-idle', true);
                    }

                    //Passing Soulight
                    if (control_passPress && soullight.ownerid == 1) {        
                        let losRc = Phaser.Physics.Matter.Matter.Query.ray(losBlockers,{x:solana.x,y:solana.y},{x:soullight.x,y:soullight.y});                  
                        if(Phaser.Math.Distance.Between(soullight.x,soullight.y,solana.x,solana.y) > soullight.freePassDistance){                                
                            soullight.aimStart() 
                        }else{
                            if(losRc.length == 0){
                                soullight.passLight();
                            }else{
                                soullight.aimStart() 
                            }
                        }                        
                    };
                    if (control_passRelease && soullight.ownerid == 1) { if(soullight.aimer.started){soullight.aimStop();} };

                    //Throw Pulse. Can only do it if you have the soulight
                    if(control_pulsePress && soullight.ownerid == 1){
                        //This needs a solid visual indicator that they players can perform this merge
                        if(Phaser.Math.Distance.Between(this.x,this.y,solana.x,solana.y) < 64){
                            bright.pulseCharge(solana);
                        }
                        //Crates
                        let c = crates.getChildren();
                        c.forEach(e=>{    
                            if(Phaser.Math.Distance.Between(this.x,this.y,e.x,e.y) < 32){            
                                e.grabbed();                
                            }
                        });
                        //Solbombs
                        let s = solbombs.getChildren();
                        s.forEach(e=>{    
                            if(Phaser.Math.Distance.Between(this.x,this.y,e.x,e.y) < 32){            
                                e.grabbed();                
                            }
                        });
                    }
                    if(control_pulseRelease){
                        if(this.abPulse.doCharge){
                            bright.pulseThrow(solana);//Add stick vector to throw, to get direction
                        }
                        //Crates
                        let c = crates.getChildren();
                        c.forEach(e=>{                
                            e.released();                
                        });
                        //Solbombs
                        let s = solbombs.getChildren();
                        s.forEach(e=>{                
                            e.released();                
                        });
                    }

                }else{
                    //DARK CONTROLS
                    if (control_left) {          
                        this.sprite.setAngularVelocity(-this.roll_speed);           
                        this.sprite.anims.play('dark-idle', true);
                        if(!this.onGround &&  this.touching.left == 0){
                            if(this.body.velocity.x > -4){
                                let airVelX = 0.0010;
                                if(this.body.velocity.x > 0){
                                    airVelX = 0.0020;
                                }
                                this.sprite.applyForce({x:-airVelX,y:0}) 
                            }
                        }
                    }
                    if (control_right) {     
                        this.sprite.setAngularVelocity(this.roll_speed); 
                        this.sprite.anims.play('dark-idle', true);
                        if(!this.onGround && this.touching.right == 0){
                            if(this.body.velocity.x < 4){                                
                                let airVelX = 0.0010;
                                if(this.body.velocity.x < 0){
                                    airVelX = 0.0020;
                                }
                                this.sprite.applyForce({x:airVelX,y:0}) 
                            }
                        }  
                    }
                    if(!control_left && !control_right){
                        this.sprite.anims.play('dark-idle', true);//Idle
                    }

                    if(control_dash && this.darkdashReady){
                        //Is the ability unlocked?
                        if(checkSolbitOwned(1)){
                            this.darkdashTimer = this.scene.time.addEvent({ delay: 500, callback: this.resetDarkDask, callbackScope: this, loop: false });
                            this.darkdashReady = false;
                            if(control_right){this.sprite.applyForce({x:0.020,y:0})};
                            if(control_left){this.sprite.applyForce({x:-0.020,y:0})};
                        }

                    }
                    //Dark Stop
                    if (control_down && this.airTime == 0) {
                        let angVel = this.body.angularVelocity;
                        // if(angVel > 0){this.setAngularVelocity(angVel-.05)};
                        // if(angVel < 0){this.setAngularVelocity(angVel+.05)};
                        // if(angVel < .10 && angVel > -.10){this.setAngularVelocity(0)};
                        this.setAngularVelocity(0);
                        let bVelX = this.body.velocity.x;
                        if(bVelX > 0){this.setVelocityX(bVelX-.10)};
                        if(bVelX < 0){this.setVelocityX(bVelX+.10)};
                        if(bVelX < .10 && bVelX > -.10){this.setVelocityX(0)};
                        
                        //Kick up dust
                        if(this.body.velocity.x > 1 || this.body.velocity.x < -1){
                            let pQ = Math.round(Math.abs(this.body.velocity.x));
                            emitter_dirt_spray.active = true;
                            emitter_dirt_spray.explode(5,this.x,this.y);
                        }
                    //Dark Slam
                    }else if(control_down && this.airTime > 30 && control_dash && this.slamReady){
                        this.slamReady = false;
                        this.sprite.applyForce({x:0,y:0.020});

                        //For crushing stuff. If his velocity his above X, and his sensor bars touch a breakable tile, then 
                        // use that force calculation for breaking them BEFORE his matter body collides. Should allow
                        // him to break thru multiple objects cleanly.
                    }
                    //Dark Jump
                    if(control_jump && this.onGround){
                        this.sprite.applyForce({x:0,y:-this.jump_speed});
                    }
                    if(control_jumphold && this.body.velocity.y < 0){
                        this.applyForce({x:0,y:-this.jump_speed*0.025});
                    }
                    //Singularity
                    if(control_pulsePress){
                        let solAngle = Phaser.Math.Angle.Between(this.x,this.y,solana.x,solana.y);
                        let solForce = 0.02;
                        let solPullVec = {x:-Math.cos(solAngle)*solForce,y:-Math.sin(solAngle)*solForce};
                        solana.applyForce(solPullVec);
                    }

                    //Fake Angular Velocity friction
                    let angVelCk = this.body.angularVelocity;
                    if(angVelCk > 0){this.body.angularVelocity-=0.05;};
                    if(angVelCk < 0){this.body.angularVelocity+=0.05;};
                    if(angVelCk < .10 && angVelCk > -.10){this.body.angularVelocity = 0};
                }

               
                //Max Velocities
                if(this.airTime > 0){        
                    if(this.body.velocity.x > this.max_speed.air ){this.setVelocityX(this.max_speed.air);};
                    if(this.body.velocity.x < -this.max_speed.air ){this.setVelocityX(-this.max_speed.air );};
                    if(this.body.velocity.y > this.max_speed.air ){this.setVelocityY(this.max_speed.air);};
                    if(this.body.velocity.y < -this.max_speed.air ){this.setVelocityY(-this.max_speed.air );};
                }else{
                    //Set Max Velocities
                    if(this.body.velocity.x > this.max_speed.ground ){this.setVelocityX(this.max_speed.ground );};
                    if(this.body.velocity.x < -this.max_speed.ground ){this.setVelocityX(-this.max_speed.ground);};
                    if(this.body.velocity.y > this.max_speed.ground ){this.setVelocityY(this.max_speed.ground);};
                    if(this.body.velocity.y < -this.max_speed.ground ){this.setVelocityY(-this.max_speed.ground );};
                }

                // this.debug.setPosition(this.sprite.x, this.sprite.y-64);
                // this.debug.setText("JumpCount:"+String(this.jumpCount)+":"+String(this.touching.down));
            }else if(curr_player==players.SOLANA && playerMode == 0){
                //Allow Single Player Follow Mode
                if(this.followMode){
                    if(this.light_status == brightMode){
                        if(this.x < solana.x - 16){
                            this.sprite.setVelocityX(this.mv_speed + 3);
                        }else if(this.x > solana.x + 32){
                            this.sprite.setVelocityX(-this.mv_speed - 3);
                        }
                        if(this.y < solana.y - 32){
                            this.sprite.setVelocityY(this.mv_speed + 3);
                        }else if(this.y > solana.y){
                            this.sprite.setVelocityY(-this.mv_speed - 3);
                        }
                    }
                }
            }
            this.resetEnergy();
        }
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
                case 'jumphold':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('A') > 1);
                case 'beam':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('X') == 1);
                case 'pass':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('leftTrigger') == 1);
                case 'passR':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('leftTrigger') == -1);
                case 'pulse':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('rightTrigger') == 1);
                case 'pulseR':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('rightTrigger') == -1);
                case 'changeplayer':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('Y') == 1);
                case 'dash':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('B') == 1);
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
                case 'jumphold':
                    return (keyPad.checkKeyState('SPC') > 1);
                case 'beam':
                    return (keyPad.checkMouseState('MB0') > 0);
                case 'grab':
                    return (keyPad.checkKeyState('T') == 1);
                case 'pass':
                    return (keyPad.checkKeyState('R') == 1);
                case 'passR':
                    return (keyPad.checkKeyState('R') == -1);
                case 'pulse':
                    return (keyPad.checkKeyState('F') == 1);
                case 'pulseR':
                    return (keyPad.checkKeyState('F') == -1);
                case 'changeplayer':
                    return (keyPad.checkKeyState('Q') == 1);
                case 'dash':
                    return (keyPad.checkMouseState('MB1') > 0);
                default:
                    return false;
    
                } 
        }else{
            return false
        }
    }
    setController(ctrlId,ctrl){
        //Sets the controller Source
        this.ctrlDevice = ctrl;
        this.ctrlDeviceId = ctrlId;
    }
    resetBeam(){
        this.beamReady = true; 
    }
    resetDarkDask(){
        this.darkdashReady = true;
    }
    toDark(){
        this.light_status = 1;
        this.setFrictionAir(0.01);
        this.sprite.setTexture('dark');
        this.sprite.anims.play('dark-idle', false);
        this.sprite.setIgnoreGravity(false);
        this.sprite.setCollisionCategory(CATEGORY.DARK);
        this.sensor.setCollisionCategory(CATEGORY.DARK);
        this.sprite.setDensity(0.01);//0.01
        this.bg.setVisible(false);
    }
    toBright(){
        this.light_status = 0;
        this.setFrictionAir(0.30);
        this.sprite.setTexture('bright');
        this.sprite.anims.play('bright-idle', false);
        this.sprite.setIgnoreGravity(true);
        this.sprite.setCollisionCategory(CATEGORY.BRIGHT);
        this.sensor.setCollisionCategory(CATEGORY.BRIGHT);
        this.sprite.setDensity(0.01);
        this.bg.setVisible(true);
        //Tween back to straight up
        this.reAlignBright();
    }
    reAlignBright(){
        this.scene.tweens.add({
            targets: this,
            angle: 0,
            ease: 'Power1',
            duration: 1000,
            onComplete: this.reAlignComplete,
            onCompleteParams: [ this ]
        });
    }
    reAlignComplete(){

    }
    getVelocity(){
        return this.body.velocity;
    }
    setLastEntrance(entrance){
        this.lastEntrance = entrance;
    }
    death(animation, frame){
        
        if(animation.key == 'bright-death'){
            entrances.getChildren().forEach(e=>{
                if(e.name == current_exit.bright){
                    bright.setPosition(e.x,e.y);
                }
            });
            this.hp = 5;
            hud.setHealth(this.hp,1);
            this.alive = true; 
            this.addEnergy(5000);
            if(soullight.ownerid == 1){
                soullight.passLight();
            }

            //If Bright has soullight, it gets tossed to Solana, he goes dark and reappears at entrance.
        }
    }
    receiveDamage(damage) {
        if(this.alive && !this.invuln){            
            this.invuln = true;
            this.setTint(0xFF0000);
            //invuln timer
            this.invulnTimer = this.scene.time.addEvent({ delay: 1000, callback: function(){bright.invuln=false;bright.clearTint()}, callbackScope: this, loop: false });
            this.hp -= damage;           
            hud.setHealth(this.hp,1);
            // if hp drops below 0 we deactivate this enemy
            if(this.hp <= 0 && !this.dead ) {
                this.alive = false; 
                        
                this.sprite.on('animationcomplete',this.death,this);            
                this.sprite.anims.play('bright-death', false);
                
            }
        }
    }
    receiveHealth(health){
        this.hp+=health;
        if(this.hp > this.max_hp){
            this.hp = 5;
         };         
        hud.setHealth(this.hp,1);
    }
    addEnergy(e){
        this.energyChange+=e;
    }
    resetEnergy(){
        hud.alterEnergyBright(this.energyChange);
        this.energyChange = 0;
    }
    pulseCharge(object){
        //Move Solana Off Screen
        object.setControlLock();
        object.setActive(false);
        object.setVisible(false);

        this.abPulse.doCharge = true;
        //As It charges, the max particles and size should increase, making it glow more.
        //this.effect[0].setVisible(true);
        camera_main.flash(500,255,255,255);
        this.bg.setDepth(this.depth-1);
    }
    pulseUpdate(){
        //Update Solana "Hold"
        solana.x = this.x;
        solana.y = this.y;
        //Update Vectors
        let targVector = this.scene.getMouseVectorByCamera(players.BRIGHTID);
        if(this.ctrlDeviceId >= 0){
            let gpVectors = this.scene.getGamepadVectors(this.ctrlDeviceId);
            //let selectStick = gpVectors[1].x == 0 && gpVectors[1].y == 0 ? 0 : 1; // L / R , If right stick is not being used, us left stick.             
            let selectStick = 1;//Only Right Stick Counts
            if(gpVectors[selectStick].x != 0 || gpVectors[selectStick].y != 0){this.lastStickVec = gpVectors[selectStick];};
            targVector = this.scene.getRelativeRadiusVector(this.x,this.y,this.lastStickVec.x,this.lastStickVec.y,this.abPulseRadius);            
        }
        let aimpoint = this.scene.getCircleAimPoint(this.x,this.y,this.abPulse.circle,targVector.x,targVector.y)    
        //Emit Particles to mark target//Need Different particle style here, THIS IS MASSIVE AND TAKES UP WAAAY too much space.
        
        //this.effect[0].emitParticleAt(aimpoint.p.x,aimpoint.p.y,5);

        //Throw Power
        let power =  this.abPulse.c/1000;
        this.abPulse.vec = {x:Math.cos(aimpoint.angle)*(power+power*0.5),y:Math.sin(aimpoint.angle)*power};//50% more power to X velocity
    }
    pulseThrow(object){
        object.removeControlLock();
        object.setActive(true);
        object.setVisible(true);


        this.abPulse.doCharge = false;
        this.effect[0].setVisible(false);
        object.readyThrown(this.abPulse.vec.x,this.abPulse.vec.y,30); 
        
        this.abPulse.c = 0;
    }
    enterWater(){
        this.setFrictionAir(0.25);
        this.jump_speed = 0.055;
        if(this.light_status == 0){
            soullight.passLight();
            this.toDark();
        }
        console.log("Bright Entered water.",this.light_status,this.jump_speed);
    }
    exitWater(){
        this.jump_speed = 0.020;
        if(this.light_status == 0){
            this.setFrictionAir(0.30);
        }else{
            this.setFrictionAir(0.01);
        }
        console.log("Bright Exited water.",this.light_status,this.jump_speed);
    }
}

class BrightSensors extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'bright', 0)
        this.scene = scene;       
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);
        this.sprite = this;
    
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this.sprite;
        const mainBody = Bodies.circle(0,0,w*.1, {isSensor: true});

        this.sensors = {
          bottom: Bodies.rectangle(0, h * 0.12, w * 0.16, 2, { isSensor: true }),
          top: Bodies.rectangle(0, -h * 0.12, w * 0.16, 2, { isSensor: true }),
          left: Bodies.rectangle(-w * 0.12, 0, 2, h * 0.16, { isSensor: true }),
          right: Bodies.rectangle(w * 0.12, 0, 2, h * 0.16, { isSensor: true })
        };
        this.sensors.bottom.label = "BRIGHT_BOTTOM";
        this.sensors.top.label = "BRIGHT_TOP";
        this.sensors.left.label = "BRIGHT_LEFT";
        this.sensors.right.label = "BRIGHT_RIGHT";

        const compoundBody = Body.create({
          parts: [mainBody, this.sensors.top, this.sensors.bottom, this.sensors.left, this.sensors.right],
          frictionStatic: 0.3,
          frictionAir: 0.3,
          friction: 0.3,
          restitution: 0.00,
          density: .05,
          label: "BRIGHTSENSORS"
        });
        this.sprite
        .setExistingBody(compoundBody)          
        .setCollisionCategory(CATEGORY.DARK)
        .setCollidesWith([ CATEGORY.GROUND,CATEGORY.SOLID, CATEGORY.BARRIER, CATEGORY.VEHICLE, CATEGORY.ENEMY ])
        .setFixedRotation() 
        .setPosition(x, y)
        .setIgnoreGravity(true)
        .setVisible(false);

        this.touching = {up:0,down:0,left:0,right:0};
      
    }
    update(time, delta)
    {       

    }
};