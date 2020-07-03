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
        .setCollidesWith([CATEGORY.SOLANA])
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

            }
        });
        //Event Hook in
        this.scene.events.on("update", this.update, this);
        this.scene.events.on("shutdown", this.remove, this);
        //Variables
        this.alpha = 0.50;
        this.mv = 0.01;
    }
    update(){
       
        
        if(distanceBetweenObjects(soullight,this) < soullight.protection_radius.value){
            let dir = this.aim(soullight);
            this.applyForce({x:-dir.x*this.mv,y:-dir.y*this.mv});
        }else{
            let dir = this.aim(solana);
            this.applyForce({x:dir.x*this.mv,y:dir.y*this.mv});
        }
    }
    remove(){
        
    }
    aim(target){
        //Aimed shot with weapon.
        let angle = Phaser.Math.Angle.Between(this.x,this.y,target.x,target.y);
        let vecX = Math.cos(angle);
        let vecY = Math.sin(angle); 
        return {x:vecX,y:vecY};
    }
}