//Setup a special construct for barriers. 
//Barriers block some items, but allow others.
//Barriers can be set toa one way movement, or two way movement.

class Barrier extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y,texture) {
        super(scene.matter.world, x, y, texture, 0)
        this.scene = scene;
        // Create the physics-based sprite that we will move around and animate
        scene.matter.world.add(this);
        // config.scene.sys.displayList.add(this);
        // config.scene.sys.updateList.add(this);
        scene.add.existing(this); // This adds to the two listings of update and display.

        this.setActive(true);

        this.sprite = this;

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this.sprite;
        const mainBody =  Bodies.rectangle(0, 0, w, h);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1
        });

        this.sprite
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.BARRIER)
        .setCollidesWith([ ~CATEGORY.BULLET ]) // 0 Is nothing, 1 is everything, ~ is the inverse, so everything but the category
        .setPosition(x, y)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setStatic(true)
        .setIgnoreGravity(true);    

        this.debug = scene.add.text(this.x, this.y-16, 'Zone', { fontSize: '10px', fill: '#00FF00' });             


    }
    setBarrierType(){
        //Setup the barrier based on type.
        //This will determine what it collides with, and how it interacts with the players
    }
    setup(x,y,angle){
        this.setActive(true);
        this.setPosition(x,y); 
        this.angle = angle;
    }
    update(time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Zone Status:"+String(this.name));
    }
};

class Crate extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'crate', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);

        //Scale crate down
        let newScale = 0.08;
        this.setScale((newScale+0.04));

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(0, 0, w*newScale, h*newScale);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1,
            label: "CRATE"
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setPosition(x, y) 
    }
    setup(x,y){
        this.setActive(true);
        this.setPosition(x,y); 
    }
    update(time, delta)
    {       

    }
};

class Rock extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'rocks', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.circle(0,0,w*.50);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1,
            label: "ROCK"
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setPosition(x, y) 
    }
    setup(x,y){
        this.setActive(true);
        this.setPosition(x,y); 
    }
    update(time, delta)
    {       

    }
};

class Fallplat extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y,texture,frame) {
        super(scene.matter.world, x, y, texture, frame)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(0,0,w,h);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1,
            label: "FALLPLAT"
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setPosition(x, y)
        .setFixedRotation() 
        .setStatic(true);
        //Custom Props
        this.ready = true;
    }
    setup(x,y){
        this.setActive(true);
        this.setPosition(x,y); 
    }
    update(time, delta)
    {       

    }
    touched(){
        //Gradual Wobble and then fall
        //this.setStatic(false);
        if(this.ready){
            this.ready = false;
            let tween = this.scene.tweens.add({
                targets: this,
                x: this.x+1,               // '+=100'
                y: this.y+1,               // '+=100'
                ease: 'Bounce.InOut',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
                duration: 150,
                repeat: 3,            // -1: infinity
                yoyo: true,
                onComplete: this.openComplete,
                onCompleteParams: [this],
            });
        }
    }
    openComplete(tween, targets, myPlat){
        myPlat.setStatic(false);
        myPlat.setVelocityY(6);//Fall faster than player
    }
};
