class enemytest extends Phaser.Physics.Arcade.Sprite {

    constructor(scene,x,y) {
        super(scene, x,y, "enemy2")
        this.scene.add.existing(this)
    }

    create(){
        this.setVelocity(100, 200);
        this.setBounce(1, 1);
        this.setCollideWorldBounds(true);
    }
}
