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