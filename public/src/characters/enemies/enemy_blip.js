class EnemyBlip extends Phaser.Physics.Matter.Sprite{ 
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'oilblob2', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        //const mainBody =  Bodies.circle(0,0,w*.50);
        const mainBody =  Bodies.circle(0,0,w*0.35);
        this.sensors = {
            bottom: Bodies.rectangle(0, h * 0.50, w * 0.32, 4, { isSensor: true }),
            top: Bodies.rectangle(0, -h * 0.50, w * 0.32, 4, { isSensor: true }),
            left: Bodies.rectangle(-w * 0.50, 0, 4, h * 0.32, { isSensor: true }),
            right: Bodies.rectangle(w * 0.50, 0, 4, h * 0.32, { isSensor: true })
          };
          this.sensors.bottom.label = "BLIP_BOTTOM";
          this.sensors.top.label = "BLIP_TOP";
          this.sensors.left.label = "BLIP_LEFT";
          this.sensors.right.label = "BLIP_RIGHT";

        const compoundBody = Body.create({
            parts: [mainBody, this.sensors.bottom,  this.sensors.top,  this.sensors.left,  this.sensors.right],
            frictionStatic: 0.01,
            frictionAir: 0.05,
            friction: 0.9,
            density: 0.01,
            restitution: 0.0,
            label: "BLIPPY"
        });
        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.ENEMY)
        .setPosition(x, y) 
        .setDensity(0.01)
        .setFixedRotation(true)
        .setDepth(DEPTH_LAYERS.OBJECTS);

        //this.anims.play('status-blink',true);
        //Collision
        this.scene.matterCollision.addOnCollideStart({
            objectA: [this.sensors.bottom,  this.sensors.top,  this.sensors.left,  this.sensors.right],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                if (gameObjectB !== undefined && 
                    (gameObjectB instanceof Phaser.GameObjects.Rectangle
                    || gameObjectB instanceof Phaser.GameObjects.Ellipse
                    || gameObjectB instanceof Phaser.GameObjects.Polygon)) {
                    if (bodyB.label == 'GROUND' && bodyA.label == "BLIP_BOTTOM"){ 
                        if(this.active){this.splat();}
                    }
                    if (bodyB.label == 'GROUND' && bodyA.label == "BLIP_RIGHT"){ 
                        this.wanderDirection = -1;
                    }
                    if (bodyB.label == 'GROUND' && bodyA.label == "BLIP_LEFT"){ 
                        this.wanderDirection = 1;
                    }

                }
                if (gameObjectB !== undefined && (gameObjectB instanceof SoulTransfer)){
                    if(this.active){
                        this.remove();
                    }
  
                }
                if (gameObjectB !== undefined && (gameObjectB instanceof Solana)){
                    if(this.active){
                        this.remove();
                        gameObjectB.receiveDamage(1);
                    }
                }


            }
        });
        this.scene.matterCollision.addOnCollideEnd({
            objectA: [this.sensors.bottom,  this.sensors.top,  this.sensors.left,  this.sensors.right],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                if (gameObjectB !== undefined && 
                    (gameObjectB instanceof Phaser.GameObjects.Rectangle
                    || gameObjectB instanceof Phaser.GameObjects.Ellipse
                    || gameObjectB instanceof Phaser.GameObjects.Polygon)) {
                    if (bodyB.label == 'GROUND' && bodyA.label == "BLIP_BOTTOM"){ 
                        if(this.active){this.spring();}
                    }
                }

            }
        });
        //Event Hook in
        this.scene.events.on("update", this.update, this);
        this.scene.events.on("shutdown", this.remove, this);
        //Timers
        this.moveTimer = this.scene.time.addEvent({ delay: 1500, callback: this.hunt, callbackScope: this, loop: false });
        //Variables
        this.wanderDirection = -1;
        this.movement = {xf: 0.008,yf:-0.035};
        this.isSplatting = false;
        this.isSpringing = false;
        //particles
        this.particles = this.scene.add.particles('shapes');
        this.particles.setDepth(this.depth-1);
        this.emitter_corruption = this.particles.createEmitter({
            active:true,
            x: this.x,
            y: this.y,
            frequency: 1,
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
    splat(){
        //Splats onto the ground, flattens
        if(this.isSplatting == false){
            this.isSplatting = true;
            this.splatTw = this.scene.tweens.add({
                targets: this,
                scaleY: 0.75,  
                scaleX: 1.25,
                ease: 'Linear',       
                duration: 200,
                onComplete: function(tween, targets, c){
                    c.reRound();
                }, 
                onCompleteParams: [this],
            });

        }

    }
    reRound(){
        if((this.isSplatting || this.isSpringing) && this.active ){
            this.isSplatting = false;
            this.isSpringing = false;
            this.scene.tweens.add({
                targets: this,
                scaleY: 1,  
                scaleX: 1,
                ease: 'Linear',       
                duration: 50,
            }); 
        }
    }
    spring(){
        //Leaves the ground during a jump
        if(this.isSpringing == false){
            this.isSpringing = true;
            
            this.springTw = this.scene.tweens.add({
                targets: this,
                scaleY: 1.25,  
                scaleX: 0.75,
                ease: 'Linear',       
                duration: 200,
                onComplete: function(tween, targets, c){
                    c.reRound();
                }, 
                onCompleteParams: [this],
            });

        }
        
    }
    update(){
        if(this.active){
            this.rotation = 0;
            this.emitter_corruption.setPosition(this.x,this.y);
        }
    }
    hunt(){
        this.applyForce({x:this.wanderDirection*this.movement.xf,y:this.movement.yf});
        //Run Timer again - Do this to allow controllable rate
        this.moveTimer = this.scene.time.addEvent({ delay: 1500, callback: this.hunt, callbackScope: this, loop: false });
    }
    canSee(target,obstacles){
        let rayTo = Phaser.Physics.Matter.Matter.Query.ray(obstacles,{x:this.x,y:this.y},{x:target.x,y:target.y});
        if(rayTo.length < 1){
            return true;
        }else{
            return false;
        }
        
    }
    remove(){
        this.active = false;
        this.particles.destroy();
        this.moveTimer.remove();
        this.springTw.remove();
        this.splatTw.remove();
        this.destroy();
    }
}