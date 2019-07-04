var Mirror = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function Mirror (scene)
    {
        Phaser.GameObjects.Sprite.call(this, scene, -100, -100, 'mirror');      
 
        scene.physics.add.existing(this);
        this.minAngle = 0;
        this.maxAngle = 180;
        
        this.debug = scene.add.text(this.x, this.y-16, 'Mirror', { fontSize: '10px', fill: '#00FF00' });
    },
    setup: function(x,y,angle){
        this.setActive(true);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
        this.setPosition(x,y);
        this.angle = angle;
        this.minAngle = angle - 45;
        this.maxAngle = angle + 45;
    },
    update: function (time, delta)
    {       

        this.debug.setPosition(this.x, this.y-196);
        this.debug.setText("Angle:"+String(this.angle));
    },
    rotateMirror: function(x){
        this.angle+=x;

        if(this.angle > this.maxAngle){ this.angle = this.maxAngle; }
        if(this.angle < this.minAngle){ this.angle = this.minAngle; }
    }

});