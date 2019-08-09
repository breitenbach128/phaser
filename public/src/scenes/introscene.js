var IntroScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function MainMenu ()
    {
        Phaser.Scene.call(this, { key: 'intro' });
    },

    preload: function ()
    {
    },

    create: function ()
    {
        camera_main = this.cameras.main;
        var introBright = this.add.sprite(game.canvas.width/2,200,'bright').setScale(5);
        var timeline = this.tweens.createTimeline();
        timeline.loop = -1;
        let path = [{x:0,y:0,t:0,h:0},{x:50,y:0,t:1000,h:0},{x:50,y:50,t:1000,h:0},{x:0,y:50,t:1000,h:0},{x:0,y:0,t:1000,h:0}];
        path.forEach(function(e){
            timeline.add({
                targets: introBright,
                x: introBright.x+e.x,
                y: introBright.y+e.y,
                ease: 'Power1',
                duration: e.t,
                hold: e.h
            });
        
        },this);
        timeline.play();

        let dialogueChain = [{speaker:introBright,ttl:3000,text:"Welcome to Against the Dark"},
        {speaker:introBright,ttl:2000,text:"Let me tell you a story"},
        {speaker:introBright,ttl:3000,text:"It's story of Darkness against Light..."},
        {speaker:introBright,ttl:3000,text:"Hope against Despair..."},
        {speaker:introBright,ttl:3000,text:"And Bravery against Fear..."}];
        this.dialogueArea = new Dialogue(this,dialogueChain,96,-96);
        this.dialogueArea.start();

        this.btnstart = this.addButton(0, 0, 'button_sun', this.doStart, this, 0, 0, 0, 0);
        this.btnstart.setPosition(game.canvas.width/2,game.canvas.height/2).setPipeline('GlowShader');;

        this.glowTime = 0;

        this.sceneTransitionReady = false;

        this.time.addEvent({ delay: 1000, callback: this.transitionSet, callbackScope: this, loop: false });

       //Gamepad management
       initGamePads(this);

        this.controls_guide = this.add.text(this.x, game.canvas.height-192, 'Controls', { fontSize: '12px', fill: '#00FF00', stroke: '#000000', strokeThickness: 4 });
       
        this.controls_guide.setText("INTRODUCTON SCENE"
        +"\n - PRE GAME DIALOGUE PLAYER AND CUTSCENE");

    },
    transitionSet(){
        this.sceneTransitionReady = true;
    },
    update: function(){
        glowPipeline.setFloat1('time', this.glowTime);
        this.glowTime += 0.05;
        if(gamePad.ready){
            gamePad.updateButtonState();
        }
        if(gamePad.checkButtonState('start') > 0 && this.sceneTransitionReady){
            this.doStart();
        }
        if(this.dialogueArea.isRunning){
            this.dialogueArea.update();
        }
    },	
	doStart: function ()
    {
        
		this.scene.start('mainmenu');
    }

});