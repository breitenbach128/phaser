class HudScene extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'UIScene', active: true });

        this.hp_blips = [];
        this.energy_bar = [];
        this.ready = false;
        this.energy = {n:100,max:100,h:100,w:16};
        this.create();
    }

    create ()
    {
  
    }

    update()
    {

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