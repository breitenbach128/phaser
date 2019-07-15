class CrystalLamp extends Phaser.GameObjects.Sprite {

    constructor(scene,x,y,brigthness) {
        super(scene, x,y, "light_crystal")
        this.scene = scene;
        this.sprite = scene.matter.add.sprite(this);
        this.sprite.setIgnoreGravity(true);
        this.brightness = brigthness;
    }

    create(){
        
        this.setActive(true);      
  
    }

    update()
    {

    }

}

