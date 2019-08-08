var LobbyScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function MainMenu ()
    {
        Phaser.Scene.call(this, { key: 'lobby' });
    },

    preload: function ()
    {
    },

    create: function ()
    {
  
        let icon_gp = this.add.image(0,-100,'icon_gamepad').setScale(.125);
        let icon_kb = this.add.image(0,-100,'icon_keyboard').setScale(.25);

        gamePad = new GamepadControl(0);
        console.log("Enter Lobby");
        this.input.gamepad.once('connected', function (pad) {
            //   'pad' is a reference to the gamepad that was just connected
            console.log("menuscene gamepad connected"); 
            gamePad = new GamepadControl(pad);
            icon_kb.setPosition(0,-100);
            icon_gp.setPosition(selectSolana.x+selectSolana.width,selectSolana.y);

        });

        //Create player Selection
        let selectSolana = this.add.sprite(game.canvas.width/2,300,'solana').setScale(3).setInteractive();
        let selectBright = this.add.sprite(game.canvas.width/2,600,'bright').setScale(3).setInteractive();

        icon_kb.setPosition(selectSolana.x+selectSolana.width,selectSolana.y);

        this.input.on('gameobjectdown',this.onObjectClicked,this);
    
        this.selectionTextP1 = this.add.text(selectSolana.x, selectSolana.y-selectSolana.height/2-24, 'Player1', { fontSize: '16px', fill: '#00FF00', stroke: '#000000', strokeThickness: 4 });

    },
    update: function(){
        if(gamePad.ready){
            gamePad.updateButtonState();
        }
        if(gamePad.checkButtonState('start') > 0){
            this.doStart();
        }
    },
    onObjectClicked(pointer,gameObject)
    {
        console.log(gameObject,this.selectionTextP1);
        this.selectionTextP1.setPosition(gameObject.x,gameObject.y-gameObject.height/2-12);
        this.doStart();
    },	
	doStart: function ()
    {
        
		this.scene.start('gamescene');
    }

});