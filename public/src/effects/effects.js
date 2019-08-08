//Blood Splatter

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