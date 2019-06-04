var Bullet = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function Bullet (scene)
    {
        Phaser.GameObjects.Sprite.call(this, scene, -100, -100, 'bullet');
         
        this.damage = 1;    
        this.lifespan = 0;
        scene.physics.add.existing(this);
    },

    fire: function (x, y, flip, speed, life)
    {
        this.speed = speed;
        
        if(flip){
            this.setPosition(x-64, y);
            this.speed = this.speed*-1;
        }else{
            this.setPosition(x+64, y);
        }

        this.setActive(true);
        this.setVisible(true);
        this.lifespan = life;
    },
    hit: function(){
        this.lifespan = 0;
    },
    update: function (time, delta)
    {
        this.body.velocity.x = this.speed;
        this.lifespan -= 1;
        if (this.lifespan <= 0 && this.active)
        {
            this.destroy();
            // this.setActive(false);
            // this.setVisible(false);
        }

    }

});