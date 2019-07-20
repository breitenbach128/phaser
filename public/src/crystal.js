//Crystals can be charged with solar blasts to light up for a short period. They slowly get dimmer.
//Fireflies can be gathered to gain light and are attracted to solana.
class CrystalLamp extends Phaser.Physics.Matter.Sprite {
    constructor(scene,x,y,brigthness) {
        super(scene.matter.world, x, y, 'light_crystal', 4);
        this.scene = scene;
        // Create the physics-based sprite that we will move around and animate
        scene.matter.world.add(this);
        // config.scene.sys.displayList.add(this);
        // config.scene.sys.updateList.add(this);
        scene.add.existing(this); // This adds to the two listings of update and display.

        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(0, 0, w, h, { isSensor: true });
        
        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.02,
            friction: 0.1,
            label: 'CRYSTAL_LAMP'
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setPosition(x, y)
        .setStatic(true)
        .setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setIgnoreGravity(true)
        .setVisible(true);  

        this.brightness = 0;
        this.max_brightness = brightness;
    }

    create(){
        
        this.setActive(true);      
  
    }
    turnOn(){
        this.anims.play('lamp-turn-on', true); 
        this.brightness = this.max_brightness;
    }
    turnOff(){
        this.anims.play('lamp-turn-off', true); 
        this.brightness = 0;
    }
    update()
    {

    }

}

