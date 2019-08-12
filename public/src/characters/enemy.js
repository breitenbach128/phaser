//When enemies are hit, they lose globs of oily shadow, of varying size, that fly off of them.
var ENEMY_WEAPONS = [
    {name: 'slime_lob',prjTexture:'bullet',prjLife:600,prjVec:Phaser.Math.Vector2(1,-1),range:128,onDeath:[]},
    {name: 'slime_melee',prjTexture:'bullet',prjLife:1,prjVec:Phaser.Math.Vector2(1,0),range:0,onDeath:[]},
    {name: 'slime_shoot',prjTexture:'bullet',prjLife:600,prjVec:Phaser.Math.Vector2(1,0),range:128,onDeath:[]},
    {name: 'slime_bomb',prjTexture:'bullet',prjLife:600,prjVec:Phaser.Math.Vector2(1,-1),range:128,onDeath:[{effect:'explode',count:5,damage:1}]},
    {name: 'claw',prjTexture:'bullet',prjLife:1,prjVec:Phaser.Math.Vector2(1,0),range:0,onDeath:[]},
    {name: 'darkblip_shoot',prjTexture:'bullet',prjLife:600,prjVec:Phaser.Math.Vector2(1,0),range:128,onDeath:[]},
]

class Enemy extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y,texture) {
        super(scene.matter.world, x, y, texture, 0)
        this.scene = scene;       
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);
        //console.log("Enemy Created",x,y, texture,this.texture.key);
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
        this.patrolDirection = -1;
        this.patrolRange = {min:0,max:0};
        this.aggroRange = 400;
        this.gun = new Gun(60,4,70);
        this.dead = false;
        this.setScale(.5);
        this.setTint(0x333333);
        this.debug = scene.add.text(this.x, this.y-16, 'debug', { resolution: 2, fontSize: '12px', fill: '#00FF00' });
        this.groundTile = {x:0,y:0, updated: false};//Current Ground Tile

        //Setup Collision
        this.scene.matter.world.on('beforeupdate', function (event) {
            this.touching.left = 0;
            this.touching.right = 0;
            this.touching.up = 0;
            this.touching.down = 0;    
        },this);
        this.scene.matterCollision.addOnCollideStart({
            objectA: [this.sensors.left,this.sensors.right],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                if (gameObjectB !== undefined && gameObjectB instanceof TMXGate) {
                    if(bodyA.label == "ENEMY_LEFT"){
                        this.touching.left++;
                    }
                    if(bodyA.label == "ENEMY_RIGHT"){
                        this.touching.right++;
                    }
                  }
            }
        });
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

        this.behavior = {passive:'patrol',aggressive:'attack', weapon: -1};
        this.setPatrolRange(64);//Default fixed patrol width is width of sprite.
        this.waypoints = [Phaser.Math.Vector2(this.x,this.y)];
        this.waypointsIndex = 0;
        this.distanceToSolana = 99999;;

    }
    update(time, delta)
    {
        if(!this.dead && solana.alive){

            this.distanceToSolana = Phaser.Math.Distance.Between(solana.x,solana.y,this.x,this.y);

            this.rotation = 0;//Temp since the fixed rotation is not working.

            if(this.behavior.passive == 'patrol'){
                this.patrol();
            }else if(this.behavior.passive == 'patrolFixed'){
                this.patrolFixed();
            }

            if(this.behavior.aggressive == 'attack'){
                this.attack();
            }

            //Idle Vs Move Animations
            if(this.body.velocity.x != 0){
                this.flipX = this.body.velocity.x < 0 ? false : true;
                this.anims.play(this.texture.key+'-move', true);
            }else{
                this.anims.play(this.texture.key+'-idle', true);
            }
        }


        this.debug.setPosition(this.x, this.y-64);
        this.debug.setText("BehavPass:"+this.behavior.passive
        +"\nX:"+String(this.x>>0)+", Y:"+String(this.y>>0)
        +"\nPatrolWidth:"+String(this.patrolRange.min)+","+String(this.patrolRange.max));
    }
    barrage(){
        //Shoot Ranged Weapon
        var bullet = bullets.get();
        if (bullet && this.gun.ready)//ROF(MS)
        {
            this.anims.play(this.texture.key+'-shoot', true);
            
            let bullet = bullets.get();
            if(this.flipX){
                bullet.fire(this.x+this.width, this.y, this.behavior.weapon.prjVec.x, this.behavior.weapon.prjVec.y, this.behavior.weapon.prjLife);
            }else{
                bullet.fire(this.x-this.width, this.y, -this.behavior.weapon.prjVec.x, this.behavior.weapon.prjVec.y, 300);
            }
            this.gun.shoot();//Decrease mag size. Can leave this out for a constant ROF.
        }
        if(this.gun){
            this.gun.update();
        }
    }
    attack(){
        let atkRng = this.width/2;

        if(this.behavior.weapon != -1){
            atkRng = this.behavior.weapon.range;
            if(this.distanceToSolana < this.behavior.weapon.range){           
                if(this.gun){this.barrage();}
            }
        }
    }  
    hunt(speedMod){
        //Move towards solana if within aggro.  

        if(this.distanceToSolana > this.width/2 && this.distanceToSolana < this.aggroRange){
            
            if(solana.x < this.x){
                this.setVelocityX(this.mv_speed*-1*speedMod);
                this.flipX = false;
            }else{
                this.setVelocityX(this.mv_speed*speedMod);
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
            if(checkTile != null){
                if(checkTile.index == -1){//Toggle

                    let ts= map.tileWidth;

                    if((this.patrolDirection == -1 && (this.x) < (this.groundTile.x*ts+ ts/2))
                    || (this.patrolDirection == 1 && (this.x) > (this.groundTile.x*ts + ts/2))){
                        this.patrolDirection = this.patrolDirection*-1;//Toggle
                    }

                }
            }
            if(this.touching.left > 0 || this.touching.right > 0){this.patrolDirection = this.patrolDirection*-1;}
            this.setVelocityX(this.mv_speed*this.patrolDirection);
        }
    }
    patrolWaypoints(){
        let destPoint = this.wapoints[this.waypointsIndex];
        if(this.x < destPoint.x){
            this.setVelocityX(this.mv_speed);
        }else if(this.x > destPoint.x){
            this.setVelocityX(this.mv_speed*-1);
        }

        if(this.body.ignoreGravity == false){
            if(this.y < destPoint.y){
                this.setVelocityY(this.mv_speed);
            }else if(this.y > destPoint.y){
                this.setVelocityY(this.mv_speed*-1);
            }
        }
        let distanceToDestination = Phaser.Math.Distance.Between(this.x,this.y,destPoint.x,destPoint.y);
        if(distanceToDestination < this.width){
            this.waypointsIndex++;
            if(this.waypointsIndex >= this.wapoints.length){this.waypointsIndex=0;}
        }
    }
    charge(){
        //Enemy Rushes at double speed towards solana and attempts to touch
        this.hunt(2);//Hunt at twice speed
    }
    defend(){
        //Stand ground and attack when within range.
        let distanceToSolana = this.distanceToSolana;
        let atkRng = this.width/2;

        if(this.behavior.weapon != -1){
            atkRng = this.behavior.weapon.range;
            if(distanceToSolana < this.behavior.weapon.range){           
                if(this.gun){this.barrage();}
            }
        }
    }
    flee(){
        //Flee Away from Solana until outside aggro.
        this.hunt(-1);//Just hunt in the opposite direction
    }
    setBehavior(p,a,wp){
        this.behavior = {passive:p,aggressive:a,weapon:ENEMY_WEAPONS[wp]};
    }
    death(animation, frame){
        
        if(animation.key == this.texture.key+'-death'){
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
            this.anims.play(this.texture.key+'-death', false);
            
        }
    }
};

class EnemyFlying extends Enemy{

    constructor(scene,x,y,texture) {
        super(scene, x, y, texture);

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