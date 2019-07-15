		
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

	constructor(scene,x,y,ttl) {
        super(scene, x,y, "speechbubble")
        this.scene = scene;

        this.sprite = scene.matter.add.sprite(this);
        this.sprite.setIgnoreGravity(true);
				this.setActive(true);  
				//Text on the speech bubble    
				var tconfig = {
					x: this.getCenter().x,
					y: this.getCenter().y-12,
					text: '',
					style: {
						fontSize: '12px',
						fontFamily: 'visitorTT1', 
						fontStyle: 'bold',
						color: '#000000',
						align: 'center',
						lineSpacing: 4,
					}
					};
				this.setScale(3);
				this.speechtext = scene.make.text(tconfig);
				this.speechtext.setWordWrapWidth(this.width*3-12, false);

				this.speechtext.setOrigin(0.5);
				this.speechtext.setX(this.width / 2);
				this.speechtext.setY(this.height / 2);
				if(ttl != -1){
					this.scene.time.addEvent({ delay: ttl, callback: this.timeUp, callbackScope: this, loop: false });
				}
		
		}
		
	update()
	{    
		this.speechtext.setPosition(this.getCenter().x, this.getCenter().y-12);
	}
	newText(text){
		this.speechtext.setText(text);
	}
	timeUp(){
		this.speechtext.destroy();
		this.destroy();
	}

}

