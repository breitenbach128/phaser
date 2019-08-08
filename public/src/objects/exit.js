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
    }
    update(time, delta)
    {


    }
    exitLevel(){
        if(!this.triggered && this.targetMap != "none" && this.targetExit != "none"){
            current_map = this.targetMap;
            current_exit = this.targetExit;
            this.triggered = true;
            hud.clearHud();       
            this.scene.scene.restart();
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