var Bullet = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function Bullet (scene)
    {
        Phaser.GameObjects.Sprite.call(this, scene, -100, -100, 'bullet');
         
        this.damage = 1;    
        this.lifespan = 0;
        scene.physics.add.existing(this);
        
    },

    fire: function (x, y, flip, speedX,speedY, life)
    {

        if(flip){
            this.body.setVelocity(-speedX , speedY);
            this.x = x-64;
        }else{
            this.body.setVelocity(speedX , speedY);
            this.x = x+64;
        }

        this.y = y;
        this.setActive(true);
        this.setVisible(true);
        this.lifespan = life;
    },
    hit: function(){
        this.lifespan = 0;
    },
    bounceOff: function(){
        //Bounce off of object
    },
    update: function (time, delta)
    {
        
        this.lifespan -= 1;
        if (this.lifespan <= 0 && this.active)
        {
            this.destroy();
        }

    }

});