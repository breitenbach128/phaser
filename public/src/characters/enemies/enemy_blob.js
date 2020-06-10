class EnemyBlob{
    constructor(scene,x,y, collidesWith) {
        this.scene = scene;
        let mask = collidesWith.reduce(function(a,b){return a+b},0);
        this.bodystructure = this.scene.matter.add.softBody(x,y,4,3,-2,0,true,4,{ignoreGravity: false,collisionFilter: {mask: 130, category: CATEGORY.ENEMY }},{stiffness: 0.9});
        console.log(this.bodystructure); 
        this.images = [];
        for(let b=0;b< this.bodystructure.bodies.length;b++){
            let blobbody = this.bodystructure.bodies[b];
            this.images.push(scene.add.image(blobbody.position.x,blobbody.position.y,'oilblob2'));
           
        }


        console.log("Enemy Blob Created",this);
        this.scene.events.on("update", this.update, this);
    }
    update(time,delta){
        for(let i=0;i<this.images.length;i++){
            let img = this.images[i];
            img.setPosition(this.bodystructure.bodies[i].position.x,this.bodystructure.bodies[i].position.y);
        }
    }
}

class EnemyBlobA{
    constructor(scene,x,y,w,h){
        this.scene = scene;
        let shapeObject = this.scene.add.rectangle(x + (w / 2), y + (h / 2),w, h);
        this.blobObj = this.scene.matter.add.gameObject(shapeObject, { shape: { type: 'rectangle', flagInternal: true } });
        this.blobObj.setCollisionCategory(CATEGORY.ENEMY);
        this.blobObj.setCollidesWith([CATEGORY.GROUND,CATEGORY.SOLANA]);
        this.blobImgs = [];
        this.rowCount = Math.floor(h/8);
        this.colCount = Math.floor(w/8);
        
        // for(let j=0;j<Math.floor(h/8);j++){
        //     for(let i=0;i<Math.floor(w/8);i++){
        //         this.blobImgs.push({c:i,r:j,img:this.scene.add.image(x+(i*8),y+(j*8),'oilblob2')});
        //     } 
        // }
        for(let j=0;j<this.rowCount;j++){
            for(let randSpawn=0;randSpawn < j+1;randSpawn++){
                let xR = Phaser.Math.Between(0+(this.rowCount-j)/2,this.colCount-(this.rowCount-j)/2);
                this.blobImgs.push({c:xR,r:j,img: this.scene.add.image(x+(xR*8),y+(j*8),'oilblob2')});
            }
        }

        this.scene.events.on("update", this.update, this);
    }
    update(time,delta){
        // for(let i=0;i<this.blobImgs.length;i++){
        //     let bImb = this.blobImgs[i];
        //     bImb.img.setPosition(this.blobObj.x-this.blobObj.width/2+bImb.c*8+4,this.blobObj.y-this.blobObj.height/2+bImb.r*8+4);
        // }
        for(let i=0;i<this.blobImgs.length;i++){
            let bImb = this.blobImgs[i];
            bImb.img.setPosition(this.blobObj.x-this.blobObj.width/2+bImb.c*8+4,this.blobObj.y-this.blobObj.height/2+bImb.r*8+4);
        }
    }
}
class EnemyBlobC{
    //It should try to engulf Solana.
    //It can only be destroyed if every blob is destroyed. It will slowly regenerate missing blobs/
    //Blobs destroy if they get too far away from it.
    //It can maybe fling blobs?
    //let blob = new EnemyBlobC(playScene,solana.x+32,solana.y-64,32,32)
    constructor(scene,x,y,w,h) {
        this.scene = scene;
        this.active = true;
        let shapeObject = this.scene.add.rectangle(x + (w / 2), y + (h / 2),w, h);
        const { Body, Bodies } = Phaser.Physics.Matter.Matter;
        //this.blobObj = this.scene.matter.add.gameObject(shapeObject, { shape: { type: 'rectangle', flagInternal: true },isSensor: false }); 
        const mainBody =  Bodies.rectangle(0,0,w,h);
        this.sensors = {
            top: Bodies.rectangle(0, -h*0.60, w*0.80, 6, { isSensor: true, friction: 0.0,density: 0.0001,label:"SENSOR_TOP"}), 
            bottom: Bodies.rectangle(0, h*0.60, w*0.80, 6, { isSensor: true, friction: 0.0,density: 0.0001,label:"SENSOR_BOTTOM"}),
            left: Bodies.rectangle(-w*0.60, 0, 6, h*0.80 , { isSensor: true, friction: 0.0,density: 0.0001,label:"SENSOR_LEFT"}),
            right: Bodies.rectangle(w*0.60, 0, 6, h*0.80 , { isSensor: true, friction: 0.0,density: 0.0001,label:"SENSOR_RIGHT"})
          };

        const compoundBody = Body.create({
            parts: [mainBody,this.sensors.top,this.sensors.bottom,this.sensors.left,this.sensors.right],
            frictionStatic: 0.01,
            frictionAir: 0.05,
            friction: 0.9,
            density: 0.01,
            restitution: 0.7,
            label: "BLOB"
        });

        this.blobObj = this.scene.matter.add.gameObject(shapeObject, compoundBody);        
        this.blobObj.setCollisionCategory(CATEGORY.ENEMY);
        this.blobObj.setCollidesWith([CATEGORY.GROUND,CATEGORY.SOLID]);
        this.blobObj.setPosition(x,y);

        this.subblobs = [];
        for(let i=0;i<16;i++){
            let nB = new BlobCBit(this.scene,this.blobObj.x,this.blobObj.y, this);
            if(this.subblobs.length > 14){
                nB.setFrame(1);
            }
            this.subblobs.push(nB);
        }
        this.attractForce = 0.0010;
        this.spawnTracker  = {c:0,max:300};
        this.scene.events.on("update", this.update, this);        
        this.scene.events.on("shutdown", this.remove, this);
        this.moveTimer = this.scene.time.addEvent({ delay: 1500, callback: this.hunt, callbackScope: this, loop: false });
        this.wanderDirection = -1;
        this.blobObj.touching = {top:0,left:0,bottom:0,right:0};
        //Sensor Collision Checking
        this.scene.matter.world.on('beforeupdate', function (event) {
            this.blobObj.touching.left = 0;
            this.blobObj.touching.right = 0;
            this.blobObj.touching.up = 0;
            this.blobObj.touching.down = 0;    
        },this);
        this.scene.matterCollision.addOnCollideActive({
            objectA: [this.sensors.left,this.sensors.right],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                if (gameObjectB !== undefined && 
                    (gameObjectB instanceof Phaser.GameObjects.Rectangle
                    || gameObjectB instanceof Phaser.GameObjects.Ellipse
                    || gameObjectB instanceof Phaser.GameObjects.Polygon)) {
                    if (bodyB.label == 'GROUND'){
                        if(bodyA.label == "SENSOR_RIGHT"){
                            if(gameObjectA != undefined){gameObjectA.touching.right++;}
                        }
                        if(bodyA.label == "SENSOR_LEFT"){
                            if(gameObjectA != undefined){gameObjectA.touching.left++;}
                            
                        }
                    }                
                  }
            }
        });
    }
    update(time,delta){
        if(this.active){
            for(let i=0;i<this.subblobs.length;i++){
                let bit = this.subblobs[i];
                let attrMod = this.attractForce*(this.subblobs.length/12);
                //let bitDis = distanceBetweenObjects(bit,this.blobObj);
                //attrMod = attrMod*(Phaser.Math.Clamp(bitDis,0,this.blobObj.width*2) / (this.blobObj.width*2));

                let targObj = this.blobObj;
                if(bit.isClung){
                    targObj = bit.attachedTo;
                    attrMod = this.attractForce;
                }
                let fAng = Phaser.Math.Angle.Between(bit.x,bit.y,targObj.x,targObj.y);
                bit.applyForce({x:Math.cos(fAng)*attrMod,y:Math.sin(fAng)*attrMod});
            }
            
            if(this.spawnTracker.c >= this.spawnTracker.max){
                this.spawnTracker.c = 0;
                if(this.subblobs.length < 16){
                    let nB = new BlobCBit(this.scene,this.blobObj.x,this.blobObj.y, this);
                    if(this.subblobs.length < 2){
                        nB.setFrame(1);
                    }
                    this.subblobs.push(nB);
                }
            }else{
                this.spawnTracker.c++;
            }
        }

    }
    remove(){
        this.active = false;
        this.moveTimer.remove();
        this.scene.matterCollision.addOnCollideActive({
            objectA: [this.sensors.left,this.sensors.right],
            callback: eventData => {}
        })
        this.blobObj.destroy();
    }
    hunt(){
        let huntdelay = 1500;
        if(this.canSee(solana)){
            if(solana.x < this.blobObj.x){
                this.wanderDirection = -1;
            }else if(solana.x > this.blobObj.x){
                this.wanderDirection = 1;
            }
            huntdelay = distanceBetweenObjects(solana,this.blobObj) > 256 ? 1000: 750;
        }
        let queryX = this.blobObj.x+(this.wanderDirection*this.blobObj.width);
        let rayTo = Phaser.Physics.Matter.Matter.Query.ray(losBlockers,{x:queryX,y:this.blobObj.y},{x:queryX,y:this.blobObj.y+32});
        if(rayTo.length == 0){
            //Flip wander because of pitfall
            this.wanderDirection=this.wanderDirection*-1
        }else if(this.blobObj.touching.left > 0){
            this.wanderDirection = 1;
        }else if(this.blobObj.touching.right > 0){
            this.wanderDirection = -1;
        }

        this.blobObj.applyForce({x:this.wanderDirection*0.008,y:-0.015})
        this.moveTimer = this.scene.time.addEvent({ delay: huntdelay, callback: this.hunt, callbackScope: this, loop: false });
    }
    canSee(target){
        let rayTo = Phaser.Physics.Matter.Matter.Query.ray(losBlockers,{x:this.blobObj.x,y:this.blobObj.y},{x:target.x,y:target.y});
        if(rayTo.length < 1){
            return true;
        }else{
            return false;
        }
        
    }
    killblobbit(){
        for( var i = 0; i < this.subblobs.length; i++){ if ( this.subblobs[i].alive === false) { this.subblobs.splice(i, 1); i--; }};
        
        if(this.subblobs.length == 0){
            this.remove();
        }
    }
}
class BlobCBit extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y, blob) {
        super(scene.matter.world, x, y, 'oilblob2', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this); 

