var Enemy = new Phaser.Class({
 
    Extends: Phaser.GameObjects.Sprite,

    initialize: function Enemy (scene)
    {
        Phaser.GameObjects.Sprite.call(this, scene, 0, 0, 'enemy1');
        this.hp = 1;
        this.mv_speed = 30+Phaser.Math.Between(-20,20);
        this.aggrorange = Phaser.Math.Between(-100,200)
        this.gun = new Gun(30,3,30);
        scene.physics.add.existing(this);
        this.dead = false;
        
        this.debug = scene.add.text(this.x, this.y-16, 'debug', { fontSize: '12px', fill: '#00FF00' });
    },
    update: function (time, delta)
    {
        if(!this.dead && player.alive){
            var distanceToPlayer = Phaser.Math.Distance.Between(player.x,player.y,this.x,this.y)
            if(distanceToPlayer < 300+this.aggrorange){
                if(player.x < this.x){
                    this.flipX = false;
                }else{
                    this.flipX = true;
                }
                this.anims.play('enemy-shoot', true);
                var bullet = bullets.get();
                if (bullet && this.gun.ready)//ROF(MS)
                {
                    bullet.body.setAllowGravity(false)
                    bullet.fire(this.x, this.y,!this.flipX,180,800);
                    this.gun.shoot();//Decrease mag size. Can leave this out for a constant ROF.
                }
                if(this.gun){
                    this.gun.update();
                }
            }else{
                this.anims.play('enemy-idle', true);
            }
            //Move towards player 
            if(distanceToPlayer > 500+this.aggrorange){
                this.anims.play('enemy-walk', true);
                if(player.x < this.x){
                    this.body.velocity.x = mv_speed*-1;
                    this.flipX = false;
                }else{
                    this.body.velocity.x = mv_speed;
                    this.flipX = true;
                }
            }else{
                this.body.velocity.x = 0;
            }
        }


        this.debug.setPosition(this.x, this.y-64);
        this.debug.setText("Debug Text");
    },
    death: function(animation, frame){
        
        if(animation.key == 'enemy-death'){
            this.setActive(false);
            this.setVisible(false);
            this.debug.setVisible(false);
            this.hp = 1;
            this.dead = false; 
        }
    },
    receiveDamage: function(damage) {
        this.hp -= damage;           
        
        // if hp drops below 0 we deactivate this enemy
        if(this.hp <= 0 && !this.dead ) {
            this.dead = true; 
                     
            this.on('animationcomplete',this.death,this);            
            this.anims.play('enemy-death', false);
            
        }
    },
});
