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
    },

    create: function ()
    {

        //Version
        this.add.text(12, 12, "Verison: "+buildVersion, { fontSize: '12px', fill: '#00FF00', stroke: '#000000', strokeThickness: 4 });

		// add logo
		//this.sys.config.backgroundColor = '#f3cca3';
        let logo = this.add.sprite(game.canvas.width/2,game.canvas.height/2, 'sprites', 'phaser3');

        let studio = this.add.sprite(-1000, -1000, '128games');

        let title = this.add.sprite(-1000, -1000, 'Title1');

        this.btnstart = this.addButton(-1000, -1000, 'button_sun', this.doStart, this, 0, 0, 0, 0);
        this.btnstart.setPipeline('GlowShader');

        var timeline = this.tweens.createTimeline();
        timeline.add({targets: logo,x: game.canvas.width/2,y: game.canvas.height/2,ease: 'Power1',duration: 0,hold: 100});
        timeline.add({targets: logo,x: -1000,y: -1000,ease: 'Power1',duration: 0,hold: 100});
        timeline.add({targets: studio,x: game.canvas.width/2,y: game.canvas.height/2,ease: 'Power1',duration: 0,hold: 100});
        timeline.add({targets: studio,x: -1000,y: -1000,ease: 'Power1',duration: 0,hold: 100});
        timeline.add({targets: title,x: game.canvas.width/2,y: game.canvas.height/2-300,ease: 'Power1',duration: 0,hold: 0});
        timeline.add({targets: this.btnstart,x: game.canvas.width/2,y: game.canvas.height/2,ease: 'Power1',duration: 0,hold: 0});
        timeline.play();





        this.glowTime = 0;

        gamePad = new GamepadControl(0);

        this.input.gamepad.once('connected', function (pad) {
            //   'pad' is a reference to the gamepad that was just connected
            console.log("menuscene gamepad connected"); 
            gamePad = new GamepadControl(pad);

        });

        this.controls_guide = this.add.text(this.x, game.canvas.height-192, 'Controls', { fontSize: '12px', fill: '#00FF00', stroke: '#000000', strokeThickness: 4 });
       
        this.controls_guide.setText("Controls"
        +"\n - Keyboard/Mouse:"
        +"\n - Move(WASD), Switch Character(Q), Pass Light(R), Jump(MB2), Shoot blast(MB1)"
        +"\n"
        +"\n - Gamepad (XBOX 360)"
        +"\n - LeftStk: Move/Aim, Shoot: A, Jump:X, Pass:Y, Switch: RightShoulder, DPAD-Up/Down: Interact with objects"
        +"\n"
        +"\n - Testing Controls: X - Switch Scene test(map2-map3 toggle), P - Self hurt for testing death, O for DEBUG draws"
        +"\n - Testing Controls: F - Bright Pulse, B - Beam Bridge, Dark - Hold down to hit the brakes");

    },
    update: function(){
        glowPipeline.setFloat1('time', this.glowTime);
        this.glowTime += 0.05;
        if(gamePad.ready){
            gamePad.updateButtonState();
        }
        if(gamePad.checkButtonState('start') > 0){
            this.doStart();
        }
    },	
	doStart: function ()
    {
        this.input.gamepad.disconnectAll();
		this.scene.start('intro');
    }

});