//When enemies are hit, they lose globs of oily shadow, of varying size, that fly off of them.
class Enemy extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'enemy1', 0)
        this.scene = scene;       
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);
        this.sprite = this;

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        
        const { width: w, height: h } = this.sprite;
        //const mainBody = Bodies.rectangle(0, 0, w * 0.6, h, { chamfer: { radius: 10 } });
        

        const mainBody = Bodies.rectangle(0, 0, w * 0.6, h-12, { chamfer: { radius: 5 } });
        this.sensors = {
          bottom: Bodies.rectangle(0, h*0.5-6, w * 0.25, 2, { isSensor: true }),
          left: Bodies.rectangle(-w * 0.35, 0, 2, h * 0.75, { isSensor: true }),
          right: Bodies.rectangle(w * 0.35, 0, 2, h * 0.75, { isSensor: true })
        };
        this.sensors.bottom.label = "ENEMY_BOTTOM";
        this.sensors.left.label = "ENEMY_LEFT";
        this.sensors.right.label = "ENEMY_RIGHT";
        this.touching = {up:0,down:0,left:0,right:0};

        const compoundBody = Body.create({
          parts: [mainBody, this.sensors.bottom, this.sensors.left, this.sensors.right],
          //parts: [mainBody],
          frictionStatic: 0,
          frictionAir: 0.02,
          friction: 0.00,
          restitution: 0.00,
          label: "ENEMY"
        });
       //Fix the draw offsets for the compound sprite.
        compoundBody.render.sprite.xOffset = .5;
        compoundBody.render.sprite.yOffset = .60;

        this.sprite
          .setExistingBody(compoundBody)
          .setCollisionCategory(CATEGORY.ENEMY)
          .setScale(1)
          .setFixedRotation(true) // Sets inertia to infinity so the player can't rotate
          .setPosition(config.x, config.y);
          //Custom Properties
          this.hp = 1;
          this.mv_speed = 1;
          this.aggroRNG = Phaser.Math.Between(0,100);
          this.aggroRange = 100;
          this.maxAggroRange = 400;
          this.gun = new Gun(60,4,70);
          this.dead = false;
          this.setScale(.5);
          this.setTint(0x333333);
          this.debug = scene.add.text(this.x, this.y-16, 'debug', { fontSize: '12px', fill: '#00FF00' });
    }
    update(time, delta)
    {
        if(!this.dead && solana.alive){
            var distanceToSolana = Phaser.Math.Distance.Between(solana.x,solana.y,this.x,this.y)
            if(distanceToSolana < this.aggroRange+this.aggroRNG){
                if(solana.x < this.x){
                    this.flipX = false;
                }else{
                    this.flipX = true;
                }
                this.anims.play('enemy-shoot', true);
                var bullet = bullets.get();
                if (bullet && this.gun.ready)//ROF(MS)
                {
                   
                    
                    let bullet = bullets.get();
                    if(this.sprite.flipX){
                        bullet.fire(this.x+36, this.y, 3, -1, 300);
                    }else{
                        bullet.fire(this.x-36, this.y, -3, -1, 300);
                    }
                    this.gun.shoot();//Decrease mag size. Can leave this out for a constant ROF.
                }
                if(this.gun){
                    this.gun.update();
                }
            }
            
            //Move towards solana 
            if(distanceToSolana > this.aggroRange+this.aggroRNG && distanceToSolana < this.maxAggroRange){
                
                if(solana.x < this.x){
                    this.sprite.setVelocityX(this.mv_speed*-1);
                    this.flipX = false;
                }else{
                    this.sprite.setVelocityX(this.mv_speed);
                    this.flipX = true;
                }
            }else{
                this.sprite.setVelocityX(0);
            }

            if(this.setVelocityX != 0){
                this.anims.play('enemy-walk', true);
            }else{
                this.anims.play('enemy-idle', true);
            }
        }


        this.debug.setPosition(this.x, this.y-64);
        this.debug.setText("AggroRange:"+String(this.aggroRange+this.aggroRNG)
        +"\nDtS:"+String(distanceToSolana));
    }
    death(animation, frame){
        
        if(animation.key == 'enemy-death'){
            this.setActive(false);
            this.setVisible(false);
            this.debug.setVisible(false);
            this.hp = 1;
            this.dead = false;
            this.destroy(); 
        }
    }
    receiveDamage(damage) {
        this.hp -= damage;           
        
        // if hp drops below 0 we deactivate this enemy
        if(this.hp <= 0 && !this.dead ) {
            this.dead = true; 
                     
            this.on('animationcomplete',this.death,this);            
            this.anims.play('enemy-death', false);
            
        }
    }
};
//Credits
/* 
Slime Monster
https://www.artstation.com/artwork/Xvzz3 
Jari Hirvikoski
2D & 3D Artist | Animator
*/