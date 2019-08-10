class GamepadControl {
    constructor(device){
        //Map the Controls to names
        this.ready = false;
        if(device == 0){
            device = {id:1,buttons:[],axes:[]} //Load with empty values if pad is not valid
            for(var i=0;i<99;i++){
                device.buttons[i]=0;
            }
            for(var i=0;i<4;i++){
                device.axes[i]=0;
            }
            console.log("game Controller class booted - no controller. Loaded with empty values");
        }else{
            console.log("game Controller class booted");
            this.ready = true;
        }

        this.pad = device;
        
        //pad.buttons
        this.buttons = {
            up: {i:12,s:0},
            down: {i:13,s:0},
            left: {i:14,s:0},
            right: {i:15,s:0},
            A: {i:0,s:0}, //A
            B: {i:1,s:0}, //B
            X: {i:2,s:0}, //X
            Y: {i:3,s:0}, //Y
            leftShoulder: {i:4,s:0}, //Left Shoulder
            rightShoulder: {i:5,s:0}, // Right Shoulder
            leftTrigger: {i:6,s:0}, //Left Trigger
            rightTrigger: {i:7,s:0}, // Right Trigger
            select : {i:8,s:0},
            start: {i:9,s:0},
            leftPush: {i:10,s:0},
            rightPush: {i:11,s:0}

        }
        //Button State - 0-up, 1-Down, 2-Held
        //pad.axes
        this.sticks = {
            left : { x : this.pad.axes[0], y : this.pad.axes[1] },
            right: { x : this.pad.axes[2], y : this.pad.axes[3] }
        }
        this.keys = Object.keys(this.buttons);
       
    }
    updateButtonState(){
        //Reduce the object keys function call but setting the keynames one time, instead of each loop
        this.keys.forEach(function(name) {        
        
            let b  = this.pad.buttons[this.buttons[name].i];
            let state = b.pressed;
            //If not change, then return current state        
            if(!state){
                this.buttons[name].s = this.buttons[name].s > 0 ? -1 : 0;                
            }else{            
                this.buttons[name].s++; 
            } 
        },this)
          
    }
    //Need a single state updater to check the state conditions for each button.
    //Then use the check button state to just pull out the number.
    checkButtonState(name){  
        return this.buttons[name].s;              
    }
    getStickLeft(){
        if(this.ready){
            return {x:this.pad.axes[0].getValue(),y:this.pad.axes[1].getValue()};
        }else{
            return {x:0,y:0};
        }
    }
    getStickRight(){
        if(this.ready){
            return {x:this.pad.axes[2].getValue(),y:this.pad.axes[3].getValue()};
        }else{
            return {x:0,y:0};
        }
    }
}

class KeyboardMouseControl {
    constructor(scene,pointer){
        //Map Point and Controls
        this.buttons = {
            W: {b:scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),s:0},
            S: {b:scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),s:0},
            A: {b:scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),s:0},
            D: {b:scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),s:0},
            P: {b:scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),s:0},
            R: {b:scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),s:0},
            X: {b:scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),s:0},
            Q: {b:scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),s:0},   
            B: {b:scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B),s:0},  
            SPC: {b:scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),s:0},              
            O: {b:scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),s:0},
            F: {b:scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),s:0}
        }
        this.msbuttons= {
            MB0: {b:0,s:0},
            MB1: {b:1,s:0},
            MB2: {b:2,s:0}
        }
        this.pointer = pointer;
        //Create lists
        this.keys = Object.keys(this.buttons);
        this.mousekeys = Object.keys(this.msbuttons);
    }
    updateKeyState(){
        //Get the statuses
        this.keys.forEach(function(name) {        
        
            let b  = this.buttons[name].b;
            let state = b.isDown;
            //If not change, then return current state        
            if(!state){
                this.buttons[name].s = this.buttons[name].s > 0 ? -1 : 0;                
            }else{            
                this.buttons[name].s++; 
            } 
        },this)

        if(!this.pointer.isDown){            
            this.msbuttons.MB0.s = this.msbuttons.MB0.s > 0 ? -1 : 0;
            this.msbuttons.MB1.s = this.msbuttons.MB1.s > 0 ? -1 : 0;
            this.msbuttons.MB2.s = this.msbuttons.MB2.s > 0 ? -1 : 0;
        }else{
            if(this.pointer.button == 0){
                this.msbuttons.MB0.s++;
            };
            if(this.pointer.button == 1){
                this.msbuttons.MB1.s++;
            };
            if(this.pointer.button == 2){
                this.msbuttons.MB2.s++;
            };
        }

    }
    checkKeyState(name){
        if(this.buttons[name]){
            return this.buttons[name].s; 
        }else{
           return 0; 
        }
    }
    checkMouseState(name){
        if(this.msbuttons[name]){
            return this.msbuttons[name].s; 
        }else{
            return 0; 
        }
    }
}