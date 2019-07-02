var Mirror = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function Mirror (scene)
    {
        Phaser.GameObjects.Sprite.call(this, scene, -100, -100, 'mirror');      
 
        scene.physics.add.existing(this);
        
    },
    update: function (time, delta)
    {       


    }

});