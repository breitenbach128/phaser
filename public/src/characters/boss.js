//SPIDER HIVE - BOSS # 1
//Spawns up to three spiders to chase player.
//Spawns every 15 seconds if there is room.
//Sprays webbing and acid every 5-10 seconds after a pulsating charge up.
//How to defeat?
class SpiderHive extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'boss_spiderhive', 0)        
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;

        const coreArea =  Bodies.rectangle(0, 0, this.width*.80, this.height*.60, { chamfer: {radius: 5}, isSensor: false });

        const mainBody = Body.create({
            parts: [coreArea],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 0.90,
            restitution: 0.00,
            label: "BossSpiderHive"
        });

        // mainBody.render.sprite.xOffset = .51;
        // mainBody.render.sprite.yOffset = .80;

        this
        .setExistingBody(mainBody)
        .setFixedRotation()
        .setStatic(true); 

        console.log("BOSS: SPIDERHIVE SPAWNED",x,y);

        //Custom Properties
        this.hp = 10;
        this.gun = new Gun(60,1,70);
        this.spawnGlob = new SpiderSpawnOrb(this.scene,-1000,0,'bullet');
        this.spawnGlob.setFrame(17);
        this.spawnGlob.setCollidesWith([ CATEGORY.GROUND,CATEGORY.SOLID]);
        this.spawnGlob.owner = this;          
        this.spawnGlob.setIgnoreGravity(false);
        this.spiderlings = [];
        this.eggSacs = [];
        this.acidGroup = this.scene.add.group({
            classType: Bullet,
            //maxSize: 50,
            runChildUpdate: true
        }); 
        //use .destroy() to remove the group;

        //As the hive takes more damage, it can get a new gun with a magizine side of 1-2-3. each one is a burst 
        this.setDepth(DEPTH_LAYERS.ENEMIES);

        this.eggSacs.push(new SpiderHiveEgg(scene, x + 48 + this.width/2, y - 24 + this.height/2));
        this.eggSacs.push(new SpiderHiveEgg(scene, x + 48 + this.width/2, y + this.height/2));
        this.eggSacs.push(new SpiderHiveEgg(scene, x - 48 + this.width/2, y - 32 + this.height/2));
        
    }
    update(time,delta){
        this.anims.play('boss-hive', true);
        this.spew();
        this.eggSacs.forEach(function(e){e.update()});
    }
    spew(){
        
        if (this.gun.ready)//ROF(MS)
        {    
            if(spiders.countActive(true) < 3){
                this.spawnGlob.fire(this.x, this.y-(this.height*1/4), 2, -6, 300);
            }else{
                let pc = Phaser.Math.Between(4,12); 
                let angleInc = 180/pc;
                angleInc+=(Phaser.Math.Between(-5,5));
                for(let p=1;p < pc;p++){
                    let acidBullet = this.acidGroup.get(this.x, this.y,'bullet',0);
                    acidBullet.setCollidesWith([ CATEGORY.GROUND, CATEGORY.SOLID, CATEGORY.SOLANA ])
                    acidBullet.setDepth(DEPTH_LAYERS.ENEMIES-1);
                    let acidSpeed = 3;                    
                    let angle = (angleInc*p)*(Math.PI/180)*-1;
                    let vecX = Math.cos(angle)*acidSpeed;
                    let vecY = Math.sin(angle)*acidSpeed; 

                    acidBullet.fire(this.x, this.y, vecX, vecY, 300);
                }
            }
            this.gun.shoot();//Decrease mag size. Can leave this out for a constant ROF.
        }
        if(this.gun){
            this.gun.update();
        
        }
    }
    //Could check the amount of active spiders? If there is less than three, just spawn more.
    spawnSpider(x,y){
        console.log("trying to spawn spiders",spiders.countActive(true));
        if(spiders.countActive(true) < 3){
            let tpX = (x/32 << 0);
            let tpY = (y/32 << 0);

            let newSpider = spiders.get(tpX*mapTileSize.tw-8,tpY*mapTileSize.tw-8);
            newSpider.setPosition(tpX*mapTileSize.tw-8,tpY*mapTileSize.tw-8);
            newSpider.hive = this;
            newSpider.id = Phaser.Math.Between(0,999);
        }
    }
    // removeSpider(id){
    //     let q = -1;
    //     for(let i=0;i < this.spiderlings.length;i++){
    //         if(this.spiderlings[i].id == id){
    //             q = i;
    //         }
    //     }   
    //     if(q != -1){
    //         this.spiderlings.splice(q,1);
    //     }   
        
    // }
}
class SpiderHiveEgg extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'boss_spideregg', 0)        
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;

        const coreArea =  Bodies.circle(0, 0, this.width*.80, {isSensor: true });
        
        const mainBody = Body.create({
            parts: [coreArea],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 1,
            restitution: 0.00,
            label: "BossSpiderHiveEgg"
        });

        this
        .setExistingBody(mainBody)
        .setFixedRotation()
        .setStatic(true)
        .setPosition(x,y);
        
        //Custom Properties
 
 
        this.setDepth(DEPTH_LAYERS.ENEMIES);
        
    }
    update(time,delta){
        this.anims.play('boss-hive-egg-grow', true);
    }
}

//SLIME MONSTER PARTS


