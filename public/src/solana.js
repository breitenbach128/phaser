class Solana extends Phaser.GameObjects.Sprite {

    constructor(scene,x,y) {
        super(scene, x,y, "solana")
        this.scene = scene;

        this.scene.physics.world.enable(this);
        this.scene.add.existing(this)

        //this.body.setBounce(1, 1);
        this.body.setCollideWorldBounds(true);
        this.setActive(true)
        
        this.hp = 1;
        this.max_hp = 1;
        this.mv_speed = 300;
        this.onGround = false;
        this.onWall = false;
        this.jumpReady = false;
        this.alive = true;
        
        this.debug = scene.add.text(this.x, this.y-16, 'Solana', { fontSize: '12px', fill: '#00FF00' });
        //Sounds
        this.soundJump = game.sound.add('jumpSolana');
    }

    update(time,delta)
    {
        if(this.alive){

            //Detection Code for Jumping

            // Solana on the ground and touching a wall on the right
            if(this.body.blocked.right && this.body.blocked.down){
                
                this.onGround = true;
            }
    
            // Solana NOT on the ground and touching a wall on the right
            if(this.body.blocked.right && !this.body.blocked.down){
    
                // Solana on a wall
                this.onWall = true;
            }
    
            // same concept applies to the left
            if(this.body.blocked.left && this.body.blocked.down){
               
                this.onGround = true;

            }
            if(this.body.blocked.left && !this.body.blocked.down){
                this.onWall = true;
            }
            //Check for Walls
            if(!this.body.blocked.left && !this.body.blocked.right){
                this.onWall = false;
            }
            //Final on Ground Check
            if(this.body.blocked.down){
                this.onGround = true;
            }else{
                this.onGround = false;
            }

            //Check Jumop ready
            if(this.onGround || this.onWall){
                this.jumpReady = true;
            }else{
                this.jumpReady = false;
            }

            //Slow Descent if on Wall
            if(this.onWall){
                this.body.setVelocityY(0);
                
            }else{

            }
            
        }


        this.debug.setPosition(this.x, this.y-64);
        this.debug.setText("Ground:"+String(this.onGround)+" Wall:"+String(this.onWall)+" jr:"+String(this.jumpReady));

    }

    jump(jumpVel,mvVel){
        if(this.body.blocked.right){
            this.body.setVelocityX(-mvVel);
        }
        if(this.body.blocked.left){
            this.body.setVelocityX(mvVel);
        }
        this.body.setVelocityY(-jumpVel);
        this.soundJump.play();
    }

    death(animation, frame){
        
        if(animation.key == 'solana-death'){
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
            this.anims.play('solana-death', false);
            
        }
    }
}

