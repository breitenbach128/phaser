//Abilities Library
//Items have a primary and secondary ability for each.
//Items are normal, and then charged. Once charged, they get their secondary ability.

//Solarblast - Solana : Fire a blast of solar energy. Can defeat enemies and light up crystals

//Halo of Light - Solana : Persists for several seconds, and gives light. 

//Search for the Light - Solana : Solana Teleports to Bright, instantly taking the light and turning him to dark.

//Super Nova - Solana: Sends a blast of small suns out in all directions.

//Wings of the Phoenix - Solana: Allows her to second jump, surging forward and slightly up.

//Pillar of the Sun - Solana: Calls down a pillar of light that blocks all enemeies and damages them in a close area.

//Bright Bump - Bright: Bumps Solana in a direction. Can toss her up.

//Bright Beam - Bright: Fires a beam that can be walked on by Solana and persists for a short time.
class BrightBeam {
    constructor(scene, x,y, angle){
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.rects = [];
        this.angle = angle;
        this.width = 40;//Pixel size of a default chunk
        this.height = 8;//Pixel size of default chunk

        //NOT WORKING
        // var graphics = this.scene.make.graphics().fillStyle(0xFFFF00).fillRect(this.x, this.y, this.width, this.height);

        // graphics.generateTexture('beamRect',this.width, this.height);
        // let newRect = this.scene.matter.add.image(this.x, this.y, 'beamRect');
        // graphics.destroy();

        //WORKING
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
        //Matter.Composite.allBodies(engine.world)
        //Matter.Query.point(bodies, point)
        //Query every X pixels along the length. Once it hits a body of the unallowed type, stop and measure distance. Keep 
        //reducing by half until it does not hit. Then walk it out 1 pixel at a time. Or just walk it out 1 pixel from the begining.
        //Once length is set, make the bridge, scaleing the bodies to best fit.

        

    }
    nextRect(){
        //new Rectangle(scene, x, y [, width] [, height] [, fillColor] [, fillAlpha])
        let angle = Phaser.Math.DegToRad(45);

        for(let r=0;r<3;r++){

            let dX = Math.cos(angle)*(this.width*r)+this.x;
            let dY = Math.sin(angle)*(this.width*r)+this.y;  
            
            let newRect2 = this.scene.matter.add.image(dX, dY, 'beam1');        
            newRect2.setStatic(true);               
            newRect2.rotation = angle;
        }

        // newRect.setVisible(true);

        //let newRect = new Phaser.GameObjects.Rectangle(this.scene, this.x, this.y, this.width, this.height, 0xFFFF00, 1.0);
        //let bodyRect = this.scene.matter.add.rectangle(this.x, this.y, this.width, this.height, { restitution: 0.9 });

        //this.scene.sys.displayList.add(newRect);
        //this.scene.sys.updateList.add(newRect);   
        //this.scene.matter.world.add(newRect);
        //this.scene.add.existing(newRect);

        // const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules        
        // const { width: w, height: h } = newRect;

        // const mainBody =  Bodies.rectangle(0,0,w,h);
        // const compoundBody = Body.create({
        //     parts: [mainBody],
        //     frictionStatic: 0,
        //     frictionAir: 0.00,
        //     friction: 0.1,
        //     restitution : 0.0,
        //     label: "ABILITY-BRIGHT-BRIDGE"
        // });
        // newRect.setExistingBody(compoundBody)
        // .setCollisionCategory(CATEGORY.SOLID)
        // .setCollidesWith([ CATEGORY.SOLANA])
        // .setPosition(this.x, this.y)
        // .setFixedRotation()
        // .setIgnoreGravity(true);

    }
    

}
//Sun

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