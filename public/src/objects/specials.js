//Setup a special construct for barriers. 
//Barriers block some items, but allow others.
//Barriers can be set toa one way movement, or two way movement.

class Barrier extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y,texture) {
        super(scene.matter.world, x, y, texture, 0)
        this.scene = scene;
        // Create the physics-based sprite that we will move around and animate
        scene.matter.world.add(this);
        // config.scene.sys.displayList.add(this);
        // config.scene.sys.updateList.add(this);
        scene.add.existing(this); // This adds to the two listings of update and display.

        this.setActive(true);

        this.sprite = this;

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this.sprite;
        const mainBody =  Bodies.rectangle(0, 0, w, h);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1
        });

        this.sprite
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.BARRIER)
        .setCollidesWith([ ~CATEGORY.BULLET ]) // 0 Is nothing, 1 is everything, ~ is the inverse, so everything but the category
        .setPosition(x, y)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setStatic(true)
        .setIgnoreGravity(true);    

        this.debug = scene.add.text(this.x, this.y-16, 'Zone', { fontSize: '10px', fill: '#00FF00' });   
        
        //Make an animation effect that teleports bright to the other side of the barrier as he passes through.


    }
    setBarrierType(){
        //Setup the barrier based on type.
        //This will determine what it collides with, and how it interacts with the players
    }
    setup(x,y,angle){
        this.setActive(true);
        this.setPosition(x,y); 
        this.angle = angle;
    }
    update(time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Zone Status:"+String(this.name));
    }
};

class Crate extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'crate', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);

        //Scale crate down
        let newScale = 0.08;
        this.setScale((newScale+0.04));

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(0, 0, w*newScale, h*newScale);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1,
            label: "CRATE"
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setPosition(x, y) 

        this.isGrabbed  = false;
    }
    setup(x,y){
        this.setActive(true);
        this.setPosition(x,y); 
    }
    update(time, delta)
    {       
        if(this.isGrabbed){
            this.holdConstraint.pointA =  { x: bright.x, y: bright.y };
            //this.holdConstraint.pointB = {x:this.scene.input.activePointer.worldX-this.x,y:this.scene.input.activePointer.worldY - this.y};
            this.holdConstraint.angleB =  this.rotation;
        }
        //Highlight if it can be grabbed by bright
        if(Phaser.Math.Distance.Between(this.x,this.y,bright.x,bright.y) < 32 && soullight.ownerid == 1){
            this.setTint(0x00FF00);
        }else{
            if(this.tintTopLeft > 0){
                this.clearTint();
            }
        }
    }
    grabbed(){
        if(!this.isGrabbed){
            this.holdConstraint = Phaser.Physics.Matter.Matter.Constraint.create({
                pointA: { x: bright.x, y: bright.y },
                bodyB: this.body,
                //pointB: {x:this.scene.input.activePointer.worldX-this.x,y:this.scene.input.activePointer.worldY - this.y},
                angleB: this.rotation,
                length:32,
                stiffness: 0.8
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
};

class Rock extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'rocks', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.circle(0,0,w*.50);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0.1,
            frictionAir: 0.05,
            friction: 0.3,
            label: "ROCK"
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setPosition(x, y) 

        //Setup Collision
        this.scene.matterCollision.addOnCollideStart({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Bright) {
                    this.impact(gameObjectB);
                }
            }
        });
        this.max_speed = 8;
        this.sound_gotCrushed = game.sound.add('hitting_wall',{volume: 0.04});
    }
    setup(x,y,scale){
        this.setActive(true);
        this.setPosition(x,y); 
        this.setScale(scale);
        //Crush Timer
        this.readyCrush = false;
        this.crushTimer = this.scene.time.addEvent({ delay: 300, callback: this.setReadyCrush, callbackScope: this, loop: false });
    }
    update(time, delta)
    {       
        if(this.body.velocity.x > this.max_speed){this.setVelocityX(this.max_speed)};
        if(this.body.velocity.x < -this.max_speed){this.setVelocityX(-this.max_speed)};
        if(this.body.velocity.y > this.max_speed){this.setVelocityY(this.max_speed)};
        if(this.body.velocity.y < -this.max_speed){this.setVelocityY(-this.max_speed)};
    }
    setReadyCrush(){
        this.readyCrush = true;
    }
    impact(obj){
        if(this.readyCrush){
            this.sound_gotCrushed.play();
            let fromBody = obj.body;
            let speed = Math.sqrt(Math.pow(fromBody.velocity.x,2)+Math.pow(fromBody.velocity.y,2));
            let force = speed*fromBody.density*100;
            if(force >= 2){                
                console.log("Rock Impact", force >> 0,speed >> 0,fromBody.density);
                if(this.scale > .25){
                    for(let r=0;r< Phaser.Math.Between(1,3);r++){
                        let newRock = rocks.get();
                        newRock.setup(this.x,this.y,this.scale*.75);                        
                    }
                }
                this.destroy();
            }
        }
    }
};

