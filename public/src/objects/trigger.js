//A general purpose TMX trigger file

// This will allow for a broad range of items that can be defined by properties in TMX.
// TMXButton,TMXLever,TMXZone, TMXPressure, TMXDestructable, TMXGate
// TMX Button: An interactive button that can be pushed to trigger. Solana can press up to push it.
// TMX Lever: Solana can use up and down to switch back and forth.
// TMX Zone: An effect(s) happens when the player enters the zone.  Can apply physics, hurt player, cause particles and sprites, etc.
// TMX Pressure: Buttons that are only affected by pushing on them. Dark can drop from above to trigger pressure plats.
// TMX Destructable: Can be destroyed to reveal new areas or secrets.
// TMX Gate: A door that lifts up to allow access to another area.
// TMX Platform: A platform that can move along a path. Can be triggered, or trigger other effects.

class TMXLever extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'lever', 0)
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
        const mainBody =  Bodies.rectangle(0, 0, w, h, { isSensor: true });

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1
        });

        this.sprite
        .setExistingBody(compoundBody)
        .setPosition(x, y)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setIgnoreGravity(true);    

        this.debug = scene.add.text(this.x, this.y-16, 'Lever', { fontSize: '10px', fill: '#00FF00' }).setDepth(this.depth+1);             


    }
    setup(x,y, properties,name){
        this.setActive(true);
        this.sprite.setIgnoreGravity(true);
        this.setPosition(x,y);
        this.name = name;
        this.leverPosition = 0;
        this.target = {name: -1,type: -1, object: []};
        
        if(properties){
            this.target.name = properties.targetName;
            this.target.type = properties.targetType;
        }
        //console.log("setup",name, properties,this.target);

        //Setup Sound
        this.leverSoundTrigger = game.sound.add('switch1');
        this.leverSoundNotReady = game.sound.add('switch2');
 
    }
    update(time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Lever Position:"+String(this.leverPosition));
    }
    setTarget(targetObject){
        this.target.object.push(targetObject);
    }
    triggerTarget(){
        if(this.target.object.length > 0){
            this.target.object.forEach(e=>{
                e.activateTrigger();
            });
        }
    }
    checkIfTargetsReady(){
        let r = true;
        this.target.object.forEach(e=>{
            if(e.ready == false){r=false;};
        });
        return r;
    }
    useLever(){
        if(this.anims.isPlaying == false){
            //Animation is done.
            if(this.target.object.length > 0 && this.checkIfTargetsReady()){
                this.leverSoundTrigger.play();
                //Target is ready to operate?
                if(this.leverPosition == 0){
                    this.leverPosition = 1;
                    this.anims.play('lever-operate-1', true); 
                    this.triggerTarget();
                }else{
                    this.leverPosition = 0;
                    this.anims.play('lever-operate-0', true); 
                    this.triggerTarget();
                }
            }else{
                //Player chunk sound so play knows they can use the lever right now. Make sure sound only plays if not playing.
                if(this.leverSoundNotReady.isPlaying == false){
                    this.leverSoundNotReady.play();
                }
            }
        }

    }
};

