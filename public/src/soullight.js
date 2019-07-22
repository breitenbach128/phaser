class SoulLight extends Phaser.Physics.Matter.Sprite{
    constructor(config,owner) {
        super(config.scene.matter.world, config.x, config.y, config.sprite, config.frame)
        this.scene = config.scene;
        // Create the physics-based sprite that we will move around and animate
        //this.sprite = this.scene.matter.add.sprite(config.x, config.y, config.sprite, config.frame);
        config.scene.matter.world.add(this);
        // config.scene.sys.displayList.add(this);
        // config.scene.sys.updateList.add(this);
        config.scene.add.existing(this); // This adds to the two listings of update and display.

        this.setActive(true);

        this.sprite = this;

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this.sprite;
        const mainBody = Bodies.circle(0,0,w*.20, { isSensor: true });

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1,
            label: "SOULLIGHT"
          });
          this.sprite
            .setExistingBody(compoundBody)
            .setPosition(config.x, config.y)
            .setIgnoreGravity(true);

        this.owner = owner.sprite;

        this.ownerid = 0;
        

        this.debug = this.scene.add.text(this.x, this.y-16, 'SoulLight', { fontSize: '10px', fill: '#00FF00' });              
        this.passing = false;  
        this.threshhold_distance = 64;  
        this.move_speed = 1;
        this.base_speed = 1;
        this.max_speed = 5; 
        this.accel = 1;
        this.sprite.setFriction(.3,.3);
        this.sprite.setIgnoreGravity(true);
        this.protection_radius = 250;//How much does the light protect
        this.throw = {x:0,y:0};
    }

    update(time,delta)
    {
        
        this.setVelocity(this.throw.x*this.max_speed,this.throw.y*this.max_speed);
        if(this.body.velocity.x > this.max_speed){this.setVelocityX(this.max_speed)};
        if(this.body.velocity.x < -this.max_speed){this.setVelocityX(-this.max_speed)};
        if(this.body.velocity.y > this.max_speed){this.setVelocityY(this.max_speed)};
        if(this.body.velocity.y < -this.max_speed){this.setVelocityY(-this.max_speed)};

        this.debug.setPosition(this.sprite.x+16, this.sprite.y-32);
        this.debug.setText("Passing:"+String(this.passing)
        +" \nSpeed:"+String(this.body.velocity.x) + ":" + String(this.body.velocity.y));

        if(!this.passing){
            this.setPosition(this.owner.x,this.owner.y);
        }
    }
    

    passLight(x,y){
        if(!this.passing){
            this.passing = true;
            this.throw.x = x;
            this.throw.y = y;
        }
    }
    lockLight(target,id){
        if(id != this.ownerid){
            this.passing = false;
            this.ownerid = id;
            this.owner = target;
            if(id == 0){
                bright.toDark();
            }else if(id == 1){
                bright.toBright();
            }    
        }    
    }

}

