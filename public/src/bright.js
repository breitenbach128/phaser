class Bright {
    constructor(config) {
        this.scene = config.scene;
        // Create the physics-based sprite that we will move around and animate
        this.sprite = this.scene.matter.add.sprite(config.x, config.y, config.sprite, config.frame);
    
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this.sprite;
        const mainBody = Bodies.circle(0,0,w*.18);

        this.sensors = {
          bottom: Bodies.rectangle(0, h * 0.18, w * 0.22, 2, { isSensor: true }),
          top: Bodies.rectangle(0, -h * 0.18, w * 0.22, 2, { isSensor: true }),
          left: Bodies.rectangle(-w * 0.18, 0, 2, h * 0.22, { isSensor: true }),
          right: Bodies.rectangle(w * 0.18, 0, 2, h * 0.22, { isSensor: true })
        };
        const compoundBody = Body.create({
          parts: [mainBody, this.sensors.top, this.sensors.bottom, this.sensors.left, this.sensors.right],
          frictionStatic: 0,
          frictionAir: 0.02,
          friction: 0.1
        });
        this.sprite
          .setExistingBody(compoundBody)
          .setScale(2)
          //.setFixedRotation() // Sets inertia to infinity so the player can't rotate
          .setPosition(config.x, config.y)
          .setIgnoreGravity(true);
          
        //Custom properties
        this.light_status = 0;//0 - Bright, 1 - Dark;
        this.hp = 1;
        this.max_hp = 1;
        this.mv_speed = 3;
        this.alive = true;
        this.falling = false;
        this.debug = this.scene.add.text(this.x, this.y-16, 'bright', { fontSize: '10px', fill: '#00FF00' });
        this.touching = {up:0,down:0,left:0,right:0};
    }

    update()
    {
            if(this.alive){

            this.debug.setPosition(this.sprite.x, this.sprite.y-64);
            this.debug.setText("On ground:"+String(this.touching.down));
            //Do Dark Updates
            if(this.light_status == 1){
                if(this.touching.down == 0 && this.sprite.body.velocity.y > 30){
                    //Falling, so change animation
                    this.sprite.anims.play('dark-falling', false);
                    this.falling = true;
                }else{
                    //On ground now.
                    this.sprite.anims.play('dark-idle', false);
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
                let control_left = (game.wasd.left.isDown || gamePad.buttons[14].value == 1);
                let control_right = (game.wasd.right.isDown || gamePad.buttons[15].value == 1);
                let control_up = (game.wasd.up.isDown || gamePad.buttons[12].value == 1);
                let control_down = (game.wasd.down.isDown || gamePad.buttons[13].value == 1);

                if (control_left) {
                    if(this.light_status == 0){
                        this.sprite.setVelocityX(-this.mv_speed);
                        this.sprite.anims.play('bright-idle', true);
                        this.flipX= true; // flip the sprite to the left
                    }else{                        
                        this.sprite.anims.play('dark-idle', true);
                        this.sprite.setAngularVelocity(-.2);
                    }
                }
                else if (control_right) {
                    if(this.light_status == 0){
                        this.sprite.setVelocityX(this.mv_speed);
                        this.flipX= false; // flip the sprite to the right
                    }else{                        
                        this.sprite.anims.play('dark-idle', true);
                        this.sprite.setAngularVelocity(.2);
                    }
                }
                else if(!control_left && !control_right){
                    this.sprite.setVelocityX(0);
                    this.sprite.setAngularVelocity(0);
                    this.sprite.anims.play('dark-idle', true);//Idle
                }

                if(this.light_status == 0){ //Only if Bright
                    //Vertical Control
                    if (control_up) {
                        this.sprite.setVelocityY(-this.mv_speed);
                        this.sprite.anims.play('bright-idle', true);
                    }
                    else if (control_down) {
                        this.sprite.setVelocityY(this.mv_speed);
                        this.sprite.anims.play('bright-idle', true);
                    }
                    else if(!control_up && !control_down){
                        this.sprite.setVelocityY(0);
                        this.sprite.anims.play('bright-idle', true);//Idle
                    }
                }

            }
        }
    }

    toDark(){
        this.light_status = 1;
        this.sprite.setTexture('dark');
        this.sprite.anims.play('dark-idle', false);
        this.sprite.setIgnoreGravity(false);
    }
    toBright(){
        this.light_status = 0;
        this.sprite.setTexture('bright');
        this.sprite.anims.play('bright-idle', false);
        this.sprite.setIgnoreGravity(true);
        this.sprite.setAngle(0);
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
                     
            this.sprite.on('animationcomplete',this.death,this);            
            this.sprite.anims.play('bright-walk', false);
            
        }
    }
}

