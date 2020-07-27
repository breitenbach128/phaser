class EnemyStatue extends Phaser.Physics.Matter.Sprite{
    //Shriekers emit a high pitch sound wave that throws the players away. They shrink and hide if his by a light burst, solbomb or or if bright gets close enough.
    //The sound wave // ripple comes out quick and throws the player based on the angle they are to the shrieker. Solana and Dark will both take damage and be tossed.

    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'statue', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        //const mainBody =  Bodies.circle(0,0,w*.50);
        const mainBody =  Bodies.rectangle(0,0,w*0.95,h*0.90, {chamfer: {radius: 10}});

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0.01,
            frictionAir: 0.05,
            friction: 0.9,
            density: 0.01,
            restitution: 0.7,
            label: "ENEMY"
        });
        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.ENEMY)
        .setPosition(x, y) 
        .setDensity(0.01)
        .setDepth(DEPTH_LAYERS.OBJECTS)
        .setStatic(true);

        this.anims.play('status-blink',true);
        //Collision
        this.scene.matterCollision.addOnCollideStart({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;

            }
        });
        //Event Hook in
        this.scene.events.on("update", this.update, this);
        this.scene.events.on("shutdown", this.remove, this);

        //Status Weapon
        this.gun = new Gun(120,3,240);//ROF,MAGSIZE,RELOADTIME

        //Status Conditions
        this.isStunned = false;
    }
    update(){
        if(this.active){
            let solDis = distanceBetweenObjects(solana,this);
            let solSee = canSee(this,solana,losBlockers);
            if(solDis < 512 && solSee){
                this.barrage();
            }
        }
    }
    barrage(){
        //Shoot Ranged Weapon
        let bullet = bullets.get(-1000,-1000,'bullet');
        if (bullet && this.gun.ready)//ROF(MS)
        {
            //this.anims.play(this.texture.key+'-shoot', true);            
            
            bullet.setCollidesWith([ CATEGORY.GROUND, CATEGORY.SOLID, CATEGORY.SOLANA, CATEGORY.MIRROR, CATEGORY.SHIELD, CATEGORY.BRIGHT ]);
            bullet.setBounce(0.95);
            bullet.setFrictionAir(0.0);     
            bullet.setFixedRotation(true); 
            let aimVec = this.aim(solana); 
            bullet.fire(this.x, this.y, aimVec.x*3, aimVec.y*3, 1000);
            this.gun.shoot();//Decrease mag size. Can leave this out for a constant ROF.
        }
        if(this.gun){
            this.gun.update();
        }
    }
    aim(target){
        //Aimed shot with weapon.
        let angle = Phaser.Math.Angle.Between(this.x,this.y,target.x,target.y);
        let vecX = Math.cos(angle);
        let vecY = Math.sin(angle); 
        return {x:vecX,y:vecY};
    }
    remove(){
        this.active = false;
    }
    receiveDamage(damage){
        this.setTint(0x000000);
        this.active = false;
        this.stunTimer = this.scene.time.addEvent({ delay: damage*5000, callback: this.awake, callbackScope: this, loop: false });
    }
    awake(){
        this.active = true;
        this.clearTint();
    }
}