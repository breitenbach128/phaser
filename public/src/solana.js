class Solana extends Phaser.GameObjects.Sprite {

    constructor(scene,x,y) {
        super(scene, x,y, "solana")
        this.scene = scene;

        this.scene.physics.world.enable(this);
        this.scene.add.existing(this)

        //this.body.setBounce(1, 1);
        this.body.setCollideWorldBounds(true);
        this.setActive(true)
        
        this.hp = 5;
        this.max_hp = 5;
        this.mv_speed = 300;
        this.onGround = false;
        this.onWall = false;
        this.jumpReady = false;
        this.alive = true;
        this.inLight = true;
        
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


        this.debug.setPosition(this.x, this.y-196);
        this.debug.setText("Ground:"+String(this.onGround)
        +" \nWall:"+String(this.onWall)
        +" \njr:"+String(this.jumpReady)
        +" \nhp:"+String(this.hp)+":"+String(this.alive)
        +" \nAnimKey:"+this.anims.getCurrentKey()
        +" \nInLight:"+String(this.inLight));
        
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
            //this.setVisible(false);
            this.debug.setVisible(false);
            
            console.log("Solanas DEAD!")
        }
        
    }
    resurect(){
        this.hp = this.max_hp;
        this.setActive(true);
        this.setVisible(true);
        this.debug.setVisible(true);
        this.alive = true; 
    }
    receiveDamage(damage) {
                
        if(this.alive){
            //Kill Blips
            this.scene.events.emit('playerHurt');
            let hud_scene = this.scene.scene.get('UIScene');
            hud_scene.updateHud();
            //Remove health
            this.hp -= damage; 
            emitter0.active = true;
            emitter0.explode(5,this.x,this.y);

            // if hp drops below 0, die
            if(this.hp <= 0) {
                this.alive = false;                         
                this.body.setVelocityX(0);
                this.on('animationcomplete',this.death,this);            
                this.anims.play('solana-death', false);  
                console.log("deadly damage recv. Play death anim")              
            }
        }   
    }
}

