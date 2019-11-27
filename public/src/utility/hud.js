class HudScene extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'UIScene', active: true });

        this.hp_blips = [];
        this.energy_bar = [];
        this.boss_bar = [];
        this.ready = false;
        this.energy = {n:100,max:100,h:100,w:16};
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
        this.ready = true;
        for(var h = 0;h < player.hp;h++){
            this.hp_blips.push(this.add.image(36,16+(h*16), 'health_blip'));    
        }
        //Add energy bar
        this.energy_bar.push(this.add.image(12, 48, 'hud_energybar1',1));//BG
        this.energy_bar.push(this.add.image(12, 48, 'hud_energybar1',2));//ENERGY
        this.energy_bar.push(this.add.image(12, 48, 'hud_energybar1',0));//FG
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
        this.debug = this.add.text(48, 16, 'DEBUG-HUD', { fontSize: '22px', fill: '#FFFFFF', stroke: '#000000', strokeThickness: 4 });
        //HUD Energy Bar Flash/Scale Effect: When energy is added, alter the look for a few MS to show energy has been gained.
        this.energy_bar_effect = this.time.addEvent({ delay: 200, callback: this.resetEnergyScale, callbackScope: this, loop: false });
        this.inventory = new Inventory(this);
        //Check Global equipment
        for(let e=0;e<solanaEquipment.length;e++){
            if(solanaEquipment[e].equiped){
                this.inventory.equipItem(e);
            }
        }
    }
    alterEnergy(energyChange){
        let n = this.energy.n + energyChange;
        if(n < 0){n=0;};
        if(n > this.energy.max){n=this.energy.max;};

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