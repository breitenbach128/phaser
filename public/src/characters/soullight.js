class SoulLight extends Phaser.Physics.Matter.Sprite{
    constructor(config,owner) {
        super(config.scene.matter.world, config.x, config.y, config.sprite, config.frame)
        this.scene = config.scene;
        // Create the physics-based sprite that we will move around and animate
        //this.sprite = this.scene.matter.add.sprite(config.x, config.y, config.sprite, config.frame);
        config.scene.matter.world.add(this);
        // config.scene.sys.displayList.add(this);
        // config.scene.sys.updateList.add(this);
        config.scene.add.existing(this); // This adds to the two listings of update and display.

        this.setActive(true);

        this.sprite = this;

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this.sprite;
        const mainBody = Bodies.circle(0,0,w*.20, { isSensor: true });

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1,
            label: "SOULLIGHT"
          });
          this.sprite
            .setExistingBody(compoundBody)
            .setCollidesWith([ CATEGORY.SOLANA, CATEGORY.DARK ])
            .setPosition(config.x, config.y)
            .setIgnoreGravity(true);

        this.sprite.setFriction(0.3,0.3);

        this.setDepth(DEPTH_LAYERS.PLAYERS-1);
        this.owner = owner.sprite;

        this.ownerid = 0;
        this.claimed = false; // No one owns it at the begining of the game. This prevents passing it around.

        this.debug = this.scene.add.text(this.x, this.y-16, 'SoulLight', { resolution:2, fontSize: '10px', fill: '#00FF00' }).setOrigin(0.5);              
        this.passing = false;  
        this.threshhold_distance = 64;  
        this.move_speed = 50;
        this.base_speed = 1;
        this.max_speed = 50;//25 
        this.accel = 1;
        this.projectile_speed = 8;//14
        this.protection_radius = {value:200, max: 200, original: 250};//How much does the light protect;
        this.protection_circle = new Phaser.Geom.Circle(config.x, config.y, 250);
        this.throw = {x:0,y:0};
        this.readyThrow = false;
        this.transfer = -1
        this.aimer = this.scene.add.sprite(this.x,this.y,'soullightblast').setScale(.5).setOrigin(0.5).setDepth(this.depth);
        this.aimer.setVisible(false);
        this.aimer.ready = true;
        this.aimer.started = false;
        this.aimer.chargeTime = 0;
        this.aimerRadius = 32;
        this.aimerLine = this.scene.add.line(0,0,config.x,config.y,config.x,config.y,0xFF0000,0.8).setOrigin(0,0).setDepth(this.depth);
        this.aimerRect = this.scene.add.rectangle(this.x,this.y-32,4,4,0xFF0000,1.0).setDepth(this.depth);
        this.aimerReflectLine = this.scene.add.line(0,0,config.x,config.y,config.x,config.y,0xFF0000,0.8).setOrigin(0,0).setDepth(this.depth);

        this.lastStickVec = {x:0,y:0};
        this.aimerCircle = new Phaser.Geom.Circle(this.x, this.y, this.aimerRadius);
        this.freePassDistance = 64;
        this.isBeaming = false;//If it is beaming, it can will carry Bright with it.
        this.passChain = [];//Soulight pass to each of these entities in order.
        this.passChainIndex = 0;

        //Camera Offset to make aim easier
        this.viewoffset = {x:0,y:0};

        // this.aimLine = this.scene.add.line(200,200,25,0,50,0,0xff66ff)
        // this.aimLine.setLineWidth(4,4);

        this.setVisible(false);//Until the init Soulcrystal is collected, it is not visible.
        
        //Create Soulight Effect
        //This should be inactive until the player retrieves the soulight gem for the first time.
        this.scene.particle_soulight = this.scene.add.particles('shapes',  this.scene.cache.json.get('effect-flame-fall'));   
        this.scene.particle_soulight.setDepth(this.depth-1);
        this.sparkerMgr = this.scene.add.particles('lightburst-1');
        this.sparkler = this.sparkerMgr.createEmitter({
            active:true,
            frequency: 300, 
            x: 0,
            y: 0,
            speed: { min: 35, max: 45 },
            scale: { start: 0.3, end: 0.0 },
            lifespan: 3000,
            blendMode: 'ADD'
        });
        //this.particle_soulight.emitters.list[0].setScale(0.5);
        this.scene.particle_soulight.emitters.list[0].setLifespan(160);
        this.scene.particle_soulight.setActive(false);

        //Was it already claimed?
        if(soullightClaimed){this.claim();};

        //Circle Radius Debug
        this.radDebug = [];
        for(let c=0;c < 24;c++){
            this.radDebug.push(this.scene.add.circle(this.x,this.y,2, 0x00FF00, 1.0));
        }

    }

    update(time,delta)
    {    
        //For Light raycast border
        this.protection_circle.x = this.x;
        this.protection_circle.y = this.y;
        
        //Particle Emit        
        let strTarg = this.ownerid == 0 ? bright : solana;
        this.setProxPartStream(strTarg);
        //this.sparkler.emitParticleAt(this.x,this.y,1);
        //Update transfer
        if(this.transfer != -1){this.transfer.update(time,delta)};

        //DEBUG
        this.debug.setPosition(this.x+32,this.y-64);
        this.debug.setText("tVec2:"+String(this.lastStickVec.x)+":"+String(this.lastStickVec.y));
        let soullight_border_verts = soullight.protection_circle.getPoints(24);
        soullight_border_verts.forEach(function(e,i) {
            soullight.radDebug[i].setPosition(e.x,e.y);
        });
        //Handle position and light growth and shrinking
        if(!this.passing){
            if(this.isBeaming){
                this.owner.setPosition(this.x,this.y);
                if(this.passChainIndex  < this.passChain.length){
                    let pcTarget = this.passChain[this.passChainIndex];
                    this.homeLight(pcTarget);

                    if(this.x == pcTarget.x && this.y == pcTarget.y){
                        
                        this.move_speed = this.max_speed;
                        this.passChainIndex++;
                        this.setVelocity(0,0);
                    }
                }else{
                    this.clearChain();
                }

            }else{
                this.setPosition(this.owner.x,this.owner.y);            
            }
        }else{
            //Home in on target
            let target = this.ownerid == 0 ? bright : solana;
            this.homeLight(target);

        }
        
        if(this.readyThrow){
            if(this.protection_radius.value >  (this.protection_radius.max/10)){
                this.protection_radius.value-=(this.protection_radius.max/10);
            }else{
                //Ready to launch
                this.passLight();
            };
        }else{
            if(this.protection_radius.value <  this.protection_radius.max){this.protection_radius.value+=25;};
        }
        if(this.aimer.started){      
            //Update Aimer
            this.setAimer();
        }
        //Max Velocities
        if(this.body.velocity.x > this.max_speed){this.setVelocityX(this.max_speed)};
        if(this.body.velocity.x < -this.max_speed){this.setVelocityX(-this.max_speed)};
        if(this.body.velocity.y > this.max_speed){this.setVelocityY(this.max_speed)};
        if(this.body.velocity.y < -this.max_speed){this.setVelocityY(-this.max_speed)};
    }
    setProxPartStream(target){
        
        let dist = Phaser.Math.Distance.Between(this.x,this.y,target.x,target.y);
        if(dist < this.freePassDistance && !this.sparkler.on){this.sparkler.start()};
        if(dist > this.freePassDistance && this.sparkler.on){this.sparkler.stop()};
        this.sparkler.setAngle(Phaser.Math.Angle.Between(this.x,this.y,target.x,target.y)*(180/Math.PI));
        this.sparkler.setLifespan((dist/40)*1000);
        this.sparkler.setPosition(this.x,this.y);
    }
    setAimer(){ 

        let gameScale = camera_main.zoom;
        let targVector = this.scene.getMouseVectorByCamera(this.ownerid);

        // //Make visible
        // let pointerDis = Phaser.Math.Distance.Between(pointer.worldX,pointer.worldY,this.x,this.y);
        // if(pointerDis <= 64 && !this.aimer.visible){
        //     this.aimer.setVisible(true);
        // }
        // if(pointerDis > 64 && this.aimer.visible){
        //     this.aimer.setVisible(false);
        // }

        if(this.owner.ctrlDeviceId >= 0){
            let gpVectors = this.scene.getGamepadVectors(this.owner.ctrlDeviceId);
            //let selectStick = gpVectors[1].x == 0 && gpVectors[1].y == 0 ? 0 : 1; // L / R , If right stick is not being used, us left stick.             
            let selectStick = 1;//Only Right Stick Counts
            if(gpVectors[selectStick].x != 0 || gpVectors[selectStick].y != 0){this.lastStickVec = gpVectors[selectStick];};
            targVector = this.scene.getRelativeRadiusVector(this.x,this.y,this.lastStickVec.x,this.lastStickVec.y,this.aimerRadius);       
            
            //raycast line debug - ////////////////////////
            //256 Distance Line
            let ang2 = Phaser.Math.Angle.Between(this.x,this.y,targVector.x,targVector.y);
            let qReturn = {x:this.x,y:this.y};
            let qBody = null
            for(let p=0;p< 256;p++){
                let alpoint = {x:Math.cos(ang2)*p,y:Math.sin(ang2)*p};
                qReturn = {x:this.x+alpoint.x,y:this.y+alpoint.y};
                let pQuery = Phaser.Physics.Matter.Matter.Query.point(losBlockAndReflect,{x:this.x+alpoint.x,y:this.y+alpoint.y});
                if(pQuery.length > 0){   
                    qBody = pQuery[0]                 ;
                    break;
                }
            }  
            this.aimerLine.setTo(this.x,this.y,qReturn.x,qReturn.y);
            this.aimerRect.setPosition(qReturn.x,qReturn.y);
            //Get intersecting line from verticies
            if(qBody){
                let verts = qBody.vertices;
                let tLine = -1;
                for(let v=0;v < verts.length-1;v++){                    
                    tLine = new Phaser.Geom.Line(verts[v].x,verts[v].y,verts[v+1].x,verts[v+1].y)
                    let intchk = Phaser.Geom.Intersects.LineToLine(tLine,this.aimerLine.geom);
                    if(intchk){
                        break;
                    }
                }
                if(tLine != -1){
                    //console.log("intersecting line found:",qBody,verts,tLine);
                    let reflectAng = Phaser.Geom.Line.ReflectAngle(this.aimerLine.geom,tLine);
                    
                    this.aimerReflectLine.setTo(qReturn.x,qReturn.y,qReturn.x+Math.cos(reflectAng)*32,qReturn.y+Math.sin(reflectAng)*32);
                }
            }  
            //END RAYCAST DEBUG          

        }

        let aimpoint = this.scene.getCircleAimPoint(this.x,this.y,this.aimerCircle,targVector.x,targVector.y)   
        let aimerClamp = Phaser.Math.Clamp(this.aimer.chargeTime,0,120);   
        let powerlevel = Math.ceil(aimerClamp / 30);  
        this.aimer.setFrame(powerlevel);
        this.aimer.setPosition(aimpoint.p.x,aimpoint.p.y);
        this.aimer.rotation = aimpoint.normangle;
        this.aimer.chargeTime++;
        //this.viewoffset.x = (aimpoint.p.x - this.y)*2;
        //this.viewoffset.y = (aimpoint.p.y - this.y)*2;

        //this.viewoffset.x = Math.cos(this.aimer.rotation)*aimerClamp;
        //this.viewoffset.y = Math.sin(this.aimer.rotation)*aimerClamp;

    }
    aimStart(){
        if(this.aimer.ready){
            this.aimer.started = true;
            this.aimer.setVisible(true);
            //Reflection Lines and Geoms
            this.aimerReflectLine.setVisible(true);
            this.aimerLine.setVisible(true);
            this.aimerRect.setVisible(true);
        }
    }
    aimStop(){
        //Might need a tween to smooth out the camera transition
        //this.viewoffset.x = 0;
        //this.viewoffset.y = 0;
        this.aimer.setVisible(false);
        //Reflection Lines and Geoms
        this.aimerReflectLine.setVisible(false);
        this.aimerLine.setVisible(false);
        this.aimerRect.setVisible(false);
        if(this.aimer.ready && this.aimer.started){
            this.aimer.ready = false;
            this.aimer.started = false;
            this.shootTransfer(this.aimer.chargeTime);
        }
        this.aimer.chargeTime = 0;
        //This was for the camera "look" with the direction of aim. Did not really feel right, and messed up the camera view by causing thrashing.
        // this.scene.add.tween({
        //     targets: this.aimer,
        //     ease: 'Linear',
        //     chargeTime: 0,
        //     duration: 1000,
        //     onUpdate: function(tween,targets,sl){
        //         let aimerClamp = Phaser.Math.Clamp(sl.aimer.chargeTime,0,120); 
        //         //console.log("Aimer Release chargetime",sl.aimer.chargeTime) 
        //         sl.viewoffset.x = Math.cos(sl.aimer.rotation)*aimerClamp;
        //         sl.viewoffset.y = Math.sin(sl.aimer.rotation)*aimerClamp;
        //     },
        //     onUpdateParams:[this]
        // });
    }
    shootTransfer(plvl){
        let powerlevel = Math.ceil(Phaser.Math.Clamp(plvl,0,120) / 30);
        this.transfer = new SoulTransfer(this.scene,this.x,this.y,'soullightblast',powerlevel,this);
        this.transfer.rotation = this.aimer.rotation;
        this.transfer.fire(this.transfer.rotation,this.projectile_speed*(1+(powerlevel*0.10)));
        this.transfer.setDepth(DEPTH_LAYERS.FRONT);
        //Cost Energy to fire
        this.owner.addEnergy(-powerlevel*50);
    }
    homeLight(target){        
        let angle = Phaser.Math.Angle.Between(this.x,this.y,target.x,target.y);
        let targetDistance = Phaser.Math.Distance.Between(this.x,this.y,target.x,target.y);
        if(targetDistance <= this.move_speed){this.move_speed = targetDistance};
        this.throw.x = Math.cos(angle);
        this.throw.y = Math.sin(angle);  
        this.setVelocity(this.throw.x*this.move_speed,this.throw.y*this.move_speed);
        if(targetDistance < this.width){
            let tId = this.ownerid == 0 ? 1 : 0;
            this.lockLight(target,tId);
        }
    }
    passLight(){
        if(!this.passing){
            this.passing = true;
            //Get owner to set X/Y target
            let target = this.ownerid == 0 ? bright : solana;
            this.homeLight(target);
            //Reset Basic Movement Speed
            this.move_speed = this.max_speed;
        }

    }
    readyPass(){
        this.readyThrow = true;
    }
    readyAimer(){
        this.aimer.ready = true;
    }
    lockLight(target,id){
        if(id != this.ownerid && this.passing){
            this.readyThrow = false;
            this.passing = false;
            this.ownerid = id;
            this.owner = target;
            if(id == 0){
                bright.toDark();
            }else if(id == 1){
                bright.toBright();
            }    
        }    
    }
    addChain(Obj){
        if(this.passChain.includes(Obj) == false){        
            this.passChain.push(Obj);
            //Check first if an object is already in the chain. If so,
            //dont allow the push.      
        }
    }
    startChain(x,y){
        if(this.isBeaming == false){
            //console.log("Start Chain", this.passChain);
            if(this.passChain.length > 0){this.passChain.push({x:x,y:y});} //Last position in chain. Only add if there is alreadya  starting point
            this.isBeaming = true;
            this.passChainIndex = 0;
        }
    }
    clearChain(){
        //Do the beam move and teleport, then clear the chain
        this.isBeaming = false;
        this.passChain = [];
    }
    claim(){
        this.claimed = true;
        soullightClaimed = true; //Global Tracking
        this.scene.particle_soulight.setActive(true);
        this.setVisible(true);
    }

}
//Soul Transfer is the "Bullet" that will hit before the Soulight can transfer.
class SoulTransfer extends Phaser.Physics.Matter.Sprite{
    constructor(scene, x, y, sprite, frame, parent) {
        super(scene.matter.world, x, y, sprite, frame)
        this.setScale(.10);
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody = Bodies.circle(0,0,w*.10, {isSensor:false});

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 0.0,
            restitution: 1,
            label: "SOULTRANSFER"
          });
          this
            .setExistingBody(compoundBody)
            .setPosition(x, y)
            .setIgnoreGravity(true)
            .setCollisionCategory(CATEGORY.BULLET)
            .setCollidesWith([ CATEGORY.GROUND, CATEGORY.SOLID, CATEGORY.ENEMY, CATEGORY.BRIGHT, CATEGORY.SOLANA, CATEGORY.DARK, CATEGORY.MIRROR ]);
          //Custom properties
        this.parent = parent;
        this.deathtimer = this.scene.time.addEvent({ delay: 5000, callback: this.kill, callbackScope: this, loop: false });
        this.alive = true;
        this.isGrabbed = false;
        this.grabbedBy = -1;
        this.inGrabDis = false;
        this.soundfling = game.sound.add('wavingtorch',{volume: 0.04});
        this.soundfling.addMarker({name:'soul-fling',start:.25,duration:.5});        
        this.soundfling.addMarker({name:'soul-burn-impact',start:1,duration:.2});
        this.soundGrabAlert = game.sound.add('coin',{volume: 0.8});
        this.soundGrabbed = game.sound.add('grabbedLight',{volume: 0.3});
        this.powerlevel = frame;

    }
    chain(angle,speed,obj){
        this.fire(angle,speed);
        this.parent.addChain(obj);
    }
    fire(angle,speed){        
        this.setVelocity(Math.cos(angle)*speed,Math.sin(angle)*speed);
        this.setRotation(angle);
        this.soundfling.play('soul-fling');
        //Dont allow it to HIT themselves.
        if(this.parent.ownerid == 0){
            this.setCollidesWith([ CATEGORY.GROUND, CATEGORY.SOLID, CATEGORY.ENEMY, CATEGORY.BRIGHT, CATEGORY.DARK, CATEGORY.MIRROR ]);
        }else{
            this.setCollidesWith([ CATEGORY.GROUND, CATEGORY.SOLID, CATEGORY.ENEMY, CATEGORY.SOLANA, CATEGORY.DARK, CATEGORY.MIRROR ]);
        }
    }
    hit(id){
        //Make sure this is space by moving one h/w radius away at the opposite angle
        let safetyBoundsVec = {x:Math.cos(this.rotation+Math.PI)*(this.parent.width/2),y:Math.sin(this.rotation+Math.PI)*(this.parent.height/2)};
        this.parent.startChain(this.x+safetyBoundsVec.x,this.y+safetyBoundsVec.y);
        //Hit other target, so trigger the launch of the soulight.
        if(this.parent.ownerid != id){
            this.parent.readyPass();
            this.deathtimer = this.scene.time.addEvent({ delay: 0, callback: this.kill, callbackScope: this, loop: false });
        }

    }
    burn(){
        //Make sure this is space by moving one 32 radius away at the opposite angle
        let safetyBoundsVec = {x:Math.cos(this.rotation+Math.PI)*mapTileSize.tw,y:Math.sin(this.rotation+Math.PI)*mapTileSize.tw};
        this.parent.startChain(this.x+safetyBoundsVec.x,this.y+safetyBoundsVec.y);
        this.soundfling.play('soul-burn-impact');
        this.deathtimer = this.scene.time.addEvent({ delay: 100, callback: this.kill, callbackScope: this, loop: false });
        //DO effect
        let burst = light_bursts.get(this.x,this.y);
        burst.burst(this.x,this.y);
        
        //Need to make it inactive here.
        this.setVelocity(0,0);
        this.setPosition(-1000,-1000);
    }    
    setGrabbed(grabber){
        this.setFrictionAir(0.1);
        this.isGrabbed = true;
        this.soundGrabbed.play();
        this.grabbedBy = grabber;
        //this.setCollidesWith([ 0 ]);
        this.deathtimer.pause = true;
        //this.deathtimer = this.scene.time.addEvent({ delay: 1000, callback: function(){this.setCollidesWith([ CATEGORY.DARK, CATEGORY.SOLANA])}, callbackScope: this, loop: false });
        //TO create the effect, I might want to just let it cycle around the play. Turning off collisions with a short timer might do it
    }
    homeBullet(target){        
        let angle = Phaser.Math.Angle.Between(this.x,this.y,target.x,target.y);
        let sp = this.parent.projectile_speed;
        let targetDistance = Phaser.Math.Distance.Between(this.x,this.y,target.x,target.y);
        if(targetDistance <= sp){sp = targetDistance};
        let hX = Math.cos(angle);
        let hY = Math.sin(angle);  

        //this.setVelocity(hX*sp,hY*sp);
        this.applyForce({x:hX*0.001,y:hY*0.001});
        // if(Phaser.Math.Distance.Between(this.x,this.y,target.x,target.y) < this.width){
        //     //Just move onto it. Should speed up the transfer
        //     this.setPosition(target.x,target.y);
        // }
    }
    update(time,delta)
    {
        let checkDis = this.parent.ownerid == 0 ? distanceBetweenObjects(this,bright): distanceBetweenObjects(this,solana);
        if(checkDis < this.parent.freePassDistance*2 && !this.inGrabDis){
            this.soundGrabAlert.play();
            this.inGrabDis = true;
            this.twGrow = this.scene.tweens.add({
                targets: this,
                scale: 0.2,              
                ease: 'Linear',
                yoyo: true,       
                duration: 100,  
                onComplete: function(tween, targets, obj){},
                onCompleteParams: [this],
            }); 
        }
        if(this.isGrabbed){
            this.homeBullet(this.grabbedBy);
        }
    }
    kill(){
        this.parent.readyAimer();
        this.parent.transfer = -1;
        if(this.inGrabDis){this.twGrow.remove();}
        this.destroy();
    }

}

