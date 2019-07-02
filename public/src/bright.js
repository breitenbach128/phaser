class Bright extends Phaser.GameObjects.Sprite {

    constructor(scene,x,y) {
        super(scene, x,y, "bright")
        this.scene = scene;

        this.scene.physics.world.enable(this);
        this.scene.add.existing(this)
        this.create();
    }

    create(){
        this.body.setBounce(0, 0);
        this.body.setCollideWorldBounds(true);
        this.setActive(true)
        
        this.body.setSize(16, 16);
        this.body.setOffset(16,16);
        this.body.setAllowGravity(false);

        this.light_status = 0;//0 - Bright, 1 - Dark;
        this.hp = 1;
        this.max_hp = 1;
        this.mv_speed = 110;
        this.alive = true;
        this.falling = false;
        this.debug = this.scene.add.text(this.x, this.y-16, 'bright', { fontSize: '12px', fill: '#00FF00' });
    }

    update()
    {
            if(this.alive){

            this.debug.setPosition(this.x, this.y-64);
            this.debug.setText("Debug Text");
            //Do Dark Updates
            if(this.light_status == 1){
                if(!this.body.onFloor() && this.body.velocity.y > 30){
                    //Falling, so change animation
                    this.anims.play('dark-falling', false);
                    this.falling = true;
                }else{
                    //On ground now.
                    this.anims.play('dark-idle', false);
                    if(this.falling){
                        //If I was falling, shake the camera.
                        camera_main.shake(80,.005);
                        console.log("Dark hit ground");
                        this.falling = false;
                        
                    }
                }
            }
            //Movement Code
            if(curr_player==players.BRIGHT){
                //Only control if currently the active control object
                if ((game.wasd.left.isDown || gamePad.buttons[14].value == 1)) {
                    this.body.setVelocityX(-this.mv_speed);
                    this.anims.play('dark-idle', true);
                    this.flipX= true; // flip the sprite to the left
                    this.rotation-=.1;
                }
                else if ((game.wasd.right.isDown || gamePad.buttons[15].value == 1)) {
                    this.body.setVelocityX(this.mv_speed);
                    this.anims.play('dark-idle', true);
                    this.flipX= false; // flip the sprite to the right
                    this.rotation+=.1;
                }
                else if(!(game.wasd.right.isDown || gamePad.buttons[15].value == 1) && !(game.wasd.left.isDown || gamePad.buttons[14].value == 1)){
                    this.body.setVelocityX(0);
                    this.anims.play('dark-idle', true);//Idle
                }
            }
        }
    }

    toDark(){
        this.light_status = 1;
        this.setTexture('dark');
        this.anims.play('dark-idle', false);
        this.body.setAllowGravity(true);
        this.body.setGravityY(600);
    }
    toBright(){
        this.light_status = 0;
        this.setTexture('bright');
        this.anims.play('bright-idle', false);
        this.body.setAllowGravity(false);
        this.body.setGravityY(0);
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

