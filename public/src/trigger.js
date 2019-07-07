//A general purpose TMX trigger file

// This will allow for a broad range of items that can be defined by properties in TMX.
// TMXButton,TMXLever,TMXZone, TMXPressure, TMXDestructable, TMXGate
// TMX Button: An interactive button that can be pushed to trigger. Solana can press up to push it.
// TMX Lever: Solana can use up and down to switch back and forth.
// TMX Zone: An effect(s) happens when the player enters the zone.  Can apply physics, hurt player, cause particles and sprites, etc.
// TMX Pressure: Buttons that are only affected by pushing on them. Dark can drop from above to trigger pressure plats.
// TMX Destructable: Can be destroyed to reveal new areas or secrets.
// TMX Gate: A door that lifts up to allow access to another area.

var TMXLever = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function TMXLever (scene)
    {
        Phaser.GameObjects.Sprite.call(this, scene, -100, -100, 'lever');      
 
        scene.physics.add.existing(this);
  
        
        this.debug = scene.add.text(this.x, this.y-16, 'Lever', { fontSize: '10px', fill: '#00FF00' });
    },
    setup: function(x,y, properties,name){
        this.setActive(true);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);  
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
 
    },
    update: function (time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Lever Position:"+String(this.leverPosition));
    },
    setTarget(targetObject){
        this.target.object = targetObject;
        //console.log("Set target for ", this.name);
    },
    triggerTarget(){
        if(this.target.object != -1){
            this.target.object.activateTrigger();
        }
    },
    useLever: function(){
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

    },
});

var TMXGate = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function TMXGate (scene)
    {
        Phaser.GameObjects.Sprite.call(this, scene, -100, -100, 'gate');      
 
        scene.physics.add.existing(this);
        this.scene = scene;
        
        this.debug = scene.add.text(this.x, this.y-16, 'gate', { fontSize: '10px', fill: '#00FF00' });
    },
    setup: function(x,y, properties,name){
        this.setActive(true);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);  
        this.setPosition(x,y);
        this.name = name;
        this.closedY = y;
        this.openY = y - this.height;
        this.ready = true;
 
    },
    update: function (time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Gate Position:"+String(this.y));
    },
    activateTrigger: function(){
        
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

    },
    openComplete: function(tween, targets, myGate){
        //console.log("Gate Tween Finished");
        myGate.ready = true;
    }
});

var TMXPlate = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function TMXPlate (scene)
    {
        Phaser.GameObjects.Sprite.call(this, scene, -100, -100, 'pressure_plate');      
 
        scene.physics.add.existing(this);
        this.scene = scene;
        
        this.debug = scene.add.text(this.x, this.y-16, 'Plate', { fontSize: '10px', fill: '#00FF00' });
    },
    setup: function(x,y, properties,name){
        this.setActive(true);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);  
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
 
    },
    update: function (time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Plate Position:"+String(this.platePosition));
    },
    setTarget(targetObject){
        this.target.object = targetObject;
        //console.log("Set target for ", this.name);
    },
    triggerTarget(){
        if(this.target.object != -1){
            this.target.object.activateTrigger();
        }
    },
    usePlate: function(){
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

    },
    plateComplete: function(){
        //console.log("plate ready again");
        this.ready = true;
    }
});
var TMXButton = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function TMXButton (scene)
    {
        Phaser.GameObjects.Sprite.call(this, scene, -100, -100, 'tmxbutton');      
 
        scene.physics.add.existing(this);
        this.scene = scene;
        
        this.debug = scene.add.text(this.x, this.y-16, 'TMXButton', { fontSize: '10px', fill: '#00FF00' });
    },
    setup: function(x,y, properties,name){
        this.setActive(true);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);  
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
 
    },
    update: function (time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Button Position:"+String(this.platePosition));
    },
    setTarget(targetObject){
        this.target.object = targetObject;
        //console.log("Set target for ", this.name);
    },
    triggerTarget(){
        if(this.target.object != -1){
            this.target.object.activateTrigger();
        }
    },
    useButton: function(){
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
});
var TMXZone = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function TMXZone (scene)
    {
        Phaser.GameObjects.Sprite.call(this, scene, -100, -100, 'triggerzone');      
 
        scene.physics.add.existing(this);
        this.scene = scene;
        
        this.debug = scene.add.text(this.x, this.y-16, 'Zone', { fontSize: '10px', fill: '#00FF00' });
    },
    setup: function(x,y, properties,name){
        this.setActive(true);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);  
        this.setPosition(x,y);
        this.alpha = .3;
        this.name = name;
        this.target = {name: -1,type: -1, object: -1};
        this.ready = true;
        this.zonedata = {type:'trigger',value:0};
        //Zones can do certain things.
        //
        if(properties){
            this.target.name = properties.targetName;
            this.target.type = properties.targetType;
            this.zonedata.type = properties.zoneType;
            this.zonedata.value = properties.zoneValue;

        }
       //console.log("setup",name, properties,this.target);
 
    },
    update: function (time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Zone Status:"+String(this.name));
    },
    setTarget(targetObject){
        this.target.object = targetObject;
        //console.log("Set target for ", this.name);
    },
    triggerTarget(){
        if(this.target.object != -1){
            this.target.object.activateTrigger();
        }
    },
    enterZone: function(){
        if(this.ready == true){
            this.ready = false;
            this.triggerTarget();
            console.log("Zone Entered",this.name);
        }

    }
});