class HudScene extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'UIScene', active: true });

        this.hp_blips = [];
        this.bp_blips = [];
        this.boss_bar = [];
        this.ready = false;
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


            //Controller Update
            updateGamePads();
            keyPad.updateKeyState();
        }

        //This did not fix the bug. GAMEPAD DID NOT HAVE THE BUG
        //ONLY KEYBOARD/MS (KEYPAD)

        // if(this.scene.isPaused('gamescene')){
        //     console.log("Running HUD controller update");
        //     //Controller Update
        //     updateGamePads();
        //     keyPad.updateKeyState();
        // }

    }
    clearHud()
    {
        for(var h = 0;h < this.hp_blips.length;h++){
            this.hp_blips[h].destroy();
        }  
        this.hp_blips = [];

        this.brightStatBar.destroy();
        this.solanaStatBar.destroy();

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
        //Handle inputs in HUD to avoid issue with pauses
        pointer = this.input.activePointer;
        keyPad = new KeyboardMouseControl(this,pointer)

        this.skipSpeech = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        this.ready = true;

        //Add Boss Health Bar
        this.boss_bar.push(this.add.image(this.cameras.main.width/2, 48, 'hud_boss_health_bar',2).setScale(6,3));//BG
        this.boss_bar.push(this.add.image(this.cameras.main.width/2, 48, 'hud_boss_health_bar',1).setScale(6,3));//Health
        this.boss_bar.push(this.add.image(this.cameras.main.width/2, 48, 'hud_boss_health_bar',0).setScale(6,3));//FG
        //Inital set to not visible
        this.setBossVisible(false);

        //Statbar Solana
        this.solanaStatBar = new Statbar(this,this.cameras.main.width/4, 36, 'hud_energybar3',0,1,2,300,300,false,
        { fontSize: '22px', fill: '#FFFFFF', stroke: '#000000', strokeThickness: 4 },
        {dir: 'LR',tintPercent: 0.20, tintColor: 0xFFB6B6})
        this.solanaStatBarHead = this.add.image(this.cameras.main.width/4-96, 36, 'hud_energybar3_solana_head',0).setScale(2).setOrigin(0.5);

        this.brightStatBar = new Statbar(this,this.cameras.main.width*(3/4), 36, 'hud_energybar3',0,1,2,300,300,false,
        { fontSize: '22px', fill: '#FFFFFF', stroke: '#000000', strokeThickness: 4 },
        {dir: 'RL',tintPercent: 0.20, tintColor: 0xFFB6B6})
        this.brightStatBarHead = this.add.image(this.cameras.main.width*(3/4)+96, 36, 'hud_energybar3_bright_head',0).setScale(2).setOrigin(0.5);

        for(var h = 0;h < player.hp;h++){
            this.hp_blips.push(this.add.sprite(this.cameras.main.width/4-52+(h*24),10, 'health_blip',0));  
            this.bp_blips.push(this.add.sprite(this.cameras.main.width*(3/4)+52-(h*24),10, 'health_blip',1));  
        }

        //Add Shard Counts
        this.shards_light = this.add.image(this.cameras.main.width-32, 12, 'shard_light',0);
        this.shards_dark = this.add.image(this.cameras.main.width-32, 32, 'shard_dark',0);        
        this.shard_data_l = this.add.text(this.cameras.main.width-60, 12, '0 x', { fontFamily: 'visitorTT1', fontSize: '16px', fill: '#FFFFFF', stroke: '#000000', strokeThickness: 1 }).setOrigin(.5);
        this.shard_data_d = this.add.text(this.cameras.main.width-60, 32, '0 x', { fontFamily: 'visitorTT1', fontSize: '16px', fill: '#FFFFFF', stroke: '#000000', strokeThickness: 1 }).setOrigin(.5);

        //DEBUG
        this.debug = this.add.text(8, this.cameras.main.height-128, 'DEBUG-HUD', { fontSize: '22px', fill: '#FFFFFF', stroke: '#000000', strokeThickness: 4 });
  
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
        
        // Setup Speaker Class
        this.storySpeech = new HudSpeech(this);

    }
    alterEnergySolana(energyChange){
        this.solanaStatBar.alterValue(energyChange);

    }
    alterEnergyBright(energyChange){
        this.brightStatBar.alterValue(energyChange);
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
                target.x = Math.cos(rad)*mapTileSize.tw + solpos.x;
                target.y = Math.sin(rad)*mapTileSize.tw + solpos.y;
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