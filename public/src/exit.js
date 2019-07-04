var Exit = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function Exit (scene)
    {
        Phaser.GameObjects.Sprite.call(this, scene, -100, -100, 'exit');         

        this.scene = scene;
        scene.physics.add.existing(this);

        
    },
    setup: function(x,y,properties){
        this.alpha = .6;
        this.triggered = false;
        this.setActive(true);
        this.body.setAllowGravity(false);
        this.setPosition(x,y);
        this.targetMap = properties.targetMap;
    },
    update: function (time, delta)
    {


    },
    exitLevel: function(){
        if(!this.triggered){
            current_map = this.targetMap;
            this.triggered = true;
            let hud_scene = this.scene.scene.get('UIScene');
            hud_scene.clearHud();       
            this.scene.scene.restart();
        }
    }

});