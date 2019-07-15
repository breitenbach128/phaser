var Exit = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function Exit (scene)
    {
        Phaser.GameObjects.Sprite.call(this, scene, -100, -100, 'exit');         

        this.scene = scene;       
        this.sprite = scene.matter.add.sprite(this);
        this.sprite.setIgnoreGravity(true);

        
    },
    setup: function(x,y,properties,name){
        this.name = name;
        this.alpha = .6;
        this.triggered = false;
        this.setActive(true);
        this.setPosition(x,y);
        this.targetMap = properties.targetMap;
        this.targetExit = properties.targetExit;
    },
    update: function (time, delta)
    {


    },
    exitLevel: function(){
        if(!this.triggered && this.targetMap != "none" && this.targetExit != "none"){
            current_map = this.targetMap;
            current_exit = this.targetExit;
            this.triggered = true;
            hud.clearHud();       
            this.scene.scene.restart();
        }
    }

});

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