class TMXGate extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'gate', 0)
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
        //Gates need a bottom sensor that hurts the Solana if they start to crush her.
        this.bottom = Bodies.rectangle(0, h*0.5, w, 2, { isSensor: true })
        this.bottom.label = "GATE_BOTTOM";
        const compoundBody = Body.create({
            parts: [mainBody,this.bottom],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1
        });
        compoundBody.render.sprite.xOffset = 0.50;
        compoundBody.render.sprite.yOffset = 0.50;
        this.sprite
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.BARRIER)
        .setPosition(x, y)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setStatic(true)
        .setIgnoreGravity(true);    

        this.debug = scene.add.text(this.x, this.y-16, 'gate', { fontSize: '10px', fill: '#00FF00' }).setDepth(this.depth+1);             


    }
    setup(x,y,properties,name,w,h){
        
        // if(w > h){this.setTexture('gate_wide')};
        
        this.setActive(true);        
        this.setPosition(x,y);        

        if(w > h){
            this.setSize(h,w);
            this.setDisplaySize(h,w);
            this.setAngle(90);
        }else{
            this.setSize(w,h);
            this.setDisplaySize(w,h);
        }
        this.name = name;        
        this.ready = true;
        this.prevVel = {x:0,y:0};       
        this.mvdir = JSON.parse(properties.mvdir)
        this.isClosed = true;
        this.twDuration = properties.duration == undefined ? 3000 : properties.duration;
        this.twCompleteDelay = properties.completedelay == undefined ? 0 : properties.completedelay;
        this.closedPos = {x:x,y:y};
        this.openPos = {x:x+this.mvdir.x,y:y+this.mvdir.y}
        this.autoClose = properties.autoclose == undefined ? false : properties.autoclose;
        if(properties.customScale){
            //Run Custom Scaling
            let newScale = JSON.parse(properties.customScale);
            this.setSize(newScale.x,newScale.y);
            this.setDisplaySize(newScale.x,newScale.y);
           //console.log("Gate Props",newScale);
        }
        if(this.autoClose){this.setTint(0xee0000)};
        //console.log("Gate Props",this.mvdir);
    }
    update(time, delta)
    {       
        //DEBUG TEXT
        this.debug.setPosition(this.x, this.y-16);
        //BECAUSE IT IS STATIC, THIS GIVES IT MOMENTUM TO AFFECT OTHER ENTITIES
        this.setVelocity(this.x - this.prevVel.x,this.y - this.prevVel.y);
        this.bottom.velocity.y = this.body.velocity.y;
        this.prevVel.x = this.x;
        this.prevVel.y = this.y;
    }
    activateTrigger(){
        
        if(this.ready){
            //console.log("Gate not moving: Trigger Gate");
            this.ready = false;

            if(this.x == this.closedPos.x && this.y == this.closedPos.y){
                this.scene.tweens.add({
                    targets: this,
                    x: this.openPos.x,
                    y: this.openPos.y,
                    ease: 'Power1',
                    duration: this.twDuration,
                    completeDelay: this.twCompleteDelay,
                    onComplete: this.openComplete,
                    onCompleteParams: [ this, true ]
                });
            }else{
                this.scene.tweens.add({
                    targets: this,
                    x: this.closedPos.x,
                    y: this.closedPos.y,
                    ease: 'Power1',
                    duration: this.twDuration,
                    completeDelay: this.twCompleteDelay,
                    onComplete: this.openComplete,
                    onCompleteParams: [ this, false ]
                });
            }            
        }

    }
    openComplete(tween, targets, myGate, state){
        //console.log("Gate Tween Finished");
        myGate.ready = true;
        myGate.isClosed = !state;
        if(myGate.autoClose && state){myGate.activateTrigger();}
    }
};

