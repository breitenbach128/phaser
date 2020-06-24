//Abilities Library

class BrightBeam {
    constructor(scene, x,y, angle){
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.rects = [];
        this.angle = angle;
        this.width = 8;//Pixel size of a default chunk
        this.height = 4;//Pixel size of default chunk
        this.ready = true;
        //NOT WORKING
        // var graphics = this.scene.make.graphics().fillStyle(0xFFFF00).fillRect(this.x, this.y, this.width, this.height);

        // graphics.generateTexture('beamRect',this.width, this.height);
        // let newRect = this.scene.matter.add.image(this.x, this.y, 'beamRect');
        // graphics.destroy();

        //WORKING
        if(this.scene.textures.get("beam1").key != "__MISSING"){  
            let oldShadow = this.scene.textures.get("beam1");
            oldShadow.destroy();
        }
        this.texture = this.scene.textures.createCanvas('beam1', this.width, this.height);

        //  We can access the underlying Canvas context like this:
        var grd = this.texture.context.createLinearGradient(0, 0, this.width, this.height);
    
        grd.addColorStop(0, '#CCCC00');
        grd.addColorStop(1, '#FFFF33');
    
        this.texture.context.fillStyle = grd;
        this.texture.context.fillRect(0, 0, this.width, this.height);
    
        //  Call this if running under WebGL, or you'll see nothing change
        this.texture.refresh();

        //COMPONSITE MATTERJS
        //Matter.Composite.allBodies(this.matter.world.engine.world)
        //console.log(this.matter.world.engine.world.bodies); // All Bodies in the world
        //Matter.Query.point(bodies, point)
        //Query every X pixels along the length. Once it hits a body of the unallowed type, stop and measure distance. Keep 
        //reducing by half until it does not hit. Then walk it out 1 pixel at a time. Or just walk it out 1 pixel from the begining.
        //Once length is set, make the bridge, scaleing the bodies to best fit.

        let spark1 = this.scene.add.particles('lightburst-1');
        this.sparker = spark1.createEmitter({
            active:true,
            x: 0,
            y: 0,
            angle: 0,
            radial: true,
            speed: 40,
            scale: { start: 0.20, end: 0.1 },
            alpha: { start: 1, end: 0 },
            lifespan: 300,
            blendMode: 'NORMAL'
        });
        this.sparker.setVisible(true);
        

    }
    create(x,y,angle){
        this.x = x;
        this.y = y;
        this.angle = angle;

        this.rects.forEach(function(e){
            e.destroy();
        });
        this.blast = ab_solarblasts.get();
        let bulletSpeed = 5;
        let vecX = Math.cos(angle)*bulletSpeed;
        let vecY = Math.sin(angle)*bulletSpeed;  
        this.sparker.setAngle(Phaser.Math.RadToDeg(angle));
        
        this.blast.fire(this.x,this.y, vecX, vecY, 35);

        //Fire a project that is moving and "creates" the light beam
        //The walkway will slowly fade and die from the oldest to the newest.
        //It gives off sparks of light, and lights up the area as well.

        //Phaser.Physics.Matter.Matter.Query.point(this.matter.world.localWorld.bodies, {x:pointer.worldX, y:pointer.worldY})
        //Phaser.Physics.Matter.Matter.Query.collides(this.body, this.matter.world.localWorld.bodies)
        //Run until a collision
        let doMake = true;
        let r=0;
        while(doMake){

            let dX = Math.cos(angle)*(this.width*r)+this.x;
            let dY = Math.sin(angle)*(this.width*r)+this.y;  
            
            let beamblock = ab_brightbeams.get(dX, dY, 'beam1')  
            beamblock.setup(this,angle);
            beamblock.setVisible(false);
            r++;
            let ck = Phaser.Physics.Matter.Matter.Query.collides(beamblock.body, this.scene.matter.world.localWorld.bodies);
            //console.log(ck.length,r);
            this.rects.push(beamblock);
            if(ck.length > 1 || r > 15){
                doMake = false;
                //Try just killing the last one
                beamblock.destroy();
            }

        }

    }
    setReady(){
        this.ready = true;
    }
    

}
class BrightBeamBlock extends Phaser.Physics.Matter.Image{
    constructor(scene,x,y,texture) {
        super(scene.matter.world, x, y, texture,0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this);
        //Bodies
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; 
        const { width: w, height: h } = this;
        const mainBody =  Bodies.rectangle(0,0,w,h);
        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 0.1,
            restitution : 0.0,
            label: "BRIGHTBEAM"
        });
        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.BULLET)
        .setCollidesWith([ CATEGORY.SOLANA, CATEGORY.DARK, CATEGORY.SOLID])
        .setPosition(x,y)
        .setStatic(true);  

    }
    setup(parent,angle){
        //Custom Props 
        this.setActive(true);
        this.rotation = angle;
        this.particleEffect = parent.sparker;
        this.source = parent.blast; 
        this.decayAlpha = {l:1,r:1}
        this.beginDecay = false;
        this.delayDecay = {i:0,m:300};
        this.setAlpha(0);
        this.decayRate = .05;
    }
    update(time, delta)
    {
        
        if(this.source){
            let srcVelX = this.source.body.velocity.x;
            let srcVelY = this.source.body.velocity.y;
            let srcPosX = this.source.x;
            let srcPosY = this.source.y;
            if((srcVelX > 0 && srcPosX > this.x || srcVelX < 0 && srcPosX < this.x) 
            && (srcVelY > 0 && srcPosY > this.y || srcVelY < 0 && srcPosY < this.y)
            && this.beginDecay == false){
                this.beginDecay = true;
                this.setAlpha(1);
            }
        }
        if(this.beginDecay && this.delayDecay.i >= this.delayDecay.m){
            this.decayAlpha.r = this.decayAlpha.r > 0 ? this.decayAlpha.r - this.decayRate : 0;
            //this.decayAlpha.l = this.decayAlpha.l > 0 ? this.decayAlpha.l - this.decayRate*2 : 0;
            // this.setAlpha(this.decayAlpha.l,this.decayAlpha.r,this.decayAlpha.l,this.decayAlpha.r);  
            this.setAlpha(this.decayAlpha.r);
            if(this.decayAlpha.r == 0){this.cleanUp()};
        }
        if(this.beginDecay && this.delayDecay.i < this.delayDecay.m){
            this.delayDecay.i++;
            let p = this.particleEffect.emitParticleAt(this.x,this.y,1);
            //p.rotation = this.rotation;
        };
    }
    cleanUp(tween, targets, beam){
        this.destroy();
    }

}
//Updated Lightblock
class Lightblock extends Phaser.Physics.Matter.Image{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'lightblock',0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this);
        //Bodies
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; 
        const { width: w, height: h } = this;
        //const mainBody =  Bodies.rectangle(0,0,w,h);
        const mainBody =  Bodies.circle(0,0,w*0.5);
        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 0.9,
            restitution : 0.0,
            label: "LIGHTBLOCK"
        });
        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.BULLET)
        .setCollidesWith([ CATEGORY.SOLANA, CATEGORY.DARK, CATEGORY.SOLID])
        .setPosition(x,y)
        .setDepth(DEPTH_LAYERS.OBJECTS)
        .setAlpha(0.9); 

        this.scene.time.addEvent({ delay: 1000000, callback: this.death, callbackScope: this, loop: false });
        //Collision
        this.scene.matterCollision.addOnCollideStart({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;

                if (gameObjectB !== undefined && gameObjectB instanceof Solana) {
                    this.setFrame(1)
                }
            }
        });
        this.scene.matterCollision.addOnCollideEnd({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;

                if (gameObjectB !== undefined && gameObjectB instanceof Solana) {
                    this.setFrame(0)
                }
            }
        });
        this.deathSprite = this.scene.add.sprite(this.x,this.y,'lightblockdeath').setAlpha(0.6).setDepth(DEPTH_LAYERS.OBJECTS);
        this.deathSprite.setVisible(false);
 
    }
    death(){
        this.setVisible(false);
        this.deathSprite.setVisible(true);
        //ligthblock-death
        this.deathSprite.anims.play('lightblock-death',true);
        //Handle death animation
        this.deathSprite.on('animationcomplete', this.remove, this); 
    }
    remove(){
        this.deathSprite.destroy();
        this.destroy();
    }
}
class LightblockLarge extends Phaser.Physics.Matter.Image{
    constructor(scene,x,y,lightparent) {
        super(scene.matter.world, x, y, 'lightblock2',0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this);
        //Bodies
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; 
        const { width: w, height: h } = this;
        //const mainBody =  Bodies.rectangle(0,0,w,h);
        const mainBody =  Bodies.rectangle(0,0,w,h*0.75,{chamfer: {radius: 2}});
        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.3,
            friction: 0.9,
            restitution : 0.0,
            label: "LIGHTBLOCK"
        });
        this
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.BULLET)
        .setCollidesWith([ CATEGORY.SOLANA, CATEGORY.DARK, CATEGORY.SOLID, CATEGORY.INTERACTIVE])
        .setPosition(x,y)
        .setDepth(DEPTH_LAYERS.OBJECTS)
        .setAlpha(0.9); 

        //Collision
        this.scene.matterCollision.addOnCollideStart({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;

                if (gameObjectB !== undefined && gameObjectB instanceof Solana) {
                    this.setFrame(1)
                }
                if (gameObjectB !== undefined && gameObjectB instanceof Solanchor) {
                    this.lightparent.attachFirst(gameObjectB);
                }
            }
        });
        this.scene.matterCollision.addOnCollideEnd({
            objectA: [this],
            callback: eventData => {
                const { bodyB, gameObjectB,bodyA,gameObjectA } = eventData;

                if (gameObjectB !== undefined && gameObjectB instanceof Solana) {
                    this.setFrame(0)
                }
            }
        });    
        this.lightparent = lightparent;
 
    }
}
//Lightrope
class Lightrope {
    constructor(scene,owner){
        this.nodes = []; 
        this.links = [];
        this.scene = scene;
        this.anchored = false;
        this.owner =  owner;    
        this.max_length = 20;
        this.isAttached = false;
        this.active = true;
        this.scene.events.on("update", this.update, this);  
        this.scene.events.on("shutdown", this.remove, this);
    }
    anchorBase(x,y){
        this.nodes[0].setStatic(true);
        this.nodes[0].setPosition(x,y);
        this.anchored = true;
    }
    attachFirst(obj){
        if(this.headConstraint != undefined){
            this.scene.matter.world.remove(this.headConstraint);
        }
        let n = this.nodes[this.nodes.length-1];
        this.headConstraint = this.scene.matter.add.constraint(n, obj, 0, 0.9, {
            length: 0.0,
            stiffness: 0.9
        })
        this.isAttached = true;

    }
    addNode(x,y){
        let lb = new LightblockLarge(this.scene,x,y,this);
        
        if(this.nodes.length > 0){
            let lbPrev = this.nodes[this.nodes.length-1];
            //Add Connection / Contraint
            let link = this.scene.matter.add.constraint(lb, lbPrev, 0, 0.9, {
                pointA: { x: -lb.width*0.5+1, y: 0 },
                pointB: { x: lb.width*0.5-1, y: 0 },
                length: 0.0,
                stiffness: 0.9
            })
            this.links.push(link);

        }
        this.nodes.push(lb);
        //this.attachFirst(this.owner);
    }
    removeNode(i){
        this.nodes.splice(i,1);
    }
    update(){
        if(this.active){
            if(this.nodes.length > 0){
                let frontBlock = this.nodes[this.nodes.length-1];
                if(this.isAttached == false){
                    let a2b = Phaser.Math.Angle.Between(frontBlock.x,frontBlock.y,this.owner.x,this.owner.y);
                    frontBlock.applyForce({x:Math.cos(a2b)*0.001,y:Math.sin(a2b)*0.001});
                }
                // 8 is light block width.
                if(this.owner != undefined){
                    if(distanceBetweenObjects(frontBlock,this.owner) > 8 && this.isAttached == false){
                        if(this.nodes.length < this.max_length){
                            //Spawn new nodes
                            frontBlock.setRotation(0);
                            this.addNode(this.owner.x,this.owner.y);
                        }else{
                            this.attachFirst(this.owner);
                        }
                    }
                }
            }
        }

    }
    remove(){
        this.active = false;
    }
    destroy(){
        this.nodes.forEach(e=>{e.destroy()});
    }
}