class SoulCrystal extends Phaser.Physics.Matter.Sprite{
    constructor(scene, x, y, texture, animationTexture, frame, sbid) {
        super(scene.matter.world, x, y, texture, frame)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody = Bodies.rectangle(0, 0, w * 0.62, h*0.85, { chamfer: { radius: 10}, isSensor:true});

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 0.0,
            restitution: 0.0,
            label: "SOULCRYSTAL"
          });
        this
        .setExistingBody(compoundBody)
        .setPosition(x, y)
        .setIgnoreGravity(true)
        .setCollisionCategory(CATEGORY.SOLID)
        .setCollidesWith([ CATEGORY.SOLANA]);   

        //Add to game update
        this.scene.events.on("update", this.update, this);
        this.anims.play(animationTexture, false);
        this.sbid = sbid;
        this.animationTexture = animationTexture;
        this.doCollect = false;
    }
    update(time,delta)
    {
        if(this.doCollect){            
            //Create Soulcrystal timeline for animation of collection
            hud.collectSoulCrystal(this.scene,this.x,this.y,2,this.texture.key,this.animationTexture,0,this.sbid)
            //Remove It.
            this.scene.events.off("update", this.update, this);
            this.destroy();
        }
    }
    collect(){
        this.doCollect = true;
    }
}
//Each Bit unlocks an ability for both Solana and Bright
class Solbit{
    constructor(id,n,desc){
        this.id = id;
        this.name = n;
        this.description = desc;
        this.aquired = false;   
    }
    collect(){
        //What do they do when collected?
        if(this.id == 0){
            //Handle the soulight initialization.
            soullight.claim(); 
        }else if(this.id == 2){

        }
        this.aquired = true;

        hud.storySpeech.createSpeech('hud_solana_head','hud_bright_head',false);        
        hud.storySpeech.addToSpeech('center',this.description,3000);
        hud.storySpeech.startSpeech();
    }
}
//Solbits - Global
var solbits = [
    new Solbit(0,'Crystal of Sol','Carries the basic essense of Sol. Press R / (Y) to to pass the Soullight'),
    new Solbit(1,'Crystal of Mass','Carries the basic essense of Mass. Alters mass and momentum.'),
    new Solbit(2,'Crystal of Fusion','Carries the basic essense of Sol'),
    new Solbit(3,'Crystal of Time','Carries the basic essense of Sol'),
    new Solbit(4,'Crystal of Power','Carries the basic essense of Sol'),
    new Solbit(5,'Crystal of Vacuum','Carries the basic essense of Sol')
];
//Solbit Utlity Functions
function checkSolbitOwned(index){
    if(index <= solbits.length && index > -1){
        return solbits[index].aquired;
    }else{
        return false;
    }
}

