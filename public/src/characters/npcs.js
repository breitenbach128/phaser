//When enemies are hit, they lose globs of oily shadow, of varying size, that fly off of them.
class Firefly extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'fireflies', 0)
        this.scene = scene;       
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);
        this.sprite = this;

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        
        const { width: w, height: h } = this.sprite;
        //const mainBody = Bodies.rectangle(0, 0, w * 0.6, h, { chamfer: { radius: 10 } });
        

        const mainBody = Bodies.rectangle(0, 0, w * 0.6, h-12, { isSensor: true });  

        const compoundBody = Body.create({
          parts: [mainBody],
          //parts: [mainBody],
          frictionStatic: 0,
          frictionAir: 0.00,
          friction: 0.00,
          restitution: 0.00,
          label: "FIREFLY"
        });

        this
        .setExistingBody(compoundBody)
        .setScale(1)
        .setFixedRotation(true) // Sets inertia to infinity so the player can't rotate
        .setIgnoreGravity(true)
        .setPosition(x, y);
        //Custom Properties
        this.anims.play('firefly-move', true); 
        this.flashTimer = this.scene.time.addEvent({ delay: Phaser.Math.Between(3000, 5000), callback: this.startFlash, callbackScope: this, loop: false });
        this.wanderAllowance = 16;
        this.wanderRange = {minX: this.x-this.wanderAllowance, maxX: this.x+this.wanderAllowance, minY: this.y - this.wanderAllowance, maxY: this.y+this.wanderAllowance};
        this.wanderVec = new Phaser.Math.Vector2(Phaser.Math.Between(-1,1),Phaser.Math.Between(-1,1));
        
        this.debug = this.scene.add.text(this.x, this.y-16, '', { fontSize: '10px', fill: '#00FF00' }); 
        //Move Fireflies to the front
        this.setDepth(DEPTH_LAYERS.FRONT);
    }
    update(time, delta)
    {
       
        this.setVelocity(this.wanderVec.x,this.wanderVec.y);           
        this.newWander();
        //this.debug.setText("Vel: x:"+String(this.wanderVec.x)+" y:"+String(this.wanderVec.y));
        this.rotation = this.wanderVec.angle();
    }
    startFlash(){        
        this.sprite.anims.play('firefly-flash', true); 
        this.sprite.once('animationcomplete',this.stopFlash,this);  
        
    }
    stopFlash(){
        this.anims.play('firefly-move', true);
        this.flashTimer = this.scene.time.addEvent({ delay: Phaser.Math.Between(3000, 5000), callback: this.startFlash, callbackScope: this, loop: false });
    }
    newWander(){

        if(this.x < this.wanderRange.minX || this.x > this.wanderRange.maxX){       
            this.wanderVec.x = this.x < this.wanderRange.minX ?  Phaser.Math.Between(1,5)/10: Phaser.Math.Between(-1,-5)/10;
        }    
        if(this.y > this.wanderRange.maxY || this.y < this.wanderRange.minY){            
            this.wanderVec.y = this.y < this.wanderRange.minY ?  Phaser.Math.Between(1,5)/10: Phaser.Math.Between(-1,-5)/10;
        }
        if(this.wanderVec.x == 0){this.wanderVec.x = Phaser.Math.Between(-1,1)};
        if(this.wanderVec.y == 0){this.wanderVec.y = Phaser.Math.Between(-1,1)};
    }
    collect(){
        
    }
    spawn(){

    }
};
class NPC extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y,texture) {
        super(scene.matter.world, x, y, texture, 0)
        this.scene = scene;       
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);
        this.sprite = this;

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        
        const { width: w, height: h } = this.sprite;
        //const mainBody = Bodies.rectangle(0, 0, w * 0.6, h, { chamfer: { radius: 10 } });
        

        const mainBody = Bodies.rectangle(0, 0, w * 0.6, h-12, { isSensor: true });  

        const compoundBody = Body.create({
          parts: [mainBody],
          //parts: [mainBody],
          frictionStatic: 0,
          frictionAir: 0.00,
          friction: 0.00,
          restitution: 0.00,
          label: "NPC"
        });

        this
        .setExistingBody(compoundBody)
        .setScale(1)
        .setFixedRotation(true) // Sets inertia to infinity so the player can't rotate
        .setIgnoreGravity(true)
        .setPosition(x, y);
    }
    update(time, delta)
    {
       

    }
};
class Polaris extends NPC{
    constructor(scene,x,y) {
        super(scene, x, y, 'polaris', 0);

        //Test Dialogue Setup
        let dialogueChain = [{speaker:this,ttl:3000,text:"Good to see you up and about Princess."},
        {speaker:this,ttl:3000,text:"Come over here so we can talk."},
        {speaker:this,ttl:5000,text:"Move left and right with your left stick or the A/D keys."}];
        this.dialogue = new Dialogue(this.scene,dialogueChain,54,-40);
        this.dialogue.start();
    }
    update(time, delta)
    {
        if(this.dialogue.isRunning){
            this.dialogue.update();
        }

    }
};