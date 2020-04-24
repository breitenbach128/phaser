class Vehicle extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'minecart', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const lWall =  Bodies.rectangle(w*0.20,h*0.10,w*0.10,h*0.40);
        const mWall =  Bodies.rectangle(w*0.50,h*0.20,w*0.50,h*0.15, {chamfer: {radius: 2}});
        const rWall =  Bodies.rectangle(w*0.80,h*0.10,w*0.10,h*0.40);
        const lbumper = Bodies.rectangle(0,0,w*0.20,h*1.50, {isSensor:true});
        const rbumper = Bodies.rectangle(w,0,w*0.20,h*1.50, {isSensor:true});

        const compoundBody = Body.create({
            parts: [lWall,mWall,rWall,lbumper,rbumper],
            frictionStatic: 0.01,
            frictionAir: 0.01,
            friction: 0.01,
            density: 0.1,
            label: "VEHICLE"
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.VEHICLE)
        .setCollidesWith([CATEGORY.GROUND,CATEGORY.SOLID,CATEGORY.SOLANA,CATEGORY.DARK,CATEGORY.BRIGHT])
        .setPosition(x, y) 

        this.wA = scene.matter.add.image(this.x,this.y,'minecart_wheel');
        this.wA.setBody({type: 'circle',radius:6},{friction: 0.9, density: 0.04, frictionAir: 0.01, frictionStatic: 0.01});       
        this.wB = scene.matter.add.image(this.x,this.y,'minecart_wheel')
        this.wB.setBody({type: 'circle',radius:6},{friction: 0.9, density: 0.04, frictionAir: 0.01, frictionStatic: 0.01});  
        this.wA.setCollidesWith([CATEGORY.GROUND,CATEGORY.SOLID]);
        this.wB.setCollidesWith([CATEGORY.GROUND,CATEGORY.SOLID]);
        let axelA = scene.matter.add.constraint(this.body, this.wA, 0, 0.0, {
            pointA: { x: -w*0.25, y: h*0.31 },//0.24
            length: 0.0,
            stiffness: 0.0
          })
        let axelB = scene.matter.add.constraint(this.body, this.wB, 0, 0.0, {
            pointA: { x: w*0.25, y: h*0.31 },
            length: 0.0,
            stiffness: 0.0
        })


        this.scene.matterCollision.addOnCollideActive({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Solana) {
                    // let angVel = -0.5;
                    // gameObjectA.applyForce({x:-0.4,y:0.0});
                    // gameObjectA.wA.setAngularVelocity(angVel);
                    // gameObjectA.wB.setAngularVelocity(angVel);
                    let bVelX = gameObjectA.body.velocity.x;
                    let bVelY = gameObjectA.body.velocity.y;
                    let minX = bVelX < 0 ? bVelX : 0;
                    let maxX = bVelX > 0 ? bVelX : 0;
                    let minY = bVelY < 0 ? bVelY : 0;
                    let maxY = bVelY > 0 ? bVelY : 0;
                    gameObjectB.setMaxMoveSpeed(minX,maxX,minY,maxY);
                }
                if(gameObjectB instanceof BreakableTile){
                    //3 Speed seems to look good
                    if(gameObjectA.body.speed > 0){
                        gameObjectB.doCrush();
                    }
                }
            }
        });
        this.scene.matterCollision.addOnCollideEnd({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Solana) {
                    gameObjectB.setMaxMoveSpeed(0,0,0,0);
                }
            }
        });
    }
    update(time, delta)
    {       

    }
};