class EnemyShadow extends Phaser.Physics.Matter.Sprite{ 
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'shadow1', 0)
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
            frictionStatic: 0.10,
            frictionAir: 0.30,
            friction: 0.90,
            density: 0.01,
            restitution: 0.70,
            label: "SHADOW"
        });
        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.ENEMY)
        .setCollidesWith([CATEGORY.SOLANA, CATEGORY.BULLET])
        .setPosition(x, y) 
        .setDensity(0.01)
        .setDepth(DEPTH_LAYERS.OBJECTS)
        .setIgnoreGravity(true);

        //this.anims.play('status-blink',true);
        //Collision
        this.scene.matterCollision.addOnCollideStart({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                if(gameObjectB != undefined && gameObjectB instanceof Solana){
                    gameObjectB.receiveDamage(1);
                    this.remove();
                }
                if(gameObjectB != undefined && gameObjectB instanceof SoulTransfer){
                    let angleVec = this.aim(gameObjectB);
                    gameObjectB.burn();
                    let rRange = 32//Phaser.Math.Between(32,256);
                    this.teleport(this.x+(angleVec.x*-1*rRange),this.y+(angleVec.y*-1*rRange));
                }
            }
        });
        //Event Hook in
        this.scene.events.on("update", this.update, this);
        this.scene.events.on("shutdown", this.remove, this);
        //Variables
        this.alpha = 0.50;
        this.mv = 0.01;
        this.isFleeing = false;
        this.isCharging = false;
        this.shakeTween = null;
        //Timers
        this.fleeTimer = this.scene.time.addEvent({ delay: 0, callback: function(){this.isFleeing = false;}, callbackScope: this, loop: false });
        //particles
        this.particles = this.scene.add.particles('shapes');
        this.particles.setDepth(this.depth-1);
        this.emitter_corruption = this.particles.createEmitter({
            active:false, //Set to false for new to test
            x: this.x,
            y: this.y,
            frequency: 0,
            frame: {
                frames: [
                    "circle_05"
                ],
                cycle: false,
                quantity: 1
            },
            scale: { start: 0.5, end: 0.0 },
            alpha: { start: 1, end: 0 },
            blendMode: 'NORMAL',
            tint: [
                4263489
            ]
        });
    }
    update(){
       
        if(this.active){
            //this.emitter_corruption.setPosition(this.x,this.y);            
            let slDis = distanceBetweenObjects(soullight,this);
            let solDis = distanceBetweenObjects(solana,this);
            if(this.isFleeing){
                let dir = this.aim(soullight);
                this.applyForce({x:-dir.x*this.mv,y:-dir.y*this.mv});

            }else{

                if(slDis < soullight.protection_radius.value && canSee(this,soullight,losBlockers)){                    
                    this.isFleeing = true;
                    this.fleeTimer = this.scene.time.addEvent({ delay: 3000, callback: function(){this.isFleeing = false;}, callbackScope: this, loop: false });                   
                }else{
                    if(canSee(this,solana,losBlockers) || solDis < 256){
                        let dir = this.aim(solana);
                        let mvsp = this.mv;                        
                        if(solDis < 96){                            
                            if(this.isCharging){
                                mvsp = this.mv*3;
                            }else{
                                this.shakeTween = shakeGameObject(this.scene,this,1,100,3,function(tw,tgs,obj){obj.isCharging = true;})
                                mvsp = 0;
                            }
                        }
                        this.applyForce({x:dir.x*mvsp,y:dir.y*mvsp});
                    }else{
                        //Random Wander?
                    }
                }
            }
            if(this.body.velocity.x > 0){this.flipX = true};
            if(this.body.velocity.x < 0){this.flipX = false};
        }
    }
    teleport(x,y){
        this.setPosition(x,y);
        if(checkWithinMap(this.x,this.y) == false){

        }
        console.log("teleport shadow to:",x,y);
        //Currently can end up off the level, which blocks los. That's a problem. I need to pick better locations to drop them.
    }
    death(){        
        this.on('animationcomplete',this.remove,this); 
        this.anims.play('shadow-death',true);
    }
    remove(){
        this.active = false;        
        this.particles.destroy();
        this.fleeTimer.remove();
        if(this.shakeTween != null){this.shakeTween.remove();}
        this.destroy();
    }
    aim(target){
        //Aimed shot with weapon.
        let angle = Phaser.Math.Angle.Between(this.x,this.y,target.x,target.y);
        let vecX = Math.cos(angle);
        let vecY = Math.sin(angle); 
        return {x:vecX,y:vecY};
    }
}