class BossSlime extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'boss_slime_main', 0)
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
        .setCollidesWith([0])//Nothing
        .setPosition(x, y)
        .setStatic(true) 

        this.scene.anims.create({
            key: 'boss_slime_bite',
            frames: scene.anims.generateFrameNumbers('boss_slime_main', { frames:[0,1,2,3,4,5] }),
            frameRate: 12,
            repeat: -1
        });
        this.anims.play('boss_slime_bite',true);
        this.scene.events.on("update", this.update, this);
        
        this.scene.events.on("shutdown", this.remove, this);
        this.scene.events.on("destroy", function(){console.log("BOSS Instance: Scene Destroy Event");}, this);

        //BUG- Boss needs to be cleaned up on Scene Shutdown/Destroy. Because I'm using events, timers and globals, it is causing issues on restart.

        //Columns - these need to be their own matter objects that can slam into the player and/or bright
        // this.tentacle1Comp = this.scene.matter.add.stack(this.x,this.y,1,4,4,4,function(x,y){
        //     return Bodies.rectangle(x,y,32,32)
        // });
        // this.tentacle1Chain = this.scene.matter.add.chain(this.tentacle1Comp,0.5, 0, -0.5, 0, { stiffness: 1});
        // console.log(this.tentacle1Chain);

        this.bst1 = new BossSlimeTentacle(this,this.x-this.width/2,this.y+this.height/2-16,6,1);
        this.bst2 = new BossSlimeTentacle(this,this.x+this.width/2,this.y+this.height/2-16,6,1);
        this.bst1a = new BossSlimeTentacle(this,240,320,3,-1);
        this.bst2a = new BossSlimeTentacle(this,448,320,3,-1);

        this.attacking = true;
        this.tentacleTimer = this.scene.time.addEvent({ delay: 30000, callback: function(){
            
            this.attacking = false;

        }, callbackScope: this, loop: false});



        //Acid
        this.acidFrame = 0;
        this.acidpool = this.scene.add.tileSprite(this.x,this.y+this.height/2,784,32,'boss_slime_acidpool',this.acidFrame);
        this.acidTimer = this.scene.time.addEvent({ delay: 250, callback: function(){
            this.acidFrame++;
            if(this.acidFrame >= this.acidpool.displayTexture.frameTotal-1){this.acidFrame=0;};
            this.acidpool.setFrame(this.acidFrame);
        }, callbackScope: this, loop: true }); 

        //Stats
        this.alive = true;
    
    }
    update(time, delta)
    {   
        if(this.attacking && this.alive){
            this.bst1.setGraspVelocity(0,-5);
            this.bst2.setGraspVelocity(0,-5); 
            this.bst1a.setGraspVelocity(0,5);
            this.bst2a.setGraspVelocity(0,5);  
        }
    }
    remove(){
        this.alive = false;
        this.acidTimer.destroy();
        this.bst1.remove();
        this.bst1a.remove();
        this.bst2.remove();
        this.bst2a.remove();
        this.destroy();
    }
};

class BossSlimeTentacle{
    constructor(parent,pX,pY,links,dir){
        //Make tentacle by using joints
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules   
        this.base = parent.scene.matter.add.image(pX, pY-16, 'boss_slime_column', null, { shape: 'rectangle', chamfer: { radius: 5 }, mass: 200, restitution: 0.0, friction: 0.5, frictionAir: 0.5 });
        Body.scale(this.base.body,0.75,0.75);
        this.base.setFixedRotation();        
        this.base.setIgnoreGravity(true);
        this.base.setCollisionCategory(CATEGORY.BOSS)
        this.base.setStatic(true);
        //base.setCollidesWith([0]);//Nothing
        // this.scene.matter.add.joint(this,base, 4, 1,{
        //     pointA: { x: -this.width/2, y: this.height/2 },
        //     pointB: { x: 0, y: base.height/2 }
        // });
        //Add 6 Joints, and then a cap
        this.stack = [];
        this.blendStack = [];
        for(let j=0;j < links;j++){
            let tBody = parent.scene.matter.add.image(pX, this.base.y-(24*(j+1)*dir), 'boss_slime_column', null, { shape: 'rectangle', chamfer: { radius: 5 }, mass: 0.3, restitution: 0.0, friction: 0.5, frictionAir: 0.03 });
            Body.scale(tBody.body,0.75,0.75);
            tBody.setCollisionCategory(CATEGORY.BOSS)
            tBody.setCollidesWith([CATEGORY.GROUND,CATEGORY.BOSS]);//Nothing
            //tBody.setIgnoreGravity(true);
            let sBody = (j==0)?this.base:this.stack[j-1];
            parent.scene.matter.add.joint(sBody,tBody, 1, 1,{
                pointA: { x: 0, y: (-tBody.height/2+4)*dir },
                pointB: { x: 0, y: (tBody.height/2-4)*dir },
            });
            this.stack.push(tBody);
            //this.blendStack.push(parent.scene.add.image(pX, this.base.y-(38*(j+1))-tBody.height/2,'boss_slime_column',1));
        }
        this.cap = parent.scene.matter.add.image(pX, this.stack[this.stack.length-1].y-(24*dir), 'boss_slime_column', 3, { shape: 'rectangle', mass: 1, chamfer: { radius: 15 }, restitution: 0.0, friction: 0.5, frictionAir: 0.03 });
        if(dir == -1){this.cap.setFlipY(true);}
        Body.scale(this.cap.body,0.75,0.75);
        let cap = this.cap;
        parent.scene.matter.add.joint(this.stack[this.stack.length-1],cap, 1, 1,{                
            pointA: { x: 0, y: (-cap.height/2+4)*dir },
            pointB: { x: 0, y: (cap.height/2-4)*dir },
        });
        this.cap.setCollisionCategory(CATEGORY.BOSS)
        this.cap.setCollidesWith([CATEGORY.SOLANA, CATEGORY.DARK, CATEGORY.GROUND]);
    }
    setGraspVelocity(x,y){
        this.cap.setVelocity(x,y);
    }
    remove(){
        this.base.destroy();
        this.stack.forEach(e=>{e.destroy();});
        this.cap.destroy(); 

    }
}
