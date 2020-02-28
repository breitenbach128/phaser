class GamepadControl {
    constructor(device){
        //Map the Controls to names
        this.ready = false;
        if(device == 0){
            device = this.nulldevice();
            console.log("game Controller class booted - no controller. Loaded with empty values");
            this.loadDefaults();
        }else{
            console.log("game Controller class booted - loading device.");
            //this.ready = true;
            let loadConfigResult = this.loadGamePadConfiguration(device);            
            if(!loadConfigResult){
                device = this.nulldevice();
                this.loadDefaults();
            }

        }

        this.pad = device;
        if(device == 0){
            this.index = -1;
        }else{
            this.index = device.index;
        }
        
        
        //Button State - 0-up, 1-Down, 2-Held
        //pad.axes
        this.sticks = {
            left : {x : this.pad.axes[this.analogs.left.x], y : this.pad.axes[this.analogs.left.y] },
            right: {x : this.pad.axes[this.analogs.right.x], y : this.pad.axes[this.analogs.right.y] }
        }

        this.keys = Object.keys(this.buttons);
       
    }
    nulldevice(){
        let device = {id:1,buttons:[],axes:[]} //Load with empty values if pad is not valid
        for(var i=0;i<99;i++){
            device.buttons[i]=0;
        }
        for(var i=0;i<4;i++){
            device.axes[i]=0;
        }
        return device;
    }
    loadDefaults(){
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
        //Analog sticks.buttons
        this.analogs = {
            left: {x: 0, y: 1},
            right: {x: 2, y: 3}
        }
        //Does the D-pad use analog signals?
        this.usesAnalogDirPad = false;
        //What values does the D-pad require to show a press?
        this.dirPadAnalogs = {
            up: {i:9,v:-1,s:0},
            down: {i:9,v:0.14285719394683838,s:0},
            left: {i:9,v:0.7142857313156128,s:0},
            right: {i:9,v:-0.4285714030265808,s:0},
        }
    }
    loadGamePadConfiguration(device){
        let id = device.id;
        let configs = Object.keys(gamepadConfigs);
        let foundConfig = false;
        for(let c=0;c < configs.length;c++){
            let curr_config = configs[c];
            let id_List = gamepadConfigs[curr_config].ids;
            for(let m=0;m<id_List.length;m++){
                let checkId = id_List[m];
                if(id.match(checkId)){
                    foundConfig = true;
                    break;
                }
            };

            if(foundConfig){
                //Found Config, so load it.
                console.log("Found Matching Config: " + id);

                ///THI IS THE BUGGGGG!!! THis is global, so it is causing the conflict since both reference the "same" buttons.
                this.buttons = JSON.parse(JSON.stringify(gamepadConfigs[curr_config].setupButtons));
                this.analogs = JSON.parse(JSON.stringify(gamepadConfigs[curr_config].setupAxes));

                if(gamepadConfigs[curr_config].setupAnalogDirPad){
                    this.usesAnalogDirPad = true;
                    this.dirPadAnalogs = JSON.parse(JSON.stringify(gamepadConfigs[curr_config].setupDirPad));
                }


                //Set device to ready
                this.ready = true;
                return true;
            }
        };

        if(!foundConfig){
            //no config found! Send back error: Unrecognized Controller
            console.log("Controller not recognized!");
            return false;
        }

    }
    updateButtonState(){
        if(this.index >= 0){
            //Phaser Gamepad Ver
            let pad = this.pad;
            pad = navigator.getGamepads()[this.index];
            if(pad != 0 && pad != null && pad != undefined){
                //Update each botton by name
                for(let k=0;k < this.keys.length;k++){
                    let name = this.keys[k];
                    let state = false;                     
                    state = pad.buttons[this.buttons[name].i].pressed;
                    
                    //If no change, then return current state        
                    if(!state){
                        this.buttons[name].s = this.buttons[name].s > 0 ? -1 : 0;                
                    }else{            
                        this.buttons[name].s++; 
                    } 
                    
                }

                // this.keys.forEach(function(name) {        
                //     let state = false;                     
                //     state = pad.buttons[this.buttons[name].i].pressed;
                    
                //     //If not change, then return current state        
                //     if(!state){
                //         this.buttons[name].s = this.buttons[name].s > 0 ? -1 : 0;                
                //     }else{            
                //         this.buttons[name].s++; 
                //     } 
                // },this)

                //Update Axis 
                this.sticks.left.x = pad.axes[this.analogs.left.x];
                this.sticks.left.y = pad.axes[this.analogs.left.y];
                this.sticks.right.x = pad.axes[this.analogs.right.x];
                this.sticks.right.y = pad.axes[this.analogs.right.y];
                //IF d-pad is analog, check it as well
                if(this.usesAnalogDirPad){
                    let apd_Keys = Object.keys(this.dirPadAnalogs);
                    apd_Keys.forEach(function(k){
                        let chk = (this.dirPadAnalogs[k].i == this.dirPadAnalogs[k].v);
                        if(!chk){
                            this.dirPadAnalogs[k].s = this.dirPadAnalogs[k].s > 0 ? -1 : 0;                        
                        }else{
                            this.dirPadAnalogs[k].s++;
                        }
                    },this);
                }
            }          
        }
    }
    //Need a single state updater to check the state conditions for each button.
    //Then use the check button state to just pull out the number.
    checkButtonState(name){          
        if(this.usesAnalogDirPad){
            if((Object.keys(this.dirPadAnalogs)).includes(name)){
                return this.dirPadAnalogs[name].s
            }
        }
        return this.buttons[name].s;             
    }
    getStickLeft(threshold){
        if(this.ready){
            //return {x:this.pad.axes[0].getValue(),y:this.pad.axes[1].getValue()}; // Phaser 3 Version
            let lX = this.sticks.left.x;
            let lY = this.sticks.left.y;
            let tX = ((lX > 0 && lX > threshold) || (lX < 0 && lX < -threshold))? lX : 0;
            let tY = ((lY> 0 && lY > threshold) || (lY < 0 && lY < -threshold))? lY: 0;
            return {x:tX,y:tY}; // Mozilla API Version
        }else{
            return {x:0,y:0};
        }
    }
    getStickRight(threshold){
        if(this.ready){
            //return {x:this.pad.axes[2].getValue(),y:this.pad.axes[3].getValue()}; // Phaser 3 Version
            let rX = this.sticks.right.x;
            let rY = this.sticks.right.y;
            let tX = ((rX > 0 && rX > threshold) || (rX < 0 && rX < -threshold))? rX : 0;
            let tY = ((rY> 0 && rY > threshold) || (rY < 0 && rY < -threshold))? rY: 0;
            return {x:tX,y:tY}; // Mozilla API Version
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
            F: {b:scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),s:0},
            Z: {b:scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),s:0}

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