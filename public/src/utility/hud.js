class HudScene extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'UIScene', active: true });

        this.hp_blips = [];
        this.energy_bar = [];
        this.corruption_bar = [];
        this.boss_bar = [];
        this.ready = false;
        this.energy = {n:300,max:300,h:100,w:16};
        this.corruption = {n:100,max:100,h:100,w:16};
        this.inventory;
        this.shard_totals = {light:0,dark:0};
        this.showBossBar = false;
        this.bossCropRect = new Phaser.Geom.Rectangle(0,0, 1, 1);

        
    }

    update()
    {
        if(this.ready){  
            let debugString =  "CamX:"+String(Math.round(camera_main.worldView.x))
            +"\nCamY:" + String(Math.round(camera_main.worldView.y))
            +"\nPlayerMode:" + String(playerMode)
            +"\nKeyPress_X:" + String(this.skipSpeech.isDown)
            +"\nDisPlayers:"+String(Math.round(Phaser.Math.Distance.Between(solana.x,solana.y,bright.x,bright.y)));
            this.debug.setText(debugString);

            this.shard_data_l.setText(this.shard_totals.light+" x");
            this.shard_data_d.setText(this.shard_totals.dark+" x");
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

        for(var h = 0;h < this.corruption_bar.length;h++){
            this.corruption_bar[h].destroy();
        }          
        this.corruption_bar = [];

        this.shards_light.destroy();
        this.shard_data_l.destroy();
        this.shards_dark.destroy();
        this.shard_data_d.destroy();
        
        this.debug.destroy();
    }
    setBossVisible(value){
        for(let i=0;i < this.boss_bar.length;i++){this.boss_bar[i].setVisible(value)};
    }
    initBossHealth(){
        let bossBarWidth = this.boss_bar[0].width;//BG
        let bossBarHeight = this.boss_bar[0].height;//BG
        this.bossCropRect.setSize(bossBarWidth,bossBarHeight);
    }
    alertBossHealth(current_hp,max_hp){
        let bossBarWidth = this.boss_bar[0].width;//BG
        let bossBarHeight = this.boss_bar[0].height;//BG
        let newWidth = Math.round((current_hp/max_hp)*bossBarWidth);

        let tween = this.tweens.add({
            targets: this.bossCropRect,
            width: newWidth,
            ease: 'Power1',
            duration: 5000,
            delay: 1000,
            onComplete: function(){},
            onUpdate: function () {hud.boss_bar[1].setCrop(hud.bossCropRect)},
        });

    }
    setupHud(player)
    {
        this.skipSpeech = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        this.ready = true;
        for(var h = 0;h < player.hp;h++){
            this.hp_blips.push(this.add.image(32,16+(h*16), 'health_blip'));    
        }
        //Add energy bar
        this.energy_bar.push(this.add.image(12, 48, 'hud_energybar1',1));//BG
        this.energy_bar.push(this.add.image(12, 48, 'hud_energybar1',2));//ENERGY
        this.energy_bar.push(this.add.image(12, 48, 'hud_energybar1',0));//FG
        //Add corruption bar
        this.corruption_bar.push(this.add.image(52, 48, 'hud_corruptionbar1',1));//BG
        this.corruption_bar.push(this.add.image(52, 48, 'hud_corruptionbar1',2));//ENERGY
        this.corruption_bar.push(this.add.image(52, 48, 'hud_corruptionbar1',0));//FG
        //Add Boss Health Bar
        this.boss_bar.push(this.add.image(this.cameras.main.width/2, 48, 'hud_boss_health_bar',2).setScale(6,3));//BG
        this.boss_bar.push(this.add.image(this.cameras.main.width/2, 48, 'hud_boss_health_bar',1).setScale(6,3));//Health
        this.boss_bar.push(this.add.image(this.cameras.main.width/2, 48, 'hud_boss_health_bar',0).setScale(6,3));//FG
        //Inital set to not visible
        this.setBossVisible(false);

        //this.alertBossHealth(5,10);

        //Update energy bar values
        this.energy.h = this.energy_bar[1].height;
        this.energy.w = this.energy_bar[1].width;
        //Add Shard Counts
        this.shards_light = this.add.image(this.cameras.main.width-32, 48, 'shard_light',0);
        this.shards_dark = this.add.image(this.cameras.main.width-32, 96, 'shard_dark',0);        
        this.shard_data_l = this.add.text(this.cameras.main.width-64, 48, '0 x', { fontFamily: 'visitorTT1', fontSize: '22px', fill: '#FFFFFF', stroke: '#000000', strokeThickness: 4 }).setOrigin(.5);
        this.shard_data_d = this.add.text(this.cameras.main.width-64, 96, '0 x', { fontFamily: 'visitorTT1', fontSize: '22px', fill: '#FFFFFF', stroke: '#000000', strokeThickness: 4 }).setOrigin(.5);

        //DEBUG
        this.debug = this.add.text(64, 16, 'DEBUG-HUD', { fontSize: '22px', fill: '#FFFFFF', stroke: '#000000', strokeThickness: 4 });
        //HUD Energy Bar Flash/Scale Effect: When energy is added, alter the look for a few MS to show energy has been gained.
        this.energy_bar_effect = this.time.addEvent({ delay: 200, callback: this.resetEnergyScale, callbackScope: this, loop: false });
        this.inventory = new Inventory(this);
        //Check Global equipment
        for(let e=0;e<solanaEquipment.length;e++){
            if(solanaEquipment[e].equiped){
                this.inventory.equipItem(e);
            }
        }

        //Setup SOL Pieces
        
        this.anims.create({
            key: 'sol_burning-1',
            frames: this.anims.generateFrameNumbers('sol_pieces', { frames:[0,1,2,3] }),
            frameRate: 4,
            repeat: -1
        });
        this.anims.create({
            key: 'sol_dead-1',
            frames: this.anims.generateFrameNumbers('sol_pieces', { frames:[4,5,6,7] }),
            frameRate: 4,
            repeat: -1
        });
        this.anims.create({
            key: 'sol_shardglow-1',
            frames: this.anims.generateFrameNumbers('sol_pieces', { frames:[8,9] }),
            frameRate: 4,
            repeat: -1
        });
        
        this.anims.create({
            key: 'sol_shardglow-2',
            frames: this.anims.generateFrameNumbers('sol_pieces', { frames:[10,11] }),
            frameRate: 4,
            repeat: -1
        });

        this.anims.create({
            key: 'talkinghead',
            frames: this.anims.generateFrameNumbers('hud_talking_head', { frames:[0,1,2,1] }),
            frameRate: 12,
            repeat: -1
        });
        
        //Eats up too much space. Work on better solution.
        // let sol_pieces_ui = this.add.sprite(this.cameras.main.width/2, 64, 'sol_pieces').setScale(2);
        // sol_pieces_ui.anims.play('sol_dead-1', true);
        // let sol_pieces_collected_1 = this.add.sprite(this.cameras.main.width/2, 64, 'sol_pieces').setScale(2);
        // sol_pieces_collected_1.anims.play('sol_shardglow-1', true);
        // let sol_pieces_collected_2 = this.add.sprite(this.cameras.main.width/2, 64, 'sol_pieces').setScale(2);
        // sol_pieces_collected_2.anims.play('sol_shardglow-2', true);

        //Test new Speaker Class
        this.storySpeech = new HudSpeech(this);
        // this.storySpeech.createSpeech('hud_solana_head','hud_bright_head',false);
        // this.storySpeech.addToSpeech('left',"This is test of text 1 block",3000);
        // this.storySpeech.addToSpeech('right',"This is another test of text 2 block",3000);
        // this.storySpeech.startSpeech();
        
        // this.testTimeSP = this.time.addEvent({
        //     delay: 10000,
        //     callback: function(){
        //         testSpeech.createSpeech('hud_solana_head','hud_bright_head');
        //         testSpeech.addToSpeech('left',"Second test of speech",3000);
        //         testSpeech.addToSpeech('right',"Yup, we are still talking...",3000);
        //         testSpeech.startSpeech();
        //     }, 
        //     callbackScope: this, 
        //     loop: false 
        // });

    }
    alterEnergy(energyChange){
        let n = this.energy.n + energyChange;
        if(n < 0){n=0;};
        if(n > this.energy.max){
            n=this.energy.max;
        }else{
            this.energy.n = n;
            let newValue = Math.round((this.energy.n/this.energy.max)*this.energy.h);
            //Alter the bar values
            this.energy_bar[1].setCrop(0,this.energy.h-newValue,this.energy.w,newValue);
            //Tint Energy to red if it is less than 10% of total
            if(n <= (this.energy.max/5)){
                this.energy_bar[1].setTint(0xFFB6B6);
            }else{
                this.energy_bar[1].clearTint();
            };
            //Alter bar scale on gain only
            if(energyChange > 0){
                this.energy_bar.forEach(function(e){e.setScale(1.10)});
                this.energy_bar_effect = this.time.addEvent({ delay: 200, callback: this.resetEnergyScale, callbackScope: this, loop: false });
            }
        }


    }
    alertCorruption(corruptionChange){
        let n = this.corruption.n + corruptionChange;
        if(n < 0){n=0;};
        if(n > this.corruption.max){n=this.corruption.max;};
        this.corruption.n = n;
        let newValue = Math.round((this.corruption.n/this.corruption.max)*this.corruption.h);
        this.corruption_bar[1].setCrop(0,this.energy.h-newValue,this.energy.w,newValue);
    }
    resetEnergyScale(){
        this.energy_bar.forEach(function(e){e.setScale(1)});
    }
    collectShard(type,value){
        if(type == 'light'){
            this.shard_totals.light = this.shard_totals.light + value;
        }else{
            this.shard_totals.dark = this.shard_totals.dark + value;
        }
    }
    collectSoulCrystal(gs,x,y,zoom,texture,anim,frame,sbid){
        //Flash / Effect
        this.cameras.main.flash(300,255,255,0,false);
        //pause gamescene
        gs.scene.pause();

        //Check for player distance to calc which camera to use.

        //Generate HUD positioned crystal for pause and animation
        let crypos = {x:(x-camera_main.worldView.x)*zoom,y:(y-camera_main.worldView.y)*zoom};
        let solpos = {x:(solana.x-camera_main.worldView.x)*zoom,y:(solana.y-camera_main.worldView.y)*zoom};
        
        let sc  = this.add.sprite(crypos.x,crypos.y,texture,frame);
        sc.anims.play(anim, false);
        sc.setScale(2);
        sc.swingdata = -90;

        var timeline = this.tweens.createTimeline();
        // 100s  should be changed to 1000 later. Right now, just speeds up testing
        timeline.add({targets: sc,x: sc.x,y:sc.y-50,ease: 'Power1',duration: 1000,hold: 100});        
        timeline.add({targets: sc,x: solpos.x,y:solpos.y-32,ease: 'Power1',duration: 1000,hold: 100});
        timeline.add({
            targets: sc,
            swingdata: 270,
            ease: 'linear',
            duration: 1000,       
            onUpdate: function(tween, target){
                let rad = Phaser.Math.DegToRad(target.swingdata);
                target.x = Math.cos(rad)*32 + solpos.x;
                target.y = Math.sin(rad)*32 + solpos.y;
             }
        });
        timeline.add({
            targets: sc,
            x: solpos.x,
            y:solpos.y,
            ease: 'Power1',
            duration: 1000,
            hold: 100,
            onComplete: function(tween,targets,hud){
                sc.destroy();
                hud.cameras.main.flash(300,255,255,0,false);
                solbits[sbid].collect();//Run Class Collection function to take whatever actions are needed.
                
                gs.scene.resume(); 
                //Slight bug. Controls get locked. Need to unlock / clear them.
            },
            onCompleteParams: [ this ]
        });
        timeline.play();
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
    handleEvents ()
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

class HudSpeech{
    constructor(scene){
        this.scene = scene;
        let centerPoint = {x:this.scene.cameras.main.width/2,y:this.scene.cameras.main.height-124};
        let w = this.scene.cameras.main.width;
        let h = this.scene.cameras.main.height;

        //Text Holder
        this.speaktext = this.scene.add.text(centerPoint.x, centerPoint.y, 'Well, Im glad we are going on this adventure together.', { 
            fontFamily: 'visitorTT1',
            fontSize: '32px', 
            fill: '#000000', 
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#333',
                blur: 2,
                stroke: false,
                fill: true
            },
            wordWrap: {
                width: (w-96)*(0.75),
            }
        }).setOrigin(0.5).setDepth(150); 
        //Lists to make disabling, enabling quick and easy.
        this.spAreaObj = [
            this.scene.add.rectangle(centerPoint.x,centerPoint.y,w-64,224,0x4b2a1b,1.0).setDepth(100),
            this.scene.add.rectangle(centerPoint.x,centerPoint.y,w-96,192,0xffc139,1.0).setDepth(100),
            this.speaktext
        ];
        this.pLeftObj = [
            this.scene.add.rectangle(16,h-124,196,196,0x4b2a1b,1.0).setOrigin(0,1).setDepth(100),
            this.scene.add.rectangle(16+8,h-132,180,180,0xffc139,1.0).setOrigin(0,1).setDepth(100),
            this.scene.add.image(16+8,h-132,'hud_solana_head').setOrigin(0,1).setDepth(100)
        ];
        this.pRightObj = [
            this.scene.add.rectangle(w-16,h-124,196,196,0x4b2a1b,1.0).setOrigin(1,1).setDepth(100),
            this.scene.add.rectangle(w-24,h-132,180,180,0xffc139,1.0).setOrigin(1,1).setDepth(100),
            this.scene.add.image(w-24,h-132,'hud_bright_head').setOrigin(1,1).setDepth(100)
        ];

        this.ready = true;
        this.pauseGame = false;  

        this.pLeftObj[2].spk = 0;
        this.pRightObj[2].spk = 0;

        //Hide Everything to start
        this.showSpeechArea(false);
        this.showPortraitLeft(false);
        this.showPortraitRight(false);


    }
    createSpeech(leftImage,rightImage,doPause){
        if(this.ready){
            //Adds a new sequence to play to the HUD.
            this.pauseGame = doPause; 
            if(doPause){playScene.scene.pause()};
            //Speaker Portait image keys are require to show who is talking.

            //Create the timeline here and setup a callback;

            //Add parameters for if the speech should pause the game.
            this.ready = false;
            this.timeline = this.scene.tweens.createTimeline();

            this.timeline.setCallback('onComplete',this.endSpeech,[this],this.timeline);
        }else{
            console.log("HUDSPEECH Timeline running");
        }

    }
    addToSpeech(Portait,Text,Duration){
        //Push new String data and durations into speech process.
        let talkTrg = Portait == 'left' ? this.pLeftObj[2] : this.pRightObj[2];
        //console.log("Adding to Speech",Portait,Text,Duration);
        this.timeline.add({
            targets: talkTrg,
            spk: 1, // 0 -> 1 (Can be used as a progress percent)
            duration: Duration, //3000 Seems to work well
            onStart: this.blurbStart,
            onStartParams: [this,Portait,Text],
            onUpdate: this.blurbUpdate,
            onUpdateParams: [this]
,           onComplete: this.blurbComplete,
            onCompleteParams: [this,Portait],
        });
    }
    startSpeech(){
        //Play the current speech
        this.timeline.play();
        this.showSpeechArea(true);
    }
    endSpeech(param){
        //Stop the current speech and run actions
        param.showSpeechArea(false);
        param.showPortraitLeft(false);
        param.showPortraitRight(false);
        param.ready = true;
        param.timeline.destroy();
 
        if(param.pauseGame){
            playScene.scene.resume();
            param.pauseGame = false;
        };
    }
    blurbStart(tween,targets,hs,p,text){
        //console.log("Starting Blurb",p,text);
        if(p == 'left'){
            hs.showPortraitLeft(true);
        }else if(p == 'right'){
            hs.showPortraitRight(true);
        }
        hs.speaktext.setText(text);
    }
    blurbUpdate(tween,targets,hs){
        //Allow the speach item to be skipped if a button is pressed.
        if(hs.scene.skipSpeech.isDown && tween.progress < 0.90){
            //console.log("skip attempted");
            tween.seek(0.90);
            hs.speaktext.setText("");
            hs.endSpeech(hs);
        }
    }
    blurbComplete(tween,targets,hs,p){
        if(p == 'left'){
            hs.showPortraitLeft(false);
        }else if(p == 'right'){
            hs.showPortraitRight(false);
        }
    }
    showSpeechArea(state){
        this.spAreaObj.forEach(e=>{
            e.setVisible(state);
        });
    }
    showPortraitLeft(state){
        this.pLeftObj.forEach(e=>{
            e.setVisible(state);
        });
    }
    showPortraitRight(state){
        this.pRightObj.forEach(e=>{
            e.setVisible(state);
        });
    }
}