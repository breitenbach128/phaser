class Mirror extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'mirror', 0)
        this.scene = scene;       
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);
        this.sprite = this;

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this.sprite;
        const mainBody =  Bodies.rectangle(0, 0, w, h*.5);
        
        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 1,//0.0
            frictionAir: 1,//0.08
            friction: 1,//0.1
            restitution: 0,
            density: 1.0,//0.009
            label: "MIRROR"
        });

        this.sprite
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.MIRROR)
        .setCollidesWith([ CATEGORY.BULLET, CATEGORY.DARK ])
        .setPosition(x, y)
        //.setStatic(true)
        //.setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setIgnoreGravity(true)
        .setVisible(false);    

        //Mirror Sensor for Solana Interaction
        this.sensor = new MirrorSensor(this,x,y);


        this.debug = scene.add.text(this.x, this.y-16, 'Mirror', { fontSize: '10px', fill: '#00FF00' });           
        this.minAngle = 0;
        this.maxAngle = 180;
        this.reflectAngle = 270;

    }
    setup(x,y,angle){
        this.setActive(true);
        this.sprite.setIgnoreGravity(true);

        this.setPosition(x,y);
        this.sensor.setPosition(x,y);
        //Mirror Constraint for pivoting
        let rotation_constraint = Phaser.Physics.Matter.Matter.Constraint.create(
            {
              pointA: { x: this.x, y: this.y },
              bodyB: this.sprite.body,
              length: 0,
              stiffness: 0.5
            }
          );
        this.scene.matter.world.add(rotation_constraint);

        this.angle = angle;
        this.minAngle = angle - 45;
        this.maxAngle = angle + 45;
        this.flash = false;

        this.on('animationcomplete',this.mirrorAnimComplete,this); 
    }
    hit(){
        if(!this.flash){
            this.anims.play('mirror-hit', true);//Hit by Light
            this.flash = true;
        }
    }
    update(time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Angle:"+String(this.angle));
        //Check Rotation Constraints
        if(this.angle > this.maxAngle){ this.angle = this.maxAngle; }
        if(this.angle < this.minAngle){ this.angle = this.minAngle; }
    }
    rotateMirror(x){
        this.angle+=x;
    }
    mirrorAnimComplete(animation, frame){
        this.anims.play('mirror-idle', true);//back to idle
        this.flash = false;
    }
};

class MirrorSensor extends Phaser.Physics.Matter.Image{
    constructor(parent,x,y) {
        super(parent.scene.matter.world, x, y, 'mirror', 0)
        
        parent.scene.matter.world.add(this);
        parent.scene.add.existing(this); 
        this.setActive(true);
        this.parent = parent;
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        //Set Control Sensor - Player can't collide with mirrors, but bullets can. Sensor can detect player inputs.
        const controlSensor =  Bodies.rectangle(0, 0, this.width, this.height, { isSensor: true });
        const controlBody = Body.create({
            parts: [controlSensor],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1
        });

        this
        .setExistingBody(controlBody)
        .setStatic(true)
        .setFixedRotation() 
        .setIgnoreGravity(true)  
        .setVisible(false);
    }
    update(time, delta)
    {       

    }
}