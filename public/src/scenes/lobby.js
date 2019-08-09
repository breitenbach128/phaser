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
  


        this.sceneTransitionReady = false;
        this.time.addEvent({ delay: 500, callback: this.transitionSet, callbackScope: this, loop: false });
        
        console.log("Enter Scene",this.scene.key);
        //Gamepad management
        initGamePads(this);

        //Create player Selection
        let selectSolana = this.add.sprite(game.canvas.width/2,300,'solana').setScale(3).setInteractive();
        let selectBright = this.add.sprite(game.canvas.width/2,600,'bright').setScale(5).setInteractive();
        this.selectSolana = selectSolana;
        this.selectBright = selectBright;

        let icon_gp_p1 = this.add.image(selectSolana.x+selectSolana.width,selectSolana.y-32,'icon_gamepad').setScale(.125).setAlpha(.5);
        let icon_kb_p1 = this.add.image(icon_gp_p1.x,selectSolana.y+32,'icon_keyboard').setScale(.25);
        if(playerMode == 1){
            let icon_gp_p2 = this.add.image(icon_gp_p1.x,selectBright.y-32,'icon_gamepad').setScale(.125);
            let icon_kb_p2 = this.add.image(icon_gp_p1.x,selectBright.y+32,'icon_keyboard').setScale(.25);
            if(gamePad.ready == false){

            }
        }

        this.input.on('gameobjectdown',this.onObjectClicked,this);
    
        this.selectionTextP1 = this.add.text(game.canvas.width/2, 160, playerModes[playerMode]+' PLAYER MODE', { fontFamily:'visitorTT1',fontSize: '64px', fill: '#00FF00', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);

        this.gamePadFlasherP1 = this.add.text(game.canvas.width/2, selectSolana.y+selectSolana.height*2, "Click Solana to Start Or Press a Start Button on gamepad.", { wordWrap: { width: 300, useAdvancedWrap: true },fontFamily:'visitorTT1',fontSize: '14px', fill: '#00FF00', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);
        let tween = this.tweens.add({
            targets: this.gamePadFlasherP1,
            alpha: 0,
            ease: 'Bounce.InOut',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
            duration: 1500,
            repeat: -1,            // -1: infinity
            yoyo: true,
        });
        //Bright Random Rotation Fun

        //Animations
        this.anims.create({
            key: 'solana-idle',
            frames: this.anims.generateFrameNumbers('solana', { frames:[0,0,0,0,0,0,0,1,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}),
            frameRate: 11,
            repeat: -1
        });
        this.anims.create({
            key: 'solana-walk',
            frames: this.anims.generateFrameNumbers('solana', { frames:[20,21,5,6,17,18,5,6,17,18,5,6,17,18] }),
            frameRate: 6,
            repeat: -1
        });
        this.time.addEvent({ delay: 5000, callback: this.randomAnimation, callbackScope: this, loop: true });
        
        this.loopBrightTween();
    },
    loopBrightTween(){
        let brightTween = this.tweens.add({
            targets: this.selectBright,        
            props: {
                rotation: { value: function(){return Phaser.Math.Between(-Math.PI,Math.PI)}, ease: 'Bounce.InOut' }
            },
            duration: 1000,
            repeat: -1,            // -1: infinity
            yoyo: true,
        });
    },
    randomAnimation(){
        switch(Phaser.Math.Between(0,3)){
            case 0:
                this.selectSolana.anims.play('solana-walk',true);
            break;
            case 1:
                this.selectSolana.anims.playReverse('solana-walk',true);
            break;
            default:
                this.selectSolana.anims.play('solana-idle',true)
        }
    },
    transitionSet(){
        this.sceneTransitionReady = true;
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
        this.doStart();
    },	
	doStart: function ()
    {
        
		this.scene.start('gamescene');
    }

});