class Fallplat extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y,texture,frame) {
        super(scene.matter.world, x, y, texture, frame)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(0,0,w,h);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1,
            label: "FALLPLAT"
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setPosition(x, y)
        .setFixedRotation() 
        .setStatic(true);
        //Custom Props
        this.ready = true;
        this.dead = false;
        this.spawnPos = {x:x,y:y};
        
    }
    setup(x,y){
        this.setActive(true);
        this.setPosition(x,y); 
        this.spawnPos.x = x;
        this.spawnPos.y = y;

    }
    reset(){
        this.setActive(true);
        this.setPosition(this.spawnPos.x,this.spawnPos.y); 
        //this.ready = true;
        this.dead = false;
        this.setStatic(true);
        console.log("platfall reset");
        let tween = this.scene.tweens.add({
            targets: this,
            alpha: 1.0,              
            ease: 'Linear',       
            duration: 1000,  
            onComplete: function(tween, targets, myPlat){myPlat.ready = true;},
            onCompleteParams: [this],
        });
    }
    setDead(){
        if(!this.dead){
            this.dead = true;
            this.alpha = 0.0;
            console.log("platfall dead");
            this.resetTimer = this.scene.time.addEvent({ delay: 4000, callback: this.reset, callbackScope: this, loop: false });
        }
    }
    update(time, delta)
    {       
        if(this.dead){
            this.setActive(false);
            this.setPosition(-1000,-1000);
        }
    }
    touched(){
        
        //Gradual Wobble and then fall
        //this.setStatic(false);
        if(this.ready){
            console.log("platfall touched");
            this.ready = false;
            let tween = this.scene.tweens.add({
                targets: this,
                x: this.x+1,               // '+=100'
                y: this.y+1,               // '+=100'
                ease: 'Bounce.InOut',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
                duration: 150,
                repeat: 3,            // -1: infinity
                yoyo: true,
                onComplete: this.openComplete,
                onCompleteParams: [this],
            });
        }
    }
    openComplete(tween, targets, myPlat){
        console.log("platfall touch tween complete");
        myPlat.setStatic(false);
    }
};

class BreakableTile extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y,texture,index) {
        super(scene.matter.world, x, y, texture, index)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(0,0,w,h);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0.1,
            frictionAir: 0.05,
            friction: 0.3,
            label: "BREAKABLE"
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setStatic(true)
        .setPosition(x, y) 

