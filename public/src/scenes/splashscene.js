// mein menu scene

var SplashScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function MainMenu ()
    {
        Phaser.Scene.call(this, { key: 'splashscene' });
    },

    preload: function ()
    {
        initGamePads(this,function(){});
    },

    create: function ()
    {
        //ANimations
        this.anims.create({
            key: 'firefly-move',
            frames: this.anims.generateFrameNumbers('fireflies', { frames:[3,4] }),
            frameRate: 16,
            repeat: -1
        });
        
        this.anims.create({
            key: 'firefly-flash',
            frames: this.anims.generateFrameNumbers('fireflies', { frames:[0,1,2] }),
            frameRate: 16,
            repeat: 0
        });  
        //Version
        this.add.text(12, 12, "Verison: "+buildVersion, { fontSize: '12px', fill: '#00FF00', stroke: '#000000', strokeThickness: 4 });

		// add logo
		//this.sys.config.backgroundColor = '#f3cca3';
        let logo = this.add.sprite(game.canvas.width/2,game.canvas.height/2, 'sprites', 'phaser3');
        //## http://www.picturetopeople.org/p2p/text_effects_generator.p2p/3d_golden_text_effect

        let studio = this.add.sprite(-1000, -1000, '128games');

        let title = this.add.sprite(-1000, -1000, 'Title1').setDepth(5);;

        this.btnstart = this.addButton(-1000, -1000, 'button_sun', this.doStart, this, 0, 0, 0, 0);
        this.btnstart.setPipeline('GlowShader');

        var timeline = this.tweens.createTimeline();
        // 100s  should be changed to 1000 later. Right now, just speeds up testing
        timeline.add({targets: logo,x: game.canvas.width/2,y: game.canvas.height/2,ease: 'Power1',duration: 0,hold: 100});
        timeline.add({targets: logo,x: -1000,y: -1000,ease: 'Power1',duration: 0,hold: 100});
        timeline.add({targets: studio,x: game.canvas.width/2,y: game.canvas.height/2,ease: 'Power1',duration: 0,hold: 100});
        timeline.add({targets: studio,x: -1000,y: -1000,ease: 'Power1',duration: 0,hold: 100});
        timeline.add({targets: title,x: game.canvas.width/2,y: game.canvas.height/2-300,ease: 'Power1',duration: 0,hold: 0});
        timeline.add({targets: this.btnstart,x: game.canvas.width/2,y: game.canvas.height/2,ease: 'Power1',duration: 0,hold: 0});
        timeline.play();
        
        this.glowTime = 0;

        fireflies = this.add.group({ 
            classType: Firefly,
            runChildUpdate: true 
        });

        for(let b=0;b<5;b++){
            let rX = Phaser.Math.Between(-32,32);
            let rY = Phaser.Math.Between(-32,32);
            fireflies.get(50+rX,50+rY);
        }

        for(let b=0;b<5;b++){
            let rX = Phaser.Math.Between(-32,32);
            let rY = Phaser.Math.Between(-32,32);
            fireflies.get(game.canvas.width-50+rX,50+rY);
        }

        for(let b=0;b<20;b++){
            let rX = Phaser.Math.Between(0,game.canvas.width);
            let rY = Phaser.Math.Between(0,game.canvas.height);
            fireflies.get(rX,rY);
        }

        this.controls_guide = this.add.text(this.x, game.canvas.height-192, 'Controls', { fontSize: '12px', fill: '#00FF00', stroke: '#000000', strokeThickness: 4 });
       
        this.controls_guide.setText("Controls"
        +"\n - Keyboard/Mouse:"
        +"\n - Move(WASD), Switch Character(Q), Pass Light(R), Jump(SPCBAR), Shoot blast(MB1)"
        +"\n"
        +"\n - Gamepad (XBOX 360)"
        +"\n - LeftStk: Move/Aim, Shoot: A, Jump:X, Pass:Y, Switch: leftTrigger, DPAD-Up/Down: Interact with objects"
        +"\n"
        +"\n - Testing Controls: X - Switch Scene test(map2-map3 toggle), P - Self hurt for testing death, O for DEBUG draws"
        +"\n - Testing Controls: (KB-F) (GP-B) - Bright Pulse, B - Beam Bridge, Dark - Hold down to hit the brakes").setDepth(15);;

        this.particle_flame_fall = this.add.particles('shapes',  this.cache.json.get('effect-flame-fall'));          
        this.particle_flame_fall.createEmitter((this.cache.json.get('effect-flame-fall'))[0]);
        this.particle_flame_fall.createEmitter((this.cache.json.get('effect-flame-fall'))[0]); 
        this.particle_flame_fall.createEmitter((this.cache.json.get('effect-flame-fall'))[0]);   
        //Emmitter List      
        this.particle_flame_fall.emitters.list[0].setPosition(50,Phaser.Math.Between(-450,150));
        this.particle_flame_fall.emitters.list[1].setPosition(525,Phaser.Math.Between(-450,150));
        this.particle_flame_fall.emitters.list[2].setPosition(700,Phaser.Math.Between(-450,150));
        this.particle_flame_fall.emitters.list[3].setPosition(900,Phaser.Math.Between(-450,150));

        this.particle_flame_fall.setDepth(10);
    },
    update: function(){
        glowPipeline.setFloat1('time', this.glowTime);
        this.glowTime += 0.03;
        updateGamePads();

        if(gamePad[0].checkButtonState('start') > 0 || gamePad[1].checkButtonState('start') > 0){
            this.doStart();
        }

        //Testing. May be a better way to have random spots of falling particles.
        let pEmitList = this.particle_flame_fall.emitters.list;
        pEmitList.forEach(function(e){

            e.setPosition(e.x.propertyValue,e.y.propertyValue+3);
            if(e.y.propertyValue > game.canvas.height){
                e.setPosition(Phaser.Math.Between(e.x.propertyValue-50,e.x.propertyValue+50),0);
            }
        })

    },	
	doStart: function ()
    {
       //this.scene.start('intro');
       this.scene.start('storyboard');
       
    }

});