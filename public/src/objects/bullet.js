class Bullet extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y,texture) {
        super(scene.matter.world, x, y, texture, 0)
        this.scene = scene;
        // Create the physics-based sprite that we will move around and animate
        scene.matter.world.add(this);
        // config.scene.sys.displayList.add(this);
        // config.scene.sys.updateList.add(this);
        scene.add.existing(this); // This adds to the two listings of update and display.

        this.setActive(true);

        this.sprite = this;

        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this.sprite;
        const mainBody =  Bodies.circle(0, 0, w*0.50);

        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 0.0,
            restitution : 0.7
        });
        compoundBody.label = "BULLET";
        this.sprite
        .setExistingBody(compoundBody)
        .setCollisionCategory(CATEGORY.BULLET)
        .setPosition(x, y)
        .setScale(0.75)
        .setIgnoreGravity(true);
                    
        this.damage = 1;    
        this.lifespan = 0;
        this.bounced = false;
        this.effects = [];
        this.deathEffects = [];
        this.owner = null;
    }
    fire(x, y, xV, yV, life)
    {       
        this.setPosition(x,y);
        this.setActive(true);
        this.setVisible(true);

        this.lifespan = life;
        this.bounced = false;

        //this.applyForce({x:xV,y:yV})
        this.setVelocity(xV,yV);

    }
    setOwner(object){
        this.owner = object;
    }
    setEffects(effectsArray){
        this.effects = effectsArray;
    }
    setDeathEffects(effectsArray){
        this.deathEffects = effectsArray;
    }
    getEffects(){
        return this.effects;
    }
    hit(){
        this.lifespan = 0;
        this.kill();
    }
    kill(){       
        this.sprite.setVelocity(0,0);
        this.setPosition(-1000,-1000);
        this.setActive(false);
        this.setVisible(false);
        //mayeb toggle static on and off for the kill and fire 
    }
    onDeathEffect(){
        //Trigger this on death.
    }
    bounceOff(angle,mirrorSize,mirrorX,mirrorY){
        //Bounce off of object
        //Set new position
        // let x = (mirrorSize * Math.sin(angle)) + mirrorX;
        // let y = (mirrorSize * -Math.cos(angle)) + mirrorY;

        // this.setPosition(x,y);
        //Apply veloctiy
        this.scene.physics.velocityFromRotation(angle, this.velocity.x, this.body.velocity);
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
    enterWater(){
        this.setFrictionAir(0.25);
    }
    exitWater(){
        this.setFrictionAir(0.00);
    }

};
class SpiderSilk extends Bullet{

    constructor(scene,x,y,texture) {
        super(scene,x,y,texture);
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
    //Set actiom to move spider vertical
    hit(){
        this.lifespan = 0;
        if(this.owner){
            this.owner.climbToTile();
        }
        this.kill();
    }
}
class SpiderSpawnOrb extends Bullet{

    constructor(scene,x,y,texture) {
        super(scene,x,y,texture);
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
    //Set actiom to move spider vertical
    hit(){
        this.lifespan = 0;
        if(this.owner){
            this.owner.spawnSpider(this.x,this.y);
        }
        this.kill();
    }
}

//What happens when the bullet dies?
//Explode: Spawn more projectiles
//Spawn Item: Spawn an item
//Spawn Enemy: Spawn an enemy
//Visual Effect: Create a visual effect.
function deathEffects(){

}
//Stunned: Can't move or shoot.
//Slowed: Half Movement speed
//DOT: Take damage over time
//Darkened: Lose light power
//Steal Light: Lose Light shards
//Steal Dark: Lose Dark shards
//Throw: Move player in a direction relative to projectile movement vector
function bulletEffect(type,chance,duration,value,visualType,visualData){
    this.type = type;
    this.chance = chance;
    this.duration = duration;
    this.value = value;//If a numeric value is used;
    this.visualType = visualType; //Anim, Particle, None
    this.visualData = visualData;
}