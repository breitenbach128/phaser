var Bullet = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function Bullet (scene)
    {
        Phaser.GameObjects.Sprite.call(this, scene, -100, -100, 'bullet');
         
        this.damage = 1;    
        this.lifespan = 0;
        this.bounced = false;
        this.speed = 0;
        this.scene = scene;
        scene.physics.add.existing(this);
        
        
    },

    fire: function (x, y, flip, speed, velx,vely, life)
    {
        

        if(flip){
            this.body.setVelocity(-velx*speed , vely*speed);
            x = x-64;
        }else{
            this.body.setVelocity(velx*speed , vely*speed);
            x = x+64;
        }

        this.speed = speed;
        
        this.setPosition(x,y);
        this.setActive(true);
        this.setVisible(true);
        //this.body.setBounce(.5,.5);
        this.lifespan = life;
        this.bounced = false;
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
    bounceOff: function(angle,mirrorSize,mirrorX,mirrorY){
        //Bounce off of object
        console.log("Bounce off",Phaser.Math.RadToDeg(angle));
        //Set new position
        // let x = (mirrorSize * Math.sin(angle)) + mirrorX;
        // let y = (mirrorSize * -Math.cos(angle)) + mirrorY;

        // this.setPosition(x,y);
        //Apply veloctiy
        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
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