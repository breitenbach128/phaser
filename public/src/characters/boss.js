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

//RockChute
class RockChute extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'rockchute', 0)
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
            label: "CHUTE"
        });

        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.SOLID)
        .setCollidesWith([0])//Nothing
        .setPosition(x, y)
        .setStatic(true) 
        
        this.rockTimer = this.scene.time.addEvent({ delay: 3000, callback: this.makeRocks, callbackScope: this, loop: true });        
        //this.scene.events.on("update", this.update, this);
    
    }
    setup(x,y){
        this.setActive(true);
        this.setPosition(x,y); 
    }
    update(time, delta)
    {   
        
    }
    makeRocks(){
        if(rocks.getTotalUsed() < 5){ // NO more rocks than 5
            let newRock = rocks.get(this.x,this.y);
            newRock.setup(this.x,this.y, 1);
            newRock.setVelocityY(0);
            newRock.applyForce({x:Phaser.Math.FloatBetween(0.01,0.02),y:0});        
        }
    }
};