var GameSelectScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function MainMenu ()
    {
        Phaser.Scene.call(this, { key: 'gameselect' });
    },

    preload: function ()
    {
    },

    create: function ()
    {
        //noClick, noClick Hover, Click, Click Hover
        this.btnstart = this.addButton(0, 0, 'button_yellow', this.doStart, this, 0, 1, 0, 1);
        this.btnstart.setPosition(game.canvas.width/2,400);

        gamePad = new GamepadControl(0);

        this.input.gamepad.once('connected', function (pad) {
            //   'pad' is a reference to the gamepad that was just connected
            console.log("menuscene gamepad connected"); 
            gamePad = new GamepadControl(pad);

        });
        //Text rendering
        this.controls_guide = this.add.text(game.canvas.width/2,400, 'SINGLE PLAYER', { 
            fontFamily: 'visitorTT1',
            fontSize: '18px', 
            fill: '#FFFFFF', 
            stroke: '#000000', 
            strokeThickness: 4,
            align: 'center' 
        }).setOrigin(0.5);
       
    

    },
    update: function(){
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