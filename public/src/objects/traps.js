class TrapGrinder extends Phaser.Physics.Matter.Image{
    constructor(scene,x,y,angvel) {
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
        this.angvel = angvel;
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
                if (gameObjectB !== undefined && gameObjectB instanceof Rock) {
                    //Solana Touch
                }
            }
        });
        //Up to date queue
        this.scene.events.on("update", this.update, this);
        this.scene.events.on("shutdown", this.remove, this);
    }
    setup(x,y, properties,name){
        this.setActive(true); 
        this.setPosition(x,y);
        this.name = name;
 
    }
    update(time, delta)
    {       
        if(this.active){
            this.setAngularVelocity(this.angvel);
        }

    }
    remove(){
        this.active = false;
        this.destroy();
    }
};

//Conveyor Class (make a series of rotating bodies all turning the same direction)
class ConveyorWheel extends Phaser.Physics.Matter.Image{
    constructor(scene,x,y,angvel) {
        super(scene.matter.world, x, y, 'conveyor_wheel', 0)
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
            label: 'CONVEYORWHEEL'
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setCollidesWith([ CATEGORY.BRIGHT, CATEGORY.SOLANA, CATEGORY.SOLID])
        .setPosition(x, y)
        .setIgnoreGravity(true)
        .setDensity(0.8); 
        
        this.angvel = angvel;
        this.axle = Phaser.Physics.Matter.Matter.Constraint.create({
            pointA: { x: x, y: y },
            bodyB: this.body,
            angleB: this.rotation,
        });
        this.scene.matter.world.add(this.axle); 


        //Up to date queue
        this.scene.events.on("update", this.update, this);
        this.scene.events.on("shutdown", this.remove, this);
    }
    setup(x,y, properties,name){
        this.setActive(true); 
        this.setPosition(x,y);
        this.name = name;
 
    }
    update(time, delta)
    {       
        this.setAngularVelocity(this.angvel);

    }
    remove(){
        this.active = false;
        this.destroy();
    }
};
class Conveyor{
    constructor(scene,start,end,vel){
        let lineLength = Phaser.Math.Distance.Between(start.x,start.y,end.x,end.y);
        let lineAngle = Phaser.Math.Angle.Between(start.x,start.y,end.x,end.y);
        let segmentCount = Math.floor(lineLength/16);
        for(let s=0;s < segmentCount;s++){
            let xpos = start.x + Math.cos(lineAngle)*(s*16);
            let ypos = start.y + Math.sin(lineAngle)*(s*16);
            let cWheel = new ConveyorWheel(scene,xpos,ypos,vel);
        }
    }
}