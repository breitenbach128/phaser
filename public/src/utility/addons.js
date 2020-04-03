		
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

class DialogueManager {
	constructor(scene, db, enabled, index, flow, source, target){
		this.scene = scene;	
		this.db = JSON.parse(JSON.stringify(db)); //Parse the dialog data into a new object for a deep copy
		this.enabled = enabled;
		this.index = index; // Starting index of db
        this.flow = flow;//'random', 'ordered', 'reverse' - How the index moves
        this.triggered = false;
        this.ready = false;
        this.delay = this.getTriggerValue();
		this.target = target; // Who is being talked to?
		this.source = source;// Who is talking?
		this.loop = false;
		//Timer which delays the start of the dialog being ready.
		this.readyTimer = this.scene.time.addEvent({ delay: this.delay, callback: this.start, callbackScope: this, loop: false });
		//Attach to the scene update event. I will need to depose of this properly. This will allow it to be independent of the object
		//that called the dialogue. I can pause the gamescene, and then just run the HUD for interaction.
	}
	update(){
        if(this.enabled){
			//When Do I create the dialogue object?
            if(this.checkType('auto') || this.checkType('delay')){
                this.trigger();
            }else if(this.checkType('distance')){
                if(Phaser.Math.Distance.Between(this.source.x,this.source.y,this.target.x,this.target.y) < this.getTriggerValue()){                    
                    this.trigger();
                }
			}
			
			//If the dialogue object has been created, run it, and track it's status;
            if(this.dialogue != undefined){
                if(this.dialogue.isComplete){
                    this.reset();
                }else if(this.dialogue.isRunning){
                    this.dialogue.update();
                }
            }
        }
	}
	getTriggerValue(){	
		//Grab the type value. used for delays, distance, etc	
		let sVal = this.db[this.index].startAction.value ? this.db[this.index].startAction.value : 0;
		return sVal;
	}
	setEnabled(status){
		this.dialogueEnabled = status;
	}
	start(){
		this.ready = true;
	}
	trigger(){
		if(this.triggered == false && this.ready == true){
            this.triggered = true;
            //Start Dialogue
            let dialogueChain = this.db[this.index].data;
			let dialogueTween = this.db[this.index].tween;
			
            for(let i=0;i<dialogueChain.length;i++){
                let e = dialogueChain[i];
                if (e.speaker == 'src') {
                    e.speaker = this.source;
                } else if (e.speaker == 'trg') {
                    e.speaker = this.target;
                };
			}
			let dialogueSpeaker = this.db[this.index].speaker;//Get the speaker object

            this.dialogue = new Dialogue(this.scene,dialogueChain,54,-40);
            this.dialogue.start();
            //Start Tween.
            if(dialogueTween){
                let npcTween = this.scene.tweens.add({
                    targets: dialogueSpeaker,
                    props: dialogueTween,
                    onComplete: this.tweenComplete,
                    onCompleteParams: [this],
                });
                // npcTween.on('complete', function(tween, targets){

                // }, scope);
            }
        }
	}
	tweenComplete(tween, targets, obj){
		//If this tween complete is needed. This can be handled thru other timing events though.
    }	
	increment(value){
		//Allow for decrement OR increment
		this.index+=value;
	}
	reset(){
        //Dialogue Completed, Move to next.
        if(this.index < this.db.length-1){  
            if(this.checkRequirement()){
				//Do a flow control check in the future, and make it adjust the direction
				this.increment(1);
			}
        }else{
            if(this.dialogLoop){
                this.dialogueIndex = 0;     
            }else{
                this.dialogueIndex = 0;
                this.dialogueEnabled = false;
            }
        }
        //Reset Basic values and gather incremented ones
        this.dialogue = undefined;
        this.triggered = false;        
		this.delay = this.getTriggerValue();
		this.ready = false;
		//Restart timer
        this.readyTimer = this.scene.time.addEvent({ delay: this.delay, callback: this.start, callbackScope: this, loop: false });
	}
	checkRequirement(){
		//This needs some work still. I want to add additional requirement types here, such as energy level
		//Shards, items, etc.
		let chk = true;
		let req = this.db[this.index].requirement;
        if(req != 'none'){
			//Setup requirements here.
        }
        return chk;
	}
	checkType(type){
        if(this.db[this.index].startAction.type == type){
            return true;
        }
        return false;
	}
	setTarget(obj){
		this.target = obj;
	}
}

class Statbar{
	constructor(scene,x,y,texture,fgIndex,bgIndex,fillIndex,n,max,showText,textOptions,cropOptions){
		this.scene = scene;
		this.BG = scene.add.image(x, y, texture, bgIndex).setOrigin(0.5);
		this.FG = scene.add.image(x, y, texture, fgIndex).setOrigin(0.5);
		this.FILL = scene.add.image(x, y, texture ,fillIndex).setOrigin(0.5);
		this.values = {n: n, max: max};
		this.text = scene.add.text(x, y, String(n)+"/"+String(max), textOptions).setOrigin(0.5); //Standard Text Styling
		this.cropOptions = cropOptions != undefined ? cropOptions: {dir: 'LR',tintPercent: 0.0, tintColor: 0x000000}; // <Direction>,<TintPercent>,<TintColor>
		//Directions  = <LR>,<RL>,<TB>,<BT>
		this.text.setVisible(showText);

	}
	getValue(){
		return this.values.n;
	};
	alterValue(val){
		let n = this.values.n + val;
        if(n < 0){n=0;};
        if(n > this.values.max){
            n=this.values.max;
        }else{
            this.values.n = n;
			let newValue = Math.round((this.values.n/this.values.max)*this.FILL.width);
			
			//Setup Crop Direction
			let crops = [0,0,newValue,this.FILL.height]; //LR - DEFAULT

			if(this.cropOptions.dir == 'RL'){
				crops = [this.FILL.width-newValue,0,newValue,this.FILL.height];
			}else if(this.cropOptions.dir == 'TB'){
				crops = [0,0,this.FILL.width,newValue];
			}else if(this.cropOptions.dir == 'BT'){
				crops = [0,this.FILL.height-newValue,this.FILL.width,newValue];
			}

            //Alter the bar values
			this.FILL.setCrop(crops[0],crops[1],crops[2],crops[3]);
			
            if(n <= (this.values.max*this.cropOptions.tintPercent)){
                this.FILL.setTint(this.cropOptions.tintColor);
            }else{
                this.FILL.clearTint();
            };
		}
		this.text.setText(String(this.values.n)+"/"+String(this.values.max));
	}
	destroy(){
		//Remove Objects
		this.BG.destroy();
		this.FG.destroy();
		this.FILL.destroy();
	}
}