class TMXPlate extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'pressure_plate', 0)
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
        const mainBody =  Bodies.rectangle(0, 0, w, h*.5);//Plates are thin, so lower it by half

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1
        });

        this.sprite
        .setExistingBody(compoundBody)
        .setPosition(x, y)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setStatic(true)
        .setIgnoreGravity(true);    

        this.debug = this.scene.add.text(this.x, this.y-16, 'plate', { fontSize: '10px', fill: '#00FF00', resolution: 2 }).setOrigin(0.5).setDepth(this.depth+1);             
        this.plateSound = this.scene.sound.add('switch1');

    }
    setup(x,y, properties,name){
        this.setActive(true); 
        this.setPosition(x,y);
        this.name = name;
        this.platePosition = 0;
        this.target = {name: -1,type: -1, object: []};
        this.ready = true;
        this.allowReset = false;
        if(properties){
            this.allowReset = properties.allowReset;
            this.target.name = properties.targetName;
            this.target.type = properties.targetType;
            this.ready = properties.ready != undefined ? properties.ready : true;
            this.platePosition = properties.state != undefined ? properties.state : 0;
        }  
        this.setFrame(this.platePosition);      
 
    }
    update(time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Plate state:"+String(this.platePosition)+"r:"+String(this.ready));
    }
    setTarget(targetObject){
        this.target.object.push(targetObject);
        //console.log("Set target for ", this.name);
    }
    activateTrigger(){
        this.platePosition = 0;
        this.setFrame(0); 
    }
    triggerTarget(){
        if(this.target.object.length > 0){
            this.target.object.forEach(e=>{
                e.activateTrigger();
            });
        }
    }
    checkIfTargetsReady(){
        let r = true;
        this.target.object.forEach(e=>{
            if(e.ready == false){r=false;};
        });
        return r;
    }
    usePlate(){
        if(this.ready == true){
            this.ready = false;
            
            if(this.allowReset){
                this.plateTimer = this.scene.time.addEvent({ delay: 1000, callback: this.plateComplete, callbackScope: this, loop: false });
            }
            if(this.target.object.length > 0 && this.checkIfTargetsReady()){

                if(this.platePosition == 0){
                    this.plateSound.play();
                    this.platePosition = 1;
                    this.setFrame(1);
                    this.triggerTarget();
                }
            }
        }

    }
    plateComplete(){
        //console.log("plate ready again");
        this.ready = true;                   
         this.platePosition = 0;
        this.setFrame(0); 
    }
};
class TMXButton extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'tmxbutton', 0)
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
        const mainBody =  Bodies.rectangle(0, 0, w, h, { isSensor: true });

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1
        });

        this.sprite
        .setExistingBody(compoundBody)
        .setPosition(x, y)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setStatic(true)
        .setIgnoreGravity(true);    

        this.debug = scene.add.text(this.x, this.y-16, 'TMXButton', { fontSize: '10px', fill: '#00FF00' }).setDepth(this.depth+1);             


    }
    setup(x,y, properties,name){
        this.setActive(true);
        this.setPosition(x,y);
        this.name = name;
        this.buttonPosition = 0;
        this.target = {name: -1,type: -1, object: []};
        this.ready = true;
        if(properties){
            this.target.name = properties.targetName;
            this.target.type = properties.targetType;
        }
       //console.log("setup",name, properties,this.target);
 
    }
    update(time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Button Position:"+String(this.platePosition));
    }
    setTarget(targetObject){
        this.target.object.push(targetObject);
        //console.log("Set target for ", this.name);
    }
    triggerTarget(){
        if(this.target.object.length > 0){
            this.target.object.forEach(e=>{
                e.activateTrigger();
            });
        }
    }
    checkIfTargetsReady(){
        let r = true;
        this.target.object.forEach(e=>{
            if(e.ready == false){r=false;};
        });
        return r;
    }
    useButton(){
        if(this.anims.isPlaying == false){
            //Animation is done.
            if(this.target.object.length > 0 && this.checkIfTargetsReady()){
                //Target is ready to operate?
                if(this.buttonPosition == 0){
                    this.buttonPosition = 1;
                    this.anims.play('button-activate', true); 
                    this.anims.stopOnFrame(this.anims.getTotalFrames()-1);
                    this.triggerTarget();
                }else{
                    this.buttonPosition = 0;
                    this.anims.playReverse('button-activate', true); 
                    this.anims.stopOnFrame(0);
                    this.triggerTarget();
                }
            }else{
                //Click to let them know they have to wait.
            }
        }

    }
};
class TMXZone extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'triggerzone', 0)
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
        const mainBody =  Bodies.rectangle(0, 0, w, h, { isSensor: true });

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1,
            label: "TMXZone"
        });

        this.sprite
        .setExistingBody(compoundBody)
        .setPosition(x, y)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setStatic(true)
        .setIgnoreGravity(true)
        .setCollisionCategory(CATEGORY.BARRIER);    
        this.setDepth(DEPTH_LAYERS.PLATFORMS);
        this.debug = scene.add.text(this.x, this.y, 'Zone', { fontSize: '10px', fill: '#00FF00', resolution: 2, align:"center"}).setOrigin(0.5).setDepth(this.depth+1);             
        
        //Add Matter collisionStart detector on all bodies.
        //When a new collisions starts, check the mass of all bodies in the zone that meet the body label filter. if the zone type is weight,
        //then check the total mass against the max allowed mass. If it meets it meets or exceeds the mass, trigger the target.
        //This can create the effect of "falling" platforms that with enough crates and rocks, will tumble down, opening new paths.

    }
    setup(x,y, properties,name,w,h){
        this.setActive(true);
        this.setPosition(x,y);
        this.alpha = 0.0;
        this.name = name;
        this.target = {name: -1,type: -1, object: []};
        this.ready = [true,true];
        this.zonedata = {type:'trigger',value:0};
        this.allowReset = false;
        this.resetDelay = 100;
        this.resetTimer = [-1,-1];
        this.effect = -1;
        this.zoneWidth = w;
        this.zoneHeight = h;  
        this.totalBodies = [];
        this.massThrehold = 100;
        this.enabled = true;
        //Zones can do certain things.
        //
        if(properties){
            this.target.name = properties.targetName;
            this.target.type = properties.targetType;
            this.zonedata.type = properties.zoneType;
            this.zonedata.value = properties.zoneValue;
            this.allowReset = properties.allowReset;
            this.resetDelay =properties.resetDelay;
            this.ready = properties.ready != undefined ? [properties.ready,properties.ready] : [true,true];
            this.massThrehold = properties.massThrehold != undefined ? properties.massThrehold : 100;
            this.enabled = properties.enabled != undefined ? properties.enabled : true;
            
        }
        //Types:
        //Target: Triggers a target
        //Hurt: Hurts the player
        //Force: Sends a force to a player
        //Teleport: Teleports the player via transform
       //console.log("setup",name, properties,this.target);
       if(this.zonedata.type == "force"){
            let vectorParse = JSON.parse(this.zonedata.value);   //Use this to get angle
            let v2ang = Phaser.Math.Angle.Between(0,0,vectorParse.x,vectorParse.y);
            let wind1 = this.scene.add.particles('shapes');
            this.wind1 = wind1.createEmitter({
                active:true,
                x: this.x,
                y: this.y,
                frame: {
                    frames: [
                        "trace_06"
                    ],
                    cycle: false,
                    quantity: 1
                },
                speed: 100,
                angle: Phaser.Math.RadToDeg(v2ang),
                alpha: { start: 0.2, end: 0 },
                blendMode: 'NORMAL',
                emitZone: {
                    source: new Phaser.Geom.Rectangle(-w/2,-h/2,w,h),
                    type: "random"
                }
            });
            wind1.setDepth(this.depth);
            if(this.enabled){
                this.wind1.start();
            }else{
                this.wind1.stop();
            };

       }else if(this.zonedata.type == "teleport"){
            this.effect=[
                this.scene.add.particles('shapes',  new Function('return ' + this.scene.cache.text.get('effect-trigger-teleporter'))())
            ];
            this.effect[0].setPosition(this.x,this.y);
            //Set visual toggle here / active toggle to only show if ready
            
            this.effect[0].emitters.list[0].setPosition({ min: -this.zoneWidth/2, max: this.zoneWidth/2 },this.y-this.zoneHeight*(3/4));
            this.effect[0].setActive(false);
            //Teleporter Gradient
            if(this.scene.textures.get("teleporter"+this.name).key != "__MISSING"){  
                let oldTexture = this.scene.textures.get("teleporter"+this.name);
                oldTexture.destroy();
            }
            this.texture = this.scene.textures.createCanvas('teleporter'+this.name, this.zoneWidth , this.zoneHeight);
           
            //  We can access the underlying Canvas context like this:
            let grd = this.texture.context.createLinearGradient(0, 0, this.zoneWidth, this.zoneHeight);
            //let grd = this.texture.context.createRadialGradient(this.zoneWidth/2,this.zoneHeight/2,this.zoneWidth/4,this.zoneWidth/2,this.zoneHeight/2,this.zoneWidth+20);
            //this.texture.context.globalCompositeOperation = "destination-out";
            grd.addColorStop(0, "rgba(255, 255, 255, 0.2)");
            grd.addColorStop(1, "rgba(255, 255, 255, 0.8)");
        
            this.texture.context.fillStyle = grd;
            this.texture.context.fillRect(0, 0, this.zoneWidth, this.zoneHeight);
        
            //  Call this if running under WebGL, or you'll see nothing change
            this.texture.refresh();
            //this.setTexture('teleporter');
            this.teleporterGradeient = this.scene.add.image(this.x, this.y, 'teleporter'+this.name);
            this.teleporterGradeient.setDepth(DEPTH_LAYERS.OBJECTS);
            this.teleporterGradeient.setVisible((this.ready[0] && this.ready[1]));
            this.teleporterGradeient.setAlpha(0.2);
            //Create Particles
            let spark1 = this.scene.add.particles('shapes');
            spark1.setDepth(DEPTH_LAYERS.FRONT);
            this.sparker = spark1.createEmitter({
                active:true,
                x: this.x,
                y: this.y,
                frequency: 80,
                frame: {
                    frames: [
                        "star_06"
                    ],
                    cycle: false,
                    quantity: 1
                },
                speed: 10,
                scale: { start: 0.5, end: 0.0 },
                alpha: { start: 1, end: 0 },
                blendMode: 'NORMAL',
                lifespan: 3000,
                tint: [
                    0xffd92a
                ],
                emitZone: {
                    source: new Phaser.Geom.Rectangle(-w/2,-h/2,w,h),
                    type: "random"
                }
            });
        }else if(this.zonedata.type == 'mass'){
           //Restrict collision types
            this.setCollidesWith([CATEGORY.SOLANA,CATEGORY.DARK,CATEGORY.SOLID])
           
           //Add Collision Listener to track mass of all active collisions
            this.scene.matterCollision.addOnCollideStart({
                objectA: [this],
                callback: eventData => {
                    const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;                    
                    //Calc total Body mass in area
                    //let obs = Phaser.Physics.Matter.MatterPhysics.intersectRect(gameObjectA.getTopLeft().x,gameObjectA.getTopLeft().y,gameObjectA.width,gameObjectA.height);
                    //console.log("mass zone",gameObjectA.scene.matter.intersectRect(0,0,2,2));
                    // let obs = Phaser.Physics.Matter.Matter.Query.collides(bodyA, gameObjectA.scene.matter.world.localWorld.bodies);
                    // console.log(obs);
                    if(gameObjectB != undefined){
                        this.totalBodies.push(bodyB);
                    }
                }
            });
            this.scene.matterCollision.addOnCollideEnd({
                objectA: [this],
                callback: eventData => {
                    const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;                    
                    gameObjectA.totalBodies.forEach((e,i)=>{
                        if(bodyB == e){
                            gameObjectA.totalBodies.splice(i,1);
                        }
                    });
                }
            });
        }else if(this.zonedata.type == 'hurt'){
            let spark1 = this.scene.add.particles('shapes');
            spark1.setDepth(DEPTH_LAYERS.FRONT);
            let hurtParse = JSON.parse(this.zonedata.value);
            let gravY = hurtParse.gravY != undefined ? hurtParse.gravY : 0;
            let gravX = hurtParse.gravX != undefined ? hurtParse.gravX : 0;
            let freq = 100-(Math.floor(w/16)*Math.floor(h/16));
            freq = Phaser.Math.Clamp(freq,1,100);
            this.sparker = spark1.createEmitter({
                active:true,
                x: this.x,
                y: this.y,
                frequency: freq,
                frame: {
                    frames: [
                        "circle_05"
                    ],
                    cycle: false,
                    quantity: 1
                },
                gravityY: gravY,
                gravityX: gravX,
                scale: { start: 0.5, end: 0.0 },
                alpha: { start: 1, end: 0 },
                blendMode: 'NORMAL',
                tint: [
                    4263489
                ],
                emitZone: {
                    source: new Phaser.Geom.Rectangle(-w/2,-h/2,w,h),
                    type: "random"
                }
            });
       }else if(this.zonedata.type == 'liquid'){
            
            this.scene.time.addEvent({ delay: 1000, callback: function(){
                
                let d = liquiddrops.get(x+Phaser.Math.Between(-w/2,w/2),y);
                d.id = debug_drop_cout;
                debug_drop_cout++;
            }, callbackScope: this, loop: true });
       }else if(this.zonedata.type == 'climb'){
        //Restrict collision types
            this.setCollidesWith([CATEGORY.SOLANA]);
        
        //Add Collision Listener to track mass of all active collisions
            this.scene.matterCollision.addOnCollideStart({
                objectA: [this],
                objectB: [solana.mainBody],
                callback: eventData => {
                    const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;                    
                    if(gameObjectB !== undefined && gameObjectB instanceof Solana){
                        gameObjectB.setIgnoreGravity(true);
                        gameObjectB.isClimbing = true;                        
                        if(gameObjectB.body.velocity.y != 0){gameObjectB.setVelocityY(0);}
                        
                    }
                }
            });
            this.scene.matterCollision.addOnCollideEnd({
                objectA: [this],
                objectB: [solana.mainBody],
                callback: eventData => {
                    const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;                    
                    if(gameObjectB !== undefined && gameObjectB instanceof Solana){
                        gameObjectB.setIgnoreGravity(false);
                        gameObjectB.isClimbing = false;
                        
                    }
                }
            });
        }
     
 
    }
    update(time, delta)
    {       
        //For Mass Calculations within  the zone.
        if(this.zonedata.type == "mass"){
            let tMass = 0;
            if(this.totalBodies.length > 0){
                tMass = this.totalBodies.sum('mass');
                if(tMass >= this.massThrehold && this.ready){
                    this.ready = false;
                    this.triggerTarget(0);//Player id does not matter sinze it is mass
                }
            }
        }else  if(this.zonedata.type == "force"){
        //For Zone force pushing ranges
        //Raycast along vector of the zone. Use the full size of the zone.
        //Check for blocking bodies. If a blocking body blocks the 50% of the width of the zone
        //Stop the airflow and resize. use scale to retain original size information

            // //Test bottom to top
            // let rayTo = Phaser.Physics.Matter.Matter.Query.ray(this.scene.matter.world.localWorld.bodies,{x:this.x,y:this.y+this.height/2},{x:this.x,y:this.y-this.height/2});
            // if(rayTo.length < 3){
            //     //Not Blocked;
            // }else{
            //     //Blocked;
            //     if(this.scaleY > 0.10){
            //         this.scaleY-=0.10;
            //     }
            // }
        }


        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Zone name:"+String(this.name)+"\n rState :"+String(this.ready));
    }
    setTarget(targetObject){
        this.target.object.push(targetObject);
    }
    triggerTarget(playerid){
        if(this.target.object.length > 0){
            this.target.object.forEach(e=>{
                e.activateTrigger(playerid);
            });
        }
    }
    checkIfTargetsReady(){
        let r = true;
        this.target.object.forEach(e=>{
            if(e.ready == false){r=false;};
        });
        return r;
    }
    triggerReset(playerid){
        this.ready[playerid]  = true;
    }
    activateTrigger(playerid){
        this.ready[playerid] = true;
        if(this.zonedata.type == "teleport"){
            this.effect[0].setActive(this.ready[playerid]);
            this.teleporterGradeient.setVisible(this.ready[playerid]);
        }else if(this.zonedata.type == "force"){
            this.enabled = !this.enabled;
            if(this.enabled){
                this.wind1.start();
            }else{
                this.wind1.stop();
            };
        }
    }
    useZone(playerid){

    }
    inZone(obj,id){
        //Do something base on zome type

        if(this.ready[id] == true && this.enabled){
            this.ready[id] = false;
            //Solana Specific Functions
            if(id == 0){
                if(this.zonedata.type == "hurt"){
                    let hurtParse = JSON.parse(this.zonedata.value);
                    if(id == 1){
                        if(obj.light_status == 0){
                            //Zones don't hurt dark
                            obj.receiveDamage(hurtParse.damage);
                        }
                    }else{
                        obj.receiveDamage(hurtParse.damage);
                    }
                }
                if(this.zonedata.type == "force"){
                    let vectorParse = JSON.parse(this.zonedata.value);
                    obj.readyThrown(vectorParse.x,vectorParse.y,vectorParse.time);                
                }
                if(this.zonedata.type == "dialogue"){
                    let textParse = JSON.parse(this.zonedata.value);
                    hud.storySpeech.createSpeech(textParse.spkImageLeft,textParse.spkImageRight,textParse.doPause);
                    textParse.speechdata.forEach(e=>{
                        hud.storySpeech.addToSpeech(e.p,e.txt,e.dur);
                    });
                    hud.storySpeech.startSpeech();
               }
            }
            if(this.zonedata.type == "target"){
                this.triggerTarget(id);
            }
            if(this.zonedata.type == "teleport"){
                let positionParse = JSON.parse(this.zonedata.value)
                if(Array.isArray(positionParse)){
                    positionParse = positionParse[id];
                }
                this.scene.time.addEvent({ 
                    delay: 300, 
                    callback: function(){
                        //Need additional check to make sure I am still within zone completely. Only teleport if totally inside zone.
                        obj.setPosition(positionParse.x,positionParse.y)
                    }, 
                    callbackScope: this, 
                    loop: false 
                });

                //obj.setPosition(positionParse.x,positionParse.y);

                //This should eventually have an effect where she and bright are teleported. They are beamed up
                //and then beamed down into the spot where they end up. Once the animations are over, they are moved,
                //and then once the second animations is done, they both appear.

                //Use the get/apply/add effects method set. There is already a standard setup there for changing her animation.
            }

            if(this.allowReset){
                this.resetTimer[id] = this.scene.time.addEvent({ delay: this.resetDelay, callback: this.triggerReset, args:[id], callbackScope: this, loop: false });
            }
         
        }

    }
};
class TMXPlatform extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y,texture,frame) {
        super(scene.matter.world, x, y, texture, frame)
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
            top: Bodies.rectangle(0, -h*0.50-4, w , 8, { isSensor: true }),
            bottom: Bodies.rectangle(0, h*0.50+4, w , 8, { isSensor: true })
          };
        this.sensors.top.label = "PLAT_TOP";
        this.sensors.bottom.label = "PLAT_BOTTOM";

        const compoundBody = Body.create({
            parts: [mainBody, this.sensors.bottom, this.sensors.top],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 1,//Was 0.1
            label: 'PLATFORM'
        });

        this.sprite
        .setExistingBody(compoundBody)         
        .setCollisionCategory(CATEGORY.SOLID)
        .setCollidesWith([CATEGORY.SOLANA,CATEGORY.BRIGHT, CATEGORY.DARK, CATEGORY.VEHICLE, CATEGORY.SOLID, CATEGORY.BULLET, CATEGORY.ENEMY])
        .setPosition(x, y)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setStatic(true)
        .setIgnoreGravity(true);    

        this.debug = scene.add.text(this.x, this.y-16, 'platform', { fontSize: '10px', fill: '#00FF00' }).setDepth(this.depth+1);             
        this.onWayTracker = -1;
        //Setup to allow to carry riders
        this.scene.matterCollision.addOnCollideActive({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Solana && !gameObjectA.immobile) {
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
        this.scene.matterCollision.addOnCollideStart({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Solana && !gameObjectA.immobile) {
                    gameObjectB.setFriction(0.5);
                    if(gameObjectA.damage > 0){
                        //Does the platform hurt the player?
                        gameObjectB.receiveDamage(gameObjectA.damage);
                    }
                }
                if (gameObjectB !== undefined && gameObjectB instanceof Bright){
                    if(gameObjectA.damage > 0 && gameObjectB.light_status == 1){
                        //Does the platform hurt the player?
                        gameObjectB.receiveDamage(gameObjectA.damage);
                    }
                }
            }
        });
        this.scene.matterCollision.addOnCollideEnd({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Solana && !gameObjectA.immobile) {
                    gameObjectB.setMaxMoveSpeed(0,0,0,0);
                    gameObjectB.setFriction(0.01);
                }
            }
        });

    }
    setup(x,y,properties,name,w,h){
        this.setActive(true); 
        this.setPosition(x,y);
        
        // let scaleFactorX = w/this.width;
        // let scaleFactorY = h/this.height;
        // console.log(scaleFactorX,scaleFactorY)
        //Phaser.Physics.Matter.Matter.Body.scale(this.body,scaleFactorX,scaleFactorY)
        this.setSize(w,h);
        this.setDisplaySize(w,h);

        this.name = name;
        this.platformPosition = 0; //0 to 1
        this.target = {name: -1,type: -1, object: []};
        this.ready = true;
        this.setHighSpeed = 0;
        this.immobile = true;
        this.tmloop = -1;
        this.autostart = false;
        this.togglePath = false;
        this.allowJumpThru = true;
        if(properties != undefined && Object.keys(properties).length > 0){
            this.target.name = properties.targetName;
            this.target.type = properties.targetType;
            //Handle Path Setup
            if(properties.pathid){                
                let findPath = pathingNodes.find(e => {
                    return e.name === properties.pathid;
                })
                if(findPath){
                    //Adjust the worldpoints to relative position
                    findPath.worldpoints.forEach(e=>{
                        e.x = e.x-this.x;
                        e.y = e.y-this.y;
                        e.h = 0;
                        e.t = 3000
                    },this);
                    //Overwrite with found path waypoints                    
                    this.path = findPath.worldpoints;
                    console.log(findPath.worldpoints);
                    
                }else{
                    this.path = properties.path != undefined ? JSON.parse(properties.path) : -1; 
                }                
            }else{
                this.path = properties.path != undefined ? JSON.parse(properties.path) : -1;  
            }

            
            this.tmloop = properties.loop;
            this.autostart = properties.autostart;
            this.togglePath = properties.togglepath != undefined ? properties.togglepath : false;
            this.damage = properties.hurt;    
            this.allowJumpThru  = properties.allowJumpThru != undefined ? properties.allowJumpThru : true;
            //Custom Body Scaling
            if(properties.bodyScaleX || properties.bodyScaleY){
                let bdScaleX = properties.bodyScaleX != undefined ? properties.bodyScaleX : 1;
                let bdScaleY = properties.bodyScaleY != undefined ? properties.bodyScaleY : 1;
                Phaser.Physics.Matter.Matter.Body.scale(this.body,bdScaleX,bdScaleY)
            }
            
        }
       if(this.autostart && (this.path != undefined && this.path != -1)){ 
            this.setPath(this.path) // test tween
            this.immobile = false;
       }else{
           this.immobile = true;
       }
       this.prev = {x:x,y:y};
 
    }
    update(time, delta)
    {       

        // this.debug.setPosition(this.x, this.y-16);
        // this.debug.setText(this.name+" "
        // +String(this.body.velocity.x.toFixed(2))+":"
        // +String(this.body.velocity.y.toFixed(2))+":"
        // +String(this.ready));
        // body is static so must manually update velocity for friction to work
        this.setVelocityX((this.x - this.prev.x));
        this.setVelocityY((this.y - this.prev.y));
        this.prev.x = this.x;
        this.prev.y = this.y;

        //OneWay Tracking for enabling/disabling collisions
        if(this.onWayTracker != -1){
            this.trackOneWay();
        }
    }    
    setTarget(targetObject){
        this.target.object.push(targetObject);
    }
    triggerTarget(){
        if(this.target.object.length > 0){
            this.target.object.forEach(e=>{
                e.activateTrigger();
            });
        }
    }
    checkIfTargetsReady(){
        let r = true;
        this.target.object.forEach(e=>{
            if(e.ready == false){r=false;};
        });
        return r;
    }
    activateTrigger(){
        if(this.ready == true){
            this.ready = false; 
            if((this.path != undefined && this.path != -1)){ 
                this.setPath(this.path);
            }
        }
    }
    setPath(path){
        //For each coord in the array, start tweening to at a specific time. The coord array contains
        // x, y, time, hold objects for each tween x,y,t,h
        //positioning is relative
        this.timeline = this.scene.tweens.createTimeline();
        this.timeline.setCallback('onComplete',this.platComplete,[this],this.timeline);
        this.timeline.loop = this.tmloop;
        path.forEach(function(e){
            let dX = e.x;
            let dY = e.y; 
            if(this.togglePath && this.platformPosition == 1){
                dX = e.x*-1;
                dY = e.y*-1;
            }
            this.timeline.add({
                targets: this,
                x: this.x+dX,
                y: this.y+dY,
                //ease: 'Cubic.easeInOut',
                ease: 'linear',
                duration: e.t,
                hold: e.h
            });
        
        },this);

        this.timeline.play();
        this.immobile = false;
    }
    usePlatform(){
        if(this.ready == true){
            this.ready = false;            
            this.plateTimer = this.scene.time.addEvent({ delay: 1000, callback: this.plateComplete, callbackScope: this, loop: false });
            //Timer is done.
            if(this.target.object.length > 0 && this.checkIfTargetsReady()){
                this.triggerTarget();
            }else{
                //Target not ready
            }
        }

    }
    platComplete(plat){
        plat.ready = true;
        plat.platformPosition = 1 - plat.platformPosition;
        console.log("Platform tween complete",plat.name,plat.platformPosition,plat.togglePath);
        this.immobile = true;
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
        if(this.allowJumpThru){
            this.setCollidesWith([~CATEGORY.SOLANA]);
            this.onWayTracker = {obj: player,  direction: d};
            this.setTint(0x004400);
        }

    }
    oneWayEnd(){        
        this.setCollidesWith([CATEGORY.SOLANA,CATEGORY.BRIGHT, CATEGORY.DARK, CATEGORY.VEHICLE, CATEGORY.SOLID, CATEGORY.BULLET, CATEGORY.ENEMY]);
        this.onWayTracker = -1;
        this.clearTint();
    }
};
//Crystals can be charged with solar blasts to light up for a short period. They slowly get dimmer.
//Fireflies can be gathered to gain light and are attracted to solana.
class CrystalLamp extends Phaser.Physics.Matter.Sprite {
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'light_crystal', 4);
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
            frictionAir: 0.02,
            friction: 0.1,
            label: 'CRYSTAL_LAMP'
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setCollidesWith([CATEGORY.BRIGHT, CATEGORY.BULLET])
        .setPosition(x, y)
        .setStatic(true)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setIgnoreGravity(true)
        .setVisible(true);  
 
    }
    setup(x,y, properties,name,brightness){
        this.setActive(true);
        this.setPosition(x,y);
        this.name = name;   
        this.target = {name: -1,type: -1, object: []};
        this.ready = true;
        if(properties){
            this.target.name = properties.targetName;
            this.target.type = properties.targetType;
            this.max_brightness = properties.brightness_max;
            if(properties.alwaysOn){this.alwaysOn = properties.alwaysOn;}else{this.alwaysOn=false;};
            if(properties.decayRate){this.decayRate = properties.decayRate;}else{this.decayRate=0;};
        }
        this.brightness = 0;
        
       //console.log("setup",name, properties,this.target);
        if(this.alwaysOn){this.turnOn();};

        //Add tint depending on lamp type to help the player know the effect
        if(this.decayRate != 0){
            this.setTint(0x9b32a8);
        }
    }
    setTarget(targetObject){
        this.target.object.push(targetObject);
    }
    triggerTarget(){
        if(this.target.object.length > 0){
            this.target.object.forEach(e=>{
                e.activateTrigger();
            });
        }
    }
    checkIfTargetsReady(){
        let r = true;
        this.target.object.forEach(e=>{
            if(e.ready == false){r=false;};
        });
        return r;
    }
    breaklamp(){

        if(this.brightness != 0){
            for(let i=0;i < Phaser.Math.Between(1,3);i++){
                let ls = light_shards.get();
                ls.spawn(this.x,this.y,300,solana);
            }
        }
        this.destroy();
    }
    turnOn(){        
        if(this.brightness == 0){
            this.triggerTarget();
        }
        //Can only trigger on if it is off.
        this.anims.play('lamp-turn-on', true); 
        this.brightness = this.max_brightness;

    }
    turnOff(){
        this.anims.play('lamp-turn-off', true); 
        this.brightness = 0;
        this.triggerTarget();        
    }
    decay(){
        this.brightness = (this.brightness - this.decayRate );
        if(this.brightness  <= 0){this.turnOff();};
    }
    update()
    {
        //Count brightness by animation frame? Might look good.
        if(this.decayRate > 0 && this.brightness > 0){
            this.decay();
        }
    }

}

class Seesaw extends Phaser.Physics.Matter.Image {
    constructor(scene,x,y,offset) {
        super(scene.matter.world, x, y, 'seesaw');
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(0, 0, w, h);
        
        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.07,
            friction: 0.5,
            density: 0.5,
            label: 'SEESAW'
        });
        this.balanceOffset = offset != undefined ? offset:0;
        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setCollidesWith([CATEGORY.SOLANA,CATEGORY.BRIGHT,CATEGORY.DARK, CATEGORY.SOLID, CATEGORY.GROUND, CATEGORY.BULLET])
        .setPosition(x, y)
        .setIgnoreGravity(true)
        .setVisible(true)
        .setDepth(DEPTH_LAYERS.OBJECTS);

        this.pivotConstraint = Phaser.Physics.Matter.Matter.Constraint.create(
            {
              pointA: { x: this.x+this.balanceOffset, y: this.y },
              bodyB: this.body,
              pointB: { x: this.balanceOffset, y: 0 },
              length: 0,
              stiffness: 1
            }
          );
        this.scene.matter.world.add(this.pivotConstraint);
    }
    update()
    {

    }

}