//Blood Splatter
function Splatter(){
    //This will generate a splatter/drip effect for certain types of projectiles. These fall to ground, and pool outwards, and then drip down.
    

}
//Shadow Blob Splatter

//Sparkles

//Glow Shader
var ShaderGlow = new Phaser.Class({
    Extends: Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline,
    initialize:
    function CustomPipeline (game)
    {
    Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline.call(this, {
            game: game,
            renderer: game.renderer,
            fragShader: [
                'precision lowp float;',
                'varying vec2 outTexCoord;',
                'varying vec4 outTint;',
                'uniform sampler2D uMainSampler;',
                'uniform float alpha;',
                'uniform float time;',
                'void main() {',
                    'vec4 sum = vec4(0);',
                    'vec2 texcoord = outTexCoord;',
                    'for(int xx = -4; xx <= 4; xx++) {',
                        'for(int yy = -4; yy <= 4; yy++) {',
                            'float dist = sqrt(float(xx*xx) + float(yy*yy));',
                            'float factor = 0.0;',
                            'if (dist == 0.0) {',
                                'factor = 2.0;',
                            '} else {',
                                'factor = 2.0/abs(float(dist));',
                            '}',
                            'sum += texture2D(uMainSampler, texcoord + vec2(xx, yy) * 0.002) * (abs(sin(time))+0.06);',
                        '}',
                    '}',
                    'gl_FragColor = sum * 0.025 + texture2D(uMainSampler, texcoord)*alpha;',
                '}'
            ].join('\n')
        });
    } 
});
var ShaderGlow2 = new Phaser.Class({

    Extends: Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline,

    initialize:

    function CustomPipeline (game)
    {
        Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline.call(this, {
            game: game,
            renderer: game.renderer,
            fragShader: `
            precision mediump float;

            uniform sampler2D uMainSampler;
            uniform vec2 uResolution;
            uniform float uTime;

            varying vec2 outTexCoord;
            varying vec4 outTint;

            vec4 plasma()
            {
                vec2 pixelPos = gl_FragCoord.xy / uResolution * 20.0;
                float freq = 0.8;
                float value =
                    sin(uTime + pixelPos.x * freq) +
                    sin(uTime + pixelPos.y * freq) +
                    sin(uTime + (pixelPos.x + pixelPos.y) * freq) +
                    cos(uTime + sqrt(length(pixelPos - 0.5)) * freq * 2.0);

                return vec4(
                    cos(value),
                    sin(value),
                    sin(value * 3.14 * 2.0),
                    cos(value)
                );
            }

            void main() 
            {
                vec4 texel = texture2D(uMainSampler, outTexCoord);
                texel *= vec4(outTint.rgb * outTint.a, outTint.a);
                gl_FragColor = texel * plasma();
            }

            `
        });
    } 


});
//Rotational Shader
var ShaderTest = new Phaser.Class({
    Extends: Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline,
    initialize:
    function CustomPipeline (game)
    {
    Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline.call(this, {
            game: game,
            renderer: game.renderer,
            fragShader: [
                    "#ifdef GL_ES",
                    "precision mediump float;",
                    "#endif",
                    "#extension GL_OES_standard_derivatives : enable",
                    "uniform float time;",
                    "uniform vec2 mouse;",
                    "uniform vec2 resolution;",
                    "void main(void){",
                    "vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);",
                    "vec3 color = vec3(0.0, 0.3, 0.5);",
                    "float f = 0.0;",
                    "float PI = 3.141592;",
                    "for(float i = 0.0; i < 20.0; i++){",
                    "float s = sin(time*1.1 + i * PI / 10.0) * 0.80 ;",
                    "float c = cos(time*1.1 + i * PI / 10.0) * 0.80;",
                    "f += 0.001 / pow( pow(abs(p.x + c),2.) + pow(abs(p.y + s),2.),.534+0.5*sin(-time*3.321+i/3.14159265+s*c*0.1));",
                    "s = s*0.3;",
                    "f += 0.001 / pow( pow(abs(p.x + c),2.) + pow(abs(p.y - s),2.),.534+0.5*sin(+time*3.321+i/3.14159265+s*c*0.1));",
                    "s = s*0.4;",
                    "f += 0.001 / pow( pow(abs(p.x + c),2.) + pow(abs(p.y + s),2.),.534+0.5*sin(-time*3.321+i/3.14159265+s*c*0.1));",
                    "}",
                    "gl_FragColor = vec4(vec3(  f*color), 1.0);",
                    "}"
            ].join('\n')
        });
    } 
});

//Flash Effect
function FlashSpriteTint(scene,sprite,color,time){
    let c1 = Phaser.Display.Color.HexStringToColor('#ffffff'); // From no tint
    let c2 = Phaser.Display.Color.HexStringToColor(color); // To RED
    console.log(c2,sprite)
    this.tweenStep = 0;
    let tween = scene.tweens.add({
        targets: sprite,
        tweenStep: 100,
        onUpdate: ()=>{
            
            let col = Phaser.Display.Color.Interpolate.ColorWithColor(c1, c2, 100, this.tweenStep);
            let colourInt = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
            sprite.setTint(colourInt);
            console.log("Tweening Color for flash",col.r, col.g, col.b, this.tweenStep);

        },
        duration: time,
        yoyo: true // Return to first tint
    });

    // //sprite.setTint(0xff0000);
    // sprite.tint = c1._color;

    // let tween = scene.tweens.add({
    //     targets: sprite,
    //     tint: c2._color,
    //     duration: time,
    //     onComplete: ()=>{
    //         console.log("tween complete");
    //         sprite.clearTint();
    //     }
    // });

    }

