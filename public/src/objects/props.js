class PropInchworm extends Phaser.Physics.Matter.Sprite{    
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'inchworm-1', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(0, 0, w*0.80, h*0.50,{chamfer: {radius: 2}});
        
        this.sensors = {
            left: Bodies.rectangle(-w*0.60, 0, 3, h*0.50 , {chamfer: {radius: 1}, isSensor: true, friction: 0.0,density: 0.0001,label:"SENSOR_LEFT"}),
            right: Bodies.rectangle(w*0.60, 0, 3, h*0.50 , {chamfer: {radius: 1}, isSensor: true, friction: 0.0,density: 0.0001,label:"SENSOR_RIGHT"})
          };
        const compoundBody = Body.create({
            parts: [mainBody,this.sensors.left,this.sensors.right],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.3,
            label: "INCHWORM"
        });

        this
        .setExistingBody(compoundBody)
        .setCollidesWith([CATEGORY.GROUND])
        .setPosition(x, y)  

        this.anims.play('inchworm-crawl',true);
        this.setDepth(DEPTH_LAYERS.FG);
        this.crawlTimer = this.scene.time.addEvent({ delay: 500, callback: this.crawl, callbackScope: this, loop: true });        
        this.touching = {top:0,left:0,bottom:0,right:0};
        this.wanderdirection = Phaser.Math.Between(-1,1);
        this.scene.matterCollision.addOnCollideStart({
            objectA: [this.sensors.left,this.sensors.right],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                if (gameObjectB !== undefined && 
                    (gameObjectB instanceof Phaser.GameObjects.Rectangle
                    || gameObjectB instanceof Phaser.GameObjects.Ellipse
                    || gameObjectB instanceof Phaser.GameObjects.Polygon)) {
                        if (bodyB.label == 'GROUND'){
                            if(bodyA.label == "SENSOR_RIGHT"){
                                this.wanderdirection = -1;
                            }
                            if(bodyA.label == "SENSOR_LEFT"){
                                this.wanderdirection = 1;
                            }
                        }                
                }
            }
        });
    }
    update(time, delta)
    {

    }
    crawl(){
        this.setVelocityX(this.wanderdirection);
        let d1 = distanceBetweenObjects(this,solana);
        let d2 = distanceBetweenObjects(this,bright);
        if(d1 < 32 || d2 < 32 && this.wanderdirection == 0){
            this.wanderdirection = Phaser.Math.RND.pick([-1,1]);
        }
    }
};

class PropBat extends Phaser.Physics.Matter.Sprite{    
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'bat-1', 3)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(0, 0, w*0.80, h*0.50);
        
        this.sensors = {
            left: Bodies.rectangle(-w*0.60, 0, 3, h*0.50 , { isSensor: true, friction: 0.0,density: 0.0001,label:"SENSOR_LEFT"}),
            right: Bodies.rectangle(w*0.60, 0, 3, h*0.50 , { isSensor: true, friction: 0.0,density: 0.0001,label:"SENSOR_RIGHT"})
          };
        const compoundBody = Body.create({
            parts: [mainBody,this.sensors.left,this.sensors.right],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.01,
            label: "BAT"
        });

        this
        .setExistingBody(compoundBody)
        .setCollidesWith([0])
        .setPosition(x, y)
        .setIgnoreGravity(true)
        .setDepth(DEPTH_LAYERS.FG);

        this.on('animationcomplete', this.animComplete, this);        
        this.scene.events.on("update", this.update, this);        
        this.scene.events.on("shutdown", this.death, this); 
        this.isSpooked = false;
        this.spookSource;
    }
    update(time, delta)
    {
        if(!this.isSpooked){
            let disSolana = distanceBetweenObjects(solana,this);
            let disBright = distanceBetweenObjects(bright,this);
            if(disSolana < 128 ||  disBright< 128){
                this.spookSource = disSolana < disBright? solana : bright;
                this.spook();
            }
        }
    }
    death(){
        this.isSpooked = true;
        this.destroy;
    }
    spook(){
        this.isSpooked = true;
        this.anims.play("bat-unfurl",true);
    }
    animComplete(animation, frame)
    {
        if(animation.key === 'bat-unfurl')
        {
            // this.animKeyStack.pop();
            // this.currentAnim = this.animKeyStack[this.animKeyStack.length - 1];
            this.anims.play("bat-fly", true);
            let flyAwayX = this.spookSource.x < this.x ? 2000: -2000;
            let twflyaway = this.scene.tweens.add({
                targets: this,
                x: this.x+flyAwayX,
                y:this.y-2000,               
                ease: 'Linear',       
                duration: 10000,  
                onComplete: function(tween, targets, propbat){propbat.destroy()},
                onCompleteParams: [this],
            });
        }
    }
};