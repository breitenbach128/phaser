class HudScene extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'UIScene', active: true });

        this.hp_blips = [];
        this.energy_bar = [];
        this.ready = false;
        this.energy = {n:100,max:100,h:100,w:16};
        this.dialogueArea;
        this.inventory;
    }

    update()
    {
        if(this.ready){   
            if(gamePad.ready){
            this.debug.setText("CameraX:"+String(Math.round(camera_main.worldView.x))
            +"\nCameraY:" + String(Math.round(camera_main.worldView.y))
            +"\nSolanadiff: X:"+String(solana.mv_Xdiff)+"-Y:"+String(solana.mv_Ydiff)
            +"\nGamePad: leftStick:"+String(gamePad.getStickLeft().x)+":"+String(gamePad.getStickLeft().y));
            }
            
            if(this.dialogueArea.isRunning){
                this.dialogueArea.update();
            }
        }
    }
    clearHud()
    {
        for(var h = 0;h < this.hp_blips.length;h++){
            this.hp_blips[h].destroy();
        }  
        this.hp_blips = [];

        for(var h = 0;h < this.energy_bar.length;h++){
            this.energy_bar[h].destroy();
        }  
        this.energy_bar = [];
        this.dialogueArea.destroyDialogue();
    }
    setupHud(player)
    {
        this.ready = true;
        for(var h = 0;h < player.hp;h++){
            this.hp_blips.push(this.add.image(36,16+(h*16), 'health_blip'));    
        }
        //Add energy bar
        this.energy_bar.push(this.add.image(12, 48, 'hud_energybar1',1));//BG
        this.energy_bar.push(this.add.image(12, 48, 'hud_energybar1',2));//ENERGY
        this.energy_bar.push(this.add.image(12, 48, 'hud_energybar1',0));//FG
        //Update energy bar values
        this.energy.h = this.energy_bar[1].height;
        this.energy.w = this.energy_bar[1].width;
        //Add test dialogue
        let dialogueChain = [{speaker:player,ttl:3000,text:"How did I get here?"},
        {speaker:player,ttl:2000,text:"Why is everything so dark?"},
        {speaker:player,ttl:5000,text:"I can switch to Bright by pressing K."}];
        this.dialogueArea = new Dialogue(this,dialogueChain);
        this.dialogueArea.start();
        //DEBUG
        this.debug = this.add.text(48, 16, 'DEBUG-HUD', { fontSize: '32px', fill: '#FFFFFF', stroke: '#000000', strokeThickness: 4 });

        this.inventory = new Inventory(this);

    }
    alterEnergy(energyChange){
        let n = this.energy.n + energyChange;
        if(n < 0){n=0;};
        if(n > this.energy.max){n=this.energy.max;};

        this.energy.n = n;
        let newValue = Math.round((this.energy.n/this.energy.max)*this.energy.h);
        //Alter the bar values
        this.energy_bar[1].setCrop(0,this.energy.h-newValue,this.energy.w,newValue);
    }
    setHealth(hp,max)
    {
        for(var h = 0;h < max;h++){
            this.hp_blips[h].setVisible(false); 
        }
        for(var h = 0;h < hp-1;h++){
            this.hp_blips[h].setVisible(true); 
        }
    }
    createDialog(){
        //A JSON style format for dialog.
        // Requires: Talker Object (for X,Y). TTL for Bubble, and Text.
        //Object pooling would work well here. Just reuse bubble objects and set text
        //All Push button to speed up.


    }
    updateGameScene ()
    {
       

        // this.ourGame = this.scene.get('gamescene');

        // //  Listen for events from it
        // this.ourGame.events.on('playerSetup', function () {
        //     this.hp_blips = [];
        //     //Draw HUD - Move to HUD Class in the future
        //     for(var h = 0;h < player.max_hp;h++){
        //         this.hp_blips.push(this.add.image(12,16+(h*16), 'health_blip'));            
        //     }
        //     console.log("HUD-playerSetup",this.hp_blips.length);
        // }, this);

        // //  Listen for events from it
        // this.ourGame.events.on('playerHurt', function () {            
        //     this.hp_blips[player.hp-1].setVisible(false);
        //     console.log("HUD-PlayerHurt",this.hp_blips[player.hp-1],this.hp_blips.length);

        // }, this);
    }
}