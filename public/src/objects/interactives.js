//Interactives are objects which are not direct triggers, but instead use a manual interaction to start an effect or ability
class Sollink extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'sollink', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(x,y,w,h,{isSensor:true});

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 1,//Was 0.1
            label: 'SOLLINK'
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.INTERACTIVE)
        .setCollidesWith([ CATEGORY.BRIGHT])
        .setPosition(x, y)
        .setDepth(DEPTH_LAYERS.OBJECTS)
        .setStatic(true);  

        this.scene.matterCollision.addOnCollideActive({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Bright) {

                    if(gameObjectB.light_status == 0 && this.ropeActive == false){
                        gameObjectA.createRope(gameObjectB);
                    }
                    // let control_up = solana.ctrlDeviceId >= 0? gamePad[solana.ctrlDeviceId].checkButtonState('up') > 0 : keyPad.checkKeyState('W') > 0;
                    // if(control_up) {
                    //     //Interact
                    //     gameObjectA.open();
                    // }
                }
            }
        });
        //Up to date queue
        //this.scene.events.on("update", this.update, this);
        //Animate
        this.anims.play('sollink-active',true);

        this.ropeActive = false;
    }
    createRope(owner){
        this.ropeActive = true;
        this.rope = new Lightrope(this.scene,owner);
        this.rope.addNode(this.x,this.y)
        this.rope.anchorBase(this.x,this.y)
        this.rope.nodes[0].setRotation(0);
        this.rope.nodes[0].setVisible(false);
    }
};
class Solanchor extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'solanchor', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(x,y,w,h,{isSensor:true});

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 1,//Was 0.1
            label: 'SOLLINK'
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.INTERACTIVE)
        .setCollidesWith([ CATEGORY.BRIGHT,CATEGORY.BULLET])
        .setPosition(x, y)
        .setDepth(DEPTH_LAYERS.OBJECTS)
        .setStatic(true);  

        this.scene.matterCollision.addOnCollideActive({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Bright) {

                    if(gameObjectB.light_status == 0 && this.ropeActive == false){
                        
                    }
 
                }
            }
        });

        this.ropeActive = false;
    }
};