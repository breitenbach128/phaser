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
        const mainBody =  Bodies.rectangle(0, 0, w, h*0.25);
        const backBody =  Bodies.rectangle(0, h*0.20, w, h*0.10, {label: "MIRRORBACK"});

        const compoundBody = Body.create({
            parts: [mainBody,backBody],
            frictionStatic: 1,//0.0
            frictionAir: 1,//0.08
            friction: 0,//0.1
            restitution: 1,
            density: 1.0,//0.009
            label: "MIRROR"
        });

        compoundBody.render.sprite.xOffset = 0.50;
        compoundBody.render.sprite.yOffset = 0.50;

        this.sprite
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.MIRROR)
        .setCollidesWith([ CATEGORY.BULLET, CATEGORY.DARK ])
        .setPosition(x, y)
        //.setStatic(true)
        //.setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setIgnoreGravity(true)
        .setVisible(false)
        .setStatic(true);    

        this.setDepth(DEPTH_LAYERS.FG);
        //Mirror Sensor for Solana Interaction
        this.sensor = new MirrorSensor(this,x,y);


        this.debug = scene.add.text(this.x, this.y-16, 'Mirror', { fontSize: '10px', fill: '#00FF00' });           
        this.minAngle = 0;
        this.maxAngle = 180;
        this.reflectAngle = 270;
        this.name = "";

    }
    setup(x,y,angle,name){
        this.setActive(true);
        this.sprite.setIgnoreGravity(true);
        this.name = name;
        this.setPosition(x,y);
        this.sensor.setPosition(x,y);
        //Mirror Constraint for pivoting
        // let rotation_constraint = Phaser.Physics.Matter.Matter.Constraint.create(
        //     {
        //       pointA: { x: this.x, y: this.y },
        //       bodyB: this.sprite.body,
        //       length: 0,
        //       stiffness: 0.5
        //     }
        //   );
        //this.scene.matter.world.add(rotation_constraint);

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
        if(this.angle > this.maxAngle){ this.angle = this.maxAngle;console.log("Adjusting Mirror > Max", this.name) }
        if(this.angle < this.minAngle){ this.angle = this.minAngle;console.log("Adjusting Mirror < min", this.name) }
    }
    rotateMirror(x){
        this.angle+=x;
    }
    activateTrigger(r){
        this.rotateMirror(r);
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

//Add A bucket, or Y shape at the top to allow for easy rotation. Dark can just sit in and and roll.
class TMXGear extends Phaser.Physics.Matter.Image{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'gear', 0)
        
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        //Set Control Sensor - Player can't collide with mirrors, but bullets can. Sensor can detect player inputs.
        const body =  Bodies.circle(0, 0, this.width*0.50);
        // const prongLeft = Bodies.rectangle(-this.width/2, -this.height/2, this.width*0.10,this.height*0.50);
        // const prongRight = Bodies.rectangle(this.width/2, -this.height/2, this.width*0.10,this.height*0.50);
        // prongLeft.angle += Math.PI/4;
        // prongRight.angle += -Math.PI/4;

        const controlBody = Body.create({
            parts: [body],
            frictionStatic: 0.20,
            frictionAir: 0.20,
            friction: 1
        });

        this
        .setExistingBody(controlBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setIgnoreGravity(true)  
        .setVisible(false);

    }
    setup(x,y,properties,name,w,h){
        this.setActive(true);        
        this.setPosition(x,y);        
        this.setSize(w,h);
        this.setDisplaySize(w,h);
        this.name = name;        
        this.ready = true;
        this.target = {name: -1,type: -1, object: []};

        let rotation_constraint = Phaser.Physics.Matter.Matter.Constraint.create(
            {
              pointA: { x: this.x, y: this.y },
              bodyB: this.body,
              length: 0,
              stiffness: 1
            }
          );
        this.scene.matter.world.add(rotation_constraint);
        if(properties){
            this.target.name = properties.targetName;
        }
        this.prevAng = 0;
        
        this.debug = this.scene.add.text(this.x, this.y-16, 'plate', { fontSize: '10px', fill: '#00FF00', resolution: 2 }).setOrigin(0.5);  
    }
    setTarget(targetObject){
        this.target.object.push(targetObject);
    }
    triggerTarget(r){
        if(this.target.object.length > 0){
            this.target.object.forEach(e=>{
                e.activateTrigger(r);
            });
        }
    }
    update(time, delta)
    {       
        let roc = ~~(this.angle - this.prevAng);
        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Data:"+String(this.angle.toFixed(2))+'roc:'+String(roc));

        if(roc > 1){
            this.triggerTarget(1);
        }else if(roc < -1){
            this.triggerTarget(-1);            
        }
        this.prevAng = this.angle
    }
}