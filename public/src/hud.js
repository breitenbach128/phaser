class HudScene extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'UIScene', active: true });

        this.hp_blips = new Array();
    }

    create ()
    {
        //  Grab a reference to the Game Scene
        let ourGame = this.scene.get('gamescene');

        //  Listen for events from it
        ourGame.events.on('playerSetup', function () {
            
            //Draw HUD - Move to HUD Class in the future
            for(var h = 0;h < player.max_hp;h++){
                this.hp_blips.push(this.add.image(12,16+(h*16), 'health_blip'));            
            }

        }, this);

        //  Listen for events from it
        ourGame.events.on('playerHurt', function () {

            this.hp_blips[player.hp-1].setVisible(false);

        }, this);
    }
}