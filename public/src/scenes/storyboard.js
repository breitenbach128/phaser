//Main Game Scene
/// <reference path="../../def/phaser.d.ts"/>

var Storyboard = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function GameScene ()
    {
        Phaser.Scene.call(this, { key: 'storyboard' });
    },

    preload: function ()
    {
        //this.load.scenePlugin('Slopes', 'src/plugins/phaser-slopes.min.js');
    },

    create: function ()
    {
        let { width, height } = this.sys.game.canvas;
        let Z_LAYERS = {
            BG: 100,
            MID: 200,
            FB: 300
        }
        this.orbitRadius = 72;
        

        this.effect=[
            this.add.particles('shapes',  new Function('return ' + this.cache.text.get('effect-bright-pulse1'))())
        ];
        this.effect[0].setVisible(true);
        this.effect[0].emitters.list[0].setPosition(width/2,height/2);
        this.effect[0].emitters.list[0].setScale(3);
        this.effect[0].setDepth(Z_LAYERS.MID);
        //Add Sprites to Tween
        for(let i=0;i<5;i++){
            let brightOrbitEllipse = new Phaser.Geom.Ellipse(width/2, height/2+64-i*32, 190, 64);
            let radAngle = Phaser.Math.DegToRad(0);
            let normAngle = Phaser.Math.Angle.Normalize(radAngle);
            let point = Phaser.Geom.Ellipse.CircumferencePoint(brightOrbitEllipse, normAngle);
            //let pointEnd = Phaser.Geom.Circle.CircumferencePoint(brightOrbitCircle, normAngle+Math.PI);
            // Use GEOM ELIIPSE HERE and track along the path.
            let bright1 = this.add.sprite(point.x,point.y,'bright').setDepth(Z_LAYERS.FG);
            bright1.orbit = 0;
            bright1.orbitOS = 0.5*i+Phaser.Math.FloatBetween(0,0.15);

            let timeDelay = 100+Phaser.Math.Between(0,500);
            let tw = this.add.tween({
                targets: bright1,
                ease: 'Linear',
                orbit: 1,
                repeat: -1,
                duration: 5000,
                onUpdate: function(tween,targets){
                    let finalPos = wrapAtMax(bright1.orbit + bright1.orbitOS,1.0);
                    
                    let orbitPoint = brightOrbitEllipse.getPoint(finalPos);
                    bright1.setPosition(orbitPoint.x,orbitPoint.y);
                    
                    //targets[0].depth = targets[0].depth == Z_LAYERS.BG ? Z_LAYERS.FG : Z_LAYERS.BG;
                },
                onComplete: function(tween, targets){
                    
                },
                onCompleteScope: this
            });
        }

        // var timeline = this.tweens.createTimeline();
        // timeline.add({targets: bright1,x: width/2+64,y: height/2-64,ease: 'Power1',duration: 5000,hold: 100, onComplete: function(tween,targets){targets[0].setDepth(Z_LAYERS.BG);},onCompleteScope: this});
        // timeline.add({targets: bright1,x: width/2-64,y: height/2+64,ease: 'Power1',duration: 5000,hold: 100, onComplete: function(tween,targets){targets[0].setDepth(Z_LAYERS.FG);},onCompleteScope: this});
        // timeline.play();

        //Create Camera        

        this.cameras.main.setBackgroundColor('#000000'); 
        this.cameras.main.roundPixels = true;
        //this.cameras.main.setPosition(100,100);
        //this.cameras.main.setScroll(100,100);
        //pan(x, y [, duration] [, ease] [, force] [, callback] [, context])
        //this.cameras.main.pan(100,100,5000, Phaser.Math.Easing.Linear,false,this.nextScene,this);
        //zoomTo(zoom [, duration] [, ease] [, force] [, callback] [, context])
        this.cameras.main.zoomTo(3,1000, Phaser.Math.Easing.Linear,false,this.nextScene,this); // 15000 felt correct.

        //Setup Text - Make this part of a second camera below, so it wont zoom.
        sol_string = 'Sol. Oh giver of life. Your light watches over us.\nGuide us and protect us from the dark. May you reign eternal...';
        this.storyText = this.add.text(width/2, height-224, sol_string, { fontSize: '12px', fill: '#00FF00', stroke: '#000000', strokeThickness: 4 , align: 'center'}).setOrigin(0.5);
    },
    update: function (time, delta)
    { 
      
    },
    nextScene(camera, progress, x, y){
        if(progress == 1){
            this.scene.start('intro');
        }
    }
});