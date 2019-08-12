class SoulLight extends Phaser.Physics.Matter.Sprite{
    constructor(config,owner) {
        super(config.scene.matter.world, config.x, config.y, config.sprite, config.frame)
        this.scene = config.scene;
        // Create the physics-based sprite that we will move around and animate
        //this.sprite = this.scene.matter.add.sprite(config.x, config.y, config.sprite, config.frame);
        config.scene.matter.world.add(this);
        // config.scene.sys.displayList.add(this);
        // config.scene.sys.updateList.add(this);
        config.scene.add.existing(this); // This adds to the two listings of update and display.

        this.setActive(true);

        this.sprite = this;

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this.sprite;
        const mainBody = Bodies.circle(0,0,w*.20, { isSensor: true });

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1,
            label: "SOULLIGHT"
          });
          this.sprite
            .setExistingBody(compoundBody)
            .setPosition(config.x, config.y)
            .setIgnoreGravity(true);

        this.owner = owner.sprite;

        this.ownerid = 1;
        

        this.debug = this.scene.add.text(this.x, this.y-16, 'SoulLight', { fontSize: '10px', fill: '#00FF00' });              
        this.passing = false;  
        this.threshhold_distance = 64;  
        this.move_speed = 1;
        this.base_speed = 1;
        this.max_speed = 25; 
        this.accel = 1;
        this.sprite.setFriction(.3,.3);
        this.sprite.setIgnoreGravity(true);
        this.protection_radius = {value:250, max: 250, original: 250};//How much does the light protect;
        this.throw = {x:0,y:0};
        this.readyThrow = false;

        this.aimer = this.scene.add.image(this.x,this.y,'soullightblast').setScale(.5);
        this.aimer.setVisible(false);
        this.aimer.ready = true;
        this.aimer.started = false;
        this.aimerRadius = 64;
        this.aimerCircle = new Phaser.Geom.Circle(this.x, this.y, this.aimerRadius);

        // this.aimLine = this.scene.add.line(200,200,25,0,50,0,0xff66ff)
        // this.aimLine.setLineWidth(4,4);

    }

    update(time,delta)
    {
        
        this.setVelocity(this.throw.x*this.max_speed,this.throw.y*this.max_speed);
        if(this.body.velocity.x > this.max_speed){this.setVelocityX(this.max_speed)};
        if(this.body.velocity.x < -this.max_speed){this.setVelocityX(-this.max_speed)};
        if(this.body.velocity.y > this.max_speed){this.setVelocityY(this.max_speed)};
        if(this.body.velocity.y < -this.max_speed){this.setVelocityY(-this.max_speed)};

        //Handle position and light growth and shrinking
        if(!this.passing){
            this.setPosition(this.owner.x,this.owner.y);            
        }
        
        if(this.readyThrow){
            if(this.protection_radius.value >  (this.protection_radius.max/10)){
                this.protection_radius.value-=(this.protection_radius.max/10);
            }else{
                //Ready to launch
                this.passLight();
            };
        }else{
            if(this.protection_radius.value <  this.protection_radius.max){this.protection_radius.value+=25;};
        }
        //Update Aimer
        this.setAimer();
    }
    
    setAimer(){ 

        let gameScale = camera_main.zoom;
        let targVector = {x:pointer.worldX,y:pointer.worldY};
        
        if(this.owner.ctrlDeviceId >= 0){
            //Overwrite target vector with gamePad coords
            let gpVec = gamePad[this.owner.ctrlDeviceId].getStickLeft(0);
            targVector = {x:this.x+gpVec.x*this.aimerRadius,y:this.y+gpVec.y*this.aimerRadius};
        }
        this.aimerCircle.x = this.x;
        this.aimerCircle.y = this.y;

        let angle = Phaser.Math.Angle.Between(this.x,this.y, targVector.x,targVector.y);
        let normAngle = Phaser.Math.Angle.Normalize(angle);
        let deg = Phaser.Math.RadToDeg(normAngle);

        let point = Phaser.Geom.Circle.CircumferencePoint(this.aimerCircle, normAngle);

        this.aimer.setPosition(point.x,point.y);

        this.aimer.rotation = normAngle;

        // this.aimLine.setPosition(this.x,this.y);
        // this.aimLine.setRotation(normAngle);
    }
    aimStart(){
        if(this.aimer.ready){
            this.aimer.started = true;
            this.aimer.setVisible(true);
        }
    }
    aimStop(){
        this.aimer.setVisible(false);
        if(this.aimer.ready && this.aimer.started){
            this.aimer.ready = false;
            this.aimer.started = false;
            let transfer = new SoulTransfer(this.scene,this.x,this.y,'soullightblast',0,this);
            transfer.rotation = this.aimer.rotation;
            transfer.fire(transfer.rotation,12);
        }
    }
    passLight(){
        if(!this.passing){
            this.passing = true;
            //Get owner to set X/Y target
            let target = this.ownerid == 0 ? bright : solana;
            let angle = Phaser.Math.Angle.Between(this.x,this.y,target.x,target.y);
            this.throw.x = Math.cos(angle);
            this.throw.y = Math.sin(angle);            
        }

    }
    readyPass(){
        this.readyThrow = true;
    }
    readyAimer(){
        this.aimer.ready = true;
    }
    lockLight(target,id){
        if(id != this.ownerid && this.passing){
            this.readyThrow = false;
            this.passing = false;
            this.ownerid = id;
            this.owner = target;
            if(id == 0){
                bright.toDark();
            }else if(id == 1){
                bright.toBright();
            }    
        }    
    }

}
//Soul Transfer is the "Bullet" that will hit before the Soulight can transfer.
class SoulTransfer extends Phaser.Physics.Matter.Sprite{
    constructor(scene, x, y, sprite, frame, parent) {
        super(scene.matter.world, x, y, sprite, frame)
        this.setScale(.3);
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody = Bodies.circle(0,0,w*.20, {isSensor:true});

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 0.0,
            restitution: 1,
            label: "SOULTRANSFER"
          });
          this
            .setExistingBody(compoundBody)
            .setPosition(x, y)
            .setIgnoreGravity(true)
            .setCollisionCategory(CATEGORY.BULLET)
            .setCollidesWith([ CATEGORY.GROUND, CATEGORY.SOLID, CATEGORY.BRIGHT, CATEGORY.SOLANA, CATEGORY.DARK ]);
          //Custom properties
        this.parent = parent;
        this.timer = this.scene.time.addEvent({ delay: 2000, callback: this.kill, callbackScope: this, loop: false });
        this.alive = true;
    }
    fire(angle,speed){
        this.setVelocity(Math.cos(angle)*speed,Math.sin(angle)*speed);
    }
    hit(id){
        //Hit other target, so trigger the launch of the soulight.
        if(this.parent.ownerid != id){
            this.parent.readyPass();
            this.timer = this.scene.time.addEvent({ delay: 100, callback: this.kill, callbackScope: this, loop: false });
        }
    }
    update(time,delta)
    {
        
    }
    kill(){
        this.parent.readyAimer();
        this.destroy();
    }

}



