		
// add a button to a scene
// similar to buttons in Phaser v2
Phaser.Scene.prototype.addButton = function(x, y, key, callback, callbackContext, overFrame, outFrame, downFrame, upFrame)
{
		// add a button
		var btn = this.add.sprite(x, y, key, outFrame).setInteractive();
		btn.on('pointerover', function (ptr, x, y) { this.setFrame(overFrame) } );
		btn.on('pointerout',  function (ptr)       { this.setFrame(outFrame) } );
		btn.on('pointerdown', function (ptr)       { this.setScale(0.9, 0.9) } );
		btn.on('pointerup', callback.bind(callbackContext));
		
		return btn;
};

//Speech Bubble
class SpeechBubble extends Phaser.GameObjects.Sprite {

    constructor(scene,x,y,brigthness) {
        super(scene, x,y, "speechbubble")
        this.scene = scene;

        this.scene.physics.world.enable(this);
        this.scene.add.existing(this)
        this.brightness = brigthness;
		this.body.setAllowGravity(false);
		
    }

    create(){
        
        this.setActive(true);      
		this.speechtext = scene.add.text(this.getCenter().x, this.getCenter().y-12, '', { fontSize: '10px', fill: '#00FF00' });
    }

    update()
    {    
		this.speechtext.setPosition(this.x, this.y-196);

	}
	newText(text){
		this.speechtext.setText(text);
	}

}

