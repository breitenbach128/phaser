class Exit extends Phaser.Physics.Matter.Sprite{
    
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'exit', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);

        this.sprite = this;

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this.sprite;
        const mainBody =  Bodies.rectangle(0, 0, w, h,{ isSensor: true });
        
        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1
        });

        this.sprite
        .setExistingBody(compoundBody)
        .setPosition(x, y)
        .setStatic(true)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setIgnoreGravity(true)
        .setVisible(false)
        .setDepth(DEPTH_LAYERS.PLAYERS);   
        //Variables
        this.touchedBy = []; // [Solana,Bright] AKA [P1,P2];
        //Collision
        this.scene.matterCollision.addOnCollideStart({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Solana) {
                    this.startTouch(0);
                    //current_exit.solana = this.targetExit;
                }
                if (gameObjectB !== undefined && gameObjectB instanceof Bright) {
                    this.startTouch(1);
                    //current_exit.bright = this.targetExit;
                }
            }
        });
        this.scene.matterCollision.addOnCollideEnd({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Solana) {
                    this.endTouch(0);                    
                }
                if (gameObjectB !== undefined && gameObjectB instanceof Bright) {
                    this.endTouch(1);
                }
            }
        });

    }
    setup(x,y,properties,name){
        this.name = name;
        this.alpha = .6;
        this.triggered = false;
        this.setActive(true);
        this.setPosition(x,y);
        this.targetMap = properties.targetMap;
        this.targetExit = properties.targetExit;
        this.manualTrigger = properties.manualTrigger ? true : false;
        this.partnerExitName = properties.partner ? properties.partner : 'none';
        this.partnerExit = null;
        //Make Exit marker
        let markerIndex = 0;//Assume East
        if(this.name.includes('west')){markerIndex = 1;}
        if(this.name.includes('door')){markerIndex = 2;}
        this.exitMarker = this.scene.add.sprite(this.x,this.y,'exit_marker',markerIndex);
        this.scene.tweens.add({
            targets: this.exitMarker,
            scale: 1.25,              
            ease: 'Linear',
            repeat: -1,
            yoyo: true,       
            duration: 700  
        });
        this.exitMarker.setDepth(this.depth+1);
        this.exitMarker.setVisible(false);
    }
    update(time, delta)
    {

        if(Phaser.Math.Distance.Between(this.x,this.y,solana.x,solana.y) < 256){
            this.exitMarker.setVisible(true);
        }else{
            this.exitMarker.setVisible(false);
        }

        if(this.manualTrigger){
            //Only Solana can operate doors
            if(this.touchedBy[0]){
                if(curr_player == players.SOLANA || playerMode > 0){
                    if(solana.getControllerAction('up') > 0){
                        this.checkTrans();
                    }
                }
            }
        }else{
            this.checkTrans();
        }


    }
    checkTrans(){
        let tCount = this.getTouchCount();
        if(tCount == 2){
            //Transition Level
            this.nextLevel();
        }else if(tCount == 1){
            if(this.partnerExitName != 'none'){
                let ptCount = this.partnerExit.getTouchCount();
                if(ptCount == 1){
                    //Transition Level
                    this.nextLevel();
                }
            };
        }
    }
    startTouch(id){
        this.touchedBy[id] = true;
        if(this.partnerExitName != 'none'){
            //Do partner lookup.
            let pName = this.partnerExitName;
            this.partnerExit = exits.getChildren().filter(function(e){return e.name==pName})[0];
        } 
    }
    getTouchCount(){
        return this.touchedBy.filter(function(v){return v===true}).length;
    }
    endTouch(id){
        this.touchedBy[id] = false;
    }
    nextLevel(){
        this.scene.soundTheme.stop();
        //First, Save State
        this.scene.saveData();
        //Then, Transition to new map
        this.setPlayerExits();
        current_map = this.targetMap;
        this.triggered = true;   
        this.scene.scene.restart();
    }
    setPlayerExits(){
        if(this.touchedBy[0]){current_exit.solana = this.targetExit;};
        if(this.touchedBy[1]){current_exit.bright = this.targetExit;};

        if(this.partnerExitName != 'none'){
            if(this.partnerExit.touchedBy[0]){current_exit.solana = this.partnerExit.targetExit;};
            if(this.partnerExit.touchedBy[1]){current_exit.bright = this.partnerExit.targetExit;};
            
        }
    }

};

//Entrance
var Entrance = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function Entrance (scene)
    {
        Phaser.GameObjects.Sprite.call(this, scene, -100, -100, 'entrance'); 
        this.scene = scene;        
        this.sprite = scene.matter.add.sprite(this);
        this.sprite.setIgnoreGravity(true);

        
    },
    setup: function(x,y,name){
        this.name = name;
        this.alpha = .6;
        this.setActive(true);
        this.setPosition(x,y);
    },
    update: function (time, delta)
    {


    },

});