//Light Shard
class LightShard extends Phaser.Physics.Matter.Sprite{

    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'shard_light', 0)
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
            frictionAir: 0.05,
            friction: 0.1,
            restitution : 0.0,
            label: "LIGHT_SHARD"
        });
        this.setExistingBody(compoundBody).setCollisionCategory(CATEGORY.BULLET)
        .setCollidesWith([ CATEGORY.SOLANA]).setPosition(x, y)
        .setScale(.25).setIgnoreGravity(true).setDepth(DEPTH_LAYERS.FG);
        //Custom Props
        this.damage = 1;    
        this.lifespan = 0;
        this.bounced = false;
        this.target = this;
        this.max_speed = 7;
        this.angleMod = 0;
        this.angleModRate = -0.10;
        this.collectSnd = this.scene.sound.add('shard1',{volume: 0.10});
    }
    spawn(x, y, life, target)
    {       
        this.setPosition(x,y);
        this.setActive(true);
        this.setVisible(true);    
        this.lifespan = life;
        this.target = target;
        let rngPicks = [Math.PI,(Math.PI*3/4),(Math.PI*1/2),(Math.PI*1/4)];
        this.angleMod = Phaser.Math.RND.pick(rngPicks) * Phaser.Math.RND.sign();//180 Deg
        if(this.angleMod < 0){this.angleModRate = 0.10;}//Adjust for NEG

        this.setAngularVelocity(.5);

        //this.adjustTimer = this.scene.time.addEvent({ delay: 300, callback: this.adjustAngleForce, callbackScope: this, loop: true });
    }
    hit(){
        this.lifespan = 0;
        this.collectSnd.play();
        this.kill();
    }
    kill(){
        //this.adjustTimer.remove();       
        this.setVelocity(0,0);
        this.setPosition(-1000,-1000);
        this.setActive(false);
        this.setVisible(false); 
        this.target = this;
    }
    adjustAngleForce(){
        if(this.lifespan > 0){
            //Apply Force each chunk
            let angle = Phaser.Math.Angle.Between(this.x,this.y, this.target.x,this.target.y) + this.angleMod;
            let forceX = Math.cos(angle)*this.max_speed;
            let forceY = Math.sin(angle)*this.max_speed;  
            //this.applyForce({x:forceX,y:forceY});
            this.setVelocity(forceX,forceY);
        }
    }
    update(time, delta)
    {
        if(this.active){
            //Cap max speed
            if(this.body.velocity.x > this.max_speed){this.setVelocityX(this.max_speed)};
            if(this.body.velocity.x < -this.max_speed){this.setVelocityX(-this.max_speed)};
            if(this.body.velocity.y > this.max_speed){this.setVelocityY(this.max_speed)};
            if(this.body.velocity.y < -this.max_speed){this.setVelocityY(-this.max_speed)};
            this.adjustAngleForce();

            if((this.angleModRate < 0 && this.angleMod > 0) || (this.angleModRate > 0 && this.angleMod < 0)){
                this.angleMod += this.angleModRate;
            }else{
                this.angleMod = 0;
            }

            this.lifespan--;
            if (this.lifespan <= 0)
            {
                this.kill();
            }
        }

    }

};
//Light Burst
class LightBurst extends Phaser.Physics.Matter.Sprite{

    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'light_burst_2', 0)
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
            frictionAir: 0.05,
            friction: 0.1,
            restitution : 0.0,
            label: "LIGHT_BURST"
        });
        this.setExistingBody(compoundBody)
        .setCollidesWith([0]).setPosition(x, y)
        .setScale(.25).setIgnoreGravity(true);

        this.on('animationcomplete',this.death,this); 
        

        //Add into game. When a soullight transfer hits an non-player target, and burns, it generates the LightBurst effect, which is just a visual
    }
    burst(x,y){
        this.setPosition(x,y);
        this.setActive(true);
        this.setVisible(true);
        this.anims.play('light_burst_action', true);
    }
    death(){
        this.setPosition(-1000,-1000);
        this.setActive(false);
        this.setVisible(false);
    }
    update(time, delta)
    {
        if(this.active){

        }

    }

};
//Jump Burst
class JumpBurst extends Phaser.Physics.Matter.Sprite{

    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'doublejump-1', 0)
        this.scene = scene;
        scene.matter.world.add(this);
        scene.add.existing(this);
        //Bodies
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; 
        const { width: w, height: h } = this;
        const mainBody =  Bodies.circle(0,0,w*.40,{ isSensor: true });
        const compoundBody = Body.create({
            parts: [mainBody],
            frictionStatic: 0,
            frictionAir: 0.05,
            friction: 0.1,
            restitution : 0.0,
            label: "JUMP_BURST"
        });
        this.setExistingBody(compoundBody)
        .setCollidesWith([0])
        .setScale(0.25)
        .setPosition(x, y)
        .setIgnoreGravity(true);

        this.on('animationcomplete',this.death,this);  
        this.anims.play('light_burst_action', true);
        //Add to game update
        this.scene.events.on("update", this.update, this);
    }
    death(){
        this.setPosition(-1000,-1000);
        this.setActive(false);
        this.setVisible(false);
    }
    update(time, delta)
    {
        if(this.active){

        }

    }

};