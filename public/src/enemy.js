//When enemies are hit, they lose globs of oily shadow, of varying size, that fly off of them.
class Enemy extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'enemy1', 0)
        this.scene = scene;       
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);
        console.log("Enemy Created",x,y);
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        
        const { width: w, height: h } = this;
        //const mainBody = Bodies.rectangle(0, 0, w * 0.6, h, { chamfer: { radius: 10 } });
        

        const mainBody = Bodies.rectangle(0, 0, w * 0.6, h-12, { chamfer: { radius: 1 } });
        this.sensors = {
          bottom: Bodies.rectangle(0, h*0.5-6, w * 0.25, 6, { isSensor: true }),
          left: Bodies.rectangle(-w * 0.35, 0, 6, h * 0.75, { isSensor: true }),
          right: Bodies.rectangle(w * 0.35, 0, 6, h * 0.75, { isSensor: true })
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
          friction: 0.10,
          restitution: 0.00,
          density: 0.03,
        });
       //Fix the draw offsets for the compound sprite.
        // compoundBody.render.sprite.xOffset = .5;
        // compoundBody.render.sprite.yOffset = .60;
        compoundBody.label = "ENEMY";

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.ENEMY)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setPosition(x, y);
          //Custom Properties

        this.hp = 1;
        this.mv_speed = 1;
        this.aggroRNG = Phaser.Math.Between(0,100);
        this.patrolDirection = -1;
        this.patrolRange = {min:0,max:0};
        this.aggroRange = 100;
        this.maxAggroRange = 400;
        this.gun = new Gun(60,4,70);
        this.dead = false;
        this.setScale(.5);
        this.setTint(0x333333);
        this.debug = scene.add.text(this.x, this.y-16, 'debug', { resolution: 2, fontSize: '12px', fill: '#00FF00' });
        this.groundTile = {x:0,y:0, updated: false};//Current Ground Tile

        //Setup Collision
        this.scene.matterCollision.addOnCollideStart({
            objectA: [this.sensors.bottom],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
              if (gameObjectB !== undefined && gameObjectB instanceof Phaser.Tilemaps.Tile) {
                // Now you know that gameObjectB is a Tile, so you can check the index, properties, etc.
                
                if (gameObjectB.properties.collides){
                    if(bodyA.label == "ENEMY_BOTTOM"){
                        if(this.groundTile.x != gameObjectB.x || this.groundTile.y != gameObjectB.y){
                            this.groundTile.x = gameObjectB.x;
                            this.groundTile.y = gameObjectB.y;
                            this.groundTile.updated = true;
                        }
                    }
                } 
              }
            }
        });

        this.behavior = {passive:'patrol',aggressive:'patrol'};
        this.setPatrolRange(64);//Default fixed patrol width is width of sprite.

    }
    update(time, delta)
    {
        if(!this.dead && solana.alive){
            this.rotation = 0;//Temp since the fixed rotation is not working.

            if(this.behavior.passive == 'patrol'){
                this.patrol();
            }else if(this.behavior.passive == 'patrolFixed'){
                this.patrolFixed();
            }

            //Idle Vs Move Animations
            if(this.body.velocity.x != 0){
                this.flipX = this.body.velocity.x < 0 ? false : true;
                this.anims.play('enemy-walk', true);
            }else{
                this.anims.play('enemy-idle', true);
            }
        }


        this.debug.setPosition(this.x, this.y-64);
        this.debug.setText("BehavPass:"+this.behavior.passive
        +"\nX:"+String(this.x)+", Y:"+String(this.y)
        +"\nPatrolWidth:"+String(this.patrolRange.min)+","+String(this.patrolRange.max));
    }
    barrage(){
        //Shoot Ranged Weapon
        var bullet = bullets.get();
        if (bullet && this.gun.ready)//ROF(MS)
        {
            this.anims.play('enemy-shoot', true);
            
            let bullet = bullets.get();
            if(this.flipX){
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
    hunt(){
        //Move towards solana 
        var distanceToSolana = Phaser.Math.Distance.Between(solana.x,solana.y,this.x,this.y)
        if(distanceToSolana < this.aggroRange+this.aggroRNG){           
            if(this.gun){this.barrage();}
        }
        if(distanceToSolana > this.aggroRange+this.aggroRNG && distanceToSolana < this.maxAggroRange){
            
            if(solana.x < this.x){
                this.setVelocityX(this.mv_speed*-1);
                this.flipX = false;
            }else{
                this.setVelocityX(this.mv_speed);
                this.flipX = true;
            }
        }else{
            this.setVelocityX(0);
        }
    }
    setPatrolRange(width){
        this.patrolRange = {min:this.x-width,max:this.x+width};
    }
    patrolFixed(){
        //A fixed distace patrol
        if((this.patrolDirection == -1 && (this.x) < (this.patrolRange.min))
        || (this.patrolDirection == 1 && (this.x) > (this.patrolRange.max))){
            this.patrolDirection = this.patrolDirection*-1;//Toggle
        }

        this.setVelocityX(this.mv_speed*this.patrolDirection);
    }
    patrol(){
        if(this.groundTile.updated){
            //Phaser.Physics.Matter.Matter.Query.point(this.scene.matter.world.localWorld.bodies, {x:this.x, y:this.y})
            //Just look at monster position and round to tile position. I dont even need to know my collision object.

            //METHOD 1 - Check One tile over from current tile. If null, reverse position
            // let checkTile = map.getTileAt((this.groundTile.x+this.patrolDirection), this.groundTile.y, true, this.scene.collisionLayer)
            // if(checkTile.index == -1){this.patrolDirection = this.patrolDirection*-1;}//Toggle

            //METHOD 2
            let checkTile = map.getTileAt((this.groundTile.x+this.patrolDirection), this.groundTile.y, true, this.scene.collisionLayer)
            if(checkTile.index == -1){//Toggle

                let ts= map.tileWidth;

                if((this.patrolDirection == -1 && (this.x) < (this.groundTile.x*ts+ ts/2))
                || (this.patrolDirection == 1 && (this.x) > (this.groundTile.x*ts + ts/2))){
                    this.patrolDirection = this.patrolDirection*-1;//Toggle
                }

            }
            this.setVelocityX(this.mv_speed*this.patrolDirection);
        }
    }
    patrolWaypoints(){

    }
    defend(){
        //Stand ground and attack when within range.
    }
    flee(){
        //Flee Away from Solana until outside aggro.
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

class EnemyFlying extends Enemy{

    constructor(scene,x,y) {
        super(scene, x, y);

        this.setIgnoreGravity(true);

        this.behavior = {passive:'patrolFixed',aggressive:'patrolFixed'};
    }
}
//Credits
/* 
Slime Monster
https://www.artstation.com/artwork/Xvzz3 
Jari Hirvikoski
2D & 3D Artist | Animator
*/