//6 Crystals: (Bits) : Yellow, Gray, Orange, Blue, Green, Pink
//Bright has a small aura himself.
//Start with no Soulight. Level 1 / Tutorial has lamps already lit.
//Manipulate switches, buttons and jump/move.
// Given Yellow: spawns the soulight. Allows the soulight to be transfered back and forth. Meet Bright nearby. He is in darkmode, but injured. - Crystal of Sol
// He can be "healed" by passing him the soullight.
// Learn that lamps can be lit by the soulight. Pressure plates to trigger gates.

//Orange (Found in Mines) - Slime Monster Boss - Crystal of Mass
// Double Jump / Wall Slide - Dark Surge (Dash forward) / Break - Bright Flare (Sends off a small temporary lamp)

//Blue (Found in Caves) - Corrupted Spider Boss - Crystal of Fusion
// Shield (Protection at cost of power) /Merge  - Bright burst /  Dark Slam (Greatly accelerates downwards and can smash objects he could not before.).

//Green (Found in Forest) - Corrupted Tree Boss - Crystal of Time
// Solana Light Dash  / Bright Beam - Blocks of Light to run on / Dark Warp (Time Slowing Bubble)

//Pink (Found in Mountain) - Corrupted Bear Boss - Crystal of Power
// Soullight Gains radius. Kills return more shards. / Dark can convert dark shards to health for solana.

//Gray (Found in Swamp) - Frog Boss - Crystal of Vacuum 
// Fusion - Solana Teleports instantly to bright, taking soulight / Bright - Phase (Can pass thru certain barriers) / Dark - Singularity (Create a mini black hole. Attracts things, including solana.)