        //Setup Collision
        this.scene.matterCollision.addOnCollideStart({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof BrightSensors) {
                    this.impact(gameObjectB);
                }
            }
        });
        //Breakable detail sprite
        this.detailSprite = this.scene.add.sprite(this.x,this.y,'breakablecracks').setDepth(DEPTH_LAYERS.FG);
        this.crushThreshold = 2;
        this.max_speed = 8;
        this.breakFrame = 0;
        this.breakFrames = [0,1,2,3,4];
        this.crushTimer = this.scene.time.addEvent({ delay: 300, callback: this.setReadyCrush, callbackScope: this, loop: false });
    }
    setup(x,y,scale,frames){
        this.breakFrames = JSON.parse(frames);
        this.setFrame(this.breakFrames[this.breakFrame]);
        this.setActive(true);
        this.setPosition(x,y); 
        this.setScale(scale);
        //Crush Timer
        this.readyCrush = false;
        
    }
    update(time, delta)
    {       

    }
    setReadyCrush(){
        this.readyCrush = true;
    }
    impact(obj){
        if(this.readyCrush){
            this.readyCrush = false;
            //this.setCollidesWith([ 0 ]) ;
            this.crushTimer = this.scene.time.addEvent({ delay: 300, callback: this.setReadyCrush, callbackScope: this, loop: false });
            let fromBody = bright.body;
            let speed = Math.sqrt(Math.pow(fromBody.velocity.x,2)+Math.pow(fromBody.velocity.y,2));
            let force = speed*fromBody.mass;
           
            // //Using Matter magnitude.
            // var bodyAMomentum = Phaser.Physics.Matter.Matter.Vector.mult(fromBody.velocity, fromBody.mass);
            // var bodyBMomentum = Phaser.Physics.Matter.Matter.Vector.mult({x:0,y:0}, 0);
            // var relativeMomentum = Phaser.Physics.Matter.Matter.Vector.sub(bodyAMomentum, bodyBMomentum);
            if(force >= this.crushThreshold || this.breakFrame >= this.breakFrames.length ){
                this.detailSprite.destroy();
                this.destroy();
            }else if(force >= 0){
                this.breakFrame = this.breakFrame + Math.round(force) < this.breakFrames.length ? this.breakFrame + Math.round(force) : this.breakFrames.length;
                this.detailSprite.setFrame(this.breakFrames[this.breakFrame]);
            }

        }
    }
};
class SecretTile extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y,texture,frame) {
        super(scene.matter.world, x, y, texture, frame)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(0, 0, w, h, { isSensor: true });

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 0.0,
            label: "SECRETTILE"
        });

        this        
        .setExistingBody(compoundBody)
        .setPosition(x, y)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setStatic(true)
        .setIgnoreGravity(true);   

        //Setup Collisions
        // this.scene.matterCollision.addOnCollideStart({
        //     objectA: [this],
        //     callback: eventData => {
        //         const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
        //         if (gameObjectB !== undefined && (gameObjectB instanceof Solana || gameObjectB instanceof Bright || gameObjectB instanceof SoulLight)) {                    
        //                 //this.enter(gameObjectB);
        //                 this.check();                    
        //         }
        //     }
        // });
        // this.scene.matterCollision.addOnCollideEnd({
        //     objectA: [this],
        //     callback: eventData => {
        //         const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
        //         if (gameObjectB !== undefined && (gameObjectB instanceof Solana || gameObjectB instanceof Bright || gameObjectB instanceof SoulLight)) {
        //             //this.leave();
        //             this.check();
        //         }
        //     }
        // });

        this.ready = true;
        this.debug = this.scene.add.text(this.x, this.y, 'SECRET', { resolution: 2, fontSize: '8px', fill: '#00FF00' }).setDepth(DEPTH_LAYERS.FG).setOrigin(0.5);
    }
    setup(x,y){
        this.setActive(true);
        this.setPosition(x,y); 
    }
    update(time, delta)
    {       
        if(this.ready){
            let tileDistance = 2;
            let thisTile = getObjectTilePosition(this.x,this.y,32);
            let solanaTile = getObjectTilePosition(solana.x,solana.y,32);
            let brightTile = getObjectTilePosition(bright.x,bright.y,32);
            let soulightTile = getObjectTilePosition(soullight.x,soullight.y,32);
            this.debug.setText(String(thisTile.x)+","+String(thisTile.y));
            if(Phaser.Math.Distance.Between(thisTile.x,thisTile.y,solanaTile.x,solanaTile.y) < tileDistance
                || Phaser.Math.Distance.Between(thisTile.x,thisTile.y,brightTile.x,brightTile.y) < tileDistance
                || Phaser.Math.Distance.Between(thisTile.x,thisTile.y,soulightTile.x,soulightTile.y) < tileDistance){

                    this.setAlpha(0.5);
            }else{
                if(this.alpha != 1.0){this.setAlpha(1.0)};
            }
        }
    }
    // check(){

    //     if(secretTiles != null && secretTiles.getLength() > 0){
    //         let stlist = secretTiles.getChildren();
    //         stlist.forEach(e =>{
    //             let disMax = e.width;
    //             if(Phaser.Math.Distance.Between(e.x,e.y,solana.x,solana.y) < disMax
    //                 || Phaser.Math.Distance.Between(e.x,e.y,bright.x,bright.y) < disMax
    //                 || Phaser.Math.Distance.Between(e.x,e.y,soullight.x,soullight.y) < disMax){
    //                 if(e.alpha == 1.0){
    //                     e.setAlpha(0.5);
    //                 }
    //             }else{
    //                 if(e.alpha != 1.0){
    //                     e.setAlpha(1.0);
    //                 }
    //             }
    //         });
    //     }
    // }
    // leave(){
    //     let stlist = secretTiles.getChildren();
    //     stlist.forEach(e =>{
    //         e.setAlpha(1.0);
    //     });
    // }
};
class PlatSwing extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'platform_160x16', 0)
        this.scene = scene;
        // Create the physics-based sprite that we will move around and animate
        scene.matter.world.add(this);
        // config.scene.sys.displayList.add(this);
        // config.scene.sys.updateList.add(this);
        scene.add.existing(this); // This adds to the two listings of update and display.

        this.setActive(true);

        this.sprite = this;

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this.sprite;
        const mainBody =  Bodies.rectangle(0, 0, w, h);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 0,//Was 0.1
            label: 'PLATSWING'
        });

        this.sprite
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setPosition(x, y)  
        //.setFixedRotation(); 


        //Matter JS Constraint 
        let swing_constraint = Phaser.Physics.Matter.Matter.Constraint.create({
            pointA: { x: this.x, y: this.y-48 },
            bodyB: this.sprite.body,
            length: 64,
            stiffness: .3
        });
        this.scene.matter.world.add(swing_constraint);              

    }
    setup(x,y, properties,name){
        this.setActive(true); 
        this.setPosition(x,y);
        this.name = name;
 
    }
    update(time, delta)
    {       


    }
};
class PlatSwingTween extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'platform_160x16', 0)
        this.scene = scene;
        // Create the physics-based sprite that we will move around and animate
        scene.matter.world.add(this);
        // config.scene.sys.displayList.add(this);
        // config.scene.sys.updateList.add(this);
        scene.add.existing(this); // This adds to the two listings of update and display.

        this.setActive(true);

        this.sprite = this;

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this.sprite;
        const mainBody =  Bodies.rectangle(0, 0, w, h);
        this.sensors = {
            top: Bodies.rectangle(0, -h*0.70, w , h*0.60, { isSensor: true }),
            bottom: Bodies.rectangle(0, h*0.70, w , h*0.60, { isSensor: true })
          };
        this.sensors.top.label = "PLAT_TOP";
        this.sensors.bottom.label = "PLAT_BOTTOM";
        
        const compoundBody = Body.create({
            parts: [mainBody, this.sensors.bottom, this.sensors.top],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 0,//Was 0.1
            label: 'PLATSWING'
        });

        this.sprite
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setPosition(x, y)  
        .setFixedRotation() 
        .setStatic(true)
        .setIgnoreGravity(true);  
        
        this.offsets = {x:x,y:y};
        this.swingDeg = 0;
        this.swingRadius = 32;


        //this.scene.events.on("update", this.update, this);
        //Fake Velocity
        this.prev = {x:x,y:y};
        this.onWayTracker = -1;
    }
    setup(x,y,properties,name){
        this.setActive(true); 
        this.setPosition(x,y);
        this.name = name;
        this.swingDeg = properties.start;
        this.swingRadius = properties.radius;
        //console.log(properties,this.swingDeg,this.swingRadius,this.swingDuration)
         //Setup Half Circle Tween
         this.scene.tweens.add({
            targets: this,
            swingDeg: properties.end,
            duration: properties.duration,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
            callbackScope: this,
            onUpdate: function(tween, target){
                let angle = Phaser.Math.DegToRad(target.swingDeg);
                target.x = Math.cos(angle)*target.swingRadius+target.offsets.x;
                target.y = Math.sin(angle)*target.swingRadius+target.offsets.y;
            }
        });
    }
    update(time, delta)
    {       
        this.setVelocityX((this.x - this.prev.x));
        this.setVelocityY((this.y - this.prev.y));
        this.prev.x = this.x;
        this.prev.y = this.y;
        //OneWay Tracking for enabling/disabling collisions
        if(this.onWayTracker != -1){
            this.trackOneWay();
        }
    }
    trackOneWay(){
        let targetObjTop = this.onWayTracker.obj.getTopCenter();
        let targetObjBottom = this.onWayTracker.obj.getBottomCenter();
        let platObjTop = this.getTopCenter();
        let platObjBottom = this.getBottomCenter();
        if(this.onWayTracker.direction == 'up'){
            if(targetObjBottom.y < platObjTop.y){
                this.oneWayEnd();
            }else if(targetObjTop.y > platObjBottom.y && this.onWayTracker.obj.body.velocity.y > 0){
                this.oneWayEnd();
            }
        }else if(this.onWayTracker.direction == 'down'){
            if(targetObjTop.y > platObjBottom.y && this.onWayTracker.obj.body.velocity.y > 0){
                this.oneWayEnd();
            }else if(targetObjBottom.y > platObjTop.y && this.onWayTracker.obj.body.velocity.y < 0){
                this.oneWayEnd();
            }
        }
    }
    oneWayStart(player,d){
        this.setCollidesWith([~CATEGORY.SOLANA]);
        this.onWayTracker = {obj: player,  direction: d};
        

    }
    oneWayEnd(){        
        this.setCollidesWith([CATEGORY.SOLANA,CATEGORY.BRIGHT, CATEGORY.DARK]);
        this.onWayTracker = -1;
    }
};

