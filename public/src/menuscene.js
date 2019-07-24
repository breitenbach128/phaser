// mein menu scene

var MainMenu = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function MainMenu ()
    {
        Phaser.Scene.call(this, { key: 'mainmenu' });
    },

    preload: function ()
    {
    },

    create: function ()
    {

        //Setup Shader
        this.glowPipeline = game.renderer.addPipeline('GlowShader', new ShaderGlow(game));
        this.glowPipeline.setFloat1('alpha', 1.0);

		// add logo
		//this.sys.config.backgroundColor = '#f3cca3';
        //var logo = this.add.sprite(400, 200, 'sprites', 'phaser3');
        
        let title = this.add.sprite(0, 0, 'Title1');
        title.setPosition(game.canvas.width/2,title.height+128);

		// add start button
        //this.btnstart = this.addButton(0, 0, 'sprites', this.doStart, this, 'btn_play_hl', 'btn_play', 'btn_play_hl', 'btn_play');
        this.btnstart = this.addButton(0, 0, 'button_sun', this.doStart, this, 0, 0, 0, 0);
        this.btnstart.setPosition(game.canvas.width/2,400).setPipeline('GlowShader');;

        this.glowTime = 0;

        gamePad = new GamepadControl(0);

        this.input.gamepad.once('connected', function (pad) {
            //   'pad' is a reference to the gamepad that was just connected
            console.log("menuscene gamepad connected"); 
            gamePad = new GamepadControl(pad);

        });
        

    },
    update: function(){
        this.glowPipeline.setFloat1('time', this.glowTime);
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
        
		this.scene.start('gamescene');
    }

});