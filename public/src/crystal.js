class CrystalLamp extends Phaser.GameObjects.Sprite {

    constructor(scene,x,y,brigthness) {
        super(scene, x,y, "light_crystal")
        this.scene = scene;

        this.scene.physics.world.enable(this);
        this.scene.add.existing(this)
        this.brightness = brigthness;
        this.body.setAllowGravity(false);
    }

    create(){
        
        this.setActive(true);      
  
    }

    update()
    {

    }

}

