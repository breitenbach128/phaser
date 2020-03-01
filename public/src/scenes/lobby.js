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
  
        //console.log("GPTOTAL",this.input.gamepad.total);

        this.sceneTransitionReady = false;
        this.time.addEvent({ delay: 500, callback: this.transitionSet, callbackScope: this, loop: false });
        
        //console.log("Enter Scene",this.scene.key);
        //Create Keyboard
        createControls(this);
        //Gamepad management
        initGamePads(this,this.detectedNewGP);
  

        //Create player Selection
        let selectSolana = this.add.sprite(game.canvas.width/2,300,'solana').setScale(3);
        let selectBright = this.add.sprite(game.canvas.width/2,600,'bright').setScale(5);
        this.selectSolana = selectSolana;
        this.selectBright = selectBright;
        
        let drawCtrlColumn = selectSolana.x+selectSolana.width;
        this.ctrlIcons = [];
        this.disconnectedIcons = [];

        let icon_gp2_p1 = this.add.image(drawCtrlColumn+64,selectSolana.y-32,'icon_gamepad').setScale(.125).setAlpha(.5).setData({p:1,ctrl:1}).setInteractive();
        let icon_gp1_p1 = this.add.image(drawCtrlColumn,selectSolana.y-32,'icon_gamepad').setScale(.125).setAlpha(.5).setData({p:1,ctrl:0}).setInteractive();
        let icon_kb_p1 = this.add.image(drawCtrlColumn,selectSolana.y+32,'icon_keyboard').setScale(.25).setAlpha(.5).setData({p:1,ctrl:-1}).setInteractive();

        let icon_gp2_p2 = this.add.image(drawCtrlColumn+64,selectBright.y-32,'icon_gamepad').setScale(.125).setAlpha(.5).setData({p:2,ctrl:1}).setInteractive().setVisible(false);
        let icon_gp1_p2 = this.add.image(drawCtrlColumn,selectBright.y-32,'icon_gamepad').setScale(.125).setAlpha(.5).setData({p:2,ctrl:0}).setInteractive().setVisible(false);
        let icon_kb_p2 = this.add.image(drawCtrlColumn,selectBright.y+32,'icon_keyboard').setScale(.25).setAlpha(.5).setData({p:2,ctrl:-1}).setInteractive().setVisible(false);
        
        this.disconnectedIcons.push(this.add.image(drawCtrlColumn,selectSolana.y-32,'red_cross'));
        this.disconnectedIcons.push(this.add.image(drawCtrlColumn,selectBright.y-32,'red_cross'));
        this.disconnectedIcons.push(this.add.image(drawCtrlColumn+64,selectSolana.y-32,'red_cross'));
        this.disconnectedIcons.push(this.add.image(drawCtrlColumn+64,selectBright.y-32,'red_cross'));

        this.disconnectedIcons[1].setVisible(false);
        this.disconnectedIcons[3].setVisible(false);

        if(playerMode == 1){
            icon_kb_p2.setVisible(true);
            icon_gp1_p2.setVisible(true);
            icon_gp2_p2.setVisible(true);
            this.disconnectedIcons[1].setVisible(true);
            this.disconnectedIcons[3].setVisible(true);
        }
        this.ctrlIcons = [icon_kb_p1,icon_gp1_p1,icon_gp2_p1,icon_kb_p2,icon_gp1_p2,icon_gp2_p2];//Load the controller icon array

        this.input.on('gameobjectdown',this.onObjectClicked,this);
    
        this.selectionTextP1 = this.add.text(game.canvas.width/2, 160, playerModes[playerMode]+' PLAYER MODE', { fontFamily:'visitorTT1',fontSize: '64px', fill: '#00FF00', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);

        this.gamePadFlasherP1 = this.add.text(game.canvas.width/2, selectSolana.y+selectSolana.height*2, "Click Start Or Press a Start Button on gamepad.", { wordWrap: { width: 300, useAdvancedWrap: true },fontFamily:'visitorTT1',fontSize: '14px', fill: '#00FF00', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5);
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
        this.stickChoke = {c:0,m:5};
        this.setupControlsIcons();
        this.debug = this.add.text(12, 12, "", { fontFamily:'visitorTT1',fontSize: '64px', fill: '#00FF00', stroke: '#000000', strokeThickness: 4 });
        this.startText = this.add.text(game.canvas.width/2, game.canvas.height-128, 'START', { fontFamily:'visitorTT1',fontSize: '32px', fill: '#00FF00', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setData({button:"start"}).setInteractive();

        //Controll DEBUG Text
        this.controllerDebugText = this.add.text(55, 200, 'CTRL-DEBUG\n', { fontFamily:'visitorTT1',fontSize: '24px', fill: '#00FF00', stroke: '#000000', strokeThickness: 4 })
    },
    getPlayerWithoutGamepad(navIndex){
        let alreadyInUse = false;
        for(let p=0;p < playerConfig.length;p++){
            console.log("GP in Use Check-LOBBY: ","NavIndex:",navIndex,"PCtrl",playerConfig[p].ctrl,"Player Assigned",p);
            if(playerConfig[p].ctrlIndex == navIndex){alreadyInUse = true;};
            if(playerConfig[p].ctrl == -1 && !alreadyInUse){                
                return p;
            }
        }
        return -1;
        //This still is not perfect. It is not not loading the gamepad, so it runs the down button event and attempts to reload it each time, sine there are still inactive gamepads

    },
    detectedNewGP(scene,navIndex,gpIndex){

        //Find First Player without gamepad
        let playerWithout = scene.getPlayerWithoutGamepad(navIndex);
        if(playerWithout != -1){
            console.log("Player selected to receive new gamepad",playerWithout+1);        
            console.log("Controller Index:",navIndex);
            console.log("GamePad Index:",gpIndex);

            playerConfig[playerWithout].ctrl = gpIndex;
            playerConfig[playerWithout].ctrlSN = gamePad[gpIndex].pad.id;
            playerConfig[playerWithout].ctrlIndex = navIndex;
            scene.disconnectedIcons[(navIndex*2)].setVisible(false);
            scene.disconnectedIcons[(navIndex*2)+1].setVisible(false);


            //Setup Icons
            scene.setupControlsIcons();
        }
        
        
    },
    setupControlsIcons(){
        //Player1
        for(let i=-1;i<2;i++){
            if(i == playerConfig[0].ctrlIndex){
                this.ctrlIcons[i+1].setAlpha(1);
            }else{
                this.ctrlIcons[i+1].setAlpha(.5);
            }
        }
        //Player2
        for(let i=-1;i<2;i++){
            if(i == playerConfig[1].ctrlIndex){
                this.ctrlIcons[i+4].setAlpha(1);
            }else{
                this.ctrlIcons[i+4].setAlpha(.5);
            }
        }
    },    
    selectControl(player,control){
        
        if(playerConfig[0].ctrl != control && playerConfig[1].ctrl != control && control <= getActiveGamePadCount()-1 ){

            playerConfig[player-1].ctrl = control;
            if(control >= 0){
                //console.log("Control Selected",control,gamePad[control].pad.id);
                playerConfig[player-1].ctrlSN = gamePad[control].pad.id;
            }
            this.setupControlsIcons();
        
        }
        
    },
    //Selection via stick. Not sure if we want this?
    // navigateControls(i){
    //     if(game.wasd.up.isDown){
    //         this.selectPlayerControl(1,i);
    //     }
    //     if(gamePad[i].getStickLeft().y == 1){
    //         if(this.stickChoke.c < this.stickChoke.m){
    //             this.stickChoke.c++;
    //         }else{
    //             this.stickChoke.c=0;
    //             this.selectPlayerControl(1,i);
    //         }
    //     }
    //     if(game.wasd.down.isDown){
    //         this.selectPlayerControl(-1,i);
    //     }
    //     if(gamePad[i].getStickLeft().y == -1){
    //         if(this.stickChoke.c < this.stickChoke.m){
    //             this.stickChoke.c++;
    //         }else{
    //             this.stickChoke.c=0;
    //             this.selectPlayerControl(-1,i);
    //         }
    //     }
    // },
    // selectPlayerControl(ch,index){

    // },
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
        updateGamePads();
        if(gamePad[0].checkButtonState('start') > 0 || gamePad[1].checkButtonState('start') > 0){
            this.doStart();
        }
        this.debug.setText("P1-CTRL_ID:"+String(playerConfig[0].ctrl)+" Name:"+String(playerConfig[0].ctrlSN)
        +"\nP2-CTRL_ID:"+String(playerConfig[1].ctrl)+" Name:"+String(playerConfig[1].ctrlSN));

        
        this.controllerDebugText.setText("DEBUG-GP\n"
        +"\nGP0-INDEX:"+String(gamePad[0].index)
        +"\nGP0-LeftStick:"+String(gamePad[0].getStickLeft(.5).x)+":"+String(gamePad[0].getStickLeft(.5).y)
        +"\nGP0-RightStick:"+String(gamePad[0].getStickRight(.5).x)+":"+String(gamePad[0].getStickRight(.5).y)
        +"\nGP0-A:"+String(gamePad[0].checkButtonState('A'))
        +"\nGP0-Y:"+String(gamePad[0].checkButtonState('Y'))
        +"\nGP0-RTRG:"+String(gamePad[0].checkButtonState('rightTrigger'))
        +"\nGP0-LTRG:"+String(gamePad[0].checkButtonState('leftTrigger'))
        +"\nGP0-LSHLD:"+String(gamePad[0].checkButtonState('leftShoulder'))
        +"\n\n\n\n"
        +"\nGP1-INDEX:"+String(gamePad[1].index)
        +"\nGP1-LeftStick:"+String(gamePad[1].getStickLeft(.5).x)+":"+String(gamePad[1].getStickLeft(.5).y)
        +"\nGP1-RightStick:"+String(gamePad[1].getStickRight(.5).x)+":"+String(gamePad[1].getStickRight(.5).y)
        +"\nGP1-A:"+String(gamePad[1].checkButtonState('A'))
        +"\nGP1-Y:"+String(gamePad[1].checkButtonState('Y'))
        +"\nGP1-RTRG:"+String(gamePad[1].checkButtonState('rightTrigger'))
        +"\nGP1-LTRG:"+String(gamePad[1].checkButtonState('leftTrigger'))
        +"\nGP1-LSHLD:"+String(gamePad[1].checkButtonState('leftShoulder'))
        );

    },
    onObjectClicked(pointer,gameObject)
    {
        //console.log("Object Clicked",gameObject,gameObject.data.get("ctrl"),gameObject.data.get("p"));
        let ctrl = gameObject.data.get("ctrl");
        if(gameObject.data.get("p") == 1){
            this.selectControl(1,ctrl);
        }
        if(gameObject.data.get("p") == 2){
            this.selectControl(2,ctrl);
        }
        if(gameObject.getData("button") == "start"){this.doStart();}
        
    },	
	doStart: function ()
    {
        
		this.scene.start('gamescene');
    }

});