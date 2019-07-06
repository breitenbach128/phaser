//A general purpose TMX trigger file

// This will allow for a broad range of items that can be defined by properties in TMX.
// TMXButton,TMXLever,TMXZone, TMXPressure, TMXDestructable
// TMX Button: An interactive button that can be pushed to trigger. Solana can press up to push it.
// TMX Lever: Solana can use up and down to switch back and forth.
// TMX Zone: An effect(s) happens when the player enters the zone.  Can apply physics, hurt player, cause particles and sprites, etc.
// TMX Pressure: Buttons that are only affected by pushing on them. Dark can drop from above to trigger pressure plats.
// TMX Destructable: Can be destroyed to reveal new areas or secrets.

var TMXLever = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function TMXLever (scene)
    {
        Phaser.GameObjects.Sprite.call(this, scene, -100, -100, 'lever');      
 
        scene.physics.add.existing(this);
  
        
        this.debug = scene.add.text(this.x, this.y-16, 'Lever', { fontSize: '10px', fill: '#00FF00' });
    },
    setup: function(x,y){
        this.setActive(true);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);  
        this.setPosition(x,y);
        this.leverPosition = 0;
 
    },
    update: function (time, delta)
    {       

        this.debug.setPosition(this.x, this.y-16);
        this.debug.setText("Lever Position:"+String(this.leverPosition));
    },
    useLever: function(){
        if(this.anims.isPlaying == false){
            if(this.leverPosition == 0){
                this.leverPosition = 1;
                this.anims.play('lever-operate-1', true); 
            }else{
                this.leverPosition = 0;
                this.anims.play('lever-operate-0', true); 
            }
        }

    },
});