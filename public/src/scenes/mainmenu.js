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
        //noClick, noClick Hover, Click, Click Hover
        this.btnstartSP = this.addButton(0, 0, 'button_yellow', this.doStartSingle, this, 0, 1, 0, 1);
        this.btnstartSP.setPosition(game.canvas.width/2,300);
        this.btnstartMPlocal = this.addButton(0, 0, 'button_yellow', this.doStartLocalMP, this, 0, 1, 0, 1);
        this.btnstartMPlocal.setPosition(game.canvas.width/2,400);
        this.btnstartMPOnline = this.addButton(0, 0, 'button_yellow', this.doStartOnlineMP, this, 0, 1, 0, 1);
        this.btnstartMPOnline.setPosition(game.canvas.width/2,500);

        gamePad = new GamepadControl(0);

        this.input.gamepad.once('connected', function (pad) {
            //   'pad' is a reference to the gamepad that was just connected
            console.log("menuscene gamepad connected"); 
            gamePad = new GamepadControl(pad);

        });
        //Text rendering
        let style = { 
            fontFamily: 'visitorTT1',
            fontSize: '16px', 
            fill: '#FFFFFF', 
            stroke: '#000000', 
            strokeThickness: 4,
            align: 'center' 
        };
        this.btnTextSP = this.add.text(game.canvas.width/2,300, 'SINGLE PLAYER', style).setOrigin(0.5);
        this.btnTextMPLocal = this.add.text(game.canvas.width/2,400, 'LOCAL MULTIPLAYER', style).setOrigin(0.5);
        this.btnTextMPOnline = this.add.text(game.canvas.width/2,500, 'ONLINE', style).setOrigin(0.5);
    

    },
    update: function(){
        if(gamePad.ready){
            gamePad.updateButtonState();
        }
        if(gamePad.checkButtonState('start') > 0){
            this.doStart();
        }
    },
    doStartOnlineMP:function ()
    {
        
		//this.scene.start('lobby');
    }, 	
    doStartLocalMP:function ()
    {
        
		this.scene.start('lobby');
    },
	doStartSingle: function ()
    {
        
		this.scene.start('lobby');
    }

});