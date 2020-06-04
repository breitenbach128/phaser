class EnemyShrieker extends Phaser.Physics.Matter.Sprite{
    //Shriekers emit a high pitch sound wave that throws the players away. They shrink and hide if his by a light burst, solbomb or or if bright gets close enough.
    //The sound wave // ripple comes out quick and throws the player based on the angle they are to the shrieker. Solana and Dark will both take damage and be tossed.

    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'shrieker', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        //const mainBody =  Bodies.circle(0,0,w*.50);
        const mainBody =  Bodies.rectangle(0,0,w*0.95,h*0.90, {chamfer: {radius: 10}});

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0.01,
            frictionAir: 0.05,
            friction: 0.9,
            density: 0.01,
            restitution: 0.7,
            label: "SHRIEKER"
        });
        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setPosition(x, y) 
        .setDensity(0.01)
        .setDepth(DEPTH_LAYERS.OBJECTS);

        this.setStatic(true);
        this.screamTimer = this.scene.time.addEvent({ delay: 1100, callback: this.scream, callbackScope: this, loop: true });
        this.screamPower = 0.010;
        //Need stronger power if above within a 90 degree space. Otherwise lower it to 0.01 to smooth out the push effect.
        this.animScream = [0,1,2];
        this.animShrivel = [3,4,5,6,7,8,9,10];
        this.canScream = true;
        this.screamCircle = this.scene.add.ellipse(this.x,this.y,this.width,this.height,0x0000DD,0.3);
        this.screamCircle.blendMode = Phaser.BlendModes.ADD;
        this.screamCircle.isStroked = true;
        this.screamCircle.strokeColor = 0xFFFFFF;
        this.screamCircle.strokeAlpha = 0.5;
        this.screamCircle.lineWidth = 1;
        this.screamCircle.setVisible(false);
        //Collision
        this.scene.matterCollision.addOnCollideStart({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                
                if (gameObjectB !== undefined && gameObjectB instanceof Bright) {
                    if(gameObjectB.light_status == 0){
                        gameObjectA.shrivel();
                    }
                }
                if(gameObjectB !== undefined && gameObjectB instanceof SoulTransfer){
                    gameObjectA.shrivel();
                    gameObjectB.burn();
                }
            }
        });
    }
    scream(){
        if(this.canScream){
            let disSolana = distanceBetweenObjects(solana,this);
            let disBright = bright.light_status == 0 ? distanceBetweenObjects(bright,this) : 9999;
            if(disSolana < 128 || disBright < 128){
                this.anims.play('shrieker-shriek',true);
                this.screamCircle.setVisible(true);
                let tween = this.scene.tweens.add({
                    targets: this.screamCircle,
                    scale: 5.0,               
                    ease: 'Linear',       
                    duration: 1000,  
                    onComplete: function(tween, targets, shroom){shroom.screamCircle.setScale(1.0);shroom.screamCircle.setVisible(false);shroom.setFrame(0)},
                    onUpdate: function(tween,targets, shroom){
                        if(Phaser.Math.Distance.Between(shroom.x,shroom.y,solana.x,solana.y) < (shroom.screamCircle.displayWidth)/2){
                            let a = Phaser.Math.Angle.Between(shroom.x,shroom.y,solana.x,solana.y);
                            let adeg = Phaser.Math.RadToDeg(a);
                            let pow = shroom.screamPower;
                            if(adeg > -135 && adeg < -45){pow = pow*5;}
                            //solana.applyForce({x:Math.cos(a)*pow,y:Math.sin(a)*pow});
                            solana.readyThrown(Math.cos(a)*pow,Math.sin(a)*pow,100);
                        }
                    },
                    onUpdateParams: [this],
                    onCompleteParams: [this],
                });
            }   
        }
    }
    shrivel(){
        if(this.canScream){
            this.canScream = false;
            this.screamTimer.paused = true;
            this.disableScreamTimer = this.scene.time.addEvent({ delay: 4000, callback: this.unshrivel, callbackScope: this, loop: false });
            this.anims.play('shrieker-shrivel',true);
        }else{
            this.disableScreamTimer.reset({ delay: 4000, callback: this.unshrivel, callbackScope: this, loop: false });
        }

    }
    unshrivel(){
        this.screamTimer.paused = false;
        this.canScream = true;
        this.anims.playReverse('shrieker-shrivel',true);
    }
}