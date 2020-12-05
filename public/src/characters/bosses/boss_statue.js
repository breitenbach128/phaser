class BossStatue extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'boss_statue', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        //const mainBody =  Bodies.circle(0,0,w*.50);
        const mainBody =  Bodies.rectangle(0,0,w,h);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0.01,
            frictionAir: 0.05,
            friction: 1.0,
            density: 0.5,
            label: "BOSS"
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setCollidesWith([0])//Nothing - Since Boss is in the background. I can update this to allow the wrecking balls later
        .setPosition(x, y)
        .setStatic(true) 


        //Handle Boss Animations Registration since there is only a single instance
        this.scene.anims.create({
            key: 'boss_statue_idle',
            frames: scene.anims.generateFrameNumbers('boss_statue', { frames:[3,4] }),
            frameRate: 4,
            repeat: -1
        });
        
        this.anims.play('boss_statue_idle',true);


        //Register Events
        this.scene.events.on("update", this.update, this);        
        this.scene.events.on("shutdown", this.remove, this);
        this.scene.events.on("destroy", function(){console.log("BOSS Instance: Scene Destroy Event");}, this);


        //Stats
        this.alive = true;

        //Eyelaser Attack
        this.laserLine = this.scene.add.line(0,0,this.x,this.y,this.x,this.y,0xFF0000,0.35).setOrigin(0,0).setDepth(DEPTH_LAYERS.PLAYERS);
        this.laserLine.t = 1;//Tween Attack tracker
        //Laser Target Timer
        this.laserTimer = this.scene.time.addEvent({ delay: 3000, callback: function(){
            
            this.laserLine.setTo(this.x,this.y,solana.x,solana.y);

        }, callbackScope: this, loop: true});
    
    }
    update(time, delta)
    {   
        if(this.alive){
            
        }
    }
    remove(){

        this.destroy();
    }
    laserAttackTween(){
        let tween = this.scene.tweens.add({
            targets: this.laserLine,
            t : 10,
            alpha: 1,               
            ease: 'Linear',       
            duration: 2000,  
            onComplete: function(tween, targets, boss){
                boss.laserLine.setLineWidth(1);
                boss.laserLine.t = 1;
                boss.laserLine.alpha = 0.35;
                //console.log("Laser Attack complete");
            },
            onUpdate: function(tween,targets, boss){
                boss.laserLine.setLineWidth(targets.t);
                //console.log("Laser Attack Running",targets.t);
            },
            onUpdateParams: [this],
            onCompleteParams: [this],
        });
    }
    debrisAttack(){
        //Shake the Camera
        if(camera_main != undefined){
            camera_main.shake(1000,0.002)
        }

        for(let d=0;d<20;d++){
            let falldebris = new Debris(this.scene,this.x+(Phaser.Math.Between(-500,500)),-200);
        }
    }
};

//Falling debris could hit solana. The Statue blasts can hurt the player, and they also shake the screen, which in turn causes things to fall.