//SolarBlast

class SolarBlast extends Phaser.Physics.Matter.Sprite{

    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'ability_solarblast', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this);
        //Bodies
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; 
        const { width: w, height: h } = this;
        const mainBody =  Bodies.circle(0,0,w*.40);
        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 0.1,
            restitution : 0.7,
            label: "ABILITY-SOLAR-BLAST"
        });
        this.setExistingBody(compoundBody).setCollisionCategory(CATEGORY.BULLET)
        .setCollidesWith([ CATEGORY.MIRROR, CATEGORY.GROUND, CATEGORY.SOLID, CATEGORY.ENEMY ]).setPosition(x, y)
        .setScale(.5).setIgnoreGravity(true);
        //Custom Props
        this.damage = 1;    
        this.lifespan = 0;
        this.bounced = false;
    }
    fire(x, y, xV, yV, life)
    {       
        this.setPosition(x,y);
        this.setActive(true);
        this.setVisible(true);

        this.lifespan = life;
        this.setVelocity(xV,yV);
        this.anims.play('ability-solar-blast-shoot', true); 

    }
    hit(){
        this.lifespan = 0;
        this.kill();
    }
    kill(){       
        this.setVelocity(0,0);
        this.setPosition(-1000,-1000);
        this.setActive(false);
        this.setVisible(false); 
    }
    update(time, delta)
    {
        if(this.active){
        this.lifespan--;
            if (this.lifespan <= 0)
            {
                this.kill();
            }
        }

    }

};