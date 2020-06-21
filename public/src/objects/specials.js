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
        .setDepth(DEPTH_LAYERS.OBJECTS)
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
        this.setRotation(angle);
    }
    update(time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Barrier:"+String(this.name));
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
        .setDepth(DEPTH_LAYERS.OBJECTS);

        this.isGrabbed  = false;
        this.max_speed = 5;
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
        if(this.body.velocity.x > this.max_speed){this.setVelocityX(this.max_speed)};
        if(this.body.velocity.x < -this.max_speed){this.setVelocityX(-this.max_speed)};
        if(this.body.velocity.y > this.max_speed){this.setVelocityY(this.max_speed);};
        if(this.body.velocity.y < -this.max_speed){this.setVelocityY(-this.max_speed)};
        //Body Impulse Limit
        if(this.body.positionImpulse.x > this.max_speed){this.body.positionImpulse.x = this.max_speed};
        if(this.body.positionImpulse.x < -this.max_speed){this.body.positionImpulse.x = -this.max_speed};
        if(this.body.positionImpulse.y > this.max_speed){this.body.positionImpulse.y = this.max_speed};
        if(this.body.positionImpulse.y < -this.max_speed){this.body.positionImpulse.y = -this.max_speed};

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
            this.setIgnoreGravity(true);
        }
    }
    released(){
        if(this.isGrabbed){
            this.scene.matter.world.remove(this.holdConstraint);
            this.isGrabbed  = false;
            this.setIgnoreGravity(false);
        }
    }
    
    enterWater(){
        this.setFrictionAir(0.35);
    }
    exitWater(){
        this.setFrictionAir(0.02);
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
        //const mainBody =  Bodies.circle(0,0,w*.50);
        const mainBody =  Bodies.polygon(0,0,32,w*.50);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0.01,
            frictionAir: 0.05,
            friction: 1.0,
            density: 0.01,
            label: "ROCK"
        });
        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setPosition(x, y) 
        .setDensity(0.01)
        .setDepth(DEPTH_LAYERS.OBJECTS);

        //Setup Collision
        this.scene.matterCollision.addOnCollideStart({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Bright) {
                    if(gameObjectB.light_status == 1){//ONLY DARK  MODE CAN CRUSH ROCKS
                        this.impact(gameObjectB);
                    }
                }
                if(gameObjectB !== undefined && gameObjectB instanceof SoulTransfer){
                    this.impact(gameObjectB);
                }
            }
        });
        this.max_speed = 5;
        this.sound_gotCrushed = game.sound.add('hitting_wall',{volume: 0.04});
    }
    setup(x,y,scale){
        this.setActive(true);
        this.setPosition(x,y); 
        this.setScale(scale);
        //Crush Timer
        this.readyCrush = false;
        this.crushTimer = this.scene.time.addEvent({ delay: 300, callback: this.setReadyCrush, callbackScope: this, loop: false });
        //Add it so rocks an only collide with ground,solid and dark for a few ms. should allow me to use them as an effect.
        this.setCollidesWith([CATEGORY.SOLID,CATEGORY.GROUND,CATEGORY.DARK,CATEGORY.BRIGHT,CATEGORY.BULLET,CATEGORY.BARRIER]);
        
    }
    update(time, delta)
    {       
        if(this.body.velocity.x > this.max_speed){this.setVelocityX(this.max_speed)};
        if(this.body.velocity.x < -this.max_speed){this.setVelocityX(-this.max_speed)};
        if(this.body.velocity.y > this.max_speed){this.setVelocityY(this.max_speed);};
        if(this.body.velocity.y < -this.max_speed){this.setVelocityY(-this.max_speed)};
    }
    setReadyCrush(){
        this.readyCrush = true;
        this.setCollidesWith([CATEGORY.SOLID,CATEGORY.GROUND,CATEGORY.DARK,CATEGORY.SOLANA,CATEGORY.VEHICLE,CATEGORY.BULLET,CATEGORY.BARRIER]);
    }
    impact(obj){
        if(this.readyCrush){
            this.sound_gotCrushed.play();
            let fromBody = obj.body;            
            let force = fromBody.speed*fromBody.density*100;
            //console.log("Rock Impact", force);
            if(force >= 1){                
                
                if(Phaser.Math.Between(1,5) == 1){ //20%
                    if(this.scale > 0.25){
                        for(let r=0;r< Phaser.Math.Between(1,3);r++){
                            let newRock = rocks.get();
                            newRock.setup(this.x,this.y,this.scale*.75);                        
                        }
                        this.getShards();
                    }                   
                    this.destroy();
                }else{
                    this.finalCrush();
                }

            }
        }
    }
    finalCrush(){
        this.getShards();
        this.destroy();
    }
    getShards(){
        let losRc = Phaser.Physics.Matter.Matter.Query.ray(losBlockers,{x:solana.x,y:solana.y},{x:this.x,y:this.y});
        //Only spawn shards if within range and has a clear line of sight.
        if(Phaser.Math.Distance.Between(solana.x,solana.y,this.x,this.y) < 744 && losRc.length == 0){
            for(let i=0;i < Phaser.Math.Between(1,3);i++){
                let ls = light_shards.get();
                ls.spawn(this.x,this.y,300,solana);
            }
        }
    }    
    enterWater(){
        this.setFrictionAir(0.25);
    }
    exitWater(){
        this.setFrictionAir(0.05);
    }
};
//RockChute
class RockChute extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'rockchute', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        //const mainBody =  Bodies.circle(0,0,w*.50);
        const mainBody =  Bodies.rectangle(0,0,w,h);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0.01,
            frictionAir: 0.05,
            friction: 1.0,
            density: 0.5,
            label: "CHUTE"
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setCollidesWith([0])//Nothing
        .setPosition(x, y)
        .setStatic(true) 
        
        this.rockTimer = this.scene.time.addEvent({ delay: 3000, callback: this.makeRocks, callbackScope: this, loop: true });        
        //this.scene.events.on("update", this.update, this);
        this.rockInventory = [];
    }
    setup(x,y){
        this.setActive(true);
        this.setPosition(x,y); 
    }
    update(time, delta)
    {   
        
    }
    makeRocks(){
        
        if(rocks.getTotalUsed() < 5){ // NO more rocks than 5
            let newRock = rocks.get(this.x,this.y);
            newRock.setup(this.x,this.y, 1);
            newRock.setVelocityY(0);
            newRock.applyForce({x:Phaser.Math.FloatBetween(0.01,0.02),y:0});  
            this.rockInventory.push(newRock);  
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
        .setCollidesWith([CATEGORY.SOLANA, CATEGORY.BRIGHT, CATEGORY.DARK, CATEGORY.SOLID, CATEGORY.GROUND])
        .setPosition(x, y)
        .setFixedRotation() 
        .setStatic(true);
        //Custom Props
        this.ready = true;
        this.dead = false;
        this.spawnPos = {x:x,y:y};
        this.shakeCount = 3;
        this.shakeTime = 150; // Shakes 3 times at 150ms each
        
    }
    setup(x,y){
        this.setActive(true);
        this.setPosition(x,y); 
        this.spawnPos.x = x;
        this.spawnPos.y = y;

    }
    setShakeTime(ms,ct){
        this.shakeTime = ms;
        this.shakeCount = ct;
    }
    reset(){
        console.log("platfall reset");
        this.setActive(true);
        this.setPosition(this.spawnPos.x,this.spawnPos.y); 
        //this.ready = true;
        this.dead = false;
        this.setStatic(true);
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
            console.log("platfall dead");
            this.dead = true;
            this.alpha = 0.0;
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
                duration: this.shakeTime,
                repeat: this.shakeCount,            // -1: infinity
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
                    if(bright.light_status == 1){
                        this.impact(gameObjectB);
                    }
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
    doCrush(){
        for(let r=0;r< Phaser.Math.Between(0,3);r++){
            let newRock = rocks.get();
            newRock.setup(this.x,this.y,0.25);  
            newRock.applyForce({x:Phaser.Math.FloatBetween(-0.0010,0.0010),y:Phaser.Math.FloatBetween(0.0,-0.0010)});                     
        }
        camera_main.shake(80,.005);
        this.detailSprite.destroy();
        this.destroy();
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
                this.doCrush();
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
        this.debug.setVisible(false);
    }
    setup(x,y){
        this.setActive(true);
        this.setPosition(x,y); 
    }
    update(time, delta)
    {       
        if(this.ready){
            let tileDistance = 2;
            let thisTile = getObjectTilePosition(this.x,this.y,16);
            let solanaTile = getObjectTilePosition(solana.x,solana.y,16);
            let brightTile = getObjectTilePosition(bright.x,bright.y,16);
            let soulightTile = getObjectTilePosition(soullight.x,soullight.y,16);
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
            friction: 1,//Was 0.1
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

        //Setup to allow to carry riders
        this.scene.matterCollision.addOnCollideActive({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Solana) {
                    let bVelX = gameObjectA.body.velocity.x;
                    let bVelY = gameObjectA.body.velocity.y;
                    let minX = bVelX < 0 ? bVelX : 0;
                    let maxX = bVelX > 0 ? bVelX : 0;
                    let minY = bVelY < 0 ? bVelY : 0;
                    let maxY = bVelY > 0 ? bVelY : 0;
                    gameObjectB.setMaxMoveSpeed(minX,maxX,minY,maxY);
                }
            }
        });
        this.scene.matterCollision.addOnCollideEnd({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Solana) {
                    gameObjectB.setMaxMoveSpeed(0,0,0,0);
                }
            }
        });
    }
    setup(x,y,properties,name,w,h){
        this.setActive(true); 
        this.setPosition(x,y);
        this.setSize(w,h);
        this.setDisplaySize(w,h);
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

//Water
class TMXWater{
    constructor(scene,x,y,w,h,d,opt){
        this.scene = scene;

        //this.waterbody = this.scene.add.water(x, y, w, h, d, opt);
        //NOTE: ObjectA was this.waterbody.sensor
        this.waterbody = this.scene.matter.add.rectangle(x+w/2,y+h/2,w,h, {isStatic:true, isSensor:true});
        this.brightBlocker = this.scene.matter.add.rectangle(x+w/2,y+h/2,w,h, {isStatic:true, collisionFilter: {mask:CATEGORY.BRIGHT}});
        this.sprite = this.scene.add.rectangle(x+w/2,y+h/2,w,h,0x0099ff,0.7)
        //console.log("Waterbody",this.waterbody)
        this.scene.matterCollision.addOnCollideStart({
            objectA: this.waterbody,
            callback: ({ gameObjectB, gameObjectA }) => {
                if(gameObjectB instanceof Solana
                    || gameObjectB instanceof Bright
                    || gameObjectB instanceof Crate
                    || gameObjectB instanceof Rock
                    || gameObjectB instanceof SolBomb
                    || gameObjectB instanceof Enemy
                    || gameObjectB instanceof Bullet){
                        
                        gameObjectB.enterWater();
                        // const i = gameObjectA.columns.findIndex((col, i) => col.x >= (gameObjectB.x-gameObjectA.x) && i);	
                        // const speed = gameObjectB.body.speed * 3;	                        
                        // const numDroplets = Math.ceil(gameObjectB.body.speed) * 5;		
                        // gameObjectA.splash(Phaser.Math.Clamp(i, 0, gameObjectA.columns.length - 1), speed, numDroplets);
 
                }
            },
        });
        this.scene.matterCollision.addOnCollideEnd({
            objectA: this.waterbody,
            callback: ({ gameObjectA: wb, gameObjectB, }) => {
                if(gameObjectB instanceof Solana
                    || gameObjectB instanceof Bright
                    || gameObjectB instanceof Crate
                    || gameObjectB instanceof Rock
                    || gameObjectB instanceof SolBomb
                    || gameObjectB instanceof Enemy
                    || gameObjectB instanceof Bullet){
                        
                        gameObjectB.exitWater();
                    }
            },
        });
        //Construct set position function?
    }
}
//TMZ Liquid drops (Water puts out bright, turns him to dark. Acid hurts Dark. Corruption hurts Solana.)
class Droplet extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'liquiddroplet', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(x,y,w*0.50,h*0.50);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.20,
            friction: 0.1,//Was 0.1
            label: 'LIQUIDDROP'
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.LIQUID)
        .setCollidesWith([CATEGORY.GROUND])
        .setFixedRotation()
        .setIgnoreGravity(true)
        .setPosition(x, y); 

        this.scene.matterCollision.addOnCollideStart({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Solana) {
                    //gameObjectA.destroy();
                }
                if (gameObjectB !== undefined && bodyB.label == 'GROUND') {
                    if(gameObjectA.hitGround == false){ gameObjectA.impact();};
                }
            }
        });
        this.setTint(0x0000CC);
        let dripPosY = this.y+this.height*1.5
        this.twfall = this.scene.tweens.add({
            targets: this,
            height: h*2.0,
            width: w*0.5,
            displayHeight: h*2.0,
            displayWidth: w*0.5,              
            y: dripPosY ,
            ease: 'Linear',       
            duration: 500,  
            onComplete: function(tween, targets, mydrop){
                mydrop.setIgnoreGravity(false);
                mydrop.setDepth(DEPTH_LAYERS.FG);
            },
            onCompleteParams: [this],
        });
        this.id =0;
        this.hitGround = false;

    }
    impact(){
        this.hitGround = true;
        this.angle = 0;
        let w = Phaser.Math.Between(this.width/2,this.width);
        let h = this.height;
        let rW = Phaser.Math.Between(16,32)
        this.twimpact = this.scene.tweens.add({
            targets: this,
            height: 2,
            width: rW,
            displayHeight: 2,
            displayWidth: rW,
            ease: 'Linear',       
            duration: 300,  
            onComplete: this.splashdown,
            onCompleteParams: [this],
        });
        //console.log("impact",this.id);
    }
    setup(x,y, properties,name){
        this.setActive(true); 
        this.setPosition(x,y);
        this.name = name;
 
    }
    splashdown(tween, targets, mydrop){
        mydrop.splashtimer = mydrop.scene.time.addEvent({ delay: 1000, callback: mydrop.createdrips, callbackScope: mydrop, loop: false });
        //console.log("splashdown",mydrop.id);
    }
    createdrips(){
        this.drips = [];
        for(let d=0;d < Phaser.Math.Between(0,4);d++){
            this.drips.push({x:this.x + Phaser.Math.Between(-this.width/4,this.width/4),y:this.y,n:0,m:Phaser.Math.Between(4,12)});
        }
        this.dripTimer = this.scene.time.addEvent({ delay: 80, callback: this.moddrips, callbackScope: this, loop: true });
        this.gfxDrips = this.scene.add.graphics();
        this.gfxDrips.setDepth(DEPTH_LAYERS.FG);
        this.lifeTimer = this.scene.time.addEvent({ delay: 3000, callback: this.removedroplet, callbackScope: this, loop: false });
    }
    moddrips(){
        let maxCount = 0;
        this.drips.forEach(e=>{
            if(e.n < e.m){
                e.n++;
            }else{
                maxCount++;
            }
            
        },this)
        this.dripdown();        
    }
    dripdown(){    
        this.gfxDrips.clear(); 
        this.gfxDrips.lineStyle(1, 0x0000CC, 0.9);
        this.drips.forEach(e=>{
            this.gfxDrips.beginPath();
            this.gfxDrips.moveTo(e.x, e.y);
            this.gfxDrips.lineTo(e.x, e.y+e.n);
            this.gfxDrips.closePath();
            this.gfxDrips.strokePath();
        },this)

    }
    removedroplet(){
        this.gfxDrips.clear(); 
        this.twfall.remove();
        this.twimpact.remove();
        this.dripTimer.remove()
        this.gfxDrips.destroy();
        this.destroy();
    }
    update(time, delta)
    {       
        this.setRotation(0);

    }
};
//Chest
class Chest extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'chest', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(x,y,w*0.80,h*0.60,{isSensor:true});

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 1,//Was 0.1
            label: 'CHEST'
        });

        compoundBody.render.sprite.yOffset = 0.23; 
        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setCollidesWith([ CATEGORY.BRIGHT, CATEGORY.SOLANA])
        .setPosition(x, y+h*0.20)
        .setStatic(true);  
        this.isOpen = false;

        this.scene.matterCollision.addOnCollideActive({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Solana) {
                    let control_up = solana.ctrlDeviceId >= 0? gamePad[solana.ctrlDeviceId].checkButtonState('up') > 0 : keyPad.checkKeyState('W') > 0;
                    if(control_up) {
                        //Interact
                        gameObjectA.open();
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
    open(){
        console.log("Try open");
        if(!this.isOpen){
            this.isOpen = true;
            this.anims.play('chest-open',true);
            let heart = new Heart(this.scene,this.x,this.y-16);
        }
    }
};
