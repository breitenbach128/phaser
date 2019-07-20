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

        this.debug = scene.add.text(this.x, this.y-16, 'gate', { fontSize: '10px', fill: '#00FF00' });             


    }
    setup(x,y, properties,name){
        this.setActive(true);
        
        this.setPosition(x,y);
        this.name = name;
        this.closedY = y;
        this.openY = y - this.height;
        this.ready = true;
 
    }
    update(time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Gate Position:"+String(this.y));
    }
    activateTrigger(){
        
        if(this.ready){
            //console.log("Gate not moving: Trigger Gate");
            this.ready = false;

            if(this.y == this.closedY){
                this.scene.tweens.add({
                    targets: this,
                    y: this.openY,
                    ease: 'Power1',
                    duration: 3000,
                    onComplete: this.openComplete,
                    onCompleteParams: [ this ]
                });
            }else{
                this.scene.tweens.add({
                    targets: this,
                    y: this.closedY,
                    ease: 'Power1',
                    duration: 3000,
                    onComplete: this.openComplete,
                    onCompleteParams: [ this ]
                });
            }            
        }

    }
    openComplete(tween, targets, myGate){
        //console.log("Gate Tween Finished");
        myGate.ready = true;
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
        const mainBody =  Bodies.rectangle(0, 0, w, h);

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

        this.debug = scene.add.text(this.x, this.y-16, 'plate', { fontSize: '10px', fill: '#00FF00' });             


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

        this.debug = scene.add.text(this.x, this.y-16, 'Zone', { fontSize: '10px', fill: '#00FF00' });             


    }
    setup(x,y, properties,name){
        this.setActive(true);
        this.setPosition(x,y);
        this.alpha = .3;
        this.name = name;
        this.target = {name: -1,type: -1, object: -1};
        this.ready = true;
        this.zonedata = {type:'trigger',value:0};
        this.allowReset = false;
        this.resetDelay = 100;
        this.resetTimer = -1;
        //Zones can do certain things.
        //
        if(properties){
            this.target.name = properties.targetName;
            this.target.type = properties.targetType;
            this.zonedata.type = properties.zoneType;
            this.zonedata.value = properties.zoneValue;
            this.allowReset = properties.allowReset;
            this.resetDelay =properties.resetDelay;
        }
        //Types:
        //Target: Triggers a target
        //Hurt: Hurts the player
        //Force: Sends a force to a player
        //Teleport: Teleports the player via transform
       //console.log("setup",name, properties,this.target);
 
    }
    update(time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Zone Status:"+String(this.name));
    }
    setTarget(targetObject){
        this.target.object = targetObject;
        //console.log("Set target for ", this.name);
    }
    triggerReset(){
        this.ready  = true;
    }
    triggerTarget(){
        if(this.target.object != -1){
            this.target.object.activateTrigger();
        }
    }
    enterZone(obj){
        //Do something base on zome type
        if(this.ready == true){
            this.ready = false;

            if(this.zonedata.type == "target"){
                this.triggerTarget();
            }
            if(this.zonedata.type == "hurt"){
                let hurtParse = JSON.parse(this.zonedata.value);
                obj.receiveDamage(hurtParse.damage);
            }
            if(this.zonedata.type == "force"){
                let vectorParse = JSON.parse(this.zonedata.value);
                obj.getThrown(vectorParse.x,vectorParse.y,vectorParse.time);
            }
            if(this.zonedata.type == "teleport"){
                let positionParse = JSON.parse(this.zonedata.value)
                obj.setPosition(positionParse.x,positionParse.y);
            }

            if(this.allowReset){
                this.resetTimer = this.scene.time.addEvent({ delay: this.resetDelay, callback: this.triggerReset, callbackScope: this, loop: false });
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

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 1,//Was 0.1
            label: 'PLATFORM'
        });

        this.sprite
        .setExistingBody(compoundBody)
        .setPosition(x, y)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setStatic(true)
        .setIgnoreGravity(true);    

        this.debug = scene.add.text(this.x, this.y-16, 'platform', { fontSize: '10px', fill: '#00FF00' });             


    }
    setup(x,y, properties,name){
        this.setActive(true); 
        this.setPosition(x,y);
        this.name = name;
        this.platformPosition = 0;
        this.target = {name: -1,type: -1, object: -1};
        this.ready = true;
        if(properties){
            this.target.name = properties.targetName;
            this.target.type = properties.targetType;
        }
       //console.log("setup",name, properties,this.target);
       this.setPath() // test tween
       this.prev = {x:x,y:y};
 
    }
    update(time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText(this.name
            +"\nVel: X:"+String(this.body.velocity.x)+" Y:" + String(this.body.velocity.y));
        // body is static so must manually update velocity for friction to work
        this.setVelocityX((this.x - this.prev.x));
        this.prev.x = this.x;
        this.prev.y = this.y
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
    setPath(){
        //For each coord in the array, start tweening to at a specific time. The coord array contains
        // x, y, time objects for each tween

        //test tween
        let tween = this.scene.tweens.add({
            targets: this,
            x: this.x+50,               // '+=100'
            y: this.y,               // '+=100'
            ease: 'Linear',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
            duration: 6000,
            repeat: -1,            // -1: infinity
            yoyo: true,
            hold: 1000
        });

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
};