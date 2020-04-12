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
        .setVisible(false);   
        


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
        this.exitMarker.setVisible(false);
    }
    update(time, delta)
    {

        if(Phaser.Math.Distance.Between(this.x,this.y,solana.x,solana.y) < 256){
            this.exitMarker.setVisible(true);
        }else{
            this.exitMarker.setVisible(false);
        }


    }
    exitLevel(obj){
        if(!this.triggered && this.targetMap != "none" && this.targetExit != "none"){
            if(this.manualTrigger){
                if(obj.getControllerAction('up') > 0){
                    this.nextLevel();
                }
            }else{
                this.nextLevel();
            }
        }
    }
    nextLevel(){
        this.scene.soundTheme.stop();
        //First, Save State
        this.scene.saveData();
        //Then, Transition to new map
        current_map = this.targetMap;
        current_exit = this.targetExit;
        this.triggered = true;   
        this.scene.scene.restart();
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