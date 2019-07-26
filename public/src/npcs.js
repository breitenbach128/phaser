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
        

        const mainBody = Bodies.rectangle(0, 0, w * 0.6, h-12, { chamfer: { radius: 4 }, isSensor: true });  

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
    }
    update(time, delta)
    {
       
    }
    startFlash(){
        console.log("Flash");          
        this.sprite.anims.play('firefly-flash', true); 
        this.sprite.once('animationcomplete',this.stopFlash,this);  
        
    }
    stopFlash(){
        console.log("Flash over");
        this.anims.play('firefly-move', true);
        this.flashTimer = this.scene.time.addEvent({ delay: Phaser.Math.Between(3000, 5000), callback: this.startFlash, callbackScope: this, loop: false });
        let vec = Phaser.Math.RandomXY({x:0,y:0});  
        console.log(vec); 
        this.setVelocity(vec.x,vec.y);
    }
    collect(){

    }
    spawn(){

    }
};