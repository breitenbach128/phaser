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
        this.scene = config.scene;
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

        this.debug = scene.add.text(this.x, this.y-16, 'Lever', { fontSize: '10px', fill: '#00FF00' });             


    }
    setup(x,y, properties,name){
        this.setActive(true);
        this.sprite.setIgnoreGravity(true);
        this.setPosition(x,y);
        this.name = name;
        this.leverPosition = 0;
        this.target = {name: -1,type: -1, object: -1};
        
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
        this.target.object = targetObject;
        //console.log("Set target for ", this.name);
    }
    triggerTarget(){
        if(this.target.object != -1){
            this.target.object.activateTrigger();
        }
    }
    useLever(){
        if(this.anims.isPlaying == false){
            //Animation is done.
            if(this.target.object != -1 && this.target.object.ready){
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

        this.sprite
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.BARRIER)
        .setPosition(x, y)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setStatic(true)
        .setIgnoreGravity(true);    

        this.debug = scene.add.text(this.x, this.y-16, 'gate', { fontSize: '10px', fill: '#00FF00' });             


    }
    setup(x,y,properties,name){
        this.setActive(true);
        
        this.setPosition(x,y);
        this.name = name;        
        this.ready = true;
        this.prevVel = {x:0,y:0};       
        this.mvdir = JSON.parse(properties.mvdir)
        this.isClosed = true;
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
                    duration: 3000,
                    onComplete: this.openComplete,
                    onCompleteParams: [ this, true ]
                });
            }else{
                this.scene.tweens.add({
                    targets: this,
                    x: this.closedPos.x,
                    y: this.closedPos.y,
                    ease: 'Power1',
                    duration: 3000,
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

        this.debug = scene.add.text(this.x, this.y-16, 'plate', { fontSize: '10px', fill: '#00FF00', resolution: 2 });             


    }
    setup(x,y, properties,name){
        this.setActive(true); 
        this.setPosition(x,y);
        this.name = name;
        this.platePosition = 0;
        this.target = {name: -1,type: -1, object: -1};
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
        this.debug.setText("Plate Position:"+String(this.platePosition));
    }
    setTarget(targetObject){
        this.target.object = targetObject;
        //console.log("Set target for ", this.name);
    }
    triggerTarget(){
        if(this.target.object != -1){
            this.target.object.activateTrigger();
        }
    }
    usePlate(){
        if(this.ready == true){
            this.ready = false;
            this.plateTimer = this.scene.time.addEvent({ delay: 1000, callback: this.plateComplete, callbackScope: this, loop: false });
            //Timer is done.
            if(this.target.object != -1 && this.target.object.ready){
                //Target is ready to operate?
                if(this.platePosition == 0){
                    this.platePosition = 1;
                    this.setFrame(1);
                    this.triggerTarget();
                }else{
                    this.platePosition = 0;
                    this.setFrame(0); 
                    this.triggerTarget();
                }
            }else{
                //Player chunk sound so play knows they can use the lever right now. Make sure sound only plays if not playing.
                console.log("Plate sound: Tink! Click!");
            }
        }

    }
    plateComplete(){
        //console.log("plate ready again");
        this.ready = true;
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

        this.debug = scene.add.text(this.x, this.y-16, 'TMXButton', { fontSize: '10px', fill: '#00FF00' });             


    }
    setup(x,y, properties,name){
        this.setActive(true);
        this.setPosition(x,y);
        this.name = name;
        this.buttonPosition = 0;
        this.target = {name: -1,type: -1, object: -1};
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
        this.target.object = targetObject;
        //console.log("Set target for ", this.name);
    }
    triggerTarget(){
        if(this.target.object != -1){
            this.target.object.activateTrigger();
        }
    }
    useButton(){
        if(this.anims.isPlaying == false){
            //Animation is done.
            if(this.target.object != -1 && this.target.object.ready){
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
            friction: 0.1
        });

        this.sprite
        .setExistingBody(compoundBody)
        .setPosition(x, y)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setStatic(true)
        .setIgnoreGravity(true);    

        this.debug = scene.add.text(this.x, this.y, 'Zone', { fontSize: '10px', fill: '#00FF00', resolution: 2 }).setOrigin(0.5);             
        

    }
    setup(x,y, properties,name,w,h){
        this.setActive(true);
        this.setPosition(x,y);
        this.alpha = 0.0;
        this.name = name;
        this.target = {name: -1,type: -1, object: -1};
        this.ready = [true,true];
        this.zonedata = {type:'trigger',value:0};
        this.allowReset = false;
        this.resetDelay = 100;
        this.resetTimer = [-1,-1];
        this.effect = -1;
        this.zoneWidth = w;
        this.zoneHeight = h;
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
        }
        //Types:
        //Target: Triggers a target
        //Hurt: Hurts the player
        //Force: Sends a force to a player
        //Teleport: Teleports the player via transform
       //console.log("setup",name, properties,this.target);
       if(this.zonedata.type == "force"){
            //Apply Wind Animation if wind
            //Rotate direction to match x/y vector
            this.sprite.anims.play('wind-1', true);
            let vectorParse = JSON.parse(this.zonedata.value);
            //var rad = Math.atan2(vectorParse.x, vectorParse.y);
            //this.setRotation(rad);
            if(vectorParse.x < 0){this.sprite.flipX  = true;};
       }else if(this.zonedata.type == "teleport"){
            this.effect=[
                this.scene.add.particles('shapes',  new Function('return ' + this.scene.cache.text.get('effect-trigger-teleporter'))())
            ];
            this.effect[0].setPosition(this.x,this.y);
            //Set visual toggle here / active toggle to only show if ready
            
            this.effect[0].emitters.list[0].setPosition({ min: -this.zoneWidth/2, max: this.zoneWidth/2 },this.y-this.zoneHeight*(3/4));
            this.effect[0].setActive(false);
            //Teleporter Gradient
            if(this.scene.textures.get("teleporter").key != "__MISSING"){  
                let oldTexture = this.scene.textures.get("teleporter");
                oldTexture.destroy();
            }
            this.texture = this.scene.textures.createCanvas('teleporter', this.zoneWidth , this.zoneHeight);
           
            //  We can access the underlying Canvas context like this:
            let grd = this.texture.context.createLinearGradient(0, 0, this.zoneWidth, this.zoneHeight);
            //let grd = this.texture.context.createRadialGradient(this.zoneWidth/2,this.zoneHeight/2,this.zoneWidth/4,this.zoneWidth/2,this.zoneHeight/2,this.zoneWidth+20);
            //this.texture.context.globalCompositeOperation = "destination-out";
            grd.addColorStop(0, "rgba(255, 255, 255, 0.0)");
            grd.addColorStop(1, "rgba(255, 255, 255, 0.2)");
        
            this.texture.context.fillStyle = grd;
            this.texture.context.fillRect(0, 0, this.zoneWidth, this.zoneHeight);
        
            //  Call this if running under WebGL, or you'll see nothing change
            this.texture.refresh();
            //this.setTexture('teleporter');
            this.teleporterGradeient = this.scene.add.image(this.x, this.y, 'teleporter');
            this.teleporterGradeient.setVisible(false);
            //this.teleporterGradeient.setAlpha(0.2);

       }
 
    }
    update(time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Zone Status:"+String(this.name)+":"+String(this.ready));
    }
    setTarget(targetObject){
        this.target.object = targetObject;
    }
    triggerReset(playerid){
        this.ready[playerid]  = true;
    }
    triggerTarget(playerid){
        if(this.target.object != -1){
            this.target.object.activateTrigger(playerid);
        }
    }
    activateTrigger(playerid){
        this.ready[playerid]  = true;
        if(this.zonedata.type == "teleport"){
            this.effect[0].setActive(true);
            this.teleporterGradeient.setVisible(true);
        }
    }
    useZone(playerid){

    }
    enterZone(obj,id){
        //Do something base on zome type

        if(this.ready[id] == true){
            this.ready[id] = false;
            //Solana Specific Functions
            if(id == 0){
                if(this.zonedata.type == "target"){
                    this.triggerTarget(id);
                }
                if(this.zonedata.type == "hurt"){
                    let hurtParse = JSON.parse(this.zonedata.value);
                    obj.receiveDamage(hurtParse.damage);
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

            if(this.zonedata.type == "teleport"){
                let positionParse = JSON.parse(this.zonedata.value)

                this.scene.time.addEvent({ 
                    delay: 1500, 
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
            frictionAir: 0.02,
            friction: 1,//Was 0.1
            label: 'PLATFORM'
        });

        this.sprite
        .setExistingBody(compoundBody)         
        .setCollisionCategory(CATEGORY.SOLID)
        //.setCollidesWith([ ~CATEGORY.SOLANA_UP ])
        .setPosition(x, y)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setStatic(true)
        .setIgnoreGravity(true);    

        this.debug = scene.add.text(this.x, this.y-16, 'platform', { fontSize: '10px', fill: '#00FF00' });             
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
        this.scene.matterCollision.addOnCollideEnd({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Solana && !gameObjectA.immobile) {
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
        this.platformPosition = 0;
        this.target = {name: -1,type: -1, object: -1};
        this.ready = true;
        this.setHighSpeed = 0;
        this.immobile = true;
        if(properties){
            this.target.name = properties.targetName;
            this.target.type = properties.targetType;
            this.path = JSON.parse(properties.path);
        }
       if(this.path){ 
            this.setPath(this.path) // test tween
            this.immobile = false;
       }else{
           this.immobile = true;
       }
       this.prev = {x:x,y:y};
 
    }
    update(time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText(this.name+" "+String(this.body.velocity.x.toFixed(4))+":"+String(this.body.velocity.y.toFixed(4)));
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
        this.target.object = targetObject;
        //console.log("Set target for ", this.name);
    }
    triggerTarget(){
        if(this.target.object != -1){
            this.target.object.activateTrigger();
        }
    }
    setPath(path){
        //For each coord in the array, start tweening to at a specific time. The coord array contains
        // x, y, time, hold objects for each tween x,y,t,h
        //positioning is relative
        var timeline = this.scene.tweens.createTimeline();
        timeline.loop = -1;
        path.forEach(function(e){
            timeline.add({
                targets: this,
                x: this.x+e.x,
                y: this.y+e.y,
                ease: 'Cubic.easeInOut',
                duration: e.t,
                hold: e.h
            });
        
        },this);

        timeline.play();
    }
    usePlatform(){
        if(this.ready == true){
            this.ready = false;            
            this.plateTimer = this.scene.time.addEvent({ delay: 1000, callback: this.plateComplete, callbackScope: this, loop: false });
            //Timer is done.
            if(this.target.object != -1 && this.target.object.ready){
                this.triggerTarget();
            }else{
                //Target not ready
            }
        }

    }
    plateComplete(){
        //console.log("plate ready again");
        //this.ready = true;
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
        this.target = {name: -1,type: -1, object: -1};
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
    }
    setTarget(targetObject){
        this.target.object = targetObject;
        //console.log("Set target for ", this.name,targetObject);
    }
    triggerTarget(){
        if(this.target.object != -1){
            this.target.object.activateTrigger();
        }
    }
    turnOn(){
        this.anims.play('lamp-turn-on', true); 
        this.brightness = this.max_brightness;
        this.triggerTarget();
    }
    turnOff(){
        this.anims.play('lamp-turn-off', true); 
        this.brightness = 0;
    }
    decay(){
        this.brightness = (this.brightness - this.decayRate );
        if(this.brightness  < 0){this.brightness = 0;};
    }
    update()
    {
        //Count brightness by animation frame? Might look good.
        if(this.decayRate > 0 && this.brightness > 0){
            this.decay();
        }
    }

}

