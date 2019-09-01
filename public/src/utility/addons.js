		
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

	constructor(scene,x,y) {
        super(scene, x,y, "speechbubble",0)
        this.scene = scene;
		scene.add.existing(this); 
		
		this.setActive(true);  
		//Text on the speech bubble    
		var tconfig = {
			x: this.getCenter().x,
			y: this.getCenter().y-12,
			text: '',
			style: {
				fontSize: '16px',
				fontFamily: 'visitorTT1', 
				fontStyle: 'bold',
				color: '#000000',
				align: 'center',
				lineSpacing: 4,
				resolution:2,
			}
			};
		this.setScale(2);
		this.speechtext = scene.make.text(tconfig);
		this.speechtext.setScale(.5);
		this.speechtext.setWordWrapWidth(this.width*4-8, false);

		this.speechtext.setOrigin(0.5);
		this.speechtext.setX(this.width / 2);
		this.speechtext.setY(this.height / 2);
		
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
class Dialogue {
	constructor(scene,chain,oX,oY) {
		//Chain {speaker, text, ttl}
		this.chain = chain;
		this.scene = scene;
		this.curr = 0;
		this.isRunning = false;
		this.isComplete = false;
		this.bubbles = [];
		this.timer;
		this.offset = {x:oX, y:oY};
	}
	start(){
		this.isRunning = true;
		
		let speaker = this.chain[this.curr].speaker;
		let text = this.chain[this.curr].text;
		let ttl = this.chain[this.curr].ttl;
		if(speaker != undefined && text && ttl){
			let offX = this.offset.x;
			if(speaker.flipX){
				offX = -this.offset.x;
			}
			this.bubbles.push(new SpeechBubble(this.scene,speaker.x+offX,speaker.y+this.offset.y,ttl));
			this.bubbles[this.bubbles.length-1].newText(text);
			//Set Progress Time
			this.timer = this.scene.time.addEvent({ delay: ttl, callback: this.nextSpeech, callbackScope: this, loop: false });
		}else{
			//ERROR
			console.log("Error: Missing Speaker Data for Dialogue");
		}			
	
	}
	update(){
		
		let i = this.curr;
		let speaker = this.chain[i].speaker;
		let worldScale=camera_main.zoom;
		if(speaker != undefined && this.bubbles != undefined){
			
			this.bubbles[i].flipX = speaker.flipX;
			let offX = this.offset.x;
			if(speaker.flipX){
				offX = -this.offset.x;
			}
			//Adjust for real HUD position offset from camera movement and scale
			// this.bubbles[i].x = (speaker.x+offX-camera_main.worldView.x)*worldScale;
			// this.bubbles[i].y = (speaker.y+this.offset.y-camera_main.worldView.y)*worldScale;
			this.bubbles[i].x = (speaker.x+offX);
			this.bubbles[i].y = (speaker.y+this.offset.y);
			this.bubbles[i].update();
		}
		
	}
	nextSpeech(){		
		if(this.curr < this.chain.length-1){
			//Move Current offscreen //IDEA (setup to ONLY do this if the speaker is the same)
			this.bubbles[this.curr].x = -1000;
			this.bubbles[this.curr].y = -1000;			
			this.bubbles[this.curr].update();
			//Increase index to next
			this.curr++;
			//Start the next dialogue
			this.start();
		}else{
			//Speech Over
			this.destroyDialogue();
		}

	}
	destroyDialogue(){
		this.timer.remove();
		this.isRunning = false;
		this.isComplete = true;
		this.bubbles.forEach(function(e){
			e.timeUp();
		});
	}
}

