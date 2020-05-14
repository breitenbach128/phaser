class TrapGrinder extends Phaser.Physics.Matter.Image{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'grinder', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.circle(x,y,w*0.50);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 1,//Was 0.1
            label: 'TRAPGRINDER'
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setCollidesWith([ CATEGORY.BRIGHT, CATEGORY.SOLANA, CATEGORY.SOLID])
        .setPosition(x, y)
        .setIgnoreGravity(true); 

        this.axle = Phaser.Physics.Matter.Matter.Constraint.create({
            pointA: { x: x, y: y },
            bodyB: this.body,
            angleB: this.rotation,
        });
        this.scene.matter.world.add(this.axle); 

        this.scene.matterCollision.addOnCollideActive({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Solana) {
                    //Solana Touch
                }
            }
        });
        //Up to date queue
        this.scene.events.on("update", this.update, this);
    }
    setup(x,y, properties,name){
        this.setActive(true); 
        this.setPosition(x,y);
        this.name = name;
 
    }
    update(time, delta)
    {       
        this.setAngularVelocity(0.2);

    }
};