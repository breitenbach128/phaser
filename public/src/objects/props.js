class PropInchworm extends Phaser.Physics.Matter.Sprite{
    
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'inchworm-1', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(0, 0, w, h);
        
        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1
        });

        this
        .setExistingBody(compoundBody)
        .setCollidesWith([CATEGORY.GROUND])
        .setPosition(x, y)
        .setVisible(false);   

        //this.anims.play('inchworm-crawl',true);
        this.setDepth(DEPTH_LAYERS.FG);
    }
    update(time, delta)
    {

    }

};