//Telebeam // Zips Bright and the soulight around the map
//Makes soulight fire transfer shot at the angle the telebeam is facing. 
//Triggers can rotate the angle.
//The Soullight carries bright with it when it does the transfer.
class Telebeam extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'telebeam', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.circle(x,y,w*0.20,{isSensor:true});

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 0,//Was 0.1
            label: 'TELEBEAM'
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setCollidesWith([ CATEGORY.BRIGHT, CATEGORY.SOLANA, CATEGORY.BULLET])
        .setPosition(x, y)
        .setStatic(true);   
        
        this.rotateReady = true;

        this.scene.matterCollision.addOnCollideActive({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Solana) {
                    let control_up = solana.ctrlDeviceId >= 0? gamePad[solana.ctrlDeviceId].checkButtonState('up') > 0 : keyPad.checkKeyState('W') > 0;
                    let control_down = solana.ctrlDeviceId >= 0? gamePad[solana.ctrlDeviceId].checkButtonState('down') > 0 : keyPad.checkKeyState('S') > 0;
                    if(control_up && this.rotateReady) {
                        this.doRotate();
                    }
                }
            }
        });
        //Up to date queue
        this.scene.events.on("update", this.update, this);
    }
    setup(x,y, properties,name){
        this.setActive(true); 
        this.setPosition(x,y);
        this.name = name;
 
    }
    update(time, delta)
    {       


    }
    doRotate(){
        this.rotateReady = false;
        this.scene.tweens.add({
            targets: this,
            rotation: this.rotation+(Math.PI/4),
            duration: 1000,
            ease: "Sine.easeInOut",
            callbackScope: this,
            onComplete: function(tween, target,tb){
                tb.rotateReady = true;
            },
            onCompleteParams: [this]
        });
    }
};