        this.setActive(true);
        this.blob = blob;
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        //const mainBody =  Bodies.circle(0,0,w*.50);
        const mainBody =  Bodies.polygon(0,0,32,w*.25);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0.01,
            frictionAir: 0.5,
            friction: 0.9,
            density: 0.01,
            restitution: 0.7,
            label: "BLOBBIT"
        });
        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.ENEMY)
        .setFixedRotation()
        .setPosition(x, y) 
        .setDensity(0.01)
        .setDepth(DEPTH_LAYERS.OBJECTS);

        this.scene.matterCollision.addOnCollideStart({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;
                if (gameObjectB !== undefined && gameObjectB instanceof SoulTransfer) {
                        gameObjectA.death();
                        gameObjectB.burn();
                }
                if (gameObjectB !== undefined && gameObjectB instanceof Solana) {
                    gameObjectB.receiveDamage(1);
                    gameObjectA.attach(gameObjectB);
                }
            }
        });
        
        this.alive = true;
        this.attachedTo = blob.blobObj;
        this.isClung = false;//Clinging to Solana or Dark? Used for the attraction modifier.
        this.isSplooshing = false;
        
        this.scene.events.on("update", this.update, this);        
        this.scene.events.on("shutdown", this.death, this);
    }
    update(time,delta){
        if(!this.isSplooshing && this.alive){
            if(distanceBetweenObjects(this,this.attachedTo) > 96){
                this.sploosh();
            }
        }
    }
    sploosh(){
        this.setRotation(0);
        this.setVelocityX(0);
        this.isSplooshing = true;
        let twSploosh = this.scene.tweens.add({
            targets: this,
            scaleY: 0.2,               
            ease: 'Linear',       
            duration: 500,  
            onComplete: function(tween, targets, blobit){blobit.death();},
            onCompleteParams: [this],
        });

    }
    attach(target){
        this.attachedTo = target;
        this.isClung = true;        
    }
    death(){
        //When this orb dies, it is spliced out of the parent blob's array.
        this.alive = false;
        this.blob.killblobbit();
        this.destroy();

    }
}