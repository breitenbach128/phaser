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
            x = x-64;
        }else{
            this.body.setVelocity(speedX , speedY);
            x = x+64;
        }

        
        this.setPosition(x,y);
        this.setActive(true);
        this.setVisible(true);
        //this.body.setBounce(.5,.5);
        this.lifespan = life;
        console.log(x, y, flip, speedX,speedY, life);
    },
    hit: function(){
        this.lifespan = 0;
        this.kill();
    },
    kill: function(){       
        this.body.setVelocity(0,0);
        this.setPosition(-100,-100);
        this.setActive(false);
        this.setVisible(false);
    },
    bounceOff: function(mirrorRotation){
        //Bounce off of object
        console.log("Bounce off",mirrorRotation);
    },
    update: function (time, delta)
    {
        if(this.active){
        this.lifespan--;
            if (this.lifespan <= 0)
            {
                this.kill();
            }
        }

    }

});