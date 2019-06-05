class Bright extends Phaser.GameObjects.Sprite {

    constructor(scene,x,y) {
        super(scene, x,y, "bright")
        this.scene = scene;

        this.scene.physics.world.enable(this);
        this.scene.add.existing(this)
    }

    create(){
        this.setVelocity(100, 200);
        this.setBounce(1, 1);
        this.setCollideWorldBounds(true);
        this.setActive(true)
        
        
        this.hp = 1;
        this.max_hp = 1;
        this.mv_speed = 300;
        scene.physics.add.existing(this);
        this.alive = true;
        
        this.debug = scene.add.text(this.x, this.y-16, 'bright', { fontSize: '12px', fill: '#00FF00' });
    }

    update()
    {
        if(this.alive){
            
        }


        this.debug.setPosition(this.x, this.y-64);
        this.debug.setText("Debug Text");
    }

    death(animation, frame){
        
        if(animation.key == 'bright-walk'){
            this.setActive(false);
            this.setVisible(false);
            this.debug.setVisible(false);
            this.hp = 1;
            this.alive = true; 
        }
    }
    receiveDamage(damage) {
        this.hp -= damage;           
        
        // if hp drops below 0 we deactivate this enemy
        if(this.hp <= 0 && !this.dead ) {
            this.alive = false; 
                     
            this.on('animationcomplete',this.death,this);            
            this.anims.play('bright-walk', false);
            
        }
    }
}

